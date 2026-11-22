import { NextRequest, NextResponse } from "next/server";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import { getObjectStorage } from "@/infrastructure/storage/object-storage";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await context.params;
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const joined = key.join("/");
    if (!joined.startsWith(`vault/${user.id}/`)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const storage = getObjectStorage();
    const buf = await storage.getObjectBuffer(joined);
    const ext = joined.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "webp"
            ? "image/webp"
            : "application/octet-stream";

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  }
}
