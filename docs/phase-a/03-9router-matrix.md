# 03: 9router Multi-Model Routing Matrix

**Gateway Strategy:** OpenAI-compatible HTTP gateway via `9router`, decoupling application workflows from vendor model IDs through five logical virtual tiers.
**Environment Portability:** Configured via `NINE_ROUTER_BASE_URL` (e.g., `http://localhost:20128/v1` during local development, switched to a hosted HTTPS URL or authenticated Cloudflare Tunnel before pushing to Vercel production).

---

## 1. Environment Contract & Virtual Tier Aliases

### 1.1 Environment Variables (Server-Only)

| Variable | Example (Local Dev) | Purpose |
|---|---|---|
| `NINE_ROUTER_BASE_URL` | `http://localhost:20128/v1` | OpenAI-compatible root URL for chat completions and embeddings. |
| `NINE_ROUTER_API_KEY` | `sk-9router-local-dev` | Bearer credential sent to `9router` (never exposed to browser). |
| `NINE_ROUTER_TIMEOUT_MS` | `20000` | Default ceiling for client HTTP requests unless overridden per task. |
| `NINE_ROUTER_MODEL_EMBED` | `snbt-embed` | Virtual alias override for `TIER-0-EMBED` (`1536` dimensions). |
| `NINE_ROUTER_MODEL_FAST` | `snbt-fast` | Virtual alias override for `TIER-1-FAST`. |
| `NINE_ROUTER_MODEL_VISION` | `snbt-vision` | Virtual alias override for `TIER-2-VISION`. |
| `NINE_ROUTER_MODEL_REASON` | `snbt-reason` | Virtual alias override for `TIER-3-REASON`. |
| `NINE_ROUTER_MODEL_CODE_MATH` | `snbt-code-math` | Virtual alias override for `TIER-4-CODE-MATH`. |

### 1.2 Virtual Tier Definitions

| Tier ID | Default Alias | Recommended Upstream Model Class | Workload Profile |
|---|---|---|---|
| `TIER-0-EMBED` | `snbt-embed` | `text-embedding-3-small` or `gemini-embedding-001` (`dimensions: 1536`) | Multilingual Indonesian/English + LaTeX dense semantic indexing (`vector(1536)`). |
| `TIER-1-FAST` | `snbt-fast` | Flash / Mini class (e.g., Gemini 2.5 Flash, GPT-4.1-mini, Haiku-class) | Sub-second structured JSON classification, L1/L2 Socratic nudges, Zod schema repair. |
| `TIER-2-VISION` | `snbt-vision` | Multimodal High-OCR Vision (e.g., Gemini 2.5 Pro/Flash Vision, GPT-4o Vision) | High-density LaTeX equations, matrices, tables, and diagram bounding boxes from 200 DPI page PNGs. |
| `TIER-3-REASON` | `snbt-reason` | Deep Reasoning (e.g., Claude Sonnet, Gemini 2.5 Pro, DeepSeek-R1/V3 class) | First-principles L3/L4 tutoring, Polya/SBI deconstruction, SNBT trap anatomy, diagnostic gap synthesis. |
| `TIER-4-CODE-MATH` | `snbt-code-math` | Code + Math Specialist (e.g., Claude Sonnet / Qwen-Coder / GPT-4.1 / DeepSeek) | Parameterized question template authoring paired with deterministic sandbox generator code (`quickjs_wasm` or `python_sympy`). |

### 1.3 Standard Observability Request Headers
Every outbound call from `NineRouterClient` sends:
- `Authorization: Bearer ${NINE_ROUTER_API_KEY}`
- `X-Correlation-Id: <uuid-v4>` (persisted to `ai_routing_ledger.correlation_id`)
- `X-Task-Type: <task_id>` (for 9router dashboard cost/latency slicing)
- `X-User-Id-Hash: <sha256-prefix-12>` (privacy-safe trace key)

---

## 2. Complete 11-Task Routing Matrix

| # | Task ID | Tier & Primary Alias | Ordered Fallback Chain | Temp | Max Out Tokens | Target P95 Latency | Hard Timeout | JSON Enforcement | Cache Policy | Max Input+Output Cap |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `vision_pdf_extract` | `TIER-2-VISION` (`snbt-vision`) | `snbt-vision` -> `snbt-vision-fallback` | `0.05` | `3200` | `<= 6500 ms` | `20000 ms` | `json_schema` strict | Cache by `page_image_sha256` | `6500` tok/page |
| 2 | `vault_note_chunk_classify` | `TIER-1-FAST` (`snbt-fast`) | `snbt-fast` -> `snbt-reason` | `0.10` | `700` | `<= 900 ms` | `6000 ms` | `json_schema` strict | Cache by `chunk_sha256` | `2500` tok/chunk |
| 3 | `socratic_hint_l1_l2` | `TIER-1-FAST` (`snbt-fast`) | `snbt-fast` -> `snbt-reason` -> Vault/Rule fallback | `0.25` | `380` | `<= 850 ms` | `4500 ms` | `json_schema` strict | Cache by `(question_id, hint_level, vault_hash)` | `2800` tok/hint |
| 4 | `socratic_hint_l3_l4` | `TIER-3-REASON` (`snbt-reason`) | `snbt-reason` -> `snbt-fast` | `0.35` | `750` | TTFT `<= 900 ms` (SSE stream) | `12000 ms` | `json_schema` strict (non-stream) or SSE text + JSON footer | Cache L3/L4 base per `(question_id, hint_level)` | `4000` tok/hint |
| 5 | `root_cause_classify` | `TIER-1-FAST` (`snbt-fast`) | `snbt-fast` -> Deterministic rule classifier | `0.05` | `320` | `<= 700 ms` | `4000 ms` | `json_schema` strict | No cache (attempt-specific) | `2000` tok/attempt |
| 6 | `neuro_symbolic_template_gen` | `TIER-4-CODE-MATH` (`snbt-code-math`) | `snbt-code-math` -> `snbt-reason` | `0.20` | `2400` | `<= 6000 ms` (async `after()`) | `18000 ms` | `json_schema` strict | Pool cache (`>= 3` pre-verified items) | `6500` tok/template |
| 7 | `neuro_symbolic_code_repair` | `TIER-4-CODE-MATH` (`snbt-code-math`) | `snbt-code-math` -> `snbt-reason` (max 2 attempts) | `0.10` | `1800` | `<= 4500 ms` | `14000 ms` | `json_schema` strict | No cache (error-specific) | `5000` tok/repair |
| 8 | `literacy_evidence_tagger` | `TIER-3-REASON` (`snbt-reason`) | `snbt-reason` -> `snbt-fast` | `0.10` | `1100` | `<= 2800 ms` | `10000 ms` | `json_schema` strict | Cache by `question_id` (write once) | `4200` tok/item |
| 9 | `sbi_polya_deconstruct` | `TIER-3-REASON` (`snbt-reason`) | `snbt-reason` -> `snbt-fast` | `0.15` | `1200` | `<= 2500 ms` | `10000 ms` | `json_schema` strict | Cache by `question_id` (write once) | `3800` tok/item |
| 10 | `diagnostic_gap_synthesizer` | `TIER-3-REASON` (`snbt-reason`) | `snbt-reason` -> `snbt-fast` -> Deterministic summary | `0.25` | `1100` | `<= 3200 ms` | `12000 ms` | `json_schema` strict | Cache per `simulation_session_id` | `5000` tok/session |
| 11 | `rag_text_embed` | `TIER-0-EMBED` (`snbt-embed`) | `snbt-embed` -> `snbt-embed-fallback` | `N/A` | `N/A` | `<= 350 ms` | `5000 ms` | Embedding array (`1536` floats) | Cache by `sha256(text)` | `1500` tok/chunk |

---

## 3. Structured JSON Enforcement & Canonical Zod Contracts

### 3.1 Three-Tier Schema Enforcement Protocol
Every non-embedding task passes through three progressive validation layers inside `NineRouterClient`:
1. **Strict Provider Schema (`response_format: { type: "json_schema", json_schema: { strict: true, ... } }`):** Default for compatible models via 9router.
2. **Portable `json_object` Downgrade:** If an upstream fallback model rejects `json_schema`, `NineRouterClient` automatically degrades once to `response_format: { type: "json_object" }` with the minified JSON Schema appended to the system prompt.
3. **Server-Side Zod Gate + Bounded Repair:** Parse JSON (stripping accidental markdown fences if present) and validate with Zod. On `ZodError`, run **at most 1** repair call on `snbt-fast` passing the malformed JSON and exact Zod error path (`err.issues`). If repair still fails, log `schema_valid = false` to `ai_routing_ledger` and activate the task's deterministic fallback.

### 3.2 Canonical Payload Contracts

#### A. `VisionExtractionPageSchema` (`vision_pdf_extract`)

```typescript
import { z } from "zod";

export const DiagramCropBoxSchema = z.object({
  box_2d: z.tuple([
    z.number().int().min(0).max(1000), // x1 normalized
    z.number().int().min(0).max(1000), // y1 normalized
    z.number().int().min(0).max(1000), // x2 normalized
    z.number().int().min(0).max(1000), // y2 normalized
  ]),
  alt_text_id: z.string().min(5).max(220),
});

export const VisionExtractedItemSchema = z.object({
  item_type: z.enum(["question", "rumus_cepat", "worked_solution", "concept_note"]),
  subtest_guess: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]),
  tier_guess: z.enum(["tier_0_foundation", "tier_1_core", "tier_2_standard", "tier_3_hots_800"]),
  concept_tag: z.string().min(2).max(100),
  method_label: z.string().max(120).nullable(),
  validity_conditions: z.string().max(240).nullable(),
  stem_markdown: z.string().min(1),
  stem_latex: z.string().nullable(),
  passage_text: z.string().nullable(),
  options: z.array(z.object({
    key: z.enum(["A", "B", "C", "D", "E"]),
    text_markdown: z.string().min(1),
    latex: z.string().nullable(),
  })).max(5),
  correct_answer_key: z.enum(["A", "B", "C", "D", "E"]).nullable(),
  official_solution_markdown: z.string().nullable(),
  diagrams: z.array(DiagramCropBoxSchema).max(4),
});

export const VisionExtractionPageSchema = z.object({
  page_number: z.number().int().min(1),
  extraction_confidence: z.number().min(0).max(1),
  ocr_warnings: z.array(z.string().max(160)),
  items: z.array(VisionExtractedItemSchema).min(0).max(12),
});
```

#### B. `SocraticHintResponseSchema` (`socratic_hint_l1_l2`, `socratic_hint_l3_l4`)

```typescript
export const SocraticHintResponseSchema = z.object({
  hint_level: z.enum([
    "L1_vault_nudge",
    "L2_translation_prompt",
    "L3_guided_first_step",
    "L4_first_principles_analogy",
  ]),
  grounded_in_user_vault: z.boolean(),
  cited_vault_chunk_ids: z.array(z.string().uuid()),
  boundary_condition_warning: z.string().max(180).nullable(),
  hint_markdown: z.string().min(10).max(1400),
  prompt_question_for_student: z.string().min(5).max(320),
  never_revealed_final_answer: z.literal(true),
});
```

#### C. `RootCauseClassificationSchema` (`root_cause_classify`)

```typescript
export const RootCauseClassificationSchema = z.object({
  primary_root_cause: z.enum([
    "foundational_gap",
    "formula_amnesia",
    "translation_error",
    "careless_time_panic",
  ]),
  secondary_root_cause: z.enum([
    "foundational_gap",
    "formula_amnesia",
    "translation_error",
    "careless_time_panic",
  ]).nullable(),
  distractor_trap_caught: z.enum([
    "none",
    "overgeneralization",
    "scope_shift",
    "unsupported_inference",
    "causal_reversal",
    "arithmetic_slip",
    "sign_error",
    "unit_mismatch",
    "formula_misapplication",
  ]),
  confidence: z.number().min(0).max(1),
  diagnostic_summary_id: z.string().min(15).max(320),
  trigger_tier0_repair_node: z.boolean(),
});
```

#### D. `NeuroSymbolicTemplateSchema` (`neuro_symbolic_template_gen`, `neuro_symbolic_code_repair`)

```typescript
export const NeuroSymbolicTemplateSchema = z.object({
  template_title: z.string().min(5).max(160),
  subtest: z.enum(["PU", "PK", "PM"]),
  tier: z.enum(["tier_0_foundation", "tier_1_core", "tier_2_standard", "tier_3_hots_800"]),
  sandbox_runtime: z.enum(["quickjs_wasm", "python_sympy"]),
  sbi_schema_type: z.string().min(3).max(64),
  polya_variables_schema: z.array(z.object({
    symbol: z.string().min(1).max(24),
    role: z.enum(["known", "unknown", "rate", "constraint"]),
    label_id: z.string().min(2).max(120),
  })).min(1).max(8),
  stem_template_latex: z.string().min(15),
  solution_step_templates: z.array(z.object({
    stage: z.enum(["deconstruct", "setup", "solve", "verify"]),
    instruction_template: z.string().min(8),
    formula_template_latex: z.string(),
  })).min(2).max(6),
  generator_code: z.string().min(60).max(16000),
  parameter_bounds_json: z.record(z.string(), z.unknown()),
});
```

---

## 4. Fallback Chain, Retry Policy, Circuit Breaker & Degraded Modes

### 4.1 HTTP Error Classification & Retry Policy

| HTTP / Transport Failure | Classification | Retry Policy on Same Alias | Escalation Behavior |
|---|---|---|---|
| `429 Too Many Requests` | Rate Limit | Honor `Retry-After` (capped at `2000 ms`), else `250 ms` + jitter (`1` retry). | Step immediately to next alias in fallback chain. |
| `500`, `502`, `503`, `504` | Upstream Transient | Exponential backoff with full jitter: `250 ms`, `750 ms` (max `2` retries). | Increment failure counter; step to next fallback alias. |
| Network / Abort Timeout | Latency Breach | `1` retry on async tasks; `0` retries on live student hint calls. | Step immediately to next fallback alias or deterministic mode. |
| `400 Bad Request` | Payload / Schema Reject | Downgrade `json_schema` -> `json_object` once (`0` blind retries). | Log `http_status = 400`; invoke deterministic fallback. |
| `401` / `403` | Gateway Auth Failure | `0` retries (never burn quota). | Trip alias circuit open; surface clear operator error banner. |

### 4.2 Per-Alias Circuit Breaker
- **Trigger:** `5` consecutive `5xx` or timeout failures within a `60-second` sliding window on a given model alias.
- **Open Window:** `45 seconds` during which requests route directly to the fallback alias, eliminating wasted tail latency.
- **Half-Open Probe:** After `45 seconds`, `1` probe request tests the primary alias; success closes the circuit, failure re-opens for `45 seconds`.

### 4.3 Deterministic Degraded Modes (Never Leave the Student Blocked)

| Student-Facing Task | Deterministic Degraded Behavior When All LLM Fallbacks Fail |
|---|---|
| `socratic_hint_l1_l2` | Execute `HybridRagService` SQL directly; return top matching Brain Vault excerpt (or question's `sbi_deconstruction` knowns/schema hint) cleanly labeled *"Catatan Brain Vault (Mode Cepat)"*. |
| `socratic_hint_l3_l4` | Reveal step 1 (`L3`) or complete step-by-step `solution_steps` (`L4`) directly from the verified `questions.solution_steps` JSONB. |
| `root_cause_classify` | Run `RootCauseRules`: (`time_to_solve_ms < 20000` -> `careless_time_panic`; `hints_used_count >= 2 && evidence_match_passed === false` -> `translation_error`; prior fracture on prerequisite -> `foundational_gap`; otherwise -> `formula_amnesia`). |
| `neuro_symbolic_template_gen` | Serve an unused, already-verified isomorphic variant from the pre-warmed pool (`questions` WHERE `qc_status = 'approved'` and `verification_run_id IS NOT NULL`), or fall back to an unseen `curated_seed` question on the same `skill_node_id`. |
| `diagnostic_gap_synthesizer` | Render deterministic subtest accuracy + IRT `theta` delta breakdown + prioritized list of `foundation_fracture` nodes directly from PostgreSQL aggregates. |

---

## 5. Cost, Latency & Personal Power-Tool Guardrails

1. **Pre-Warmed Isomorphic Pool (`< 150 ms` Live Drill Load):**
   - `GenerateIsomorphicVariantUseCase` never blocks the student waiting 4-6 seconds for `snbt-code-math` during a live study drill.
   - Whenever a `mistake_fractures` record is created or an active skill node drops below **`3`** verified unseen isomorphic variants, a Next.js `after()` hook replenishes the pool asynchronously in the background.
2. **Personal Budget Visibility Without SaaS Lockout Bloat:**
   - Every LLM call records `prompt_tokens`, `completion_tokens`, and `estimated_cost_usd` in `ai_routing_ledger`.
   - Default soft alert threshold: **`$2.00 / day`** (logs a subtle telemetry notice in Settings -> Usage Ledger, while an anti-runaway loop circuit stops runaway retries above `25` calls/minute on the same `document_id` or `template_id`).
3. **Prompt-Prefix Caching Stability:**
   - System prompts, SNBT rubric definitions, and JSON schema contracts are placed in deterministic, byte-identical prefixes ahead of dynamic user variables (`<untrusted_vault_excerpt>`, question JSON, attempt history) to maximize upstream KV prefix cache hits on `9router` providers.
4. **PDF Batch Concurrency Cap:**
   - Client uploads pages once to Supabase Storage, then requests extraction in chunks of at most **`3` pages per API batch** (`POST /api/vault/documents/:id/extract-batch`) so every Vercel Serverless invocation finishes comfortably inside Hobby/Pro timeout limits (`< 10s` per batch or `<= 60s` with Fluid Compute).
