import {
  createEmptyCard,
  forgetting_curve,
  fsrs,
  Rating,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";
import type {
  FsrsCardEntity,
  FsrsRatingName,
  FsrsStateName,
  MistakeFractureEntity,
  SocraticHintLevel,
} from "./types";

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 120,
  enable_fuzz: false,
  enable_short_term: true,
});

function toTsFsrsState(state: FsrsStateName): State {
  switch (state) {
    case "new":
      return State.New;
    case "learning":
      return State.Learning;
    case "review":
      return State.Review;
    case "relearning":
      return State.Relearning;
  }
}

function fromTsFsrsState(state: State): FsrsStateName {
  switch (state) {
    case State.New:
      return "new";
    case State.Learning:
      return "learning";
    case State.Review:
      return "review";
    case State.Relearning:
      return "relearning";
  }
}

function toTsFsrsGrade(rating: FsrsRatingName): Grade {
  switch (rating) {
    case "again":
      return Rating.Again;
    case "hard":
      return Rating.Hard;
    case "good":
      return Rating.Good;
    case "easy":
      return Rating.Easy;
  }
}

export function deriveFsrsRating(params: {
  isCorrect: boolean;
  hintsUsedCount: number;
  timeToSolveMs: number;
  expectedSolveSeconds: number;
}): FsrsRatingName {
  if (!params.isCorrect || params.hintsUsedCount >= 3) {
    return "again";
  }
  if (params.hintsUsedCount >= 1 || params.timeToSolveMs > params.expectedSolveSeconds * 1350) {
    return "hard";
  }
  if (params.timeToSolveMs <= params.expectedSolveSeconds * 750) {
    return "easy";
  }
  return "good";
}

export function createInitialFsrsCard(params: {
  id: string;
  userId: string;
  skillNodeId: string;
  questionId: string | null;
  cardScope: "skill_concept" | "mistake_revival";
  now: Date;
}): FsrsCardEntity {
  const empty = createEmptyCard(params.now);
  return {
    id: params.id,
    userId: params.userId,
    skillNodeId: params.skillNodeId,
    questionId: params.questionId,
    cardScope: params.cardScope,
    state: fromTsFsrsState(empty.state),
    due: empty.due.toISOString(),
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsedDays: empty.elapsed_days,
    scheduledDays: empty.scheduled_days,
    learningSteps: 0,
    reps: empty.reps,
    lapses: empty.lapses,
    lastReview: null,
    retrievabilitySnapshot: 1,
    updatedAt: params.now.toISOString(),
  };
}

export function scheduleFsrsReview(
  entity: FsrsCardEntity,
  ratingName: FsrsRatingName,
  now: Date,
): { nextCard: FsrsCardEntity; reviewLog: Record<string, unknown> } {
  const tsCard: Card = {
    due: new Date(entity.due),
    stability: entity.stability,
    difficulty: entity.difficulty,
    elapsed_days: entity.elapsedDays,
    scheduled_days: entity.scheduledDays,
    reps: entity.reps,
    lapses: entity.lapses,
    state: toTsFsrsState(entity.state),
    last_review: entity.lastReview ? new Date(entity.lastReview) : undefined,
  };

  const grade = toTsFsrsGrade(ratingName);
  const result = scheduler.next(tsCard, now, grade);
  const updated = result.card;

  const retrievability =
    updated.stability > 0 ? forgetting_curve(0, updated.stability) : 1;

  const nextCard: FsrsCardEntity = {
    ...entity,
    state: fromTsFsrsState(updated.state),
    due: updated.due.toISOString(),
    stability: Number(updated.stability.toFixed(4)),
    difficulty: Number(updated.difficulty.toFixed(4)),
    elapsedDays: updated.elapsed_days,
    scheduledDays: updated.scheduled_days,
    learningSteps: ratingName === "again" ? entity.learningSteps + 1 : 0,
    reps: updated.reps,
    lapses: updated.lapses,
    lastReview: updated.last_review ? updated.last_review.toISOString() : now.toISOString(),
    retrievabilitySnapshot: Number(Math.max(0, Math.min(1, retrievability)).toFixed(4)),
    updatedAt: now.toISOString(),
  };

  return {
    nextCard,
    reviewLog: {
      rating: ratingName,
      state: nextCard.state,
      due: nextCard.due,
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      scheduledDays: nextCard.scheduledDays,
      reviewAt: now.toISOString(),
    },
  };
}

export function evaluateFractureHealing(
  fracture: MistakeFractureEntity,
  isCorrect: boolean,
  maxHintLevel: SocraticHintLevel | null,
  isomorphicQuestionId: string,
  nowIso: string,
): MistakeFractureEntity {
  const usedHeavyHint =
    maxHintLevel === "L3_guided_first_step" || maxHintLevel === "L4_first_principles_analogy";

  const revivalAttemptsCount = fracture.revivalAttemptsCount + 1;
  let revivalPassesAchieved = fracture.revivalPassesAchieved;

  if (isCorrect && !usedHeavyHint) {
    revivalPassesAchieved += 1;
  } else if (!isCorrect) {
    // Regression resets partial healing progress so mastery is genuine
    revivalPassesAchieved = 0;
  }

  let status = fracture.status;
  let healedAt = fracture.healedAt;
  if (revivalPassesAchieved >= fracture.revivalPassesRequired) {
    status = "healed";
    healedAt = healedAt ?? nowIso;
  } else if (revivalPassesAchieved > 0) {
    status = "healing";
  } else {
    status = "active";
  }

  return {
    ...fracture,
    status,
    revivalAttemptsCount,
    revivalPassesAchieved,
    lastIsomorphicQuestionId: isomorphicQuestionId,
    healedAt,
    updatedAt: nowIso,
  };
}
