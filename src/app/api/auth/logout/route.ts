import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function POST() {
  const repo = getRepository();
  await clearSessionCookie(repo);
  return NextResponse.json({ ok: true });
}
