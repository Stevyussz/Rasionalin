import { getServerEnv } from "@/infrastructure/config/env";
import type { AppRepository } from "@/infrastructure/db/repository-port";
import { LocalJsonRepository } from "@/infrastructure/db/memory/local-repository";
import { getPgPool } from "@/infrastructure/db/postgres/client";
import { PostgresRepository } from "@/infrastructure/db/postgres/repository";

declare global {
  var __kejarsnbtRepo: AppRepository | undefined;
}

export function getRepository(): AppRepository {
  if (globalThis.__kejarsnbtRepo) return globalThis.__kejarsnbtRepo;

  const { databaseUrl } = getServerEnv();
  if (databaseUrl) {
    globalThis.__kejarsnbtRepo = new PostgresRepository(getPgPool());
  } else {
    globalThis.__kejarsnbtRepo = new LocalJsonRepository();
  }

  return globalThis.__kejarsnbtRepo;
}

export function getStorageModeLabel(): "postgresql_pgvector" | "local_json_fallback" {
  return getServerEnv().databaseUrl ? "postgresql_pgvector" : "local_json_fallback";
}
