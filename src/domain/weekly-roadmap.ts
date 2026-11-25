import { computeExamCountdown } from "./exam-countdown";
import { getPrimaryKnowledgeForNode } from "./snbt-knowledge-base";
import type {
  DifficultyTier,
  SkillNode,
  SnbtSubtest,
  UserSkillMastery,
} from "./types";

export type RoadmapPhaseKey = "foundation" | "core_interleave" | "hots_sprint" | "final_taper";

export interface RoadmapNodeChip {
  id: string;
  code: string;
  subtest: SnbtSubtest;
  titleId: string;
  tier: DifficultyTier;
  mastered: boolean;
  studyHref: string;
}

export interface WeeklyRoadmapWeek {
  weekNumber: number;
  dateRangeLabel: string;
  phase: RoadmapPhaseKey;
  phaseLabel: string;
  focusHeadline: string;
  recommendedTryout: string;
  isCurrentWeek: boolean;
  nodes: RoadmapNodeChip[];
}

export interface WeeklyStudyRoadmap {
  examDate: string;
  daysLeft: number;
  totalWeeks: number;
  remainingNodesCount: number;
  masteredNodesCount: number;
  totalNodesCount: number;
  currentPhaseLabel: string;
  paceLabel: string;
  phaseSummaries: Array<{
    phase: RoadmapPhaseKey;
    label: string;
    weeksCount: number;
    nodesCount: number;
  }>;
  weeks: WeeklyRoadmapWeek[];
}

const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatShortDateRangeId(start: Date, end: Date): string {
  const sDay = start.getDate();
  const sMonth = MONTH_SHORT_ID[start.getMonth()] ?? "";
  const eDay = end.getDate();
  const eMonth = MONTH_SHORT_ID[end.getMonth()] ?? "";
  if (sMonth === eMonth) {
    return `${sDay}-${eDay} ${sMonth}`;
  }
  return `${sDay} ${sMonth} - ${eDay} ${eMonth}`;
}

function interleaveByTrack(nodes: SkillNode[]): SkillNode[] {
  const quant = nodes.filter((n) => n.track === "quantitative");
  const lit = nodes.filter((n) => n.track === "literacy");
  const merged: SkillNode[] = [];
  const maxLen = Math.max(quant.length, lit.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (i < quant.length) merged.push(quant[i]);
    if (i < lit.length) merged.push(lit[i]);
  }
  return merged;
}

function phaseLabelFor(phase: RoadmapPhaseKey): string {
  switch (phase) {
    case "foundation":
      return "Fase 1 · Fondasi Nol";
    case "core_interleave":
      return "Fase 2 · Inti & Interleaving";
    case "hots_sprint":
      return "Fase 3 · Sprint HOTS 800+";
    case "final_taper":
      return "Fase 4 · Simulasi & Pemulihan FSRS";
  }
}

export function buildWeeklyStudyRoadmap(params: {
  examDate: string | null;
  targetScore: number;
  nodes: SkillNode[];
  masteries: UserSkillMastery[];
  weakSubtests?: SnbtSubtest[];
  studyPace?: "santuy_dalam" | "seimbang" | "kejar_cepat";
  now?: Date;
}): WeeklyStudyRoadmap {
  const now = params.now ?? new Date();
  const countdown = computeExamCountdown(params.examDate, now.getTime());
  const daysLeft = Math.max(1, countdown.daysLeft);
  const totalWeeks = Math.max(1, Math.ceil(daysLeft / 7));

  const weakSet = new Set<SnbtSubtest>(params.weakSubtests ?? []);
  const masteryMap = new Map(params.masteries.map((m) => [m.skillNodeId, m]));
  const isFastTrack = params.studyPace === "kejar_cepat";

  const masteredNodesCount = params.nodes.filter(
    (n) => masteryMap.get(n.id)?.status === "mastered",
  ).length;
  const unmastered = params.nodes.filter(
    (n) => masteryMap.get(n.id)?.status !== "mastered",
  );

  const priorityScore = (n: SkillNode): number => {
    const m = masteryMap.get(n.id);
    const analiticaLv = getPrimaryKnowledgeForNode(n.id)?.priorityLevel ?? 5;
    return (
      (m?.status === "foundation_fracture" ? 100 : 0) +
      (weakSet.has(n.subtest) ? 35 : 0) +
      analiticaLv * 4
    );
  };

  const sortBucket = (list: SkillNode[]): SkillNode[] =>
    [...list].sort((a, b) => priorityScore(b) - priorityScore(a) || a.displayOrder - b.displayOrder);

  const foundationNodes = interleaveByTrack(
    sortBucket(
      unmastered.filter(
        (n) => n.tier === "tier_0_foundation" || masteryMap.get(n.id)?.status === "foundation_fracture",
      ),
    ),
  );
  const foundationSet = new Set(foundationNodes.map((n) => n.id));

  const coreNodes = interleaveByTrack(
    sortBucket(
      unmastered.filter(
        (n) =>
          !foundationSet.has(n.id) &&
          (n.tier === "tier_1_core" || n.tier === "tier_2_standard"),
      ),
    ),
  );
  const coreSet = new Set(coreNodes.map((n) => n.id));

  const hotsNodes = interleaveByTrack(
    sortBucket(unmastered.filter((n) => !foundationSet.has(n.id) && !coreSet.has(n.id))),
  );

  const orderedRemaining = [...foundationNodes, ...coreNodes, ...hotsNodes];

  const taperWeeks = totalWeeks >= 8 ? 2 : totalWeeks >= 4 ? 1 : 0;
  const learningWeeks = Math.max(1, totalWeeks - taperWeeks);

  const weeks: WeeklyRoadmapWeek[] = [];
  let cursor = 0;

  for (let w = 0; w < totalWeeks; w += 1) {
    const start = new Date(now.getTime() + w * 7 * 86_400_000);
    const end = new Date(start.getTime() + 6 * 86_400_000);
    const dateRangeLabel = formatShortDateRangeId(start, end);
    const isTaper = w >= learningWeeks;

    let weekNodes: SkillNode[] = [];
    if (!isTaper && cursor < orderedRemaining.length) {
      const weeksLeftInLearning = learningWeeks - w;
      const itemsLeft = orderedRemaining.length - cursor;
      const take = Math.max(1, Math.ceil(itemsLeft / Math.max(1, weeksLeftInLearning)));
      weekNodes = orderedRemaining.slice(cursor, cursor + take);
      cursor += weekNodes.length;
    }

    let phase: RoadmapPhaseKey = "core_interleave";
    if (isTaper || (orderedRemaining.length === 0 && weekNodes.length === 0)) {
      phase = "final_taper";
    } else if (weekNodes.some((n) => n.tier === "tier_0_foundation")) {
      phase = "foundation";
    } else if (
      weekNodes.length > 0 &&
      weekNodes.every((n) => n.tier === "tier_3_hots_800")
    ) {
      phase = "hots_sprint";
    }

    const subList = Array.from(new Set(weekNodes.map((n) => n.subtest))).join(", ");
    const focusHeadline =
      phase === "final_taper"
        ? "Pemulihan kartu FSRS, Active Recall, dan menjaga ketahanan fokus 160 soal"
        : phase === "foundation"
          ? `Tutup celah konsep dasar (${subList || "Fondasi"}) tanpa buru-buru rumus cepat`
          : phase === "hots_sprint"
            ? `Taklukkan pola penalaran tinggi (${subList || "HOTS 800+"}) dan target waktu UTBK`
            : `Latihan campur lintas subtes (${subList || "Inti"}) menuju skor ${params.targetScore}+`;

    const recommendedTryout =
      phase === "final_taper"
        ? "2x Tryout Resmi 160 Soal + Bedah Kesalahan"
        : phase === "hots_sprint"
          ? "1x Tryout Penuh 7 Subtes + 1x Interleaved Sprint"
          : phase === "foundation"
            ? "1x Drill Subtes Fokus (10 Soal)"
            : "1x Tryout Ringkas 35 Soal + 2x Interleaved Sprint";

    weeks.push({
      weekNumber: w + 1,
      dateRangeLabel,
      phase,
      phaseLabel: phaseLabelFor(phase),
      focusHeadline,
      recommendedTryout,
      isCurrentWeek: w === 0,
      nodes: weekNodes.map((n) => {
        const m = masteryMap.get(n.id);
        const score = m?.masteryScore ?? 0;
        const mode =
          isFastTrack && !n.isFoundationRepair && score >= 0.45 ? "practice" : "lesson";
        return {
          id: n.id,
          code: n.code,
          subtest: n.subtest,
          titleId: n.titleId,
          tier: n.tier,
          mastered: m?.status === "mastered",
          studyHref: `/study?skillNodeId=${n.id}&mode=${mode}`,
        };
      }),
    });
  }

  const phaseOrder: RoadmapPhaseKey[] = [
    "foundation",
    "core_interleave",
    "hots_sprint",
    "final_taper",
  ];
  const phaseSummaries = phaseOrder
    .map((phase) => {
      const matching = weeks.filter((wk) => wk.phase === phase);
      return {
        phase,
        label: phaseLabelFor(phase),
        weeksCount: matching.length,
        nodesCount: matching.reduce((sum, wk) => sum + wk.nodes.length, 0),
      };
    })
    .filter((s) => s.weeksCount > 0);

  const paceLabel =
    params.studyPace === "kejar_cepat"
      ? "Mode Kejar Cepat"
      : params.studyPace === "santuy_dalam"
        ? "Mode Santai Mendalam"
        : "Mode Ritme Seimbang";

  return {
    examDate: countdown.effectiveDate,
    daysLeft,
    totalWeeks,
    remainingNodesCount: orderedRemaining.length,
    masteredNodesCount,
    totalNodesCount: params.nodes.length,
    currentPhaseLabel: weeks[0]?.phaseLabel ?? countdown.phaseLabel,
    paceLabel,
    phaseSummaries,
    weeks,
  };
}
