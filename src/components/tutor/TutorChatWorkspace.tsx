"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AtTagIcon,
  AttachIcon,
  BrainIcon,
  CheckIcon,
  CloseIcon,
  HintIcon,
  ImageIcon,
  MemoryIcon,
  ResetIcon,
  SendIcon,
  UploadIcon,
  VaultIcon,
} from "@/components/icons/ArchitecturalIcons";
import { AppShell } from "@/components/layout/AppShell";
import { MathText } from "@/components/math/MathText";
import { TutorMemoryDrawer } from "@/components/tutor/TutorMemoryDrawer";
import type { SnbtSubtest } from "@/domain/types";
import type {
  UserLearningPersona,
  UserMemoryNote,
} from "@/infrastructure/memory/user-memory-store";

interface TutorReplyPayload {
  whyFirstMarkdown: string;
  stepByStepMarkdown: string;
  activeRecallCheck: string;
  suggestedFollowups: string[];
  groundedInVault: boolean;
  citedChunks: Array<{ id: string; methodLabel: string | null; subtest: string | null }>;
  sourceMode: "9router" | "deterministic_fallback";
  modelUsed: string | null;
  latencyMs: number;
  memoryApplied?: boolean;
  appliedTagsCount?: number;
}

type PendingAttachment =
  | {
      id: string;
      kind: "image";
      name: string;
      mimeType: "image/png" | "image/jpeg" | "image/webp";
      dataUrl: string;
    }
  | {
      id: string;
      kind: "file";
      name: string;
      mimeType: string;
      textContent: string;
    };

interface ContextTagItem {
  type: "skill_node" | "subtest" | "memory_note" | "vault_chunk" | "mistake";
  id: string;
  label: string;
  subtest?: string | null;
}

interface TagCatalogPayload {
  skillNodes: Array<{ id: string; subtest: string; title: string }>;
  vaultChunks: Array<{ id: string; subtest: string | null; title: string }>;
  mistakes: Array<{ id: string; subtest: string | null; title: string }>;
}

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  plainText: string;
  attachments?: PendingAttachment[];
  contextTags?: ContextTagItem[];
  structured?: TutorReplyPayload;
  savedToMemory?: boolean;
}

const STARTER_PROMPTS = [
  "Kenapa pecahan harus disamakan penyebutnya dulu sebelum dijumlah?",
  "Jelaskan pindah ruas aljabar pakai analogi sehari-hari dari nol.",
  "Apa bedanya perbandingan senilai dan berbalik nilai pada soal pekerja?",
  "Cara membedakan simpulan valid vs jebakan di Literasi Bahasa Indonesia.",
];

const SUBTESTS: Array<{ value: "" | SnbtSubtest; label: string }> = [
  { value: "", label: "Semua Subtes" },
  { value: "PK", label: "PK · Kuantitatif" },
  { value: "PU", label: "PU · Penalaran Umum" },
  { value: "PM", label: "PM · Penalaran Mat." },
  { value: "LBI", label: "LBI · Literasi Indo" },
  { value: "LBE", label: "LBE · Literasi Inggris" },
  { value: "PBM", label: "PBM · Bacaan & Menulis" },
  { value: "PPU", label: "PPU · Pemahaman Umum" },
];

const DEFAULT_PERSONA: UserLearningPersona = {
  nickname: "Pejuang SNBT",
  startingLevel: "nol_total",
  explanationStyle: "analogi_sehari_hari",
  targetGoal: "Target skor 800+ UTBK-SNBT",
  weakSubtests: ["PK", "PM"],
  personalContext: "",
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 250 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
    reader.readAsText(file);
  });
}

export function TutorChatWorkspace() {
  const [subtest, setSubtest] = useState<"" | SnbtSubtest>("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routerStatus, setRouterStatus] = useState<{ reachable: boolean; modelsCount: number } | null>(null);

  // Drag-drop & attachments
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // @tag Context Picker
  const [contextTags, setContextTags] = useState<ContextTagItem[]>([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [tagCatalog, setTagCatalog] = useState<TagCatalogPayload>({
    skillNodes: [],
    vaultChunks: [],
    mistakes: [],
  });

  // AI Persona, Memory & Learning Notes
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);
  const [persona, setPersona] = useState<UserLearningPersona>(DEFAULT_PERSONA);
  const [memoryNotes, setMemoryNotes] = useState<UserMemoryNote[]>([]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { nineRouter?: { reachable: boolean; modelsCount: number } } | null) => {
        if (json?.nineRouter) setRouterStatus(json.nineRouter);
      })
      .catch(() => {});

    fetch("/api/tutor/memory?includeContext=1")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          json: {
            persona?: UserLearningPersona;
            notes?: UserMemoryNote[];
            tagCatalog?: TagCatalogPayload;
          } | null,
        ) => {
          if (!json) return;
          if (json.persona) setPersona(json.persona);
          if (Array.isArray(json.notes)) setMemoryNotes(json.notes);
          if (json.tagCatalog) setTagCatalog(json.tagCatalog);
        },
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const activeMemoryCount = useMemo(
    () => memoryNotes.filter((n) => n.pinnedForAi).length,
    [memoryNotes],
  );

  const filteredTagOptions = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    const match = (label: string, extra?: string | null) =>
      !q || label.toLowerCase().includes(q) || (extra ?? "").toLowerCase().includes(q);

    return {
      notes: memoryNotes
        .filter((n) => match(n.title, n.subtest))
        .slice(0, 6)
        .map<ContextTagItem>((n) => ({
          type: "memory_note",
          id: n.id,
          label: n.title,
          subtest: n.subtest,
        })),
      nodes: tagCatalog.skillNodes
        .filter((n) => match(n.title, n.subtest))
        .slice(0, 8)
        .map<ContextTagItem>((n) => ({
          type: "skill_node",
          id: n.id,
          label: n.title,
          subtest: n.subtest,
        })),
      vault: tagCatalog.vaultChunks
        .filter((c) => match(c.title, c.subtest))
        .slice(0, 6)
        .map<ContextTagItem>((c) => ({
          type: "vault_chunk",
          id: c.id,
          label: c.title,
          subtest: c.subtest,
        })),
      mistakes: tagCatalog.mistakes
        .filter((m) => match(m.title, m.subtest))
        .slice(0, 6)
        .map<ContextTagItem>((m) => ({
          type: "mistake",
          id: m.id,
          label: m.title,
          subtest: m.subtest,
        })),
      subtests: SUBTESTS.filter((s) => s.value !== "" && match(s.label, s.value)).map<ContextTagItem>(
        (s) => ({
          type: "subtest",
          id: s.value,
          label: s.label,
          subtest: s.value,
        }),
      ),
    };
  }, [tagSearch, memoryNotes, tagCatalog]);

  const addContextTag = useCallback((tag: ContextTagItem) => {
    setContextTags((prev) => {
      if (prev.some((t) => t.type === tag.type && t.id === tag.id)) return prev;
      return [...prev, tag].slice(0, 8);
    });
    setTagPickerOpen(false);
    setTagSearch("");
    textareaRef.current?.focus();
  }, []);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setError(null);

    const added: PendingAttachment[] = [];
    for (const file of files) {
      if (attachments.length + added.length >= 4) {
        setError("Maksimal 4 lampiran sekaligus per pertanyaan.");
        break;
      }

      if (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp") {
        if (file.size > MAX_IMAGE_BYTES) {
          setError(`Gambar "${file.name}" terlalu besar (maks 4 MB).`);
          continue;
        }
        const dataUrl = await readAsDataUrl(file);
        added.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          kind: "image",
          name: file.name || "screenshot.png",
          mimeType: file.type,
          dataUrl,
        });
      } else if (
        file.type.startsWith("text/") ||
        /\.(txt|md|csv|json|tex|js|ts|py|html)$/i.test(file.name)
      ) {
        if (file.size > MAX_TEXT_FILE_BYTES) {
          setError(`File teks "${file.name}" terlalu besar (maks 250 KB).`);
          continue;
        }
        const textContent = await readAsText(file);
        if (!textContent.trim()) continue;
        added.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          kind: "file",
          name: file.name,
          mimeType: file.type || "text/plain",
          textContent: textContent.slice(0, 14_000),
        });
      } else {
        setError(
          `Format "${file.name}" belum didukung langsung di chat. Gunakan gambar (PNG/JPG/WEBP) atau file teks (.txt/.md/.json/.csv), atau unggah PDF di menu Catatan.`,
        );
      }
    }

    if (added.length > 0) {
      setAttachments((prev) => [...prev, ...added].slice(0, 4));
    }
  }, [attachments.length]);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await processFiles(files);
    }
  }

  async function sendQuestion(questionText: string) {
    const trimmed = questionText.trim();
    if ((!trimmed && attachments.length === 0) || sending) return;

    setError(null);
    setTagPickerOpen(false);

    const activeAttachments = [...attachments];
    const activeTags = [...contextTags];

    const userMsg: ChatMessageItem = {
      id: `u-${Date.now()}`,
      role: "user",
      plainText: trimmed || "Analisis lampiran ini dari nol.",
      attachments: activeAttachments.length > 0 ? activeAttachments : undefined,
      contextTags: activeTags.length > 0 ? activeTags : undefined,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setAttachments([]);
    setSending(true);

    try {
      const res = await fetch("/api/tutor/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          subtest: subtest || null,
          history: nextHistory.slice(-8).map((m) => ({
            role: m.role,
            content: m.plainText,
          })),
          attachments: activeAttachments.map((a) =>
            a.kind === "image"
              ? { kind: "image", name: a.name, mimeType: a.mimeType, dataUrl: a.dataUrl }
              : { kind: "file", name: a.name, mimeType: a.mimeType, textContent: a.textContent },
          ),
          contextTags: activeTags.map((t) => ({
            type: t.type,
            id: t.id,
            label: t.label,
          })),
        }),
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error || "Gagal mendapatkan jawaban dari Tutor AI.");
      }
      const data = (await res.json()) as TutorReplyPayload;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          plainText: `${data.whyFirstMarkdown}\n\n${data.stepByStepMarkdown}`,
          structured: data,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghubungi Tutor AI.");
    } finally {
      setSending(false);
    }
  }

  async function saveReplyToMemory(msg: ChatMessageItem) {
    if (!msg.structured || msg.savedToMemory) return;
    const summaryTitle = msg.structured.whyFirstMarkdown
      .replace(/[#*$\\]/g, "")
      .trim()
      .slice(0, 64);
    try {
      const res = await fetch("/api/tutor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "note",
          title: summaryTitle || "Catatan dari Tanya AI",
          content: `${msg.structured.whyFirstMarkdown}\n\nLangkah:\n${msg.structured.stepByStepMarkdown}`.slice(
            0,
            1900,
          ),
          subtest: subtest || null,
          pinnedForAi: true,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        bundle: { persona: UserLearningPersona; notes: UserMemoryNote[] };
      };
      setMemoryNotes(data.bundle.notes);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, savedToMemory: true } : m)),
      );
    } catch {
      // Ignore transient save error
    }
  }

  function handleInputChange(val: string) {
    setInput(val);
    if (val === "@" || val.endsWith(" @")) {
      setTagPickerOpen(true);
      setTagSearch("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendQuestion(input);
    } else if (e.key === "Escape" && tagPickerOpen) {
      setTagPickerOpen(false);
    }
  }

  return (
    <AppShell fullBleed>
      <div
        className="relative flex-1 flex flex-col min-h-0 bg-[var(--surface-canvas)]"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Full-Area Drag & Drop Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-30 bg-[var(--accent-tint)]/95 border-2 border-dashed border-[var(--accent-primary)] flex flex-col items-center justify-center gap-2 pointer-events-none">
            <UploadIcon size={40} className="text-[var(--accent-primary)]" />
            <p className="text-lg font-bold text-[var(--accent-text-on-secondary)]">
              Lepas gambar soal atau file catatan di sini
            </p>
            <p className="text-xs font-semibold text-[var(--ink-secondary)]">
              Mendukung PNG, JPG, WEBP, TXT, MD, CSV, dan JSON
            </p>
          </div>
        )}

        {/* Ultra-Clean Slim Top Bar (No Bloat, No Pill Soup) */}
        <header className="h-13 shrink-0 px-4 sm:px-6 border-b border-[var(--border-structural)] bg-[var(--surface-elevated)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-base font-bold truncate">Tanya AI</h1>
            {routerStatus && (
              <span
                title={
                  routerStatus.reachable
                    ? `AI Gateway Live terhubung (${routerStatus.modelsCount} model aktif)`
                    : "Mode Panduan Lokal · Hubungkan Gemini/OpenAI/9router di Profil -> Pengaturan AI"
                }
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink-muted)] shrink-0"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    routerStatus.reachable ? "bg-[var(--accent-primary)]" : "bg-[var(--ochre-fill)]"
                  }`}
                />
                <span className="hidden sm:inline">
                  {routerStatus.reachable ? "Live" : "Lokal"}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              aria-label="Filter subtes"
              value={subtest}
              onChange={(e) => setSubtest(e.target.value as "" | SnbtSubtest)}
              className="bg-transparent text-xs font-extrabold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border-b border-[var(--border-structural)] py-1 pr-1 focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
            >
              {SUBTESTS.map((s) => (
                <option key={s.value || "all"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setMemoryDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--ink-primary)] hover:text-[var(--accent-text-on-secondary)] px-2 py-1.5 rounded-lg hover:bg-[var(--surface-secondary)] cursor-pointer transition-colors"
            >
              <MemoryIcon size={16} className="text-[var(--accent-primary)]" />
              <span>Memori & Catatan</span>
              <span className="font-num text-[11px] text-[var(--ink-muted)]">
                ({activeMemoryCount})
              </span>
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                title="Mulai percakapan baru"
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] px-2 py-1.5 rounded-lg hover:bg-[var(--surface-secondary)] cursor-pointer"
              >
                <ResetIcon size={14} />
                <span className="hidden sm:inline">Baru</span>
              </button>
            )}
          </div>
        </header>

        {/* Full-Height Open Chat Canvas */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-[820px] mx-auto min-h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="my-auto py-8 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                    Halo {persona.nickname || "Teman Belajar"}, mau bahas apa?
                  </h2>
                  <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                    Tanya langsung, seret gambar soal atau file ke layar ini, atau ketik{" "}
                    <span className="font-bold text-[var(--accent-text-on-secondary)]">@</span>{" "}
                    untuk menandai materi dan catatanmu.
                  </p>
                </div>

                {/* Clean Flat Hairline Starter Rows (Zero Pill / Box Soup) */}
                <div className="divide-y divide-[var(--border-structural)] border-y border-[var(--border-structural)]">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendQuestion(prompt)}
                      className="w-full text-left py-3.5 px-1 hover:pl-2 text-sm font-bold text-[var(--ink-primary)] hover:text-[var(--accent-text-on-secondary)] transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <span>{prompt}</span>
                      <span className="text-xs text-[var(--ink-muted)] shrink-0">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-7 pb-4">
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] space-y-2">
                        {msg.contextTags && msg.contextTags.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-[11px] font-extrabold text-[var(--olive-ink)]">
                            {msg.contextTags.map((t) => (
                              <span key={`${t.type}-${t.id}`}>@{t.label}</span>
                            ))}
                          </div>
                        )}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-2">
                            {msg.attachments.map((att) =>
                              att.kind === "image" ? (
                                <img
                                  key={att.id}
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="max-h-40 rounded-lg border border-[var(--border-structural)] object-contain bg-[var(--surface-elevated)]"
                                />
                              ) : (
                                <div
                                  key={att.id}
                                  className="px-2.5 py-1.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-structural)] text-xs font-bold text-[var(--ink-primary)]"
                                >
                                  {att.name}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                        <div className="px-4 py-3 rounded-xl bg-[var(--olive-fill)] text-white text-sm font-bold leading-relaxed whitespace-pre-wrap">
                          {msg.plainText}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <article
                      key={msg.id}
                      className="space-y-4 border-l-2 border-[var(--accent-primary)] pl-4 sm:pl-5 py-0.5"
                    >
                      {msg.structured ? (
                        <>
                          <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                              <HintIcon size={15} />
                              <span>Kenapa ini bekerja</span>
                            </div>
                            <div className="text-sm sm:text-[15px] leading-relaxed font-semibold text-[var(--ink-primary)]">
                              <MathText text={msg.structured.whyFirstMarkdown} />
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-3 border-t border-[var(--border-structural)]">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                              Langkah demi langkah
                            </div>
                            <div className="text-sm sm:text-[15px] leading-relaxed font-semibold text-[var(--ink-primary)]">
                              <MathText text={msg.structured.stepByStepMarkdown} />
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[var(--border-structural)] space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                              <BrainIcon size={15} />
                              <span>Cek ingatan aktif</span>
                            </div>
                            <div className="text-sm font-bold text-[var(--ink-primary)]">
                              <MathText text={msg.structured.activeRecallCheck} />
                            </div>
                          </div>

                          {/* Flat Meta & Actions Bar (No Pill Buttons) */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-3 text-[var(--ink-muted)] font-bold">
                              {msg.structured.memoryApplied && (
                                <span className="text-[var(--olive-ink)]">Persona aktif</span>
                              )}
                              {msg.structured.groundedInVault && (
                                <span className="inline-flex items-center gap-1 text-[var(--accent-text-on-secondary)]">
                                  <VaultIcon size={14} />
                                  Catatan pribadimu
                                </span>
                              )}
                              <span>
                                {msg.structured.sourceMode === "9router"
                                  ? msg.structured.modelUsed ?? "AI Live"
                                  : "Panduan Lokal"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => void saveReplyToMemory(msg)}
                              disabled={msg.savedToMemory}
                              className="inline-flex items-center gap-1 font-extrabold text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer disabled:opacity-60"
                            >
                              {msg.savedToMemory ? (
                                <>
                                  <CheckIcon size={14} />
                                  <span>Tersimpan di Catatan</span>
                                </>
                              ) : (
                                <>
                                  <MemoryIcon size={14} />
                                  <span>Simpan ke Catatan AI</span>
                                </>
                              )}
                            </button>
                          </div>

                          {msg.structured.suggestedFollowups.length > 0 && (
                            <div className="pt-2 border-t border-[var(--border-structural)] space-y-1">
                              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                                Lanjut bahas
                              </div>
                              <div className="flex flex-col items-start gap-1">
                                {msg.structured.suggestedFollowups.map((q) => (
                                  <button
                                    key={q}
                                    type="button"
                                    disabled={sending}
                                    onClick={() => void sendQuestion(q)}
                                    className="text-left text-xs font-bold text-[var(--ink-secondary)] hover:text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer"
                                  >
                                    → {q}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <MathText text={msg.plainText} className="text-sm" />
                      )}
                    </article>
                  ),
                )}

                {sending && (
                  <div className="text-xs font-extrabold text-[var(--accent-text-on-secondary)] animate-pulse pl-4">
                    Tutor AI sedang menyiapkan penjelasan sesuai personamu...
                  </div>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Clean Bottom Composer with Drag-Drop Attachments & @Tag Context Picker */}
        <div className="shrink-0 border-t border-[var(--border-structural)] bg-[var(--surface-elevated)] px-4 sm:px-6 py-3">
          <div className="max-w-[820px] mx-auto relative space-y-2">
            {error && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--coral-tint)] border border-[var(--coral-border)] text-xs font-bold text-[var(--coral-ink)]">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="p-0.5 cursor-pointer"
                  aria-label="Tutup pesan galat"
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            )}

            {/* Floating @Tag Context Picker */}
            {tagPickerOpen && (
              <div
                aria-label="Pilih konteks tag untuk AI"
                className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--surface-elevated)] border border-[var(--border-structural)] rounded-xl shadow-[var(--shadow-popover)] max-h-72 flex flex-col overflow-hidden z-20"
              >
                <div className="px-3 py-2 border-b border-[var(--border-structural)] flex items-center gap-2">
                  <AtTagIcon size={15} className="text-[var(--accent-primary)] shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Cari materi, catatan memori, soal salah, atau subtes..."
                    className="flex-1 bg-transparent text-xs font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTagPickerOpen(false)}
                    className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                    aria-label="Tutup pemilih konteks"
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>

                <div className="overflow-y-auto divide-y divide-[var(--border-structural)] text-xs">
                  {filteredTagOptions.notes.length > 0 && (
                    <div className="p-2 space-y-0.5">
                      <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                        Memori & Catatan Pribadi
                      </div>
                      {filteredTagOptions.notes.map((item) => (
                        <button
                          key={`note-${item.id}`}
                          type="button"
                          onClick={() => addContextTag(item)}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-secondary)] font-bold flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="truncate">{item.label}</span>
                          {item.subtest && (
                            <span className="text-[10px] text-[var(--ink-muted)]">{item.subtest}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredTagOptions.nodes.length > 0 && (
                    <div className="p-2 space-y-0.5">
                      <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                        Materi Jalur Belajar
                      </div>
                      {filteredTagOptions.nodes.map((item) => (
                        <button
                          key={`node-${item.id}`}
                          type="button"
                          onClick={() => addContextTag(item)}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-secondary)] font-bold flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="truncate">{item.label}</span>
                          <span className="text-[10px] text-[var(--accent-text-on-secondary)]">
                            {item.subtest}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredTagOptions.mistakes.length > 0 && (
                    <div className="p-2 space-y-0.5">
                      <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                        Soal Salah (Pemulihan)
                      </div>
                      {filteredTagOptions.mistakes.map((item) => (
                        <button
                          key={`mistake-${item.id}`}
                          type="button"
                          onClick={() => addContextTag(item)}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-secondary)] font-bold flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="truncate">{item.label}</span>
                          {item.subtest && (
                            <span className="text-[10px] text-[var(--coral-ink)]">{item.subtest}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredTagOptions.vault.length > 0 && (
                    <div className="p-2 space-y-0.5">
                      <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                        Catatan Brain Vault
                      </div>
                      {filteredTagOptions.vault.map((item) => (
                        <button
                          key={`vault-${item.id}`}
                          type="button"
                          onClick={() => addContextTag(item)}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-secondary)] font-bold flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="truncate">{item.label}</span>
                          {item.subtest && (
                            <span className="text-[10px] text-[var(--ink-muted)]">{item.subtest}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredTagOptions.subtests.length > 0 && (
                    <div className="p-2 space-y-0.5">
                      <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                        Subtes UTBK
                      </div>
                      {filteredTagOptions.subtests.map((item) => (
                        <button
                          key={`sub-${item.id}`}
                          type="button"
                          onClick={() => addContextTag(item)}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-secondary)] font-bold cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attached Files / Images & Active @Tags Strip (Flat, Minimal) */}
            {(attachments.length > 0 || contextTags.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {contextTags.map((tag) => (
                  <span
                    key={`${tag.type}-${tag.id}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--accent-tint)] text-xs font-extrabold text-[var(--accent-text-on-secondary)]"
                  >
                    <span>@{tag.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setContextTags((prev) =>
                          prev.filter((t) => !(t.type === tag.type && t.id === tag.id)),
                        )
                      }
                      aria-label={`Hapus tag ${tag.label}`}
                      className="hover:text-[var(--coral-ink)] cursor-pointer"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </span>
                ))}

                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-structural)] text-xs font-bold"
                  >
                    {att.kind === "image" ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : (
                      <ImageIcon size={14} className="text-[var(--olive-ink)]" />
                    )}
                    <span className="max-w-[140px] truncate">{att.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                      }
                      aria-label={`Hapus lampiran ${att.name}`}
                      className="text-[var(--ink-muted)] hover:text-[var(--coral-ink)] cursor-pointer"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Composer Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendQuestion(input);
              }}
              className="flex items-end gap-2 bg-[var(--surface-canvas)] border border-[var(--border-structural)] focus-within:border-[var(--accent-primary)] rounded-xl px-2.5 py-2 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,.txt,.md,.csv,.json,.tex"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    void processFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Lampirkan gambar soal atau file teks (atau drag & drop)"
                aria-label="Lampirkan gambar atau file"
                className="p-2 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-secondary)] cursor-pointer shrink-0"
              >
                <AttachIcon size={19} />
              </button>

              <button
                type="button"
                onClick={() => setTagPickerOpen((prev) => !prev)}
                title="Tag konteks (@Materi, @Catatan, @SoalSalah)"
                aria-label="Tag konteks untuk AI"
                className={`p-2 rounded-lg cursor-pointer shrink-0 transition-colors ${
                  tagPickerOpen
                    ? "bg-[var(--accent-tint)] text-[var(--accent-primary)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                <AtTagIcon size={19} />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Tanya apa saja, tempel gambar soal, atau ketik @ untuk tag materi..."
                className="flex-1 bg-transparent resize-none text-sm font-semibold text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] py-1.5 px-1 max-h-36 focus:outline-none"
              />

              <button
                type="submit"
                disabled={sending || (!input.trim() && attachments.length === 0)}
                aria-label="Kirim pertanyaan"
                className="p-2.5 rounded-lg bg-[var(--accent-primary)] text-white hover:opacity-95 disabled:opacity-40 cursor-pointer shrink-0 transition-opacity"
              >
                <SendIcon size={17} />
              </button>
            </form>
          </div>
        </div>

        {/* Slide-Over AI Persona, Memory & Learning Notes Drawer */}
        <TutorMemoryDrawer
          open={memoryDrawerOpen}
          onClose={() => setMemoryDrawerOpen(false)}
          persona={persona}
          notes={memoryNotes}
          onUpdated={(nextPersona, nextNotes) => {
            setPersona(nextPersona);
            setMemoryNotes(nextNotes);
          }}
          onTagNoteToChat={(note) => {
            addContextTag({
              type: "memory_note",
              id: note.id,
              label: note.title,
              subtest: note.subtest,
            });
          }}
        />
      </div>
    </AppShell>
  );
}
