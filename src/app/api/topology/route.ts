import { NextRequest, NextResponse } from "next/server";
import { buildAdaptiveDailyPlan } from "@/domain/daily-plan";
import { buildWeeklyStudyRoadmap } from "@/domain/weekly-roadmap";
import { resolveActiveUser, UnauthorizedError } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import { getUserMemoryBundleAsync } from "@/infrastructure/memory/user-memory-store";

export async function GET(req: NextRequest) {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const includeDashboard = req.nextUrl.searchParams.get("includeDashboard") === "1";

    const [
      nodes,
      edges,
      masteries,
      momentum,
      dueCards,
      conceptCards,
      recentAttempts,
      memoryBundle,
    ] = await Promise.all([
      repo.listSkillNodes(),
      repo.listSkillEdges(),
      repo.listUserSkillMasteries(user.id),
      repo.getOrInitMomentum(user.id),
      repo.listDueFsrsCards(user.id, new Date().toISOString()),
      repo.listUserConceptFsrsCards(user.id),
      includeDashboard ? repo.listUserAttempts(user.id, { limit: 30 }) : Promise.resolve([]),
      includeDashboard ? getUserMemoryBundleAsync(user.id, user.displayName) : Promise.resolve(null),
    ]);

    const conceptStabilityMap = new Map<string, { stability: number; retrievability: number }>();
    for (const card of conceptCards) {
      conceptStabilityMap.set(card.skillNodeId, {
        stability: card.stability,
        retrievability: card.retrievabilitySnapshot ?? 1,
      });
    }

    if (!includeDashboard || !memoryBundle) {
      return NextResponse.json({
        nodes,
        edges,
        masteries,
        momentum,
        dueFsrsCount: dueCards.length,
        conceptStability: Object.fromEntries(conceptStabilityMap),
      });
    }

    const dailyPlan = buildAdaptiveDailyPlan({
      user,
      momentum,
      nodes,
      masteries,
      dueFsrsCount: dueCards.length,
      recentAttempts,
      weakSubtests: memoryBundle.persona.weakSubtests,
      studyPace: memoryBundle.persona.studyPace,
    });

    const weeklyRoadmap = buildWeeklyStudyRoadmap({
      examDate: user.examDate,
      targetScore: user.targetScore,
      nodes,
      masteries,
      weakSubtests: memoryBundle.persona.weakSubtests,
      studyPace: memoryBundle.persona.studyPace,
    });

    return NextResponse.json({
      nodes,
      edges,
      masteries,
      momentum,
      dueFsrsCount: dueCards.length,
      conceptStability: Object.fromEntries(conceptStabilityMap),
      user: {
        id: user.id,
        displayName: user.displayName,
        targetScore: user.targetScore,
        targetMajor: user.targetMajor,
        examDate: user.examDate,
        diagnosticCompleted: user.diagnosticCompleted,
      },
      dailyPlan,
      weeklyRoadmap,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat peta penguasaan." },
      { status: 500 },
    );
  }
}
