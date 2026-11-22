import { NextRequest, NextResponse } from "next/server";
import { VaultService } from "@/application/vault-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const vault = new VaultService(repo);
    const result = await vault.batchApproveEligible(user.id, id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyetujui massal." },
      { status: 400 },
    );
  }
}
