import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SocraticTutorService } from "@/application/tutor-service";
import { buildFadedSolutionView, validateEvidenceHighlight } from "@/domain/dual-track-pedagogy";
import { MICRO_LESSONS_BY_NODE_ID } from "@/domain/micro-lessons";
import { classifyRootCauseDeterministically } from "@/domain/root-cause-rules";
import { scoreHybridRrf } from "@/domain/rrf-scorer";
import { SEED_QUESTIONS, SEED_SKILL_NODES } from "@/domain/seed-data";
import { searchSnbtKnowledgeBase, SNBT_KNOWLEDGE_BASE } from "@/domain/snbt-knowledge-base";
import { LocalJsonRepository } from "@/infrastructure/db/memory/local-repository";

describe("Dual-Track Pedagogy, Hybrid RRF 1.35x Boost & Socratic Fallback", () => {
  it("enforces Evidence-First Highlighting Gate on Literacy questions", () => {
    const lbiQ = SEED_QUESTIONS.find((q) => q.subtest === "LBI")!;
    const wrong = validateEvidenceHighlight(lbiQ, ["S1"]);
    expect(wrong.passed).toBe(false);

    const right = validateEvidenceHighlight(lbiQ, ["S4"]);
    expect(right.passed).toBe(true);
  });

  it("applies progressive Faded Worked Examples across stages", () => {
    const pkQ = SEED_QUESTIONS.find((q) => q.subtest === "PK")!;
    expect(buildFadedSolutionView(pkQ.solutionSteps, "full_worked").every((s) => !s.masked)).toBe(true);

    const missingLast = buildFadedSolutionView(pkQ.solutionSteps, "missing_final_step");
    expect(missingLast[0].masked).toBe(false);
    expect(missingLast[missingLast.length - 1].masked).toBe(true);

    const independent = buildFadedSolutionView(pkQ.solutionSteps, "independent");
    expect(independent.every((s) => s.masked)).toBe(true);
  });

  it("prioritizes user Brain Vault chunks with 1.35x RRF boost", () => {
    const scored = scoreHybridRrf([
      { id: "default-note", denseRank: 1, sparseRank: 1, cosineSimilarity: 0.85, isUserPriority: false },
      { id: "user-vault", denseRank: 1, sparseRank: 1, cosineSimilarity: 0.85, isUserPriority: true },
    ]);

    expect(scored[0].id).toBe("user-vault");
    expect(scored[0].rrfScore).toBeCloseTo(scored[1].rrfScore * 1.35, 5);
    expect(scored[0].passesCitationGate).toBe(true);
  });

  it("surfaces Brain Vault rumus cepat with 1-line boundary warning in Socratic L1 fallback", async () => {
    const tmpFile = path.join(os.tmpdir(), `kejarsnbt-tutor-${Date.now()}.json`);
    const repo = new LocalJsonRepository(tmpFile);
    const owner = await repo.ensureDefaultOwnerUser();

    try {
      const rateQ = SEED_QUESTIONS.find((q) => q.id === "20000000-0000-4000-8000-000000000004")!;
      const tutor = new SocraticTutorService(repo);
      const hint = await tutor.getProgressiveHint({
        userId: owner.id,
        questionId: rateQ.id,
        hintLevel: "L1_vault_nudge",
      });

      expect(hint.groundedInUserVault).toBe(true);
      expect(hint.citedChunks.length).toBeGreaterThan(0);
      expect(hint.boundaryConditionWarning).toMatch(/kecepatan tiap pekerja/i);
      expect(hint.hintMarkdown).toMatch(/Brain Vault/i);

      const rc = classifyRootCauseDeterministically({
        track: "quantitative",
        tier: "tier_2_standard",
        timeToSolveMs: 14000,
        expectedSolveSeconds: 65,
        hintsUsedCount: 0,
        evidenceMatchPassed: null,
        distractorTrap: "sign_error",
        hasPrerequisiteFracture: false,
      });
      expect(rc.primaryRootCause).toBe("careless_time_panic");
    } finally {
      await fs.rm(tmpFile, { force: true });
    }
  }, 15_000);

  it("covers all 7 SNBT subtests and 38 skill nodes with clean curriculum KB grounding", async () => {
    expect(SEED_SKILL_NODES).toHaveLength(38);
    expect(SEED_QUESTIONS.length).toBeGreaterThanOrEqual(900);

    const subCounts = new Map<string, number>();
    const nodeCounts = new Map<string, number>();
    for (const q of SEED_QUESTIONS) {
      subCounts.set(q.subtest, (subCounts.get(q.subtest) ?? 0) + 1);
      nodeCounts.set(q.skillNodeId, (nodeCounts.get(q.skillNodeId) ?? 0) + 1);
    }

    expect(subCounts.size).toBe(7);
    for (const subtest of ["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"] as const) {
      expect(subCounts.get(subtest) ?? 0).toBeGreaterThanOrEqual(90);
      expect(
        SEED_SKILL_NODES.some((n) => n.subtest === subtest && n.tier === "tier_0_foundation"),
      ).toBe(true);
    }
    expect(
      SEED_SKILL_NODES.some((n) => n.subtest === "LBE" && n.tier === "tier_2_standard"),
    ).toBe(true);

    for (const node of SEED_SKILL_NODES) {
      expect(nodeCounts.get(node.id) ?? 0).toBeGreaterThanOrEqual(8);
      expect(MICRO_LESSONS_BY_NODE_ID[node.id]).toBeDefined();
    }

    expect(SNBT_KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(120);
    const kbNodes = new Set(SNBT_KNOWLEDGE_BASE.map((e) => e.skillNodeId));
    for (const node of SEED_SKILL_NODES) {
      expect(kbNodes.has(node.id)).toBe(true);
    }

    expect(JSON.stringify(SEED_QUESTIONS)).not.toContain("\u2014");

    for (const subtest of ["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"] as const) {
      const kb = searchSnbtKnowledgeBase({ queryText: "strategi dan jebakan", subtest, limit: 2 });
      expect(kb.length).toBeGreaterThan(0);
      expect(kb[0].subtest).toBe(subtest);
    }

    const tmpFile = path.join(os.tmpdir(), `rasionalin-kb-tutor-${Date.now()}.json`);
    const repo = new LocalJsonRepository(tmpFile);
    const owner = await repo.ensureDefaultOwnerUser();
    try {
      const tutor = new SocraticTutorService(repo);
      const reply = await tutor.askInteractiveTutor({
        userId: owner.id,
        subtest: "PPU",
        message: "Jelaskan cara menjawab soal bahasa panda dan jebakannya!",
      });
      expect(reply.whyFirstMarkdown.toLowerCase()).toContain("bahasa panda");
      expect(reply.citedChunks.length).toBeGreaterThan(0);
    } finally {
      await fs.rm(tmpFile, { force: true });
    }
  }, 15_000);
});
