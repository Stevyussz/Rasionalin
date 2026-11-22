import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionCookieForUser, hashPassword } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const RegisterSchema = z
  .object({
    email: z.string().trim().email("Format email tidak valid."),
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter.")
      .max(40, "Username maksimal 40 karakter.")
      .optional(),
    displayName: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter.")
      .max(40, "Username maksimal 40 karakter.")
      .optional(),
    password: z.string().min(6, "Kata sandi minimal 6 karakter.").max(120),
    targetScore: z.number().int().min(200).max(1000).optional(),
  })
  .refine((data) => Boolean(data.username || data.displayName), {
    message: "Username wajib diisi.",
  });

export async function POST(req: NextRequest) {
  try {
    const body = RegisterSchema.parse(await req.json());
    const username = (body.username || body.displayName || "").trim();
    const email = body.email.trim().toLowerCase();
    const repo = getRepository();

    const existingEmail = await repo.findUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json({ error: "Email sudah terdaftar. Silakan masuk." }, { status: 409 });
    }

    const existingUsername = await repo.findUserByIdentifier(username);
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username sudah digunakan. Pilih username lain." },
        { status: 409 },
      );
    }

    const user = await repo.createUser({
      email,
      passwordHash: hashPassword(body.password),
      displayName: username,
      targetScore: body.targetScore ?? 800,
    });

    await createSessionCookieForUser(repo, user.id, {
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          targetScore: user.targetScore,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Data pendaftaran tidak valid." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registrasi gagal." },
      { status: 400 },
    );
  }
}
