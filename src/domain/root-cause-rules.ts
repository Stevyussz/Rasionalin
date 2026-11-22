import type {
  DifficultyTier,
  DistractorTrapType,
  PedagogyTrack,
  RootCauseType,
} from "./types";

export interface RootCauseHeuristicInput {
  track: PedagogyTrack;
  tier: DifficultyTier;
  timeToSolveMs: number;
  expectedSolveSeconds: number;
  hintsUsedCount: number;
  evidenceMatchPassed: boolean | null;
  distractorTrap: DistractorTrapType;
  hasPrerequisiteFracture: boolean;
}

export interface RootCauseResult {
  primaryRootCause: RootCauseType;
  secondaryRootCause: RootCauseType | null;
  confidence: number;
  diagnosticSummary: string;
}

export function classifyRootCauseDeterministically(
  input: RootCauseHeuristicInput,
): RootCauseResult {
  const {
    track,
    tier,
    timeToSolveMs,
    expectedSolveSeconds,
    hintsUsedCount,
    evidenceMatchPassed,
    distractorTrap,
    hasPrerequisiteFracture,
  } = input;

  if (timeToSolveMs < 18000 || distractorTrap === "sign_error" || distractorTrap === "arithmetic_slip") {
    return {
      primaryRootCause: "careless_time_panic",
      secondaryRootCause: hasPrerequisiteFracture ? "foundational_gap" : null,
      confidence: 0.78,
      diagnosticSummary:
        timeToSolveMs < 18000
          ? "Keputusan terlalu terburu-buru di bawah 18 detik atau terjadi selip tanda/hitung dasar."
          : "Selip aritmetika atau tanda negatif saat eksekusi akhir meski alur utama sudah dekat.",
    };
  }

  if (
    track === "literacy" &&
    (evidenceMatchPassed === false ||
      distractorTrap === "overgeneralization" ||
      distractorTrap === "scope_shift" ||
      distractorTrap === "unsupported_inference" ||
      distractorTrap === "causal_reversal")
  ) {
    return {
      primaryRootCause: "translation_error",
      secondaryRootCause: null,
      confidence: 0.84,
      diagnosticSummary:
        "Kesalahan membaca batas klaim teks atau terjebak distorsi cakupan pada opsi jawaban.",
    };
  }

  if (tier === "tier_0_foundation" || hasPrerequisiteFracture || hintsUsedCount >= 3) {
    return {
      primaryRootCause: "foundational_gap",
      secondaryRootCause: "formula_amnesia",
      confidence: 0.82,
      diagnosticSummary:
        "Terjadi celah konsep prasyarat dasar sebelum masuk ke manipulasi tingkat UTBK.",
    };
  }

  if (distractorTrap === "unit_mismatch") {
    return {
      primaryRootCause: "translation_error",
      secondaryRootCause: "careless_time_panic",
      confidence: 0.79,
      diagnosticSummary:
        "Konversi satuan atau translasi kalimat cerita ke model persamaan belum konsisten.",
    };
  }

  if (timeToSolveMs > expectedSolveSeconds * 1300) {
    return {
      primaryRootCause: "formula_amnesia",
      secondaryRootCause: "translation_error",
      confidence: 0.74,
      diagnosticSummary:
        "Aturan atau hubungan skema belum langsung terpanggil sehingga waktu eksekusi melebar.",
    };
  }

  return {
    primaryRootCause: "formula_amnesia",
    secondaryRootCause: null,
    confidence: 0.72,
    diagnosticSummary:
      "Penerapan prinsip atau rumus inti masih tertukar pada langkah penentuan relasi.",
  };
}

export function getRootCauseLabelId(rc: RootCauseType): string {
  switch (rc) {
    case "foundational_gap":
      return "Celah Fondasi";
    case "formula_amnesia":
      return "Lupa Rumus / Aturan";
    case "translation_error":
      return "Salah Terjemah Soal";
    case "careless_time_panic":
      return "Selip / Panik Waktu";
  }
}

export function getTrapLabelId(trap: DistractorTrapType): string {
  switch (trap) {
    case "none":
      return "Tidak Ada";
    case "overgeneralization":
      return "Overgeneralisasi";
    case "scope_shift":
      return "Pergeseran Cakupan";
    case "unsupported_inference":
      return "Inferensi Tanpa Bukti";
    case "causal_reversal":
      return "Pembalikan Kausalitas";
    case "arithmetic_slip":
      return "Selip Aritmetika";
    case "sign_error":
      return "Kesalahan Tanda (+/-)";
    case "unit_mismatch":
      return "Satuan Tidak Konsisten";
    case "formula_misapplication":
      return "Salah Terap Rumus";
  }
}
