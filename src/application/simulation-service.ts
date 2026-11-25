import crypto from "node:crypto";
import {
  computeCompositeIrtScore,
  computeTriageEfficiency,
  updateIrtSubtestScore,
} from "@/domain/irt-calibrator";
import {
  getSimulationBlueprint,
  isBlockSubmissionAllowed,
  type SimulationIntensity,
} from "@/domain/simulation-rules";
import type {
  QuestionAttemptEntity,
  QuestionEntity,
  SimulationMode,
  SimulationSessionEntity,
  SimulationSubtestBlockEntity,
  SnbtSubtest,
  TriageAction,
} from "@/domain/types";
import type { AppRepository } from "@/infrastructure/db/repository-port";
import { StudyService } from "./study-service";

export type PublicSimQuestion = Omit<
  QuestionEntity,
  "correctAnswerKey" | "officialSolutionMarkdown" | "solutionSteps"
>;

export type ReviewItemStatus = "correct" | "wrong" | "skipped" | "unanswered";

export interface SimulationReviewItem {
  questionNumber: number;
  blockId: string;
  subtest: SnbtSubtest;
  skillNodeId: string;
  skillNodeTitle: string;
  questionId: string;
  tier: QuestionEntity["tier"];
  stemMarkdown: string;
  passageText: string | null;
  options: QuestionEntity["options"];
  correctAnswerKey: "A" | "B" | "C" | "D" | "E";
  officialSolutionMarkdown: string;
  solutionSteps: QuestionEntity["solutionSteps"];
  expectedSolveSeconds: number;
  selectedAnswerKey: "A" | "B" | "C" | "D" | "E" | null;
  status: ReviewItemStatus;
  timeToSolveMs: number | null;
  triageAction: TriageAction | null;
  rootCause: QuestionAttemptEntity["rootCause"];
}

export interface SimulationWeakNodeSummary {
  skillNodeId: string;
  subtest: SnbtSubtest;
  skillNodeTitle: string;
  totalCount: number;
  missedCount: number;
  accuracyPct: number;
}

export interface SimulationReviewPayload {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  unansweredCount: number;
  items: SimulationReviewItem[];
  weakestNodes: SimulationWeakNodeSummary[];
}

export type ActiveBlockAnswerMap = Record<
  string,
  { status: "answered" | "skipped"; key: "A" | "B" | "C" | "D" | "E" | null }
>;

export class SimulationService {
  constructor(private readonly repo: AppRepository) {}

  private shuffleQuestions(items: QuestionEntity[]): QuestionEntity[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  private async resolveAttemptsForSession(
    userId: string,
    session: SimulationSessionEntity,
    blocks: SimulationSubtestBlockEntity[],
  ): Promise<Map<string, Map<string, QuestionAttemptEntity>>> {
    const totalQ = blocks.reduce((sum, b) => sum + b.questionCount, 0);
    const attempts = await this.repo.listUserAttempts(userId, {
      limit: Math.max(400, totalQ * 4),
    });

    const byBlock = new Map<string, Map<string, QuestionAttemptEntity>>();
    for (const block of blocks) {
      byBlock.set(block.id, new Map());
    }

    // Attempts come sorted newest-first, so keeping the first encounter per question avoids double-counting revisions.
    for (const a of attempts) {
      if (a.simulationSessionId === session.id && a.simulationBlockId) {
        const blockMap = byBlock.get(a.simulationBlockId);
        if (blockMap && !blockMap.has(a.questionId)) {
          blockMap.set(a.questionId, a);
        }
      }
    }

    // Backwards-compatible timestamp window fallback for legacy tryouts recorded before session IDs were linked.
    const sessionEndMs = session.completedAt
      ? new Date(session.completedAt).getTime() + 15_000
      : Date.now() + 15_000;
    for (const block of blocks) {
      const blockMap = byBlock.get(block.id)!;
      if (blockMap.size > 0 || !block.startedAt) continue;

      const qSet = new Set(block.questionIds);
      const startMs = new Date(block.startedAt).getTime() - 2_000;
      const endMs = block.lockedAt
        ? new Date(block.lockedAt).getTime() + 10_000
        : sessionEndMs;

      for (const a of attempts) {
        if (a.simulationSessionId !== null) continue;
        if (!qSet.has(a.questionId)) continue;
        if (a.attemptMode !== "simulation" && a.attemptMode !== "diagnostic") continue;
        const createdMs = new Date(a.createdAt).getTime();
        if (createdMs >= startMs && createdMs <= endMs && !blockMap.has(a.questionId)) {
          blockMap.set(a.questionId, a);
        }
      }
    }

    return byBlock;
  }

  private summarizeBlockCounts(
    blockAttempts: Map<string, QuestionAttemptEntity>,
  ): { correctCount: number; skippedSmartCount: number } {
    let correctCount = 0;
    let skippedSmartCount = 0;
    for (const a of blockAttempts.values()) {
      if (a.isCorrect) correctCount += 1;
      if (a.triageAction === "skipped_smart") skippedSmartCount += 1;
    }
    return { correctCount, skippedSmartCount };
  }

  private async buildReviewPayload(
    userId: string,
    session: SimulationSessionEntity,
    blocks: SimulationSubtestBlockEntity[],
  ): Promise<SimulationReviewPayload> {
    const [allQuestions, nodes, attemptsByBlock] = await Promise.all([
      this.repo.listQuestions({ userId }),
      this.repo.listSkillNodes(),
      this.resolveAttemptsForSession(userId, session, blocks),
    ]);

    const qMap = new Map(allQuestions.map((q) => [q.id, q]));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const items: SimulationReviewItem[] = [];
    const weakAgg = new Map<
      string,
      { skillNodeId: string; subtest: SnbtSubtest; skillNodeTitle: string; totalCount: number; missedCount: number }
    >();

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let unansweredCount = 0;
    let questionNumber = 0;

    const orderedBlocks = [...blocks].sort((a, b) => a.blockOrder - b.blockOrder);
    for (const block of orderedBlocks) {
      const blockAttempts = attemptsByBlock.get(block.id);
      for (const qId of block.questionIds) {
        const q = qMap.get(qId);
        if (!q) continue;
        questionNumber += 1;
        const node = nodeMap.get(q.skillNodeId);
        const nodeTitle = node?.titleId ?? q.subtest;
        const attempt = blockAttempts?.get(qId) ?? null;

        let status: ReviewItemStatus;
        if (!attempt) {
          status = "unanswered";
          unansweredCount += 1;
        } else if (attempt.isCorrect) {
          status = "correct";
          correctCount += 1;
        } else if (attempt.triageAction === "skipped_smart" || attempt.selectedAnswerKey === null) {
          status = "skipped";
          skippedCount += 1;
        } else {
          status = "wrong";
          wrongCount += 1;
        }

        const bucket = weakAgg.get(q.skillNodeId) ?? {
          skillNodeId: q.skillNodeId,
          subtest: q.subtest,
          skillNodeTitle: nodeTitle,
          totalCount: 0,
          missedCount: 0,
        };
        bucket.totalCount += 1;
        if (status !== "correct") {
          bucket.missedCount += 1;
        }
        weakAgg.set(q.skillNodeId, bucket);

        items.push({
          questionNumber,
          blockId: block.id,
          subtest: q.subtest,
          skillNodeId: q.skillNodeId,
          skillNodeTitle: nodeTitle,
          questionId: q.id,
          tier: q.tier,
          stemMarkdown: q.stemMarkdown,
          passageText: q.passageText,
          options: q.options,
          correctAnswerKey: q.correctAnswerKey,
          officialSolutionMarkdown: q.officialSolutionMarkdown,
          solutionSteps: q.solutionSteps,
          expectedSolveSeconds: q.expectedSolveSeconds,
          selectedAnswerKey: attempt?.selectedAnswerKey ?? null,
          status,
          timeToSolveMs: attempt?.timeToSolveMs ?? null,
          triageAction: attempt?.triageAction ?? null,
          rootCause: attempt?.rootCause ?? null,
        });
      }
    }

    const weakestNodes: SimulationWeakNodeSummary[] = Array.from(weakAgg.values())
      .filter((w) => w.missedCount > 0)
      .map((w) => ({
        ...w,
        accuracyPct:
          w.totalCount > 0 ? Math.round(((w.totalCount - w.missedCount) / w.totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.missedCount - a.missedCount || a.accuracyPct - b.accuracyPct)
      .slice(0, 3);

    return {
      totalQuestions: items.length,
      correctCount,
      wrongCount,
      skippedCount,
      unansweredCount,
      items,
      weakestNodes,
    };
  }

  async startSimulation(
    userId: string,
    mode: SimulationMode,
    focusSubtest?: SnbtSubtest | null,
    intensity: SimulationIntensity = "standard",
  ): Promise<{
    session: SimulationSessionEntity;
    blocks: SimulationSubtestBlockEntity[];
    questionsById: Record<string, PublicSimQuestion>;
    review: null;
    activeBlockAnswers: ActiveBlockAnswerMap;
  }> {
    const blueprint = getSimulationBlueprint(mode, focusSubtest, intensity);
    const [allApproved, recentAttempts] = await Promise.all([
      this.repo.listQuestions({ userId, qcStatus: "approved" }),
      this.repo.listUserAttempts(userId, { limit: 300 }),
    ]);

    const seenCount = new Map<string, number>();
    for (const a of recentAttempts) {
      seenCount.set(a.questionId, (seenCount.get(a.questionId) ?? 0) + 1);
    }

    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    const blocks: SimulationSubtestBlockEntity[] = [];
    const questionsById: Record<string, PublicSimQuestion> = {};

    blueprint.forEach((bp, idx) => {
      const subPool = allApproved.filter((q) => q.subtest === bp.subtest);
      const unseen = this.shuffleQuestions(subPool.filter((q) => (seenCount.get(q.id) ?? 0) === 0));
      const seen = this.shuffleQuestions(
        subPool
          .filter((q) => (seenCount.get(q.id) ?? 0) > 0)
          .sort((a, b) => (seenCount.get(a.id) ?? 0) - (seenCount.get(b.id) ?? 0)),
      );
      const chosen = [...unseen, ...seen].slice(0, bp.questionCount);
      if (chosen.length === 0 && allApproved.length > 0) {
        chosen.push(allApproved[0]);
      }

      for (const q of chosen) {
        const {
          correctAnswerKey: _k,
          officialSolutionMarkdown: _s,
          solutionSteps: _st,
          ...publicQ
        } = q;
        questionsById[q.id] = publicQ;
      }

      const isFirst = idx === 0;
      const allocatedSeconds =
        chosen.length < bp.questionCount && bp.questionCount > 0
          ? Math.max(60, Math.round((bp.allocatedSeconds * chosen.length) / bp.questionCount))
          : bp.allocatedSeconds;
      blocks.push({
        id: crypto.randomUUID(),
        simulationSessionId: sessionId,
        subtest: bp.subtest,
        blockOrder: idx + 1,
        questionCount: chosen.length,
        allocatedSeconds,
        questionIds: chosen.map((q) => q.id),
        startedAt: isFirst ? nowIso : null,
        lockedAt: null,
        endsAt: isFirst ? new Date(now + allocatedSeconds * 1000).toISOString() : null,
        isLocked: false,
        subtestIrtScore: null,
        correctCount: 0,
        skippedSmartCount: 0,
      });
    });

    const session: SimulationSessionEntity = {
      id: sessionId,
      userId,
      sessionMode: mode,
      status: "in_progress",
      startedAt: nowIso,
      completedAt: null,
      totalDurationSeconds: 0,
      estimatedIrtScore: null,
      accuracyRate: null,
      triageEfficiencyScore: null,
    };

    await this.repo.createSimulationWithBlocks(session, blocks);
    return {
      session,
      blocks,
      questionsById,
      review: null,
      activeBlockAnswers: {},
    };
  }

  async getSimulationState(
    userId: string,
    sessionId: string,
  ): Promise<{
    session: SimulationSessionEntity;
    blocks: SimulationSubtestBlockEntity[];
    questionsById: Record<string, PublicSimQuestion>;
    review: SimulationReviewPayload | null;
    activeBlockAnswers: ActiveBlockAnswerMap;
  }> {
    const found = await this.repo.getSimulationById(userId, sessionId);
    if (!found) throw new Error("Simulation session not found.");

    const allQuestions = await this.repo.listQuestions({ userId });
    const qMap = new Map(allQuestions.map((q) => [q.id, q]));
    const questionsById: Record<string, PublicSimQuestion> = {};

    for (const block of found.blocks) {
      for (const qId of block.questionIds) {
        const q = qMap.get(qId);
        if (q) {
          const {
            correctAnswerKey: _k,
            officialSolutionMarkdown: _s,
            solutionSteps: _st,
            ...publicQ
          } = q;
          questionsById[q.id] = publicQ;
        }
      }
    }

    if (found.session.status === "completed") {
      const review = await this.buildReviewPayload(userId, found.session, found.blocks);
      return {
        session: found.session,
        blocks: found.blocks,
        questionsById,
        review,
        activeBlockAnswers: {},
      };
    }

    const activeBlock = found.blocks.find((b) => !b.isLocked && b.startedAt !== null) ?? null;
    const activeBlockAnswers: ActiveBlockAnswerMap = {};
    if (activeBlock) {
      const attemptsByBlock = await this.resolveAttemptsForSession(userId, found.session, [
        activeBlock,
      ]);
      const blockAttempts = attemptsByBlock.get(activeBlock.id);
      if (blockAttempts) {
        for (const [qId, a] of blockAttempts.entries()) {
          activeBlockAnswers[qId] = {
            status: a.triageAction === "skipped_smart" ? "skipped" : "answered",
            key: a.triageAction === "skipped_smart" ? null : a.selectedAnswerKey,
          };
        }
      }
    }

    return {
      session: found.session,
      blocks: found.blocks,
      questionsById,
      review: null,
      activeBlockAnswers,
    };
  }

  async submitBlockAnswer(params: {
    userId: string;
    sessionId: string;
    blockId: string;
    questionId: string;
    selectedAnswerKey: "A" | "B" | "C" | "D" | "E" | null;
    timeToSolveMs: number;
    triageDecisionMs: number | null;
    triageAction: TriageAction;
  }): Promise<{ accepted: boolean; isCorrect: boolean; block: SimulationSubtestBlockEntity }> {
    const found = await this.repo.getSimulationById(params.userId, params.sessionId);
    if (!found) throw new Error("Simulation session not found.");

    const block = found.blocks.find((b) => b.id === params.blockId);
    if (!block) throw new Error("Simulation block not found.");

    const guard = isBlockSubmissionAllowed(block, Date.now());
    if (!guard.allowed) {
      throw new Error(guard.reason ?? "Subtes terkunci.");
    }

    const study = new StudyService(this.repo);
    const result = await study.submitAttempt({
      userId: params.userId,
      questionId: params.questionId,
      attemptMode:
        found.session.sessionMode === "diagnostic_placement" ? "diagnostic" : "simulation",
      simulationSessionId: params.sessionId,
      simulationBlockId: params.blockId,
      selectedAnswerKey: params.selectedAnswerKey,
      timeToSolveMs: params.timeToSolveMs,
      triageDecisionMs: params.triageDecisionMs,
      triageAction: params.triageAction,
    });

    const blockRawAttempts = await this.repo.listUserAttempts(params.userId, {
      simulationBlockId: block.id,
      limit: Math.max(60, block.questionCount * 3),
    });
    const dedupMap = new Map<string, QuestionAttemptEntity>();
    for (const a of blockRawAttempts) {
      if (!dedupMap.has(a.questionId)) dedupMap.set(a.questionId, a);
    }
    if (dedupMap.size > 0) {
      const counts = this.summarizeBlockCounts(dedupMap);
      block.correctCount = counts.correctCount;
      block.skippedSmartCount = counts.skippedSmartCount;
    } else {
      if (result.isCorrect) block.correctCount += 1;
      if (params.triageAction === "skipped_smart") block.skippedSmartCount += 1;
    }
    await this.repo.updateSimulationBlock(block);

    return { accepted: true, isCorrect: result.isCorrect, block };
  }

  async lockBlockAndAdvance(params: {
    userId: string;
    sessionId: string;
    blockId: string;
  }): Promise<{
    session: SimulationSessionEntity;
    blocks: SimulationSubtestBlockEntity[];
    review: SimulationReviewPayload | null;
  }> {
    const found = await this.repo.getSimulationById(params.userId, params.sessionId);
    if (!found) throw new Error("Simulation session not found.");

    const blockIndex = found.blocks.findIndex((b) => b.id === params.blockId);
    if (blockIndex < 0) throw new Error("Simulation block not found.");

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const block = found.blocks[blockIndex];

    if (!block.isLocked) {
      block.isLocked = true;
      block.lockedAt = nowIso;

      const [momentum, attemptsByBlock] = await Promise.all([
        this.repo.getOrInitMomentum(params.userId),
        this.resolveAttemptsForSession(params.userId, found.session, [block]),
      ]);
      const blockAttempts = attemptsByBlock.get(block.id) ?? new Map();
      if (blockAttempts.size > 0) {
        const counts = this.summarizeBlockCounts(blockAttempts);
        block.correctCount = counts.correctCount;
        block.skippedSmartCount = counts.skippedSmartCount;
      }

      // Preserve exact per-question 3PL IRT already calibrated in submitAttempt, and apply bounded miss updates for blank/unanswered items.
      let calibratedSubtestScore = momentum.subtestIrtScores[block.subtest];
      const unansweredCount = Math.max(0, block.questionCount - blockAttempts.size);
      const blankPenaltySteps = Math.min(unansweredCount, 8);
      for (let i = 0; i < blankPenaltySteps; i += 1) {
        calibratedSubtestScore = updateIrtSubtestScore({
          currentSubtestScore: calibratedSubtestScore,
          irtDifficultyB: 0,
          irtDiscriminationA: 1.0,
          irtGuessingC: 0.2,
          isCorrect: false,
          timeToSolveMs: block.allocatedSeconds * 1000,
          expectedSolveSeconds: Math.round(
            block.allocatedSeconds / Math.max(1, block.questionCount),
          ),
          hintsUsedCount: 0,
        });
      }

      if (blankPenaltySteps > 0) {
        const nextSubScores = {
          ...momentum.subtestIrtScores,
          [block.subtest]: calibratedSubtestScore,
        };
        await this.repo.saveMomentum({
          ...momentum,
          subtestIrtScores: nextSubScores,
          estimatedIrtComposite: computeCompositeIrtScore(nextSubScores),
          updatedAt: nowIso,
        });
      }

      block.subtestIrtScore = Number(calibratedSubtestScore.toFixed(2));
      await this.repo.updateSimulationBlock(block);
    }

    const nextBlock = found.blocks[blockIndex + 1];
    if (nextBlock && !nextBlock.startedAt) {
      nextBlock.startedAt = nowIso;
      nextBlock.endsAt = new Date(now + nextBlock.allocatedSeconds * 1000).toISOString();
      await this.repo.updateSimulationBlock(nextBlock);
    }

    let review: SimulationReviewPayload | null = null;
    const allLocked = found.blocks.every((b) => b.isLocked);
    if (allLocked) {
      const [momentum, attemptsByAllBlocks] = await Promise.all([
        this.repo.getOrInitMomentum(params.userId),
        this.resolveAttemptsForSession(params.userId, found.session, found.blocks),
      ]);

      const totalQ = found.blocks.reduce((sum, b) => sum + b.questionCount, 0);
      const totalCorrect = found.blocks.reduce((sum, b) => sum + b.correctCount, 0);
      const accuracyRate = totalQ > 0 ? Number((totalCorrect / totalQ).toFixed(3)) : 0;

      const subScores: Record<SnbtSubtest, number> = { ...momentum.subtestIrtScores };
      for (const b of found.blocks) {
        if (b.subtestIrtScore !== null) {
          subScores[b.subtest] = b.subtestIrtScore;
        }
      }
      const composite = computeCompositeIrtScore(subScores);

      const sessionAttempts: QuestionAttemptEntity[] = [];
      for (const bMap of attemptsByAllBlocks.values()) {
        for (const a of bMap.values()) {
          sessionAttempts.push(a);
        }
      }
      const triageEff = computeTriageEfficiency(sessionAttempts);

      found.session.status = "completed";
      found.session.completedAt = nowIso;
      found.session.totalDurationSeconds = Math.max(
        1,
        Math.round((now - new Date(found.session.startedAt).getTime()) / 1000),
      );
      found.session.accuracyRate = accuracyRate;
      found.session.triageEfficiencyScore = triageEff;
      found.session.estimatedIrtScore = composite;
      await this.repo.updateSimulationSession(found.session);

      if (found.session.sessionMode === "diagnostic_placement") {
        await this.repo.updateUserProfile(params.userId, { diagnosticCompleted: true });
      }

      review = await this.buildReviewPayload(params.userId, found.session, found.blocks);
    }

    return { session: found.session, blocks: found.blocks, review };
  }
}
