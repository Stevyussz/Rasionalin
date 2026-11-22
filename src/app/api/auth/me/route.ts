import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  resolveActiveUser,
  UnauthorizedError,
} from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const momentum = await repo.getOrInitMomentum(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        targetScore: user.targetScore,
        targetMajor: user.targetMajor,
        examDate: user.examDate,
        diagnosticCompleted: user.diagnosticCompleted,
        themePreference: user.themePreference,
      },
      momentum,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      const repo = getRepository();
      await clearSessionCookie(repo).catch(() => {});
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat profil pengguna." },
      { status: 500 },
    );
  }
}
