import type {
  QuestionAttemptEntity,
  SkillNode,
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
  daysUntilExam: number | null;
  examDate: string | null;
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
  now?: Date;
}): AdaptiveDailyPlan {
  const now = params.now ?? new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let daysUntilExam: number | null = null;
  if (params.user.examDate) {
    const targetMs = new Date(`${params.user.examDate}T00:00:00Z`).getTime();
    if (Number.isFinite(targetMs)) {
      daysUntilExam = Math.max(0, Math.ceil((targetMs - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  const masteryMap = new Map(params.masteries.map((m) => [m.skillNodeId, m]));
  const todayAttempts = params.recentAttempts.filter((a) => a.createdAt.slice(0, 10) === todayStr);

  // Pick Mission 2: Highest priority unmastered foundation or in-progress node for Micro-Lesson
  const sortedNodes = [...params.nodes].sort((a, b) => a.displayOrder - b.displayOrder);
  const lessonNode =
    sortedNodes.find((n) => masteryMap.get(n.id)?.status === "foundation_fracture") ??
    sortedNodes.find((n) => {
      const m = masteryMap.get(n.id);
      return n.isFoundationRepair && m?.status !== "mastered";
    }) ??
    sortedNodes.find((n) => masteryMap.get(n.id)?.status === "in_progress") ??
    sortedNodes[0];

  // Pick Mission 3: Complementary track (if lesson is quant, pick literacy & vice versa)
  const oppositeTrack = lessonNode?.track === "quantitative" ? "literacy" : "quantitative";
  const drillNode =
    sortedNodes.find((n) => {
      const m = masteryMap.get(n.id);
      return n.track === oppositeTrack && m?.status !== "mastered" && m?.status !== "locked";
    }) ??
    sortedNodes.find((n) => n.track === oppositeTrack) ??
    sortedNodes[1] ??
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
      estimatedMinutes: 8,
      href: "/graveyard",
      completed: didRecallToday,
      badgeLabel: "Active Recall",
    },
    {
      id: "mission-lesson",
      order: 2,
      type: "micro_lesson",
      title: lessonNode
        ? `Pahami dari Nol: ${lessonNode.titleId}`
        : "Pahami 1 Materi Fondasi Dasar",
      subtitle: "Baca analogi Why Before How + 1 contoh terpandu dulu, baru mulai latihan soal.",
      estimatedMinutes: 12,
      href: lessonNode ? `/study?skillNodeId=${lessonNode.id}&mode=lesson` : "/study?mode=lesson",
      completed: didLessonNodeToday,
      badgeLabel: lessonNode ? `${lessonNode.subtest} · Materi` : "Materi",
    },
    {
      id: "mission-drill",
      order: 3,
      type: "practice_drill",
      title: drillNode
        ? `Latihan Lintas Track: ${drillNode.titleId}`
        : "Selesaikan 3 Soal Latihan Fokus",
      subtitle: "Seimbangkan skor kuantitatif dan literasi agar IRT komposit naik stabil menuju 800+.",
      estimatedMinutes: 15,
      href: drillNode ? `/study?skillNodeId=${drillNode.id}&mode=lesson` : "/study",
      completed: didDrillToday,
      badgeLabel: drillNode ? `${drillNode.subtest} · Latihan` : "Latihan",
    },
  ];

  const currentIrt = Math.round(params.momentum.estimatedIrtComposite);
  const scoreGap = Math.max(0, params.user.targetScore - currentIrt);

  return {
    daysUntilExam,
    examDate: params.user.examDate,
    currentIrt,
    targetScore: params.user.targetScore,
    scoreGap,
    todayCompletedCount: missions.filter((m) => m.completed).length,
    todayTotalMissions: missions.length,
    todayAttemptsCount: todayAttempts.length,
    missions,
  };
}
