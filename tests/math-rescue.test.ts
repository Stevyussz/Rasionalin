import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NeuroSymbolicService } from "@/application/neuro-symbolic-service";
import {
  generateMathGymSession,
  MATH_GYM_CATEGORIES,
  type MathGymCategory,
} from "@/domain/math-gym-engine";
import { NODE_IDS } from "@/domain/node-ids";
import {
  buildSbiSchemaChoices,
  deriveSbiDeconstructionForQuestion,
  getSbiGuideForQuestion,
} from "@/domain/sbi-enrichment";
import { SEED_QUESTIONS, SEED_SKILL_NODES } from "@/domain/seed-data";
import { LocalJsonRepository } from "@/infrastructure/db/memory/local-repository";

describe("Paket Math Rescue (SBI Enrichment, Math Gym & PM-T0-UNIT Variant)", () => {
  it("enriches 100% of quantitative SEED_QUESTIONS with non-null sbiDeconstruction and leaves literacy null", () => {
    const quantQuestions = SEED_QUESTIONS.filter((q) => q.track === "quantitative");
    const litQuestions = SEED_QUESTIONS.filter((q) => q.track === "literacy");

    expect(quantQuestions.length).toBeGreaterThanOrEqual(404);
    for (const q of quantQuestions) {
      const sbi = deriveSbiDeconstructionForQuestion(q);
      expect(sbi, `Missing SBI on ${q.id}`).not.toBeNull();
      expect(sbi!.schemaType.length).toBeGreaterThan(2);
      expect(sbi!.schemaLabelId.length).toBeGreaterThan(4);
      expect(sbi!.knownVariables.length).toBeGreaterThanOrEqual(
        q.id.startsWith("21000000-") ? 2 : 1,
      );
      expect(sbi!.targetUnknown.length).toBeGreaterThan(2);
      expect(sbi!.baseRelationLatex.length).toBeGreaterThan(2);
    }

    for (const q of litQuestions) {
      expect(deriveSbiDeconstructionForQuestion(q)).toBeNull();
    }
  });

  it("provides word-problem guides and deduplicated schema choices for all 22 quantitative nodes", () => {
    const quantNodes = SEED_SKILL_NODES.filter((n) => n.track === "quantitative");
    expect(quantNodes).toHaveLength(22);

    for (const node of quantNodes) {
      const guide = getSbiGuideForQuestion(node.id);
      expect(guide.whenToUse.length).toBeGreaterThan(15);
      expect(guide.wordClues.length).toBeGreaterThanOrEqual(3);
      expect(guide.firstStepChecklist.length).toBeGreaterThan(15);
    }

    const sampleQ = SEED_QUESTIONS.find(
      (q) => q.skillNodeId === NODE_IDS.PM_T0_UNIT && q.sbiDeconstruction,
    );
    expect(sampleQ).toBeDefined();
    const choices = buildSbiSchemaChoices(
      sampleQ!.sbiDeconstruction,
      sampleQ!.subtest,
      sampleQ!.id,
    );
    expect(choices.length).toBe(6);
    expect(new Set(choices.map((c) => c.id)).size).toBe(6);
    expect(choices.some((c) => c.id === sampleQ!.sbiDeconstruction!.schemaType)).toBe(true);
  });

  it("generates valid, distinct 4-option Math Gym sprints across every category and mixed mode", () => {
    const categories: MathGymCategory[] = [
      "mixed",
      ...MATH_GYM_CATEGORIES.map((c) => c.id),
    ];

    for (const cat of categories) {
      const questions = generateMathGymSession(cat, 10, 20261125);
      expect(questions).toHaveLength(10);

      for (const q of questions) {
        expect(q.promptMarkdown).not.toMatch(/NaN|Infinity|undefined/);
        expect(q.options).toHaveLength(4);
        const correctOpts = q.options.filter((o) => o.isCorrect);
        expect(correctOpts).toHaveLength(1);
        expect(q.correctKey).toBe(correctOpts[0].key);

        const uniqueLabels = new Set(q.options.map((o) => o.labelLatexOrText.trim()));
        expect(uniqueLabels.size).toBe(4);
        for (const opt of q.options) {
          expect(opt.labelLatexOrText).not.toMatch(/NaN|Infinity|undefined/);
          expect(opt.trapFeedback.length).toBeGreaterThan(8);
        }
        expect(q.stepByStep.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("verifies new PM-T0-UNIT word-problem template across K=3 seeds in QuickJS-WASM", async () => {
    const tmpFile = path.join(os.tmpdir(), `kejarsnbt-pm-unit-${Date.now()}.json`);
    const repo = new LocalJsonRepository(tmpFile);
    const owner = await repo.ensureDefaultOwnerUser();
    const ns = new NeuroSymbolicService(repo);

    try {
      const outcome = await ns.generateVerifiedVariant({
        templateId: "30000000-0000-4000-8000-000000000025",
        skillNodeId: NODE_IDS.PM_T0_UNIT,
        userId: owner.id,
        seed: 20261125,
        verifyMultiSeed: true,
        allowRepair: false,
      });

      expect(outcome.ok).toBe(true);
      expect(outcome.multiSeedPassed).toBe(3);
      expect(outcome.question?.skillNodeId).toBe(NODE_IDS.PM_T0_UNIT);
      expect(outcome.question?.sbiDeconstruction).not.toBeNull();
      expect(outcome.question?.options).toHaveLength(5);
    } finally {
      await fs.rm(tmpFile, { force: true });
    }
  }, 30000);
});
