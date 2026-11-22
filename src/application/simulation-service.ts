import crypto from "node:crypto";
import { computeCompositeIrtScore, computeTriageEfficiency, updateIrtSubtestScore } from "@/domain/irt-calibrator";
import { isBlockSubmissionAllowed, SIMULATION_PRESETS } from "@/domain/simulation-rules";
import type {
  QuestionEntity,
  SimulationMode,
  SimulationSessionEntity,
  SimulationSubtestBlockEntity,
  SnbtSubtest,
  TriageAction,
} from "@/domain/types";
import type { AppRepository } from "@/infrastructure/db/repository-port";
import { StudyService } from "./study-service";

export class SimulationService {
  constructor(private readonly repo: AppRepository) {}

  async startSimulation(
    userId: string,
    mode: SimulationMode,
    focusSubtest?: SnbtSubtest | null,
  ): Promise<{
    session: SimulationSessionEntity;
    blocks: SimulationSubtestBlockEntity[];
    questionsById: Record<string, Omit<QuestionEntity, "correctAnswerKey" | "officialSolutionMarkdown" | "solutionSteps">>;
  }> {
    const blueprint =
      mode === "subtest_drill" && focusSubtest
        ? [{ subtest: focusSubtest, questionCount: 5, allocatedSeconds: 450 }]
        : SIMULATION_PRESETS[mode];
    const allApproved = await this.repo.listQuestions({ userId, qcStatus: "approved" });

    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    const blocks: SimulationSubtestBlockEntity[] = [];
    const questionsById: Record<
      string,
      Omit<QuestionEntity, "correctAnswerKey" | "officialSolutionMarkdown" | "solutionSteps">
    > = {};

    blueprint.forEach((bp, idx) => {
      const subPool = allApproved.filter((q) => q.subtest === bp.subtest);
      const chosen = subPool.slice(0, bp.questionCount);
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
      blocks.push({
        id: crypto.randomUUID(),
        simulationSessionId: sessionId,
        subtest: bp.subtest,
        blockOrder: idx + 1,
        questionCount: chosen.length,
        allocatedSeconds: bp.allocatedSeconds,
        questionIds: chosen.map((q) => q.id),
        startedAt: isFirst ? nowIso : null,
        lockedAt: null,
        endsAt: isFirst ? new Date(now + bp.allocatedSeconds * 1000).toISOString() : null,
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
    return { session, blocks, questionsById };
  }

  async getSimulationState(userId: string, sessionId: string) {
    const found = await this.repo.getSimulationById(userId, sessionId);
    if (!found) throw new Error("Simulation session not found.");

    const allApproved = await this.repo.listQuestions({ userId, qcStatus: "approved" });
    const qMap = new Map(allApproved.map((q) => [q.id, q]));
    const questionsById: Record<
      string,
      Omit<QuestionEntity, "correctAnswerKey" | "officialSolutionMarkdown" | "solutionSteps">
    > = {};

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

    return {
      session: found.session,
      blocks: found.blocks,
      questionsById,
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
      selectedAnswerKey: params.selectedAnswerKey,
      timeToSolveMs: params.timeToSolveMs,
      triageDecisionMs: params.triageDecisionMs,
      triageAction: params.triageAction,
    });

    if (result.isCorrect) block.correctCount += 1;
    if (params.triageAction === "skipped_smart") block.skippedSmartCount += 1;
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
      const momentum = await this.repo.getOrInitMomentum(params.userId);
      const ratio = block.questionCount > 0 ? block.correctCount / block.questionCount : 0;
      block.subtestIrtScore = updateIrtSubtestScore({
        currentSubtestScore: momentum.subtestIrtScores[block.subtest],
        irtDifficultyB: 0.2,
        irtDiscriminationA: 1.3,
        irtGuessingC: 0.2,
        isCorrect: ratio >= 0.5,
        timeToSolveMs: block.allocatedSeconds * 500,
        expectedSolveSeconds: Math.round(block.allocatedSeconds / Math.max(1, block.questionCount)),
        hintsUsedCount: 0,
      });
      await this.repo.updateSimulationBlock(block);
    }

    const nextBlock = found.blocks[blockIndex + 1];
    if (nextBlock && !nextBlock.startedAt) {
      nextBlock.startedAt = nowIso;
      nextBlock.endsAt = new Date(now + nextBlock.allocatedSeconds * 1000).toISOString();
      await this.repo.updateSimulationBlock(nextBlock);
    }

    const allLocked = found.blocks.every((b) => b.isLocked);
    if (allLocked) {
      const totalQ = found.blocks.reduce((sum, b) => sum + b.questionCount, 0);
      const totalCorrect = found.blocks.reduce((sum, b) => sum + b.correctCount, 0);
      const accuracyRate = totalQ > 0 ? Number((totalCorrect / totalQ).toFixed(3)) : 0;

      const momentum = await this.repo.getOrInitMomentum(params.userId);
      const subScores: Record<SnbtSubtest, number> = { ...momentum.subtestIrtScores };
      for (const b of found.blocks) {
        if (b.subtestIrtScore !== null) {
          subScores[b.subtest] = b.subtestIrtScore;
        }
      }
      const composite = computeCompositeIrtScore(subScores);

      const recentAttempts = await this.repo.listUserAttempts(params.userId, { limit: totalQ });
      const triageEff = computeTriageEfficiency(recentAttempts);

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
    }

    return { session: found.session, blocks: found.blocks };
  }
}
