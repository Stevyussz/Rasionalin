import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VaultService } from "@/application/vault-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export const maxDuration = 60;

const ExtractBatchSchema = z.object({
  pageNumbers: z.array(z.number().int().min(1)).min(1).max(3),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = ExtractBatchSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const vault = new VaultService(repo);
    const result = await vault.extractBatch({
      userId: user.id,
      documentId: id,
      pageNumbers: body.pageNumbers,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ekstraksi batch gagal." },
      { status: 400 },
    );
  }
}
