import { NextRequest, NextResponse } from "next/server";
import { VaultService } from "@/application/vault-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import type { SupportedMimeType } from "@/infrastructure/storage/object-storage";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const formData = await req.formData();
    const file = formData.get("file");
    const pageNumberRaw = formData.get("pageNumber");
    const pageNumber = Number(pageNumberRaw ?? "1");

    if (!(file instanceof File) || !Number.isInteger(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: "Halaman atau file gambar tidak valid." }, { status: 400 });
    }

    const mime = (file.type || "image/png") as SupportedMimeType;
    if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) {
      return NextResponse.json({ error: "Format gambar halaman harus PNG, JPEG, atau WebP." }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const vault = new VaultService(repo);
    const page = await vault.storePagePng({
      userId: user.id,
      documentId: id,
      pageNumber,
      buffer: Buffer.from(arrayBuf),
      declaredMime: mime,
    });

    return NextResponse.json({ ok: true, page });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan halaman raster." },
      { status: 400 },
    );
  }
}
