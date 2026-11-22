import crypto from "node:crypto";
import type { SandboxRuntime } from "@/domain/types";
import { getServerEnv } from "@/infrastructure/config/env";
import { validatePythonPreFlight } from "./ast-gate";

export interface RawSandboxOutput {
  params: Record<string, string>;
  correct: { canonical: string; display_latex: string };
  distractors: Array<{
    canonical: string;
    display_latex: string;
    trap_type: string;
    rationale: string;
  }>;
  feasibility_assertions: boolean[];
  logic_check?: {
    num_vars: number;
    premises_cnf: number[][];
    entailed_literal: number;
  };
}

export interface SandboxExecutionResult {
  ok: boolean;
  runtime: SandboxRuntime;
  seed: number;
  executionTimeMs: number;
  peakMemoryKb: number | null;
  exitCode: number;
  output: RawSandboxOutput | null;
  failureStatus?: "failed_ast" | "failed_timeout" | "failed_math_check" | "failed_feasibility";
  failureReason?: string;
}

export interface MathSandboxDriver {
  readonly runtimeName: SandboxRuntime;
  execute(code: string, seed: number): Promise<SandboxExecutionResult>;
}

export class SympyHttpSandboxDriver implements MathSandboxDriver {
  readonly runtimeName = "python_sympy" as const;

  async execute(code: string, seed: number): Promise<SandboxExecutionResult> {
    const start = Date.now();
    const astCheck = validatePythonPreFlight(code);
    if (!astCheck.passed) {
      return {
        ok: false,
        runtime: this.runtimeName,
        seed,
        executionTimeMs: Date.now() - start,
        peakMemoryKb: null,
        exitCode: 1,
        output: null,
        failureStatus: "failed_ast",
        failureReason: astCheck.reason ?? "AST gate failed.",
      };
    }

    const env = getServerEnv();
    if (!env.sympySandboxUrl) {
      return {
        ok: false,
        runtime: this.runtimeName,
        seed,
        executionTimeMs: Date.now() - start,
        peakMemoryKb: null,
        exitCode: 1,
        output: null,
        failureStatus: "failed_math_check",
        failureReason: "SYMPY_SANDBOX_URL is not configured for sympy_http driver.",
      };
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = JSON.stringify({ code, seed, timeout_ms: 1500 });
    const sig = crypto
      .createHmac("sha256", env.sandboxHmacSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    try {
      const res = await fetch(`${env.sympySandboxUrl.replace(/\/+$/, "")}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sandbox-Timestamp": timestamp,
          "X-Sandbox-Signature": sig,
        },
        body: payload,
        signal: AbortSignal.timeout(2000),
      });

      const elapsed = Date.now() - start;
      if (!res.ok) {
        return {
          ok: false,
          runtime: this.runtimeName,
          seed,
          executionTimeMs: elapsed,
          peakMemoryKb: null,
          exitCode: res.status,
          output: null,
          failureStatus: res.status === 408 ? "failed_timeout" : "failed_math_check",
          failureReason: `SymPy sidecar HTTP ${res.status}`,
        };
      }

      const data = (await res.json()) as {
        ok: boolean;
        peak_memory_kb?: number;
        output?: RawSandboxOutput;
        error?: string;
        status?: SandboxExecutionResult["failureStatus"];
      };

      if (!data.ok || !data.output) {
        return {
          ok: false,
          runtime: this.runtimeName,
          seed,
          executionTimeMs: elapsed,
          peakMemoryKb: data.peak_memory_kb ?? null,
          exitCode: 1,
          output: null,
          failureStatus: data.status ?? "failed_math_check",
          failureReason: data.error ?? "SymPy sidecar rejected execution.",
        };
      }

      return {
        ok: true,
        runtime: this.runtimeName,
        seed,
        executionTimeMs: elapsed,
        peakMemoryKb: data.peak_memory_kb ?? null,
        exitCode: 0,
        output: data.output,
      };
    } catch (err) {
      const elapsed = Date.now() - start;
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      return {
        ok: false,
        runtime: this.runtimeName,
        seed,
        executionTimeMs: elapsed,
        peakMemoryKb: null,
        exitCode: 124,
        output: null,
        failureStatus: isTimeout ? "failed_timeout" : "failed_math_check",
        failureReason: err instanceof Error ? err.message : "SymPy RPC failure",
      };
    }
  }
}
