"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  VaultIcon,
  VerifyIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import {
  getPriorityCurriculumStats,
  SNBT_KNOWLEDGE_BASE,
  type SnbtKnowledgeEntry,
} from "@/domain/snbt-knowledge-base";
import type { SnbtSubtest } from "@/domain/types";

const SUBTEST_FILTERS: Array<{ code: SnbtSubtest | "ALL"; label: string }> = [
  { code: "ALL", label: "Semua (7 Subtes)" },
  { code: "PK", label: "PK · Kuantitatif" },
  { code: "PM", label: "PM · Matematika" },
  { code: "PU", label: "PU · Penalaran Umum" },
  { code: "PPU", label: "PPU · Pemahaman" },
  { code: "PBM", label: "PBM · Menulis" },
  { code: "LBI", label: "LBI · Lit. Indonesia" },
  { code: "LBE", label: "LBE · Lit. Inggris" },
];

export function CurriculumLibrarySection() {
  const stats = useMemo(() => getPriorityCurriculumStats(), []);
  const [subtestFilter, setSubtestFilter] = useState<SnbtSubtest | "ALL">("ALL");
  const [onlyHighPriority, setOnlyHighPriority] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const firstHigh = SNBT_KNOWLEDGE_BASE.find((e) => e.priorityLevel >= 9);
    return firstHigh ? new Set([firstHigh.id]) : new Set();
  });

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SNBT_KNOWLEDGE_BASE.filter((entry) => {
      if (subtestFilter !== "ALL" && entry.subtest !== subtestFilter) return false;
      if (onlyHighPriority && entry.priorityLevel < 8) return false;
      if (!q) return true;
      const haystack = [
        entry.topicTitle,
        entry.chapterGroup ?? "",
        entry.sourceLabel,
        entry.whyBeforeHow,
        entry.priorityBadge,
        ...entry.keywords,
        ...entry.utbkTraps,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    }).sort((a, b) => b.priorityLevel - a.priorityLevel || a.subtest.localeCompare(b.subtest));
  }, [subtestFilter, onlyHighPriority, query]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Analitica Coverage Summary Bar */}
      <section className="card-tactile p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
              <VerifyIcon size={16} />
              <span>Kurikulum Prioritas Analitica 2025/2026 & Quipper TPS</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--ink-primary)]">
              Pustaka Materi UTBK Terkurasi ({stats.totalEntries} Topik Inti)
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[var(--ink-secondary)]">
              {stats.highPriorityCount} topik prioritas tinggi (Lv.8-10) siap dipelajari dengan prinsip dasar, rumus KaTeX, batas syarat rumus cepat, dan checklist jebakan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOnlyHighPriority((v) => !v)}
            className={`px-3.5 py-2 rounded-xl border-2 text-xs font-extrabold transition-colors shrink-0 cursor-pointer ${
              onlyHighPriority
                ? "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)]"
                : "bg-[var(--surface-elevated)] border-[var(--border-structural)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            {onlyHighPriority ? "✓ Prioritas Tinggi (Lv.8-10)" : "Filter: Prioritas Tinggi (Lv.8-10)"}
          </button>
        </div>

        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari topik, rumus, EYD V, eksponen, silogisme, atau jebakan UTBK..."
            className="input-tactile flex-1 text-sm"
            aria-label="Cari materi di Pustaka Materi UTBK"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="btn-secondary text-xs shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Subtest Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {SUBTEST_FILTERS.map((item) => {
            const active = subtestFilter === item.code;
            const count =
              item.code === "ALL" ? stats.totalEntries : stats.bySubtest[item.code] ?? 0;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setSubtestFilter(item.code)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold transition-colors cursor-pointer ${
                  active
                    ? "bg-[var(--accent-tint)] border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                    : "bg-[var(--surface-secondary)] border-[var(--border-structural)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {item.label}{" "}
                <span className="font-num opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-extrabold text-[var(--ink-secondary)] px-1">
        <span>
          Menampilkan <span className="font-num text-[var(--ink-primary)]">{filteredEntries.length}</span> materi UTBK
        </span>
        {filteredEntries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (expandedIds.size > 0) setExpandedIds(new Set());
              else setExpandedIds(new Set(filteredEntries.slice(0, 12).map((e) => e.id)));
            }}
            className="text-[var(--olive-ink)] hover:underline cursor-pointer"
          >
            {expandedIds.size > 0 ? "Tutup Semua Detail" : "Buka 12 Materi Teratas"}
          </button>
        )}
      </div>

      {/* Curriculum Cards */}
      {filteredEntries.length === 0 ? (
        <div className="card-tactile p-6 text-center space-y-2">
          <VaultIcon size={24} className="mx-auto text-[var(--ink-secondary)]" />
          <p className="text-sm font-bold text-[var(--ink-primary)]">
            Tidak ada topik kurikulum yang cocok dengan pencarian ini.
          </p>
          <p className="text-xs font-semibold text-[var(--ink-secondary)]">
            Coba ubah subtes, matikan filter prioritas, atau pakai kata kunci yang lebih umum.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry: SnbtKnowledgeEntry) => {
            const isOpen = expandedIds.has(entry.id);
            const isTop = entry.priorityLevel >= 8;
            return (
              <article
                key={entry.id}
                className="card-tactile p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(entry.id)}
                    className="text-left space-y-1.5 flex-1 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-structural)] text-[11px] font-extrabold text-[var(--ink-primary)] font-num">
                        {entry.subtest}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold font-num ${
                          isTop
                            ? "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)]"
                            : "bg-[var(--surface-secondary)] border-[var(--border-structural)] text-[var(--ink-secondary)]"
                        }`}
                      >
                        Lv.{entry.priorityLevel} · {entry.priorityBadge}
                      </span>
                      {entry.chapterGroup && (
                        <span className="text-[11px] font-bold text-[var(--ink-secondary)]">
                          {entry.chapterGroup}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                      {entry.topicTitle}
                    </h3>
                    <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                      Sumber: {entry.sourceLabel}
                    </p>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(entry.id)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      {isOpen ? "Tutup" : "Lihat Rumus"}
                    </button>
                    <Link
                      href={`/study?skillNodeId=${entry.skillNodeId}&mode=lesson`}
                      className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1"
                    >
                      <span>Pelajari</span>
                      <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                </div>

                {isOpen && (
                  <div className="pt-3 border-t border-[var(--border-structural)] space-y-4">
                    {/* Concept / Why Before How */}
                    <div className="space-y-1">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                        Konsep Inti & Prinsip Dasar
                      </div>
                      <div className="text-sm font-semibold leading-relaxed text-[var(--ink-primary)]">
                        <MathText text={entry.whyBeforeHow} />
                      </div>
                    </div>

                    {/* Key Formulas KaTeX */}
                    {entry.keyFormulasLatex.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--ink-secondary)]">
                          Formula & Kaidah Utama
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {entry.keyFormulasLatex.map((latex, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-structural)] overflow-x-auto text-sm font-semibold text-[var(--ink-primary)]"
                            >
                              <MathText text={`$${latex}$`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shortcut & Boundary */}
                    {entry.shortcutWithBoundary && (
                      <div className="p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                          <CheckIcon size={14} />
                          <span>Strategi Cepat: {entry.shortcutWithBoundary.methodLabel}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-[var(--ink-primary)]">
                          <MathText text={entry.shortcutWithBoundary.shortcutMarkdown} />
                        </div>
                        <div className="text-xs font-bold text-[var(--coral-ink)]">
                          Syarat berlaku: <MathText text={entry.shortcutWithBoundary.validityConditions} />
                        </div>
                      </div>
                    )}

                    {/* UTBK Traps */}
                    {entry.utbkTraps.length > 0 && (
                      <div className="border-l-4 border-[var(--ochre-ink)] pl-3.5 space-y-1">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                          Jebakan Klasik UTBK
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm font-semibold text-[var(--ink-secondary)]">
                          {entry.utbkTraps.map((trap, i) => (
                            <li key={i}>
                              <MathText text={trap} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Quick Drill Tip */}
                    {entry.quickDrillTip && (
                      <div className="p-3 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] text-xs sm:text-sm font-bold text-[var(--ochre-ink)]">
                        Tip Latihan Cepat: <MathText text={entry.quickDrillTip} />
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
