import { computeExamCountdown } from "./exam-countdown";
import { getPrimaryKnowledgeForNode } from "./snbt-knowledge-base";
import type {
  QuestionAttemptEntity,
  SkillNode,
  SnbtSubtest,
  UserEntity,
  UserMomentumState,
  UserSkillMastery,
} from "./types";

export interface DailyMissionItem {
  id: string;
  order: number;
  type: "active_recall" | "micro_lesson" | "practice_drill";
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  href: string;
  completed: boolean;
  badgeLabel: string;
}

export interface AdaptiveDailyPlan {
  daysUntilExam: number;
  examDate: string;
  isDefaultExamDate: boolean;
  examPhaseLabel: string;
  currentIrt: number;
  targetScore: number;
  scoreGap: number;
  todayCompletedCount: number;
  todayTotalMissions: number;
  todayAttemptsCount: number;
  missions: DailyMissionItem[];
}

export function buildAdaptiveDailyPlan(params: {
  user: UserEntity;
  momentum: UserMomentumState;
  nodes: SkillNode[];
  masteries: UserSkillMastery[];
  dueFsrsCount: number;
  recentAttempts: QuestionAttemptEntity[];
  weakSubtests?: SnbtSubtest[];
  studyPace?: "santuy_dalam" | "seimbang" | "kejar_cepat";
  now?: Date;
}): AdaptiveDailyPlan {
  const now = params.now ?? new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weakSet = new Set<SnbtSubtest>(params.weakSubtests ?? []);
  const isFastTrack = params.studyPace === "kejar_cepat";

  const countdown = computeExamCountdown(params.user.examDate, now.getTime());
  const daysUntilExam = countdown.daysLeft;

  const masteryMap = new Map(params.masteries.map((m) => [m.skillNodeId, m]));
  const todayAttempts = params.recentAttempts.filter((a) => a.createdAt.slice(0, 10) === todayStr);

  // Pick Mission 2: Highest priority unmastered fracture/foundation repair, then weak subtest unlocked, then highest Analitica priorityLevel
  const priorityOf = (nodeId: string): number =>
    getPrimaryKnowledgeForNode(nodeId)?.priorityLevel ?? 5;
  const sortedNodes = [...params.nodes].sort((a, b) => a.displayOrder - b.displayOrder);
  const byAnaliticaNodes = [...params.nodes].sort(
    (a, b) => priorityOf(b.id) - priorityOf(a.id) || a.displayOrder - b.displayOrder,
  );
  const lessonNode =
    sortedNodes.find((n) => masteryMap.get(n.id)?.status === "foundation_fracture") ??
    byAnaliticaNodes.find((n) => {
      const m = masteryMap.get(n.id);
      return weakSet.has(n.subtest) && m?.status !== "mastered" && m?.status !== "locked";
    }) ??
    byAnaliticaNodes.find((n) => {
      const m = masteryMap.get(n.id);
      return n.isFoundationRepair && m?.status !== "mastered" && m?.status !== "locked";
    }) ??
    byAnaliticaNodes.find((n) => {
      const m = masteryMap.get(n.id);
      return m?.status !== "mastered" && m?.status !== "locked";
    }) ??
    byAnaliticaNodes.find((n) => masteryMap.get(n.id)?.status !== "mastered") ??
    byAnaliticaNodes[0] ??
    sortedNodes[0];

  // Pick Mission 3: Complementary track prioritized by weak subtests & Analitica score
  const oppositeTrack = lessonNode?.track === "quantitative" ? "literacy" : "quantitative";
  const drillNode =
    byAnaliticaNodes.find((n) => {
      const m = masteryMap.get(n.id);
      return (
        n.track === oppositeTrack &&
        weakSet.has(n.subtest) &&
        m?.status !== "mastered" &&
        m?.status !== "locked"
      );
    }) ??
    byAnaliticaNodes.find((n) => {
      const m = masteryMap.get(n.id);
      return n.track === oppositeTrack && m?.status !== "mastered" && m?.status !== "locked";
    }) ??
    byAnaliticaNodes.find((n) => n.track === oppositeTrack) ??
    byAnaliticaNodes[1] ??
    lessonNode;

  const didLessonNodeToday = lessonNode
    ? todayAttempts.some((a) => a.skillNodeId === lessonNode.id)
    : false;
  const didDrillToday = todayAttempts.length >= 3;
  const didRecallToday = params.dueFsrsCount === 0 && todayAttempts.length > 0;

  const missions: DailyMissionItem[] = [
    {
      id: "mission-recall",
      order: 1,
      type: "active_recall",
      title:
        params.dueFsrsCount > 0
          ? `Uji Ingatan Aktif (${params.dueFsrsCount} kartu FSRS)`
          : "Pemanasan Active Recall (3 kartu prinsip dasar)",
      subtitle: "Tarik ulang alasan utama dari kepalamu sebelum masuk soal agar memori makin kuat.",
      estimatedMinutes: isFastTrack ? 5 : 8,
      href: "/graveyard",
      completed: didRecallToday,
      badgeLabel: "Active Recall",
    },
    {
      id: "mission-lesson",
      order: 2,
      type: "micro_lesson",
      title: lessonNode
        ? `${isFastTrack ? "Kejar Cepat" : "Pahami dari Nol"}: ${lessonNode.titleId}`
        : "Pahami 1 Materi Fondasi Dasar",
      subtitle: isFastTrack
        ? "Tangkap inti pola cepat & syarat batasnya, lalu langsung hajar variasi soalnya."
        : "Baca analogi Why Before How + 1 contoh terpandu dulu, baru mulai latihan soal.",
      estimatedMinutes: isFastTrack ? 8 : 12,
      href: lessonNode ? `/study?skillNodeId=${lessonNode.id}&mode=lesson` : "/study?mode=lesson",
      completed: didLessonNodeToday,
      badgeLabel: lessonNode
        ? `Lv.${priorityOf(lessonNode.id)} · ${lessonNode.subtest}`
        : "Materi",
    },
    {
      id: "mission-drill",
      order: 3,
      type: "practice_drill",
      title: drillNode
        ? `Latihan Lintas Track: ${drillNode.titleId}`
        : "Selesaikan 3 Soal Latihan Fokus",
      subtitle: "Seimbangkan skor kuantitatif dan literasi agar IRT komposit naik stabil menuju 800+.",
      estimatedMinutes: isFastTrack ? 12 : 15,
      href: drillNode ? `/study?skillNodeId=${drillNode.id}&mode=lesson` : "/study",
      completed: didDrillToday,
      badgeLabel: drillNode
        ? `Lv.${priorityOf(drillNode.id)} · ${drillNode.subtest}`
        : "Latihan",
    },
  ];

  const currentIrt = Math.round(params.momentum.estimatedIrtComposite);
  const scoreGap = Math.max(0, params.user.targetScore - currentIrt);

  return {
    daysUntilExam,
    examDate: countdown.effectiveDate,
    isDefaultExamDate: countdown.isDefaultDate,
    examPhaseLabel: countdown.phaseLabel,
    currentIrt,
    targetScore: params.user.targetScore,
    scoreGap,
    todayCompletedCount: missions.filter((m) => m.completed).length,
    todayTotalMissions: missions.length,
    todayAttemptsCount: todayAttempts.length,
    missions,
  };
}
