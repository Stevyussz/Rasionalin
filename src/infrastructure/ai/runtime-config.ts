import fs from "node:fs";
import path from "node:path";
import { getServerEnv } from "@/infrastructure/config/env";

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

const CONFIG_PATH = path.join(process.cwd(), ".data", "ai-runtime-config.json");

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export function readRuntimeAiOverride(): RuntimeAiOverride | null {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<RuntimeAiOverride>;
    if (typeof parsed.baseUrl !== "string" || !parsed.baseUrl.trim()) return null;
    return {
      baseUrl: parsed.baseUrl.trim().replace(/\/+$/, ""),
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "",
      defaultModel: typeof parsed.defaultModel === "string" ? parsed.defaultModel.trim() : "",
      providerLabel: typeof parsed.providerLabel === "string" ? parsed.providerLabel.trim() : "Custom Gateway",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
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
    providerLabel: (params.providerLabel ?? existing?.providerLabel ?? "9router / OpenAI-Compatible").trim(),
    updatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export function resetRuntimeAiOverride(): void {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }
  } catch {
    // Ignore cleanup errors
  }
}

export function getEffectiveAiConfig(): EffectiveAiConfig {
  const env = getServerEnv();
  const override = readRuntimeAiOverride();

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
