import fs from "node:fs";
import path from "node:path";
import type { PoolConfig } from "pg";

/**
 * Loads variables from .env.local into process.env when running standalone CLI
 * scripts (tsx src/infrastructure/db/migrate.ts or seed.ts).
 */
export function loadLocalEnvIfNeeded(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

export function isRemotePostgresUrl(connectionString: string): boolean {
  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1" && host !== "::1";
  } catch {
    return connectionString.includes("supabase") || connectionString.includes("sslmode=require");
  }
}

export function buildPgPoolConfig(connectionString: string, max = 5): PoolConfig {
  const remote = isRemotePostgresUrl(connectionString);
  return {
    connectionString,
    max,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ...(remote ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}
