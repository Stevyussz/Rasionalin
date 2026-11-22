"use client";

import React, { useEffect, useState } from "react";
import {
  AtTagIcon,
  CheckIcon,
  CloseIcon,
  MemoryIcon,
  NoteEditIcon,
  PinIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "@/components/icons/ArchitecturalIcons";
import type { SnbtSubtest } from "@/domain/types";
import type {
  ExplanationStyle,
  StartingLevel,
  UserLearningPersona,
  UserMemoryNote,
} from "@/infrastructure/memory/user-memory-store";

const ALL_SUBTESTS: SnbtSubtest[] = ["PK", "PU", "PM", "LBI", "LBE", "PBM", "PPU"];

interface TutorMemoryDrawerProps {
  open: boolean;
  onClose: () => void;
  persona: UserLearningPersona;
  notes: UserMemoryNote[];
  onUpdated: (persona: UserLearningPersona, notes: UserMemoryNote[]) => void;
  onTagNoteToChat: (note: UserMemoryNote) => void;
}

export function TutorMemoryDrawer({
  open,
  onClose,
  persona,
  notes,
  onUpdated,
  onTagNoteToChat,
}: TutorMemoryDrawerProps) {
  const [tab, setTab] = useState<"persona" | "notes">("persona");

  // Persona form state
  const [nickname, setNickname] = useState(persona.nickname);
  const [startingLevel, setStartingLevel] = useState<StartingLevel>(persona.startingLevel);
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>(persona.explanationStyle);
  const [targetGoal, setTargetGoal] = useState(persona.targetGoal);
  const [weakSubtests, setWeakSubtests] = useState<SnbtSubtest[]>(persona.weakSubtests);
  const [personalContext, setPersonalContext] = useState(persona.personalContext);
  const [savingPersona, setSavingPersona] = useState(false);
  const [personaSaved, setPersonaSaved] = useState(false);

  // Add note/memory form state
  const [newKind, setNewKind] = useState<"memory" | "note">("memory");
  const [newTitle, setNewTitle] = useState("");
  const [newSubtest, setNewSubtest] = useState<"" | SnbtSubtest>("");
  const [newContent, setNewContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setNickname(persona.nickname);
    setStartingLevel(persona.startingLevel);
    setExplanationStyle(persona.explanationStyle);
    setTargetGoal(persona.targetGoal);
    setWeakSubtests(persona.weakSubtests);
    setPersonalContext(persona.personalContext);
  }, [persona]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function toggleWeakSubtest(sub: SnbtSubtest) {
    setWeakSubtests((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub],
    );
  }

  async function handleSavePersona(e: React.FormEvent) {
    e.preventDefault();
    setSavingPersona(true);
    setErrorMsg(null);
    setPersonaSaved(false);
    try {
      const res = await fetch("/api/tutor/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim() || "Pejuang SNBT",
          startingLevel,
          explanationStyle,
          targetGoal: targetGoal.trim(),
          weakSubtests,
          personalContext: personalContext.trim(),
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan persona.");
      const data = (await res.json()) as { persona: UserLearningPersona; notes: UserMemoryNote[] };
      onUpdated(data.persona, data.notes);
      setPersonaSaved(true);
      setTimeout(() => setPersonaSaved(false), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyimpan persona.");
    } finally {
      setSavingPersona(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSavingNote(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/tutor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: newKind,
          title: newTitle.trim(),
          content: newContent.trim(),
          subtest: newSubtest || null,
          pinnedForAi: true,
        }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan memori/catatan.");
      const data = (await res.json()) as {
        bundle: { persona: UserLearningPersona; notes: UserMemoryNote[] };
      };
      onUpdated(data.bundle.persona, data.bundle.notes);
      setNewTitle("");
      setNewContent("");
      setNewSubtest("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyimpan catatan.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleTogglePin(note: UserMemoryNote) {
    try {
      const res = await fetch("/api/tutor/memory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, pinnedForAi: !note.pinnedForAi }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { persona: UserLearningPersona; notes: UserMemoryNote[] };
      onUpdated(data.persona, data.notes);
    } catch {
      // Ignore transient toggle error
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      const res = await fetch(`/api/tutor/memory?id=${encodeURIComponent(noteId)}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { persona: UserLearningPersona; notes: UserMemoryNote[] };
      onUpdated(data.persona, data.notes);
    } catch {
      // Ignore transient delete error
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label="Memori AI dan Catatan Belajar"
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] z-50 bg-[var(--surface-elevated)] border-l border-[var(--border-structural)] shadow-[var(--shadow-popover)] flex flex-col"
      >
        {/* Slim Header */}
        <div className="px-5 h-14 border-b border-[var(--border-structural)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 font-bold text-base">
            <MemoryIcon size={19} className="text-[var(--accent-primary)]" />
            <span>Memori AI & Catatan Belajar</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel memori"
            className="p-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Clean Flat Underline Tabs (Zero Pill Soup) */}
        <div className="px-5 border-b border-[var(--border-structural)] flex items-center gap-6 shrink-0">
          <button
            type="button"
            onClick={() => setTab("persona")}
            className={`py-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              tab === "persona"
                ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <UserIcon size={16} />
            <span>Persona Saya</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("notes")}
            className={`py-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              tab === "notes"
                ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <NoteEditIcon size={16} />
            <span>Memori & Catatan ({notes.length})</span>
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-[var(--coral-tint)] border border-[var(--coral-border)] text-xs font-bold text-[var(--coral-ink)]">
              {errorMsg}
            </div>
          )}

          {tab === "persona" ? (
            <form onSubmit={handleSavePersona} className="space-y-4">
              <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                Data persona ini otomatis dibaca Tutor AI saat menjawab chat, memberi hint, dan menjelaskan soal agar sesuai caramu belajar.
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-[var(--ink-secondary)]">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Misal: Stevy"
                  className="input-tactile w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-[var(--ink-secondary)]">
                    Kondisi Awal
                  </label>
                  <select
                    value={startingLevel}
                    onChange={(e) => setStartingLevel(e.target.value as StartingLevel)}
                    className="input-tactile w-full text-xs"
                  >
                    <option value="nol_total">Mulai dari Nol Total</option>
                    <option value="dasar">Paham Dasar</option>
                    <option value="menengah">Menengah (Fokus 800+)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-[var(--ink-secondary)]">
                    Gaya Penjelasan AI
                  </label>
                  <select
                    value={explanationStyle}
                    onChange={(e) => setExplanationStyle(e.target.value as ExplanationStyle)}
                    className="input-tactile w-full text-xs"
                  >
                    <option value="analogi_sehari_hari">Analogi Sehari-hari</option>
                    <option value="step_by_step_pelan">Pelan Baris per Baris</option>
                    <option value="ringkas_langsung">Ringkas & To-The-Point</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-[var(--ink-secondary)]">
                  Target PTN / Skor
                </label>
                <input
                  type="text"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  placeholder="Misal: Skor 800+ SNBT - Informatika"
                  className="input-tactile w-full text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-extrabold text-[var(--ink-secondary)]">
                  Subtes yang Paling Sering Bikin Bingung
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_SUBTESTS.map((sub) => {
                    const active = weakSubtests.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleWeakSubtest(sub)}
                        className={`py-2 rounded-lg border text-xs font-extrabold cursor-pointer transition-colors ${
                          active
                            ? "bg-[var(--accent-tint)] border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                            : "bg-[var(--surface-canvas)] border-[var(--border-structural)] text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]"
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-[var(--ink-secondary)]">
                  Cerita & Preferensi Belajarmu untuk AI
                </label>
                <textarea
                  rows={4}
                  value={personalContext}
                  onChange={(e) => setPersonalContext(e.target.value)}
                  placeholder="Contoh: Aku sering bingung tanda minus saat pindah ruas. Tolong selalu jelaskan alasan dasarnya dulu sebelum rumus."
                  className="input-tactile w-full text-sm leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingPersona}
                  className="btn-primary text-xs min-h-[42px]"
                >
                  <CheckIcon size={15} />
                  <span>{savingPersona ? "Menyimpan..." : "Simpan Persona"}</span>
                </button>
                {personaSaved && (
                  <span className="text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                    Persona tersimpan!
                  </span>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Quick Add Form */}
              <form
                onSubmit={handleAddNote}
                className="space-y-2.5 pb-4 border-b border-[var(--border-structural)]"
              >
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as "memory" | "note")}
                    className="input-tactile text-xs"
                    aria-label="Jenis item"
                  >
                    <option value="memory">Memori AI (Kebiasaan/Profil)</option>
                    <option value="note">Catatan Belajar (Materi/Rumus)</option>
                  </select>
                  <select
                    value={newSubtest}
                    onChange={(e) => setNewSubtest(e.target.value as "" | SnbtSubtest)}
                    className="input-tactile text-xs"
                    aria-label="Subtes catatan"
                  >
                    <option value="">Umum</option>
                    {ALL_SUBTESTS.map((sub) => (
                      <option key={sub} value={sub}>
                        Subtes {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Judul singkat (misal: Sering lupa tanda minus)"
                  className="input-tactile w-full text-sm"
                />

                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Tulis fakta memori atau catatan materi yang ingin diingat AI..."
                  className="input-tactile w-full text-sm"
                />

                <button
                  type="submit"
                  disabled={savingNote || !newTitle.trim() || !newContent.trim()}
                  className="btn-primary text-xs min-h-[40px]"
                >
                  <PlusIcon size={15} />
                  <span>{savingNote ? "Menyimpan..." : "Tambah ke Memori & Catatan"}</span>
                </button>
              </form>

              {/* Flat Hairline List (Zero Pill Cards) */}
              {notes.length === 0 ? (
                <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                  Belum ada memori atau catatan tersimpan. Tambahkan di atas atau klik &quot;Simpan ke Memori&quot; pada balasan AI.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-structural)]">
                  {notes.map((item) => (
                    <div key={item.id} className="py-3.5 first:pt-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                            {item.kind === "memory" ? "Memori AI" : "Catatan Belajar"}
                            {item.subtest ? ` · ${item.subtest}` : ""}
                          </div>
                          <h3 className="text-sm font-bold text-[var(--ink-primary)] leading-snug">
                            {item.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => void handleTogglePin(item)}
                            title={
                              item.pinnedForAi
                                ? "Aktif dibaca AI (klik untuk nonaktifkan)"
                                : "Nonaktif (klik agar dibaca AI)"
                            }
                            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                              item.pinnedForAi
                                ? "text-[var(--accent-primary)] bg-[var(--accent-tint)]"
                                : "text-[var(--ink-muted)] hover:bg-[var(--surface-secondary)]"
                            }`}
                          >
                            <PinIcon size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onTagNoteToChat(item);
                              onClose();
                            }}
                            title="Tandai ke chat (@tag)"
                            className="p-1.5 rounded-md text-[var(--olive-ink)] hover:bg-[var(--surface-secondary)] cursor-pointer"
                          >
                            <AtTagIcon size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteNote(item.id)}
                            title="Hapus"
                            className="p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--coral-ink)] hover:bg-[var(--coral-tint)] cursor-pointer"
                          >
                            <TrashIcon size={15} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
