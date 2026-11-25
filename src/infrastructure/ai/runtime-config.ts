import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getServerEnv } from "@/infrastructure/config/env";
import { getPgPool } from "@/infrastructure/db/postgres/client";

export interface RuntimeAiOverride {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  providerLabel: string;
  updatedAt: string;
}

export interface EffectiveAiConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string | null;
  providerLabel: string;
  isCustomConfigured: boolean;
  maskedApiKey: string;
  models: {
    embed: string;
    fast: string;
    vision: string;
    reason: string;
    codeMath: string;
  };
  timeoutMs: number;
}

function resolveConfigPath(): string {
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "rasionalin-data", "ai-runtime-config.json");
  }
  return path.join(process.cwd(), ".data", "ai-runtime-config.json");
}

const AI_SETTING_KEY = "nine_router_override";

declare global {
  var __rasionalinAiOverrideCache:
    | { loaded: boolean; value: RuntimeAiOverride | null; expiresAt: number }
    | undefined;
  var __rasionalinSettingsTableReady: Promise<void> | undefined;
}

function usePostgresSettings(): boolean {
  if (process.env.VITEST === "true") return false;
  return Boolean(getServerEnv().databaseUrl);
}

async function ensureSettingsTable(): Promise<void> {
  if (!usePostgresSettings()) return;
  if (!globalThis.__rasionalinSettingsTableReady) {
    const pool = getPgPool();
    globalThis.__rasionalinSettingsTableReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS app_runtime_settings (
          setting_key TEXT PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
      )
      .then(() => undefined)
      .catch((err) => {
        globalThis.__rasionalinSettingsTableReady = undefined;
        throw err;
      });
  }
  await globalThis.__rasionalinSettingsTableReady;
}

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

function normalizeOverride(parsed: Partial<RuntimeAiOverride>): RuntimeAiOverride | null {
  if (typeof parsed.baseUrl !== "string" || !parsed.baseUrl.trim()) return null;
  return {
    baseUrl: parsed.baseUrl.trim().replace(/\/+$/, ""),
    apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "",
    defaultModel: typeof parsed.defaultModel === "string" ? parsed.defaultModel.trim() : "",
    providerLabel:
      typeof parsed.providerLabel === "string" && parsed.providerLabel.trim()
        ? parsed.providerLabel.trim()
        : "Custom Gateway",
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
  };
}

export function readRuntimeAiOverride(): RuntimeAiOverride | null {
  if (
    globalThis.__rasionalinAiOverrideCache?.loaded &&
    Date.now() < globalThis.__rasionalinAiOverrideCache.expiresAt
  ) {
    return globalThis.__rasionalinAiOverrideCache.value;
  }

  const configPath = resolveConfigPath();
  try {
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<RuntimeAiOverride>;
    const normalized = normalizeOverride(parsed);
    globalThis.__rasionalinAiOverrideCache = {
      loaded: true,
      value: normalized,
      expiresAt: Date.now() + 30_000,
    };
    return normalized;
  } catch {
    return null;
  }
}

export async function readRuntimeAiOverrideAsync(): Promise<RuntimeAiOverride | null> {
  if (
    globalThis.__rasionalinAiOverrideCache?.loaded &&
    Date.now() < globalThis.__rasionalinAiOverrideCache.expiresAt
  ) {
    return globalThis.__rasionalinAiOverrideCache.value;
  }

  if (usePostgresSettings()) {
    try {
      await ensureSettingsTable();
      const pool = getPgPool();
      const res = await pool.query<{ payload: Partial<RuntimeAiOverride> }>(
        `SELECT payload FROM app_runtime_settings WHERE setting_key = $1`,
        [AI_SETTING_KEY],
      );
      const val = res.rows[0] ? normalizeOverride(res.rows[0].payload) : null;
      globalThis.__rasionalinAiOverrideCache = {
        loaded: true,
        value: val,
        expiresAt: Date.now() + 30_000,
      };
      return val;
    } catch {
      return readRuntimeAiOverride();
    }
  }

  return readRuntimeAiOverride();
}

export function saveRuntimeAiOverride(params: {
  baseUrl: string;
  apiKey?: string;
  defaultModel?: string;
  providerLabel?: string;
}): RuntimeAiOverride {
  const existing = readRuntimeAiOverride();
  const next: RuntimeAiOverride = {
    baseUrl: params.baseUrl.trim().replace(/\/+$/, ""),
    apiKey:
      params.apiKey !== undefined && params.apiKey.trim().length > 0
        ? params.apiKey.trim()
        : existing?.apiKey ?? getServerEnv().nineRouterApiKey,
    defaultModel: (params.defaultModel ?? existing?.defaultModel ?? "").trim(),
    providerLabel: (
      params.providerLabel ??
      existing?.providerLabel ??
      "9router / OpenAI-Compatible"
    ).trim(),
    updatedAt: new Date().toISOString(),
  };

  globalThis.__rasionalinAiOverrideCache = {
    loaded: true,
    value: next,
    expiresAt: Date.now() + 30_000,
  };

  const configPath = resolveConfigPath();
  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(next, null, 2), "utf-8");
  } catch {
    // Ignore read-only disk errors in serverless environments
  }
  return next;
}

export async function saveRuntimeAiOverrideAsync(params: {
  baseUrl: string;
  apiKey?: string;
  defaultModel?: string;
  providerLabel?: string;
}): Promise<RuntimeAiOverride> {
  const next = saveRuntimeAiOverride(params);
  if (usePostgresSettings()) {
    await ensureSettingsTable();
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO app_runtime_settings (setting_key, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (setting_key) DO UPDATE SET
         payload = EXCLUDED.payload,
         updated_at = NOW()`,
      [AI_SETTING_KEY, JSON.stringify(next)],
    );
  }
  return next;
}

export function resetRuntimeAiOverride(): void {
  globalThis.__rasionalinAiOverrideCache = {
    loaded: true,
    value: null,
    expiresAt: Date.now() + 30_000,
  };
  const configPath = resolveConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  } catch {
    // Ignore cleanup errors
  }
}

export async function resetRuntimeAiOverrideAsync(): Promise<void> {
  resetRuntimeAiOverride();
  if (usePostgresSettings()) {
    await ensureSettingsTable();
    const pool = getPgPool();
    await pool.query(`DELETE FROM app_runtime_settings WHERE setting_key = $1`, [AI_SETTING_KEY]);
  }
}

function buildEffectiveConfigFromOverride(override: RuntimeAiOverride | null): EffectiveAiConfig {
  const env = getServerEnv();

  if (override) {
    const model = override.defaultModel || null;
    return {
      baseUrl: override.baseUrl,
      apiKey: override.apiKey || env.nineRouterApiKey,
      defaultModel: model,
      providerLabel: override.providerLabel,
      isCustomConfigured: true,
      maskedApiKey: maskKey(override.apiKey || env.nineRouterApiKey),
      models: {
        embed: env.models.embed,
        fast: model || env.models.fast,
        vision: model || env.models.vision,
        reason: model || env.models.reason,
        codeMath: model || env.models.codeMath,
      },
      timeoutMs: env.nineRouterTimeoutMs,
    };
  }

  return {
    baseUrl: env.nineRouterBaseUrl,
    apiKey: env.nineRouterApiKey,
    defaultModel: null,
    providerLabel:
      env.nineRouterBaseUrl.includes("localhost") || env.nineRouterBaseUrl.includes("127.0.0.1")
        ? "9router Lokal (.env.local)"
        : "9router Hosted (.env.local)",
    isCustomConfigured: false,
    maskedApiKey: maskKey(env.nineRouterApiKey),
    models: env.models,
    timeoutMs: env.nineRouterTimeoutMs,
  };
}

export function getEffectiveAiConfig(): EffectiveAiConfig {
  return buildEffectiveConfigFromOverride(readRuntimeAiOverride());
}

export async function getEffectiveAiConfigAsync(): Promise<EffectiveAiConfig> {
  return buildEffectiveConfigFromOverride(await readRuntimeAiOverrideAsync());
}
