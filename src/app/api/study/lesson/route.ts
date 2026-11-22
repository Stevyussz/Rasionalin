import { NextRequest, NextResponse } from "next/server";
import { getMicroLessonForNode } from "@/domain/micro-lessons";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET(req: NextRequest) {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const requestedNodeId = req.nextUrl.searchParams.get("skillNodeId");

    const nodes = await repo.listSkillNodes();
    const masteries = await repo.listUserSkillMasteries(user.id);
    const masteryMap = new Map(masteries.map((m) => [m.skillNodeId, m]));

    const node =
      (requestedNodeId ? nodes.find((n) => n.id === requestedNodeId) : null) ??
      nodes.find((n) => masteryMap.get(n.id)?.status === "foundation_fracture") ??
      nodes.find((n) => masteryMap.get(n.id)?.status === "in_progress") ??
      nodes[0];

    if (!node) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    const lesson = getMicroLessonForNode(node.id);
    const mastery = masteryMap.get(node.id) ?? null;

    return NextResponse.json({
      skillNode: node,
      mastery,
      lesson,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat materi pembelajaran." },
      { status: 500 },
    );
  }
}
