"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BookOpenIcon,
  CheckIcon,
  CloseIcon,
  MemoryIcon,
  PinIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import type { BrainVaultChunk, SnbtSubtest } from "@/domain/types";
import type { UserMemoryNote } from "@/infrastructure/memory/user-memory-store";

interface StudyNotesDrawerProps {
  open: boolean;
  onClose: () => void;
  subtest: SnbtSubtest;
  skillTitle: string;
  questionPreview: string;
}

export function StudyNotesDrawer({
  open,
  onClose,
  subtest,
  skillTitle,
  questionPreview,
}: StudyNotesDrawerProps) {
  const [tab, setTab] = useState<"personal" | "vault">("personal");

  // Personal Notes & AI Memory
  const [notes, setNotes] = useState<UserMemoryNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteKind, setNoteKind] = useState<"note" | "memory">("note");
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Quick Brain Vault Lookup
  const [vaultQuery, setVaultQuery] = useState("");
  const [vaultChunks, setVaultChunks] = useState<BrainVaultChunk[]>([]);
  const [vaultSearching, setVaultSearching] = useState(false);

  const loadPersonalNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch("/api/tutor/memory");
      if (res.ok) {
        const json = (await res.json()) as { notes?: UserMemoryNote[] };
        setNotes(Array.isArray(json.notes) ? json.notes : []);
      }
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  const loadVaultChunks = useCallback(async (queryText: string) => {
    setVaultSearching(true);
    try {
      if (!queryText.trim()) {
        const res = await fetch("/api/vault/documents");
        if (res.ok) {
          const json = (await res.json()) as { chunks?: BrainVaultChunk[] };
          setVaultChunks(json.chunks ?? []);
        }
      } else {
        const res = await fetch("/api/vault/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryText }),
        });
        if (res.ok) {
          const json = (await res.json()) as { results?: Array<{ chunk: BrainVaultChunk }> };
          setVaultChunks((json.results ?? []).map((r) => r.chunk));
        }
      }
    } finally {
      setVaultSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setNoteTitle((prev) => prev || `${subtest} · ${skillTitle}`);
    void loadPersonalNotes();
    if (vaultChunks.length === 0) {
      void loadVaultChunks("");
    }
  }, [open, subtest, skillTitle, loadPersonalNotes, loadVaultChunks, vaultChunks.length]);

  useEffect(() => {
    // Update default title when moving to a different skill node
    setNoteTitle(`${subtest} · ${skillTitle}`);
  }, [subtest, skillTitle]);

  if (!open) return null;

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim() || saving) return;
    setSaving(true);
    setSavedNotice(false);
    try {
      const res = await fetch("/api/tutor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: noteKind,
          title: noteTitle.trim() || `${subtest} · ${skillTitle}`,
          content: noteContent.trim(),
          subtest,
          pinnedForAi: true,
        }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { bundle?: { notes?: UserMemoryNote[] } };
      if (json.bundle?.notes) {
        setNotes(json.bundle.notes);
      }
      setNoteContent("");
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePin(note: UserMemoryNote) {
    const res = await fetch("/api/tutor/memory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id, pinnedForAi: !note.pinnedForAi }),
    });
    if (res.ok) {
      const json = (await res.json()) as { notes?: UserMemoryNote[] };
      if (json.notes) setNotes(json.notes);
    }
  }

  async function handleDelete(noteId: string) {
    const res = await fetch(`/api/tutor/memory?id=${encodeURIComponent(noteId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      const json = (await res.json()) as { notes?: UserMemoryNote[] };
      if (json.notes) setNotes(json.notes);
    }
  }

  const relevantNotes = [...notes].sort((a, b) => {
    const aMatch = a.subtest === subtest ? 1 : 0;
    const bMatch = b.subtest === subtest ? 1 : 0;
    return bMatch - aMatch;
  });

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 top-16 z-30 bg-black/20"
      />
      <aside
        role="dialog"
        aria-label="Catatan soal dan memori belajar"
        className="fixed right-0 bottom-0 top-16 lg:w-[440px] w-full z-40 bg-[var(--surface-elevated)] border-t-2 lg:border-t-0 lg:border-l-2 border-[var(--border-structural)] shadow-[var(--shadow-sheet)] flex flex-col"
      >
        <div className="px-4 py-3 border-b border-[var(--border-structural)] bg-[var(--olive-tint)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[var(--olive-ink)] min-w-0">
            <MemoryIcon size={19} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold text-sm leading-tight truncate">Catatan Soal Ini</h2>
              <span className="text-[11px] font-semibold block truncate">
                {subtest} · {skillTitle}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel catatan"
            className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-[var(--olive-ink)] hover:bg-black/5 cursor-pointer shrink-0"
          >
            <CloseIcon size={17} />
          </button>
        </div>

        {/* Flat Underline Tabs */}
        <div className="grid grid-cols-2 border-b border-[var(--border-structural)] shrink-0">
          <button
            type="button"
            onClick={() => setTab("personal")}
            className={`min-h-[42px] text-xs font-extrabold border-b-2 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              tab === "personal"
                ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                : "border-transparent text-[var(--ink-secondary)]"
            }`}
          >
            <MemoryIcon size={15} />
            <span>Catatan Saya ({notes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("vault")}
            className={`min-h-[42px] text-xs font-extrabold border-b-2 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              tab === "vault"
                ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                : "border-transparent text-[var(--ink-secondary)]"
            }`}
          >
            <BookOpenIcon size={15} />
            <span>Rumus Brain Vault</span>
          </button>
        </div>

        {tab === "personal" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Add Note Directly For This Question */}
            <form
              onSubmit={handleSaveNote}
              className="space-y-2.5 pb-4 border-b border-[var(--border-structural)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[var(--ink-primary)]">
                  Tulis Catatan Soal Ini
                </span>
                <select
                  value={noteKind}
                  onChange={(e) => setNoteKind(e.target.value as "note" | "memory")}
                  aria-label="Jenis catatan"
                  className="bg-transparent text-[11px] font-extrabold text-[var(--olive-ink)] border-b border-[var(--border-structural)] py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="note">Catatan Materi</option>
                  <option value="memory">Memori AI</option>
                </select>
              </div>

              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Judul catatan..."
                className="input-tactile w-full text-xs min-h-[38px]"
              />

              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={`Tulis pengingat/rumus/kesalahanmu untuk soal "${questionPreview.slice(0, 48)}..."`}
                className="input-tactile w-full text-xs leading-relaxed"
              />

              <div className="flex items-center justify-between gap-2">
                <button
                  type="submit"
                  disabled={saving || !noteContent.trim()}
                  className="btn-primary text-xs min-h-[38px]"
                >
                  <PlusIcon size={14} />
                  <span>{saving ? "Menyimpan..." : "Simpan Catatan"}</span>
                </button>
                {savedNotice ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                    <CheckIcon size={14} />
                    Tersimpan & diingat AI!
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                    Otomatis diingat Tutor AI
                  </span>
                )}
              </div>
            </form>

            {/* Saved Notes List */}
            {loadingNotes ? (
              <p className="text-xs font-bold text-[var(--ink-muted)]">Memuat catatan...</p>
            ) : relevantNotes.length === 0 ? (
              <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                Belum ada catatan pribadi. Tulis catatan pertamamu di atas!
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-structural)]">
                {relevantNotes.map((n) => (
                  <article key={n.id} className="py-3 first:pt-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                          {n.kind === "memory" ? "Memori AI" : "Catatan"}
                          {n.subtest ? ` · ${n.subtest}` : ""}
                          {n.subtest === subtest ? " · Subtes Ini" : ""}
                        </div>
                        <h3 className="text-xs font-extrabold text-[var(--ink-primary)]">{n.title}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleTogglePin(n)}
                          title={n.pinnedForAi ? "Aktif dibaca AI" : "Nonaktif di AI"}
                          className={`p-1 rounded cursor-pointer ${
                            n.pinnedForAi
                              ? "text-[var(--accent-primary)] bg-[var(--accent-tint)]"
                              : "text-[var(--ink-muted)] hover:bg-[var(--surface-secondary)]"
                          }`}
                        >
                          <PinIcon size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(n.id)}
                          title="Hapus catatan"
                          className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--coral-ink)] hover:bg-[var(--coral-tint)] cursor-pointer"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                      <MathText text={n.content} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void loadVaultChunks(vaultQuery);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={vaultQuery}
                onChange={(e) => setVaultQuery(e.target.value)}
                placeholder="Cari rumus cepat dari dokumen PDF..."
                className="input-tactile text-xs min-h-[40px]"
              />
              <button type="submit" disabled={vaultSearching} className="btn-olive text-xs shrink-0 min-h-[40px]">
                Cari
              </button>
            </form>

            {vaultChunks.length === 0 ? (
              <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                Belum ada potongan rumus dari dokumen PDF yang cocok.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-structural)]">
                {vaultChunks.slice(0, 8).map((ch) => (
                  <article key={ch.id} className="py-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-extrabold">
                      <span className="text-[var(--accent-text-on-secondary)]">{ch.subtest ?? "UMUM"}</span>
                      {ch.methodLabel && <span>· {ch.methodLabel}</span>}
                    </div>
                    <div className="text-xs font-semibold leading-relaxed">
                      <MathText text={ch.contentMarkdown} />
                    </div>
                    {ch.validityConditions && (
                      <p className="text-[11px] font-bold text-[var(--ochre-ink)]">
                        Syarat berlaku: {ch.validityConditions}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
