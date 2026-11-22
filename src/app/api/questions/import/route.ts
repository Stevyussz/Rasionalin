import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTrackForSubtest, type QuestionEntity } from "@/domain/types";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import { validateMarkdownWithKatex } from "@/infrastructure/sandbox/outer-verifier";

const ImportQuestionItemSchema = z.object({
  subtest: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]),
  skillNodeId: z.string().uuid().optional(),
  tier: z
    .enum(["tier_0_foundation", "tier_1_core", "tier_2_standard", "tier_3_hots_800"])
    .default("tier_1_core"),
  stemMarkdown: z.string().min(8),
  passageText: z.string().nullable().optional(),
  options: z
    .array(
      z.object({
        key: z.enum(["A", "B", "C", "D", "E"]),
        textMarkdown: z.string().min(1),
        distractorRationale: z.string().optional(),
      }),
    )
    .length(5),
  correctAnswerKey: z.enum(["A", "B", "C", "D", "E"]),
  officialSolutionMarkdown: z.string().min(8),
});

const ImportPayloadSchema = z.object({
  items: z.array(ImportQuestionItemSchema).min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const body = ImportPayloadSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const nodes = await repo.listSkillNodes();
    const nowIso = new Date().toISOString();

    const importedIds: string[] = [];
    const rejected: Array<{ index: number; reason: string }> = [];

    for (let i = 0; i < body.items.length; i += 1) {
      const raw = body.items[i];
      const stemCheck = validateMarkdownWithKatex(raw.stemMarkdown);
      if (!stemCheck.valid) {
        rejected.push({ index: i, reason: `KaTeX error pada stem: ${stemCheck.error}` });
        continue;
      }

      const solCheck = validateMarkdownWithKatex(raw.officialSolutionMarkdown);
      if (!solCheck.valid) {
        rejected.push({ index: i, reason: `KaTeX error pada pembahasan: ${solCheck.error}` });
        continue;
      }

      const targetNode =
        (raw.skillNodeId ? nodes.find((n) => n.id === raw.skillNodeId) : null) ??
        nodes.find((n) => n.subtest === raw.subtest && n.tier === raw.tier) ??
        nodes.find((n) => n.subtest === raw.subtest) ??
        nodes[0];

      const passageSentences = raw.passageText
        ? raw.passageText
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((text, idx) => ({ id: `S${idx + 1}`, paragraph: 1, text }))
        : null;

      const entity: QuestionEntity = {
        id: crypto.randomUUID(),
        ownerUserId: user.id,
        skillNodeId: targetNode.id,
        subtest: raw.subtest,
        track: getTrackForSubtest(raw.subtest),
        tier: raw.tier,
        sourceType: "brain_vault_extracted",
        sourceDocumentId: null,
        sourcePageId: null,
        parentQuestionId: null,
        templateId: null,
        verificationRunId: null,
        format: "mcq_single",
        qcStatus: "approved",
        stemMarkdown: raw.stemMarkdown,
        stemLatex: null,
        passageText: raw.passageText ?? null,
        passageSentences,
        evidenceSentenceIds: passageSentences && passageSentences.length > 0 ? ["S1"] : [],
        diagramAssetUrl: null,
        diagramAltText: null,
        options: raw.options.map((o) => ({
          key: o.key,
          textMarkdown: o.textMarkdown,
          latex: null,
          trapType: o.key === raw.correctAnswerKey ? "none" : "formula_misapplication",
          distractorRationale:
            o.distractorRationale?.trim() ||
            (o.key === raw.correctAnswerKey
              ? "Jawaban tepat sesuai pembahasan."
              : "Periksa ulang langkah pada pembahasan resmi."),
        })),
        correctAnswerKey: raw.correctAnswerKey,
        officialSolutionMarkdown: raw.officialSolutionMarkdown,
        solutionSteps: [
          {
            stage: "solve",
            title: "Pembahasan Terimpor",
            instructionMarkdown: raw.officialSolutionMarkdown,
            formulaLatex: null,
          },
        ],
        sbiDeconstruction: null,
        irtDifficultyB: 0,
        irtDiscriminationA: 1.1,
        irtGuessingC: 0.2,
        expectedSolveSeconds: targetNode.targetSolveSeconds,
        createdAt: nowIso,
      };

      await repo.saveQuestion(entity);
      importedIds.push(entity.id);
    }

    return NextResponse.json({
      ok: true,
      importedCount: importedIds.length,
      importedIds,
      rejected,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Format impor soal tidak valid." },
      { status: 400 },
    );
  }
}
