"use client";

import React, { useEffect, useState } from "react";
import {
  CheckIcon,
  CloseIcon,
  MemoryIcon,
  SendIcon,
  TutorChatIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import type { AsasOptionKey, AsasQuestion } from "@/domain/asas";
import { playHintSound, playTapSound } from "@/infrastructure/audio/sound-effects";

interface InlineAskReply {
  whyFirstMarkdown: string;
  stepByStepMarkdown: string;
  activeRecallCheck: string;
  suggestedFollowups?: string[];
  groundedInVault?: boolean;
}

interface AsasAiDrawerProps {
  open: boolean;
  onClose: () => void;
  subjectName: string;
  chapterTitle: string;
  chapterSummary?: string;
  question: AsasQuestion | null;
  isAnswered?: boolean;
  selectedKey?: AsasOptionKey | null;
}

export function AsasAiDrawer({
  open,
  onClose,
  subjectName,
  chapterTitle,
  chapterSummary,
  question,
  isAnswered = false,
  selectedKey = null,
}: AsasAiDrawerProps) {
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<
    Array<{ id: string; userQ: string; reply: InlineAskReply; saved?: boolean }>
  >([]);

  const contextKey = question ? `q:${question.id}` : `ch:${chapterTitle}`;

  useEffect(() => {
    setChatLog([]);
    setChatError(null);
    setChatInput("");
  }, [contextKey]);

  if (!open) return null;

  const quickPrompts = question
    ? isAnswered
      ? [
          "Jelaskan langkah hitungannya dari nol pakai bahasa super sederhana!",
          "Kenapa aku harus hati-hati sama jebakan di tipe soal ini?",
          "Kasih trik cepat 10 detik biar besok saat ujian ASAS nggak blank!",
        ]
      : [
          "Aku blank banget! Soal ini maksudnya apa & mulai dari mana tanpa kasih tahu kuncinya?",
          "Kenapa harus pakai rumus yang itu, bukan rumus lain di bab ini?",
          "Bantu tulis Langkah 1 pembukanya aja di coretan biar aku bisa lanjut hitung sendiri!",
        ]
    : [
        `Jelaskan bab "${chapterTitle}" dari NOL banget buat yang masih bingung rumusnya!`,
        "Gimana cara bedain rumus-rumus di bab ini biar besok pas lihat soal langsung ngeh?",
        "Kasih 1 contoh paling dasar langkah demi langkah!",
      ];

  async function handleAsk(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed || chatBusy) return;
    playTapSound();
    setChatBusy(true);
    setChatError(null);
    try {
      const customQuestion = question
        ? {
            subject: subjectName,
            chapter: chapterTitle,
            triggerTag: question.triggerTag,
            promptMarkdown: question.promptMarkdown,
            options: question.options.map((o) => `${o.key}. ${o.text}`),
            formulaHint: question.formulaHint,
            stepByStep: isAnswered ? question.stepByStep : undefined,
            studentAnswered: isAnswered,
            studentSelectedKey: selectedKey ?? undefined,
          }
        : {
            subject: subjectName,
            chapter: chapterTitle,
            triggerTag: "Modul Bab ASAS",
            promptMarkdown: chapterSummary ?? `Bahas materi ${chapterTitle} (${subjectName}) dari nol.`,
            formulaHint: chapterSummary ?? "",
            studentAnswered: true,
          };

      const res = await fetch("/api/tutor/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          customQuestion,
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
    playHintSound();
    const res = await fetch("/api/tutor/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "note",
        title: `ASAS ${subjectName} · ${question ? question.triggerTag : chapterTitle}`.slice(0, 120),
        content: `${reply.whyFirstMarkdown}\n\nLangkah:\n${reply.stepByStepMarkdown}`.slice(0, 1800),
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
        className="fixed inset-0 top-14 z-40 bg-black/25"
      />
      <aside
        role="dialog"
        aria-label="Tanya AI Soal ASAS"
        className="fixed right-0 bottom-0 top-14 lg:w-[440px] w-full z-50 bg-[var(--surface-elevated)] border-t-2 lg:border-t-0 lg:border-l-2 border-[var(--border-structural)] shadow-[var(--shadow-sheet)] flex flex-col"
      >
        <div className="px-4 py-3 border-b border-[var(--border-structural)] bg-[var(--olive-tint)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 text-[var(--olive-ink)] min-w-0">
            <TutorChatIcon size={20} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm leading-tight truncate">
                {question ? "Tanya AI Soal Ini" : "Tanya AI Bab Ini"}
              </h2>
              <span className="text-[11px] font-bold block truncate">
                {subjectName} · {chapterTitle}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            aria-label="Tutup panel Tanya AI"
            className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-[var(--olive-ink)] hover:bg-black/5 cursor-pointer shrink-0"
          >
            <CloseIcon size={17} />
          </button>
        </div>

        {/* Honest / Anti-Spoiler Status Strip */}
        {question && (
          <div className="px-4 py-2 border-b border-[var(--border-structural)] bg-[var(--surface-secondary)] flex items-center justify-between gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${
                isAnswered
                  ? "bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)]"
                  : "bg-[var(--ochre-tint)] text-[var(--ochre-ink)]"
              }`}
            >
              {isAnswered
                ? "Mode Bedah · Pembahasan tuntas boleh dibuka"
                : "Mode Jujur · Bimbing tanpa bocorin kunci A-E"}
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatLog.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
                {question
                  ? "Bingung soal ini mau diapakan? Klik salah satu pertanyaan cepat di bawah atau ketik bagian mana yang bikin otak blank:"
                  : "Masih bingung alur atau rumus di bab ini? Tanya aja pelan-pelan dari nol:"}
              </p>
              <div className="divide-y divide-[var(--border-structural)] border-y border-[var(--border-structural)]">
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void handleAsk(q)}
                    className="w-full text-left py-2.5 text-xs sm:text-[13px] font-bold text-[var(--ink-primary)] hover:text-[var(--accent-text-on-secondary)] cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span>{q}</span>
                    <span className="text-[var(--ink-muted)] shrink-0">→</span>
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
              <div className="border-l-2 border-[var(--accent-primary)] pl-3 space-y-2.5 text-xs sm:text-sm">
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

                {c.reply.suggestedFollowups && c.reply.suggestedFollowups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.reply.suggestedFollowups.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => void handleAsk(f)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)] text-[11px] font-bold text-[var(--ink-secondary)] cursor-pointer text-left"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}

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
            <div className="py-3 text-xs font-extrabold text-[var(--ink-secondary)]">
              AI sedang menyusun penjelasan dari nol...
            </div>
          )}
          {chatError && (
            <div className="p-2.5 rounded-lg bg-[var(--semantic-incorrect-bg)] text-xs font-bold text-[var(--coral-ink)]">
              {chatError}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleAsk(chatInput);
          }}
          className="p-3 border-t border-[var(--border-structural)] bg-[var(--surface-canvas)] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Tanya bagian mana yang bikin bingung..."
            className="flex-1 min-h-[40px] px-3 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-elevated)] text-xs sm:text-sm font-medium focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <button
            type="submit"
            disabled={chatBusy || !chatInput.trim()}
            aria-label="Kirim pertanyaan ke AI"
            className="btn-primary min-w-[40px] min-h-[40px] px-3 disabled:opacity-50"
          >
            <SendIcon size={16} />
          </button>
        </form>
      </aside>
    </>
  );
}
