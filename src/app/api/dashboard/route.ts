import { NextResponse } from "next/server";
import { buildAdaptiveDailyPlan } from "@/domain/daily-plan";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const [momentum, nodes, masteries, dueCards, fractures, attempts, vaultDocs] = await Promise.all([
      repo.getOrInitMomentum(user.id),
      repo.listSkillNodes(),
      repo.listUserSkillMasteries(user.id),
      repo.listDueFsrsCards(user.id, new Date().toISOString()),
      repo.listMistakeFractures(user.id),
      repo.listUserAttempts(user.id, { limit: 30 }),
      repo.listVaultDocuments(user.id),
    ]);

    const activeFractures = fractures.filter((f) => f.status !== "healed");
    const healedFractures = fractures.filter((f) => f.status === "healed");
    const masteredNodes = masteries.filter((m) => m.status === "mastered").length;
    const softPassedNodes = masteries.filter((m) => m.status === "soft_passed").length;
    const fractureNodes = masteries.filter((m) => m.status === "foundation_fracture").length;

    const dailyPlan = buildAdaptiveDailyPlan({
      user,
      momentum,
      nodes,
      masteries,
      dueFsrsCount: dueCards.length,
      recentAttempts: attempts,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        targetScore: user.targetScore,
        targetMajor: user.targetMajor,
        examDate: user.examDate,
        diagnosticCompleted: user.diagnosticCompleted,
      },
      momentum,
      dailyPlan,
      summary: {
        dueFsrsCount: dueCards.length,
        activeFractureCount: activeFractures.length,
        healedFractureCount: healedFractures.length,
        masteredNodeCount: masteredNodes,
        softPassedNodeCount: softPassedNodes,
        foundationFractureNodeCount: fractureNodes,
        totalNodes: masteries.length,
        totalAttempts: attempts.length,
        vaultDocumentCount: vaultDocs.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat ringkasan dasbor." },
      { status: 500 },
    );
  }
}
