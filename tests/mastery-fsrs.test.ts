import { describe, expect, it } from "vitest";
import {
  computeExamCountdown,
  computeRecommendedWeeklyNodes,
  DEFAULT_UTBK_EXAM_DATE,
} from "@/domain/exam-countdown";
import {
  createInitialFsrsCard,
  deriveFsrsRating,
  evaluateFractureHealing,
  scheduleFsrsReview,
} from "@/domain/fsrs-scheduler";
import { evaluateMasteryTransition, updateMomentumState } from "@/domain/mastery-engine";
import { NODE_IDS, SEED_SKILL_EDGES, SEED_SKILL_NODES } from "@/domain/seed-data";
import type { MistakeFractureEntity, UserMomentumState, UserSkillMastery } from "@/domain/types";

describe("MasteryEngine & Soft-Gating + Tier-0 Recovery Shield", () => {
  it("transitions node to soft_passed at >= 75%, sets interleavePriority, and unlocks child DAG nodes", () => {
    const parentNode = SEED_SKILL_NODES.find((n) => n.id === NODE_IDS.PK_T0_FRAC)!;
    const childNode = SEED_SKILL_NODES.find((n) => n.id === NODE_IDS.PK_T0_ALG)!;

    let mastery: UserSkillMastery = {
      id: "m1",
      userId: "u1",
      skillNodeId: parentNode.id,
      status: "in_progress",
      masteryScore: 0.72,
      currentFadingStage: "missing_multi_steps",
      attemptsTotal: 3,
      attemptsCorrect: 3,
      rollingAccuracy10: 1.0,
      medianSolveMs: 32000,
      interleavePriority: 10,
      recoveryShieldActive: true,
      lastPracticedAt: null,
      masteredAt: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const childMastery: UserSkillMastery = {
      id: "m2",
      userId: "u1",
      skillNodeId: childNode.id,
      status: "locked",
      masteryScore: 0,
      currentFadingStage: "full_worked",
      attemptsTotal: 0,
      attemptsCorrect: 0,
      rollingAccuracy10: 0,
      medianSolveMs: null,
      interleavePriority: 0,
      recoveryShieldActive: true,
      lastPracticedAt: null,
      masteredAt: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const map = new Map<string, UserSkillMastery>([
      [parentNode.id, mastery],
      [childNode.id, childMastery],
    ]);

    const res = evaluateMasteryTransition(
      {
        node: parentNode,
        current: mastery,
        isCorrect: true,
        timeToSolveMs: 30000,
        hintsUsedCount: 0,
        rootCause: null,
        recentOutcomes: [true, true, true],
        nowIso: "2026-01-02T00:00:00.000Z",
      },
      SEED_SKILL_EDGES,
      map,
    );

    expect(res.nextMastery.masteryScore).toBeGreaterThanOrEqual(0.75);
    expect(res.nextMastery.status).toBe("soft_passed");
    expect(res.nextMastery.interleavePriority).toBeGreaterThanOrEqual(65);
    expect(res.unlockedChildIds).toContain(NODE_IDS.PK_T0_ALG);

    // 5th consecutive accurate solve should conquer >= 85%
    mastery = { ...res.nextMastery, masteryScore: 0.86 };
    const conquest = evaluateMasteryTransition(
      {
        node: parentNode,
        current: mastery,
        isCorrect: true,
        timeToSolveMs: 28000,
        hintsUsedCount: 0,
        rootCause: null,
        recentOutcomes: [true, true, true, true],
        nowIso: "2026-01-02T00:05:00.000Z",
      },
      SEED_SKILL_EDGES,
      map,
    );
    expect(conquest.nextMastery.status).toBe("mastered");
    expect(conquest.nextMastery.masteredAt).not.toBeNull();
  });

  it("protects precision combo with Tier-0 Recovery Shield while breaking unshielded mistakes", () => {
    const base: UserMomentumState = {
      userId: "u1",
      precisionComboCurrent: 4,
      precisionComboBest: 4,
      tier0RecoveryShieldsRemaining: 2,
      tier0RecoveryShieldsUsed: 1,
      estimatedIrtComposite: 450,
      subtestIrtScores: { PU: 450, PPU: 450, PBM: 450, PK: 450, LBI: 450, LBE: 450, PM: 450 },
      lastStudyAt: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const shielded = updateMomentumState(base, {
      isCorrect: false,
      timeToSolveMs: 40000,
      expectedSolveSeconds: 50,
      tier: "tier_0_foundation",
      recoveryShieldActive: true,
      nowIso: "2026-01-02T00:00:00.000Z",
    });

    expect(shielded.shieldConsumed).toBe(true);
    expect(shielded.nextMomentum.precisionComboCurrent).toBe(4);
    expect(shielded.nextMomentum.tier0RecoveryShieldsRemaining).toBe(1);

    const unshielded = updateMomentumState(shielded.nextMomentum, {
      isCorrect: false,
      timeToSolveMs: 40000,
      expectedSolveSeconds: 50,
      tier: "tier_2_standard",
      recoveryShieldActive: false,
      nowIso: "2026-01-02T00:01:00.000Z",
    });

    expect(unshielded.shieldConsumed).toBe(false);
    expect(unshielded.nextMomentum.precisionComboCurrent).toBe(0);
    expect(unshielded.nextMomentum.precisionComboBest).toBe(4);
  });
});

describe("FsrsScheduler & 2-Pass Fracture Healing", () => {
  it("schedules FSRS reviews via ts-fsrs and heals fractures after 2 clean isomorphic passes", () => {
    const t0 = new Date("2026-01-01T08:00:00.000Z");
    const card = createInitialFsrsCard({
      id: "c1",
      userId: "u1",
      skillNodeId: NODE_IDS.PK_T2_RATE,
      questionId: "q1",
      cardScope: "mistake_revival",
      now: t0,
    });

    expect(deriveFsrsRating({ isCorrect: true, hintsUsedCount: 0, timeToSolveMs: 25000, expectedSolveSeconds: 60 })).toBe("easy");
    expect(deriveFsrsRating({ isCorrect: false, hintsUsedCount: 0, timeToSolveMs: 25000, expectedSolveSeconds: 60 })).toBe("again");

    const pass1 = scheduleFsrsReview(card, "good", t0);
    expect(pass1.nextCard.reps).toBe(1);
    expect(pass1.nextCard.stability).toBeGreaterThan(0);
    expect(new Date(pass1.nextCard.due).getTime()).toBeGreaterThanOrEqual(t0.getTime());

    let fracture: MistakeFractureEntity = {
      id: "f1",
      userId: "u1",
      skillNodeId: NODE_IDS.PK_T2_RATE,
      originQuestionId: "q1",
      originAttemptId: "a1",
      fsrsCardId: card.id,
      primaryRootCause: "formula_amnesia",
      secondaryRootCause: null,
      distractorTrapCaught: "formula_misapplication",
      diagnosticSummary: "Tertukar perbandingan senilai vs berbalik nilai.",
      status: "active",
      revivalAttemptsCount: 0,
      revivalPassesRequired: 2,
      revivalPassesAchieved: 0,
      lastIsomorphicQuestionId: null,
      healedAt: null,
      createdAt: t0.toISOString(),
      updatedAt: t0.toISOString(),
    };

    // Pass with heavy hint L3 does not advance healing
    const heavyHintAttempt = evaluateFractureHealing(
      fracture,
      true,
      "L3_guided_first_step",
      "iso1",
      "2026-01-02T00:00:00.000Z",
    );
    expect(heavyHintAttempt.status).toBe("active");
    expect(heavyHintAttempt.revivalPassesAchieved).toBe(0);

    // Clean pass 1 -> healing
    fracture = evaluateFractureHealing(fracture, true, "L1_vault_nudge", "iso2", "2026-01-03T00:00:00.000Z");
    expect(fracture.status).toBe("healing");
    expect(fracture.revivalPassesAchieved).toBe(1);

    // Clean pass 2 -> healed
    fracture = evaluateFractureHealing(fracture, true, null, "iso3", "2026-01-05T00:00:00.000Z");
    expect(fracture.status).toBe("healed");
    expect(fracture.revivalPassesAchieved).toBe(2);
    expect(fracture.healedAt).not.toBeNull();
  });

  it("computes WIB UTBK day countdown and weekly pacing accurately", () => {
    const refNow = new Date("2027-04-18T07:30:00+07:00").getTime();
    const thirtyDays = computeExamCountdown("2027-05-18", refNow);
    expect(thirtyDays.daysLeft).toBe(30);
    expect(thirtyDays.hoursLeft).toBe(0);
    expect(thirtyDays.phase).toBe("sprint_final");
    expect(thirtyDays.isDefaultDate).toBe(false);

    const fallback = computeExamCountdown(null, refNow);
    expect(fallback.effectiveDate).toBe(DEFAULT_UTBK_EXAM_DATE);
    expect(fallback.isDefaultDate).toBe(true);
    expect(fallback.daysLeft).toBe(30);

    expect(computeRecommendedWeeklyNodes(20, 70)).toBe(2);
    expect(computeRecommendedWeeklyNodes(0, 30)).toBe(0);
  });
});
