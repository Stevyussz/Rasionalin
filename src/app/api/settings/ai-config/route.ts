import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  checkNineRouterHealth,
  clearDiscoveredModelsCache,
} from "@/infrastructure/ai/nine-router-client";
import {
  getEffectiveAiConfigAsync,
  resetRuntimeAiOverrideAsync,
  saveRuntimeAiOverrideAsync,
} from "@/infrastructure/ai/runtime-config";

const SaveAiConfigSchema = z.object({
  action: z.enum(["save", "reset", "test"]).default("save"),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().max(300).optional(),
  defaultModel: z.string().max(160).optional(),
  providerLabel: z.string().max(80).optional(),
});

export async function GET() {
  const cfg = await getEffectiveAiConfigAsync();
  const health = await checkNineRouterHealth();

  return NextResponse.json({
    config: {
      baseUrl: cfg.baseUrl,
      defaultModel: cfg.defaultModel ?? "",
      providerLabel: cfg.providerLabel,
      isCustomConfigured: cfg.isCustomConfigured,
      maskedApiKey: cfg.maskedApiKey,
    },
    health,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = SaveAiConfigSchema.parse(await req.json());

    if (body.action === "reset") {
      await resetRuntimeAiOverrideAsync();
      clearDiscoveredModelsCache();
    } else if (body.action === "save") {
      if (!body.baseUrl) {
        return NextResponse.json({ error: "Base URL wajib diisi." }, { status: 400 });
      }
      await saveRuntimeAiOverrideAsync({
        baseUrl: body.baseUrl,
        apiKey: body.apiKey,
        defaultModel: body.defaultModel,
        providerLabel: body.providerLabel,
      });
      clearDiscoveredModelsCache();
    } else {
      clearDiscoveredModelsCache();
    }

    const cfg = await getEffectiveAiConfigAsync();
    const health = await checkNineRouterHealth();

    return NextResponse.json({
      ok: true,
      config: {
        baseUrl: cfg.baseUrl,
        defaultModel: cfg.defaultModel ?? "",
        providerLabel: cfg.providerLabel,
        isCustomConfigured: cfg.isCustomConfigured,
        maskedApiKey: cfg.maskedApiKey,
      },
      health,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan pengaturan AI." },
      { status: 400 },
    );
  }
}
