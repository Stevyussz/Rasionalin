import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { getServerEnv } from "@/infrastructure/config/env";

export type SupportedMimeType = "application/pdf" | "image/png" | "image/jpeg" | "image/webp";

export function validateFileMagicBytes(buf: Buffer, declaredMime: SupportedMimeType): boolean {
  if (buf.length < 12) return false;
  if (declaredMime === "application/pdf") {
    return buf.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (declaredMime === "image/png") {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (declaredMime === "image/jpeg") {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (declaredMime === "image/webp") {
    return (
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export interface ObjectStoragePort {
  readonly driverName: "supabase_storage" | "local_fs";
  putObject(key: string, data: Buffer, contentType: string): Promise<void>;
  getObjectBuffer(key: string): Promise<Buffer>;
  getAccessUrl(key: string): Promise<string>;
}

class LocalFsStorageAdapter implements ObjectStoragePort {
  readonly driverName = "local_fs" as const;
  private readonly baseDir: string;

  constructor() {
    this.baseDir =
      process.env.VERCEL === "1" || process.env.NODE_ENV === "production"
        ? path.join(os.tmpdir(), "rasionalin-vault-files")
        : path.join(process.cwd(), ".data", "vault-files");
  }

  private resolveSafePath(key: string): string {
    const clean = key.replace(/^\/+/, "").replace(/\.\./g, "");
    return path.join(this.baseDir, clean);
  }

  async putObject(key: string, data: Buffer): Promise<void> {
    const target = this.resolveSafePath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const target = this.resolveSafePath(key);
    return fs.readFile(target);
  }

  async getAccessUrl(key: string): Promise<string> {
    const clean = key.replace(/^\/+/, "");
    return `/api/vault/files/${clean}`;
  }
}

class SupabaseStorageAdapter implements ObjectStoragePort {
  readonly driverName = "supabase_storage" as const;
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(url: string, serviceRoleKey: string, bucket: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.bucket = bucket;
  }

  async putObject(key: string, data: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).upload(key, data, {
      contentType,
      upsert: true,
    });
    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error || !data) {
      throw new Error(`Supabase Storage download failed: ${error?.message ?? "empty payload"}`);
    }
    const arrBuf = await data.arrayBuffer();
    return Buffer.from(arrBuf);
  }

  async getAccessUrl(key: string): Promise<string> {
    const { data, error } = await this.client.storage.from(this.bucket).createSignedUrl(key, 3600);
    if (error || !data?.signedUrl) {
      throw new Error(`Supabase signed URL error: ${error?.message ?? "missing URL"}`);
    }
    return data.signedUrl;
  }
}

let cachedStorage: ObjectStoragePort | null = null;

export function getObjectStorage(): ObjectStoragePort {
  if (cachedStorage) return cachedStorage;
  const env = getServerEnv();
  if (env.supabaseUrl && env.supabaseServiceRoleKey) {
    cachedStorage = new SupabaseStorageAdapter(
      env.supabaseUrl,
      env.supabaseServiceRoleKey,
      env.supabaseStorageBucket,
    );
  } else {
    cachedStorage = new LocalFsStorageAdapter();
  }
  return cachedStorage;
}

export async function cropDiagramFromPagePng(
  pagePng: Buffer,
  normalizedBox: [number, number, number, number],
  paddingPx = 12,
): Promise<Buffer | null> {
  const [x1Norm, y1Norm, x2Norm, y2Norm] = normalizedBox;
  if (x2Norm <= x1Norm || y2Norm <= y1Norm) return null;

  const meta = await sharp(pagePng).metadata();
  const imgW = meta.width ?? 0;
  const imgH = meta.height ?? 0;
  if (imgW < 20 || imgH < 20) return null;

  const left = Math.max(0, Math.floor((x1Norm / 1000) * imgW) - paddingPx);
  const top = Math.max(0, Math.floor((y1Norm / 1000) * imgH) - paddingPx);
  const right = Math.min(imgW, Math.ceil((x2Norm / 1000) * imgW) + paddingPx);
  const bottom = Math.min(imgH, Math.ceil((y2Norm / 1000) * imgH) + paddingPx);

  const width = right - left;
  const height = bottom - top;
  if (width < 12 || height < 12) return null;

  return sharp(pagePng).extract({ left, top, width, height }).png().toBuffer();
}
