import type {
  DifficultyTier,
  FadingStage,
  MasteryStatus,
  RootCauseType,
  SkillNode,
  SkillPrerequisiteEdge,
  UserMomentumState,
  UserSkillMastery,
} from "./types";

export function computeFadingStage(masteryScore: number): FadingStage {
  if (masteryScore < 0.35) return "full_worked";
  if (masteryScore < 0.6) return "missing_final_step";
  if (masteryScore < 0.8) return "missing_multi_steps";
  return "independent";
}

export interface MasteryUpdateInput {
  node: SkillNode;
  current: UserSkillMastery;
  isCorrect: boolean;
  timeToSolveMs: number;
  hintsUsedCount: number;
  rootCause: RootCauseType | null;
  recentOutcomes: boolean[];
  nowIso: string;
}

export interface MasteryUpdateResult {
  nextMastery: UserSkillMastery;
  unlockedChildIds: string[];
  triggeredFoundationFracture: boolean;
}

export function evaluateMasteryTransition(
  input: MasteryUpdateInput,
  edges: SkillPrerequisiteEdge[],
  allMasteries: Map<string, UserSkillMastery>,
): MasteryUpdateResult {
  const { node, current, isCorrect, timeToSolveMs, hintsUsedCount, rootCause, recentOutcomes, nowIso } = input;

  const attemptsTotal = current.attemptsTotal + 1;
  const attemptsCorrect = current.attemptsCorrect + (isCorrect ? 1 : 0);

  const window10 = [...recentOutcomes.slice(-9), isCorrect];
  const rollingAccuracy10 =
    window10.length > 0 ? window10.filter(Boolean).length / window10.length : 0;

  // Penalize heavy hint reliance while rewarding clean timely execution
  const hintPenalty = Math.min(0.45, hintsUsedCount * 0.12);
  const onPace = timeToSolveMs <= node.targetSolveSeconds * 1000;
  const attemptSignal = isCorrect ? Math.max(0.45, (onPace ? 1.0 : 0.85) - hintPenalty) : 0.0;

  const alpha = attemptsTotal <= 3 ? 0.38 : 0.25;
  const rawNextScore =
    attemptsTotal === 1
      ? attemptSignal * 0.65
      : current.masteryScore * (1 - alpha) + attemptSignal * alpha;
  const masteryScore = Number(Math.max(0, Math.min(1, rawNextScore)).toFixed(3));

  const medianSolveMs =
    current.medianSolveMs === null
      ? timeToSolveMs
      : Math.round(current.medianSolveMs * 0.7 + timeToSolveMs * 0.3);

  let status: MasteryStatus = current.status === "locked" ? "in_progress" : current.status;
  let interleavePriority = current.interleavePriority;
  let masteredAt = current.masteredAt;
  let triggeredFoundationFracture = false;

  if (!isCorrect && rootCause === "foundational_gap") {
    status = "foundation_fracture";
    interleavePriority = Math.min(100, Math.max(interleavePriority, 85));
    triggeredFoundationFracture = true;
  } else if (masteryScore >= node.conquestThreshold && attemptsTotal >= 5 && rollingAccuracy10 >= 0.8) {
    status = "mastered";
    interleavePriority = Math.max(0, interleavePriority - 30);
    masteredAt = masteredAt ?? nowIso;
  } else if (masteryScore >= node.softGateThreshold && attemptsTotal >= 3) {
    status = "soft_passed";
    // Soft-gating unlocks lateral neighbors while forcing spaced interleaving
    interleavePriority = Math.max(interleavePriority, 65);
  } else if (status === "mastered" && masteryScore < node.softGateThreshold) {
    status = "soft_passed";
    interleavePriority = 75;
  } else if (status !== "foundation_fracture") {
    status = "in_progress";
  }

  const nextMastery: UserSkillMastery = {
    ...current,
    status,
    masteryScore,
    currentFadingStage: computeFadingStage(masteryScore),
    attemptsTotal,
    attemptsCorrect,
    rollingAccuracy10: Number(rollingAccuracy10.toFixed(3)),
    medianSolveMs,
    interleavePriority,
    recoveryShieldActive: node.isFoundationRepair || current.recoveryShieldActive,
    lastPracticedAt: nowIso,
    masteredAt,
    updatedAt: nowIso,
  };

  // Unlock downstream nodes once Soft-Gate (75%) or Mastery (85%) is achieved
  const unlockedChildIds: string[] = [];
  const passesGate = status === "soft_passed" || status === "mastered";
  if (passesGate) {
    const outgoing = edges.filter(
      (e) => e.parentNodeId === node.id && (e.edgeType === "hard_prereq" || e.edgeType === "soft_prereq"),
    );
    for (const edge of outgoing) {
      const childMastery = allMasteries.get(edge.childNodeId);
      if (!childMastery || childMastery.status !== "locked") continue;
      const hardParents = edges.filter(
        (e) => e.childNodeId === edge.childNodeId && e.edgeType === "hard_prereq",
      );
      const allHardMet = hardParents.every((hp) => {
        if (hp.parentNodeId === node.id) return true;
        const pm = allMasteries.get(hp.parentNodeId);
        return pm !== undefined && (pm.status === "soft_passed" || pm.status === "mastered");
      });
      if (allHardMet) {
        unlockedChildIds.push(edge.childNodeId);
      }
    }
  }

  return {
    nextMastery,
    unlockedChildIds,
    triggeredFoundationFracture,
  };
}

export function updateMomentumState(
  momentum: UserMomentumState,
  params: {
    isCorrect: boolean;
    timeToSolveMs: number;
    expectedSolveSeconds: number;
    tier: DifficultyTier;
    recoveryShieldActive: boolean;
    nowIso: string;
  },
): { nextMomentum: UserMomentumState; shieldConsumed: boolean } {
  const { isCorrect, timeToSolveMs, expectedSolveSeconds, tier, recoveryShieldActive, nowIso } = params;
  const withinTargetPace = timeToSolveMs <= expectedSolveSeconds * 1000;

  let precisionComboCurrent = momentum.precisionComboCurrent;
  let precisionComboBest = momentum.precisionComboBest;
  let shieldsRemaining = momentum.tier0RecoveryShieldsRemaining;
  let shieldsUsed = momentum.tier0RecoveryShieldsUsed;
  let shieldConsumed = false;

  if (isCorrect) {
    precisionComboCurrent = withinTargetPace
      ? precisionComboCurrent + 1
      : Math.max(1, precisionComboCurrent);
    precisionComboBest = Math.max(precisionComboBest, precisionComboCurrent);
  } else if ((tier === "tier_0_foundation" || recoveryShieldActive) && shieldsRemaining > 0) {
    // Tier-0 Recovery Shield absorbs mistakes without breaking combo momentum
    shieldsRemaining -= 1;
    shieldsUsed += 1;
    shieldConsumed = true;
  } else {
    precisionComboCurrent = 0;
  }

  return {
    shieldConsumed,
    nextMomentum: {
      ...momentum,
      precisionComboCurrent,
      precisionComboBest,
      tier0RecoveryShieldsRemaining: shieldsRemaining,
      tier0RecoveryShieldsUsed: shieldsUsed,
      lastStudyAt: nowIso,
      updatedAt: nowIso,
    },
  };
}
