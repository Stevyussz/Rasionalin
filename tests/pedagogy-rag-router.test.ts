import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SocraticTutorService } from "@/application/tutor-service";
import { buildFadedSolutionView, validateEvidenceHighlight } from "@/domain/dual-track-pedagogy";
import { classifyRootCauseDeterministically } from "@/domain/root-cause-rules";
import { scoreHybridRrf } from "@/domain/rrf-scorer";
import { SEED_QUESTIONS } from "@/domain/seed-data";
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
  });
});
