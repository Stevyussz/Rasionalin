import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SimulationService } from "@/application/simulation-service";
import { LocalJsonRepository } from "@/infrastructure/db/memory/local-repository";

describe("Simulation Review, Deduplicated Attempts & Per-Block IRT Calibration", () => {
  it("strips keys while in_progress, deduplicates revised answers, preserves block IRT calibration, and builds complete review for history replay", async () => {
    const tmpFile = path.join(os.tmpdir(), `rasionalin-sim-review-${Date.now()}.json`);
    const repo = new LocalJsonRepository(tmpFile);
    const owner = await repo.ensureDefaultOwnerUser();
    const sim = new SimulationService(repo);

    try {
      const started = await sim.startSimulation(owner.id, "subtest_drill", "PK", "standard");
      expect(started.session.status).toBe("in_progress");
      expect(started.review).toBeNull();
      expect(started.blocks).toHaveLength(1);

      const block = started.blocks[0];
      expect(block.questionIds.length).toBeGreaterThanOrEqual(3);

      // While in progress, getSimulationState must keep answer keys stripped
      const inProgState = await sim.getSimulationState(owner.id, started.session.id);
      expect(inProgState.review).toBeNull();
      for (const pubQ of Object.values(inProgState.questionsById)) {
        expect("correctAnswerKey" in pubQ).toBe(false);
        expect("officialSolutionMarkdown" in pubQ).toBe(false);
      }

      const [q1Id, q2Id, q3Id] = block.questionIds;
      const [q1, q2] = await Promise.all([
        repo.getQuestionById(q1Id),
        repo.getQuestionById(q2Id),
      ]);
      expect(q1).not.toBeNull();
      expect(q2).not.toBeNull();

      const wrongKeyForQ2 = (["A", "B", "C", "D", "E"] as const).find(
        (k) => k !== q2!.correctAnswerKey,
      )!;

      // Submit Q1 wrong first, then revise to correct answer -> should count once (deduplicated)
      const wrongKeyForQ1 = (["A", "B", "C", "D", "E"] as const).find(
        (k) => k !== q1!.correctAnswerKey,
      )!;
      await sim.submitBlockAnswer({
        userId: owner.id,
        sessionId: started.session.id,
        blockId: block.id,
        questionId: q1Id,
        selectedAnswerKey: wrongKeyForQ1,
        timeToSolveMs: 12000,
        triageDecisionMs: 8000,
        triageAction: "solved_directly",
      });
      await sim.submitBlockAnswer({
        userId: owner.id,
        sessionId: started.session.id,
        blockId: block.id,
        questionId: q1Id,
        selectedAnswerKey: q1!.correctAnswerKey,
        timeToSolveMs: 15000,
        triageDecisionMs: 9000,
        triageAction: "solved_directly",
      });

      await sim.submitBlockAnswer({
        userId: owner.id,
        sessionId: started.session.id,
        blockId: block.id,
        questionId: q2Id,
        selectedAnswerKey: wrongKeyForQ2,
        timeToSolveMs: 18000,
        triageDecisionMs: 10000,
        triageAction: "flagged_and_solved",
      });

      const afterSkip = await sim.submitBlockAnswer({
        userId: owner.id,
        sessionId: started.session.id,
        blockId: block.id,
        questionId: q3Id,
        selectedAnswerKey: null,
        timeToSolveMs: 6000,
        triageDecisionMs: 6000,
        triageAction: "skipped_smart",
      });

      // Deduplicated block counters: only 1 correct (Q1), 1 skipped (Q3)
      expect(afterSkip.block.correctCount).toBe(1);
      expect(afterSkip.block.skippedSmartCount).toBe(1);

      const userAttempts = await repo.listUserAttempts(owner.id, { limit: 10 });
      expect(userAttempts[0].simulationSessionId).toBe(started.session.id);
      expect(userAttempts[0].simulationBlockId).toBe(block.id);

      const completed = await sim.lockBlockAndAdvance({
        userId: owner.id,
        sessionId: started.session.id,
        blockId: block.id,
      });

      expect(completed.session.status).toBe("completed");
      expect(completed.blocks[0].isLocked).toBe(true);
      const freshMomentum = await repo.getOrInitMomentum(owner.id);
      expect(completed.blocks[0].subtestIrtScore).toBe(
        Number(freshMomentum.subtestIrtScores.PK.toFixed(2)),
      );

      expect(completed.review).not.toBeNull();
      expect(completed.review!.totalQuestions).toBe(block.questionIds.length);
      expect(completed.review!.correctCount).toBe(1);
      expect(completed.review!.wrongCount).toBe(1);
      expect(completed.review!.skippedCount).toBe(1);
      expect(completed.review!.unansweredCount).toBe(block.questionIds.length - 3);
      expect(completed.review!.weakestNodes.length).toBeGreaterThan(0);

      // Completed session fetched via getSimulationState returns full review payload
      const replayed = await sim.getSimulationState(owner.id, started.session.id);
      expect(replayed.review).not.toBeNull();
      expect(replayed.review!.items[0].questionNumber).toBe(1);
      expect(replayed.review!.items[0].status).toBe("correct");
      expect(replayed.review!.items[1].status).toBe("wrong");
      expect(replayed.review!.items[1].selectedAnswerKey).toBe(wrongKeyForQ2);
      expect(replayed.review!.items[2].status).toBe("skipped");
    } finally {
      await fs.rm(tmpFile, { force: true });
    }
  }, 15_000);
});
