import crypto from "node:crypto";
import type { Pool } from "pg";
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

function mapUserRow(row: Record<string, unknown>): UserEntity {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    displayName: String(row.display_name),
    targetScore: Number(row.target_score),
    targetMajor: row.target_major ? String(row.target_major) : null,
    examDate: row.exam_date ? new Date(String(row.exam_date)).toISOString().slice(0, 10) : null,
    diagnosticCompleted: Boolean(row.diagnostic_completed),
    themePreference: String(row.theme_preference) as UserEntity["themePreference"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapSkillNodeRow(row: Record<string, unknown>): SkillNode {
  return {
    id: String(row.id),
    code: String(row.code),
    subtest: String(row.subtest) as SnbtSubtest,
    track: String(row.track) as SkillNode["track"],
    tier: String(row.tier) as SkillNode["tier"],
    titleId: String(row.title_id),
    titleEn: row.title_en ? String(row.title_en) : null,
    descriptionMarkdown: String(row.description_markdown),
    firstPrinciplesSummary: String(row.first_principles_summary),
    isFoundationRepair: Boolean(row.is_foundation_repair),
    softGateThreshold: Number(row.soft_gate_threshold),
    conquestThreshold: Number(row.conquest_threshold),
    targetSolveSeconds: Number(row.target_solve_seconds),
    graphX: Number(row.graph_x),
    graphY: Number(row.graph_y),
    displayOrder: Number(row.display_order),
  };
}

function mapMasteryRow(row: Record<string, unknown>): UserSkillMastery {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    skillNodeId: String(row.skill_node_id),
    status: String(row.status) as UserSkillMastery["status"],
    masteryScore: Number(row.mastery_score),
    currentFadingStage: String(row.current_fading_stage) as UserSkillMastery["currentFadingStage"],
    attemptsTotal: Number(row.attempts_total),
    attemptsCorrect: Number(row.attempts_correct),
    rollingAccuracy10: Number(row.rolling_accuracy_10),
    medianSolveMs: row.median_solve_ms !== null ? Number(row.median_solve_ms) : null,
    interleavePriority: Number(row.interleave_priority),
    recoveryShieldActive: Boolean(row.recovery_shield_active),
    lastPracticedAt: row.last_practiced_at ? new Date(String(row.last_practiced_at)).toISOString() : null,
    masteredAt: row.mastered_at ? new Date(String(row.mastered_at)).toISOString() : null,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapQuestionRow(row: Record<string, unknown>): QuestionEntity {
  return {
    id: String(row.id),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
    skillNodeId: String(row.skill_node_id),
    subtest: String(row.subtest) as SnbtSubtest,
    track: String(row.track) as QuestionEntity["track"],
    tier: String(row.tier) as QuestionEntity["tier"],
    sourceType: String(row.source_type) as QuestionEntity["sourceType"],
    sourceDocumentId: row.source_document_id ? String(row.source_document_id) : null,
    sourcePageId: row.source_page_id ? String(row.source_page_id) : null,
    parentQuestionId: row.parent_question_id ? String(row.parent_question_id) : null,
    templateId: row.template_id ? String(row.template_id) : null,
    verificationRunId: row.verification_run_id ? String(row.verification_run_id) : null,
    format: String(row.format) as QuestionEntity["format"],
    qcStatus: String(row.qc_status) as QcStatus,
    stemMarkdown: String(row.stem_markdown),
    stemLatex: row.stem_latex ? String(row.stem_latex) : null,
    passageText: row.passage_text ? String(row.passage_text) : null,
    passageSentences: (row.passage_sentences as QuestionEntity["passageSentences"]) ?? null,
    evidenceSentenceIds: Array.isArray(row.evidence_sentence_ids)
      ? row.evidence_sentence_ids.map(String)
      : [],
    diagramAssetUrl: row.diagram_asset_url ? String(row.diagram_asset_url) : null,
    diagramAltText: row.diagram_alt_text ? String(row.diagram_alt_text) : null,
    options: (row.options as QuestionEntity["options"]) ?? [],
    correctAnswerKey: String(row.correct_answer_key) as QuestionEntity["correctAnswerKey"],
    officialSolutionMarkdown: String(row.official_solution_markdown),
    solutionSteps: (row.solution_steps as QuestionEntity["solutionSteps"]) ?? [],
    sbiDeconstruction: (row.sbi_deconstruction as QuestionEntity["sbiDeconstruction"]) ?? null,
    irtDifficultyB: Number(row.irt_difficulty_b),
    irtDiscriminationA: Number(row.irt_discrimination_a),
    irtGuessingC: Number(row.irt_guessing_c),
    expectedSolveSeconds: Number(row.expected_solve_seconds),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapTemplateRow(row: Record<string, unknown>): QuestionTemplateEntity {
  const rawPolya = row.polya_variables_schema as
    | QuestionTemplateEntity["polyaVariablesSchema"]
    | {
        variables?: QuestionTemplateEntity["polyaVariablesSchema"];
        solutionStepTemplates?: QuestionTemplateEntity["solutionStepTemplates"];
      };
  const variables = Array.isArray(rawPolya) ? rawPolya : rawPolya?.variables ?? [];
  const stepTemplates = Array.isArray(rawPolya) ? [] : rawPolya?.solutionStepTemplates ?? [];

  return {
    id: String(row.id),
    skillNodeId: String(row.skill_node_id),
    subtest: String(row.subtest) as QuestionTemplateEntity["subtest"],
    tier: String(row.tier) as QuestionTemplateEntity["tier"],
    sandboxRuntime: String(row.sandbox_runtime) as QuestionTemplateEntity["sandboxRuntime"],
    sourceQuestionId: row.source_question_id ? String(row.source_question_id) : null,
    templateTitle: String(row.template_title),
    stemTemplateLatex: String(row.stem_template_latex),
    sbiSchemaType: row.sbi_schema_type ? String(row.sbi_schema_type) : null,
    polyaVariablesSchema: variables,
    solutionStepTemplates: stepTemplates,
    generatorCode: String(row.generator_code),
    parameterBoundsJson: (row.parameter_bounds_json as Record<string, unknown>) ?? {},
    codeSha256: String(row.code_sha256),
    isActive: Boolean(row.is_active),
    createdByModel: String(row.created_by_model),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export class PostgresRepository implements AppRepository {
  constructor(private readonly pool: Pool) {}

  async ensureDefaultOwnerUser(): Promise<UserEntity> {
    const existing = await this.pool.query(
      `SELECT * FROM users ORDER BY created_at ASC LIMIT 1`,
    );
    if (existing.rows.length > 0) return mapUserRow(existing.rows[0]);

    const res = await this.pool.query(
      `INSERT INTO users (id, email, password_hash, display_name, target_score, target_major, exam_date)
       VALUES ($1, $2, $3, $4, 800, 'Teknik Informatika / Kedokteran', '2027-05-15')
       ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING *`,
      [
        "00000000-0000-4000-8000-000000000001",
        "pejuang800@kejarsnbt.local",
        "local-power-tool-no-password-required",
        "Pejuang SNBT",
      ],
    );
    const user = mapUserRow(res.rows[0]);
    await this.getOrInitMomentum(user.id);
    return user;
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    const res = await this.pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    return res.rows[0] ? mapUserRow(res.rows[0]) : null;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const res = await this.pool.query(`SELECT * FROM users WHERE LOWER(email::text) = LOWER($1) LIMIT 1`, [
      email.trim(),
    ]);
    return res.rows[0] ? mapUserRow(res.rows[0]) : null;
  }

  async findUserByIdentifier(identifier: string): Promise<UserEntity | null> {
    const cleaned = identifier.trim();
    const res = await this.pool.query(
      `SELECT * FROM users WHERE LOWER(email::text) = LOWER($1) OR LOWER(display_name) = LOWER($1) LIMIT 1`,
      [cleaned],
    );
    return res.rows[0] ? mapUserRow(res.rows[0]) : null;
  }

  async createUser(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    targetScore?: number;
  }): Promise<UserEntity> {
    const res = await this.pool.query(
      `INSERT INTO users (email, password_hash, display_name, target_score)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.email.trim(), input.passwordHash, input.displayName.trim(), input.targetScore ?? 800],
    );
    const user = mapUserRow(res.rows[0]);
    await this.getOrInitMomentum(user.id);
    await this.listUserSkillMasteries(user.id);
    return user;
  }

  async updateUserProfile(
    userId: string,
    patch: Partial<
      Pick<UserEntity, "displayName" | "targetScore" | "targetMajor" | "examDate" | "diagnosticCompleted" | "themePreference">
    >,
  ): Promise<UserEntity> {
    const current = await this.findUserById(userId);
    if (!current) throw new Error("User not found.");
    const next = { ...current, ...patch };
    const res = await this.pool.query(
      `UPDATE users
       SET display_name = $2, target_score = $3, target_major = $4, exam_date = $5,
           diagnostic_completed = $6, theme_preference = $7
       WHERE id = $1 RETURNING *`,
      [
        userId,
        next.displayName,
        next.targetScore,
        next.targetMajor,
        next.examDate,
        next.diagnosticCompleted,
        next.themePreference,
      ],
    );
    return mapUserRow(res.rows[0]);
  }

  async createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: string;
    userAgent: string | null;
    ipHash: string | null;
  }): Promise<UserSessionEntity> {
    const res = await this.pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at, user_agent, ip_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.userId, input.tokenHash, input.expiresAt, input.userAgent, input.ipHash],
    );
    const r = res.rows[0];
    return {
      id: String(r.id),
      userId: String(r.user_id),
      tokenHash: String(r.token_hash),
      expiresAt: new Date(String(r.expires_at)).toISOString(),
      userAgent: r.user_agent ? String(r.user_agent) : null,
      ipHash: r.ip_hash ? String(r.ip_hash) : null,
      createdAt: new Date(String(r.created_at)).toISOString(),
    };
  }

  async findSessionByTokenHash(tokenHash: string): Promise<{ session: UserSessionEntity; user: UserEntity } | null> {
    const res = await this.pool.query(
      `SELECT s.*, u.id AS u_id, u.email, u.password_hash, u.display_name, u.target_score,
              u.target_major, u.exam_date, u.diagnostic_completed, u.theme_preference,
              u.created_at AS u_created_at, u.updated_at AS u_updated_at
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [tokenHash],
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      session: {
        id: String(r.id),
        userId: String(r.user_id),
        tokenHash: String(r.token_hash),
        expiresAt: new Date(String(r.expires_at)).toISOString(),
        userAgent: r.user_agent ? String(r.user_agent) : null,
        ipHash: r.ip_hash ? String(r.ip_hash) : null,
        createdAt: new Date(String(r.created_at)).toISOString(),
      },
      user: {
        id: String(r.u_id),
        email: String(r.email),
        passwordHash: String(r.password_hash),
        displayName: String(r.display_name),
        targetScore: Number(r.target_score),
        targetMajor: r.target_major ? String(r.target_major) : null,
        examDate: r.exam_date ? new Date(String(r.exam_date)).toISOString().slice(0, 10) : null,
        diagnosticCompleted: Boolean(r.diagnostic_completed),
        themePreference: String(r.theme_preference) as UserEntity["themePreference"],
        createdAt: new Date(String(r.u_created_at)).toISOString(),
        updatedAt: new Date(String(r.u_updated_at)).toISOString(),
      },
    };
  }

  async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    await this.pool.query(`DELETE FROM user_sessions WHERE token_hash = $1`, [tokenHash]);
  }

  async getOrInitMomentum(userId: string): Promise<UserMomentumState> {
    const res = await this.pool.query(
      `INSERT INTO user_momentum_state (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING *`,
      [userId],
    );
    const r = res.rows[0];
    return {
      userId: String(r.user_id),
      precisionComboCurrent: Number(r.precision_combo_current),
      precisionComboBest: Number(r.precision_combo_best),
      tier0RecoveryShieldsRemaining: Number(r.tier0_recovery_shields_remaining),
      tier0RecoveryShieldsUsed: Number(r.tier0_recovery_shields_used),
      estimatedIrtComposite: Number(r.estimated_irt_composite),
      subtestIrtScores: r.subtest_irt_scores as UserMomentumState["subtestIrtScores"],
      lastStudyAt: r.last_study_at ? new Date(String(r.last_study_at)).toISOString() : null,
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    };
  }

  async saveMomentum(momentum: UserMomentumState): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_momentum_state (
        user_id, precision_combo_current, precision_combo_best,
        tier0_recovery_shields_remaining, tier0_recovery_shields_used,
        estimated_irt_composite, subtest_irt_scores, last_study_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
      ON CONFLICT (user_id) DO UPDATE SET
        precision_combo_current = EXCLUDED.precision_combo_current,
        precision_combo_best = EXCLUDED.precision_combo_best,
        tier0_recovery_shields_remaining = EXCLUDED.tier0_recovery_shields_remaining,
        tier0_recovery_shields_used = EXCLUDED.tier0_recovery_shields_used,
        estimated_irt_composite = EXCLUDED.estimated_irt_composite,
        subtest_irt_scores = EXCLUDED.subtest_irt_scores,
        last_study_at = EXCLUDED.last_study_at`,
      [
        momentum.userId,
        momentum.precisionComboCurrent,
        momentum.precisionComboBest,
        momentum.tier0RecoveryShieldsRemaining,
        momentum.tier0RecoveryShieldsUsed,
        momentum.estimatedIrtComposite,
        JSON.stringify(momentum.subtestIrtScores),
        momentum.lastStudyAt,
      ],
    );
  }

  async listSkillNodes(): Promise<SkillNode[]> {
    const res = await this.pool.query(`SELECT * FROM skill_nodes ORDER BY display_order ASC`);
    return res.rows.map(mapSkillNodeRow);
  }

  async listSkillEdges(): Promise<SkillPrerequisiteEdge[]> {
    const res = await this.pool.query(`SELECT * FROM skill_prerequisite_edges`);
    return res.rows.map((r) => ({
      parentNodeId: String(r.parent_node_id),
      childNodeId: String(r.child_node_id),
      edgeType: String(r.edge_type) as SkillPrerequisiteEdge["edgeType"],
      weight: Number(r.weight),
    }));
  }

  async getSkillNodeById(nodeId: string): Promise<SkillNode | null> {
    const res = await this.pool.query(`SELECT * FROM skill_nodes WHERE id = $1`, [nodeId]);
    return res.rows[0] ? mapSkillNodeRow(res.rows[0]) : null;
  }

  async listUserSkillMasteries(userId: string): Promise<UserSkillMastery[]> {
    const existing = await this.pool.query(
      `SELECT * FROM user_skill_mastery WHERE user_id = $1`,
      [userId],
    );
    if (existing.rows.length > 0) return existing.rows.map(mapMasteryRow);

    await this.pool.query(
      `INSERT INTO user_skill_mastery (
        user_id, skill_node_id, status, interleave_priority, recovery_shield_active
      )
      SELECT
        $1::uuid,
        n.id,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM skill_prerequisite_edges e
            WHERE e.child_node_id = n.id AND e.edge_type = 'hard_prereq'
          ) THEN 'locked'::mastery_status
          ELSE 'in_progress'::mastery_status
        END,
        CASE WHEN n.is_foundation_repair THEN 25 ELSE 0 END,
        n.is_foundation_repair
      FROM skill_nodes n
      ON CONFLICT (user_id, skill_node_id) DO NOTHING`,
      [userId],
    );
    const created = await this.pool.query(`SELECT * FROM user_skill_mastery WHERE user_id = $1`, [userId]);
    return created.rows.map(mapMasteryRow);
  }

  async upsertUserSkillMastery(mastery: UserSkillMastery): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_skill_mastery (
        id, user_id, skill_node_id, status, mastery_score, current_fading_stage,
        attempts_total, attempts_correct, rolling_accuracy_10, median_solve_ms,
        interleave_priority, recovery_shield_active, last_practiced_at, mastered_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (user_id, skill_node_id) DO UPDATE SET
        status = EXCLUDED.status,
        mastery_score = EXCLUDED.mastery_score,
        current_fading_stage = EXCLUDED.current_fading_stage,
        attempts_total = EXCLUDED.attempts_total,
        attempts_correct = EXCLUDED.attempts_correct,
        rolling_accuracy_10 = EXCLUDED.rolling_accuracy_10,
        median_solve_ms = EXCLUDED.median_solve_ms,
        interleave_priority = EXCLUDED.interleave_priority,
        recovery_shield_active = EXCLUDED.recovery_shield_active,
        last_practiced_at = EXCLUDED.last_practiced_at,
        mastered_at = EXCLUDED.mastered_at`,
      [
        mastery.id,
        mastery.userId,
        mastery.skillNodeId,
        mastery.status,
        mastery.masteryScore,
        mastery.currentFadingStage,
        mastery.attemptsTotal,
        mastery.attemptsCorrect,
        mastery.rollingAccuracy10,
        mastery.medianSolveMs,
        mastery.interleavePriority,
        mastery.recoveryShieldActive,
        mastery.lastPracticedAt,
        mastery.masteredAt,
      ],
    );
  }

  async listQuestions(filter?: {
    userId?: string;
    subtest?: SnbtSubtest;
    skillNodeId?: string;
    qcStatus?: QcStatus;
  }): Promise<QuestionEntity[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (filter?.userId) {
      values.push(filter.userId);
      clauses.push(`(owner_user_id IS NULL OR owner_user_id = $${values.length})`);
    }
    if (filter?.subtest) {
      values.push(filter.subtest);
      clauses.push(`subtest = $${values.length}`);
    }
    if (filter?.skillNodeId) {
      values.push(filter.skillNodeId);
      clauses.push(`skill_node_id = $${values.length}`);
    }
    if (filter?.qcStatus) {
      values.push(filter.qcStatus);
      clauses.push(`qc_status = $${values.length}`);
    }

    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const res = await this.pool.query(
      `SELECT * FROM questions ${whereSql} ORDER BY created_at DESC`,
      values,
    );
    return res.rows.map(mapQuestionRow);
  }

  async getQuestionById(questionId: string): Promise<QuestionEntity | null> {
    const res = await this.pool.query(`SELECT * FROM questions WHERE id = $1`, [questionId]);
    return res.rows[0] ? mapQuestionRow(res.rows[0]) : null;
  }

  async saveQuestion(q: QuestionEntity): Promise<void> {
    await this.pool.query(
      `INSERT INTO questions (
        id, owner_user_id, skill_node_id, subtest, track, tier, source_type,
        source_document_id, source_page_id, parent_question_id, template_id,
        verification_run_id, format, qc_status, stem_markdown, stem_latex,
        passage_text, passage_sentences, evidence_sentence_ids, diagram_asset_url,
        diagram_alt_text, options, correct_answer_key, official_solution_markdown,
        solution_steps, sbi_deconstruction, irt_difficulty_b, irt_discrimination_a,
        irt_guessing_c, expected_solve_seconds
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,
        $19,$20,$21,$22::jsonb,$23,$24,$25::jsonb,$26::jsonb,$27,$28,$29,$30
      )
      ON CONFLICT (id) DO UPDATE SET
        skill_node_id = EXCLUDED.skill_node_id,
        tier = EXCLUDED.tier,
        qc_status = EXCLUDED.qc_status,
        stem_markdown = EXCLUDED.stem_markdown,
        stem_latex = EXCLUDED.stem_latex,
        passage_text = EXCLUDED.passage_text,
        passage_sentences = EXCLUDED.passage_sentences,
        evidence_sentence_ids = EXCLUDED.evidence_sentence_ids,
        options = EXCLUDED.options,
        correct_answer_key = EXCLUDED.correct_answer_key,
        official_solution_markdown = EXCLUDED.official_solution_markdown,
        solution_steps = EXCLUDED.solution_steps,
        sbi_deconstruction = EXCLUDED.sbi_deconstruction,
        expected_solve_seconds = EXCLUDED.expected_solve_seconds`,
      [
        q.id,
        q.ownerUserId,
        q.skillNodeId,
        q.subtest,
        q.track,
        q.tier,
        q.sourceType,
        q.sourceDocumentId,
        q.sourcePageId,
        q.parentQuestionId,
        q.templateId,
        q.verificationRunId,
        q.format,
        q.qcStatus,
        q.stemMarkdown,
        q.stemLatex,
        q.passageText,
        q.passageSentences ? JSON.stringify(q.passageSentences) : null,
        q.evidenceSentenceIds,
        q.diagramAssetUrl,
        q.diagramAltText,
        JSON.stringify(q.options),
        q.correctAnswerKey,
        q.officialSolutionMarkdown,
        JSON.stringify(q.solutionSteps),
        q.sbiDeconstruction ? JSON.stringify(q.sbiDeconstruction) : null,
        q.irtDifficultyB,
        q.irtDiscriminationA,
        q.irtGuessingC,
        q.expectedSolveSeconds,
      ],
    );
  }

  async listActiveTemplates(filter?: {
    skillNodeId?: string;
    subtest?: "PU" | "PK" | "PM";
  }): Promise<QuestionTemplateEntity[]> {
    const clauses = [`is_active = TRUE`];
    const values: unknown[] = [];
    if (filter?.skillNodeId) {
      values.push(filter.skillNodeId);
      clauses.push(`skill_node_id = $${values.length}`);
    }
    if (filter?.subtest) {
      values.push(filter.subtest);
      clauses.push(`subtest = $${values.length}`);
    }
    const res = await this.pool.query(
      `SELECT * FROM question_templates WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`,
      values,
    );
    return res.rows.map(mapTemplateRow);
  }

  async getTemplateById(templateId: string): Promise<QuestionTemplateEntity | null> {
    const res = await this.pool.query(`SELECT * FROM question_templates WHERE id = $1`, [templateId]);
    return res.rows[0] ? mapTemplateRow(res.rows[0]) : null;
  }

  async saveTemplate(tpl: QuestionTemplateEntity): Promise<void> {
    const safeSha256 =
      tpl.codeSha256 && tpl.codeSha256.length === 64
        ? tpl.codeSha256
        : crypto.createHash("sha256").update(tpl.generatorCode).digest("hex");
    await this.pool.query(
      `INSERT INTO question_templates (
        id, skill_node_id, subtest, tier, sandbox_runtime, source_question_id,
        template_title, stem_template_latex, sbi_schema_type, polya_variables_schema,
        generator_code, parameter_bounds_json, code_sha256, is_active, created_by_model
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12::jsonb,$13,$14,$15)
      ON CONFLICT (id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        generator_code = EXCLUDED.generator_code,
        code_sha256 = EXCLUDED.code_sha256`,
      [
        tpl.id,
        tpl.skillNodeId,
        tpl.subtest,
        tpl.tier,
        tpl.sandboxRuntime,
        tpl.sourceQuestionId,
        tpl.templateTitle,
        tpl.stemTemplateLatex,
        tpl.sbiSchemaType,
        JSON.stringify({
          variables: tpl.polyaVariablesSchema,
          solutionStepTemplates: tpl.solutionStepTemplates,
        }),
        tpl.generatorCode,
        JSON.stringify(tpl.parameterBoundsJson),
        safeSha256,
        tpl.isActive,
        tpl.createdByModel,
      ],
    );
  }

  async saveVerificationRun(run: MathVerificationRunEntity): Promise<void> {
    await this.pool.query(
      `INSERT INTO math_verification_runs (
        id, template_id, question_id, sandbox_runtime, seed_value, code_sha256,
        status, execution_time_ms, peak_memory_kb, sandbox_exit_code,
        computed_ground_truth_json, computed_distractors_json, feasibility_checks_json, failure_reason
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14)`,
      [
        run.id,
        run.templateId,
        run.questionId,
        run.sandboxRuntime,
        run.seedValue,
        run.codeSha256,
        run.status,
        run.executionTimeMs,
        run.peakMemoryKb,
        run.sandboxExitCode,
        run.computedGroundTruthJson ? JSON.stringify(run.computedGroundTruthJson) : null,
        run.computedDistractorsJson ? JSON.stringify(run.computedDistractorsJson) : null,
        run.feasibilityChecksJson ? JSON.stringify(run.feasibilityChecksJson) : null,
        run.failureReason,
      ],
    );
  }

  async listVerificationRuns(limit = 20): Promise<MathVerificationRunEntity[]> {
    const res = await this.pool.query(
      `SELECT * FROM math_verification_runs ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      templateId: String(r.template_id),
      questionId: r.question_id ? String(r.question_id) : null,
      sandboxRuntime: String(r.sandbox_runtime) as MathVerificationRunEntity["sandboxRuntime"],
      seedValue: Number(r.seed_value),
      codeSha256: String(r.code_sha256),
      status: String(r.status) as MathVerificationRunEntity["status"],
      executionTimeMs: Number(r.execution_time_ms),
      peakMemoryKb: r.peak_memory_kb !== null ? Number(r.peak_memory_kb) : null,
      sandboxExitCode: r.sandbox_exit_code !== null ? Number(r.sandbox_exit_code) : null,
      computedGroundTruthJson: (r.computed_ground_truth_json as Record<string, unknown>) ?? null,
      computedDistractorsJson: (r.computed_distractors_json as unknown[]) ?? null,
      feasibilityChecksJson: (r.feasibility_checks_json as boolean[]) ?? null,
      failureReason: r.failure_reason ? String(r.failure_reason) : null,
      createdAt: new Date(String(r.created_at)).toISOString(),
    }));
  }

  private mapFsrsRow(r: Record<string, unknown>): FsrsCardEntity {
    return {
      id: String(r.id),
      userId: String(r.user_id),
      skillNodeId: String(r.skill_node_id),
      questionId: r.question_id ? String(r.question_id) : null,
      cardScope: String(r.card_scope) as FsrsCardEntity["cardScope"],
      state: String(r.state) as FsrsCardEntity["state"],
      due: new Date(String(r.due)).toISOString(),
      stability: Number(r.stability),
      difficulty: Number(r.difficulty),
      elapsedDays: Number(r.elapsed_days),
      scheduledDays: Number(r.scheduled_days),
      learningSteps: Number(r.learning_steps),
      reps: Number(r.reps),
      lapses: Number(r.lapses),
      lastReview: r.last_review ? new Date(String(r.last_review)).toISOString() : null,
      retrievabilitySnapshot:
        r.retrievability_snapshot !== null ? Number(r.retrievability_snapshot) : null,
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    };
  }

  async listDueFsrsCards(userId: string, nowIso: string): Promise<FsrsCardEntity[]> {
    const res = await this.pool.query(
      `SELECT * FROM fsrs_cards WHERE user_id = $1 AND due <= $2 ORDER BY due ASC`,
      [userId, nowIso],
    );
    return res.rows.map((r) => this.mapFsrsRow(r));
  }

  async findFsrsCard(params: {
    userId: string;
    skillNodeId: string;
    questionId: string | null;
    cardScope: "skill_concept" | "mistake_revival";
  }): Promise<FsrsCardEntity | null> {
    const res =
      params.cardScope === "skill_concept"
        ? await this.pool.query(
            `SELECT * FROM fsrs_cards WHERE user_id = $1 AND skill_node_id = $2 AND card_scope = 'skill_concept'`,
            [params.userId, params.skillNodeId],
          )
        : await this.pool.query(
            `SELECT * FROM fsrs_cards WHERE user_id = $1 AND question_id = $2 AND card_scope = 'mistake_revival'`,
            [params.userId, params.questionId],
          );
    return res.rows[0] ? this.mapFsrsRow(res.rows[0]) : null;
  }

  async getFsrsCardById(cardId: string): Promise<FsrsCardEntity | null> {
    const res = await this.pool.query(`SELECT * FROM fsrs_cards WHERE id = $1`, [cardId]);
    return res.rows[0] ? this.mapFsrsRow(res.rows[0]) : null;
  }

  async upsertFsrsCard(card: FsrsCardEntity): Promise<void> {
    await this.pool.query(
      `INSERT INTO fsrs_cards (
        id, user_id, skill_node_id, question_id, card_scope, state, due, stability,
        difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses,
        last_review, retrievability_snapshot
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (id) DO UPDATE SET
        state = EXCLUDED.state,
        due = EXCLUDED.due,
        stability = EXCLUDED.stability,
        difficulty = EXCLUDED.difficulty,
        elapsed_days = EXCLUDED.elapsed_days,
        scheduled_days = EXCLUDED.scheduled_days,
        learning_steps = EXCLUDED.learning_steps,
        reps = EXCLUDED.reps,
        lapses = EXCLUDED.lapses,
        last_review = EXCLUDED.last_review,
        retrievability_snapshot = EXCLUDED.retrievability_snapshot`,
      [
        card.id,
        card.userId,
        card.skillNodeId,
        card.questionId,
        card.cardScope,
        card.state,
        card.due,
        card.stability,
        card.difficulty,
        card.elapsedDays,
        card.scheduledDays,
        card.learningSteps,
        card.reps,
        card.lapses,
        card.lastReview,
        card.retrievabilitySnapshot,
      ],
    );
  }

  private mapFractureRow(r: Record<string, unknown>): MistakeFractureEntity {
    return {
      id: String(r.id),
      userId: String(r.user_id),
      skillNodeId: String(r.skill_node_id),
      originQuestionId: String(r.origin_question_id),
      originAttemptId: r.origin_attempt_id ? String(r.origin_attempt_id) : null,
      fsrsCardId: r.fsrs_card_id ? String(r.fsrs_card_id) : null,
      primaryRootCause: String(r.primary_root_cause) as RootCauseType,
      secondaryRootCause: r.secondary_root_cause
        ? (String(r.secondary_root_cause) as RootCauseType)
        : null,
      distractorTrapCaught: String(r.distractor_trap_caught) as MistakeFractureEntity["distractorTrapCaught"],
      diagnosticSummary: String(r.diagnostic_summary),
      status: String(r.status) as FractureStatus,
      revivalAttemptsCount: Number(r.revival_attempts_count),
      revivalPassesRequired: Number(r.revival_passes_required),
      revivalPassesAchieved: Number(r.revival_passes_achieved),
      lastIsomorphicQuestionId: r.last_isomorphic_question_id
        ? String(r.last_isomorphic_question_id)
        : null,
      healedAt: r.healed_at ? new Date(String(r.healed_at)).toISOString() : null,
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    };
  }

  async listMistakeFractures(
    userId: string,
    filter?: { status?: FractureStatus; rootCause?: RootCauseType },
  ): Promise<MistakeFractureEntity[]> {
    const clauses = [`user_id = $1`];
    const values: unknown[] = [userId];
    if (filter?.status) {
      values.push(filter.status);
      clauses.push(`status = $${values.length}`);
    }
    if (filter?.rootCause) {
      values.push(filter.rootCause);
      clauses.push(`primary_root_cause = $${values.length}`);
    }
    const res = await this.pool.query(
      `SELECT * FROM mistake_fractures WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC`,
      values,
    );
    return res.rows.map((r) => this.mapFractureRow(r));
  }

  async getFractureById(fractureId: string): Promise<MistakeFractureEntity | null> {
    const res = await this.pool.query(`SELECT * FROM mistake_fractures WHERE id = $1`, [fractureId]);
    return res.rows[0] ? this.mapFractureRow(res.rows[0]) : null;
  }

  async upsertMistakeFracture(f: MistakeFractureEntity): Promise<void> {
    await this.pool.query(
      `INSERT INTO mistake_fractures (
        id, user_id, skill_node_id, origin_question_id, origin_attempt_id, fsrs_card_id,
        primary_root_cause, secondary_root_cause, distractor_trap_caught, diagnostic_summary,
        status, revival_attempts_count, revival_passes_required, revival_passes_achieved,
        last_isomorphic_question_id, healed_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        revival_attempts_count = EXCLUDED.revival_attempts_count,
        revival_passes_achieved = EXCLUDED.revival_passes_achieved,
        last_isomorphic_question_id = EXCLUDED.last_isomorphic_question_id,
        healed_at = EXCLUDED.healed_at`,
      [
        f.id,
        f.userId,
        f.skillNodeId,
        f.originQuestionId,
        f.originAttemptId,
        f.fsrsCardId,
        f.primaryRootCause,
        f.secondaryRootCause,
        f.distractorTrapCaught,
        f.diagnosticSummary,
        f.status,
        f.revivalAttemptsCount,
        f.revivalPassesRequired,
        f.revivalPassesAchieved,
        f.lastIsomorphicQuestionId,
        f.healedAt,
      ],
    );
  }

  async recordAttempt(a: QuestionAttemptEntity): Promise<void> {
    await this.pool.query(
      `INSERT INTO question_attempts (
        id, user_id, question_id, skill_node_id, simulation_session_id, simulation_block_id,
        fracture_id, fsrs_card_id, attempt_mode, fading_stage_used, selected_answer_key,
        is_correct, time_to_solve_ms, first_interaction_ms, triage_decision_ms, triage_action,
        highlighted_sentence_ids, evidence_match_passed, sbi_schema_selected, sbi_variables_tagged,
        distractor_trap_identified, hints_used_count, max_hint_level, used_scratchpad,
        recovery_shield_consumed, root_cause, root_cause_confidence, fsrs_rating_assigned
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,
        $21,$22,$23,$24,$25,$26,$27,$28
      )`,
      [
        a.id,
        a.userId,
        a.questionId,
        a.skillNodeId,
        a.simulationSessionId,
        a.simulationBlockId,
        a.fractureId,
        a.fsrsCardId,
        a.attemptMode,
        a.fadingStageUsed,
        a.selectedAnswerKey,
        a.isCorrect,
        a.timeToSolveMs,
        a.firstInteractionMs,
        a.triageDecisionMs,
        a.triageAction,
        a.highlightedSentenceIds,
        a.evidenceMatchPassed,
        a.sbiSchemaSelected,
        a.sbiVariablesTagged ? JSON.stringify(a.sbiVariablesTagged) : null,
        a.distractorTrapIdentified,
        a.hintsUsedCount,
        a.maxHintLevel,
        a.usedScratchpad,
        a.recoveryShieldConsumed,
        a.rootCause,
        a.rootCauseConfidence,
        a.fsrsRatingAssigned,
      ],
    );
  }

  async listUserAttempts(
    userId: string,
    filter?: { skillNodeId?: string; limit?: number },
  ): Promise<QuestionAttemptEntity[]> {
    const clauses = [`user_id = $1`];
    const values: unknown[] = [userId];
    if (filter?.skillNodeId) {
      values.push(filter.skillNodeId);
      clauses.push(`skill_node_id = $${values.length}`);
    }
    const limitSql = filter?.limit ? `LIMIT ${Number(filter.limit)}` : "";
    const res = await this.pool.query(
      `SELECT * FROM question_attempts WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC ${limitSql}`,
      values,
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      questionId: String(r.question_id),
      skillNodeId: String(r.skill_node_id),
      simulationSessionId: r.simulation_session_id ? String(r.simulation_session_id) : null,
      simulationBlockId: r.simulation_block_id ? String(r.simulation_block_id) : null,
      fractureId: r.fracture_id ? String(r.fracture_id) : null,
      fsrsCardId: r.fsrs_card_id ? String(r.fsrs_card_id) : null,
      attemptMode: String(r.attempt_mode) as QuestionAttemptEntity["attemptMode"],
      fadingStageUsed: r.fading_stage_used
        ? (String(r.fading_stage_used) as QuestionAttemptEntity["fadingStageUsed"])
        : null,
      selectedAnswerKey: r.selected_answer_key
        ? (String(r.selected_answer_key) as QuestionAttemptEntity["selectedAnswerKey"])
        : null,
      isCorrect: Boolean(r.is_correct),
      timeToSolveMs: Number(r.time_to_solve_ms),
      firstInteractionMs: r.first_interaction_ms !== null ? Number(r.first_interaction_ms) : null,
      triageDecisionMs: r.triage_decision_ms !== null ? Number(r.triage_decision_ms) : null,
      triageAction: String(r.triage_action) as QuestionAttemptEntity["triageAction"],
      withinIrtTriageWindow: Boolean(r.within_irt_triage_window),
      highlightedSentenceIds: Array.isArray(r.highlighted_sentence_ids)
        ? r.highlighted_sentence_ids.map(String)
        : [],
      evidenceMatchPassed: r.evidence_match_passed !== null ? Boolean(r.evidence_match_passed) : null,
      sbiSchemaSelected: r.sbi_schema_selected ? String(r.sbi_schema_selected) : null,
      sbiVariablesTagged: (r.sbi_variables_tagged as Record<string, unknown>) ?? null,
      distractorTrapIdentified: String(
        r.distractor_trap_identified,
      ) as QuestionAttemptEntity["distractorTrapIdentified"],
      hintsUsedCount: Number(r.hints_used_count),
      maxHintLevel: r.max_hint_level
        ? (String(r.max_hint_level) as QuestionAttemptEntity["maxHintLevel"])
        : null,
      usedScratchpad: Boolean(r.used_scratchpad),
      recoveryShieldConsumed: Boolean(r.recovery_shield_consumed),
      rootCause: r.root_cause ? (String(r.root_cause) as RootCauseType) : null,
      rootCauseConfidence: r.root_cause_confidence !== null ? Number(r.root_cause_confidence) : null,
      fsrsRatingAssigned: r.fsrs_rating_assigned
        ? (String(r.fsrs_rating_assigned) as QuestionAttemptEntity["fsrsRatingAssigned"])
        : null,
      createdAt: new Date(String(r.created_at)).toISOString(),
    }));
  }

  private mapVaultDocRow(r: Record<string, unknown>): BrainVaultDocument {
    return {
      id: String(r.id),
      userId: String(r.user_id),
      title: String(r.title),
      docType: String(r.doc_type) as BrainVaultDocument["docType"],
      originalFilename: String(r.original_filename),
      mimeType: String(r.mime_type) as BrainVaultDocument["mimeType"],
      fileSizeBytes: Number(r.file_size_bytes),
      sha256Hash: String(r.sha256_hash),
      storageKey: String(r.storage_key),
      pageCount: Number(r.page_count),
      pagesProcessed: Number(r.pages_processed),
      status: String(r.status) as BrainVaultDocument["status"],
      subtestHint: r.subtest_hint ? (String(r.subtest_hint) as SnbtSubtest) : null,
      errorMessage: r.error_message ? String(r.error_message) : null,
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    };
  }

  private mapVaultPageRow(r: Record<string, unknown>): BrainVaultPage {
    const raw = (r.raw_vision_json as { items?: ExtractedVisionItem[] } | null) ?? {};
    return {
      id: String(r.id),
      documentId: String(r.document_id),
      pageNumber: Number(r.page_number),
      imageStorageKey: String(r.image_storage_key),
      visionModelUsed: r.vision_model_used ? String(r.vision_model_used) : null,
      extractionConfidence: r.extraction_confidence !== null ? Number(r.extraction_confidence) : null,
      ocrWarnings: Array.isArray(r.ocr_warnings) ? r.ocr_warnings.map(String) : [],
      katexValid: Boolean(r.katex_valid),
      qcStatus: String(r.qc_status) as QcStatus,
      items: Array.isArray(raw.items) ? raw.items : [],
      retryCount: Number(r.retry_count),
      lastError: r.last_error ? String(r.last_error) : null,
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    };
  }

  async listVaultDocuments(userId: string): Promise<BrainVaultDocument[]> {
    const res = await this.pool.query(
      `SELECT * FROM brain_vault_documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows.map((r) => this.mapVaultDocRow(r));
  }

  async getVaultDocumentById(userId: string, documentId: string): Promise<BrainVaultDocument | null> {
    const res = await this.pool.query(
      `SELECT * FROM brain_vault_documents WHERE user_id = $1 AND id = $2`,
      [userId, documentId],
    );
    return res.rows[0] ? this.mapVaultDocRow(res.rows[0]) : null;
  }

  async findVaultDocumentByHash(userId: string, sha256Hash: string): Promise<BrainVaultDocument | null> {
    const res = await this.pool.query(
      `SELECT * FROM brain_vault_documents WHERE user_id = $1 AND sha256_hash = $2`,
      [userId, sha256Hash],
    );
    return res.rows[0] ? this.mapVaultDocRow(res.rows[0]) : null;
  }

  async upsertVaultDocument(doc: BrainVaultDocument): Promise<void> {
    await this.pool.query(
      `INSERT INTO brain_vault_documents (
        id, user_id, title, doc_type, original_filename, mime_type, file_size_bytes,
        sha256_hash, storage_key, page_count, pages_processed, status, subtest_hint, error_message
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (id) DO UPDATE SET
        pages_processed = EXCLUDED.pages_processed,
        status = EXCLUDED.status,
        error_message = EXCLUDED.error_message`,
      [
        doc.id,
        doc.userId,
        doc.title,
        doc.docType,
        doc.originalFilename,
        doc.mimeType,
        doc.fileSizeBytes,
        doc.sha256Hash,
        doc.storageKey,
        doc.pageCount,
        doc.pagesProcessed,
        doc.status,
        doc.subtestHint,
        doc.errorMessage,
      ],
    );
  }

  async listVaultPages(documentId: string): Promise<BrainVaultPage[]> {
    const res = await this.pool.query(
      `SELECT * FROM brain_vault_pages WHERE document_id = $1 ORDER BY page_number ASC`,
      [documentId],
    );
    return res.rows.map((r) => this.mapVaultPageRow(r));
  }

  async getVaultPageByNumber(documentId: string, pageNumber: number): Promise<BrainVaultPage | null> {
    const res = await this.pool.query(
      `SELECT * FROM brain_vault_pages WHERE document_id = $1 AND page_number = $2`,
      [documentId, pageNumber],
    );
    return res.rows[0] ? this.mapVaultPageRow(res.rows[0]) : null;
  }

  async upsertVaultPage(page: BrainVaultPage): Promise<void> {
    await this.pool.query(
      `INSERT INTO brain_vault_pages (
        id, document_id, page_number, image_storage_key, vision_model_used,
        raw_vision_json, extraction_confidence, ocr_warnings, katex_valid,
        qc_status, retry_count, last_error, qc_reviewed_at
      ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (document_id, page_number) DO UPDATE SET
        vision_model_used = EXCLUDED.vision_model_used,
        raw_vision_json = EXCLUDED.raw_vision_json,
        extraction_confidence = EXCLUDED.extraction_confidence,
        ocr_warnings = EXCLUDED.ocr_warnings,
        katex_valid = EXCLUDED.katex_valid,
        qc_status = EXCLUDED.qc_status,
        retry_count = EXCLUDED.retry_count,
        last_error = EXCLUDED.last_error,
        qc_reviewed_at = EXCLUDED.qc_reviewed_at`,
      [
        page.id,
        page.documentId,
        page.pageNumber,
        page.imageStorageKey,
        page.visionModelUsed,
        JSON.stringify({ items: page.items }),
        page.extractionConfidence,
        page.ocrWarnings,
        page.katexValid,
        page.qcStatus,
        page.retryCount,
        page.lastError,
        page.qcStatus === "approved" ? new Date().toISOString() : null,
      ],
    );
  }

  async findExtractedItemInDocument(
    userId: string,
    itemId: string,
  ): Promise<{ doc: BrainVaultDocument; page: BrainVaultPage; item: ExtractedVisionItem } | null> {
    const res = await this.pool.query(
      `SELECT p.*, d.id AS d_id, d.user_id AS d_user_id, d.title AS d_title,
              d.doc_type AS d_doc_type, d.original_filename AS d_original_filename,
              d.mime_type AS d_mime_type, d.file_size_bytes AS d_file_size_bytes,
              d.sha256_hash AS d_sha256_hash, d.storage_key AS d_storage_key,
              d.page_count AS d_page_count, d.pages_processed AS d_pages_processed,
              d.status AS d_status, d.subtest_hint AS d_subtest_hint, d.error_message AS d_error_message,
              d.created_at AS d_created_at, d.updated_at AS d_updated_at
       FROM brain_vault_pages p
       JOIN brain_vault_documents d ON d.id = p.document_id
       WHERE d.user_id = $1`,
      [userId],
    );
    for (const r of res.rows) {
      const page = this.mapVaultPageRow(r);
      const item = page.items.find((it) => it.id === itemId);
      if (item) {
        return {
          doc: {
            id: String(r.d_id),
            userId: String(r.d_user_id),
            title: String(r.d_title),
            docType: String(r.d_doc_type) as BrainVaultDocument["docType"],
            originalFilename: String(r.d_original_filename),
            mimeType: String(r.d_mime_type) as BrainVaultDocument["mimeType"],
            fileSizeBytes: Number(r.d_file_size_bytes),
            sha256Hash: String(r.d_sha256_hash),
            storageKey: String(r.d_storage_key),
            pageCount: Number(r.d_page_count),
            pagesProcessed: Number(r.d_pages_processed),
            status: String(r.d_status) as BrainVaultDocument["status"],
            subtestHint: r.d_subtest_hint ? (String(r.d_subtest_hint) as SnbtSubtest) : null,
            errorMessage: r.d_error_message ? String(r.d_error_message) : null,
            createdAt: new Date(String(r.d_created_at)).toISOString(),
            updatedAt: new Date(String(r.d_updated_at)).toISOString(),
          },
          page,
          item,
        };
      }
    }
    return null;
  }

  private mapChunkRow(r: Record<string, unknown>): BrainVaultChunk {
    return {
      id: String(r.id),
      userId: String(r.user_id),
      documentId: String(r.document_id),
      pageId: r.page_id ? String(r.page_id) : null,
      skillNodeId: r.skill_node_id ? String(r.skill_node_id) : null,
      subtest: r.subtest ? (String(r.subtest) as SnbtSubtest) : null,
      chunkType: String(r.chunk_type) as BrainVaultChunk["chunkType"],
      contentMarkdown: String(r.content_markdown),
      contentLatex: r.content_latex ? String(r.content_latex) : null,
      methodLabel: r.method_label ? String(r.method_label) : null,
      validityConditions: r.validity_conditions ? String(r.validity_conditions) : null,
      diagramAssetUrl: r.diagram_asset_url ? String(r.diagram_asset_url) : null,
      qcStatus: String(r.qc_status) as QcStatus,
      isUserPriority: Boolean(r.is_user_priority),
      embedding: null,
      createdAt: new Date(String(r.created_at)).toISOString(),
    };
  }

  async listVaultChunks(userId: string): Promise<BrainVaultChunk[]> {
    const res = await this.pool.query(
      `SELECT * FROM brain_vault_chunks WHERE user_id = $1 AND qc_status = 'approved' ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows.map((r) => this.mapChunkRow(r));
  }

  async upsertVaultChunk(chunk: BrainVaultChunk): Promise<void> {
    const vecLiteral = chunk.embedding ? `[${chunk.embedding.join(",")}]` : null;
    await this.pool.query(
      `INSERT INTO brain_vault_chunks (
        id, user_id, document_id, page_id, skill_node_id, subtest, chunk_type,
        content_markdown, content_latex, method_label, validity_conditions,
        diagram_asset_url, qc_status, is_user_priority, embedding
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::vector)
      ON CONFLICT (id) DO UPDATE SET
        content_markdown = EXCLUDED.content_markdown,
        content_latex = EXCLUDED.content_latex,
        qc_status = EXCLUDED.qc_status,
        embedding = COALESCE(EXCLUDED.embedding, brain_vault_chunks.embedding)`,
      [
        chunk.id,
        chunk.userId,
        chunk.documentId,
        chunk.pageId,
        chunk.skillNodeId,
        chunk.subtest,
        chunk.chunkType,
        chunk.contentMarkdown,
        chunk.contentLatex,
        chunk.methodLabel,
        chunk.validityConditions,
        chunk.diagramAssetUrl,
        chunk.qcStatus,
        chunk.isUserPriority,
        vecLiteral,
      ],
    );
  }

  async searchHybridVaultChunks(params: {
    userId: string;
    queryText: string;
    formulaQuery: string;
    queryEmbedding: number[] | null;
    subtest: SnbtSubtest | null;
    limit: number;
  }): Promise<VaultSearchResultItem[]> {
    const vecLiteral = params.queryEmbedding ? `[${params.queryEmbedding.join(",")}]` : null;
    const res = await this.pool.query(
      `WITH params AS (
        SELECT
          $1::uuid AS uid,
          $2::vector(1536) AS qvec,
          plainto_tsquery('indonesian', $3) AS tsq,
          NULLIF(trim($4), '') AS tex_q,
          $5::snbt_subtest AS subtest_filter
      ),
      dense_candidates AS (
        SELECT
          c.id,
          (1.0 - (c.embedding <=> p.qvec)) AS cosine_similarity,
          ROW_NUMBER() OVER (ORDER BY c.embedding <=> p.qvec ASC) AS dense_rank
        FROM brain_vault_chunks c
        CROSS JOIN params p
        WHERE p.qvec IS NOT NULL
          AND c.qc_status = 'approved'
          AND c.embedding IS NOT NULL
          AND c.user_id = p.uid
          AND (p.subtest_filter IS NULL OR c.subtest IS NULL OR c.subtest = p.subtest_filter)
        ORDER BY c.embedding <=> p.qvec ASC
        LIMIT 25
      ),
      sparse_candidates AS (
        SELECT
          c.id,
          ROW_NUMBER() OVER (
            ORDER BY (
              COALESCE(ts_rank_cd(c.search_tsv, p.tsq), 0.0)
              + CASE
                  WHEN p.tex_q IS NOT NULL AND c.content_latex IS NOT NULL
                  THEN similarity(c.content_latex, p.tex_q) * 0.75
                  ELSE 0.0
                END
            ) DESC
          ) AS sparse_rank
        FROM brain_vault_chunks c
        CROSS JOIN params p
        WHERE c.qc_status = 'approved'
          AND c.user_id = p.uid
          AND (p.subtest_filter IS NULL OR c.subtest IS NULL OR c.subtest = p.subtest_filter)
          AND (c.search_tsv @@ p.tsq OR (p.tex_q IS NOT NULL AND c.content_latex % p.tex_q))
        LIMIT 25
      ),
      fused AS (
        SELECT
          c.*,
          COALESCE(d.cosine_similarity, 0.0) AS cosine_similarity,
          (
            (CASE WHEN d.dense_rank IS NOT NULL THEN 0.60 / (60.0 + d.dense_rank) ELSE 0.0 END)
            + (CASE WHEN s.sparse_rank IS NOT NULL THEN 0.40 / (60.0 + s.sparse_rank) ELSE 0.0 END)
          ) * (CASE WHEN c.is_user_priority THEN 1.35 ELSE 1.00 END) AS rrf_score
        FROM brain_vault_chunks c
        LEFT JOIN dense_candidates d ON d.id = c.id
        LEFT JOIN sparse_candidates s ON s.id = c.id
        WHERE d.id IS NOT NULL OR s.id IS NOT NULL
      )
      SELECT *
      FROM fused
      WHERE rrf_score >= 0.006 OR cosine_similarity >= 0.720
      ORDER BY rrf_score DESC, cosine_similarity DESC
      LIMIT $6`,
      [
        params.userId,
        vecLiteral,
        params.queryText,
        params.formulaQuery,
        params.subtest,
        params.limit,
      ],
    );

    return res.rows.map((r) => ({
      chunk: this.mapChunkRow(r),
      cosineSimilarity: Number(r.cosine_similarity),
      rrfScore: Number(r.rrf_score),
    }));
  }

  async recordSocraticHintLog(log: SocraticHintLogEntity): Promise<void> {
    await this.pool.query(
      `INSERT INTO socratic_hint_logs (
        id, user_id, question_id, attempt_id, hint_level, user_stuck_input,
        retrieved_vault_chunk_ids, grounded_in_user_vault, boundary_warning_shown,
        hint_response_markdown, model_alias, latency_ms
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        log.id,
        log.userId,
        log.questionId,
        log.attemptId,
        log.hintLevel,
        log.userStuckInput,
        log.retrievedVaultChunkIds,
        log.groundedInUserVault,
        log.boundaryWarningShown,
        log.hintResponseMarkdown,
        log.modelAlias,
        log.latencyMs,
      ],
    );
  }

  async listSocraticHintLogs(userId: string, questionId: string): Promise<SocraticHintLogEntity[]> {
    const res = await this.pool.query(
      `SELECT * FROM socratic_hint_logs WHERE user_id = $1 AND question_id = $2 ORDER BY created_at ASC`,
      [userId, questionId],
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      questionId: String(r.question_id),
      attemptId: r.attempt_id ? String(r.attempt_id) : null,
      hintLevel: String(r.hint_level) as SocraticHintLogEntity["hintLevel"],
      userStuckInput: r.user_stuck_input ? String(r.user_stuck_input) : null,
      retrievedVaultChunkIds: Array.isArray(r.retrieved_vault_chunk_ids)
        ? r.retrieved_vault_chunk_ids.map(String)
        : [],
      groundedInUserVault: Boolean(r.grounded_in_user_vault),
      boundaryWarningShown: Boolean(r.boundary_warning_shown),
      hintResponseMarkdown: String(r.hint_response_markdown),
      modelAlias: String(r.model_alias),
      latencyMs: Number(r.latency_ms),
      createdAt: new Date(String(r.created_at)).toISOString(),
    }));
  }

  async recordAiRoutingLedger(entry: AiRoutingLedgerEntry): Promise<void> {
    await this.pool.query(
      `INSERT INTO ai_routing_ledger (
        id, correlation_id, user_id, task_type, tier, requested_model_alias,
        actual_model_used, fallback_depth, prompt_tokens, completion_tokens,
        estimated_cost_usd, latency_ms, schema_valid, retry_count, http_status, error_code
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        entry.id,
        entry.correlationId,
        entry.userId,
        entry.taskType,
        entry.tier,
        entry.requestedModelAlias,
        entry.actualModelUsed,
        entry.fallbackDepth,
        entry.promptTokens,
        entry.completionTokens,
        entry.estimatedCostUsd,
        entry.latencyMs,
        entry.schemaValid,
        entry.retryCount,
        entry.httpStatus,
        entry.errorCode,
      ],
    );
  }

  async listAiRoutingLedger(userId: string, limit = 50): Promise<AiRoutingLedgerEntry[]> {
    const res = await this.pool.query(
      `SELECT * FROM ai_routing_ledger WHERE user_id IS NULL OR user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      correlationId: String(r.correlation_id),
      userId: r.user_id ? String(r.user_id) : null,
      taskType: String(r.task_type),
      tier: String(r.tier),
      requestedModelAlias: String(r.requested_model_alias),
      actualModelUsed: String(r.actual_model_used),
      fallbackDepth: Number(r.fallback_depth),
      promptTokens: Number(r.prompt_tokens),
      completionTokens: Number(r.completion_tokens),
      estimatedCostUsd: Number(r.estimated_cost_usd),
      latencyMs: Number(r.latency_ms),
      schemaValid: Boolean(r.schema_valid),
      retryCount: Number(r.retry_count),
      httpStatus: r.http_status !== null ? Number(r.http_status) : null,
      errorCode: r.error_code ? String(r.error_code) : null,
      createdAt: new Date(String(r.created_at)).toISOString(),
    }));
  }

  async createSimulationWithBlocks(
    session: SimulationSessionEntity,
    blocks: SimulationSubtestBlockEntity[],
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO simulation_sessions (
          id, user_id, session_mode, status, started_at, completed_at,
          total_duration_seconds, estimated_irt_score, accuracy_rate, triage_efficiency_score
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          session.id,
          session.userId,
          session.sessionMode,
          session.status,
          session.startedAt,
          session.completedAt,
          session.totalDurationSeconds,
          session.estimatedIrtScore,
          session.accuracyRate,
          session.triageEfficiencyScore,
        ],
      );

      for (const b of blocks) {
        await client.query(
          `INSERT INTO simulation_subtest_blocks (
            id, simulation_session_id, subtest, block_order, question_count,
            allocated_seconds, started_at, locked_at, ends_at, is_locked,
            subtest_irt_score, correct_count, skipped_smart_count
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            b.id,
            b.simulationSessionId,
            b.subtest,
            b.blockOrder,
            b.questionCount,
            b.allocatedSeconds,
            b.startedAt,
            b.lockedAt,
            b.endsAt,
            b.isLocked,
            b.subtestIrtScore,
            b.correctCount,
            b.skippedSmartCount,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getSimulationById(
    userId: string,
    sessionId: string,
  ): Promise<{ session: SimulationSessionEntity; blocks: SimulationSubtestBlockEntity[] } | null> {
    const sRes = await this.pool.query(
      `SELECT * FROM simulation_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    );
    if (sRes.rows.length === 0) return null;
    const sr = sRes.rows[0];
    const session: SimulationSessionEntity = {
      id: String(sr.id),
      userId: String(sr.user_id),
      sessionMode: String(sr.session_mode) as SimulationSessionEntity["sessionMode"],
      status: String(sr.status) as SimulationSessionEntity["status"],
      startedAt: new Date(String(sr.started_at)).toISOString(),
      completedAt: sr.completed_at ? new Date(String(sr.completed_at)).toISOString() : null,
      totalDurationSeconds: Number(sr.total_duration_seconds),
      estimatedIrtScore: sr.estimated_irt_score !== null ? Number(sr.estimated_irt_score) : null,
      accuracyRate: sr.accuracy_rate !== null ? Number(sr.accuracy_rate) : null,
      triageEfficiencyScore:
        sr.triage_efficiency_score !== null ? Number(sr.triage_efficiency_score) : null,
    };

    const bRes = await this.pool.query(
      `SELECT * FROM simulation_subtest_blocks WHERE simulation_session_id = $1 ORDER BY block_order ASC`,
      [sessionId],
    );

    const blocks: SimulationSubtestBlockEntity[] = [];
    for (const r of bRes.rows) {
      const subtest = String(r.subtest) as SnbtSubtest;
      const qCount = Number(r.question_count);
      const qIdsRes = await this.pool.query(
        `SELECT id FROM questions
         WHERE subtest = $1 AND qc_status = 'approved'
           AND (owner_user_id IS NULL OR owner_user_id = $2)
         ORDER BY created_at ASC, id ASC
         LIMIT $3`,
        [subtest, userId, qCount],
      );
      blocks.push({
        id: String(r.id),
        simulationSessionId: String(r.simulation_session_id),
        subtest,
        blockOrder: Number(r.block_order),
        questionCount: qCount,
        allocatedSeconds: Number(r.allocated_seconds),
        questionIds: qIdsRes.rows.map((qr) => String(qr.id)),
        startedAt: r.started_at ? new Date(String(r.started_at)).toISOString() : null,
        lockedAt: r.locked_at ? new Date(String(r.locked_at)).toISOString() : null,
        endsAt: r.ends_at ? new Date(String(r.ends_at)).toISOString() : null,
        isLocked: Boolean(r.is_locked),
        subtestIrtScore: r.subtest_irt_score !== null ? Number(r.subtest_irt_score) : null,
        correctCount: Number(r.correct_count),
        skippedSmartCount: Number(r.skipped_smart_count),
      });
    }

    return { session, blocks };
  }

  async listSimulations(userId: string): Promise<SimulationSessionEntity[]> {
    const res = await this.pool.query(
      `SELECT * FROM simulation_sessions WHERE user_id = $1 ORDER BY started_at DESC`,
      [userId],
    );
    return res.rows.map((sr) => ({
      id: String(sr.id),
      userId: String(sr.user_id),
      sessionMode: String(sr.session_mode) as SimulationSessionEntity["sessionMode"],
      status: String(sr.status) as SimulationSessionEntity["status"],
      startedAt: new Date(String(sr.started_at)).toISOString(),
      completedAt: sr.completed_at ? new Date(String(sr.completed_at)).toISOString() : null,
      totalDurationSeconds: Number(sr.total_duration_seconds),
      estimatedIrtScore: sr.estimated_irt_score !== null ? Number(sr.estimated_irt_score) : null,
      accuracyRate: sr.accuracy_rate !== null ? Number(sr.accuracy_rate) : null,
      triageEfficiencyScore:
        sr.triage_efficiency_score !== null ? Number(sr.triage_efficiency_score) : null,
    }));
  }

  async updateSimulationSession(session: SimulationSessionEntity): Promise<void> {
    await this.pool.query(
      `UPDATE simulation_sessions
       SET status = $2, completed_at = $3, total_duration_seconds = $4,
           estimated_irt_score = $5, accuracy_rate = $6, triage_efficiency_score = $7
       WHERE id = $1`,
      [
        session.id,
        session.status,
        session.completedAt,
        session.totalDurationSeconds,
        session.estimatedIrtScore,
        session.accuracyRate,
        session.triageEfficiencyScore,
      ],
    );
  }

  async updateSimulationBlock(b: SimulationSubtestBlockEntity): Promise<void> {
    await this.pool.query(
      `UPDATE simulation_subtest_blocks
       SET started_at = $2, locked_at = $3, ends_at = $4, is_locked = $5,
           subtest_irt_score = $6, correct_count = $7, skipped_smart_count = $8
       WHERE id = $1`,
      [
        b.id,
        b.startedAt,
        b.lockedAt,
        b.endsAt,
        b.isLocked,
        b.subtestIrtScore,
        b.correctCount,
        b.skippedSmartCount,
      ],
    );
  }
}

export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
