import { getQuickJS } from "quickjs-emscripten";
import { validateQuickJsAst } from "./ast-gate";
import type { MathSandboxDriver, RawSandboxOutput, SandboxExecutionResult } from "./sympy-http-driver";

const MEMORY_LIMIT_BYTES = 32 * 1024 * 1024; // 32 MB linear WASM memory cap
const STACK_LIMIT_BYTES = 512 * 1024; // 512 KB call stack cap
const CPU_TIMEOUT_MS = 500; // 500 ms wall-clock interrupt timeout
const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB stdout payload ceiling

/**
 * Pure deterministic guest prelude injected inside the isolated QuickJS VM.
 * Contains zero Node bindings, zero network, zero fs, and zero ambient randomness.
 */
const GUEST_MATH_PRELUDE = `
function rng(seed) {
  var a = (Number(seed) || 1) >>> 0;
  function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next: next,
    int: function (min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick: function (arr) {
      return arr[Math.floor(next() * arr.length)];
    }
  };
}

function gcdNum(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    var t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function Fraction(n, d) {
  if (n instanceof Fraction) {
    this.s = n.s;
    this.n = n.n;
    this.d = n.d;
    return;
  }
  if (typeof d === "undefined") {
    if (typeof n === "string" && n.indexOf("/") >= 0) {
      var parts = n.split("/");
      n = Number(parts[0]);
      d = Number(parts[1]);
    } else {
      n = Number(n);
      d = 1;
    }
  } else {
    n = Number(n);
    d = Number(d);
  }
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) {
    throw new Error("Invalid Fraction denominator or non-finite operand.");
  }
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    var scale = 1000000;
    n = Math.round(n * scale);
    d = Math.round(d * scale);
  }
  var sign = (n < 0 ? -1 : 1) * (d < 0 ? -1 : 1);
  n = Math.abs(n);
  d = Math.abs(d);
  var g = gcdNum(n, d);
  this.s = sign;
  this.n = n / g;
  this.d = d / g;
}

Fraction.prototype.add = function (other) {
  var o = other instanceof Fraction ? other : new Fraction(other);
  return new Fraction(this.s * this.n * o.d + o.s * o.n * this.d, this.d * o.d);
};

Fraction.prototype.sub = function (other) {
  var o = other instanceof Fraction ? other : new Fraction(other);
  return new Fraction(this.s * this.n * o.d - o.s * o.n * this.d, this.d * o.d);
};

Fraction.prototype.mul = function (other) {
  var o = other instanceof Fraction ? other : new Fraction(other);
  return new Fraction(this.s * o.s * this.n * o.n, this.d * o.d);
};

Fraction.prototype.div = function (other) {
  var o = other instanceof Fraction ? other : new Fraction(other);
  if (o.n === 0) throw new Error("Division by zero in Fraction.div");
  return new Fraction(this.s * o.s * this.n * o.d, this.d * o.n);
};

Fraction.prototype.valueOf = function () {
  return (this.s * this.n) / this.d;
};

Fraction.prototype.toFraction = function () {
  var num = this.s < 0 ? "-" + this.n : String(this.n);
  return this.d === 1 ? num : num + "/" + this.d;
};

function satSolve(numVars, cnfClauses) {
  var models = [];
  if (numVars < 1 || numVars > 8) return models;
  var limit = 1 << numVars;
  for (var mask = 0; mask < limit; mask += 1) {
    var assign = {};
    for (var v = 1; v <= numVars; v += 1) {
      assign[v] = ((mask >> (v - 1)) & 1) === 1;
    }
    var satisfied = true;
    for (var i = 0; i < cnfClauses.length; i += 1) {
      var clause = cnfClauses[i];
      var clauseOk = false;
      for (var j = 0; j < clause.length; j += 1) {
        var lit = clause[j];
        var varIdx = Math.abs(lit);
        var val = assign[varIdx];
        if ((lit > 0 && val) || (lit < 0 && !val)) {
          clauseOk = true;
          break;
        }
      }
      if (!clauseOk) {
        satisfied = false;
        break;
      }
    }
    if (satisfied) models.push(assign);
  }
  return models;
}
`;

export class QuickJsWasmSandboxDriver implements MathSandboxDriver {
  readonly runtimeName = "quickjs_wasm" as const;

  async execute(code: string, seed: number): Promise<SandboxExecutionResult> {
    const start = Date.now();
    const astGate = validateQuickJsAst(code);
    if (!astGate.passed) {
      return {
        ok: false,
        runtime: this.runtimeName,
        seed,
        executionTimeMs: Date.now() - start,
        peakMemoryKb: null,
        exitCode: 1,
        output: null,
        failureStatus: "failed_ast",
        failureReason: astGate.reason ?? "Static AST allowlist gate failed.",
      };
    }

    const QuickJS = await getQuickJS();
    const runtime = QuickJS.newRuntime();
    runtime.setMemoryLimit(MEMORY_LIMIT_BYTES);
    runtime.setMaxStackSize(STACK_LIMIT_BYTES);

    const deadline = Date.now() + CPU_TIMEOUT_MS;
    let timedOut = false;
    runtime.setInterruptHandler(() => {
      if (Date.now() > deadline) {
        timedOut = true;
        return true;
      }
      return false;
    });

    const context = runtime.newContext();
    try {
      const wrappedScript = `
${GUEST_MATH_PRELUDE}
${code}
(function () {
  if (typeof generate !== "function") {
    throw new Error("Generator script must declare function generate(seed).");
  }
  return JSON.stringify(generate(${Math.trunc(seed)}));
})();
`;
      const result = context.evalCode(wrappedScript, "untrusted-generator.js");
      const elapsed = Date.now() - start;

      if (result.error) {
        const dumpedErr = context.dump(result.error);
        result.error.dispose();
        const errText =
          typeof dumpedErr === "object" && dumpedErr !== null && "message" in dumpedErr
            ? String((dumpedErr as { message: unknown }).message)
            : String(dumpedErr);

        return {
          ok: false,
          runtime: this.runtimeName,
          seed,
          executionTimeMs: elapsed,
          peakMemoryKb: null,
          exitCode: timedOut ? 124 : 1,
          output: null,
          failureStatus: timedOut || /interrupted/i.test(errText) ? "failed_timeout" : "failed_math_check",
          failureReason: timedOut ? `QuickJS CPU timeout exceeded (${CPU_TIMEOUT_MS} ms).` : errText,
        };
      }

      const rawJson = context.getString(result.value);
      result.value.dispose();

      if (Buffer.byteLength(rawJson, "utf8") > MAX_OUTPUT_BYTES) {
        return {
          ok: false,
          runtime: this.runtimeName,
          seed,
          executionTimeMs: elapsed,
          peakMemoryKb: null,
          exitCode: 1,
          output: null,
          failureStatus: "failed_math_check",
          failureReason: `Sandbox JSON output exceeded ${MAX_OUTPUT_BYTES} byte cap.`,
        };
      }

      const memHandle = runtime.computeMemoryUsage();
      const memInfo = context.dump(memHandle) as { malloc_size?: number };
      memHandle.dispose();
      const peakMemoryKb =
        typeof memInfo?.malloc_size === "number" ? Math.round(memInfo.malloc_size / 1024) : null;

      const parsed = JSON.parse(rawJson) as RawSandboxOutput;
      return {
        ok: true,
        runtime: this.runtimeName,
        seed,
        executionTimeMs: elapsed,
        peakMemoryKb,
        exitCode: 0,
        output: parsed,
      };
    } catch (err) {
      const elapsed = Date.now() - start;
      return {
        ok: false,
        runtime: this.runtimeName,
        seed,
        executionTimeMs: elapsed,
        peakMemoryKb: null,
        exitCode: timedOut ? 124 : 1,
        output: null,
        failureStatus: timedOut ? "failed_timeout" : "failed_math_check",
        failureReason: err instanceof Error ? err.message : String(err),
      };
    } finally {
      context.dispose();
      runtime.dispose();
    }
  }
}
