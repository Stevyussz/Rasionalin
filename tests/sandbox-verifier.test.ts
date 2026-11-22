import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NeuroSymbolicService } from "@/application/neuro-symbolic-service";
import { SEED_TEMPLATES } from "@/domain/seed-data";
import { LocalJsonRepository } from "@/infrastructure/db/memory/local-repository";
import { validateQuickJsAst } from "@/infrastructure/sandbox/ast-gate";
import { runTrustedOuterVerifier } from "@/infrastructure/sandbox/outer-verifier";
import { QuickJsWasmSandboxDriver } from "@/infrastructure/sandbox/quickjs-wasm-driver";

describe("QuickJS-WASM Sandbox Security & Outer Verifier", () => {
  it("blocks forbidden AST constructs (process, eval, Function, __proto__, while(true))", () => {
    expect(validateQuickJsAst(`function generate(){ return process.env; }`).passed).toBe(false);
    expect(validateQuickJsAst(`function generate(){ return eval("1+1"); }`).passed).toBe(false);
    expect(validateQuickJsAst(`function generate(){ return new Function("return 1")(); }`).passed).toBe(false);
    expect(validateQuickJsAst(`function generate(){ const a = {}; a.__proto__.x = 1; }`).passed).toBe(false);
    expect(validateQuickJsAst(`function generate(){ while(true){} }`).passed).toBe(false);
  });

  it("terminates infinite for-loops cleanly at 500ms CPU interrupt limit", async () => {
    const driver = new QuickJsWasmSandboxDriver();
    const res = await driver.execute(
      `function generate(seed) { for (var i = 0; i < 1e12; i++) { var x = i * seed; } return {}; }`,
      42,
    );
    expect(res.ok).toBe(false);
    expect(res.failureStatus).toBe("failed_timeout");
  }, 8000);

  it("rejects mathematically equivalent distractor collisions (0.5 vs 1/2)", () => {
    const check = runTrustedOuterVerifier({
      params: { a: "1", b: "2" },
      correct: { canonical: "1/2", display_latex: "\\frac{1}{2}" },
      distractors: [
        { canonical: "0.5", display_latex: "0.5", trap_type: "arithmetic_slip", rationale: "Collision test" },
        { canonical: "1/3", display_latex: "\\frac{1}{3}", trap_type: "arithmetic_slip", rationale: "d2" },
        { canonical: "1/4", display_latex: "\\frac{1}{4}", trap_type: "arithmetic_slip", rationale: "d3" },
        { canonical: "2/3", display_latex: "\\frac{2}{3}", trap_type: "arithmetic_slip", rationale: "d4" },
      ],
      feasibility_assertions: [true],
    });
    expect(check.passed).toBe(false);
    expect(check.failureStatus).toBe("failed_math_check");
    expect(check.failureReason).toMatch(/collision/i);
  });

  it("verifies all 3 seeded SNBT templates (PK Fraction, PM Linear, PU SAT) across K=3 seeds", async () => {
    const tmpFile = path.join(os.tmpdir(), `kejarsnbt-sandbox-${Date.now()}.json`);
    const repo = new LocalJsonRepository(tmpFile);
    const owner = await repo.ensureDefaultOwnerUser();
    const ns = new NeuroSymbolicService(repo);

    try {
      for (const tpl of SEED_TEMPLATES) {
        const outcome = await ns.generateVerifiedVariant({
          templateId: tpl.id,
          userId: owner.id,
          seed: 202607,
          verifyMultiSeed: true,
          allowRepair: false,
        });

        expect(outcome.ok).toBe(true);
        expect(outcome.multiSeedPassed).toBe(3);
        expect(outcome.verificationRun?.status).toBe("passed");
        expect(outcome.question?.verificationRunId).toBe(outcome.verificationRun?.id);
        expect(outcome.question?.options).toHaveLength(5);
        expect(outcome.question?.stemMarkdown).not.toMatch(/\{\{[a-zA-Z0-9_]+\}\}/);
      }
    } finally {
      await fs.rm(tmpFile, { force: true });
    }
  }, 15000);
});
