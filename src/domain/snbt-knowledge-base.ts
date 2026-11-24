import rawKnowledgeData from "./snbt-knowledge-data.json";
import { NODE_IDS } from "./seed-data";
import type { SnbtSubtest } from "./types";

export interface SnbtKnowledgeEntry {
  id: string;
  subtest: SnbtSubtest;
  skillNodeId: string;
  topicTitle: string;
  priorityLevel: number;
  priorityBadge: "Wajib Prioritas" | "Sering Muncul" | "Penguat Skor 800";
  chapterGroup?: string;
  sourceLabel: string;
  whyBeforeHow: string;
  keyFormulasLatex: string[];
  shortcutWithBoundary: {
    methodLabel: string;
    shortcutMarkdown: string;
    validityConditions: string;
  } | null;
  utbkTraps: string[];
  keywords: string[];
  quickDrillTip?: string;
}

export const SNBT_KNOWLEDGE_BASE: SnbtKnowledgeEntry[] =
  rawKnowledgeData as SnbtKnowledgeEntry[];

const PRIORITY_NODE_OVERRIDES: Record<string, number> = {
  [NODE_IDS.PK_T0_FRAC]: 10,
  [NODE_IDS.PK_T2_RATE]: 9,
  [NODE_IDS.PK_T2_FUNC]: 10,
  [NODE_IDS.PK_T2_GEO]: 10,
  [NODE_IDS.PK_T3_INEQ]: 10,
  [NODE_IDS.PK_T1_LIN]: 10,
  [NODE_IDS.PK_T2_QUAD]: 9,
  [NODE_IDS.PU_T0_LOG]: 10,
  [NODE_IDS.PU_T1_SYL]: 10,
  [NODE_IDS.PU_T2_ARG]: 10,
  [NODE_IDS.PU_T2_DATA]: 9,
  [NODE_IDS.PBM_T0_EJA]: 10,
  [NODE_IDS.PBM_T1_EFF]: 9,
  [NODE_IDS.PBM_T2_KONJ]: 9,
  [NODE_IDS.PPU_T0_KAL]: 9,
  [NODE_IDS.PPU_T1_SEM]: 10,
  [NODE_IDS.PPU_T2_ASSOC]: 9,
  [NODE_IDS.PPU_T3_PANDA]: 9,
  [NODE_IDS.LBI_T2_INF]: 10,
  [NODE_IDS.LBI_T1_CLAIM]: 9,
  [NODE_IDS.LBE_T0_REF]: 10,
  [NODE_IDS.LBE_T2_SYN]: 9,
  [NODE_IDS.LBE_T3_EVAL]: 9,
  [NODE_IDS.PM_T3_GEOM]: 10,
  [NODE_IDS.PM_T2_LIN]: 9,
};

export function getPrimaryKnowledgeForNode(skillNodeId: string): SnbtKnowledgeEntry | null {
  const matches = SNBT_KNOWLEDGE_BASE.filter((entry) => entry.skillNodeId === skillNodeId);
  if (matches.length === 0) return null;
  const sorted = [...matches].sort((a, b) => b.priorityLevel - a.priorityLevel);
  const override = PRIORITY_NODE_OVERRIDES[skillNodeId];
  if (override && sorted[0].priorityLevel < override) {
    return { ...sorted[0], priorityLevel: override };
  }
  return sorted[0];
}

export function getAllKnowledgeForNode(skillNodeId: string): SnbtKnowledgeEntry[] {
  return SNBT_KNOWLEDGE_BASE.filter((entry) => entry.skillNodeId === skillNodeId).sort(
    (a, b) => b.priorityLevel - a.priorityLevel,
  );
}

export function getKnowledgeEntriesBySubtest(subtest?: SnbtSubtest | "ALL"): SnbtKnowledgeEntry[] {
  const list =
    !subtest || subtest === "ALL"
      ? SNBT_KNOWLEDGE_BASE
      : SNBT_KNOWLEDGE_BASE.filter((e) => e.subtest === subtest);
  return [...list].sort((a, b) => b.priorityLevel - a.priorityLevel);
}

export function getPriorityCurriculumStats() {
  const bySubtest: Record<SnbtSubtest, number> = {
    PU: 0,
    PPU: 0,
    PBM: 0,
    PK: 0,
    LBI: 0,
    LBE: 0,
    PM: 0,
  };
  let highPriorityCount = 0;
  for (const entry of SNBT_KNOWLEDGE_BASE) {
    bySubtest[entry.subtest] = (bySubtest[entry.subtest] ?? 0) + 1;
    if (entry.priorityLevel >= 9) highPriorityCount += 1;
  }
  return {
    totalEntries: SNBT_KNOWLEDGE_BASE.length,
    highPriorityCount,
    bySubtest,
  };
}

export function searchSnbtKnowledgeBase(params: {
  queryText: string;
  subtest?: SnbtSubtest | null;
  skillNodeId?: string | null;
  limit?: number;
}): SnbtKnowledgeEntry[] {
  const tokens = params.queryText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  const scored = SNBT_KNOWLEDGE_BASE.map((entry) => {
    let score = 0;

    if (params.skillNodeId && entry.skillNodeId === params.skillNodeId) {
      score += 120;
    }
    if (params.subtest && entry.subtest === params.subtest) {
      score += 45;
    }

    const haystack = [
      entry.topicTitle,
      entry.chapterGroup ?? "",
      entry.whyBeforeHow,
      entry.shortcutWithBoundary?.methodLabel ?? "",
      entry.shortcutWithBoundary?.shortcutMarkdown ?? "",
      entry.utbkTraps.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (params.queryText.toLowerCase().includes(kwLower)) {
        score += 24;
      }
      for (const tok of tokens) {
        if (kwLower.includes(tok)) {
          score += 10;
        }
      }
    }

    for (const tok of tokens) {
      if (haystack.includes(tok)) {
        score += 4;
      }
    }

    score += entry.priorityLevel * 0.5;
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const limit = params.limit ?? 3;
  return scored
    .filter((s) => s.score > 10 || !params.queryText.trim())
    .slice(0, limit)
    .map((s) => s.entry);
}

export function formatKnowledgeBasePromptBlock(entries: SnbtKnowledgeEntry[]): string {
  if (entries.length === 0) return "Tidak ada entri kurikulum spesifik.";
  return entries
    .map((e) => {
      const formulas =
        e.keyFormulasLatex.length > 0 ? `Rumus: ${e.keyFormulasLatex.join(" | ")}` : "Fokus aturan penalaran/kebahasaan.";
      const shortcut = e.shortcutWithBoundary
        ? `Strategi Cepat (${e.shortcutWithBoundary.methodLabel}): ${e.shortcutWithBoundary.shortcutMarkdown} [Syarat batas wajib: ${e.shortcutWithBoundary.validityConditions}]`
        : "";
      return `[${e.subtest} · Prioritas Lv.${e.priorityLevel}/10 · ${e.topicTitle}]\nInti Why Before How: ${e.whyBeforeHow}\n${formulas}\n${shortcut}\nJebakan UTBK: ${e.utbkTraps.join(" ; ")}`;
    })
    .join("\n\n");
}
