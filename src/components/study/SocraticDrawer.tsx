"use client";

import React, { useEffect, useState } from "react";
import {
  BrainIcon,
  CheckIcon,
  CloseIcon,
  HintIcon,
  MemoryIcon,
  SendIcon,
  TutorChatIcon,
  VaultIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import type { SnbtSubtest, SocraticHintLevel } from "@/domain/types";

export interface SocraticHintRecord {
  hintLevel: SocraticHintLevel;
  groundedInUserVault: boolean;
  boundaryConditionWarning: string | null;
  hintMarkdown: string;
  promptQuestionForStudent: string;
  citedChunks: Array<{
    id: string;
    methodLabel: string | null;
    chunkType: string;
    validityConditions: string | null;
    rrfScore: number;
  }>;
  sourceMode: "9router" | "deterministic_vault_fallback";
  latencyMs: number;
}

interface InlineAskReply {
  whyFirstMarkdown: string;
  stepByStepMarkdown: string;
  activeRecallCheck: string;
  groundedInVault: boolean;
}

interface SocraticDrawerProps {
  open: boolean;
  onClose: () => void;
  questionId: string;
  subtest?: SnbtSubtest;
  skillTitle?: string;
  initialTab?: "chat" | "hints";
  hints: SocraticHintRecord[];
  loadingLevel: SocraticHintLevel | null;
  error: string | null;
  onRequestHint: (level: SocraticHintLevel, stuckNote?: string) => Promise<void>;
}

const HINT_LEVELS: Array<{ level: SocraticHintLevel; step: string; label: string; desc: string }> = [
  {
    level: "L1_vault_nudge",
    step: "Tahap 1",
    label: "Why Before How & Catatanmu",
    desc: "Pahami dulu mengapa konsepnya cocok dan cek rumus cepat pribadimu.",
  },
  {
    level: "L2_translation_prompt",
    step: "Tahap 2",
    label: "Bedah Kalimat Soal",
    desc: "Arahkan variabel dan inti pertanyaan tanpa membocorkan jawaban.",
  },
  {
    level: "L3_guided_first_step",
    step: "Tahap 3",
    label: "Langkah Pembuka",
    desc: "Tampilkan satu langkah pertama agar kamu bisa melanjutkannya.",
  },
  {
    level: "L4_first_principles_analogy",
    step: "Tahap 4",
    label: "Analogi Prinsip Dasar",
    desc: "Bangun ulang intuisi pelan-pelan dari nol.",
  },
];

export function SocraticDrawer({
  open,
  onClose,
  questionId,
  subtest,
  skillTitle,
  initialTab = "chat",
  hints,
  loadingLevel,
  error,
  onRequestHint,
}: SocraticDrawerProps) {
  const [drawerTab, setDrawerTab] = useState<"chat" | "hints">(initialTab);
  const [stuckNote, setStuckNote] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<
    Array<{ id: string; userQ: string; reply: InlineAskReply; saved?: boolean }>
  >([]);

  useEffect(() => {
    setDrawerTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    setChatLog([]);
    setChatError(null);
    setStuckNote("");
  }, [questionId]);

  if (!open) return null;

  const unlockedCount = hints.length;

  async function handleAskAboutQuestion(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed || chatBusy) return;
    setChatBusy(true);
    setChatError(null);
    try {
      const res = await fetch("/api/tutor/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          questionId,
          subtest: subtest ?? null,
          history: chatLog.slice(-4).flatMap((c) => [
            { role: "user" as const, content: c.userQ },
            { role: "assistant" as const, content: c.reply.whyFirstMarkdown },
          ]),
        }),
      });
      if (!res.ok) throw new Error("Gagal mengirim pertanyaan ke Tutor AI.");
      const data = (await res.json()) as InlineAskReply;
      setChatLog((prev) => [...prev, { id: `${Date.now()}`, userQ: trimmed, reply: data }]);
      setChatInput("");
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Gagal menghubungi Tutor AI.");
    } finally {
      setChatBusy(false);
    }
  }

  async function handleSaveReplyToNotes(entryId: string, reply: InlineAskReply) {
    const res = await fetch("/api/tutor/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "note",
        title: `Tanya AI · ${skillTitle || "Catatan Soal"}`,
        content: `${reply.whyFirstMarkdown}\n\nLangkah:\n${reply.stepByStepMarkdown}`.slice(0, 1800),
        subtest: subtest ?? null,
        pinnedForAi: true,
      }),
    });
    if (res.ok) {
      setChatLog((prev) => prev.map((c) => (c.id === entryId ? { ...c, saved: true } : c)));
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 top-16 z-30 bg-black/20"
      />
      <aside
        role="dialog"
        aria-label="Tutor AI dan Petunjuk Sokratik"
        className="fixed right-0 bottom-0 top-16 lg:w-[440px] w-full z-40 bg-[var(--surface-elevated)] border-t-2 lg:border-t-0 lg:border-l-2 border-[var(--border-structural)] shadow-[var(--shadow-sheet)] flex flex-col"
      >
        <div className="px-4 py-3 border-b border-[var(--border-structural)] bg-[var(--olive-tint)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[var(--olive-ink)] min-w-0">
            <TutorChatIcon size={20} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold text-sm leading-tight truncate">Tanya AI Soal Ini</h2>
              <span className="text-[11px] font-semibold block truncate">
                {subtest && skillTitle
                  ? `Konteks aktif: ${subtest} · ${skillTitle}`
                  : "Membimbing dari nol sesuai profil belajarmu"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup laci petunjuk"
            className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-[var(--olive-ink)] hover:bg-black/5 cursor-pointer shrink-0"
          >
            <CloseIcon size={17} />
          </button>
        </div>

        {/* 2 Clean Tabs: Tanya AI Soal Ini (Default) vs Petunjuk Bertahap */}
        <div className="grid grid-cols-2 border-b border-[var(--border-structural)] bg-[var(--surface-elevated)] shrink-0">
          <button
            type="button"
            onClick={() => setDrawerTab("chat")}
            className={`min-h-[42px] text-xs font-extrabold border-b-2 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              drawerTab === "chat"
                ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                : "border-transparent text-[var(--ink-secondary)]"
            }`}
          >
            <TutorChatIcon size={15} />
            <span>Tanya AI Soal Ini</span>
          </button>
          <button
            type="button"
            onClick={() => setDrawerTab("hints")}
            className={`min-h-[42px] text-xs font-extrabold border-b-2 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              drawerTab === "hints"
                ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                : "border-transparent text-[var(--ink-secondary)]"
            }`}
          >
            <HintIcon size={15} />
            <span>Petunjuk Bertahap ({hints.length}/4)</span>
          </button>
        </div>

        {drawerTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatLog.length === 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                    AI sudah otomatis membaca soal yang sedang terbuka. Tanyakan apa pun yang bikin bingung:
                  </p>
                  <div className="divide-y divide-[var(--border-structural)] border-y border-[var(--border-structural)]">
                    {[
                      "Jelaskan konsep soal ini dari nol pakai analogi sederhana!",
                      "Langkah pertama apa yang harus aku lakukan?",
                      "Kenapa opsi pengecoh di soal ini sering menjebak?",
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => void handleAskAboutQuestion(q)}
                        className="w-full text-left py-2.5 text-xs font-bold text-[var(--ink-primary)] hover:text-[var(--accent-text-on-secondary)] cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span>{q}</span>
                        <span className="text-[var(--ink-muted)]">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatLog.map((c) => (
                <div key={c.id} className="space-y-2.5">
                  <div className="flex justify-end">
                    <div className="max-w-[88%] px-3 py-2 rounded-xl bg-[var(--olive-fill)] text-white text-xs font-bold">
                      {c.userQ}
                    </div>
                  </div>
                  <div className="border-l-2 border-[var(--accent-primary)] pl-3 space-y-2 text-xs sm:text-sm">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                        Kenapa ini bekerja
                      </div>
                      <MathText text={c.reply.whyFirstMarkdown} className="font-semibold leading-relaxed" />
                    </div>
                    <div className="pt-1.5 border-t border-[var(--border-structural)]">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                        Langkah demi langkah
                      </div>
                      <MathText text={c.reply.stepByStepMarkdown} className="font-semibold leading-relaxed" />
                    </div>
                    <div className="pt-1.5 border-t border-[var(--border-structural)] text-xs font-bold text-[var(--ochre-ink)]">
                      Cek ingatan: <MathText text={c.reply.activeRecallCheck} />
                    </div>
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        disabled={c.saved}
                        onClick={() => void handleSaveReplyToNotes(c.id, c.reply)}
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer disabled:opacity-60"
                      >
                        {c.saved ? (
                          <>
                            <CheckIcon size={13} />
                            <span>Tersimpan di Catatan</span>
                          </>
                        ) : (
                          <>
                            <MemoryIcon size={13} />
                            <span>Simpan ke Catatan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {chatBusy && (
                <div className="text-xs font-extrabold text-[var(--accent-text-on-secondary)] animate-pulse">
                  Tutor AI sedang menjawab berdasarkan soal ini...
                </div>
              )}
              {chatError && (
                <div className="p-2.5 rounded-lg bg-[var(--coral-tint)] text-xs font-bold text-[var(--coral-ink)]">
                  {chatError}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleAskAboutQuestion(chatInput);
              }}
              className="p-3 border-t border-[var(--border-structural)] bg-[var(--surface-secondary)] flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanya tentang soal ini ke AI..."
                className="input-tactile text-xs min-h-[40px]"
              />
              <button
                type="submit"
                disabled={chatBusy || !chatInput.trim()}
                className="btn-primary min-h-[40px] px-3"
              >
                <SendIcon size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="stuck-note-input" className="text-xs font-extrabold text-[var(--ink-secondary)] block">
                Bagian mana yang bikin bingung? (opsional)
              </label>
              <textarea
                id="stuck-note-input"
                rows={2}
                value={stuckNote}
                onChange={(e) => setStuckNote(e.target.value)}
                placeholder="Misal: kenapa harus disamakan penyebutnya dulu?"
                className="input-tactile text-sm min-h-[56px]"
              />
            </div>

            <div className="space-y-2">
              {HINT_LEVELS.map((item, idx) => {
                const alreadyFetched = hints.some((h) => h.hintLevel === item.level);
                const isNext = idx === unlockedCount;
                const disabled = loadingLevel !== null || (idx > unlockedCount && !alreadyFetched);

                return (
                  <button
                    key={item.level}
                    type="button"
                    disabled={disabled}
                    onClick={() => onRequestHint(item.level, stuckNote || undefined)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      isNext
                        ? "border-[var(--accent-primary)] bg-[var(--accent-tint)]"
                        : alreadyFetched
                          ? "border-[var(--border-structural)] bg-[var(--surface-secondary)]"
                          : "border-[var(--border-structural)] bg-[var(--surface-canvas)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold">
                        {item.step} · {item.label}
                      </span>
                      <span className="text-[11px] font-extrabold text-[var(--ink-secondary)]">
                        {loadingLevel === item.level
                          ? "Memproses..."
                          : alreadyFetched
                            ? "Terbuka"
                            : isNext
                              ? "Buka"
                              : "Terkunci"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--ink-secondary)] mt-0.5">{item.desc}</p>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-[var(--coral-border)] bg-[var(--coral-tint)] text-xs font-bold text-[var(--coral-ink)]">
                {error}
              </div>
            )}

            <div className="space-y-4" aria-live="polite">
              {hints.map((h, i) => (
                <article
                  key={h.hintLevel}
                  className="border-l-2 border-[var(--accent-primary)] pl-3.5 py-1 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
                    <span className="text-[var(--accent-text-on-secondary)]">Petunjuk Tahap {i + 1}</span>
                    {h.groundedInUserVault && (
                      <span className="inline-flex items-center gap-1 text-[var(--olive-ink)]">
                        <VaultIcon size={14} />
                        Dari Catatanmu
                      </span>
                    )}
                  </div>

                  {h.boundaryConditionWarning && (
                    <div className="p-2.5 rounded-lg bg-[var(--ochre-tint)] border border-[var(--ochre-border)] text-xs font-bold text-[var(--ochre-ink)]">
                      Syarat rumus: {h.boundaryConditionWarning}
                    </div>
                  )}

                  <div className="text-sm font-semibold leading-relaxed">
                    <MathText text={h.hintMarkdown} />
                  </div>

                  <div className="pt-2 border-t border-[var(--border-structural)] text-xs font-extrabold text-[var(--ochre-ink)] inline-flex items-start gap-1.5">
                    <BrainIcon size={15} className="shrink-0 mt-0.5" />
                    <span>Cek paham: {h.promptQuestionForStudent}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
