import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  SEED_QUESTIONS,
  SEED_SKILL_EDGES,
  SEED_SKILL_NODES,
  SEED_TEMPLATES,
  SEED_VAULT_CHUNKS,
} from "@/domain/seed-data";
import { deterministicTextOverlapScore, scoreHybridRrf } from "@/domain/rrf-scorer";
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
import type { AppRepository, VaultSearchResultItem } from "@/infrastructure/db/repository-port";

export const DEFAULT_OWNER_USER_ID = "00000000-0000-4000-8000-000000000001";

interface LocalStoreState {
  users: UserEntity[];
  sessions: UserSessionEntity[];
  momentums: UserMomentumState[];
  skillNodes: SkillNode[];
  skillEdges: SkillPrerequisiteEdge[];
  masteries: UserSkillMastery[];
  questions: QuestionEntity[];
  templates: QuestionTemplateEntity[];
  verificationRuns: MathVerificationRunEntity[];
  fsrsCards: FsrsCardEntity[];
  fractures: MistakeFractureEntity[];
  attempts: QuestionAttemptEntity[];
  vaultDocuments: BrainVaultDocument[];
  vaultPages: BrainVaultPage[];
  vaultChunks: BrainVaultChunk[];
  socraticLogs: SocraticHintLogEntity[];
  aiLedger: AiRoutingLedgerEntry[];
  simulations: SimulationSessionEntity[];
  simulationBlocks: SimulationSubtestBlockEntity[];
}

function buildInitialMasteries(userId: string, nodes: SkillNode[], edges: SkillPrerequisiteEdge[]): UserSkillMastery[] {
  const now = new Date().toISOString();
  return nodes.map((node) => {
    const hasHardParent = edges.some((e) => e.childNodeId === node.id && e.edgeType === "hard_prereq");
    return {
      id: crypto.randomUUID(),
      userId,
      skillNodeId: node.id,
      status: hasHardParent ? "locked" : "in_progress",
      masteryScore: 0,
      currentFadingStage: "full_worked",
      attemptsTotal: 0,
      attemptsCorrect: 0,
      rollingAccuracy10: 0,
      medianSolveMs: null,
      interleavePriority: node.isFoundationRepair ? 25 : 0,
      recoveryShieldActive: node.isFoundationRepair,
      lastPracticedAt: null,
      masteredAt: null,
      updatedAt: now,
    };
  });
}

function createInitialState(): LocalStoreState {
  return {
    users: [],
    sessions: [],
    momentums: [],
    skillNodes: [...SEED_SKILL_NODES],
    skillEdges: [...SEED_SKILL_EDGES],
    masteries: [],
    questions: [...SEED_QUESTIONS],
    templates: [...SEED_TEMPLATES],
    verificationRuns: [],
    fsrsCards: [],
    fractures: [],
    attempts: [],
    vaultDocuments: [],
    vaultPages: [],
    vaultChunks: [],
    socraticLogs: [],
    aiLedger: [],
    simulations: [],
    simulationBlocks: [],
  };
}

export class LocalJsonRepository implements AppRepository {
  private readonly filePath: string;
  private state: LocalStoreState | null = null;
  private loadPromise: Promise<LocalStoreState> | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(customPath?: string) {
    this.filePath = customPath ?? path.join(process.cwd(), ".data", "local-state.json");
  }

  private normalizeState(parsed: Partial<LocalStoreState>): LocalStoreState {
    const base = createInitialState();
    const state: LocalStoreState = {
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : base.users,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      momentums:
        Array.isArray(parsed.momentums) && parsed.momentums.length > 0
          ? parsed.momentums
          : base.momentums,
      skillNodes:
        Array.isArray(parsed.skillNodes) && parsed.skillNodes.length > 0
          ? parsed.skillNodes
          : base.skillNodes,
      skillEdges:
        Array.isArray(parsed.skillEdges) && parsed.skillEdges.length > 0
          ? parsed.skillEdges
          : base.skillEdges,
      masteries: Array.isArray(parsed.masteries) ? parsed.masteries : base.masteries,
      questions:
        Array.isArray(parsed.questions) && parsed.questions.length > 0
          ? parsed.questions
          : base.questions,
      templates: Array.isArray(parsed.templates) ? parsed.templates : base.templates,
      verificationRuns: Array.isArray(parsed.verificationRuns) ? parsed.verificationRuns : [],
      fsrsCards: Array.isArray(parsed.fsrsCards) ? parsed.fsrsCards : [],
      fractures: Array.isArray(parsed.fractures) ? parsed.fractures : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      vaultDocuments: Array.isArray(parsed.vaultDocuments)
        ? parsed.vaultDocuments
        : base.vaultDocuments,
      vaultPages: Array.isArray(parsed.vaultPages) ? parsed.vaultPages : [],
      vaultChunks: Array.isArray(parsed.vaultChunks) ? parsed.vaultChunks : base.vaultChunks,
      socraticLogs: Array.isArray(parsed.socraticLogs) ? parsed.socraticLogs : [],
      aiLedger: Array.isArray(parsed.aiLedger) ? parsed.aiLedger : [],
      simulations: Array.isArray(parsed.simulations) ? parsed.simulations : [],
      simulationBlocks: Array.isArray(parsed.simulationBlocks) ? parsed.simulationBlocks : [],
    };

    // Safely merge any newly added seed nodes, questions, or WASM templates
    const existingNodeIds = new Set(state.skillNodes.map((n) => n.id));
    for (const n of SEED_SKILL_NODES) {
      if (!existingNodeIds.has(n.id)) state.skillNodes.push(n);
    }
    const existingTemplateIds = new Set(state.templates.map((t) => t.id));
    for (const t of SEED_TEMPLATES) {
      if (!existingTemplateIds.has(t.id)) state.templates.push(t);
    }
    const seedQuestionMap = new Map(SEED_QUESTIONS.map((q) => [q.id, q]));
    state.questions = state.questions.map((q) => {
      const freshSeed = seedQuestionMap.get(q.id);
      if (freshSeed && q.sourceType === "curated_seed") {
        return freshSeed;
      }
      return q;
    });
    const existingQuestionIds = new Set(state.questions.map((q) => q.id));
    for (const q of SEED_QUESTIONS) {
      if (!existingQuestionIds.has(q.id)) state.questions.push(q);
    }

    return state;
  }

  private async load(): Promise<LocalStoreState> {
    if (this.state) return this.state;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const raw = await fs.readFile(this.filePath, "utf8");
        const parsed = JSON.parse(raw) as Partial<LocalStoreState>;
        this.state = this.normalizeState(parsed);
        return this.state;
      } catch {
        this.state = createInitialState();
        await this.persist();
        return this.state;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  private async persist(): Promise<void> {
    if (!this.state) return;
    const snapshot = JSON.stringify(this.state, null, 2);
    this.writeChain = this.writeChain
      .catch(() => {
        // Recover from any previous transient filesystem error so writes never stay poisoned
      })
      .then(async () => {
        const dir = path.dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true });
        const tmpFile = `${this.filePath}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
        await fs.writeFile(tmpFile, snapshot, "utf8");
        await fs.rename(tmpFile, this.filePath);
      });
    await this.writeChain;
  }

  async ensureDefaultOwnerUser(): Promise<UserEntity> {
    const s = await this.load();
    if (s.users.length > 0) return s.users[0];
    const now = new Date().toISOString();
    const fixtureOwner: UserEntity = {
      id: DEFAULT_OWNER_USER_ID,
      email: "test-fixture@kejarsnbt.local",
      passwordHash: "test-fixture-only",
      displayName: "Test User",
      targetScore: 800,
      targetMajor: null,
      examDate: null,
      diagnosticCompleted: false,
      themePreference: "system",
      createdAt: now,
      updatedAt: now,
    };
    s.users.push(fixtureOwner);
    s.momentums.push({
      userId: fixtureOwner.id,
      precisionComboCurrent: 0,
      precisionComboBest: 0,
      tier0RecoveryShieldsRemaining: 3,
      tier0RecoveryShieldsUsed: 0,
      estimatedIrtComposite: 400,
      subtestIrtScores: { PU: 400, PPU: 400, PBM: 400, PK: 400, LBI: 400, LBE: 400, PM: 400 },
      lastStudyAt: null,
      updatedAt: now,
    });
    s.masteries.push(...buildInitialMasteries(fixtureOwner.id, s.skillNodes, s.skillEdges));
    if (s.vaultChunks.length === 0) {
      s.vaultChunks.push(...SEED_VAULT_CHUNKS.map((c) => ({ ...c, userId: fixtureOwner.id })));
    }
    await this.persist();
    return fixtureOwner;
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    const s = await this.load();
    return s.users.find((u) => u.id === userId) ?? null;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const s = await this.load();
    const target = email.trim().toLowerCase();
    return s.users.find((u) => u.email.toLowerCase() === target) ?? null;
  }

  async findUserByIdentifier(identifier: string): Promise<UserEntity | null> {
    const s = await this.load();
    const target = identifier.trim().toLowerCase();
    return (
      s.users.find(
        (u) => u.email.toLowerCase() === target || u.displayName.toLowerCase() === target,
      ) ?? null
    );
  }

  async createUser(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    targetScore?: number;
  }): Promise<UserEntity> {
    const s = await this.load();
    const now = new Date().toISOString();
    const user: UserEntity = {
      id: crypto.randomUUID(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName.trim(),
      targetScore: input.targetScore ?? 800,
      targetMajor: null,
      examDate: null,
      diagnosticCompleted: false,
      themePreference: "system",
      createdAt: now,
      updatedAt: now,
    };
    s.users.push(user);
    s.momentums.push({
      userId: user.id,
      precisionComboCurrent: 0,
      precisionComboBest: 0,
      tier0RecoveryShieldsRemaining: 3,
      tier0RecoveryShieldsUsed: 0,
      estimatedIrtComposite: 400,
      subtestIrtScores: { PU: 400, PPU: 400, PBM: 400, PK: 400, LBI: 400, LBE: 400, PM: 400 },
      lastStudyAt: null,
      updatedAt: now,
    });
    s.masteries.push(...buildInitialMasteries(user.id, s.skillNodes, s.skillEdges));
    await this.persist();
    return user;
  }

  async updateUserProfile(
    userId: string,
    patch: Partial<
      Pick<UserEntity, "displayName" | "targetScore" | "targetMajor" | "examDate" | "diagnosticCompleted" | "themePreference">
    >,
  ): Promise<UserEntity> {
    const s = await this.load();
    const idx = s.users.findIndex((u) => u.id === userId);
    if (idx < 0) throw new Error("User not found.");
    s.users[idx] = { ...s.users[idx], ...patch, updatedAt: new Date().toISOString() };
    await this.persist();
    return s.users[idx];
  }

  async createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: string;
    userAgent: string | null;
    ipHash: string | null;
  }): Promise<UserSessionEntity> {
    const s = await this.load();
    const session: UserSessionEntity = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    s.sessions.push(session);
    await this.persist();
    return session;
  }

  async findSessionByTokenHash(tokenHash: string): Promise<{ session: UserSessionEntity; user: UserEntity } | null> {
    const s = await this.load();
    const session = s.sessions.find((ss) => ss.tokenHash === tokenHash);
    if (!session) return null;
    const user = s.users.find((u) => u.id === session.userId);
    if (!user) return null;
    return { session, user };
  }

  async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    const s = await this.load();
    s.sessions = s.sessions.filter((ss) => ss.tokenHash !== tokenHash);
    await this.persist();
  }

  async getOrInitMomentum(userId: string): Promise<UserMomentumState> {
    const s = await this.load();
    let found = s.momentums.find((m) => m.userId === userId);
    if (!found) {
      found = {
        userId,
        precisionComboCurrent: 0,
        precisionComboBest: 0,
        tier0RecoveryShieldsRemaining: 3,
        tier0RecoveryShieldsUsed: 0,
        estimatedIrtComposite: 400,
        subtestIrtScores: { PU: 400, PPU: 400, PBM: 400, PK: 400, LBI: 400, LBE: 400, PM: 400 },
        lastStudyAt: null,
        updatedAt: new Date().toISOString(),
      };
      s.momentums.push(found);
      await this.persist();
    }
    return found;
  }

  async saveMomentum(momentum: UserMomentumState): Promise<void> {
    const s = await this.load();
    const idx = s.momentums.findIndex((m) => m.userId === momentum.userId);
    if (idx >= 0) s.momentums[idx] = momentum;
    else s.momentums.push(momentum);
    await this.persist();
  }

  async listSkillNodes(): Promise<SkillNode[]> {
    const s = await this.load();
    return [...s.skillNodes].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async listSkillEdges(): Promise<SkillPrerequisiteEdge[]> {
    const s = await this.load();
    return s.skillEdges;
  }

  async getSkillNodeById(nodeId: string): Promise<SkillNode | null> {
    const s = await this.load();
    return s.skillNodes.find((n) => n.id === nodeId) ?? null;
  }

  async listUserSkillMasteries(userId: string): Promise<UserSkillMastery[]> {
    const s = await this.load();
    let rows = s.masteries.filter((m) => m.userId === userId);
    if (rows.length === 0) {
      rows = buildInitialMasteries(userId, s.skillNodes, s.skillEdges);
      s.masteries.push(...rows);
      await this.persist();
    }
    return rows;
  }

  async upsertUserSkillMastery(mastery: UserSkillMastery): Promise<void> {
    const s = await this.load();
    const idx = s.masteries.findIndex(
      (m) => m.userId === mastery.userId && m.skillNodeId === mastery.skillNodeId,
    );
    if (idx >= 0) s.masteries[idx] = mastery;
    else s.masteries.push(mastery);
    await this.persist();
  }

  async listQuestions(filter?: {
    userId?: string;
    subtest?: SnbtSubtest;
    skillNodeId?: string;
    qcStatus?: QcStatus;
  }): Promise<QuestionEntity[]> {
    const s = await this.load();
    return s.questions.filter((q) => {
      if (filter?.userId && q.ownerUserId !== null && q.ownerUserId !== filter.userId) return false;
      if (filter?.subtest && q.subtest !== filter.subtest) return false;
      if (filter?.skillNodeId && q.skillNodeId !== filter.skillNodeId) return false;
      if (filter?.qcStatus && q.qcStatus !== filter.qcStatus) return false;
      return true;
    });
  }

  async getQuestionById(questionId: string): Promise<QuestionEntity | null> {
    const s = await this.load();
    return s.questions.find((q) => q.id === questionId) ?? null;
  }

  async saveQuestion(question: QuestionEntity): Promise<void> {
    const s = await this.load();
    const idx = s.questions.findIndex((q) => q.id === question.id);
    if (idx >= 0) s.questions[idx] = question;
    else s.questions.push(question);
    await this.persist();
  }

  async listActiveTemplates(filter?: {
    skillNodeId?: string;
    subtest?: "PU" | "PK" | "PM";
  }): Promise<QuestionTemplateEntity[]> {
    const s = await this.load();
    return s.templates.filter((t) => {
      if (!t.isActive) return false;
      if (filter?.skillNodeId && t.skillNodeId !== filter.skillNodeId) return false;
      if (filter?.subtest && t.subtest !== filter.subtest) return false;
      return true;
    });
  }

  async getTemplateById(templateId: string): Promise<QuestionTemplateEntity | null> {
    const s = await this.load();
    return s.templates.find((t) => t.id === templateId) ?? null;
  }

  async saveTemplate(template: QuestionTemplateEntity): Promise<void> {
    const s = await this.load();
    const idx = s.templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) s.templates[idx] = template;
    else s.templates.push(template);
    await this.persist();
  }

  async saveVerificationRun(run: MathVerificationRunEntity): Promise<void> {
    const s = await this.load();
    const idx = s.verificationRuns.findIndex((r) => r.id === run.id);
    if (idx >= 0) s.verificationRuns[idx] = run;
    else s.verificationRuns.push(run);
    await this.persist();
  }

  async listVerificationRuns(limit = 20): Promise<MathVerificationRunEntity[]> {
    const s = await this.load();
    return [...s.verificationRuns]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async listDueFsrsCards(userId: string, nowIso: string): Promise<FsrsCardEntity[]> {
    const s = await this.load();
    return s.fsrsCards
      .filter((c) => c.userId === userId && c.due <= nowIso)
      .sort((a, b) => a.due.localeCompare(b.due));
  }

  async findFsrsCard(params: {
    userId: string;
    skillNodeId: string;
    questionId: string | null;
    cardScope: "skill_concept" | "mistake_revival";
  }): Promise<FsrsCardEntity | null> {
    const s = await this.load();
    return (
      s.fsrsCards.find(
        (c) =>
          c.userId === params.userId &&
          c.cardScope === params.cardScope &&
          c.skillNodeId === params.skillNodeId &&
          (params.cardScope === "skill_concept" || c.questionId === params.questionId),
      ) ?? null
    );
  }

  async getFsrsCardById(cardId: string): Promise<FsrsCardEntity | null> {
    const s = await this.load();
    return s.fsrsCards.find((c) => c.id === cardId) ?? null;
  }

  async upsertFsrsCard(card: FsrsCardEntity): Promise<void> {
    const s = await this.load();
    const idx = s.fsrsCards.findIndex((c) => c.id === card.id);
    if (idx >= 0) s.fsrsCards[idx] = card;
    else s.fsrsCards.push(card);
    await this.persist();
  }

  async listMistakeFractures(
    userId: string,
    filter?: { status?: FractureStatus; rootCause?: RootCauseType },
  ): Promise<MistakeFractureEntity[]> {
    const s = await this.load();
    return s.fractures
      .filter((f) => {
        if (f.userId !== userId) return false;
        if (filter?.status && f.status !== filter.status) return false;
        if (filter?.rootCause && f.primaryRootCause !== filter.rootCause) return false;
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getFractureById(fractureId: string): Promise<MistakeFractureEntity | null> {
    const s = await this.load();
    return s.fractures.find((f) => f.id === fractureId) ?? null;
  }

  async upsertMistakeFracture(fracture: MistakeFractureEntity): Promise<void> {
    const s = await this.load();
    const idx = s.fractures.findIndex((f) => f.id === fracture.id);
    if (idx >= 0) s.fractures[idx] = fracture;
    else s.fractures.push(fracture);
    await this.persist();
  }

  async recordAttempt(attempt: QuestionAttemptEntity): Promise<void> {
    const s = await this.load();
    s.attempts.push(attempt);
    await this.persist();
  }

  async listUserAttempts(
    userId: string,
    filter?: { skillNodeId?: string; limit?: number },
  ): Promise<QuestionAttemptEntity[]> {
    const s = await this.load();
    const filtered = s.attempts
      .filter((a) => a.userId === userId && (!filter?.skillNodeId || a.skillNodeId === filter.skillNodeId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return filter?.limit ? filtered.slice(0, filter.limit) : filtered;
  }

  async listVaultDocuments(userId: string): Promise<BrainVaultDocument[]> {
    const s = await this.load();
    return s.vaultDocuments
      .filter((d) => d.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getVaultDocumentById(userId: string, documentId: string): Promise<BrainVaultDocument | null> {
    const s = await this.load();
    return s.vaultDocuments.find((d) => d.userId === userId && d.id === documentId) ?? null;
  }

  async findVaultDocumentByHash(userId: string, sha256Hash: string): Promise<BrainVaultDocument | null> {
    const s = await this.load();
    return s.vaultDocuments.find((d) => d.userId === userId && d.sha256Hash === sha256Hash) ?? null;
  }

  async upsertVaultDocument(doc: BrainVaultDocument): Promise<void> {
    const s = await this.load();
    const idx = s.vaultDocuments.findIndex((d) => d.id === doc.id);
    if (idx >= 0) s.vaultDocuments[idx] = doc;
    else s.vaultDocuments.push(doc);
    await this.persist();
  }

  async listVaultPages(documentId: string): Promise<BrainVaultPage[]> {
    const s = await this.load();
    return s.vaultPages
      .filter((p) => p.documentId === documentId)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }

  async getVaultPageByNumber(documentId: string, pageNumber: number): Promise<BrainVaultPage | null> {
    const s = await this.load();
    return s.vaultPages.find((p) => p.documentId === documentId && p.pageNumber === pageNumber) ?? null;
  }

  async upsertVaultPage(page: BrainVaultPage): Promise<void> {
    const s = await this.load();
    const idx = s.vaultPages.findIndex((p) => p.id === page.id);
    if (idx >= 0) s.vaultPages[idx] = page;
    else s.vaultPages.push(page);
    await this.persist();
  }

  async findExtractedItemInDocument(
    userId: string,
    itemId: string,
  ): Promise<{ doc: BrainVaultDocument; page: BrainVaultPage; item: ExtractedVisionItem } | null> {
    const s = await this.load();
    for (const page of s.vaultPages) {
      const item = page.items.find((it) => it.id === itemId);
      if (!item) continue;
      const doc = s.vaultDocuments.find((d) => d.id === page.documentId && d.userId === userId);
      if (doc) return { doc, page, item };
    }
    return null;
  }

  async listVaultChunks(userId: string): Promise<BrainVaultChunk[]> {
    const s = await this.load();
    return s.vaultChunks
      .filter((c) => c.userId === userId && c.qcStatus === "approved")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async upsertVaultChunk(chunk: BrainVaultChunk): Promise<void> {
    const s = await this.load();
    const idx = s.vaultChunks.findIndex((c) => c.id === chunk.id);
    if (idx >= 0) s.vaultChunks[idx] = chunk;
    else s.vaultChunks.push(chunk);
    await this.persist();
  }

  async searchHybridVaultChunks(params: {
    userId: string;
    queryText: string;
    formulaQuery: string;
    queryEmbedding: number[] | null;
    subtest: SnbtSubtest | null;
    limit: number;
  }): Promise<VaultSearchResultItem[]> {
    const s = await this.load();
    const candidates = s.vaultChunks.filter(
      (c) =>
        c.userId === params.userId &&
        c.qcStatus === "approved" &&
        (params.subtest === null || c.subtest === null || c.subtest === params.subtest),
    );

    const cosineVec = (a: number[], b: number[]): number => {
      let dot = 0;
      let na = 0;
      let nb = 0;
      for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
      }
      if (na === 0 || nb === 0) return 0;
      return dot / (Math.sqrt(na) * Math.sqrt(nb));
    };

    const withDense = candidates
      .map((c) => ({
        chunk: c,
        cos:
          params.queryEmbedding && c.embedding
            ? cosineVec(params.queryEmbedding, c.embedding)
            : deterministicTextOverlapScore(
                `${params.queryText} ${params.formulaQuery}`,
                `${c.methodLabel ?? ""} ${c.contentMarkdown} ${c.contentLatex ?? ""}`,
              ),
      }))
      .filter((x) => x.cos > 0)
      .sort((a, b) => b.cos - a.cos);

    const withSparse = candidates
      .map((c) => ({
        chunk: c,
        lex: deterministicTextOverlapScore(
          `${params.queryText} ${params.formulaQuery}`,
          `${c.methodLabel ?? ""} ${c.contentMarkdown} ${c.contentLatex ?? ""}`,
        ),
      }))
      .filter((x) => x.lex > 0)
      .sort((a, b) => b.lex - a.lex);

    const denseRanks = new Map<string, { rank: number; cos: number }>();
    withDense.slice(0, 25).forEach((item, i) => denseRanks.set(item.chunk.id, { rank: i + 1, cos: item.cos }));

    const sparseRanks = new Map<string, number>();
    withSparse.slice(0, 25).forEach((item, i) => sparseRanks.set(item.chunk.id, i + 1));

    const rrfInputs = candidates
      .filter((c) => denseRanks.has(c.id) || sparseRanks.has(c.id))
      .map((c) => ({
        id: c.id,
        denseRank: denseRanks.get(c.id)?.rank ?? null,
        sparseRank: sparseRanks.get(c.id) ?? null,
        cosineSimilarity: denseRanks.get(c.id)?.cos ?? 0,
        isUserPriority: c.isUserPriority,
      }));

    const scored = scoreHybridRrf(rrfInputs);
    const chunkMap = new Map(candidates.map((c) => [c.id, c]));

    return scored
      .filter((sc) => sc.passesCitationGate || sc.rrfScore >= 0.008)
      .slice(0, params.limit)
      .map((sc) => ({
        chunk: chunkMap.get(sc.id)!,
        cosineSimilarity: sc.cosineSimilarity,
        rrfScore: sc.rrfScore,
      }));
  }

  async recordSocraticHintLog(log: SocraticHintLogEntity): Promise<void> {
    const s = await this.load();
    s.socraticLogs.push(log);
    await this.persist();
  }

  async listSocraticHintLogs(userId: string, questionId: string): Promise<SocraticHintLogEntity[]> {
    const s = await this.load();
    return s.socraticLogs
      .filter((l) => l.userId === userId && l.questionId === questionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async recordAiRoutingLedger(entry: AiRoutingLedgerEntry): Promise<void> {
    const s = await this.load();
    s.aiLedger.push(entry);
    if (s.aiLedger.length > 500) {
      s.aiLedger = s.aiLedger.slice(-500);
    }
    await this.persist();
  }

  async listAiRoutingLedger(userId: string, limit = 50): Promise<AiRoutingLedgerEntry[]> {
    const s = await this.load();
    return s.aiLedger
      .filter((l) => l.userId === null || l.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async createSimulationWithBlocks(
    session: SimulationSessionEntity,
    blocks: SimulationSubtestBlockEntity[],
  ): Promise<void> {
    const s = await this.load();
    s.simulations.push(session);
    s.simulationBlocks.push(...blocks);
    await this.persist();
  }

  async getSimulationById(
    userId: string,
    sessionId: string,
  ): Promise<{ session: SimulationSessionEntity; blocks: SimulationSubtestBlockEntity[] } | null> {
    const s = await this.load();
    const session = s.simulations.find((sim) => sim.id === sessionId && sim.userId === userId);
    if (!session) return null;
    const blocks = s.simulationBlocks
      .filter((b) => b.simulationSessionId === sessionId)
      .sort((a, b) => a.blockOrder - b.blockOrder);
    return { session, blocks };
  }

  async listSimulations(userId: string): Promise<SimulationSessionEntity[]> {
    const s = await this.load();
    return s.simulations
      .filter((sim) => sim.userId === userId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async updateSimulationSession(session: SimulationSessionEntity): Promise<void> {
    const s = await this.load();
    const idx = s.simulations.findIndex((sim) => sim.id === session.id);
    if (idx >= 0) s.simulations[idx] = session;
    await this.persist();
  }

  async updateSimulationBlock(block: SimulationSubtestBlockEntity): Promise<void> {
    const s = await this.load();
    const idx = s.simulationBlocks.findIndex((b) => b.id === block.id);
    if (idx >= 0) s.simulationBlocks[idx] = block;
    await this.persist();
  }
}
