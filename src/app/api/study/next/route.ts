import { NextRequest, NextResponse } from "next/server";
import { StudyService } from "@/application/study-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET(req: NextRequest) {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const { searchParams } = req.nextUrl;

    const interleaved = searchParams.get("mode") === "interleaved";
    const excludeSkillNodeIds = (searchParams.get("excludeNodeIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const excludeQuestionIds = (searchParams.get("excludeQuestionIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const study = new StudyService(repo);
    const payload = await study.selectNextStudyItem({
      userId: user.id,
      questionId: searchParams.get("questionId"),
      skillNodeId: searchParams.get("skillNodeId"),
      fractureId: searchParams.get("fractureId"),
      interleaved,
      excludeSkillNodeIds,
      excludeQuestionIds,
    });

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat soal latihan." },
      { status: 404 },
    );
  }
}
