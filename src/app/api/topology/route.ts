import { NextResponse } from "next/server";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const [nodes, edges, masteries, momentum, dueCards, conceptCards] = await Promise.all([
      repo.listSkillNodes(),
      repo.listSkillEdges(),
      repo.listUserSkillMasteries(user.id),
      repo.getOrInitMomentum(user.id),
      repo.listDueFsrsCards(user.id, new Date().toISOString()),
      repo.listUserConceptFsrsCards(user.id),
    ]);

    const conceptStabilityMap = new Map<string, { stability: number; retrievability: number }>();
    for (const card of conceptCards) {
      conceptStabilityMap.set(card.skillNodeId, {
        stability: card.stability,
        retrievability: card.retrievabilitySnapshot ?? 1,
      });
    }

    return NextResponse.json({
      nodes,
      edges,
      masteries,
      momentum,
      dueFsrsCount: dueCards.length,
      conceptStability: Object.fromEntries(conceptStabilityMap),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat peta penguasaan." },
      { status: 500 },
    );
  }
}
