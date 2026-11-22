"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckIcon,
  MemoryIcon,
  PinIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import type { SnbtSubtest } from "@/domain/types";
import type { UserMemoryNote } from "@/infrastructure/memory/user-memory-store";

const SUBTESTS: SnbtSubtest[] = ["PK", "PU", "PM", "LBI", "LBE", "PBM", "PPU"];

export function PersonalNotesSection() {
  const [notes, setNotes] = useState<UserMemoryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<"note" | "memory">("note");
  const [subtest, setSubtest] = useState<"" | SnbtSubtest>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tutor/memory");
      if (res.ok) {
        const json = (await res.json()) as { notes?: UserMemoryNote[] };
        setNotes(Array.isArray(json.notes) ? json.notes : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);
    setSavedOk(false);
    try {
      const res = await fetch("/api/tutor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim(),
          content: content.trim(),
          subtest: subtest || null,
          pinnedForAi: true,
        }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { bundle?: { notes?: UserMemoryNote[] } };
      if (json.bundle?.notes) setNotes(json.bundle.notes);
      setTitle("");
      setContent("");
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
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

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tutor/memory?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      const json = (await res.json()) as { notes?: UserMemoryNote[] };
      if (json.notes) setNotes(json.notes);
    }
  }

  return (
    <section
      aria-label="Catatan Pribadi dan Memori AI"
      className="card-tactile p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-structural)]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
            <MemoryIcon size={16} />
            <span>Catatan Tulis Cepat & Memori AI</span>
          </div>
          <h2 className="text-lg font-bold mt-0.5">Tulis Catatan Belajar Pribadimu</h2>
          <p className="text-xs font-semibold text-[var(--ink-secondary)]">
            Semua catatan di sini otomatis tersinkron ke tombol Catatan di setiap soal dan dibaca Tutor AI saat kamu bertanya.
          </p>
        </div>
        <span className="font-num text-xs font-extrabold text-[var(--olive-ink)]">
          {notes.length} tersimpan
        </span>
      </div>

      <form onSubmit={handleCreate} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul catatan (misal: Trik pindah ruas tanda minus)"
            className="input-tactile sm:col-span-1 text-sm"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "note" | "memory")}
            aria-label="Tipe catatan"
            className="input-tactile text-xs"
          >
            <option value="note">Catatan Materi / Rumus</option>
            <option value="memory">Memori AI (Kebiasaan / Preferensi)</option>
          </select>
          <select
            value={subtest}
            onChange={(e) => setSubtest(e.target.value as "" | SnbtSubtest)}
            aria-label="Subtes catatan"
            className="input-tactile text-xs"
          >
            <option value="">Semua Subtes (Umum)</option>
            {SUBTESTS.map((s) => (
              <option key={s} value={s}>
                Subtes {s}
              </option>
            ))}
          </select>
        </div>

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis catatanmu di sini... (boleh pakai rumus seperti $\dfrac{1}{2}$)"
          className="input-tactile w-full text-sm leading-relaxed"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !title.trim() || !content.trim()}
            className="btn-primary text-xs min-h-[42px]"
          >
            <PlusIcon size={15} />
            <span>{saving ? "Menyimpan..." : "Simpan Catatan & Memori AI"}</span>
          </button>
          {savedOk && (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
              <CheckIcon size={15} />
              Catatan tersimpan!
            </span>
          )}
        </div>
      </form>

      {!loading && notes.length > 0 && (
        <div className="divide-y divide-[var(--border-structural)] border-t border-[var(--border-structural)] pt-2">
          {notes.map((n) => (
            <article key={n.id} className="py-3 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                  {n.kind === "memory" ? "Memori AI" : "Catatan Belajar"}
                  {n.subtest ? ` · ${n.subtest}` : ""}
                  {n.pinnedForAi ? " · Aktif di AI" : " · Arsip"}
                </div>
                <h3 className="text-sm font-bold text-[var(--ink-primary)]">{n.title}</h3>
                <div className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                  <MathText text={n.content} />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleTogglePin(n)}
                  title={n.pinnedForAi ? "Aktif dibaca AI" : "Aktifkan untuk AI"}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    n.pinnedForAi
                      ? "text-[var(--accent-primary)] bg-[var(--accent-tint)]"
                      : "text-[var(--ink-muted)] hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  <PinIcon size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(n.id)}
                  title="Hapus catatan"
                  className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--coral-ink)] hover:bg-[var(--coral-tint)] cursor-pointer"
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
