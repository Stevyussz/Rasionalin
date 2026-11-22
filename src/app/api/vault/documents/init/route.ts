import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VaultService } from "@/application/vault-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const InitVaultSchema = z.object({
  title: z.string().min(1).max(180),
  docType: z.enum(["bank_soal_pdf", "tryout_archive", "cheat_sheet", "rumus_cepat", "screenshot"]),
  originalFilename: z.string().min(1).max(255),
  mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
  fileSizeBytes: z.number().int().positive(),
  sha256Hash: z.string().length(64),
  pageCount: z.number().int().min(1).max(80),
  subtestHint: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = InitVaultSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const vault = new VaultService(repo);
    const result = await vault.initUpload({
      userId: user.id,
      title: body.title,
      docType: body.docType,
      originalFilename: body.originalFilename,
      mimeType: body.mimeType,
      fileSizeBytes: body.fileSizeBytes,
      sha256Hash: body.sha256Hash,
      pageCount: body.pageCount,
      subtestHint: body.subtestHint ?? null,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Inisialisasi unggahan gagal." },
      { status: 400 },
    );
  }
}
