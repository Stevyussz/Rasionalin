import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SnbtSubtest } from "@/domain/types";
import { getServerEnv } from "@/infrastructure/config/env";
import { getPgPool } from "@/infrastructure/db/postgres/client";

export type StartingLevel = "nol_total" | "dasar" | "menengah";
export type StudyPace = "santuy_dalam" | "seimbang" | "kejar_cepat";
export type ExplanationStyle =
  | "analogi_sehari_hari"
  | "step_by_step_pelan"
  | "ringkas_langsung";

export interface UserLearningPersona {
  nickname: string;
  startingLevel: StartingLevel;
  studyPace?: StudyPace;
  explanationStyle: ExplanationStyle;
  targetGoal: string;
  weakSubtests: SnbtSubtest[];
  personalContext: string;
}

export interface UserMemoryNote {
  id: string;
  kind: "memory" | "note";
  title: string;
  content: string;
  subtest: SnbtSubtest | null;
  pinnedForAi: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserMemoryBundle {
  userId: string;
  persona: UserLearningPersona;
  notes: UserMemoryNote[];
  updatedAt: string;
}

interface MemoryStoreFile {
  users: Record<string, UserMemoryBundle>;
}

function resolveMemoryFilePath(): string {
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "rasionalin-data", "user-memory.json");
  }
  return path.join(process.cwd(), ".data", "user-memory.json");
}

const MEMORY_CACHE_TTL_MS = 15_000;

declare global {
  var __rasionalinMemoryCache: Map<string, { value: UserMemoryBundle; expiresAt: number }> | undefined;
  var __rasionalinMemoryTableReady: Promise<void> | undefined;
}

function getBundleCache(): Map<string, { value: UserMemoryBundle; expiresAt: number }> {
  if (!globalThis.__rasionalinMemoryCache) {
    globalThis.__rasionalinMemoryCache = new Map();
  }
  return globalThis.__rasionalinMemoryCache;
}

function cacheBundle(bundle: UserMemoryBundle): void {
  getBundleCache().set(bundle.userId, {
    value: bundle,
    expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
  });
}

function getCachedBundle(userId: string): UserMemoryBundle | null {
  const entry = getBundleCache().get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.value;
}

function usePostgresMemory(): boolean {
  if (process.env.VITEST === "true") return false;
  return Boolean(getServerEnv().databaseUrl);
}

async function ensureMemoryTable(): Promise<void> {
  if (!usePostgresMemory()) return;
  if (!globalThis.__rasionalinMemoryTableReady) {
    const pool = getPgPool();
    globalThis.__rasionalinMemoryTableReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS user_memory_bundles (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          persona JSONB NOT NULL DEFAULT '{}'::jsonb,
          notes JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
      )
      .then(() => undefined)
      .catch((err) => {
        globalThis.__rasionalinMemoryTableReady = undefined;
        throw err;
      });
  }
  await globalThis.__rasionalinMemoryTableReady;
}

function createDefaultBundle(userId: string, fallbackName = ""): UserMemoryBundle {
  const now = new Date().toISOString();
  return {
    userId,
    persona: {
      nickname: fallbackName,
      startingLevel: "nol_total",
      studyPace: "seimbang",
      explanationStyle: "analogi_sehari_hari",
      targetGoal: "",
      weakSubtests: [],
      personalContext: "",
    },
    notes: [],
    updatedAt: now,
  };
}

function normalizeBundle(
  userId: string,
  rawPersona: Partial<UserLearningPersona> | null | undefined,
  rawNotes: UserMemoryNote[] | null | undefined,
  updatedAt: string | Date | undefined,
  fallbackName = "",
): UserMemoryBundle {
  const def = createDefaultBundle(userId, fallbackName);
  return {
    userId,
    persona: {
      nickname:
        typeof rawPersona?.nickname === "string" && rawPersona.nickname.trim()
          ? rawPersona.nickname
          : def.persona.nickname,
      startingLevel: rawPersona?.startingLevel ?? def.persona.startingLevel,
      studyPace: rawPersona?.studyPace ?? def.persona.studyPace,
      explanationStyle: rawPersona?.explanationStyle ?? def.persona.explanationStyle,
      targetGoal: typeof rawPersona?.targetGoal === "string" ? rawPersona.targetGoal : "",
      weakSubtests: Array.isArray(rawPersona?.weakSubtests) ? rawPersona.weakSubtests : [],
      personalContext:
        typeof rawPersona?.personalContext === "string" ? rawPersona.personalContext : "",
    },
    notes: Array.isArray(rawNotes) ? rawNotes : [],
    updatedAt:
      updatedAt instanceof Date
        ? updatedAt.toISOString()
        : typeof updatedAt === "string"
          ? updatedAt
          : def.updatedAt,
  };
}

function readStore(): MemoryStoreFile {
  const memPath = resolveMemoryFilePath();
  try {
    if (!fs.existsSync(memPath)) {
      return { users: {} };
    }
    const raw = fs.readFileSync(memPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<MemoryStoreFile>;
    if (!parsed || typeof parsed.users !== "object" || parsed.users === null) {
      return { users: {} };
    }
    return { users: parsed.users };
  } catch {
    return { users: {} };
  }
}

function writeStore(store: MemoryStoreFile): void {
  const memPath = resolveMemoryFilePath();
  try {
    const dir = path.dirname(memPath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${memPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), "utf-8");
    fs.renameSync(tmpPath, memPath);
  } catch {
    // Never crash on read-only serverless environments
  }
}

export function getUserMemoryBundle(userId: string, fallbackName?: string): UserMemoryBundle {
  const cached = getCachedBundle(userId);
  if (cached) return cached;

  const store = readStore();
  const existing = store.users[userId];
  if (existing && existing.persona && Array.isArray(existing.notes)) {
    const normalized = normalizeBundle(
      userId,
      existing.persona,
      existing.notes,
      existing.updatedAt,
      fallbackName,
    );
    cacheBundle(normalized);
    return normalized;
  }

  const fresh = createDefaultBundle(userId, fallbackName);
  store.users[userId] = fresh;
  writeStore(store);
  cacheBundle(fresh);
  return fresh;
}

export async function getUserMemoryBundleAsync(
  userId: string,
  fallbackName?: string,
): Promise<UserMemoryBundle> {
  const cached = getCachedBundle(userId);
  if (cached) return cached;

  if (usePostgresMemory()) {
    await ensureMemoryTable();
    const pool = getPgPool();
    const res = await pool.query<{
      persona: Partial<UserLearningPersona>;
      notes: UserMemoryNote[];
      updated_at: Date | string;
    }>(`SELECT persona, notes, updated_at FROM user_memory_bundles WHERE user_id = $1`, [userId]);

    if (res.rows[0]) {
      const normalized = normalizeBundle(
        userId,
        res.rows[0].persona,
        res.rows[0].notes,
        res.rows[0].updated_at,
        fallbackName,
      );
      cacheBundle(normalized);
      return normalized;
    }

    const fresh = createDefaultBundle(userId, fallbackName);
    cacheBundle(fresh);
    return fresh;
  }

  return getUserMemoryBundle(userId, fallbackName);
}

async function persistBundleAsync(bundle: UserMemoryBundle): Promise<void> {
  cacheBundle(bundle);
  const store = readStore();
  store.users[bundle.userId] = bundle;
  writeStore(store);

  if (usePostgresMemory()) {
    await ensureMemoryTable();
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO user_memory_bundles (user_id, persona, notes, updated_at)
       VALUES ($1, $2::jsonb, $3::jsonb, $4::timestamptz)
       ON CONFLICT (user_id) DO UPDATE SET
         persona = EXCLUDED.persona,
         notes = EXCLUDED.notes,
         updated_at = EXCLUDED.updated_at`,
      [
        bundle.userId,
        JSON.stringify(bundle.persona),
        JSON.stringify(bundle.notes),
        bundle.updatedAt,
      ],
    );
  }
}

export function updateUserPersona(
  userId: string,
  patch: Partial<UserLearningPersona>,
  fallbackName?: string,
): UserMemoryBundle {
  const store = readStore();
  const current =
    getCachedBundle(userId) ?? store.users[userId] ?? createDefaultBundle(userId, fallbackName);
  const next: UserMemoryBundle = {
    ...current,
    persona: {
      ...current.persona,
      ...patch,
      studyPace: patch.studyPace ?? current.persona.studyPace ?? "seimbang",
      weakSubtests: Array.isArray(patch.weakSubtests)
        ? patch.weakSubtests
        : current.persona.weakSubtests,
    },
    updatedAt: new Date().toISOString(),
  };
  store.users[userId] = next;
  writeStore(store);
  cacheBundle(next);
  return next;
}

export async function updateUserPersonaAsync(
  userId: string,
  patch: Partial<UserLearningPersona>,
  fallbackName?: string,
): Promise<UserMemoryBundle> {
  const current = await getUserMemoryBundleAsync(userId, fallbackName);
  const next: UserMemoryBundle = {
    ...current,
    persona: {
      ...current.persona,
      ...patch,
      studyPace: patch.studyPace ?? current.persona.studyPace ?? "seimbang",
      weakSubtests: Array.isArray(patch.weakSubtests)
        ? patch.weakSubtests
        : current.persona.weakSubtests,
    },
    updatedAt: new Date().toISOString(),
  };
  await persistBundleAsync(next);
  return next;
}

export function addUserMemoryNote(
  userId: string,
  input: {
    kind: "memory" | "note";
    title: string;
    content: string;
    subtest?: SnbtSubtest | null;
    pinnedForAi?: boolean;
  },
  fallbackName?: string,
): { bundle: UserMemoryBundle; created: UserMemoryNote } {
  const store = readStore();
  const current =
    getCachedBundle(userId) ?? store.users[userId] ?? createDefaultBundle(userId, fallbackName);
  const now = new Date().toISOString();
  const created: UserMemoryNote = {
    id: crypto.randomUUID(),
    kind: input.kind,
    title: input.title.trim().slice(0, 120),
    content: input.content.trim().slice(0, 2000),
    subtest: input.subtest ?? null,
    pinnedForAi: input.pinnedForAi ?? true,
    createdAt: now,
    updatedAt: now,
  };
  const next: UserMemoryBundle = {
    ...current,
    notes: [created, ...current.notes].slice(0, 100),
    updatedAt: now,
  };
  store.users[userId] = next;
  writeStore(store);
  cacheBundle(next);
  return { bundle: next, created };
}

export async function addUserMemoryNoteAsync(
  userId: string,
  input: {
    kind: "memory" | "note";
    title: string;
    content: string;
    subtest?: SnbtSubtest | null;
    pinnedForAi?: boolean;
  },
  fallbackName?: string,
): Promise<{ bundle: UserMemoryBundle; created: UserMemoryNote }> {
  const current = await getUserMemoryBundleAsync(userId, fallbackName);
  const now = new Date().toISOString();
  const created: UserMemoryNote = {
    id: crypto.randomUUID(),
    kind: input.kind,
    title: input.title.trim().slice(0, 120),
    content: input.content.trim().slice(0, 2000),
    subtest: input.subtest ?? null,
    pinnedForAi: input.pinnedForAi ?? true,
    createdAt: now,
    updatedAt: now,
  };
  const next: UserMemoryBundle = {
    ...current,
    notes: [created, ...current.notes].slice(0, 100),
    updatedAt: now,
  };
  await persistBundleAsync(next);
  return { bundle: next, created };
}

export function updateUserMemoryNote(
  userId: string,
  noteId: string,
  patch: Partial<Pick<UserMemoryNote, "title" | "content" | "subtest" | "pinnedForAi" | "kind">>,
): UserMemoryBundle {
  const store = readStore();
  const current = getCachedBundle(userId) ?? store.users[userId] ?? createDefaultBundle(userId);
  const now = new Date().toISOString();
  const nextNotes = current.notes.map((n) =>
    n.id === noteId
      ? {
          ...n,
          ...patch,
          title: patch.title !== undefined ? patch.title.trim().slice(0, 120) : n.title,
          content: patch.content !== undefined ? patch.content.trim().slice(0, 2000) : n.content,
          updatedAt: now,
        }
      : n,
  );
  const next: UserMemoryBundle = {
    ...current,
    notes: nextNotes,
    updatedAt: now,
  };
  store.users[userId] = next;
  writeStore(store);
  cacheBundle(next);
  return next;
}

export async function updateUserMemoryNoteAsync(
  userId: string,
  noteId: string,
  patch: Partial<Pick<UserMemoryNote, "title" | "content" | "subtest" | "pinnedForAi" | "kind">>,
): Promise<UserMemoryBundle> {
  const current = await getUserMemoryBundleAsync(userId);
  const now = new Date().toISOString();
  const nextNotes = current.notes.map((n) =>
    n.id === noteId
      ? {
          ...n,
          ...patch,
          title: patch.title !== undefined ? patch.title.trim().slice(0, 120) : n.title,
          content: patch.content !== undefined ? patch.content.trim().slice(0, 2000) : n.content,
          updatedAt: now,
        }
      : n,
  );
  const next: UserMemoryBundle = {
    ...current,
    notes: nextNotes,
    updatedAt: now,
  };
  await persistBundleAsync(next);
  return next;
}

export function deleteUserMemoryNote(userId: string, noteId: string): UserMemoryBundle {
  const store = readStore();
  const current = getCachedBundle(userId) ?? store.users[userId] ?? createDefaultBundle(userId);
  const next: UserMemoryBundle = {
    ...current,
    notes: current.notes.filter((n) => n.id !== noteId),
    updatedAt: new Date().toISOString(),
  };
  store.users[userId] = next;
  writeStore(store);
  cacheBundle(next);
  return next;
}

export async function deleteUserMemoryNoteAsync(
  userId: string,
  noteId: string,
): Promise<UserMemoryBundle> {
  const current = await getUserMemoryBundleAsync(userId);
  const next: UserMemoryBundle = {
    ...current,
    notes: current.notes.filter((n) => n.id !== noteId),
    updatedAt: new Date().toISOString(),
  };
  await persistBundleAsync(next);
  return next;
}

function levelLabel(level: StartingLevel): string {
  switch (level) {
    case "nol_total":
      return "Pemula dari nol (jelasin pelan dari konsep paling dasar, jangan lempar istilah ribet tanpa arti)";
    case "dasar":
      return "Paham dasar, masih butuh penguatan konsep inti dan ketelitian";
    case "menengah":
      return "Menengah, fokus ke pola cepat UTBK dan soal HOTS 800+";
  }
}

function paceLabel(pace?: StudyPace): string {
  switch (pace) {
    case "santuy_dalam":
      return "Santai Paham Dalam (sabar, banyak analogi sehari-hari, nggak usah buru-buru)";
    case "kejar_cepat":
      return "Kejar Cepat / Akselerasi (to the point ke pola paling sering keluar di UTBK, trik hemat waktu, dan latihan padat tanpa basa-basi panjang)";
    case "seimbang":
    default:
      return "Seimbang (paham alasannya dulu baru lanjut pola latihan yang pas)";
  }
}

function styleLabel(style: ExplanationStyle): string {
  switch (style) {
    case "analogi_sehari_hari":
      return "Pakai perumpamaan kejadian sehari-hari yang dekat banget sebelum masuk simbol/rumus";
    case "step_by_step_pelan":
      return "Pecah langkah per baris dengan sabar tanpa loncat hitungan kecil";
    case "ringkas_langsung":
      return "Singkat, jelas, langsung ke inti logika dan trik anti-kejebak";
  }
}

function formatStudentMemoryPromptBlock(
  bundle: UserMemoryBundle,
  activeSubtest?: SnbtSubtest | null,
  fallbackName?: string,
): { text: string; hasMemory: boolean; nickname: string } {
  const { persona, notes } = bundle;

  const pinned = notes
    .filter((n) => n.pinnedForAi)
    .sort((a, b) => {
      const aMatch = activeSubtest && a.subtest === activeSubtest ? 1 : 0;
      const bMatch = activeSubtest && b.subtest === activeSubtest ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, 8);

  const lines: string[] = [
    `<student_persona_and_memory>`,
    `Nama panggilan: ${persona.nickname || "Teman Belajar"}`,
    `Level awal: ${levelLabel(persona.startingLevel)}`,
    `Tempo belajar: ${paceLabel(persona.studyPace)}`,
    `Gaya penjelasan disukai: ${styleLabel(persona.explanationStyle)}`,
    `Target UTBK: ${persona.targetGoal || "Skor tinggi UTBK-SNBT"}`,
    `Subtes paling perlu dibantu: ${persona.weakSubtests.length > 0 ? persona.weakSubtests.join(", ") : "Semua subtes"}`,
    `Gaya bahasa WAJIB: pakai bahasa Indonesia yang natural, santai, hangat, dan gampang banget dicerna kayak mentor atau kakak tingkat yang asik ngobrol ("kamu/aku"). HINDARI kalimat kaku/baku ala buku teks atau surat resmi (misalnya: "merupakan", "oleh karena itu", "dapat disimpulkan", "mengidentifikasi", "melakukan transformasi", "besaran", "sebagai berikut"). Kalau menyebut istilah UTBK, langsung jelasin artinya pakai kata sehari-hari.`,
  ];

  if (persona.personalContext.trim()) {
    lines.push(`Catatan persona siswa: ${persona.personalContext.trim()}`);
  }

  if (pinned.length > 0) {
    lines.push(`Memori & catatan belajar penting siswa:`);
    for (const item of pinned) {
      const tag = item.kind === "memory" ? "MEMORI" : "CATATAN";
      const sub = item.subtest ? ` [${item.subtest}]` : "";
      lines.push(`- (${tag}${sub}) ${item.title}: ${item.content}`);
    }
  }

  lines.push(`</student_persona_and_memory>`);

  return {
    text: lines.join("\n"),
    hasMemory: Boolean(persona.personalContext.trim() || pinned.length > 0),
    nickname: persona.nickname || fallbackName || "Pejuang SNBT",
  };
}

export function buildStudentMemoryPromptBlock(
  userId: string,
  activeSubtest?: SnbtSubtest | null,
  fallbackName?: string,
): { text: string; hasMemory: boolean; nickname: string } {
  const bundle = getUserMemoryBundle(userId, fallbackName);
  return formatStudentMemoryPromptBlock(bundle, activeSubtest, fallbackName);
}

export async function buildStudentMemoryPromptBlockAsync(
  userId: string,
  activeSubtest?: SnbtSubtest | null,
  fallbackName?: string,
): Promise<{ text: string; hasMemory: boolean; nickname: string }> {
  const bundle = await getUserMemoryBundleAsync(userId, fallbackName);
  return formatStudentMemoryPromptBlock(bundle, activeSubtest, fallbackName);
}
