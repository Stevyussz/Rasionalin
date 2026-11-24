export const DEFAULT_UTBK_EXAM_DATE = "2027-05-18";

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export type ExamPrepPhase = "fondasi" | "akselerasi" | "sprint_final" | "hari_h";

export interface ExamCountdownState {
  effectiveDate: string;
  isDefaultDate: boolean;
  formattedDateId: string;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  totalDaysRoundedUp: number;
  isExamDay: boolean;
  isPast: boolean;
  phase: ExamPrepPhase;
  phaseLabel: string;
}

export function formatExamDateId(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(day) || monthIdx < 0 || monthIdx > 11) {
    return isoDate;
  }
  return `${day} ${MONTHS_ID[monthIdx]} ${year}`;
}

export function computeExamCountdown(
  examDate: string | null | undefined,
  nowMs: number = Date.now(),
): ExamCountdownState {
  const cleaned = typeof examDate === "string" ? examDate.trim() : "";
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(cleaned);
  const effectiveDate = isValid ? cleaned : DEFAULT_UTBK_EXAM_DATE;
  const isDefaultDate = !isValid;

  // Target UTBK Session 1 morning start at 07:30 WIB (UTC+7)
  const targetMs = new Date(`${effectiveDate}T07:30:00+07:00`).getTime();
  const safeTargetMs = Number.isFinite(targetMs)
    ? targetMs
    : new Date(`${DEFAULT_UTBK_EXAM_DATE}T07:30:00+07:00`).getTime();

  const diffMs = safeTargetMs - nowMs;
  const isPast = diffMs < -86_400_000;
  const isExamDay = !isPast && diffMs <= 0;

  if (diffMs <= 0) {
    return {
      effectiveDate,
      isDefaultDate,
      formattedDateId: formatExamDateId(effectiveDate),
      daysLeft: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      totalDaysRoundedUp: 0,
      isExamDay,
      isPast,
      phase: "hari_h",
      phaseLabel: isPast ? "Periode UTBK Berjalan / Selesai" : "Hari-H UTBK-SNBT!",
    };
  }

  const totalMinutes = Math.floor(diffMs / 60_000);
  const daysLeft = Math.floor(totalMinutes / (60 * 24));
  const hoursLeft = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutesLeft = totalMinutes % 60;
  const totalDaysRoundedUp = Math.ceil(diffMs / 86_400_000);

  let phase: ExamPrepPhase = "fondasi";
  let phaseLabel = "Fase Bangun Fondasi Kuat";
  if (totalDaysRoundedUp <= 30) {
    phase = "sprint_final";
    phaseLabel = "Sprint Final H-30 UTBK";
  } else if (totalDaysRoundedUp <= 120) {
    phase = "akselerasi";
    phaseLabel = "Fase Akselerasi Tryout & HOTS";
  }

  return {
    effectiveDate,
    isDefaultDate,
    formattedDateId: formatExamDateId(effectiveDate),
    daysLeft,
    hoursLeft,
    minutesLeft,
    totalDaysRoundedUp,
    isExamDay: false,
    isPast: false,
    phase,
    phaseLabel,
  };
}

export function computeRecommendedWeeklyNodes(
  remainingNodes: number,
  totalDaysRoundedUp: number,
): number {
  if (remainingNodes <= 0) return 0;
  const weeksLeft = Math.max(1, totalDaysRoundedUp / 7);
  return Math.max(1, Math.ceil(remainingNodes / weeksLeft));
}
