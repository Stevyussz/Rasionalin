-- ============================================================================
-- KejarSNBT: Production PostgreSQL 16+ + pgvector DDL Schema
-- Phase A Deliverable 2 (02-schema.sql)
-- Target Platform: Supabase Free Tier / PostgreSQL 16+ (Local or Managed)
-- Embedding Dimension: vector(1536) matching snbt-embed (adjustable prior to
-- initial migration if user switches to a 768-dim or 1024-dim embedding model)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- ----------------------------------------------------------------------------
-- 2. UTILITY TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. CUSTOM ENUM TYPES (21 Domain-Exact Enums)
-- ----------------------------------------------------------------------------
CREATE TYPE snbt_subtest AS ENUM ('PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM');
CREATE TYPE pedagogy_track AS ENUM ('quantitative', 'literacy');
CREATE TYPE difficulty_tier AS ENUM (
    'tier_0_foundation',
    'tier_1_core',
    'tier_2_standard',
    'tier_3_hots_800'
);
CREATE TYPE mastery_status AS ENUM (
    'locked',
    'foundation_fracture',
    'in_progress',
    'soft_passed',
    'mastered'
);
CREATE TYPE fading_stage AS ENUM (
    'full_worked',
    'missing_final_step',
    'missing_multi_steps',
    'independent'
);
CREATE TYPE question_source_type AS ENUM (
    'curated_seed',
    'brain_vault_extracted',
    'neuro_symbolic_isomorphic'
);
CREATE TYPE qc_status AS ENUM (
    'pending_review',
    'approved',
    'rejected',
    'quarantined_math_error'
);
CREATE TYPE question_format AS ENUM (
    'mcq_single',
    'mcq_complex_table',
    'short_numeric'
);
CREATE TYPE distractor_trap_type AS ENUM (
    'none',
    'overgeneralization',
    'scope_shift',
    'unsupported_inference',
    'causal_reversal',
    'arithmetic_slip',
    'sign_error',
    'unit_mismatch',
    'formula_misapplication'
);
CREATE TYPE root_cause_type AS ENUM (
    'foundational_gap',
    'formula_amnesia',
    'translation_error',
    'careless_time_panic'
);
CREATE TYPE fsrs_state AS ENUM ('new', 'learning', 'review', 'relearning');
CREATE TYPE fsrs_rating AS ENUM ('again', 'hard', 'good', 'easy');
CREATE TYPE triage_action AS ENUM (
    'solved_directly',
    'flagged_and_solved',
    'skipped_smart',
    'timed_out'
);
CREATE TYPE vault_document_status AS ENUM (
    'uploaded',
    'rasterizing',
    'extracting',
    'awaiting_qc',
    'indexed',
    'failed'
);
CREATE TYPE vault_document_type AS ENUM (
    'bank_soal_pdf',
    'tryout_archive',
    'cheat_sheet',
    'rumus_cepat',
    'screenshot'
);
CREATE TYPE verification_status AS ENUM (
    'pending',
    'passed',
    'failed_ast',
    'failed_timeout',
    'failed_math_check',
    'failed_feasibility'
);
CREATE TYPE simulation_status AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE fracture_status AS ENUM ('active', 'healing', 'healed');
CREATE TYPE socratic_hint_level AS ENUM (
    'L1_vault_nudge',
    'L2_translation_prompt',
    'L3_guided_first_step',
    'L4_first_principles_analogy'
);
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');
CREATE TYPE sandbox_runtime AS ENUM ('quickjs_wasm', 'python_sympy');

-- ----------------------------------------------------------------------------
-- 4. CORE TABLES (Strict Dependency Order; Circular FKs Deferred via ALTER)
-- ----------------------------------------------------------------------------

-- 4.1 Portable User Identity (Zero Vendor Auth Lock-In)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    target_score SMALLINT NOT NULL DEFAULT 800 CHECK (target_score BETWEEN 200 AND 1000),
    target_major VARCHAR(120),
    exam_date DATE,
    diagnostic_completed BOOLEAN NOT NULL DEFAULT FALSE,
    theme_preference theme_preference NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 HTTP-Only Cookie Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent VARCHAR(255),
    ip_hash CHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 Anxiety-Free Momentum & IRT Readiness Composite (Zero Punitive Hearts/Lives)
CREATE TABLE user_momentum_state (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    precision_combo_current INTEGER NOT NULL DEFAULT 0 CHECK (precision_combo_current >= 0),
    precision_combo_best INTEGER NOT NULL DEFAULT 0 CHECK (precision_combo_best >= 0),
    tier0_recovery_shields_remaining SMALLINT NOT NULL DEFAULT 3 CHECK (tier0_recovery_shields_remaining >= 0),
    tier0_recovery_shields_used INTEGER NOT NULL DEFAULT 0 CHECK (tier0_recovery_shields_used >= 0),
    estimated_irt_composite NUMERIC(6,2) NOT NULL DEFAULT 400.00 CHECK (estimated_irt_composite BETWEEN 200.00 AND 1000.00),
    subtest_irt_scores JSONB NOT NULL DEFAULT '{"PU":400,"PPU":400,"PBM":400,"PK":400,"LBI":400,"LBE":400,"PM":400}'::jsonb,
    last_study_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.4 Adaptive Skill Tree Nodes (Bloom + ZPD Micro-Tier Taxonomy)
CREATE TABLE skill_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(48) NOT NULL UNIQUE,
    subtest snbt_subtest NOT NULL,
    track pedagogy_track NOT NULL,
    tier difficulty_tier NOT NULL,
    title_id VARCHAR(140) NOT NULL,
    title_en VARCHAR(140),
    description_markdown TEXT NOT NULL,
    first_principles_summary TEXT NOT NULL,
    is_foundation_repair BOOLEAN NOT NULL DEFAULT FALSE,
    soft_gate_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.750 CHECK (soft_gate_threshold BETWEEN 0.500 AND 0.900),
    conquest_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.850 CHECK (conquest_threshold BETWEEN 0.750 AND 0.980),
    target_solve_seconds SMALLINT NOT NULL DEFAULT 75 CHECK (target_solve_seconds BETWEEN 20 AND 300),
    graph_x SMALLINT NOT NULL DEFAULT 0,
    graph_y SMALLINT NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_skill_subtest_track CHECK (
        (subtest IN ('PU', 'PK', 'PM') AND track = 'quantitative')
        OR (subtest IN ('PPU', 'PBM', 'LBI', 'LBE') AND track = 'literacy')
    ),
    CONSTRAINT chk_skill_thresholds CHECK (soft_gate_threshold < conquest_threshold)
);

-- 4.5 Skill Prerequisite & Remedial Bridge DAG Edges
CREATE TABLE skill_prerequisite_edges (
    parent_node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
    child_node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(24) NOT NULL DEFAULT 'hard_prereq' CHECK (
        edge_type IN ('hard_prereq', 'soft_prereq', 'remedial_bridge')
    ),
    weight NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (weight BETWEEN 0.10 AND 1.00),
    PRIMARY KEY (parent_node_id, child_node_id),
    CONSTRAINT chk_skill_edge_no_self_loop CHECK (parent_node_id <> child_node_id)
);

-- 4.6 Per-User Skill Mastery & Soft-Gating State
CREATE TABLE user_skill_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
    status mastery_status NOT NULL DEFAULT 'locked',
    mastery_score NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (mastery_score BETWEEN 0.000 AND 1.000),
    current_fading_stage fading_stage NOT NULL DEFAULT 'full_worked',
    attempts_total INTEGER NOT NULL DEFAULT 0 CHECK (attempts_total >= 0),
    attempts_correct INTEGER NOT NULL DEFAULT 0 CHECK (attempts_correct >= 0),
    rolling_accuracy_10 NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (rolling_accuracy_10 BETWEEN 0.000 AND 1.000),
    median_solve_ms INTEGER CHECK (median_solve_ms IS NULL OR median_solve_ms >= 0),
    interleave_priority SMALLINT NOT NULL DEFAULT 0 CHECK (interleave_priority BETWEEN 0 AND 100),
    recovery_shield_active BOOLEAN NOT NULL DEFAULT FALSE,
    last_practiced_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, skill_node_id),
    CONSTRAINT chk_mastery_correct_le_total CHECK (attempts_correct <= attempts_total)
);

-- 4.7 Brain Vault Uploaded Source Documents (PDFs & Screenshots)
CREATE TABLE brain_vault_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    doc_type vault_document_type NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(80) NOT NULL CHECK (
        mime_type IN ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')
    ),
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
    sha256_hash CHAR(64) NOT NULL,
    storage_key TEXT NOT NULL,
    page_count SMALLINT NOT NULL DEFAULT 1 CHECK (page_count BETWEEN 1 AND 80),
    pages_processed SMALLINT NOT NULL DEFAULT 0 CHECK (pages_processed >= 0),
    status vault_document_status NOT NULL DEFAULT 'uploaded',
    subtest_hint snbt_subtest,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, sha256_hash),
    CONSTRAINT chk_vault_pages_processed CHECK (pages_processed <= page_count)
);

-- 4.8 Brain Vault Rasterized Pages (200 DPI PNGs + Vision Raw JSON + QC State)
CREATE TABLE brain_vault_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES brain_vault_documents(id) ON DELETE CASCADE,
    page_number SMALLINT NOT NULL CHECK (page_number >= 1),
    image_storage_key TEXT NOT NULL,
    vision_model_used VARCHAR(80),
    raw_vision_json JSONB,
    extraction_confidence NUMERIC(4,3) CHECK (
        extraction_confidence IS NULL OR (extraction_confidence BETWEEN 0.000 AND 1.000)
    ),
    ocr_warnings TEXT[] NOT NULL DEFAULT '{}'::text[],
    katex_valid BOOLEAN NOT NULL DEFAULT FALSE,
    qc_status qc_status NOT NULL DEFAULT 'pending_review',
    retry_count SMALLINT NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 5),
    last_error TEXT,
    processing_started_at TIMESTAMPTZ,
    qc_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, page_number)
);

-- 4.9 Brain Vault Hybrid RAG Chunks (1.35x Priority Boost for User Notes & Rumus Cepat)
CREATE TABLE brain_vault_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES brain_vault_documents(id) ON DELETE CASCADE,
    page_id UUID REFERENCES brain_vault_pages(id) ON DELETE SET NULL,
    skill_node_id UUID REFERENCES skill_nodes(id) ON DELETE SET NULL,
    subtest snbt_subtest,
    chunk_type VARCHAR(32) NOT NULL CHECK (
        chunk_type IN ('rumus_cepat', 'worked_solution', 'concept_note', 'trap_pattern', 'question_stem')
    ),
    content_markdown TEXT NOT NULL,
    content_latex TEXT,
    method_label VARCHAR(120),
    validity_conditions TEXT,
    diagram_asset_url TEXT,
    qc_status qc_status NOT NULL DEFAULT 'pending_review',
    is_user_priority BOOLEAN NOT NULL DEFAULT TRUE,
    embedding vector(1536),
    search_tsv tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'indonesian',
            coalesce(method_label, '') || ' ' ||
            coalesce(content_markdown, '') || ' ' ||
            coalesce(content_latex, '')
        )
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.10 Neuro-Symbolic Isomorphic Question Templates
CREATE TABLE question_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
    subtest snbt_subtest NOT NULL,
    tier difficulty_tier NOT NULL,
    sandbox_runtime sandbox_runtime NOT NULL DEFAULT 'quickjs_wasm',
    source_question_id UUID NULL,
    template_title VARCHAR(160) NOT NULL,
    stem_template_latex TEXT NOT NULL,
    sbi_schema_type VARCHAR(64),
    polya_variables_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    generator_code TEXT NOT NULL,
    parameter_bounds_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    code_sha256 CHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_model VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11 Deterministic Sandbox Verification Proofs (Immutable Audit Trail)
CREATE TABLE math_verification_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES question_templates(id) ON DELETE CASCADE,
    question_id UUID NULL,
    sandbox_runtime sandbox_runtime NOT NULL DEFAULT 'quickjs_wasm',
    seed_value BIGINT NOT NULL,
    code_sha256 CHAR(64) NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending',
    execution_time_ms INTEGER NOT NULL CHECK (execution_time_ms BETWEEN 0 AND 5000),
    peak_memory_kb INTEGER CHECK (peak_memory_kb IS NULL OR peak_memory_kb >= 0),
    sandbox_exit_code SMALLINT,
    computed_ground_truth_json JSONB,
    computed_distractors_json JSONB,
    feasibility_checks_json JSONB,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.12 Structured Question Bank (Curated + Brain Vault QC + Neuro-Symbolic)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE RESTRICT,
    subtest snbt_subtest NOT NULL,
    track pedagogy_track NOT NULL,
    tier difficulty_tier NOT NULL,
    source_type question_source_type NOT NULL,
    source_document_id UUID REFERENCES brain_vault_documents(id) ON DELETE SET NULL,
    source_page_id UUID REFERENCES brain_vault_pages(id) ON DELETE SET NULL,
    parent_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    template_id UUID REFERENCES question_templates(id) ON DELETE SET NULL,
    verification_run_id UUID REFERENCES math_verification_runs(id) ON DELETE RESTRICT,
    format question_format NOT NULL DEFAULT 'mcq_single',
    qc_status qc_status NOT NULL DEFAULT 'pending_review',
    qc_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    qc_reviewed_at TIMESTAMPTZ,
    stem_markdown TEXT NOT NULL,
    stem_latex TEXT,
    passage_text TEXT,
    passage_sentences JSONB,
    evidence_sentence_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
    diagram_asset_url TEXT,
    diagram_alt_text VARCHAR(240),
    options JSONB NOT NULL,
    correct_answer_key VARCHAR(8) NOT NULL,
    official_solution_markdown TEXT NOT NULL,
    solution_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    sbi_deconstruction JSONB,
    irt_difficulty_b NUMERIC(5,3) NOT NULL DEFAULT 0.000 CHECK (irt_difficulty_b BETWEEN -4.000 AND 4.000),
    irt_discrimination_a NUMERIC(5,3) NOT NULL DEFAULT 1.000 CHECK (irt_discrimination_a BETWEEN 0.100 AND 4.000),
    irt_guessing_c NUMERIC(4,3) NOT NULL DEFAULT 0.200 CHECK (irt_guessing_c BETWEEN 0.000 AND 0.500),
    expected_solve_seconds SMALLINT NOT NULL DEFAULT 75 CHECK (expected_solve_seconds BETWEEN 15 AND 300),
    embedding vector(1536),
    search_tsv tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'indonesian',
            coalesce(stem_markdown, '') || ' ' ||
            coalesce(stem_latex, '') || ' ' ||
            coalesce(passage_text, '')
        )
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_questions_subtest_track CHECK (
        (subtest IN ('PU', 'PK', 'PM') AND track = 'quantitative')
        OR (subtest IN ('PPU', 'PBM', 'LBI', 'LBE') AND track = 'literacy')
    ),
    -- Zero-Hallucination DB Invariant: generated Quant questions MUST carry a verification proof
    CONSTRAINT chk_questions_neuro_symbolic_verified CHECK (
        NOT (
            source_type = 'neuro_symbolic_isomorphic'
            AND track = 'quantitative'
            AND verification_run_id IS NULL
        )
    )
);

-- 4.13 FSRS Card States (ts-fsrs Native Memory Stability & Difficulty)
CREATE TABLE fsrs_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    card_scope VARCHAR(24) NOT NULL CHECK (card_scope IN ('skill_concept', 'mistake_revival')),
    state fsrs_state NOT NULL DEFAULT 'new',
    due TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stability DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (stability >= 0.0),
    difficulty DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (difficulty >= 0.0),
    elapsed_days INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_days >= 0),
    scheduled_days INTEGER NOT NULL DEFAULT 0 CHECK (scheduled_days >= 0),
    learning_steps INTEGER NOT NULL DEFAULT 0 CHECK (learning_steps >= 0),
    reps INTEGER NOT NULL DEFAULT 0 CHECK (reps >= 0),
    lapses INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0),
    last_review TIMESTAMPTZ,
    retrievability_snapshot NUMERIC(5,4) CHECK (
        retrievability_snapshot IS NULL OR (retrievability_snapshot BETWEEN 0.0000 AND 1.0000)
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_fsrs_revival_has_question CHECK (
        card_scope <> 'mistake_revival' OR question_id IS NOT NULL
    )
);

-- 4.14 Official-Style SNBT Simulation & Diagnostic Sessions
CREATE TABLE simulation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_mode VARCHAR(32) NOT NULL CHECK (
        session_mode IN ('diagnostic_placement', 'full_tryout_utbk', 'subtest_drill', 'triage_sprint')
    ),
    status simulation_status NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (total_duration_seconds >= 0),
    estimated_irt_score NUMERIC(6,2) CHECK (
        estimated_irt_score IS NULL OR (estimated_irt_score BETWEEN 200.00 AND 1000.00)
    ),
    accuracy_rate NUMERIC(4,3) CHECK (
        accuracy_rate IS NULL OR (accuracy_rate BETWEEN 0.000 AND 1.000)
    ),
    triage_efficiency_score NUMERIC(4,3) CHECK (
        triage_efficiency_score IS NULL OR (triage_efficiency_score BETWEEN 0.000 AND 1.000)
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.15 Timed Subtest Lockout Blocks Inside Simulations
CREATE TABLE simulation_subtest_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_session_id UUID NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
    subtest snbt_subtest NOT NULL,
    block_order SMALLINT NOT NULL CHECK (block_order >= 1),
    question_count SMALLINT NOT NULL CHECK (question_count >= 1),
    allocated_seconds INTEGER NOT NULL CHECK (allocated_seconds >= 60),
    started_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    subtest_irt_score NUMERIC(6,2) CHECK (
        subtest_irt_score IS NULL OR (subtest_irt_score BETWEEN 200.00 AND 1000.00)
    ),
    correct_count SMALLINT NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    skipped_smart_count SMALLINT NOT NULL DEFAULT 0 CHECK (skipped_smart_count >= 0),
    UNIQUE (simulation_session_id, block_order),
    UNIQUE (simulation_session_id, subtest)
);

-- 4.16 Mistake Graveyard (Fracture-to-Healed Tracking)
CREATE TABLE mistake_fractures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE CASCADE,
    origin_question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    origin_attempt_id UUID NULL,
    fsrs_card_id UUID REFERENCES fsrs_cards(id) ON DELETE SET NULL,
    primary_root_cause root_cause_type NOT NULL,
    secondary_root_cause root_cause_type,
    distractor_trap_caught distractor_trap_type NOT NULL DEFAULT 'none',
    diagnostic_summary TEXT NOT NULL,
    status fracture_status NOT NULL DEFAULT 'active',
    revival_attempts_count SMALLINT NOT NULL DEFAULT 0 CHECK (revival_attempts_count >= 0),
    revival_passes_required SMALLINT NOT NULL DEFAULT 2 CHECK (revival_passes_required BETWEEN 1 AND 5),
    revival_passes_achieved SMALLINT NOT NULL DEFAULT 0 CHECK (revival_passes_achieved >= 0),
    last_isomorphic_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    healed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.17 Question Attempt Telemetry (IRT Timing, Triage, Dual-Track & Root Cause)
CREATE TABLE question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    skill_node_id UUID NOT NULL REFERENCES skill_nodes(id) ON DELETE RESTRICT,
    simulation_session_id UUID REFERENCES simulation_sessions(id) ON DELETE SET NULL,
    simulation_block_id UUID REFERENCES simulation_subtest_blocks(id) ON DELETE SET NULL,
    fracture_id UUID REFERENCES mistake_fractures(id) ON DELETE SET NULL,
    fsrs_card_id UUID REFERENCES fsrs_cards(id) ON DELETE SET NULL,
    attempt_mode VARCHAR(32) NOT NULL CHECK (
        attempt_mode IN ('diagnostic', 'skill_drill', 'fsrs_revival', 'simulation', 'faded_practice')
    ),
    fading_stage_used fading_stage,
    selected_answer_key VARCHAR(8),
    is_correct BOOLEAN NOT NULL,
    time_to_solve_ms INTEGER NOT NULL CHECK (time_to_solve_ms >= 0),
    first_interaction_ms INTEGER CHECK (first_interaction_ms IS NULL OR first_interaction_ms >= 0),
    triage_decision_ms INTEGER CHECK (triage_decision_ms IS NULL OR triage_decision_ms >= 0),
    triage_action triage_action NOT NULL DEFAULT 'solved_directly',
    within_irt_triage_window BOOLEAN GENERATED ALWAYS AS (
        triage_decision_ms IS NOT NULL AND triage_decision_ms <= 20000
    ) STORED,
    highlighted_sentence_ids TEXT[] NOT NULL DEFAULT '{}'::text[],
    evidence_match_passed BOOLEAN,
    sbi_schema_selected VARCHAR(64),
    sbi_variables_tagged JSONB,
    distractor_trap_identified distractor_trap_type DEFAULT 'none',
    hints_used_count SMALLINT NOT NULL DEFAULT 0 CHECK (hints_used_count BETWEEN 0 AND 4),
    max_hint_level socratic_hint_level,
    used_scratchpad BOOLEAN NOT NULL DEFAULT FALSE,
    recovery_shield_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    root_cause root_cause_type,
    root_cause_confidence NUMERIC(4,3) CHECK (
        root_cause_confidence IS NULL OR (root_cause_confidence BETWEEN 0.000 AND 1.000)
    ),
    fsrs_rating_assigned fsrs_rating,
    fsrs_review_log JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.18 Socratic Hint Telemetry & Brain Vault Grounding Audit
CREATE TABLE socratic_hint_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES question_attempts(id) ON DELETE SET NULL,
    hint_level socratic_hint_level NOT NULL,
    user_stuck_input TEXT,
    retrieved_vault_chunk_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    grounded_in_user_vault BOOLEAN NOT NULL DEFAULT FALSE,
    boundary_warning_shown BOOLEAN NOT NULL DEFAULT FALSE,
    hint_response_markdown TEXT NOT NULL,
    model_alias VARCHAR(64) NOT NULL,
    latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.19 9router AI Routing, Token Cost & Schema Enforcement Ledger
CREATE TABLE ai_routing_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    task_type VARCHAR(48) NOT NULL,
    tier VARCHAR(24) NOT NULL,
    requested_model_alias VARCHAR(64) NOT NULL,
    actual_model_used VARCHAR(120) NOT NULL,
    fallback_depth SMALLINT NOT NULL DEFAULT 0 CHECK (fallback_depth >= 0),
    prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
    estimated_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0.000000 CHECK (estimated_cost_usd >= 0),
    latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
    schema_valid BOOLEAN NOT NULL DEFAULT TRUE,
    retry_count SMALLINT NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    http_status SMALLINT,
    error_code VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. DEFERRED CIRCULAR FOREIGN KEY CONSTRAINTS
-- ----------------------------------------------------------------------------
ALTER TABLE question_templates
    ADD CONSTRAINT fk_question_templates_source_question
    FOREIGN KEY (source_question_id) REFERENCES questions(id) ON DELETE SET NULL;

ALTER TABLE math_verification_runs
    ADD CONSTRAINT fk_math_runs_question
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL;

ALTER TABLE mistake_fractures
    ADD CONSTRAINT fk_fractures_origin_attempt
    FOREIGN KEY (origin_attempt_id) REFERENCES question_attempts(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES (HNSW Vector, GIN FTS, Trigram, Partial & Composite)
-- ----------------------------------------------------------------------------

-- 6.1 Hybrid RAG Vector HNSW Indexes (Cosine Distance)
CREATE INDEX idx_vault_chunks_embedding_hnsw
    ON brain_vault_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
    WHERE qc_status = 'approved' AND embedding IS NOT NULL;

CREATE INDEX idx_questions_embedding_hnsw
    ON questions USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
    WHERE qc_status = 'approved' AND embedding IS NOT NULL;

-- 6.2 Indonesian Full-Text & LaTeX Trigram GIN Indexes
CREATE INDEX idx_vault_chunks_search_tsv_gin
    ON brain_vault_chunks USING gin (search_tsv);

CREATE INDEX idx_vault_chunks_latex_trgm_gin
    ON brain_vault_chunks USING gin (content_latex gin_trgm_ops)
    WHERE content_latex IS NOT NULL;

CREATE INDEX idx_questions_search_tsv_gin
    ON questions USING gin (search_tsv);

-- 6.3 FSRS Uniqueness & Due Queue Indexes
CREATE UNIQUE INDEX uq_fsrs_skill_concept
    ON fsrs_cards (user_id, skill_node_id)
    WHERE card_scope = 'skill_concept';

CREATE UNIQUE INDEX uq_fsrs_mistake_revival
    ON fsrs_cards (user_id, question_id)
    WHERE card_scope = 'mistake_revival' AND question_id IS NOT NULL;

CREATE INDEX idx_fsrs_due_queue
    ON fsrs_cards (user_id, due ASC)
    WHERE state IN ('learning', 'review', 'relearning');

-- 6.4 Hot-Path Application Composite & Partial Indexes
CREATE INDEX idx_user_sessions_expires
    ON user_sessions (user_id, expires_at DESC);

CREATE INDEX idx_user_skill_mastery_interleave
    ON user_skill_mastery (user_id, status, interleave_priority DESC);

CREATE INDEX idx_questions_selection
    ON questions (subtest, skill_node_id, tier, qc_status, source_type);

CREATE INDEX idx_questions_owner_pool
    ON questions (owner_user_id, skill_node_id, qc_status)
    WHERE qc_status = 'approved';

CREATE INDEX idx_math_runs_template_status
    ON math_verification_runs (template_id, status, created_at DESC);

CREATE INDEX idx_attempts_user_time
    ON question_attempts (user_id, created_at DESC);

CREATE INDEX idx_attempts_skill_telemetry
    ON question_attempts (user_id, skill_node_id, is_correct, created_at DESC);

CREATE INDEX idx_fractures_active
    ON mistake_fractures (user_id, status, skill_node_id)
    WHERE status IN ('active', 'healing');

CREATE INDEX idx_vault_docs_user_status
    ON brain_vault_documents (user_id, status, created_at DESC);

CREATE INDEX idx_vault_pages_qc_queue
    ON brain_vault_pages (document_id, qc_status, page_number ASC);

CREATE INDEX idx_vault_chunks_user_priority
    ON brain_vault_chunks (user_id, qc_status, is_user_priority, subtest);

CREATE INDEX idx_sim_blocks_active
    ON simulation_subtest_blocks (simulation_session_id, is_locked, block_order);

CREATE INDEX idx_socratic_logs_user_question
    ON socratic_hint_logs (user_id, question_id, created_at DESC);

CREATE INDEX idx_ai_ledger_user_day
    ON ai_routing_ledger (user_id, created_at DESC);

CREATE INDEX idx_ai_ledger_task_day
    ON ai_routing_ledger (task_type, created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_momentum_state_updated_at
    BEFORE UPDATE ON user_momentum_state FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_skill_nodes_updated_at
    BEFORE UPDATE ON skill_nodes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_skill_mastery_updated_at
    BEFORE UPDATE ON user_skill_mastery FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_brain_vault_documents_updated_at
    BEFORE UPDATE ON brain_vault_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_brain_vault_pages_updated_at
    BEFORE UPDATE ON brain_vault_pages FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_brain_vault_chunks_updated_at
    BEFORE UPDATE ON brain_vault_chunks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_question_templates_updated_at
    BEFORE UPDATE ON question_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_questions_updated_at
    BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_fsrs_cards_updated_at
    BEFORE UPDATE ON fsrs_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_simulation_sessions_updated_at
    BEFORE UPDATE ON simulation_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_mistake_fractures_updated_at
    BEFORE UPDATE ON mistake_fractures FOR EACH ROW EXECUTE FUNCTION set_updated_at();
