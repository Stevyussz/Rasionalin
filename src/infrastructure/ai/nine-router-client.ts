import crypto from "node:crypto";
import { z } from "zod";
import type { AiRoutingLedgerEntry } from "@/domain/types";
import { getEffectiveAiConfig } from "@/infrastructure/ai/runtime-config";
import type { AppRepository } from "@/infrastructure/db/repository-port";

export type AiTaskId =
  | "vision_pdf_extract"
  | "vault_note_chunk_classify"
  | "socratic_hint_l1_l2"
  | "socratic_hint_l3_l4"
  | "why_before_how_explain"
  | "tutor_freeform_chat"
  | "tutor_multimodal_chat"
  | "root_cause_classify"
  | "neuro_symbolic_template_gen"
  | "neuro_symbolic_code_repair"
  | "literacy_evidence_tagger"
  | "sbi_polya_deconstruct"
  | "diagnostic_gap_synthesizer"
  | "rag_text_embed";

export type TierName =
  | "TIER-0-EMBED"
  | "TIER-1-FAST"
  | "TIER-2-VISION"
  | "TIER-3-REASON"
  | "TIER-4-CODE-MATH";

interface TaskRoutingPolicy {
  tier: TierName;
  primaryAliasKey: "embed" | "fast" | "vision" | "reason" | "codeMath";
  fallbackChain: string[];
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export const ROUTING_MATRIX: Record<AiTaskId, TaskRoutingPolicy> = {
  vision_pdf_extract: {
    tier: "TIER-2-VISION",
    primaryAliasKey: "vision",
    fallbackChain: ["snbt-vision-fallback"],
    temperature: 0.05,
    maxTokens: 3200,
    timeoutMs: 20000,
  },
  vault_note_chunk_classify: {
    tier: "TIER-1-FAST",
    primaryAliasKey: "fast",
    fallbackChain: ["snbt-reason"],
    temperature: 0.1,
    maxTokens: 700,
    timeoutMs: 6000,
  },
  socratic_hint_l1_l2: {
    tier: "TIER-1-FAST",
    primaryAliasKey: "fast",
    fallbackChain: ["snbt-reason"],
    temperature: 0.3,
    maxTokens: 700,
    timeoutMs: 12000,
  },
  socratic_hint_l3_l4: {
    tier: "TIER-3-REASON",
    primaryAliasKey: "reason",
    fallbackChain: ["snbt-fast"],
    temperature: 0.35,
    maxTokens: 1100,
    timeoutMs: 16000,
  },
  why_before_how_explain: {
    tier: "TIER-3-REASON",
    primaryAliasKey: "reason",
    fallbackChain: ["snbt-fast"],
    temperature: 0.35,
    maxTokens: 1400,
    timeoutMs: 18000,
  },
  tutor_freeform_chat: {
    tier: "TIER-3-REASON",
    primaryAliasKey: "reason",
    fallbackChain: ["snbt-fast"],
    temperature: 0.4,
    maxTokens: 1400,
    timeoutMs: 18000,
  },
  tutor_multimodal_chat: {
    tier: "TIER-2-VISION",
    primaryAliasKey: "vision",
    fallbackChain: ["snbt-reason", "snbt-fast"],
    temperature: 0.3,
    maxTokens: 1600,
    timeoutMs: 24000,
  },
  root_cause_classify: {
    tier: "TIER-1-FAST",
    primaryAliasKey: "fast",
    fallbackChain: [],
    temperature: 0.05,
    maxTokens: 320,
    timeoutMs: 4000,
  },
  neuro_symbolic_template_gen: {
    tier: "TIER-4-CODE-MATH",
    primaryAliasKey: "codeMath",
    fallbackChain: ["snbt-reason"],
    temperature: 0.2,
    maxTokens: 2400,
    timeoutMs: 18000,
  },
  neuro_symbolic_code_repair: {
    tier: "TIER-4-CODE-MATH",
    primaryAliasKey: "codeMath",
    fallbackChain: ["snbt-reason"],
    temperature: 0.1,
    maxTokens: 1800,
    timeoutMs: 14000,
  },
  literacy_evidence_tagger: {
    tier: "TIER-3-REASON",
    primaryAliasKey: "reason",
    fallbackChain: ["snbt-fast"],
    temperature: 0.1,
    maxTokens: 1100,
    timeoutMs: 10000,
  },
  sbi_polya_deconstruct: {
    tier: "TIER-3-REASON",
    primaryAliasKey: "reason",
    fallbackChain: ["snbt-fast"],
    temperature: 0.15,
    maxTokens: 1200,
    timeoutMs: 10000,
  },
  diagnostic_gap_synthesizer: {
    tier: "TIER-3-REASON",
    primaryAliasKey: "reason",
    fallbackChain: ["snbt-fast"],
    temperature: 0.25,
    maxTokens: 1100,
    timeoutMs: 12000,
  },
  rag_text_embed: {
    tier: "TIER-0-EMBED",
    primaryAliasKey: "embed",
    fallbackChain: ["snbt-embed-fallback"],
    temperature: 0,
    maxTokens: 0,
    timeoutMs: 5000,
  },
};

export function fenceUntrustedVaultExcerpt(sourceId: string, rawText: string): string {
  const sanitized = rawText
    .replaceAll("</untrusted_vault_excerpt>", "[closed-tag]")
    .replaceAll("<untrusted_vault_excerpt", "[opened-tag]");
  return `<untrusted_vault_excerpt source_id="${sourceId}">\n${sanitized}\n</untrusted_vault_excerpt>`;
}

interface CircuitState {
  failures: number[];
  openedUntilMs: number;
}

const circuitMap = new Map<string, CircuitState>();
const CIRCUIT_WINDOW_MS = 60_000;
const CIRCUIT_OPEN_MS = 45_000;
const CIRCUIT_THRESHOLD = 5;

function isCircuitOpen(alias: string, nowMs: number): boolean {
  const st = circuitMap.get(alias);
  if (!st) return false;
  return st.openedUntilMs > nowMs;
}

function recordAliasFailure(alias: string, nowMs: number): void {
  const st = circuitMap.get(alias) ?? { failures: [], openedUntilMs: 0 };
  st.failures = st.failures.filter((t) => nowMs - t <= CIRCUIT_WINDOW_MS);
  st.failures.push(nowMs);
  if (st.failures.length >= CIRCUIT_THRESHOLD) {
    st.openedUntilMs = nowMs + CIRCUIT_OPEN_MS;
    st.failures = [];
  }
  circuitMap.set(alias, st);
}

function recordAliasSuccess(alias: string): void {
  circuitMap.delete(alias);
}

function extractJsonObject(rawContent: string): string {
  const trimmed = rawContent.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

function estimateCostUsd(modelAlias: string, promptTokens: number, completionTokens: number): number {
  const rates: Record<string, [number, number]> = {
    "snbt-embed": [0.00002, 0],
    "snbt-fast": [0.00015, 0.0006],
    "snbt-vision": [0.00125, 0.005],
    "snbt-reason": [0.003, 0.015],
    "snbt-code-math": [0.003, 0.015],
  };
  const [inPer1k, outPer1k] = rates[modelAlias] ?? [0.0005, 0.0015];
  return Number(((promptTokens / 1000) * inPer1k + (completionTokens / 1000) * outPer1k).toFixed(6));
}

export interface ChatCompletionContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail?: "high" | "low" | "auto" };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ChatCompletionContentPart[];
}

export interface StructuredAiResult<T> {
  ok: boolean;
  data: T | null;
  modelUsed: string | null;
  fallbackDepth: number;
  latencyMs: number;
  errorCode: string | null;
}

interface DiscoveredModelsCache {
  models: string[];
  fetchedAt: number;
}

let discoveredModelsCache: (DiscoveredModelsCache & { baseUrl: string }) | null = null;

export function clearDiscoveredModelsCache(): void {
  discoveredModelsCache = null;
}

async function discoverLiveRouterModels(): Promise<string[]> {
  const cfg = getEffectiveAiConfig();
  if (
    discoveredModelsCache &&
    discoveredModelsCache.baseUrl === cfg.baseUrl &&
    Date.now() - discoveredModelsCache.fetchedAt < 30_000
  ) {
    return discoveredModelsCache.models;
  }
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as { data?: Array<{ id?: string }> };
    const ids = Array.isArray(payload.data)
      ? payload.data
          .map((m) => (typeof m?.id === "string" ? m.id.trim() : ""))
          .filter((id) => id.length > 0 && !id.toLowerCase().includes("embed"))
      : [];
    discoveredModelsCache = { baseUrl: cfg.baseUrl, models: ids, fetchedAt: Date.now() };
    return ids;
  } catch {
    return [];
  }
}

export async function checkNineRouterHealth(): Promise<{
  reachable: boolean;
  baseUrl: string;
  modelsCount: number;
  modelsList: string[];
  error: string | null;
}> {
  const cfg = getEffectiveAiConfig();
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return {
        reachable: false,
        baseUrl: cfg.baseUrl,
        modelsCount: 0,
        modelsList: [],
        error: `HTTP ${res.status}`,
      };
    }
    const payload = (await res.json()) as { data?: Array<{ id?: string }> };
    const modelsList = Array.isArray(payload.data)
      ? payload.data
          .map((m) => (typeof m?.id === "string" ? m.id.trim() : ""))
          .filter(Boolean)
      : [];
    discoveredModelsCache = {
      baseUrl: cfg.baseUrl,
      models: modelsList.filter((id) => !id.toLowerCase().includes("embed")),
      fetchedAt: Date.now(),
    };
    return {
      reachable: true,
      baseUrl: cfg.baseUrl,
      modelsCount: modelsList.length,
      modelsList: modelsList.slice(0, 24),
      error: null,
    };
  } catch (err) {
    return {
      reachable: false,
      baseUrl: cfg.baseUrl,
      modelsCount: 0,
      modelsList: [],
      error: err instanceof Error ? err.message : "Connection refused",
    };
  }
}

export class NineRouterClient {
  constructor(private readonly repo: AppRepository) {}

  private buildHeaders(correlationId: string, taskId: AiTaskId, userId: string | null): Record<string, string> {
    const cfg = getEffectiveAiConfig();
    const userHash = userId
      ? crypto.createHash("sha256").update(userId).digest("hex").slice(0, 12)
      : "anonymous";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      "X-Correlation-Id": correlationId,
      "X-Task-Type": taskId,
      "X-User-Id-Hash": userHash,
    };
  }

  private async logLedger(entry: Omit<AiRoutingLedgerEntry, "id" | "createdAt">): Promise<void> {
    try {
      await this.repo.recordAiRoutingLedger({
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Ledger failure must never crash primary study workflow
    }
  }

  async invokeStructuredJson<T>(params: {
    taskId: AiTaskId;
    userId: string | null;
    schema: z.ZodType<T>;
    schemaName: string;
    jsonSchema: Record<string, unknown>;
    messages: ChatMessage[];
  }): Promise<StructuredAiResult<T>> {
    const cfg = getEffectiveAiConfig();
    const policy = ROUTING_MATRIX[params.taskId];
    const primaryAlias = cfg.models[policy.primaryAliasKey];
    const discovered = await discoverLiveRouterModels();
    const aliases = [
      primaryAlias,
      ...(cfg.isCustomConfigured ? [] : policy.fallbackChain),
      ...discovered.slice(0, 2),
    ].filter((v, idx, arr) => v && arr.indexOf(v) === idx);
    const correlationId = crypto.randomUUID();
    const overallStart = Date.now();

    for (let depth = 0; depth < aliases.length; depth += 1) {
      const alias = aliases[depth];
      if (isCircuitOpen(alias, Date.now())) {
        continue;
      }

      let retries = 0;
      const maxRetries = 1;
      let useStrictSchema = true;

      while (retries <= maxRetries) {
        const callStart = Date.now();
        try {
          const responseFormat = useStrictSchema
            ? {
                type: "json_schema",
                json_schema: { name: params.schemaName, strict: true, schema: params.jsonSchema },
              }
            : { type: "json_object" };

          const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.buildHeaders(correlationId, params.taskId, params.userId),
            body: JSON.stringify({
              model: alias,
              temperature: policy.temperature,
              max_tokens: policy.maxTokens,
              response_format: responseFormat,
              messages: params.messages,
            }),
            signal: AbortSignal.timeout(Math.min(policy.timeoutMs, cfg.timeoutMs)),
          });

          if (res.status === 400 && useStrictSchema) {
            useStrictSchema = false;
            retries += 1;
            continue;
          }

          if (!res.ok) {
            const code = `HTTP_${res.status}`;
            if (res.status >= 500 || res.status === 429) {
              recordAliasFailure(alias, Date.now());
            }
            await this.logLedger({
              correlationId,
              userId: params.userId,
              taskType: params.taskId,
              tier: policy.tier,
              requestedModelAlias: primaryAlias,
              actualModelUsed: alias,
              fallbackDepth: depth,
              promptTokens: 0,
              completionTokens: 0,
              estimatedCostUsd: 0,
              latencyMs: Date.now() - callStart,
              schemaValid: false,
              retryCount: retries,
              httpStatus: res.status,
              errorCode: code,
            });
            if (res.status >= 500 && retries < maxRetries) {
              const backoff = Math.floor(Math.random() * 250) + 150;
              await new Promise((r) => setTimeout(r, backoff));
              retries += 1;
              continue;
            }
            break;
          }

          const body = (await res.json()) as {
            model?: string;
            choices?: Array<{ message?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };
          const rawText = body.choices?.[0]?.message?.content ?? "";
          const promptTokens = body.usage?.prompt_tokens ?? 0;
          const completionTokens = body.usage?.completion_tokens ?? 0;
          const actualModel = body.model || alias;

          let parsedJson: unknown;
          try {
            parsedJson = JSON.parse(extractJsonObject(rawText));
          } catch {
            parsedJson = null;
          }

          const zodAttempt = parsedJson !== null ? params.schema.safeParse(parsedJson) : null;
          if (zodAttempt?.success) {
            recordAliasSuccess(alias);
            await this.logLedger({
              correlationId,
              userId: params.userId,
              taskType: params.taskId,
              tier: policy.tier,
              requestedModelAlias: primaryAlias,
              actualModelUsed: actualModel,
              fallbackDepth: depth,
              promptTokens,
              completionTokens,
              estimatedCostUsd: estimateCostUsd(alias, promptTokens, completionTokens),
              latencyMs: Date.now() - callStart,
              schemaValid: true,
              retryCount: retries,
              httpStatus: 200,
              errorCode: null,
            });
            return {
              ok: true,
              data: zodAttempt.data,
              modelUsed: actualModel,
              fallbackDepth: depth,
              latencyMs: Date.now() - overallStart,
              errorCode: null,
            };
          }

          // Bounded 1-time Zod schema repair via snbt-fast
          const zodIssues = zodAttempt?.error?.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") ?? "Invalid JSON syntax";
          await this.logLedger({
            correlationId,
            userId: params.userId,
            taskType: params.taskId,
            tier: policy.tier,
            requestedModelAlias: primaryAlias,
            actualModelUsed: actualModel,
            fallbackDepth: depth,
            promptTokens,
            completionTokens,
            estimatedCostUsd: estimateCostUsd(alias, promptTokens, completionTokens),
            latencyMs: Date.now() - callStart,
            schemaValid: false,
            retryCount: retries,
            httpStatus: 200,
            errorCode: "ZOD_VALIDATION_FAILED",
          });

          const repaired = await this.attemptSingleSchemaRepair(
            correlationId,
            params.userId,
            params.taskId,
            rawText,
            zodIssues,
            params.schema,
          );
          if (repaired) {
            return {
              ok: true,
              data: repaired,
              modelUsed: `${actualModel}+repaired`,
              fallbackDepth: depth,
              latencyMs: Date.now() - overallStart,
              errorCode: null,
            };
          }
          break;
        } catch (err) {
          recordAliasFailure(alias, Date.now());
          const errMsg = err instanceof Error ? err.name : "NETWORK_ERROR";
          await this.logLedger({
            correlationId,
            userId: params.userId,
            taskType: params.taskId,
            tier: policy.tier,
            requestedModelAlias: primaryAlias,
            actualModelUsed: alias,
            fallbackDepth: depth,
            promptTokens: 0,
            completionTokens: 0,
            estimatedCostUsd: 0,
            latencyMs: Date.now() - callStart,
            schemaValid: false,
            retryCount: retries,
            httpStatus: null,
            errorCode: errMsg,
          });
          break;
        }
      }
    }

    return {
      ok: false,
      data: null,
      modelUsed: null,
      fallbackDepth: aliases.length,
      latencyMs: Date.now() - overallStart,
      errorCode: "ALL_ALIASES_UNAVAILABLE",
    };
  }

  private async attemptSingleSchemaRepair<T>(
    correlationId: string,
    userId: string | null,
    taskId: AiTaskId,
    malformedText: string,
    zodIssues: string,
    schema: z.ZodType<T>,
  ): Promise<T | null> {
    const cfg = getEffectiveAiConfig();
    const start = Date.now();
    try {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.buildHeaders(correlationId, taskId, userId),
        body: JSON.stringify({
          model: cfg.models.fast,
          temperature: 0,
          max_tokens: 1400,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Perbaiki JSON berikut agar sesuai error skema. Keluarkan JSON valid saja.",
            },
            {
              role: "user",
              content: `Schema issues: ${zodIssues}\n\nMalformed output:\n${malformedText.slice(0, 4500)}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = body.choices?.[0]?.message?.content ?? "";
      const parsed = schema.safeParse(JSON.parse(extractJsonObject(raw)));
      await this.logLedger({
        correlationId,
        userId,
        taskType: `${taskId}_repair`,
        tier: "TIER-1-FAST",
        requestedModelAlias: cfg.models.fast,
        actualModelUsed: cfg.models.fast,
        fallbackDepth: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
        latencyMs: Date.now() - start,
        schemaValid: parsed.success,
        retryCount: 1,
        httpStatus: 200,
        errorCode: parsed.success ? null : "REPAIR_FAILED",
      });
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  async embedText(userId: string | null, text: string): Promise<number[] | null> {
    const cfg = getEffectiveAiConfig();
    const policy = ROUTING_MATRIX.rag_text_embed;
    const alias = cfg.models.embed;
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
      const res = await fetch(`${cfg.baseUrl}/embeddings`, {
        method: "POST",
        headers: this.buildHeaders(correlationId, "rag_text_embed", userId),
        body: JSON.stringify({
          model: alias,
          input: text.slice(0, 6000),
          dimensions: 1536,
        }),
        signal: AbortSignal.timeout(policy.timeoutMs),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as {
        data?: Array<{ embedding?: number[] }>;
        usage?: { prompt_tokens?: number };
      };
      const vec = body.data?.[0]?.embedding;
      if (!Array.isArray(vec) || vec.length !== 1536) return null;

      await this.logLedger({
        correlationId,
        userId,
        taskType: "rag_text_embed",
        tier: policy.tier,
        requestedModelAlias: alias,
        actualModelUsed: alias,
        fallbackDepth: 0,
        promptTokens: body.usage?.prompt_tokens ?? 0,
        completionTokens: 0,
        estimatedCostUsd: estimateCostUsd("snbt-embed", body.usage?.prompt_tokens ?? 0, 0),
        latencyMs: Date.now() - start,
        schemaValid: true,
        retryCount: 0,
        httpStatus: 200,
        errorCode: null,
      });
      return vec;
    } catch {
      return null;
    }
  }
}
