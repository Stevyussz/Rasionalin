import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTrackForSubtest, type DifficultyTier, type QuestionEntity } from "@/domain/types";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import { validateMarkdownWithKatex } from "@/infrastructure/sandbox/outer-verifier";

const DrillSaveItemSchema = z.object({
  strategyTag: z.string().min(1).max(120),
  difficultyTier: z
    .enum(["tier_0_foundation", "tier_1_core", "tier_2_standard", "tier_3_hots_800"])
    .default("tier_2_standard"),
  passageText: z.string().max(4000).nullable().optional(),
  stemMarkdown: z.string().min(8).max(2000),
  options: z
    .array(
      z.object({
        key: z.enum(["A", "B", "C", "D", "E"]),
        textMarkdown: z.string().min(1).max(500),
        distractorRationale: z.string().max(400).optional(),
      }),
    )
    .length(5),
  correctAnswerKey: z.enum(["A", "B", "C", "D", "E"]),
  whySolutionMarkdown: z.string().min(8).max(2500),
});

const SaveDrillsBodySchema = z.object({
  subtest: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]),
  skillNodeId: z.string().uuid(),
  drills: z.array(DrillSaveItemSchema).min(1).max(5),
});

function difficultyBForTier(tier: DifficultyTier): number {
  switch (tier) {
    case "tier_0_foundation":
      return -0.8;
    case "tier_1_core":
      return -0.2;
    case "tier_2_standard":
      return 0.4;
    case "tier_3_hots_800":
      return 1.2;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = SaveDrillsBodySchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const nodes = await repo.listSkillNodes();
    const resolvedNode =
      nodes.find((n) => n.id === body.skillNodeId) ??
      nodes.find((n) => n.subtest === body.subtest) ??
      nodes[0];

    if (!resolvedNode) {
      return NextResponse.json({ error: "Node kurikulum tidak ditemukan." }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const questionIds: string[] = [];
    let rejectedCount = 0;

    for (const raw of body.drills) {
      const stemCheck = validateMarkdownWithKatex(raw.stemMarkdown);
      const solCheck = validateMarkdownWithKatex(raw.whySolutionMarkdown);
      if (!stemCheck.valid || !solCheck.valid) {
        rejectedCount += 1;
        continue;
      }

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
        skillNodeId: resolvedNode.id,
        subtest: body.subtest,
        track: getTrackForSubtest(body.subtest),
        tier: raw.difficultyTier,
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
              : "Periksa ulang analisis pada pembahasan."),
        })),
        correctAnswerKey: raw.correctAnswerKey,
        officialSolutionMarkdown: raw.whySolutionMarkdown,
        solutionSteps: [
          {
            stage: "solve",
            title: raw.strategyTag || "Pembahasan Custom AI",
            instructionMarkdown: raw.whySolutionMarkdown,
            formulaLatex: null,
          },
        ],
        sbiDeconstruction: null,
        irtDifficultyB: difficultyBForTier(raw.difficultyTier),
        irtDiscriminationA: 1.15,
        irtGuessingC: 0.2,
        expectedSolveSeconds: resolvedNode.targetSolveSeconds,
        createdAt: nowIso,
      };

      await repo.saveQuestion(entity);
      questionIds.push(entity.id);
    }

    return NextResponse.json(
      {
        savedCount: questionIds.length,
        rejectedCount,
        questionIds,
        skillNodeId: resolvedNode.id,
        studyHref: `/study?skillNodeId=${resolvedNode.id}&mode=practice`,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Gagal menyimpan paket grilling ke bank soal pribadi.",
      },
      { status: 400 },
    );
  }
}
