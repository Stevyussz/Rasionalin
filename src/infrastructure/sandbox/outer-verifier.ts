import Fraction from "fraction.js";
import katex from "katex";
import { evaluate, simplify } from "mathjs";
import type { DistractorTrapType, QuestionOption } from "@/domain/types";
import type { RawSandboxOutput } from "./sympy-http-driver";

export interface OuterVerificationResult {
  passed: boolean;
  failureStatus?: "failed_math_check" | "failed_feasibility";
  failureReason?: string;
}

const VALID_TRAPS = new Set<DistractorTrapType>([
  "none",
  "overgeneralization",
  "scope_shift",
  "unsupported_inference",
  "causal_reversal",
  "arithmetic_slip",
  "sign_error",
  "unit_mismatch",
  "formula_misapplication",
]);

function solveSatModelsHost(numVars: number, cnfClauses: number[][]): Array<Record<number, boolean>> {
  const models: Array<Record<number, boolean>> = [];
  if (numVars < 1 || numVars > 8) return models;
  const limit = 1 << numVars;
  for (let mask = 0; mask < limit; mask += 1) {
    const assign: Record<number, boolean> = {};
    for (let v = 1; v <= numVars; v += 1) {
      assign[v] = ((mask >> (v - 1)) & 1) === 1;
    }
    const ok = cnfClauses.every((clause) =>
      clause.some((lit) => {
        const variable = Math.abs(lit);
        const val = assign[variable];
        return lit > 0 ? val : !val;
      }),
    );
    if (ok) models.push(assign);
  }
  return models;
}

function tryParseFraction(expr: string): Fraction | null {
  try {
    const cleaned = expr.trim().replace(/\s+/g, "");
    if (!cleaned || /^logic:/i.test(cleaned)) return null;
    if (/^[+-]?\d+(\.\d+)?(\/[+-]?\d+)?$/.test(cleaned)) {
      return new Fraction(cleaned);
    }
    const evaluated = evaluate(cleaned);
    if (typeof evaluated === "number" && Number.isFinite(evaluated)) {
      return new Fraction(evaluated);
    }
    return null;
  } catch {
    return null;
  }
}

export function areCanonicalsEquivalent(a: string, b: string): boolean {
  const ca = a.trim();
  const cb = b.trim();
  if (ca === cb) return true;

  if (ca.startsWith("logic:") || cb.startsWith("logic:")) {
    return ca === cb;
  }

  const fa = tryParseFraction(ca);
  const fb = tryParseFraction(cb);
  if (fa && fb) {
    return fa.equals(fb);
  }

  try {
    const diff = simplify(`(${ca}) - (${cb})`).toString().replace(/\s+/g, "");
    if (diff === "0") return true;
    const numericVal = evaluate(diff);
    if (typeof numericVal === "number" && Math.abs(numericVal) < 1e-12) {
      return true;
    }
  } catch {
    return ca.toLowerCase() === cb.toLowerCase();
  }
  return false;
}

export function validateKatexExpression(tex: string): { valid: boolean; error?: string } {
  try {
    katex.renderToString(tex, {
      throwOnError: true,
      strict: "ignore",
      displayMode: false,
    });
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Invalid KaTeX syntax",
    };
  }
}

export function validateMarkdownWithKatex(text: string): { valid: boolean; error?: string } {
  const blockMatches = text.match(/\$\$([\s\S]+?)\$\$/g) ?? [];
  for (const m of blockMatches) {
    const inner = m.slice(2, -2).trim();
    const res = validateKatexExpression(inner);
    if (!res.valid) return res;
  }

  const withoutBlocks = text.replace(/\$\$([\s\S]+?)\$\$/g, "");
  const inlineMatches = withoutBlocks.match(/\$([^$\n]+?)\$/g) ?? [];
  for (const m of inlineMatches) {
    const inner = m.slice(1, -1).trim();
    const res = validateKatexExpression(inner);
    if (!res.valid) return res;
  }

  return { valid: true };
}

export function runTrustedOuterVerifier(output: RawSandboxOutput): OuterVerificationResult {
  if (!output.correct || !output.correct.canonical || !output.correct.display_latex) {
    return {
      passed: false,
      failureStatus: "failed_math_check",
      failureReason: "Missing correct answer canonical or display_latex.",
    };
  }

  if (!Array.isArray(output.distractors) || output.distractors.length !== 4) {
    return {
      passed: false,
      failureStatus: "failed_math_check",
      failureReason: `Expected exactly 4 distractors, received ${output.distractors?.length ?? 0}.`,
    };
  }

  if (!Array.isArray(output.feasibility_assertions) || output.feasibility_assertions.length === 0) {
    return {
      passed: false,
      failureStatus: "failed_feasibility",
      failureReason: "Missing feasibility_assertions array.",
    };
  }

  if (!output.feasibility_assertions.every((v) => v === true)) {
    return {
      passed: false,
      failureStatus: "failed_feasibility",
      failureReason: "One or more mathematical feasibility assertions evaluated false.",
    };
  }

  // Independent SAT proof for PU deductive logic checks
  if (output.logic_check) {
    const { num_vars, premises_cnf, entailed_literal } = output.logic_check;
    const models = solveSatModelsHost(num_vars, premises_cnf);
    if (models.length === 0) {
      return {
        passed: false,
        failureStatus: "failed_feasibility",
        failureReason: "Logic premises are unsatisfiable (contradictory).",
      };
    }
    const targetVar = Math.abs(entailed_literal);
    const expectedTruth = entailed_literal > 0;
    const entailed = models.every((m) => m[targetVar] === expectedTruth);
    if (!entailed) {
      return {
        passed: false,
        failureStatus: "failed_math_check",
        failureReason: `Target literal ${entailed_literal} is not entailed by all models.`,
      };
    }
  }

  const allEntries = [output.correct, ...output.distractors];
  for (let i = 0; i < allEntries.length; i += 1) {
    const entry = allEntries[i];
    if (!entry.canonical || !entry.display_latex) {
      return {
        passed: false,
        failureStatus: "failed_math_check",
        failureReason: `Option index ${i} missing canonical or display_latex.`,
      };
    }
    if (/NaN|Infinity|undefined|null/i.test(entry.canonical) || /NaN|Infinity/i.test(entry.display_latex)) {
      return {
        passed: false,
        failureStatus: "failed_math_check",
        failureReason: `Non-finite or undefined value detected at option index ${i}.`,
      };
    }
    const katexCheck = validateKatexExpression(entry.display_latex);
    if (!katexCheck.valid) {
      return {
        passed: false,
        failureStatus: "failed_math_check",
        failureReason: `Option ${i} KaTeX syntax error: ${katexCheck.error}`,
      };
    }
  }

  // Pairwise non-equivalence proof across all 5 options
  for (let i = 0; i < allEntries.length; i += 1) {
    for (let j = i + 1; j < allEntries.length; j += 1) {
      if (areCanonicalsEquivalent(allEntries[i].canonical, allEntries[j].canonical)) {
        return {
          passed: false,
          failureStatus: "failed_math_check",
          failureReason: `Option collision detected: '${allEntries[i].canonical}' is mathematically equivalent to '${allEntries[j].canonical}'.`,
        };
      }
    }
  }

  return { passed: true };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hydrateTemplateString(template: string, params: Record<string, string>): string {
  let out = template;
  for (const [key, val] of Object.entries(params)) {
    out = out.replaceAll(`{{${key}}}`, val);
  }
  const leftover = out.match(/\{\{[a-zA-Z0-9_]+\}\}/);
  if (leftover) {
    throw new Error(`Unreplaced template placeholder detected: ${leftover[0]}`);
  }
  return out;
}

export function buildShuffledOptions(
  output: RawSandboxOutput,
  seed: number,
): { options: QuestionOption[]; correctKey: "A" | "B" | "C" | "D" | "E" } {
  const keys: Array<"A" | "B" | "C" | "D" | "E"> = ["A", "B", "C", "D", "E"];
  const tagged = [
    {
      isCorrect: true,
      displayLatex: output.correct.display_latex,
      trapType: "none" as DistractorTrapType,
      rationale: "Jawaban tepat hasil perhitungan deterministik terverifikasi.",
    },
    ...output.distractors.map((d) => ({
      isCorrect: false,
      displayLatex: d.display_latex,
      trapType: VALID_TRAPS.has(d.trap_type as DistractorTrapType)
        ? (d.trap_type as DistractorTrapType)
        : "arithmetic_slip",
      rationale: d.rationale || "Kesalahan prosedur atau hitung umum.",
    })),
  ];

  const prng = mulberry32(seed ^ 0x9e3779b9);
  for (let i = tagged.length - 1; i > 0; i -= 1) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = tagged[i];
    tagged[i] = tagged[j];
    tagged[j] = tmp;
  }

  let correctKey: "A" | "B" | "C" | "D" | "E" = "A";
  const options: QuestionOption[] = tagged.map((item, idx) => {
    const key = keys[idx];
    if (item.isCorrect) correctKey = key;
    return {
      key,
      textMarkdown: `$${item.displayLatex}$`,
      latex: item.displayLatex,
      trapType: item.trapType,
      distractorRationale: item.rationale,
    };
  });

  return { options, correctKey };
}
