import { NextResponse } from "next/server";
import { resolveActiveUser, UnauthorizedError } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const [documents, chunks] = await Promise.all([
      repo.listVaultDocuments(user.id),
      repo.listVaultChunks(user.id),
    ]);

    return NextResponse.json({ documents, chunks });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat Brain Vault." },
      { status: 500 },
    );
  }
}
