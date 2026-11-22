import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createInitialFsrsCard, scheduleFsrsReview } from "@/domain/fsrs-scheduler";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const RecallRateSchema = z.object({
  skillNodeId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
});

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const [nodes, fractures] = await Promise.all([
      repo.listSkillNodes(),
      repo.listMistakeFractures(user.id),
    ]);

    const activeFractureNodes = new Set(
      fractures.filter((f) => f.status !== "healed").map((f) => f.skillNodeId),
    );

    const cards = await Promise.all(
      nodes.map((node) =>
        repo.findFsrsCard({
          userId: user.id,
          skillNodeId: node.id,
          questionId: null,
          cardScope: "skill_concept",
        }),
      ),
    );

    const now = Date.now();
    const deck = nodes.map((node, idx) => {
      const card = cards[idx];
      const isDue = card ? new Date(card.due).getTime() <= now : node.isFoundationRepair;
      return {
        skillNodeId: node.id,
        subtest: node.subtest,
        titleId: node.titleId,
        tier: node.tier,
        isFoundationRepair: node.isFoundationRepair,
        hasActiveFracture: activeFractureNodes.has(node.id),
        promptQuestion: `Tanpa melihat catatan, jelaskan MENGAPA aturan utama pada "${node.titleId}" bisa bekerja dan langkah pertamanya!`,
        whyAnswer: node.firstPrinciplesSummary,
        deepContext: node.descriptionMarkdown,
        fsrsState: card?.state ?? "new",
        fsrsDue: card?.due ?? null,
        fsrsReps: card?.reps ?? 0,
        fsrsStability: card?.stability ?? 0,
        isDue,
      };
    });

    deck.sort((a, b) => {
      if (a.hasActiveFracture !== b.hasActiveFracture) return a.hasActiveFracture ? -1 : 1;
      if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
      if (a.isFoundationRepair !== b.isFoundationRepair) return a.isFoundationRepair ? -1 : 1;
      return 0;
    });

    return NextResponse.json({
      dueCount: deck.filter((d) => d.isDue || d.hasActiveFracture).length,
      deck,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat kartu Active Recall." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = RecallRateSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const now = new Date();

    const existing = await repo.findFsrsCard({
      userId: user.id,
      skillNodeId: body.skillNodeId,
      cardScope: "skill_concept",
      questionId: null,
    });

    const card =
      existing ??
      createInitialFsrsCard({
        id: crypto.randomUUID(),
        userId: user.id,
        skillNodeId: body.skillNodeId,
        questionId: null,
        cardScope: "skill_concept",
        now,
      });

    const { nextCard } = scheduleFsrsReview(card, body.rating, now);
    await repo.upsertFsrsCard(nextCard);

    return NextResponse.json({
      ok: true,
      card: nextCard,
      nextDueIso: nextCard.due,
      scheduledDays: nextCard.scheduledDays,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan jadwal Active Recall." },
      { status: 400 },
    );
  }
}
