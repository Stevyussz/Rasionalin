import crypto from "node:crypto";
import { SEED_TEMPLATES } from "@/domain/seed-data";
import {
  getTrackForSubtest,
  type MathVerificationRunEntity,
  type QuestionEntity,
  type QuestionTemplateEntity,
  type SolutionStep,
} from "@/domain/types";
import { NineRouterClient } from "@/infrastructure/ai/nine-router-client";
import { NeuroSymbolicTemplateSchema } from "@/infrastructure/ai/schemas";
import type { AppRepository } from "@/infrastructure/db/repository-port";
import { getMathSandboxDriver } from "@/infrastructure/sandbox";
import {
  buildShuffledOptions,
  hydrateTemplateString,
  runTrustedOuterVerifier,
  validateMarkdownWithKatex,
} from "@/infrastructure/sandbox/outer-verifier";

export interface GeneratedQuestionOutcome {
  ok: boolean;
  question: QuestionEntity | null;
  verificationRun: MathVerificationRunEntity | null;
  multiSeedPassed: number;
  failureReason: string | null;
}

export class NeuroSymbolicService {
  constructor(private readonly repo: AppRepository) {}

  async generateVerifiedVariant(params: {
    templateId?: string;
    skillNodeId?: string;
    userId: string;
    parentQuestionId?: string | null;
    seed?: number;
    verifyMultiSeed?: boolean;
    allowRepair?: boolean;
  }): Promise<GeneratedQuestionOutcome> {
    let template: QuestionTemplateEntity | null = null;
    if (params.templateId) {
      template = await this.repo.getTemplateById(params.templateId);
    }
    if (!template && params.skillNodeId) {
      const candidates = await this.repo.listActiveTemplates({ skillNodeId: params.skillNodeId });
      template = candidates[0] ?? null;
    }
    if (!template) {
      const all = await this.repo.listActiveTemplates();
      template = all[0] ?? SEED_TEMPLATES[0];
    }

    const driver = getMathSandboxDriver();
    const baseSeed = params.seed ?? crypto.randomInt(1000, 999999);
    const seedsToTest = params.verifyMultiSeed ? [baseSeed, baseSeed + 101, baseSeed + 202] : [baseSeed];

    let activeTemplate = template;
    let repairCount = 0;
    const maxRepairs = params.allowRepair === false ? 0 : 2;

    while (repairCount <= maxRepairs) {
      let multiSeedPassed = 0;
      let primaryExec: Awaited<ReturnType<typeof driver.execute>> | null = null;
      let lastFailureStatus: MathVerificationRunEntity["status"] = "failed_math_check";
      let lastFailureReason = "Verification failed.";

      for (let i = 0; i < seedsToTest.length; i += 1) {
        const exec = await driver.execute(activeTemplate.generatorCode, seedsToTest[i]);
        if (i === 0) primaryExec = exec;

        if (!exec.ok || !exec.output) {
          lastFailureStatus = exec.failureStatus ?? "failed_math_check";
          lastFailureReason = exec.failureReason ?? "Sandbox execution failed.";
          break;
        }

        const outer = runTrustedOuterVerifier(exec.output);
        if (!outer.passed) {
          lastFailureStatus = outer.failureStatus ?? "failed_math_check";
          lastFailureReason = outer.failureReason ?? "Outer symbolic equivalence verifier rejected output.";
          break;
        }

        try {
          const hydratedStem = hydrateTemplateString(activeTemplate.stemTemplateLatex, exec.output.params);
          const katexCheck = validateMarkdownWithKatex(hydratedStem);
          if (!katexCheck.valid) {
            lastFailureStatus = "failed_math_check";
            lastFailureReason = `Hydrated stem KaTeX error: ${katexCheck.error}`;
            break;
          }
        } catch (err) {
          lastFailureStatus = "failed_math_check";
          lastFailureReason = err instanceof Error ? err.message : "Template hydration failed.";
          break;
        }

        multiSeedPassed += 1;
      }

      if (multiSeedPassed === seedsToTest.length && primaryExec?.ok && primaryExec.output) {
        const out = primaryExec.output;
        const runId = crypto.randomUUID();
        const questionId = crypto.randomUUID();
        const nowIso = new Date().toISOString();

        const hydratedStem = hydrateTemplateString(activeTemplate.stemTemplateLatex, out.params);
        const { options, correctKey } = buildShuffledOptions(out, baseSeed);

        const solutionSteps: SolutionStep[] = activeTemplate.solutionStepTemplates.map((st, idx) => ({
          stage: st.stage,
          title: `Langkah ${idx + 1}`,
          instructionMarkdown: hydrateTemplateString(st.instructionTemplate, out.params),
          formulaLatex: st.formulaTemplateLatex
            ? hydrateTemplateString(st.formulaTemplateLatex, out.params)
            : null,
        }));

        const officialSolution = solutionSteps
          .map((s) =>
            s.formulaLatex
              ? `**${s.title}:** ${s.instructionMarkdown}\n\n$$${s.formulaLatex}$$`
              : `**${s.title}:** ${s.instructionMarkdown}`,
          )
          .join("\n\n");

        const run: MathVerificationRunEntity = {
          id: runId,
          templateId: activeTemplate.id,
          questionId: null,
          sandboxRuntime: driver.runtimeName,
          seedValue: baseSeed,
          codeSha256: activeTemplate.codeSha256,
          status: "passed",
          executionTimeMs: primaryExec.executionTimeMs,
          peakMemoryKb: primaryExec.peakMemoryKb,
          sandboxExitCode: primaryExec.exitCode,
          computedGroundTruthJson: out.correct,
          computedDistractorsJson: out.distractors,
          feasibilityChecksJson: out.feasibility_assertions,
          failureReason: null,
          createdAt: nowIso,
        };

        await this.repo.saveVerificationRun(run);

        const question: QuestionEntity = {
          id: questionId,
          ownerUserId: params.userId,
          skillNodeId: activeTemplate.skillNodeId,
          subtest: activeTemplate.subtest,
          track: getTrackForSubtest(activeTemplate.subtest),
          tier: activeTemplate.tier,
          sourceType: "neuro_symbolic_isomorphic",
          sourceDocumentId: null,
          sourcePageId: null,
          parentQuestionId: params.parentQuestionId ?? activeTemplate.sourceQuestionId,
          templateId: activeTemplate.id,
          verificationRunId: run.id,
          format: "mcq_single",
          qcStatus: "approved",
          stemMarkdown: hydratedStem,
          stemLatex: null,
          passageText: null,
          passageSentences: null,
          evidenceSentenceIds: [],
          diagramAssetUrl: null,
          diagramAltText: null,
          options,
          correctAnswerKey: correctKey,
          officialSolutionMarkdown: officialSolution,
          solutionSteps,
          sbiDeconstruction: {
            schemaType: activeTemplate.sbiSchemaType ?? "verified_isomorphic",
            schemaLabelId: activeTemplate.templateTitle,
            knownVariables: Object.entries(out.params).map(([sym, val]) => ({
              symbol: sym,
              label: sym,
              valueText: val,
            })),
            targetUnknown: "Nilai akhir sesuai pertanyaan",
            baseRelationLatex: solutionSteps[1]?.formulaLatex ?? "",
          },
          irtDifficultyB: activeTemplate.tier === "tier_0_foundation" ? -1.0 : 0.25,
          irtDiscriminationA: 1.35,
          irtGuessingC: 0.2,
          expectedSolveSeconds: 70,
          createdAt: nowIso,
        };

        await this.repo.saveQuestion(question);

        return {
          ok: true,
          question,
          verificationRun: run,
          multiSeedPassed,
          failureReason: null,
        };
      }

      // Record failed verification attempt
      const failedRun: MathVerificationRunEntity = {
        id: crypto.randomUUID(),
        templateId: activeTemplate.id,
        questionId: null,
        sandboxRuntime: driver.runtimeName,
        seedValue: baseSeed,
        codeSha256: activeTemplate.codeSha256,
        status: lastFailureStatus,
        executionTimeMs: primaryExec?.executionTimeMs ?? 0,
        peakMemoryKb: primaryExec?.peakMemoryKb ?? null,
        sandboxExitCode: primaryExec?.exitCode ?? 1,
        computedGroundTruthJson: null,
        computedDistractorsJson: null,
        feasibilityChecksJson: null,
        failureReason: lastFailureReason,
        createdAt: new Date().toISOString(),
      };
      await this.repo.saveVerificationRun(failedRun);

      if (repairCount >= maxRepairs) {
        return {
          ok: false,
          question: null,
          verificationRun: failedRun,
          multiSeedPassed,
          failureReason: lastFailureReason,
        };
      }

      // Bounded 9router repair attempt
      const repaired = await this.attemptCodeRepair(activeTemplate, lastFailureReason, params.userId);
      if (!repaired) {
        return {
          ok: false,
          question: null,
          verificationRun: failedRun,
          multiSeedPassed,
          failureReason: lastFailureReason,
        };
      }
      activeTemplate = repaired;
      repairCount += 1;
    }

    return {
      ok: false,
      question: null,
      verificationRun: null,
      multiSeedPassed: 0,
      failureReason: "Exceeded maximum repair attempts.",
    };
  }

  private async attemptCodeRepair(
    template: QuestionTemplateEntity,
    failureReason: string,
    userId: string,
  ): Promise<QuestionTemplateEntity | null> {
    const client = new NineRouterClient(this.repo);
    const res = await client.invokeStructuredJson({
      taskId: "neuro_symbolic_code_repair",
      userId,
      schema: NeuroSymbolicTemplateSchema,
      schemaName: "neuro_symbolic_template_repair",
      jsonSchema: { type: "object" },
      messages: [
        {
          role: "system",
          content:
            "Perbaiki generator_code JavaScript untuk QuickJS sandbox agar memenuhi AST allowlist, bebas bentrok opsi, dan lolos Fraction/satSolve. Keluarkan JSON sesuai skema.",
        },
        {
          role: "user",
          content: `Failure reason: ${failureReason}\n\nTemplate:\n${JSON.stringify({
            template_title: template.templateTitle,
            subtest: template.subtest,
            tier: template.tier,
            stem_template_latex: template.stemTemplateLatex,
            generator_code: template.generatorCode,
          })}`,
        },
      ],
    });

    if (!res.ok || !res.data) return null;
    const hash = crypto.createHash("sha256").update(res.data.generator_code).digest("hex");
    const updated: QuestionTemplateEntity = {
      ...template,
      stemTemplateLatex: res.data.stem_template_latex,
      generatorCode: res.data.generator_code,
      codeSha256: hash,
      createdByModel: res.modelUsed ?? "snbt-code-math-repair",
    };
    await this.repo.saveTemplate(updated);
    return updated;
  }

  async ensurePreWarmedPool(skillNodeId: string, userId: string): Promise<void> {
    const existing = await this.repo.listQuestions({
      userId,
      skillNodeId,
      qcStatus: "approved",
    });
    const isomorphicCount = existing.filter(
      (q) => q.sourceType === "neuro_symbolic_isomorphic",
    ).length;

    if (isomorphicCount >= 3) return;
    const templates = await this.repo.listActiveTemplates({ skillNodeId });
    if (templates.length === 0) return;

    await this.generateVerifiedVariant({
      templateId: templates[0].id,
      userId,
      verifyMultiSeed: true,
      allowRepair: true,
    });
  }
}
