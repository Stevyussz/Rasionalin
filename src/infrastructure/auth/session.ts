import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { UserEntity } from "@/domain/types";
import { getServerEnv } from "@/infrastructure/config/env";
import type { AppRepository } from "@/infrastructure/db/repository-port";

export const SESSION_COOKIE_NAME = "kejarsnbt_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Sesi tidak ditemukan atau sudah berakhir. Silakan masuk kembali.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function hashToken(token: string): string {
  const { sessionSecret } = getServerEnv();
  return crypto.createHmac("sha256", sessionSecret).update(token).digest("hex");
}

export async function createSessionCookieForUser(
  repo: AppRepository,
  userId: string,
  meta?: { userAgent?: string | null; ip?: string | null },
): Promise<{ rawToken: string; expiresAt: string }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await repo.createSession({
    userId,
    tokenHash,
    expiresAt,
    userAgent: meta?.userAgent?.slice(0, 250) ?? null,
    ipHash: meta?.ip ? crypto.createHash("sha256").update(meta.ip).digest("hex") : null,
  });

  const cookieStore = await cookies();
  const isHttps =
    process.env.VERCEL === "1" ||
    (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    expires: new Date(expiresAt),
  });

  return { rawToken, expiresAt };
}

export async function clearSessionCookie(repo: AppRepository): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    await repo.deleteSessionByTokenHash(hashToken(rawToken)).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function resolveOptionalUser(repo: AppRepository): Promise<UserEntity | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const found = await repo.findSessionByTokenHash(hashToken(rawToken));
  if (found && new Date(found.session.expiresAt).getTime() > Date.now()) {
    return found.user;
  }
  return null;
}

export async function resolveActiveUser(repo: AppRepository): Promise<UserEntity> {
  const user = await resolveOptionalUser(repo);
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
