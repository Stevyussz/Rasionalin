import type {
  AiRoutingLedgerEntry,
  BrainVaultChunk,
  BrainVaultDocument,
  BrainVaultPage,
  ExtractedVisionItem,
  FractureStatus,
  FsrsCardEntity,
  MathVerificationRunEntity,
  MistakeFractureEntity,
  QcStatus,
  QuestionAttemptEntity,
  QuestionEntity,
  QuestionTemplateEntity,
  RootCauseType,
  SimulationSessionEntity,
  SimulationSubtestBlockEntity,
  SkillNode,
  SkillPrerequisiteEdge,
  SnbtSubtest,
  SocraticHintLogEntity,
  UserEntity,
  UserMomentumState,
  UserSessionEntity,
  UserSkillMastery,
} from "@/domain/types";

export interface VaultSearchResultItem {
  chunk: BrainVaultChunk;
  cosineSimilarity: number;
  rrfScore: number;
}

export interface AppRepository {
  // User & Session
  ensureDefaultOwnerUser(): Promise<UserEntity>;
  findUserById(userId: string): Promise<UserEntity | null>;
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserByIdentifier(identifier: string): Promise<UserEntity | null>;
  createUser(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    targetScore?: number;
  }): Promise<UserEntity>;
  updateUserProfile(
    userId: string,
    patch: Partial<
      Pick<UserEntity, "displayName" | "targetScore" | "targetMajor" | "examDate" | "diagnosticCompleted" | "themePreference">
    >,
  ): Promise<UserEntity>;
  createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: string;
    userAgent: string | null;
    ipHash: string | null;
  }): Promise<UserSessionEntity>;
  findSessionByTokenHash(tokenHash: string): Promise<{ session: UserSessionEntity; user: UserEntity } | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;

  // Momentum & IRT
  getOrInitMomentum(userId: string): Promise<UserMomentumState>;
  saveMomentum(momentum: UserMomentumState): Promise<void>;

  // Skill Graph & Mastery
  listSkillNodes(): Promise<SkillNode[]>;
  listSkillEdges(): Promise<SkillPrerequisiteEdge[]>;
  getSkillNodeById(nodeId: string): Promise<SkillNode | null>;
  listUserSkillMasteries(userId: string): Promise<UserSkillMastery[]>;
  upsertUserSkillMastery(mastery: UserSkillMastery): Promise<void>;

  // Questions & Templates & Sandbox Proofs
  listQuestions(filter?: {
    userId?: string;
    subtest?: SnbtSubtest;
    skillNodeId?: string;
    qcStatus?: QcStatus;
  }): Promise<QuestionEntity[]>;
  getQuestionById(questionId: string): Promise<QuestionEntity | null>;
  saveQuestion(question: QuestionEntity): Promise<void>;
  listActiveTemplates(filter?: { skillNodeId?: string; subtest?: "PU" | "PK" | "PM" }): Promise<QuestionTemplateEntity[]>;
  getTemplateById(templateId: string): Promise<QuestionTemplateEntity | null>;
  saveTemplate(template: QuestionTemplateEntity): Promise<void>;
  saveVerificationRun(run: MathVerificationRunEntity): Promise<void>;
  listVerificationRuns(limit?: number): Promise<MathVerificationRunEntity[]>;

  // FSRS Cards
  listDueFsrsCards(userId: string, nowIso: string): Promise<FsrsCardEntity[]>;
  findFsrsCard(params: {
    userId: string;
    skillNodeId: string;
    questionId: string | null;
    cardScope: "skill_concept" | "mistake_revival";
  }): Promise<FsrsCardEntity | null>;
  getFsrsCardById(cardId: string): Promise<FsrsCardEntity | null>;
  upsertFsrsCard(card: FsrsCardEntity): Promise<void>;

  // Mistake Graveyard & Attempts
  listMistakeFractures(
    userId: string,
    filter?: { status?: FractureStatus; rootCause?: RootCauseType },
  ): Promise<MistakeFractureEntity[]>;
  getFractureById(fractureId: string): Promise<MistakeFractureEntity | null>;
  upsertMistakeFracture(fracture: MistakeFractureEntity): Promise<void>;
  recordAttempt(attempt: QuestionAttemptEntity): Promise<void>;
  listUserAttempts(userId: string, filter?: { skillNodeId?: string; limit?: number }): Promise<QuestionAttemptEntity[]>;

  // Brain Vault & Hybrid RAG
  listVaultDocuments(userId: string): Promise<BrainVaultDocument[]>;
  getVaultDocumentById(userId: string, documentId: string): Promise<BrainVaultDocument | null>;
  findVaultDocumentByHash(userId: string, sha256Hash: string): Promise<BrainVaultDocument | null>;
  upsertVaultDocument(doc: BrainVaultDocument): Promise<void>;
  listVaultPages(documentId: string): Promise<BrainVaultPage[]>;
  getVaultPageByNumber(documentId: string, pageNumber: number): Promise<BrainVaultPage | null>;
  upsertVaultPage(page: BrainVaultPage): Promise<void>;
  findExtractedItemInDocument(
    userId: string,
    itemId: string,
  ): Promise<{ doc: BrainVaultDocument; page: BrainVaultPage; item: ExtractedVisionItem } | null>;
  listVaultChunks(userId: string): Promise<BrainVaultChunk[]>;
  upsertVaultChunk(chunk: BrainVaultChunk): Promise<void>;
  searchHybridVaultChunks(params: {
    userId: string;
    queryText: string;
    formulaQuery: string;
    queryEmbedding: number[] | null;
    subtest: SnbtSubtest | null;
    limit: number;
  }): Promise<VaultSearchResultItem[]>;

  // Socratic Hint Telemetry & AI Routing Ledger
  recordSocraticHintLog(log: SocraticHintLogEntity): Promise<void>;
  listSocraticHintLogs(userId: string, questionId: string): Promise<SocraticHintLogEntity[]>;
  recordAiRoutingLedger(entry: AiRoutingLedgerEntry): Promise<void>;
  listAiRoutingLedger(userId: string, limit?: number): Promise<AiRoutingLedgerEntry[]>;

  // Simulations
  createSimulationWithBlocks(
    session: SimulationSessionEntity,
    blocks: SimulationSubtestBlockEntity[],
  ): Promise<void>;
  getSimulationById(
    userId: string,
    sessionId: string,
  ): Promise<{ session: SimulationSessionEntity; blocks: SimulationSubtestBlockEntity[] } | null>;
  listSimulations(userId: string): Promise<SimulationSessionEntity[]>;
  updateSimulationSession(session: SimulationSessionEntity): Promise<void>;
  updateSimulationBlock(block: SimulationSubtestBlockEntity): Promise<void>;
}
