import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { StudyService } from "@/application/study-service";
import { SEED_QUESTIONS, SEED_SKILL_NODES } from "@/domain/seed-data";
import { buildWeeklyStudyRoadmap } from "@/domain/weekly-roadmap";
import { LocalJsonRepository } from "@/infrastructure/db/memory/local-repository";

describe("Weekly Study Roadmap, Interleaved Sprint & Fast Study Submission", () => {
  it("allocates all unmastered curriculum nodes cleanly from H-XXX to H-0 with final taper weeks", () => {
    const masteries = SEED_SKILL_NODES.map((n, idx) => ({
      id: `m-${idx}`,
      userId: "u-test",
      skillNodeId: n.id,
      status: "in_progress" as const,
      masteryScore: 0.2,
      currentFadingStage: "full_worked" as const,
      attemptsTotal: 0,
      attemptsCorrect: 0,
      rollingAccuracy10: 0,
      medianSolveMs: null,
      interleavePriority: 0,
      recoveryShieldActive: n.isFoundationRepair,
      lastPracticedAt: null,
      masteredAt: null,
      updatedAt: new Date().toISOString(),
    }));

    const now = new Date("2026-11-25T08:00:00+07:00");
    const roadmap = buildWeeklyStudyRoadmap({
      examDate: "2027-05-18",
      targetScore: 800,
      nodes: SEED_SKILL_NODES,
      masteries,
      weakSubtests: ["PK", "PM"],
      studyPace: "kejar_cepat",
      now,
    });

    expect(roadmap.totalNodesCount).toBe(38);
    expect(roadmap.remainingNodesCount).toBe(38);
    expect(roadmap.weeks.length).toBeGreaterThanOrEqual(20);
    expect(roadmap.weeks[0].isCurrentWeek).toBe(true);
    expect(roadmap.weeks[0].phase).toBe("foundation");

    const lastWeek = roadmap.weeks[roadmap.weeks.length - 1];
    expect(lastWeek.phase).toBe("final_taper");

    const scheduledNodeIds = roadmap.weeks.flatMap((wk) => wk.nodes.map((n) => n.id));
    expect(scheduledNodeIds).toHaveLength(38);
    expect(new Set(scheduledNodeIds).size).toBe(38);
    expect(JSON.stringify(roadmap)).not.toContain("\u2014");
  });

  it("rotates skill nodes during Interleaved Sprint and records attempts quickly offline", async () => {
    const tmpFile = path.join(os.tmpdir(), `rasionalin-interleave-${Date.now()}.json`);
    const repo = new LocalJsonRepository(tmpFile);
    const owner = await repo.ensureDefaultOwnerUser();
    const study = new StudyService(repo);

    try {
      const first = await study.selectNextStudyItem({
        userId: owner.id,
        interleaved: true,
      });
      expect(first.selectionReason).toContain("Interleaved Sprint");

      const second = await study.selectNextStudyItem({
        userId: owner.id,
        interleaved: true,
        excludeSkillNodeIds: [first.skillNode.id],
        excludeQuestionIds: [first.question.id],
      });
      expect(second.skillNode.id).not.toBe(first.skillNode.id);
      expect(second.question.id).not.toBe(first.question.id);

      const fullQ = SEED_QUESTIONS.find((q) => q.id === first.question.id)!;
      const wrongKey = (["A", "B", "C", "D", "E"] as const).find(
        (k) => k !== fullQ.correctAnswerKey,
      )!;

      const t0 = Date.now();
      const submitted = await study.submitAttempt({
        userId: owner.id,
        questionId: first.question.id,
        attemptMode: "skill_drill",
        selectedAnswerKey: wrongKey,
        timeToSolveMs: 14000,
      });
      const elapsedMs = Date.now() - t0;

      expect(submitted.isCorrect).toBe(false);
      expect(elapsedMs).toBeLessThan(1500);
    } finally {
      await fs.rm(tmpFile, { force: true });
    }
  }, 15_000);
});
