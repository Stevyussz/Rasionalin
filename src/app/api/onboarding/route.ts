import { NextResponse } from "next/server";
import type { SnbtSubtest } from "@/domain/types";
import { resolveActiveUser, UnauthorizedError } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import { getUserMemoryBundleAsync } from "@/infrastructure/memory/user-memory-store";

const DIAGNOSTIC_SUBTEST_ORDER: SnbtSubtest[] = ["PK", "PU", "PM", "LBI", "LBE", "PBM", "PPU"];

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const [nodes, questions, memoryBundle] = await Promise.all([
      repo.listSkillNodes(),
      repo.listQuestions({ userId: user.id, qcStatus: "approved" }),
      getUserMemoryBundleAsync(user.id, user.displayName),
    ]);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const diagnosticQuestions = DIAGNOSTIC_SUBTEST_ORDER.map((subtest) => {
      const pool = questions.filter((q) => q.subtest === subtest && q.options.length >= 4);
      if (pool.length === 0) return null;

      const sorted = [...pool].sort((a, b) => {
        const tierRank = (t: string) =>
          t === "tier_0_foundation" ? 0 : t === "tier_1_core" ? 1 : t === "tier_2_standard" ? 2 : 3;
        const aScore =
          tierRank(a.tier) * 1000 +
          (a.stemMarkdown.length <= 650 ? 0 : 300) +
          ((a.passageText?.length ?? 0) <= 950 ? 0 : 300) +
          a.stemMarkdown.length * 0.1;
        const bScore =
          tierRank(b.tier) * 1000 +
          (b.stemMarkdown.length <= 650 ? 0 : 300) +
          ((b.passageText?.length ?? 0) <= 950 ? 0 : 300) +
          b.stemMarkdown.length * 0.1;
        return aScore - bScore || a.id.localeCompare(b.id);
      });

      const picked = sorted[0];
      const skillNode = nodeMap.get(picked.skillNodeId);

      return {
        id: picked.id,
        subtest: picked.subtest,
        skillNodeId: picked.skillNodeId,
        skillTitle: skillNode?.titleId ?? subtest,
        tier: picked.tier,
        stemMarkdown: picked.stemMarkdown,
        passageText: picked.passageText,
        options: picked.options.map((opt) => ({
          key: opt.key,
          textMarkdown: opt.textMarkdown,
        })),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        targetScore: user.targetScore,
        targetMajor: user.targetMajor,
        examDate: user.examDate,
        diagnosticCompleted: user.diagnosticCompleted,
      },
      persona: memoryBundle.persona,
      questions: diagnosticQuestions,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat kalibrasi awal." },
      { status: 500 },
    );
  }
}
