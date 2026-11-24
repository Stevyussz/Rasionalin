import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { SnbtSubtest } from "@/domain/types";

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

const MEMORY_PATH = path.join(process.cwd(), ".data", "user-memory.json");

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

function readStore(): MemoryStoreFile {
  try {
    if (!fs.existsSync(MEMORY_PATH)) {
      return { users: {} };
    }
    const raw = fs.readFileSync(MEMORY_PATH, "utf-8");
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
  const dir = path.dirname(MEMORY_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${MEMORY_PATH}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), "utf-8");
  fs.renameSync(tmpPath, MEMORY_PATH);
}

export function getUserMemoryBundle(userId: string, fallbackName?: string): UserMemoryBundle {
  const store = readStore();
  const existing = store.users[userId];
  if (existing && existing.persona && Array.isArray(existing.notes)) {
    return {
      ...existing,
      persona: {
        ...existing.persona,
        studyPace: existing.persona.studyPace ?? "seimbang",
      },
    };
  }
  const fresh = createDefaultBundle(userId, fallbackName);
  store.users[userId] = fresh;
  try {
    writeStore(store);
  } catch {
    // Return in-memory default if disk is temporarily read-only
  }
  return fresh;
}

export function updateUserPersona(
  userId: string,
  patch: Partial<UserLearningPersona>,
  fallbackName?: string,
): UserMemoryBundle {
  const store = readStore();
  const current = store.users[userId] ?? createDefaultBundle(userId, fallbackName);
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
  const current = store.users[userId] ?? createDefaultBundle(userId, fallbackName);
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
  return { bundle: next, created };
}

export function updateUserMemoryNote(
  userId: string,
  noteId: string,
  patch: Partial<Pick<UserMemoryNote, "title" | "content" | "subtest" | "pinnedForAi" | "kind">>,
): UserMemoryBundle {
  const store = readStore();
  const current = store.users[userId] ?? createDefaultBundle(userId);
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
  return next;
}

export function deleteUserMemoryNote(userId: string, noteId: string): UserMemoryBundle {
  const store = readStore();
  const current = store.users[userId] ?? createDefaultBundle(userId);
  const next: UserMemoryBundle = {
    ...current,
    notes: current.notes.filter((n) => n.id !== noteId),
    updatedAt: new Date().toISOString(),
  };
  store.users[userId] = next;
  writeStore(store);
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

export function buildStudentMemoryPromptBlock(
  userId: string,
  activeSubtest?: SnbtSubtest | null,
  fallbackName?: string,
): { text: string; hasMemory: boolean; nickname: string } {
  const bundle = getUserMemoryBundle(userId, fallbackName);
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
