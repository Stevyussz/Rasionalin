import { z } from "zod";

export const DiagramCropBoxSchema = z.object({
  box_2d: z.tuple([
    z.number().int().min(0).max(1000),
    z.number().int().min(0).max(1000),
    z.number().int().min(0).max(1000),
    z.number().int().min(0).max(1000),
  ]),
  alt_text_id: z.string().min(3).max(220),
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
  options: z
    .array(
      z.object({
        key: z.enum(["A", "B", "C", "D", "E"]),
        text_markdown: z.string().min(1),
        latex: z.string().nullable(),
      }),
    )
    .max(5),
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

export const SocraticHintResponseSchema = z.object({
  hint_level: z.enum([
    "L1_vault_nudge",
    "L2_translation_prompt",
    "L3_guided_first_step",
    "L4_first_principles_analogy",
  ]),
  grounded_in_user_vault: z.boolean(),
  cited_vault_chunk_ids: z.array(z.string().uuid()),
  boundary_condition_warning: z.string().max(220).nullable(),
  hint_markdown: z.string().min(10).max(1600),
  prompt_question_for_student: z.string().min(5).max(340),
  never_revealed_final_answer: z.literal(true),
});

export const RootCauseClassificationSchema = z.object({
  primary_root_cause: z.enum([
    "foundational_gap",
    "formula_amnesia",
    "translation_error",
    "careless_time_panic",
  ]),
  secondary_root_cause: z
    .enum([
      "foundational_gap",
      "formula_amnesia",
      "translation_error",
      "careless_time_panic",
    ])
    .nullable(),
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
  diagnostic_summary_id: z.string().min(12).max(340),
  trigger_tier0_repair_node: z.boolean(),
});

export const NeuroSymbolicTemplateSchema = z.object({
  template_title: z.string().min(5).max(160),
  subtest: z.enum(["PU", "PK", "PM"]),
  tier: z.enum(["tier_0_foundation", "tier_1_core", "tier_2_standard", "tier_3_hots_800"]),
  sandbox_runtime: z.enum(["quickjs_wasm", "python_sympy"]),
  sbi_schema_type: z.string().min(3).max(64),
  polya_variables_schema: z
    .array(
      z.object({
        symbol: z.string().min(1).max(24),
        role: z.enum(["known", "unknown", "rate", "constraint"]),
        label_id: z.string().min(2).max(120),
      }),
    )
    .min(1)
    .max(8),
  solution_step_templates: z
    .array(
      z.object({
        stage: z.enum(["deconstruct", "setup", "solve", "verify"]),
        instruction_template: z.string().min(8),
        formula_template_latex: z.string(),
      }),
    )
    .min(2)
    .max(6),
  stem_template_latex: z.string().min(15),
  generator_code: z.string().min(60).max(16000),
  parameter_bounds_json: z.record(z.string(), z.unknown()),
});

export const LiteracyEvidenceTaggerSchema = z.object({
  passage_sentences: z.array(
    z.object({
      id: z.string().min(1).max(16),
      paragraph: z.number().int().min(1),
      text: z.string().min(3),
    }),
  ),
  evidence_sentence_ids: z.array(z.string().min(1).max(16)).min(1).max(4),
});

export const SbiPolyaDeconstructSchema = z.object({
  schema_type: z.string().min(2).max(64),
  schema_label_id: z.string().min(4).max(120),
  known_variables: z.array(
    z.object({
      symbol: z.string().min(1).max(24),
      label: z.string().min(2).max(100),
      value_text: z.string().min(1).max(80),
    }),
  ),
  target_unknown: z.string().min(2).max(120),
  base_relation_latex: z.string().min(1).max(220),
});

export const WhyBeforeHowExplainSchema = z.object({
  why_intuition_markdown: z.string().min(15).max(1600),
  everyday_analogy: z.string().min(10).max(600),
  step_by_step_how: z
    .array(
      z.object({
        step_title: z.string().min(3).max(120),
        explanation_markdown: z.string().min(8).max(900),
        formula_latex: z.string().max(400).nullable(),
      }),
    )
    .min(2)
    .max(6),
  trap_watchout: z.string().min(8).max(500),
  active_recall_prompt: z.string().min(8).max(360),
  active_recall_answer: z.string().min(3).max(360),
});

export const TutorChatResponseSchema = z.object({
  why_first_markdown: z.string().min(10).max(1800),
  step_by_step_markdown: z.string().min(10).max(2400),
  active_recall_check: z.string().min(6).max(400),
  suggested_followups: z.array(z.string().min(4).max(100)).min(1).max(3),
  grounded_in_vault: z.boolean(),
});

export const CustomModuleDrillSchema = z.object({
  module_title: z.string().min(4).max(160),
  subtest: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]),
  estimated_minutes: z.number().int().min(3).max(45),
  pedagogy_badges: z.array(z.string().min(3).max(80)).min(1).max(4),
  pretest_hook: z.object({
    prompt_markdown: z.string().min(8).max(500),
    options: z
      .array(
        z.object({
          key: z.enum(["A", "B", "C"]),
          text: z.string().min(1).max(220),
        }),
      )
      .length(3),
    correct_key: z.enum(["A", "B", "C"]),
    reveal_insight: z.string().min(8).max(420),
  }),
  why_before_how_markdown: z.string().min(15).max(1600),
  everyday_analogy: z.string().min(10).max(600),
  core_formulas_latex: z.array(z.string().min(1).max(260)).max(6),
  worked_example: z.object({
    prompt_markdown: z.string().min(10).max(900),
    steps: z
      .array(
        z.object({
          title: z.string().min(2).max(100),
          explanation_markdown: z.string().min(6).max(600),
          formula_latex: z.string().max(300).nullable(),
        }),
      )
      .min(2)
      .max(5),
    final_takeaway: z.string().min(6).max(320),
  }),
  shortcut_with_boundary: z
    .object({
      method_label: z.string().min(2).max(120),
      shortcut_markdown: z.string().min(8).max(600),
      validity_conditions: z.string().min(5).max(320),
    })
    .nullable(),
  utbk_traps: z.array(z.string().min(6).max(260)).min(2).max(5),
  drill_questions: z
    .array(
      z.object({
        strategy_tag: z.string().min(2).max(90),
        difficulty_tier: z.enum([
          "tier_0_foundation",
          "tier_1_core",
          "tier_2_standard",
          "tier_3_hots_800",
        ]),
        passage_text: z.string().max(2400).nullable(),
        stem_markdown: z.string().min(10).max(1400),
        options: z
          .array(
            z.object({
              key: z.enum(["A", "B", "C", "D", "E"]),
              text_markdown: z.string().min(1).max(360),
              distractor_rationale: z.string().min(4).max(280),
            }),
          )
          .length(5),
        correct_answer_key: z.enum(["A", "B", "C", "D", "E"]),
        why_solution_markdown: z.string().min(15).max(1500),
        self_explanation_prompt: z.string().min(8).max(280),
      }),
    )
    .min(3)
    .max(5),
});

export const IsomorphicTwinQuestionSchema = z.object({
  stem_markdown: z.string().min(15).max(1600),
  options: z
    .array(
      z.object({
        key: z.enum(["A", "B", "C", "D", "E"]),
        text_markdown: z.string().min(1).max(400),
        trap_type: z.enum([
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
        distractor_rationale: z.string().min(4).max(340),
      }),
    )
    .length(5),
  correct_answer_key: z.enum(["A", "B", "C", "D", "E"]),
  official_solution_markdown: z.string().min(15).max(1800),
  solution_steps: z
    .array(
      z.object({
        stage: z.enum(["deconstruct", "setup", "solve", "verify"]),
        title: z.string().min(3).max(120),
        instruction_markdown: z.string().min(8).max(600),
        formula_latex: z.string().max(320).nullable(),
      }),
    )
    .min(2)
    .max(4),
  sbi_deconstruction: SbiPolyaDeconstructSchema.nullable(),
});
