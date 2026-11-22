import type { SnbtSubtest } from "./types";

export interface IrtUpdateInput {
  currentSubtestScore: number;
  irtDifficultyB: number;
  irtDiscriminationA: number;
  irtGuessingC: number;
  isCorrect: boolean;
  timeToSolveMs: number;
  expectedSolveSeconds: number;
  hintsUsedCount: number;
}

/**
 * Converts between UTBK-SNBT scaled score [200..1000] and IRT theta [-3.0..+3.0].
 * Center: 550 maps to theta = 0.0, each 1.0 theta unit = 125 UTBK points.
 */
export function scoreToTheta(score: number): number {
  return Math.max(-3.0, Math.min(3.5, (score - 550) / 125));
}

export function thetaToScore(theta: number): number {
  const raw = 550 + theta * 125;
  return Number(Math.max(200, Math.min(1000, raw)).toFixed(2));
}

export function threePlProbability(
  theta: number,
  a: number,
  b: number,
  c: number,
): number {
  const exponent = Math.max(-20, Math.min(20, -a * (theta - b)));
  return c + (1 - c) / (1 + Math.exp(exponent));
}

export function updateIrtSubtestScore(input: IrtUpdateInput): number {
  const theta = scoreToTheta(input.currentSubtestScore);
  const p = threePlProbability(
    theta,
    input.irtDiscriminationA,
    input.irtDifficultyB,
    input.irtGuessingC,
  );

  // Discount credit when student needed Socratic hints to reach the answer
  const hintDiscount = Math.max(0.25, 1 - input.hintsUsedCount * 0.22);
  const observed = input.isCorrect ? hintDiscount : 0;
  const paceBonus =
    input.isCorrect && input.timeToSolveMs <= input.expectedSolveSeconds * 1000 ? 1.15 : 1.0;

  const learningRate = 0.28 * input.irtDiscriminationA * paceBonus;
  const nextTheta = theta + learningRate * (observed - p);
  return thetaToScore(nextTheta);
}

export function computeCompositeIrtScore(
  subtestScores: Record<SnbtSubtest, number>,
): number {
  const weights: Record<SnbtSubtest, number> = {
    PU: 0.16,
    PPU: 0.12,
    PBM: 0.12,
    PK: 0.16,
    LBI: 0.15,
    LBE: 0.13,
    PM: 0.16,
  };
  let total = 0;
  (Object.keys(weights) as SnbtSubtest[]).forEach((sub) => {
    total += (subtestScores[sub] ?? 400) * weights[sub];
  });
  return Number(Math.max(200, Math.min(1000, total)).toFixed(2));
}

export function computeTriageEfficiency(
  attempts: Array<{
    isCorrect: boolean;
    triageDecisionMs: number | null;
    triageAction: string;
    timeToSolveMs: number;
  }>,
): number {
  if (attempts.length === 0) return 0;
  let scoreSum = 0;
  for (const a of attempts) {
    const within20s = a.triageDecisionMs !== null && a.triageDecisionMs <= 20000;
    if (a.isCorrect && within20s) {
      scoreSum += 1.0;
    } else if (a.isCorrect) {
      scoreSum += 0.8;
    } else if (a.triageAction === "skipped_smart" && a.timeToSolveMs <= 25000) {
      // Smart fast skip preserves IRT time budget for high-confidence items
      scoreSum += 0.7;
    } else {
      scoreSum += 0.1;
    }
  }
  return Number((scoreSum / attempts.length).toFixed(3));
}
