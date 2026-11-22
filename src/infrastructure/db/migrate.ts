import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { buildPgPoolConfig, loadLocalEnvIfNeeded } from "@/infrastructure/db/postgres/env-loader";

async function main() {
  loadLocalEnvIfNeeded();

  const conn = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!conn) {
    console.error("Error: Set DIRECT_URL or DATABASE_URL in .env.local before running db:migrate.");
    process.exit(1);
  }

  const schemaPath = path.join(process.cwd(), "docs", "phase-a", "02-schema.sql");
  const ddl = await fs.readFile(schemaPath, "utf8");

  const pool = new Pool(buildPgPoolConfig(conn, 2));
  const client = await pool.connect();
  try {
    const check = await client.query<{ exists: string | null }>(
      `SELECT to_regclass('public.users') AS exists`,
    );
    if (check.rows[0]?.exists) {
      console.log("Schema public.users already exists in PostgreSQL. Skipping initial DDL apply.");
      return;
    }

    console.log("Applying docs/phase-a/02-schema.sql to PostgreSQL...");
    await client.query("BEGIN");
    await client.query(ddl);
    await client.query("COMMIT");
    console.log("Migration completed cleanly.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
