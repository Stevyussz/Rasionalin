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
    const poolMax = process.env.VERCEL === "1" ? 3 : 5;
    const pool = new Pool(buildPgPoolConfig(databaseUrl, poolMax, { preferTransactionPooler: true }));
    pool.on("error", () => {});
    globalThis.__kejarsnbtPgPool = pool;
  }

  return globalThis.__kejarsnbtPgPool;
}
