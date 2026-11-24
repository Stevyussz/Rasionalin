import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrimaryKnowledgeForNode } from "@/domain/snbt-knowledge-base";
import type { SnbtSubtest, UserSkillMastery } from "@/domain/types";
import { resolveActiveUser, UnauthorizedError } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import {
  addUserMemoryNote,
  getUserMemoryBundle,
  updateUserMemoryNote,
  updateUserPersona,
} from "@/infrastructure/memory/user-memory-store";

const SubtestEnum = z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]);

const CompleteOnboardingSchema = z.object({
  skip: z.boolean().optional(),
  nickname: z.string().trim().min(1).max(60).optional(),
  targetMajor: z.string().trim().max(140).optional(),
  targetScore: z.number().int().min(400).max(900).optional(),
  examDate: z.string().trim().max(20).nullable().optional(),
  startingLevel: z.enum(["nol_total", "dasar", "menengah"]).optional(),
  studyPace: z.enum(["santuy_dalam", "seimbang", "kejar_cepat"]).optional(),
  explanationStyle: z
    .enum(["analogi_sehari_hari", "step_by_step_pelan", "ringkas_langsung"])
    .optional(),
  weakSubtests: z.array(SubtestEnum).max(7).optional(),
  personalContext: z.string().trim().max(1200).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        subtest: SubtestEnum,
        skillNodeId: z.string().min(1),
        selectedKey: z.enum(["A", "B", "C", "D", "E"]).nullable(),
        timeMs: z.number().int().min(0).max(3_600_000),
      }),
    )
    .max(14)
    .optional(),
});

const SUBTESTS: SnbtSubtest[] = ["PK", "PU", "PM", "LBI", "LBE", "PBM", "PPU"];

function clampIrt(score: number): number {
  return Math.max(340, Math.min(680, Math.round(score)));
}

export async function POST(req: NextRequest) {
  try {
    const body = CompleteOnboardingSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    if (body.skip) {
      await repo.updateUserProfile(user.id, {
        diagnosticCompleted: true,
        targetScore: body.targetScore ?? user.targetScore,
        targetMajor: body.targetMajor ? body.targetMajor : user.targetMajor,
        examDate: body.examDate !== undefined ? body.examDate || null : user.examDate,
      });

      if (body.nickname || body.studyPace || body.startingLevel || body.explanationStyle) {
        updateUserPersona(
          user.id,
          {
            nickname: body.nickname ?? user.displayName,
            startingLevel: body.startingLevel,
            studyPace: body.studyPace,
            explanationStyle: body.explanationStyle,
            targetGoal: body.targetMajor ?? undefined,
          },
          user.displayName,
        );
      }

      return NextResponse.json({ ok: true, skipped: true });
    }

    const startingLevel = body.startingLevel ?? "dasar";
    const studyPace = body.studyPace ?? "seimbang";
    const explanationStyle = body.explanationStyle ?? "analogi_sehari_hari";
    const targetScore = body.targetScore ?? user.targetScore ?? 800;
    const targetMajor = (body.targetMajor ?? user.targetMajor ?? "").trim();
    const nickname = (body.nickname ?? user.displayName).trim() || user.displayName;
    const examDate = body.examDate ? body.examDate : null;

    await repo.updateUserProfile(user.id, {
      targetScore,
      targetMajor: targetMajor || null,
      examDate,
      diagnosticCompleted: true,
    });

    const [nodes, edges, masteries, momentum] = await Promise.all([
      repo.listSkillNodes(),
      repo.listSkillEdges(),
      repo.listUserSkillMasteries(user.id),
      repo.getOrInitMomentum(user.id),
    ]);

    const masteryByNode = new Map<string, UserSkillMastery>(
      masteries.map((m) => [m.skillNodeId, m]),
    );
    const nowIso = new Date().toISOString();

    const baseIrtByLevel = startingLevel === "nol_total" ? 390 : startingLevel === "dasar" ? 455 : 525;
    const nextSubtestScores: Record<SnbtSubtest, number> = {
      PU: baseIrtByLevel,
      PPU: baseIrtByLevel,
      PBM: baseIrtByLevel,
      PK: baseIrtByLevel,
      LBI: baseIrtByLevel,
      LBE: baseIrtByLevel,
      PM: baseIrtByLevel,
    };

    const answers = body.answers ?? [];
    const gradedResults: Array<{
      subtest: SnbtSubtest;
      skillNodeId: string;
      status: "correct" | "wrong" | "skipped";
      timeMs: number;
    }> = [];

    const weakDetected = new Set<SnbtSubtest>(body.weakSubtests ?? []);
    let fastTrackedNodesCount = 0;

    for (const ans of answers) {
      const question = await repo.getQuestionById(ans.questionId);
      const isSkipped = ans.selectedKey === null;
      const isCorrect =
        !isSkipped && question !== null && ans.selectedKey === question.correctAnswerKey;
      const outcome: "correct" | "wrong" | "skipped" = isSkipped
        ? "skipped"
        : isCorrect
          ? "correct"
          : "wrong";

      gradedResults.push({
        subtest: ans.subtest,
        skillNodeId: ans.skillNodeId,
        status: outcome,
        timeMs: ans.timeMs,
      });

      if (isCorrect) {
        const paceBonus = ans.timeMs <= 75_000 ? 20 : 0;
        nextSubtestScores[ans.subtest] = clampIrt(nextSubtestScores[ans.subtest] + 55 + paceBonus);
      } else {
        weakDetected.add(ans.subtest);
        nextSubtestScores[ans.subtest] = clampIrt(nextSubtestScores[ans.subtest] - 35);
      }
    }

    // Calibrate mastery priorities & fast-track downstream unlocks
    const allowFastTrack = startingLevel === "menengah" || studyPace === "kejar_cepat";

    for (const res of gradedResults) {
      const subNodes = nodes
        .filter((n) => n.subtest === res.subtest)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      const foundationNodes = subNodes.filter((n) => n.tier === "tier_0_foundation");
      const targetNodes = foundationNodes.length > 0 ? foundationNodes : subNodes.slice(0, 1);

      if (res.status !== "correct") {
        for (const fn of targetNodes) {
          const cur = masteryByNode.get(fn.id);
          if (!cur) continue;
          const updated: UserSkillMastery = {
            ...cur,
            status: cur.status === "locked" ? "in_progress" : cur.status,
            interleavePriority: Math.max(cur.interleavePriority, 92),
            updatedAt: nowIso,
          };
          masteryByNode.set(fn.id, updated);
          await repo.upsertUserSkillMastery(updated);
        }
      } else if (allowFastTrack) {
        for (const fn of targetNodes) {
          const cur = masteryByNode.get(fn.id);
          if (!cur || cur.status === "mastered") continue;
          const upgraded: UserSkillMastery = {
            ...cur,
            status: "soft_passed",
            masteryScore: Math.max(cur.masteryScore, 0.76),
            currentFadingStage: "missing_multi_steps",
            interleavePriority: Math.min(cur.interleavePriority, 45),
            updatedAt: nowIso,
          };
          masteryByNode.set(fn.id, upgraded);
          await repo.upsertUserSkillMastery(upgraded);
          fastTrackedNodesCount += 1;

          // Unlock direct children whose hard_prereqs are now met
          const outgoing = edges.filter(
            (e) =>
              e.parentNodeId === fn.id &&
              (e.edgeType === "hard_prereq" || e.edgeType === "soft_prereq"),
          );
          for (const edge of outgoing) {
            const childM = masteryByNode.get(edge.childNodeId);
            if (!childM || childM.status !== "locked") continue;
            const hardParents = edges.filter(
              (e) => e.childNodeId === edge.childNodeId && e.edgeType === "hard_prereq",
            );
            const allMet = hardParents.every((hp) => {
              const pm = masteryByNode.get(hp.parentNodeId);
              return pm && (pm.status === "soft_passed" || pm.status === "mastered");
            });
            if (allMet) {
              const unlockedChild: UserSkillMastery = {
                ...childM,
                status: "in_progress",
                updatedAt: nowIso,
              };
              masteryByNode.set(edge.childNodeId, unlockedChild);
              await repo.upsertUserSkillMastery(unlockedChild);
            }
          }
        }
      }
    }

    // Prioritize any user-flagged weak subtests that weren't in answers yet
    const detectedWeakList = Array.from(weakDetected);
    for (const sub of detectedWeakList) {
      if (!gradedResults.some((r) => r.subtest === sub)) {
        nextSubtestScores[sub] = clampIrt(nextSubtestScores[sub] - 25);
        const firstNode = nodes
          .filter((n) => n.subtest === sub)
          .sort((a, b) => a.displayOrder - b.displayOrder)[0];
        if (firstNode) {
          const cur = masteryByNode.get(firstNode.id);
          if (cur) {
            const boosted: UserSkillMastery = {
              ...cur,
              status: cur.status === "locked" ? "in_progress" : cur.status,
              interleavePriority: Math.max(cur.interleavePriority, 88),
              updatedAt: nowIso,
            };
            masteryByNode.set(firstNode.id, boosted);
            await repo.upsertUserSkillMastery(boosted);
          }
        }
      }
    }

    const compositeIrt = Math.round(
      SUBTESTS.reduce((acc, s) => acc + nextSubtestScores[s], 0) / SUBTESTS.length,
    );

    await repo.saveMomentum({
      ...momentum,
      estimatedIrtComposite: compositeIrt,
      subtestIrtScores: nextSubtestScores,
      updatedAt: nowIso,
    });

    const targetGoalStr = targetMajor
      ? `${targetMajor} · Target ${targetScore}+`
      : `Target IRT ${targetScore}+`;

    updateUserPersona(
      user.id,
      {
        nickname,
        startingLevel,
        studyPace,
        explanationStyle,
        targetGoal: targetGoalStr,
        weakSubtests: detectedWeakList,
        personalContext: body.personalContext ?? "",
      },
      user.displayName,
    );

    const totalCorrect = gradedResults.filter((r) => r.status === "correct").length;
    const totalQuestions = gradedResults.length;
    const diagContent = [
      `Target: ${targetGoalStr}.`,
      `Level awal: ${startingLevel}, Tempo: ${studyPace}, Gaya AI: ${explanationStyle}.`,
      totalQuestions > 0 ? `Hasil mini tes diagnostik: ${totalCorrect}/${totalQuestions} benar.` : "",
      detectedWeakList.length > 0
        ? `Subtes prioritas perbaikan: ${detectedWeakList.join(", ")}.`
        : "Semua subtes awal seimbang.",
      fastTrackedNodesCount > 0
        ? `${fastTrackedNodesCount} materi fondasi langsung di-fast-track ke level inti.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const bundle = getUserMemoryBundle(user.id, user.displayName);
    const existingDiagNote = bundle.notes.find((n) => n.title === "Profil Diagnostik Awal");
    if (existingDiagNote) {
      updateUserMemoryNote(user.id, existingDiagNote.id, {
        content: diagContent,
        subtest: detectedWeakList[0] ?? null,
        pinnedForAi: true,
      });
    } else {
      addUserMemoryNote(
        user.id,
        {
          kind: "memory",
          title: "Profil Diagnostik Awal",
          content: diagContent,
          subtest: detectedWeakList[0] ?? null,
          pinnedForAi: true,
        },
        user.displayName,
      );
    }

    // Pick best first study node (priority weak subtest unlocked node -> fallback Analitica #1)
    const priorityOf = (nodeId: string) => getPrimaryKnowledgeForNode(nodeId)?.priorityLevel ?? 5;
    const unlockedNodes = nodes
      .filter((n) => {
        const st = masteryByNode.get(n.id)?.status;
        return st !== "locked" && st !== "mastered";
      })
      .sort((a, b) => priorityOf(b.id) - priorityOf(a.id) || a.displayOrder - b.displayOrder);

    const firstNode =
      unlockedNodes.find((n) => weakDetected.has(n.subtest)) ??
      unlockedNodes[0] ??
      nodes[0];

    return NextResponse.json({
      ok: true,
      summary: {
        estimatedIrt: compositeIrt,
        totalCorrect,
        totalQuestions,
        subtestResults: SUBTESTS.map((sub) => {
          const found = gradedResults.find((r) => r.subtest === sub);
          return {
            subtest: sub,
            irtScore: nextSubtestScores[sub],
            status: found?.status ?? (weakDetected.has(sub) ? "priority" : "neutral"),
          };
        }),
        weakSubtests: detectedWeakList,
        fastTrackedNodesCount,
        studyPace,
        startingLevel,
        explanationStyle,
        firstRecommendedHref: firstNode
          ? `/study?skillNodeId=${firstNode.id}&mode=lesson`
          : "/study?mode=lesson",
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Data kalibrasi tidak valid." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan kalibrasi awal." },
      { status: 400 },
    );
  }
}
