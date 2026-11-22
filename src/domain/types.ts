export type SnbtSubtest = "PU" | "PPU" | "PBM" | "PK" | "LBI" | "LBE" | "PM";
export type PedagogyTrack = "quantitative" | "literacy";
export type DifficultyTier =
  | "tier_0_foundation"
  | "tier_1_core"
  | "tier_2_standard"
  | "tier_3_hots_800";

export type MasteryStatus =
  | "locked"
  | "foundation_fracture"
  | "in_progress"
  | "soft_passed"
  | "mastered";

export type FadingStage =
  | "full_worked"
  | "missing_final_step"
  | "missing_multi_steps"
  | "independent";

export type QuestionSourceType =
  | "curated_seed"
  | "brain_vault_extracted"
  | "neuro_symbolic_isomorphic";

export type QcStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "quarantined_math_error";

export type QuestionFormat = "mcq_single" | "mcq_complex_table" | "short_numeric";

export type DistractorTrapType =
  | "none"
  | "overgeneralization"
  | "scope_shift"
  | "unsupported_inference"
  | "causal_reversal"
  | "arithmetic_slip"
  | "sign_error"
  | "unit_mismatch"
  | "formula_misapplication";

export type RootCauseType =
  | "foundational_gap"
  | "formula_amnesia"
  | "translation_error"
  | "careless_time_panic";

export type FsrsStateName = "new" | "learning" | "review" | "relearning";
export type FsrsRatingName = "again" | "hard" | "good" | "easy";

export type TriageAction =
  | "solved_directly"
  | "flagged_and_solved"
  | "skipped_smart"
  | "timed_out";

export type VaultDocumentStatus =
  | "uploaded"
  | "rasterizing"
  | "extracting"
  | "awaiting_qc"
  | "indexed"
  | "failed";

export type VaultDocumentType =
  | "bank_soal_pdf"
  | "tryout_archive"
  | "cheat_sheet"
  | "rumus_cepat"
  | "screenshot";

export type VerificationStatus =
  | "pending"
  | "passed"
  | "failed_ast"
  | "failed_timeout"
  | "failed_math_check"
  | "failed_feasibility";

export type SimulationStatus = "in_progress" | "completed" | "abandoned";
export type SimulationMode =
  | "diagnostic_placement"
  | "full_tryout_utbk"
  | "subtest_drill"
  | "triage_sprint";

export type FractureStatus = "active" | "healing" | "healed";

export type SocraticHintLevel =
  | "L1_vault_nudge"
  | "L2_translation_prompt"
  | "L3_guided_first_step"
  | "L4_first_principles_analogy";

export type ThemePreference = "light" | "dark" | "system";
export type SandboxRuntime = "quickjs_wasm" | "python_sympy";
export type SkillEdgeType = "hard_prereq" | "soft_prereq" | "remedial_bridge";
export type ChunkType =
  | "rumus_cepat"
  | "worked_solution"
  | "concept_note"
  | "trap_pattern"
  | "question_stem";

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  targetScore: number;
  targetMajor: string | null;
  examDate: string | null;
  diagnosticCompleted: boolean;
  themePreference: ThemePreference;
  createdAt: string;
  updatedAt: string;
}

export interface UserSessionEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  userAgent: string | null;
  ipHash: string | null;
  createdAt: string;
}

export interface UserMomentumState {
  userId: string;
  precisionComboCurrent: number;
  precisionComboBest: number;
  tier0RecoveryShieldsRemaining: number;
  tier0RecoveryShieldsUsed: number;
  estimatedIrtComposite: number;
  subtestIrtScores: Record<SnbtSubtest, number>;
  lastStudyAt: string | null;
  updatedAt: string;
}

export interface SkillNode {
  id: string;
  code: string;
  subtest: SnbtSubtest;
  track: PedagogyTrack;
  tier: DifficultyTier;
  titleId: string;
  titleEn: string | null;
  descriptionMarkdown: string;
  firstPrinciplesSummary: string;
  isFoundationRepair: boolean;
  softGateThreshold: number;
  conquestThreshold: number;
  targetSolveSeconds: number;
  graphX: number;
  graphY: number;
  displayOrder: number;
}

export interface SkillPrerequisiteEdge {
  parentNodeId: string;
  childNodeId: string;
  edgeType: SkillEdgeType;
  weight: number;
}

export interface UserSkillMastery {
  id: string;
  userId: string;
  skillNodeId: string;
  status: MasteryStatus;
  masteryScore: number;
  currentFadingStage: FadingStage;
  attemptsTotal: number;
  attemptsCorrect: number;
  rollingAccuracy10: number;
  medianSolveMs: number | null;
  interleavePriority: number;
  recoveryShieldActive: boolean;
  lastPracticedAt: string | null;
  masteredAt: string | null;
  updatedAt: string;
}

export interface QuestionOption {
  key: "A" | "B" | "C" | "D" | "E";
  textMarkdown: string;
  latex: string | null;
  trapType: DistractorTrapType;
  distractorRationale: string;
}

export interface SolutionStep {
  stage: "deconstruct" | "setup" | "solve" | "verify";
  title: string;
  instructionMarkdown: string;
  formulaLatex: string | null;
}

export interface PassageSentence {
  id: string;
  paragraph: number;
  text: string;
}

export interface SbiDeconstruction {
  schemaType: string;
  schemaLabelId: string;
  knownVariables: Array<{ symbol: string; label: string; valueText: string }>;
  targetUnknown: string;
  baseRelationLatex: string;
}

export interface QuestionEntity {
  id: string;
  ownerUserId: string | null;
  skillNodeId: string;
  subtest: SnbtSubtest;
  track: PedagogyTrack;
  tier: DifficultyTier;
  sourceType: QuestionSourceType;
  sourceDocumentId: string | null;
  sourcePageId: string | null;
  parentQuestionId: string | null;
  templateId: string | null;
  verificationRunId: string | null;
  format: QuestionFormat;
  qcStatus: QcStatus;
  stemMarkdown: string;
  stemLatex: string | null;
  passageText: string | null;
  passageSentences: PassageSentence[] | null;
  evidenceSentenceIds: string[];
  diagramAssetUrl: string | null;
  diagramAltText: string | null;
  options: QuestionOption[];
  correctAnswerKey: "A" | "B" | "C" | "D" | "E";
  officialSolutionMarkdown: string;
  solutionSteps: SolutionStep[];
  sbiDeconstruction: SbiDeconstruction | null;
  irtDifficultyB: number;
  irtDiscriminationA: number;
  irtGuessingC: number;
  expectedSolveSeconds: number;
  createdAt: string;
}

export interface QuestionTemplateEntity {
  id: string;
  skillNodeId: string;
  subtest: "PU" | "PK" | "PM";
  tier: DifficultyTier;
  sandboxRuntime: SandboxRuntime;
  sourceQuestionId: string | null;
  templateTitle: string;
  stemTemplateLatex: string;
  sbiSchemaType: string | null;
  polyaVariablesSchema: Array<{
    symbol: string;
    role: "known" | "unknown" | "rate" | "constraint";
    labelId: string;
  }>;
  solutionStepTemplates: Array<{
    stage: "deconstruct" | "setup" | "solve" | "verify";
    instructionTemplate: string;
    formulaTemplateLatex: string;
  }>;
  generatorCode: string;
  parameterBoundsJson: Record<string, unknown>;
  codeSha256: string;
  isActive: boolean;
  createdByModel: string;
  createdAt: string;
}

export interface MathVerificationRunEntity {
  id: string;
  templateId: string;
  questionId: string | null;
  sandboxRuntime: SandboxRuntime;
  seedValue: number;
  codeSha256: string;
  status: VerificationStatus;
  executionTimeMs: number;
  peakMemoryKb: number | null;
  sandboxExitCode: number | null;
  computedGroundTruthJson: Record<string, unknown> | null;
  computedDistractorsJson: unknown[] | null;
  feasibilityChecksJson: boolean[] | null;
  failureReason: string | null;
  createdAt: string;
}

export interface BrainVaultDocument {
  id: string;
  userId: string;
  title: string;
  docType: VaultDocumentType;
  originalFilename: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg" | "image/webp";
  fileSizeBytes: number;
  sha256Hash: string;
  storageKey: string;
  pageCount: number;
  pagesProcessed: number;
  status: VaultDocumentStatus;
  subtestHint: SnbtSubtest | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedVisionItem {
  id: string;
  itemType: "question" | "rumus_cepat" | "worked_solution" | "concept_note";
  subtestGuess: SnbtSubtest;
  tierGuess: DifficultyTier;
  conceptTag: string;
  methodLabel: string | null;
  validityConditions: string | null;
  stemMarkdown: string;
  stemLatex: string | null;
  passageText: string | null;
  options: Array<{ key: "A" | "B" | "C" | "D" | "E"; textMarkdown: string; latex: string | null }>;
  correctAnswerKey: "A" | "B" | "C" | "D" | "E" | null;
  officialSolutionMarkdown: string | null;
  diagramAssetUrl: string | null;
  diagramAltText: string | null;
  katexValid: boolean;
  katexError: string | null;
  qcStatus: QcStatus;
}

export interface BrainVaultPage {
  id: string;
  documentId: string;
  pageNumber: number;
  imageStorageKey: string;
  visionModelUsed: string | null;
  extractionConfidence: number | null;
  ocrWarnings: string[];
  katexValid: boolean;
  qcStatus: QcStatus;
  items: ExtractedVisionItem[];
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrainVaultChunk {
  id: string;
  userId: string;
  documentId: string;
  pageId: string | null;
  skillNodeId: string | null;
  subtest: SnbtSubtest | null;
  chunkType: ChunkType;
  contentMarkdown: string;
  contentLatex: string | null;
  methodLabel: string | null;
  validityConditions: string | null;
  diagramAssetUrl: string | null;
  qcStatus: QcStatus;
  isUserPriority: boolean;
  embedding: number[] | null;
  createdAt: string;
}

export interface FsrsCardEntity {
  id: string;
  userId: string;
  skillNodeId: string;
  questionId: string | null;
  cardScope: "skill_concept" | "mistake_revival";
  state: FsrsStateName;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  lastReview: string | null;
  retrievabilitySnapshot: number | null;
  updatedAt: string;
}

export interface MistakeFractureEntity {
  id: string;
  userId: string;
  skillNodeId: string;
  originQuestionId: string;
  originAttemptId: string | null;
  fsrsCardId: string | null;
  primaryRootCause: RootCauseType;
  secondaryRootCause: RootCauseType | null;
  distractorTrapCaught: DistractorTrapType;
  diagnosticSummary: string;
  status: FractureStatus;
  revivalAttemptsCount: number;
  revivalPassesRequired: number;
  revivalPassesAchieved: number;
  lastIsomorphicQuestionId: string | null;
  healedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationSessionEntity {
  id: string;
  userId: string;
  sessionMode: SimulationMode;
  status: SimulationStatus;
  startedAt: string;
  completedAt: string | null;
  totalDurationSeconds: number;
  estimatedIrtScore: number | null;
  accuracyRate: number | null;
  triageEfficiencyScore: number | null;
}

export interface SimulationSubtestBlockEntity {
  id: string;
  simulationSessionId: string;
  subtest: SnbtSubtest;
  blockOrder: number;
  questionCount: number;
  allocatedSeconds: number;
  questionIds: string[];
  startedAt: string | null;
  lockedAt: string | null;
  endsAt: string | null;
  isLocked: boolean;
  subtestIrtScore: number | null;
  correctCount: number;
  skippedSmartCount: number;
}

export interface QuestionAttemptEntity {
  id: string;
  userId: string;
  questionId: string;
  skillNodeId: string;
  simulationSessionId: string | null;
  simulationBlockId: string | null;
  fractureId: string | null;
  fsrsCardId: string | null;
  attemptMode: "diagnostic" | "skill_drill" | "fsrs_revival" | "simulation" | "faded_practice";
  fadingStageUsed: FadingStage | null;
  selectedAnswerKey: "A" | "B" | "C" | "D" | "E" | null;
  isCorrect: boolean;
  timeToSolveMs: number;
  firstInteractionMs: number | null;
  triageDecisionMs: number | null;
  triageAction: TriageAction;
  withinIrtTriageWindow: boolean;
  highlightedSentenceIds: string[];
  evidenceMatchPassed: boolean | null;
  sbiSchemaSelected: string | null;
  sbiVariablesTagged: Record<string, unknown> | null;
  distractorTrapIdentified: DistractorTrapType;
  hintsUsedCount: number;
  maxHintLevel: SocraticHintLevel | null;
  usedScratchpad: boolean;
  recoveryShieldConsumed: boolean;
  rootCause: RootCauseType | null;
  rootCauseConfidence: number | null;
  fsrsRatingAssigned: FsrsRatingName | null;
  createdAt: string;
}

export interface SocraticHintLogEntity {
  id: string;
  userId: string;
  questionId: string;
  attemptId: string | null;
  hintLevel: SocraticHintLevel;
  userStuckInput: string | null;
  retrievedVaultChunkIds: string[];
  groundedInUserVault: boolean;
  boundaryWarningShown: boolean;
  hintResponseMarkdown: string;
  modelAlias: string;
  latencyMs: number;
  createdAt: string;
}

export interface AiRoutingLedgerEntry {
  id: string;
  correlationId: string;
  userId: string | null;
  taskType: string;
  tier: string;
  requestedModelAlias: string;
  actualModelUsed: string;
  fallbackDepth: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  schemaValid: boolean;
  retryCount: number;
  httpStatus: number | null;
  errorCode: string | null;
  createdAt: string;
}

export function getTrackForSubtest(subtest: SnbtSubtest): PedagogyTrack {
  return subtest === "PU" || subtest === "PK" || subtest === "PM" ? "quantitative" : "literacy";
}
