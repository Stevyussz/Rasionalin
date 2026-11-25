import { Pool } from "pg";
import { getServerEnv } from "@/infrastructure/config/env";
import { buildPgPoolConfig } from "@/infrastructure/db/postgres/env-loader";

declare global {
  var __kejarsnbtPgPool: Pool | undefined;
}

export function getPgPool(): Pool {
  const { databaseUrl } = getServerEnv();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.__kejarsnbtPgPool) {
    globalThis.__kejarsnbtPgPool = new Pool(buildPgPoolConfig(databaseUrl, 10));
  }

  return globalThis.__kejarsnbtPgPool;
}
