export interface ServerEnv {
  databaseUrl: string | null;
  directUrl: string | null;
  supabaseUrl: string | null;
  supabaseServiceRoleKey: string | null;
  supabaseStorageBucket: string;
  nineRouterBaseUrl: string;
  nineRouterApiKey: string;
  nineRouterTimeoutMs: number;
  models: {
    embed: string;
    fast: string;
    vision: string;
    reason: string;
    codeMath: string;
  };
  mathSandboxDriver: "quickjs_wasm" | "sympy_http";
  sympySandboxUrl: string | null;
  sandboxHmacSecret: string;
  sessionSecret: string;
}

export function getServerEnv(): ServerEnv {
  const rawDriver = process.env.MATH_SANDBOX_DRIVER?.trim();
  const mathSandboxDriver: "quickjs_wasm" | "sympy_http" =
    rawDriver === "sympy_http" ? "sympy_http" : "quickjs_wasm";

  const timeoutNum = Number(process.env.NINE_ROUTER_TIMEOUT_MS ?? "20000");

  return {
    databaseUrl: process.env.DATABASE_URL?.trim() || null,
    directUrl: process.env.DIRECT_URL?.trim() || null,
    supabaseUrl: process.env.SUPABASE_URL?.trim() || null,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null,
    supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "brain-vault",
    nineRouterBaseUrl: (process.env.NINE_ROUTER_BASE_URL?.trim() || "http://localhost:20128/v1").replace(
      /\/+$/,
      "",
    ),
    nineRouterApiKey: process.env.NINE_ROUTER_API_KEY?.trim() || "sk-9router-local-dev",
    nineRouterTimeoutMs: Number.isFinite(timeoutNum) && timeoutNum > 0 ? timeoutNum : 20000,
    models: {
      embed: process.env.NINE_ROUTER_MODEL_EMBED?.trim() || "snbt-embed",
      fast: process.env.NINE_ROUTER_MODEL_FAST?.trim() || "snbt-fast",
      vision: process.env.NINE_ROUTER_MODEL_VISION?.trim() || "snbt-vision",
      reason: process.env.NINE_ROUTER_MODEL_REASON?.trim() || "snbt-reason",
      codeMath: process.env.NINE_ROUTER_MODEL_CODE_MATH?.trim() || "snbt-code-math",
    },
    mathSandboxDriver,
    sympySandboxUrl: process.env.SYMPY_SANDBOX_URL?.trim() || null,
    sandboxHmacSecret: process.env.SANDBOX_HMAC_SECRET?.trim() || "kejarsnbt-dev-hmac-secret",
    sessionSecret:
      process.env.SESSION_SECRET?.trim() || "kejarsnbt-dev-session-secret-change-in-prod",
  };
}
