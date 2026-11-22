import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionCookieForUser, verifyPassword } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const LoginSchema = z
  .object({
    identifier: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().min(2).max(120).optional(),
    password: z.string().min(6),
  })
  .refine((data) => Boolean(data.identifier || data.email), {
    message: "Masukkan email atau username kamu.",
  });

export async function POST(req: NextRequest) {
  try {
    const body = LoginSchema.parse(await req.json());
    const identifier = (body.identifier || body.email || "").trim();
    const repo = getRepository();
    const user = await repo.findUserByIdentifier(identifier);

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Email/username atau kata sandi tidak cocok." },
        { status: 401 },
      );
    }

    await createSessionCookieForUser(repo, user.id, {
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        targetScore: user.targetScore,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Permintaan login tidak valid." },
      { status: 400 },
    );
  }
}
