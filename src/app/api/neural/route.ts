import { NextResponse } from "next/server";
import { getAllKnowledgeForNode, SNBT_KNOWLEDGE_BASE } from "@/domain/snbt-knowledge-base";
import type { SnbtSubtest } from "@/domain/types";
import { resolveActiveUser, UnauthorizedError } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import { getUserMemoryBundle } from "@/infrastructure/memory/user-memory-store";
import type { NeuralCortexPayload } from "@/components/neural/neural-types";

const SUBTESTS: SnbtSubtest[] = ["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"];

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const [nodes, edges, masteries, momentum, questions, templates, chunks, dueCards] =
      await Promise.all([
        repo.listSkillNodes(),
        repo.listSkillEdges(),
        repo.listUserSkillMasteries(user.id),
        repo.getOrInitMomentum(user.id),
        repo.listQuestions({ userId: user.id, qcStatus: "approved" }),
        repo.listActiveTemplates(),
        repo.listVaultChunks(user.id),
        repo.listDueFsrsCards(user.id, new Date().toISOString()),
      ]);

    const memoryBundle = getUserMemoryBundle(user.id, user.displayName);

    const masteryMap = new Map(masteries.map((m) => [m.skillNodeId, m]));

    const questionCountByNode = new Map<string, number>();
    const questionCountBySubtest: Record<SnbtSubtest, number> = {
      PU: 0,
      PPU: 0,
      PBM: 0,
      PK: 0,
      LBI: 0,
      LBE: 0,
      PM: 0,
    };

    for (const q of questions) {
      questionCountByNode.set(q.skillNodeId, (questionCountByNode.get(q.skillNodeId) ?? 0) + 1);
      if (SUBTESTS.includes(q.subtest)) {
        questionCountBySubtest[q.subtest] += 1;
      }
    }

    const templateCountByNode = new Map<string, number>();
    for (const tpl of templates) {
      templateCountByNode.set(tpl.skillNodeId, (templateCountByNode.get(tpl.skillNodeId) ?? 0) + 1);
    }

    let masteredNodes = 0;
    let inProgressNodes = 0;
    for (const node of nodes) {
      const m = masteryMap.get(node.id);
      if (m?.status === "mastered" || m?.status === "soft_passed") masteredNodes += 1;
      else if (m?.status === "in_progress" || m?.status === "foundation_fracture") {
        inProgressNodes += 1;
      }
    }

    const skillNodes = [...nodes]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((node) => {
        const mastery = masteryMap.get(node.id);
        const kbList = getAllKnowledgeForNode(node.id);
        const priorityLevel = kbList[0]?.priorityLevel ?? 6;
        return {
          id: node.id,
          code: node.code,
          subtest: node.subtest,
          track: node.track,
          tier: node.tier,
          titleId: node.titleId,
          masteryScore: Math.round((mastery?.masteryScore ?? 0) * 100),
          masteryStatus: mastery?.status ?? "locked",
          questionCount: questionCountByNode.get(node.id) ?? 0,
          knowledgeCount: kbList.length,
          templateCount: templateCountByNode.get(node.id) ?? 0,
          priorityLevel,
        };
      });

    const knowledgeNodes = SNBT_KNOWLEDGE_BASE.map((entry) => ({
      id: entry.id,
      skillNodeId: entry.skillNodeId,
      subtest: entry.subtest,
      topicTitle: entry.topicTitle,
      priorityLevel: entry.priorityLevel,
      chapterGroup: entry.chapterGroup ?? null,
    }));

    const templateNodes = templates.map((tpl) => ({
      id: tpl.id,
      skillNodeId: tpl.skillNodeId,
      subtest: tpl.subtest,
      templateTitle: tpl.templateTitle,
    }));

    const combinedMemory: NeuralCortexPayload["memoryNodes"] = [
      ...memoryBundle.notes.slice(0, 14).map((note) => ({
        id: `mem-${note.id}`,
        kind: "memory" as const,
        subtest: note.subtest,
        title: note.title,
        pinned: note.pinnedForAi,
      })),
      ...chunks.slice(0, 12).map((chunk) => ({
        id: `vault-${chunk.id}`,
        kind: "vault" as const,
        subtest: chunk.subtest,
        title: chunk.methodLabel || chunk.chunkType,
        pinned: chunk.isUserPriority,
      })),
    ].slice(0, 24);

    const payload: NeuralCortexPayload = {
      user: {
        displayName: memoryBundle.persona.nickname || user.displayName,
        targetScore: user.targetScore,
        targetMajor: memoryBundle.persona.targetGoal || user.targetMajor || null,
      },
      momentum: {
        estimatedIrtComposite: momentum.estimatedIrtComposite,
        precisionComboCurrent: momentum.precisionComboCurrent,
        subtestIrtScores: momentum.subtestIrtScores,
      },
      stats: {
        totalQuestions: questions.length,
        totalKnowledge: knowledgeNodes.length,
        totalNodes: skillNodes.length,
        totalTemplates: templateNodes.length,
        totalMemories: memoryBundle.notes.length,
        totalVaultChunks: chunks.length,
        masteredNodes,
        inProgressNodes,
        dueFsrsCount: dueCards.length,
        bySubtest: questionCountBySubtest,
      },
      skillNodes,
      edges: edges.map((e) => ({
        parentNodeId: e.parentNodeId,
        childNodeId: e.childNodeId,
        edgeType: e.edgeType,
      })),
      knowledgeNodes,
      templateNodes,
      memoryNodes: combinedMemory,
    };

    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat jaringan neural." },
      { status: 500 },
    );
  }
}
