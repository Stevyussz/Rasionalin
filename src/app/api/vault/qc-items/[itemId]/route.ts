import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VaultService } from "@/application/vault-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const ReviewQcSchema = z.object({
  action: z.enum(["approved", "rejected"]),
  patch: z
    .object({
      stemMarkdown: z.string().min(1).optional(),
      stemLatex: z.string().nullable().optional(),
      methodLabel: z.string().max(120).nullable().optional(),
      validityConditions: z.string().max(240).nullable().optional(),
      subtestGuess: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]).optional(),
      correctAnswerKey: z.enum(["A", "B", "C", "D", "E"]).nullable().optional(),
    })
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await context.params;
    const body = ReviewQcSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const vault = new VaultService(repo);
    const result = await vault.reviewQcItem({
      userId: user.id,
      itemId,
      action: body.action,
      patch: body.patch,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pembaruan item QC gagal." },
      { status: 400 },
    );
  }
}
