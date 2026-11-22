import { getServerEnv } from "@/infrastructure/config/env";
import { QuickJsWasmSandboxDriver } from "./quickjs-wasm-driver";
import { SympyHttpSandboxDriver, type MathSandboxDriver } from "./sympy-http-driver";

export function getMathSandboxDriver(): MathSandboxDriver {
  const { mathSandboxDriver } = getServerEnv();
  return mathSandboxDriver === "sympy_http"
    ? new SympyHttpSandboxDriver()
    : new QuickJsWasmSandboxDriver();
}
