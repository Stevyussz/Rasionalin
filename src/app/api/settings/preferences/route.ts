import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const PreferencesSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  targetScore: z.number().int().min(200).max(1000).optional(),
  targetMajor: z.string().max(120).nullable().optional(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  themePreference: z.enum(["light", "dark", "system"]).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = PreferencesSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const updated = await repo.updateUserProfile(user.id, body);

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        targetScore: updated.targetScore,
        targetMajor: updated.targetMajor,
        examDate: updated.examDate,
        themePreference: updated.themePreference,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pembaruan preferensi gagal." },
      { status: 400 },
    );
  }
}
