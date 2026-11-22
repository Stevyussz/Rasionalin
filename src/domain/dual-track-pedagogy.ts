import type {
  FadingStage,
  QuestionEntity,
  SolutionStep,
} from "./types";

export interface EvidenceCheckResult {
  passed: boolean;
  matchedIds: string[];
  requiredIds: string[];
  feedbackMessage: string;
}

export function validateEvidenceHighlight(
  question: QuestionEntity,
  highlightedSentenceIds: string[],
): EvidenceCheckResult {
  const required = question.evidenceSentenceIds;
  if (question.track !== "literacy" || required.length === 0) {
    return {
      passed: true,
      matchedIds: [],
      requiredIds: [],
      feedbackMessage: "Soal kuantitatif tidak memerlukan penandaan kalimat bukti.",
    };
  }

  const normalized = Array.from(new Set(highlightedSentenceIds));
  const matched = normalized.filter((id) => required.includes(id));

  if (matched.length === 0) {
    return {
      passed: false,
      matchedIds: [],
      requiredIds: required,
      feedbackMessage:
        "Kalimat yang ditandai belum memuat bukti langsung klaim soal. Periksa ulang kalimat kunci pada teks.",
    };
  }

  return {
    passed: true,
    matchedIds: matched,
    requiredIds: required,
    feedbackMessage: `Bukti tervalidasi (${matched.length} kalimat rujukan tepat). Pilihan jawaban dibuka.`,
  };
}

export interface SbiCheckResult {
  matchedSchema: boolean;
  taggedVariableCount: number;
  feedbackMessage: string;
}

export function validateSbiDeconstruction(
  question: QuestionEntity,
  selectedSchema: string | null,
  taggedVariables: Record<string, string>,
): SbiCheckResult {
  const deconstruction = question.sbiDeconstruction;
  const taggedCount = Object.values(taggedVariables).filter((v) => v.trim().length > 0).length;

  if (!deconstruction) {
    return {
      matchedSchema: true,
      taggedVariableCount: taggedCount,
      feedbackMessage: "Variabel kerja tercatat.",
    };
  }

  const schemaMatches =
    selectedSchema !== null &&
    selectedSchema.trim().toLowerCase() === deconstruction.schemaType.trim().toLowerCase();

  return {
    matchedSchema: schemaMatches,
    taggedVariableCount: taggedCount,
    feedbackMessage: schemaMatches
      ? `Skema tepat: ${deconstruction.schemaLabelId}. Lanjutkan perhitungan.`
      : `Coba cocokkan ulang struktur relasi soal dengan skema yang sesuai.`,
  };
}

export interface FadedStepView extends SolutionStep {
  masked: boolean;
}

export function buildFadedSolutionView(
  steps: SolutionStep[],
  stage: FadingStage,
): FadedStepView[] {
  if (steps.length === 0) return [];
  if (stage === "independent") {
    return steps.map((s) => ({ ...s, masked: true }));
  }
  if (stage === "full_worked") {
    return steps.map((s) => ({ ...s, masked: false }));
  }
  if (stage === "missing_final_step") {
    return steps.map((s, idx) => ({
      ...s,
      masked: idx === steps.length - 1,
    }));
  }
  // missing_multi_steps: show initial deconstruction only, mask solving steps
  return steps.map((s, idx) => ({
    ...s,
    masked: idx >= 1,
  }));
}
