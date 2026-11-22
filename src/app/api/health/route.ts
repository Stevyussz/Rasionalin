import { NextResponse } from "next/server";
import { checkNineRouterHealth } from "@/infrastructure/ai/nine-router-client";
import { resolveOptionalUser } from "@/infrastructure/auth/session";
import { getServerEnv } from "@/infrastructure/config/env";
import { getRepository, getStorageModeLabel } from "@/infrastructure/db";
import { getObjectStorage } from "@/infrastructure/storage/object-storage";

export async function GET() {
  try {
    const env = getServerEnv();
    const repo = getRepository();
    const [activeUser, router] = await Promise.all([
      resolveOptionalUser(repo).catch(() => null),
      checkNineRouterHealth(),
    ]);
    const storage = getObjectStorage();

    return NextResponse.json({
      ok: true,
      dbDriver: getStorageModeLabel(),
      storageDriver: storage.driverName,
      sandboxDriver: env.mathSandboxDriver,
      nineRouter: router,
      authenticated: Boolean(activeUser),
      activeProfile: activeUser
        ? {
            id: activeUser.id,
            displayName: activeUser.displayName,
            targetScore: activeUser.targetScore,
          }
        : null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Health check gagal." },
      { status: 500 },
    );
  }
}
