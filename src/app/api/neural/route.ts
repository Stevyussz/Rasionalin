import { NextResponse } from "next/server";
import { getAllKnowledgeForNode, SNBT_KNOWLEDGE_BASE } from "@/domain/snbt-knowledge-base";
import type { SnbtSubtest } from "@/domain/types";
import { checkNineRouterHealth } from "@/infrastructure/ai/nine-router-client";
import { getEffectiveAiConfig } from "@/infrastructure/ai/runtime-config";
import { resolveActiveUser, UnauthorizedError } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import { getUserMemoryBundle } from "@/infrastructure/memory/user-memory-store";
import type { NeuralAiEngineSummary, NeuralCortexPayload } from "@/components/neural/neural-types";

const SUBTESTS: SnbtSubtest[] = ["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"];

function shortModelCode(rawId: string): string {
  const withoutProvider = rawId.includes("/") ? rawId.split("/").slice(1).join("/") : rawId;
  return withoutProvider.length > 18 ? `${withoutProvider.slice(0, 16)}..` : withoutProvider;
}

function inferModelLinkedSubtests(modelId: string): SnbtSubtest[] {
  const lower = modelId.toLowerCase();
  if (/coder|codestral|math|deepseek|qwen.*coder/.test(lower)) return ["PK", "PM", "PU"];
  if (/vision|4o|gemini|vl/.test(lower)) return ["PK", "PM", "PBM"];
  if (/embed/.test(lower)) return ["PPU", "PBM", "LBI", "LBE"];
  return ["PK", "PM", "PU", "LBI", "LBE"];
}

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const aiCfg = getEffectiveAiConfig();

    const [
      nodes,
      edges,
      masteries,
      momentum,
      questions,
      templates,
      chunks,
      dueCards,
      ledger,
      routerHealth,
    ] = await Promise.all([
      repo.listSkillNodes(),
      repo.listSkillEdges(),
      repo.listUserSkillMasteries(user.id),
      repo.getOrInitMomentum(user.id),
      repo.listQuestions({ userId: user.id, qcStatus: "approved" }),
      repo.listActiveTemplates(),
      repo.listVaultChunks(user.id),
      repo.listDueFsrsCards(user.id, new Date().toISOString()),
      repo.listAiRoutingLedger(user.id, 40),
      Promise.race([
        checkNineRouterHealth(),
        new Promise<{
          reachable: boolean;
          baseUrl: string;
          modelsCount: number;
          modelsList: string[];
          error: string | null;
        }>((resolve) =>
          setTimeout(
            () =>
              resolve({
                reachable: false,
                baseUrl: aiCfg.baseUrl,
                modelsCount: 0,
                modelsList: [],
                error: "timeout",
              }),
            2500,
          ),
        ),
      ]),
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

    const tierStats = new Map<string, { count: number; totalLatency: number }>();
    for (const entry of ledger) {
      const prev = tierStats.get(entry.tier) ?? { count: 0, totalLatency: 0 };
      prev.count += 1;
      prev.totalLatency += entry.latencyMs;
      tierStats.set(entry.tier, prev);
    }

    const getTierMetrics = (tier: string) => {
      const stat = tierStats.get(tier);
      if (!stat || stat.count === 0) return { callCount: 0, avgLatencyMs: null };
      return {
        callCount: stat.count,
        avgLatencyMs: Math.round(stat.totalLatency / stat.count),
      };
    };

    const aiStatus: NeuralAiEngineSummary["status"] = routerHealth.reachable ? "online" : "configured";

    const tierConfigs: Array<{
      id: string;
      code: string;
      title: string;
      tier: string;
      modelAlias: string;
      roleSummary: string;
      linkedSubtests: SnbtSubtest[];
    }> = [
      {
        id: "ai:tier:reason",
        code: "AI Reason",
        title: "AI Socratic Reason",
        tier: "TIER-3-REASON",
        modelAlias: aiCfg.models.reason,
        roleSummary: "Penalaran Socratic & Bedah Soal Mendalam",
        linkedSubtests: ["LBI", "LBE", "PBM", "PPU", "PU"],
      },
      {
        id: "ai:tier:codeMath",
        code: "AI Math",
        title: "AI Neuro-Symbolic Math",
        tier: "TIER-4-CODE-MATH",
        modelAlias: aiCfg.models.codeMath,
        roleSummary: "Sintesis Generator Soal QuickJS-WASM",
        linkedSubtests: ["PK", "PM", "PU"],
      },
      {
        id: "ai:tier:vision",
        code: "AI Vision",
        title: "AI Vision OCR & Multimodal",
        tier: "TIER-2-VISION",
        modelAlias: aiCfg.models.vision,
        roleSummary: "Ekstraksi PDF, Grafik & Soal Bergambar",
        linkedSubtests: ["PK", "PM", "PBM"],
      },
      {
        id: "ai:tier:fast",
        code: "AI Fast",
        title: "AI Fast Diagnostic",
        tier: "TIER-1-FAST",
        modelAlias: aiCfg.models.fast,
        roleSummary: "Petunjuk Cepat L1/L2 & Klasifikasi Fraktur",
        linkedSubtests: ["PU", "PPU", "LBI"],
      },
      {
        id: "ai:tier:embed",
        code: "AI RAG",
        title: "AI RAG Semantic Embedder",
        tier: "TIER-0-EMBED",
        modelAlias: aiCfg.models.embed,
        roleSummary: "Hybrid RRF Memori & Brain Vault 1536d",
        linkedSubtests: ["PPU", "PBM", "LBI", "LBE"],
      },
    ];

    const aiNodes: NeuralAiEngineSummary[] = [
      {
        id: "ai:hub",
        kind: "ai_hub",
        code: "9Router AI",
        title: "9Router AI Orchestrator",
        subtitle: `${aiCfg.providerLabel} · ${routerHealth.reachable ? `${routerHealth.modelsCount} model live` : "Fallback siap pakai"} · ${ledger.length} inferensi`,
        tier: "ORCHESTRATOR",
        modelAlias: aiCfg.defaultModel || aiCfg.models.reason,
        status: aiStatus,
        callCount: ledger.length,
        avgLatencyMs:
          ledger.length > 0
            ? Math.round(ledger.reduce((acc, e) => acc + e.latencyMs, 0) / ledger.length)
            : null,
        linkedSubtests: ["PK", "PM", "PU", "PPU", "PBM", "LBI", "LBE"],
      },
      ...tierConfigs.map((cfg) => {
        const metrics = getTierMetrics(cfg.tier);
        const metricSuffix =
          metrics.callCount > 0 && metrics.avgLatencyMs !== null
            ? `${metrics.callCount} panggilan (${metrics.avgLatencyMs}ms)`
            : cfg.roleSummary;
        return {
          id: cfg.id,
          kind: "ai_tier" as const,
          code: cfg.code,
          title: cfg.title,
          subtitle: `${cfg.modelAlias} · ${metricSuffix}`,
          tier: cfg.tier,
          modelAlias: cfg.modelAlias,
          status: routerHealth.reachable ? ("online" as const) : ("fallback" as const),
          callCount: metrics.callCount,
          avgLatencyMs: metrics.avgLatencyMs,
          linkedSubtests: cfg.linkedSubtests,
        };
      }),
    ];

    const candidateModels =
      routerHealth.reachable && routerHealth.modelsList.length > 0
        ? routerHealth.modelsList
        : Array.from(
            new Set([
              ...ledger.map((e) => e.actualModelUsed).filter(Boolean),
              aiCfg.models.reason,
              aiCfg.models.codeMath,
              aiCfg.models.vision,
              aiCfg.models.fast,
              aiCfg.models.embed,
            ]),
          );

    const uniqueModels = Array.from(new Set(candidateModels))
      .filter((id) => id && !/^(none|disabled|off)$/i.test(id))
      .slice(0, 10);

    uniqueModels.forEach((modelId, idx) => {
      const modelCalls = ledger.filter((e) => e.actualModelUsed === modelId);
      const avgMs =
        modelCalls.length > 0
          ? Math.round(modelCalls.reduce((s, e) => s + e.latencyMs, 0) / modelCalls.length)
          : null;
      aiNodes.push({
        id: `ai:model:${idx}`,
        kind: "ai_model",
        code: shortModelCode(modelId),
        title: modelId,
        subtitle: routerHealth.reachable
          ? `Model Live 9Router · ${modelCalls.length > 0 ? `${modelCalls.length}x aktif (${avgMs}ms)` : "Siaga di klaster"}`
          : `Alias Model Konfigurasi (${aiCfg.providerLabel})`,
        tier: "LIVE-MODEL",
        modelAlias: modelId,
        status: aiStatus,
        callCount: modelCalls.length,
        avgLatencyMs: avgMs,
        linkedSubtests: inferModelLinkedSubtests(modelId),
      });
    });

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
        totalAiNodes: aiNodes.length,
        liveAiModelsCount: routerHealth.modelsCount,
        aiCallsCount: ledger.length,
        aiOnline: routerHealth.reachable,
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
      aiNodes,
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
