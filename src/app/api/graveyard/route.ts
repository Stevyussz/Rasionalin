import { NextRequest, NextResponse } from "next/server";
import type { FractureStatus, RootCauseType } from "@/domain/types";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET(req: NextRequest) {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const statusParam = req.nextUrl.searchParams.get("status") as FractureStatus | null;
    const rootCauseParam = req.nextUrl.searchParams.get("rootCause") as RootCauseType | null;

    const [fractures, nodes, dueCards, questions, templates, recentRuns] = await Promise.all([
      repo.listMistakeFractures(user.id, {
        status: statusParam ?? undefined,
        rootCause: rootCauseParam ?? undefined,
      }),
      repo.listSkillNodes(),
      repo.listDueFsrsCards(user.id, new Date().toISOString()),
      repo.listQuestions({ userId: user.id, qcStatus: "approved" }),
      repo.listActiveTemplates(),
      repo.listVerificationRuns(12),
    ]);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const enriched = await Promise.all(
      fractures.map(async (f) => {
        const card = f.fsrsCardId ? await repo.getFsrsCardById(f.fsrsCardId) : null;
        const originQ = questionMap.get(f.originQuestionId);
        const node = nodeMap.get(f.skillNodeId);
        return {
          ...f,
          skillCode: node?.code ?? "SNBT",
          skillTitle: node?.titleId ?? "Konsep SNBT",
          subtest: node?.subtest ?? "PK",
          originStemPreview: originQ?.stemMarkdown.slice(0, 140) ?? "",
          fsrsDue: card?.due ?? null,
          fsrsStability: card?.stability ?? 0,
        };
      }),
    );

    return NextResponse.json({
      fractures: enriched,
      dueCount: dueCards.length,
      templates,
      recentRuns,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat antrean pemulihan." },
      { status: 500 },
    );
  }
}
