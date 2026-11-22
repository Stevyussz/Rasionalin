import { NextResponse } from "next/server";
import { checkNineRouterHealth } from "@/infrastructure/ai/nine-router-client";
import { getEffectiveAiConfig } from "@/infrastructure/ai/runtime-config";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getServerEnv } from "@/infrastructure/config/env";
import { getRepository, getStorageModeLabel } from "@/infrastructure/db";
import { getObjectStorage } from "@/infrastructure/storage/object-storage";

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const env = getServerEnv();
    const aiCfg = getEffectiveAiConfig();
    const storage = getObjectStorage();

    const [ledger, routerHealth] = await Promise.all([
      repo.listAiRoutingLedger(user.id, 40),
      checkNineRouterHealth(),
    ]);

    const totalCostUsd = ledger.reduce((acc, e) => acc + e.estimatedCostUsd, 0);

    return NextResponse.json({
      ledger,
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      adapters: {
        dbDriver: getStorageModeLabel(),
        storageDriver: storage.driverName,
        sandboxDriver: env.mathSandboxDriver,
        nineRouter: routerHealth,
        modelAliases: aiCfg.models,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat status sistem." },
      { status: 500 },
    );
  }
}
