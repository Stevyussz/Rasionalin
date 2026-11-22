import { NextRequest, NextResponse } from "next/server";
import { VaultService } from "@/application/vault-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const vault = new VaultService(repo);
    const queue = await vault.getQcQueue(user.id, id);
    return NextResponse.json(queue);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat antrean QC." },
      { status: 404 },
    );
  }
}
