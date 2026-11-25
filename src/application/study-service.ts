import crypto from "node:crypto";
import {
  buildFadedSolutionView,
  validateEvidenceHighlight,
  validateSbiDeconstruction,
} from "@/domain/dual-track-pedagogy";
import {
  createInitialFsrsCard,
  deriveFsrsRating,
  evaluateFractureHealing,
  scheduleFsrsReview,
} from "@/domain/fsrs-scheduler";
import { computeCompositeIrtScore, updateIrtSubtestScore } from "@/domain/irt-calibrator";
import { evaluateMasteryTransition, updateMomentumState } from "@/domain/mastery-engine";
import { classifyRootCauseDeterministically } from "@/domain/root-cause-rules";
import type {
  DistractorTrapType,
  MistakeFractureEntity,
  QuestionAttemptEntity,
  QuestionEntity,
  RootCauseType,
  SkillNode,
  SocraticHintLevel,
  TriageAction,
  UserMomentumState,
  UserSkillMastery,
} from "@/domain/types";
import type { AppRepository } from "@/infrastructure/db/repository-port";
import { NeuroSymbolicService } from "./neuro-symbolic-service";

export interface StudySessionItemPayload {
  question: Omit<QuestionEntity, "correctAnswerKey" | "officialSolutionMarkdown" | "solutionSteps"> & {
    solutionStepsPreview: ReturnType<typeof buildFadedSolutionView>;
  };
  skillNode: SkillNode;
  mastery: UserSkillMastery;
  fractureContext: MistakeFractureEntity | null;
  momentum: UserMomentumState;
  selectionReason: string;
}

export interface SubmitAttemptInput {
  userId: string;
  questionId: string;
  attemptMode: QuestionAttemptEntity["attemptMode"];
  simulationSessionId?: string | null;
  simulationBlockId?: string | null;
  fractureId?: string | null;
  selectedAnswerKey: "A" | "B" | "C" | "D" | "E" | null;
  timeToSolveMs: number;
  firstInteractionMs?: number | null;
  triageDecisionMs?: number | null;
  triageAction?: TriageAction;
  highlightedSentenceIds?: string[];
  sbiSchemaSelected?: string | null;
  sbiVariablesTagged?: Record<string, string>;
  hintsUsedCount?: number;
  maxHintLevel?: SocraticHintLevel | null;
  usedScratchpad?: boolean;
}

export interface SubmitAttemptResult {
  attempt: QuestionAttemptEntity;
  isCorrect: boolean;
  correctAnswerKey: QuestionEntity["correctAnswerKey"];
  officialSolutionMarkdown: string;
  solutionSteps: QuestionEntity["solutionSteps"];
  optionsFeedback: QuestionEntity["options"];
  evidenceSentenceIds: string[];
  mastery: UserSkillMastery;
  unlockedNodeCodes: string[];
  momentum: UserMomentumState;
  shieldConsumed: boolean;
  fracture: MistakeFractureEntity | null;
  rootCauseAnalysis: {
    primaryRootCause: RootCauseType;
    summary: string;
  } | null;
  fsrsNextDue: string | null;
}

export class StudyService {
  constructor(private readonly repo: AppRepository) {}

  private pickFreshQuestion(
    candidates: QuestionEntity[],
    seenCount: Map<string, number>,
    lastSeenRank: Map<string, number>,
  ): QuestionEntity | null {
    if (candidates.length === 0) return null;
    const unseen = candidates.filter((q) => (seenCount.get(q.id) ?? 0) === 0);
    if (unseen.length > 0) {
      return unseen[Math.floor(Math.random() * unseen.length)] ?? unseen[0];
    }
    const sorted = [...candidates].sort((a, b) => {
      const ca = seenCount.get(a.id) ?? 0;
      const cb = seenCount.get(b.id) ?? 0;
      if (ca !== cb) return ca - cb;
      const ra = lastSeenRank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const rb = lastSeenRank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return rb - ra;
    });
    return sorted[0] ?? null;
  }

  async selectNextStudyItem(params: {
    userId: string;
    questionId?: string | null;
    skillNodeId?: string | null;
    fractureId?: string | null;
    interleaved?: boolean;
    excludeSkillNodeIds?: string[];
    excludeQuestionIds?: string[];
  }): Promise<StudySessionItemPayload> {
    const [nodes, edges, masteries, momentum, recentAttempts] = await Promise.all([
      this.repo.listSkillNodes(),
      this.repo.listSkillEdges(),
      this.repo.listUserSkillMasteries(params.userId),
      this.repo.getOrInitMomentum(params.userId),
      this.repo.listUserAttempts(params.userId, { limit: 120 }),
    ]);

    const seenCount = new Map<string, number>();
    const lastSeenRank = new Map<string, number>();
    recentAttempts.forEach((a, idx) => {
      seenCount.set(a.questionId, (seenCount.get(a.questionId) ?? 0) + 1);
      if (!lastSeenRank.has(a.questionId)) {
        lastSeenRank.set(a.questionId, idx);
      }
    });

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const masteryMap = new Map(masteries.map((m) => [m.skillNodeId, m]));
    const excludedNodes = new Set(params.excludeSkillNodeIds ?? []);
    const excludedQuestions = new Set(params.excludeQuestionIds ?? []);

    const pickFromNode = async (
      nodeId: string,
      extraExcludeQuestionId?: string | null,
    ): Promise<QuestionEntity | null> => {
      const nodeQuestions = await this.repo.listQuestions({
        userId: params.userId,
        skillNodeId: nodeId,
        qcStatus: "approved",
      });
      if (nodeQuestions.length === 0) return null;
      const filtered = nodeQuestions.filter(
        (q) => !excludedQuestions.has(q.id) && q.id !== extraExcludeQuestionId,
      );
      const pool = filtered.length > 0 ? filtered : nodeQuestions;
      return this.pickFreshQuestion(pool, seenCount, lastSeenRank);
    };

    let selectedQuestion: QuestionEntity | null = null;
    let fractureContext: MistakeFractureEntity | null = null;
    let selectionReason = "Latihan adaptif terarah sesuai posisi Skill Tree aktif.";

    if (params.questionId) {
      const specific = await this.repo.getQuestionById(params.questionId);
      if (specific && specific.qcStatus === "approved") {
        selectedQuestion = specific;
        selectionReason = "Soal spesifik dipilih langsung.";
      }
    }

    // 1. Explicit Mistake Fracture revival (generates fresh QuickJS-WASM isomorphic variant for Quant!)
    if (!selectedQuestion && params.fractureId) {
      const fracture = await this.repo.getFractureById(params.fractureId);
      if (fracture && fracture.userId === params.userId) {
        fractureContext = fracture;
        const ns = new NeuroSymbolicService(this.repo);
        const node = nodeMap.get(fracture.skillNodeId);
        if (node && node.track === "quantitative") {
          const templates = await this.repo.listActiveTemplates({ skillNodeId: node.id });
          if (templates.length > 0) {
            const gen = await ns.generateVerifiedVariant({
              templateId: templates[0].id,
              userId: params.userId,
              parentQuestionId: fracture.originQuestionId,
            });
            if (gen.ok && gen.question) {
              selectedQuestion = gen.question;
              selectionReason =
                "Pemulihan Fraktur FSRS: variasi isomorfik terverifikasi sandbox QuickJS-WASM.";
            }
          }
        }
        if (!selectedQuestion) {
          selectedQuestion =
            (await pickFromNode(fracture.skillNodeId, fracture.originQuestionId)) ??
            (await this.repo.getQuestionById(fracture.originQuestionId));
          selectionReason = "Pemulihan Fraktur FSRS dari arsip node terkait.";
        }
      }
    }

    // 2. Interleaved Sprint (Rohrer d=0.83): deliberately rotates bab & track to train strategy discrimination
    if (!selectedQuestion && params.interleaved) {
      const unlockedIds = new Set(
        masteries.filter((m) => m.status !== "locked").map((m) => m.skillNodeId),
      );
      const eligibleNodes =
        unlockedIds.size >= 3 ? nodes.filter((n) => unlockedIds.has(n.id)) : nodes;
      const nonExcluded = eligibleNodes.filter((n) => !excludedNodes.has(n.id));
      const candidateNodes = nonExcluded.length > 0 ? nonExcluded : eligibleNodes;

      const lastExcludedId = params.excludeSkillNodeIds?.[params.excludeSkillNodeIds.length - 1];
      const lastTrack = lastExcludedId ? nodeMap.get(lastExcludedId)?.track ?? null : null;

      const sortedInterleave = [...candidateNodes].sort((a, b) => {
        const ma = masteryMap.get(a.id);
        const mb = masteryMap.get(b.id);
        const scoreFor = (node: SkillNode, m?: UserSkillMastery) =>
          (lastTrack && node.track !== lastTrack ? 120 : 0) +
          (m?.status === "foundation_fracture" ? 90 : 0) +
          (m?.status === "in_progress" ? 45 : 0) +
          Math.round((1 - (m?.masteryScore ?? 0)) * 50) +
          ((seenCount.get(node.id) ?? 0) === 0 ? 15 : 0);
        return scoreFor(b, mb) - scoreFor(a, ma);
      });

      for (const candidateNode of sortedInterleave) {
        const candidate = await pickFromNode(candidateNode.id);
        if (candidate) {
          selectedQuestion = candidate;
          selectionReason =
            "Interleaved Sprint (Rohrer d=0.83): melatih diskriminasi strategi lintas bab.";
          break;
        }
      }
    }

    // 3. Explicit Skill Node target
    if (!selectedQuestion && params.skillNodeId) {
      const candidate = await pickFromNode(params.skillNodeId);
      if (candidate) {
        selectedQuestion = candidate;
        selectionReason = `Fokus node ${nodeMap.get(params.skillNodeId)?.code ?? "terpilih"}.`;
      } else {
        const ns = new NeuroSymbolicService(this.repo);
        const gen = await ns.generateVerifiedVariant({
          skillNodeId: params.skillNodeId,
          userId: params.userId,
        });
        if (gen.ok && gen.question) {
          selectedQuestion = gen.question;
          selectionReason = "Soal isomorfik baru dari template terverifikasi.";
        }
      }
    }

    // 4. Due FSRS queue (prioritizing active fractures & spaced concepts)
    if (!selectedQuestion) {
      const dueCards = await this.repo.listDueFsrsCards(params.userId, new Date().toISOString());
      if (dueCards.length > 0) {
        const topCard = dueCards[0];
        if (topCard.questionId && !excludedQuestions.has(topCard.questionId)) {
          const cardQ = await this.repo.getQuestionById(topCard.questionId);
          if (cardQ && cardQ.qcStatus === "approved") {
            selectedQuestion = cardQ;
          }
        }
        if (!selectedQuestion) {
          selectedQuestion = await pickFromNode(topCard.skillNodeId);
        }
        if (selectedQuestion) {
          selectionReason = "Jadwal ulang FSRS aktif sebelum kurva lupa menurun.";
        }
      }
    }

    // 5. Adaptive Soft-Gate Interleaving or Foundation Fracture Priority
    if (!selectedQuestion) {
      const prioritizedMasteries = [...masteries]
        .filter((m) => m.status !== "locked")
        .sort((a, b) => {
          const scoreA =
            (a.status === "foundation_fracture" ? 200 : 0) +
            a.interleavePriority +
            (a.status === "in_progress" ? 40 : 0);
          const scoreB =
            (b.status === "foundation_fracture" ? 200 : 0) +
            b.interleavePriority +
            (b.status === "in_progress" ? 40 : 0);
          return scoreB - scoreA;
        });

      for (const m of prioritizedMasteries) {
        const candidate = await pickFromNode(m.skillNodeId);
        if (candidate) {
          selectedQuestion = candidate;
          selectionReason =
            m.status === "foundation_fracture"
              ? "Prioritas Perbaikan Fondasi Tier 0."
              : m.status === "soft_passed"
                ? "Interleaving Soft-Gate (penguatan berkala agar tembus 85%)."
                : "Eksekusi node aktif berikutnya pada Skill Tree.";
          break;
        }
      }
    }

    if (!selectedQuestion) {
      for (const fallbackNode of nodes) {
        const candidate = await pickFromNode(fallbackNode.id);
        if (candidate) {
          selectedQuestion = candidate;
          break;
        }
      }
    }

    if (!selectedQuestion) {
      throw new Error("No approved questions available in repository.");
    }

    const skillNode = nodeMap.get(selectedQuestion.skillNodeId) ?? nodes[0];
    let mastery = masteryMap.get(skillNode.id);
    if (!mastery) {
      const hasHardParent = edges.some(
        (e) => e.childNodeId === skillNode.id && e.edgeType === "hard_prereq",
      );
      mastery = {
        id: crypto.randomUUID(),
        userId: params.userId,
        skillNodeId: skillNode.id,
        status: hasHardParent ? "locked" : "in_progress",
        masteryScore: 0,
        currentFadingStage: "full_worked",
        attemptsTotal: 0,
        attemptsCorrect: 0,
        rollingAccuracy10: 0,
        medianSolveMs: null,
        interleavePriority: 0,
        recoveryShieldActive: skillNode.isFoundationRepair,
        lastPracticedAt: null,
        masteredAt: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const {
      correctAnswerKey: _omitKey,
      officialSolutionMarkdown: _omitSol,
      solutionSteps,
      ...publicQuestion
    } = selectedQuestion;

    return {
      question: {
        ...publicQuestion,
        solutionStepsPreview:
          selectedQuestion.track === "quantitative"
            ? buildFadedSolutionView(solutionSteps, mastery.currentFadingStage)
            : [],
      },
      skillNode,
      mastery,
      fractureContext,
      momentum,
      selectionReason,
    };
  }

  async submitAttempt(input: SubmitAttemptInput): Promise<SubmitAttemptResult> {
    const now = new Date();
    const nowIso = now.toISOString();

    const question = await this.repo.getQuestionById(input.questionId);
    if (!question) throw new Error("Question not found.");

    const [node, edges, masteries, momentum, priorAttempts, existingFractures] = await Promise.all([
      this.repo.getSkillNodeById(question.skillNodeId),
      this.repo.listSkillEdges(),
      this.repo.listUserSkillMasteries(input.userId),
      this.repo.getOrInitMomentum(input.userId),
      this.repo.listUserAttempts(input.userId, { skillNodeId: question.skillNodeId, limit: 15 }),
      this.repo.listMistakeFractures(input.userId),
    ]);

    if (!node) throw new Error("Skill node not found.");
    const masteryMap = new Map(masteries.map((m) => [m.skillNodeId, m]));
    const currentMastery = masteryMap.get(node.id);
    if (!currentMastery) throw new Error("User mastery record missing.");

    const highlighted = input.highlightedSentenceIds ?? [];
    const evidenceCheck = validateEvidenceHighlight(question, highlighted);
    const evidenceMatchPassed = question.track === "literacy" ? evidenceCheck.passed : null;

    if (input.sbiSchemaSelected) {
      validateSbiDeconstruction(question, input.sbiSchemaSelected, input.sbiVariablesTagged ?? {});
    }

    const triageAction = input.triageAction ?? "solved_directly";
    const isCorrect =
      triageAction !== "skipped_smart" &&
      triageAction !== "timed_out" &&
      input.selectedAnswerKey !== null &&
      input.selectedAnswerKey === question.correctAnswerKey;

    const chosenOption = question.options.find((o) => o.key === input.selectedAnswerKey);
    const distractorTrap: DistractorTrapType = isCorrect
      ? "none"
      : chosenOption?.trapType ?? "arithmetic_slip";

    const hintsUsedCount = Math.max(0, Math.min(4, input.hintsUsedCount ?? 0));

    // Root-cause classification for incorrect attempts
    let rootCause: RootCauseType | null = null;
    let rootCauseConfidence: number | null = null;
    let rootCauseSummary: string | null = null;

    if (!isCorrect) {
      const hasPrereqFracture = existingFractures.some(
        (f) => f.status !== "healed" && edges.some((e) => e.childNodeId === node.id && e.parentNodeId === f.skillNodeId),
      );

      const heuristic = classifyRootCauseDeterministically({
        track: question.track,
        tier: question.tier,
        timeToSolveMs: input.timeToSolveMs,
        expectedSolveSeconds: question.expectedSolveSeconds,
        hintsUsedCount,
        evidenceMatchPassed,
        distractorTrap,
        hasPrerequisiteFracture: hasPrereqFracture,
      });

      rootCause = heuristic.primaryRootCause;
      rootCauseConfidence = heuristic.confidence;
      rootCauseSummary = heuristic.diagnosticSummary;
    }

    // Update FSRS concept card
    let conceptCard = await this.repo.findFsrsCard({
      userId: input.userId,
      skillNodeId: node.id,
      questionId: null,
      cardScope: "skill_concept",
    });
    if (!conceptCard) {
      conceptCard = createInitialFsrsCard({
        id: crypto.randomUUID(),
        userId: input.userId,
        skillNodeId: node.id,
        questionId: null,
        cardScope: "skill_concept",
        now,
      });
    }
    const rating = deriveFsrsRating({
      isCorrect,
      hintsUsedCount,
      timeToSolveMs: input.timeToSolveMs,
      expectedSolveSeconds: question.expectedSolveSeconds,
    });
    const scheduledConcept = scheduleFsrsReview(conceptCard, rating, now);

    // Update Mastery DAG & Momentum
    const recentOutcomes = priorAttempts.slice(0, 10).map((a) => a.isCorrect).reverse();
    const masteryEval = evaluateMasteryTransition(
      {
        node,
        current: currentMastery,
        isCorrect,
        timeToSolveMs: input.timeToSolveMs,
        hintsUsedCount,
        rootCause,
        recentOutcomes,
        nowIso,
      },
      edges,
      masteryMap,
    );

    const parallelWrites: Array<Promise<void>> = [
      this.repo.upsertFsrsCard(scheduledConcept.nextCard),
      this.repo.upsertUserSkillMastery(masteryEval.nextMastery),
    ];

    const unlockedNodeCodes: string[] = [];
    for (const childId of masteryEval.unlockedChildIds) {
      const childMastery = masteryMap.get(childId);
      const childNode = await this.repo.getSkillNodeById(childId);
      if (childMastery && childMastery.status === "locked") {
        parallelWrites.push(
          this.repo.upsertUserSkillMastery({
            ...childMastery,
            status: "in_progress",
            updatedAt: nowIso,
          }),
        );
        if (childNode) unlockedNodeCodes.push(childNode.code);
      }
    }

    // Surface remedial Tier-0 node if foundational fracture triggered
    if (masteryEval.triggeredFoundationFracture) {
      const remedialEdges = edges.filter(
        (e) => e.parentNodeId === node.id && e.edgeType === "remedial_bridge",
      );
      for (const re of remedialEdges) {
        const target = masteryMap.get(re.childNodeId);
        if (target) {
          parallelWrites.push(
            this.repo.upsertUserSkillMastery({
              ...target,
              status: "foundation_fracture",
              interleavePriority: 95,
              recoveryShieldActive: true,
              updatedAt: nowIso,
            }),
          );
        }
      }
    }

    const { nextMomentum, shieldConsumed } = updateMomentumState(momentum, {
      isCorrect,
      timeToSolveMs: input.timeToSolveMs,
      expectedSolveSeconds: question.expectedSolveSeconds,
      tier: question.tier,
      recoveryShieldActive: currentMastery.recoveryShieldActive,
      nowIso,
    });

    const nextSubtestScore = updateIrtSubtestScore({
      currentSubtestScore: nextMomentum.subtestIrtScores[question.subtest],
      irtDifficultyB: question.irtDifficultyB,
      irtDiscriminationA: question.irtDiscriminationA,
      irtGuessingC: question.irtGuessingC,
      isCorrect,
      timeToSolveMs: input.timeToSolveMs,
      expectedSolveSeconds: question.expectedSolveSeconds,
      hintsUsedCount,
    });
    const updatedSubtestScores = {
      ...nextMomentum.subtestIrtScores,
      [question.subtest]: nextSubtestScore,
    };
    const finalMomentum: UserMomentumState = {
      ...nextMomentum,
      subtestIrtScores: updatedSubtestScores,
      estimatedIrtComposite: computeCompositeIrtScore(updatedSubtestScores),
    };
    parallelWrites.push(this.repo.saveMomentum(finalMomentum));
    await Promise.all(parallelWrites);

    // Handle Mistake Fracture lifecycle (create on error, advance healing on revival)
    let resultingFracture: MistakeFractureEntity | null = null;
    let revivalCardId: string | null = null;
    let fsrsNextDue: string | null = scheduledConcept.nextCard.due;

    if (input.fractureId) {
      const existing = await this.repo.getFractureById(input.fractureId);
      if (existing && existing.userId === input.userId) {
        resultingFracture = evaluateFractureHealing(
          existing,
          isCorrect,
          input.maxHintLevel ?? null,
          question.id,
          nowIso,
        );
        await this.repo.upsertMistakeFracture(resultingFracture);
        if (existing.fsrsCardId) {
          const revCard = await this.repo.getFsrsCardById(existing.fsrsCardId);
          if (revCard) {
            const revSched = scheduleFsrsReview(revCard, rating, now);
            await this.repo.upsertFsrsCard(revSched.nextCard);
            revivalCardId = revSched.nextCard.id;
            fsrsNextDue = revSched.nextCard.due;
          }
        }
      }
    } else if (!isCorrect && rootCause) {
      const revCard =
        (await this.repo.findFsrsCard({
          userId: input.userId,
          skillNodeId: node.id,
          questionId: question.id,
          cardScope: "mistake_revival",
        })) ??
        createInitialFsrsCard({
          id: crypto.randomUUID(),
          userId: input.userId,
          skillNodeId: node.id,
          questionId: question.id,
          cardScope: "mistake_revival",
          now,
        });
      const revSched = scheduleFsrsReview(revCard, "again", now);
      await this.repo.upsertFsrsCard(revSched.nextCard);
      revivalCardId = revSched.nextCard.id;
      fsrsNextDue = revSched.nextCard.due;

      const attemptId = crypto.randomUUID();
      resultingFracture = {
        id: crypto.randomUUID(),
        userId: input.userId,
        skillNodeId: node.id,
        originQuestionId: question.id,
        originAttemptId: null,
        fsrsCardId: revSched.nextCard.id,
        primaryRootCause: rootCause,
        secondaryRootCause: null,
        distractorTrapCaught: distractorTrap,
        diagnosticSummary: rootCauseSummary ?? "Kesalahan tercatat untuk pemulihan FSRS.",
        status: "active",
        revivalAttemptsCount: 0,
        revivalPassesRequired: 2,
        revivalPassesAchieved: 0,
        lastIsomorphicQuestionId: null,
        healedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await this.repo.upsertMistakeFracture(resultingFracture);
      resultingFracture = { ...resultingFracture, originAttemptId: attemptId };
    }

    const attempt: QuestionAttemptEntity = {
      id: resultingFracture?.originAttemptId ?? crypto.randomUUID(),
      userId: input.userId,
      questionId: question.id,
      skillNodeId: node.id,
      simulationSessionId: input.simulationSessionId ?? null,
      simulationBlockId: input.simulationBlockId ?? null,
      fractureId: resultingFracture?.id ?? input.fractureId ?? null,
      fsrsCardId: revivalCardId ?? scheduledConcept.nextCard.id,
      attemptMode: input.attemptMode,
      fadingStageUsed: currentMastery.currentFadingStage,
      selectedAnswerKey: input.selectedAnswerKey,
      isCorrect,
      timeToSolveMs: Math.max(0, Math.round(input.timeToSolveMs)),
      firstInteractionMs: input.firstInteractionMs ?? null,
      triageDecisionMs: input.triageDecisionMs ?? null,
      triageAction,
      withinIrtTriageWindow:
        input.triageDecisionMs !== undefined &&
        input.triageDecisionMs !== null &&
        input.triageDecisionMs <= 20000,
      highlightedSentenceIds: highlighted,
      evidenceMatchPassed,
      sbiSchemaSelected: input.sbiSchemaSelected ?? null,
      sbiVariablesTagged: input.sbiVariablesTagged ?? null,
      distractorTrapIdentified: distractorTrap,
      hintsUsedCount,
      maxHintLevel: input.maxHintLevel ?? null,
      usedScratchpad: Boolean(input.usedScratchpad),
      recoveryShieldConsumed: shieldConsumed,
      rootCause,
      rootCauseConfidence,
      fsrsRatingAssigned: rating,
      createdAt: nowIso,
    };

    await this.repo.recordAttempt(attempt);

    // Back-link origin_attempt_id after question_attempts row exists to satisfy fk_fractures_origin_attempt
    if (resultingFracture && !input.fractureId && resultingFracture.originAttemptId === attempt.id) {
      await this.repo.upsertMistakeFracture(resultingFracture);
    }

    return {
      attempt,
      isCorrect,
      correctAnswerKey: question.correctAnswerKey,
      officialSolutionMarkdown: question.officialSolutionMarkdown,
      solutionSteps: question.solutionSteps,
      optionsFeedback: question.options,
      evidenceSentenceIds: question.evidenceSentenceIds,
      mastery: masteryEval.nextMastery,
      unlockedNodeCodes,
      momentum: finalMomentum,
      shieldConsumed,
      fracture: resultingFracture,
      rootCauseAnalysis:
        rootCause && rootCauseSummary
          ? { primaryRootCause: rootCause, summary: rootCauseSummary }
          : null,
      fsrsNextDue,
    };
  }
}
