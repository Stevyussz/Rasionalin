import { parse } from "acorn";

export interface AstGateResult {
  passed: boolean;
  reason?: string;
  nodeCount: number;
  maxLoopDepth: number;
}

const MAX_SCRIPT_BYTES = 16 * 1024;
const MAX_AST_NODES = 500;
const MAX_LOOP_DEPTH = 2;
const MAX_EXPONENT_LITERAL = 1000;

const FORBIDDEN_IDENTIFIERS = new Set([
  "require",
  "eval",
  "Function",
  "AsyncFunction",
  "GeneratorFunction",
  "Proxy",
  "Reflect",
  "globalThis",
  "window",
  "self",
  "process",
  "Buffer",
  "fetch",
  "XMLHttpRequest",
  "WebAssembly",
  "SharedArrayBuffer",
  "Atomics",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "Date",
  "Intl",
  "importScripts",
  "__proto__",
  "constructor",
  "prototype",
]);

const FORBIDDEN_MEMBER_PROPERTIES = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "random", // Forces seeded rng(seed) instead of non-deterministic Math.random
]);

export function validateQuickJsAst(code: string): AstGateResult {
  if (Buffer.byteLength(code, "utf8") > MAX_SCRIPT_BYTES) {
    return {
      passed: false,
      reason: `Script exceeds 16 KB limit.`,
      nodeCount: 0,
      maxLoopDepth: 0,
    };
  }

  let program: unknown;
  try {
    program = parse(code, {
      ecmaVersion: 2022,
      sourceType: "script",
      allowReturnOutsideFunction: false,
    });
  } catch (err) {
    return {
      passed: false,
      reason: `JS syntax parse error: ${err instanceof Error ? err.message : String(err)}`,
      nodeCount: 0,
      maxLoopDepth: 0,
    };
  }

  let nodeCount = 0;
  let maxLoopDepth = 0;
  let violation: string | undefined;

  function visit(node: unknown, loopDepth: number): void {
    if (violation || !node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const type = typeof record.type === "string" ? record.type : null;

    if (type) {
      nodeCount += 1;
      if (nodeCount > MAX_AST_NODES) {
        violation = `AST complexity limit exceeded (${nodeCount} > ${MAX_AST_NODES} nodes).`;
        return;
      }

      if (type === "ImportDeclaration" || type === "ImportExpression" || type === "ExportNamedDeclaration" || type === "WithStatement") {
        violation = `Forbidden statement type: ${type}`;
        return;
      }

      if (type === "WhileStatement" || type === "DoWhileStatement") {
        violation = `Unbounded ${type} is prohibited; use bounded for-loops.`;
        return;
      }

      if (type === "Identifier" && typeof record.name === "string") {
        if (FORBIDDEN_IDENTIFIERS.has(record.name)) {
          violation = `Forbidden identifier referenced: ${record.name}`;
          return;
        }
      }

      if (type === "MemberExpression") {
        const prop = record.property as Record<string, unknown> | undefined;
        if (record.computed === true && prop?.type !== "Literal") {
          // Allow array indexing by identifiers like arr[i] while guarding string keys against __proto__
          if (prop?.type === "Identifier" && FORBIDDEN_IDENTIFIERS.has(String(prop.name))) {
            violation = `Forbidden computed property identifier: ${String(prop.name)}`;
            return;
          }
        }
        if (prop?.type === "Identifier" && FORBIDDEN_MEMBER_PROPERTIES.has(String(prop.name))) {
          violation = `Forbidden member property: ${String(prop.name)}`;
          return;
        }
        if (prop?.type === "Literal" && FORBIDDEN_MEMBER_PROPERTIES.has(String(prop.value))) {
          violation = `Forbidden member property literal: ${String(prop.value)}`;
          return;
        }
      }

      if (type === "BinaryExpression" && record.operator === "**") {
        const right = record.right as Record<string, unknown> | undefined;
        if (right?.type === "Literal" && typeof right.value === "number" && right.value > MAX_EXPONENT_LITERAL) {
          violation = `Exponent literal ${right.value} exceeds cap (${MAX_EXPONENT_LITERAL}).`;
          return;
        }
      }
    }

    const isLoop = type === "ForStatement" || type === "ForInStatement" || type === "ForOfStatement";
    const nextLoopDepth = isLoop ? loopDepth + 1 : loopDepth;
    if (nextLoopDepth > maxLoopDepth) maxLoopDepth = nextLoopDepth;
    if (nextLoopDepth > MAX_LOOP_DEPTH) {
      violation = `Loop nesting depth ${nextLoopDepth} exceeds maximum (${MAX_LOOP_DEPTH}).`;
      return;
    }

    for (const [key, val] of Object.entries(record)) {
      if (key === "loc" || key === "start" || key === "end") continue;
      if (Array.isArray(val)) {
        for (const item of val) visit(item, nextLoopDepth);
      } else if (val && typeof val === "object") {
        visit(val, nextLoopDepth);
      }
    }
  }

  visit(program, 0);

  if (violation) {
    return { passed: false, reason: violation, nodeCount, maxLoopDepth };
  }

  return { passed: true, nodeCount, maxLoopDepth };
}

export function validatePythonPreFlight(code: string): AstGateResult {
  if (Buffer.byteLength(code, "utf8") > MAX_SCRIPT_BYTES) {
    return { passed: false, reason: "Python script exceeds 16 KB limit.", nodeCount: 0, maxLoopDepth: 0 };
  }
  const banned = /\b(eval|exec|compile|open|getattr|setattr|delattr|globals|locals|vars|__import__|os|sys|subprocess|socket|ctypes|pickle)\b|__[a-zA-Z0-9_]+__/;
  const match = code.match(banned);
  if (match) {
    return { passed: false, reason: `Forbidden Python construct detected: ${match[0]}`, nodeCount: 0, maxLoopDepth: 0 };
  }
  return { passed: true, nodeCount: code.split(/\s+/).length, maxLoopDepth: 1 };
}
