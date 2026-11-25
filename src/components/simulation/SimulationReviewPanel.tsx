"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import type {
  ReviewItemStatus,
  SimulationReviewPayload,
} from "@/application/simulation-service";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckIcon,
  TimerIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import type {
  SimulationSessionEntity,
  SimulationSubtestBlockEntity,
  SnbtSubtest,
} from "@/domain/types";

interface SimulationReviewPanelProps {
  session: SimulationSessionEntity;
  blocks: SimulationSubtestBlockEntity[];
  review: SimulationReviewPayload | null;
  modeLabel: string;
  onBackToLobby: () => void;
}

const SUBTEST_LABELS: Record<SnbtSubtest, string> = {
  PK: "Pengetahuan Kuantitatif",
  PU: "Penalaran Umum",
  PM: "Penalaran Matematika",
  LBI: "Literasi Bahasa Indonesia",
  LBE: "Literasi Bahasa Inggris",
  PBM: "Pemahaman Bacaan & Menulis",
  PPU: "Pengetahuan & Pemahaman Umum",
};

type StatusFilter = "all" | "wrong" | "skipped_or_blank" | "correct";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}d` : `${secs}d`;
}

function reviewStatusMeta(status: ReviewItemStatus): { label: string; className: string } {
  switch (status) {
    case "correct":
      return {
        label: "Benar",
        className:
          "bg-[var(--accent-tint)] border-[var(--accent-tint-border)] text-[var(--accent-text-on-secondary)]",
      };
    case "wrong":
      return {
        label: "Salah",
        className: "bg-[var(--coral-tint)] border-[var(--coral-border)] text-[var(--coral-ink)]",
      };
    case "skipped":
      return {
        label: "Dilewati",
        className: "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)]",
      };
    case "unanswered":
      return {
        label: "Kosong",
        className: "bg-[var(--surface-secondary)] border-[var(--border-structural)] text-[var(--ink-secondary)]",
      };
  }
}

export function SimulationReviewPanel({
  session,
  blocks,
  review,
  modeLabel,
  onBackToLobby,
}: SimulationReviewPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [subtestFilter, setSubtestFilter] = useState<SnbtSubtest | "ALL">("ALL");
  const [cursorIndex, setCursorIndex] = useState(0);

  const uniqueSubtests = useMemo(
    () => Array.from(new Set(blocks.map((b) => b.subtest))),
    [blocks],
  );

  const filteredItems = useMemo(() => {
    if (!review) return [];
    return review.items.filter((item) => {
      if (subtestFilter !== "ALL" && item.subtest !== subtestFilter) return false;
      if (statusFilter === "wrong") return item.status === "wrong";
      if (statusFilter === "skipped_or_blank") {
        return item.status === "skipped" || item.status === "unanswered";
      }
      if (statusFilter === "correct") return item.status === "correct";
      return true;
    });
  }, [review, statusFilter, subtestFilter]);

  useEffect(() => {
    setCursorIndex(0);
  }, [statusFilter, subtestFilter, session.id]);

  const activeItem = filteredItems[cursorIndex] ?? null;

  return (
    <div className="space-y-6">
      {/* Main Post-Tryout Scoreboard Card */}
      <section className="card-tactile p-5 sm:p-8 space-y-6" aria-label="Rapor hasil tryout UTBK">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-structural)] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
              <CheckIcon size={16} />
              <span>Tryout Selesai · {modeLabel}</span>
            </div>
            <h2 className="text-2xl font-bold mt-1">Rapor Hasil & Bedah Soal</h2>
            <p className="text-xs font-semibold text-[var(--ink-muted)] mt-0.5">
              Dikerjakan{" "}
              {new Date(session.completedAt ?? session.startedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onBackToLobby} className="btn-secondary text-xs">
              Kembali ke Lobi
            </button>
            <Link href="/graveyard" className="btn-primary text-xs">
              <span>Pulihkan Soal Salah</span>
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-structural)]">
          <div className="py-3 sm:px-5 first:pl-0">
            <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
              Estimasi Skor IRT
            </span>
            <div className="text-3xl font-num font-bold text-[var(--accent-text-on-secondary)] mt-1">
              {Math.round(session.estimatedIrtScore ?? 400)}
            </div>
          </div>
          <div className="py-3 sm:px-5">
            <span className="text-xs font-extrabold text-[var(--ink-secondary)]">Akurasi Total</span>
            <div className="text-3xl font-num font-bold text-[var(--olive-ink)] mt-1">
              {Math.round((session.accuracyRate ?? 0) * 100)}%
            </div>
          </div>
          <div className="py-3 sm:px-5">
            <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
              Efisiensi Triase
            </span>
            <div className="text-3xl font-num font-bold text-[var(--ochre-ink)] mt-1">
              {Math.round((session.triageEfficiencyScore ?? 0) * 100)}%
            </div>
          </div>
          <div className="py-3 sm:px-5">
            <span className="text-xs font-extrabold text-[var(--ink-secondary)]">Durasi Total</span>
            <div className="text-3xl font-num font-bold text-[var(--ink-primary)] mt-1">
              {formatDuration(session.totalDurationSeconds)}
            </div>
          </div>
        </div>

        {/* Per-Subtest Breakdown + 1-Click Studio Grilling */}
        <div className="space-y-3 pt-2 border-t border-[var(--border-structural)]">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
            Rincian Performa Per Subtes
          </h3>
          <div className="divide-y divide-[var(--border-structural)]">
            {blocks.map((b) => {
              const pct =
                b.questionCount > 0 ? Math.round((b.correctCount / b.questionCount) * 100) : 0;
              return (
                <div
                  key={b.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-extrabold">
                        {b.subtest} · {SUBTEST_LABELS[b.subtest]}
                      </span>
                      <span className="font-num text-xs font-bold text-[var(--ink-secondary)]">
                        {b.correctCount}/{b.questionCount} benar ({pct}%)
                        {b.skippedSmartCount > 0 ? ` · ${b.skippedSmartCount} dilewati` : ""}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent-primary)] transition-all"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-num text-sm font-bold text-[var(--accent-text-on-secondary)]">
                      IRT {b.subtestIrtScore ? Math.round(b.subtestIrtScore) : "-"}
                    </span>
                    <Link
                      href={`/tutor?mode=studio&subtest=${b.subtest}`}
                      className={`text-xs font-extrabold px-2.5 py-1.5 rounded-lg border transition-colors ${
                        pct < 70
                          ? "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)] hover:opacity-90"
                          : "bg-[var(--surface-secondary)] border-[var(--border-structural)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      Grilling AI
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Weakest Skill Nodes Diagnostic & Instant Next Step */}
      {review && (
        <section
          className="card-tactile p-5 sm:p-6 space-y-3"
          aria-label="Bab paling butuh perbaikan dari tryout"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                Prioritas Perbaikan Setelah Tryout
              </div>
              <h3 className="font-bold text-base sm:text-lg">
                {review.weakestNodes.length > 0
                  ? "Bab Terlemah yang Paling Cepat Menaikkan Skormu"
                  : "Semua Soal Terjawab Tepat"}
              </h3>
            </div>
            <Link
              href="/tutor?mode=studio"
              className="text-xs font-extrabold text-[var(--accent-text-on-secondary)] hover:underline"
            >
              Buka Studio Grilling AI →
            </Link>
          </div>

          {review.weakestNodes.length > 0 ? (
            <div className="divide-y divide-[var(--border-structural)] border-t border-[var(--border-structural)]">
              {review.weakestNodes.map((w) => (
                <div
                  key={w.skillNodeId}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-extrabold">
                      <span className="px-2 py-0.5 rounded bg-[var(--surface-secondary)] font-num">
                        {w.subtest}
                      </span>
                      <span className="text-[var(--coral-ink)] font-num">
                        {w.missedCount} dari {w.totalCount} meleset ({w.accuracyPct}% benar)
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[var(--ink-primary)] truncate">
                      {w.skillNodeTitle}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/study?skillNodeId=${w.skillNodeId}&mode=lesson`}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <BookOpenIcon size={14} />
                      <span>Pelajari</span>
                    </Link>
                    <Link
                      href={`/tutor?mode=studio&subtest=${w.subtest}&nodeId=${w.skillNodeId}&topic=${encodeURIComponent(w.skillNodeTitle)}`}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      <span>Grilling AI</span>
                      <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-semibold text-[var(--ink-secondary)]">
              Mantap, tidak ada bab yang meleset di tryout ini. Tantang dirimu dengan paket HOTS 800+ di Studio Grilling AI atau tingkatkan ke Tryout Resmi 160 soal.
            </p>
          )}
        </section>
      )}

      {/* Per-Question Focused Breakdown & Explanation Inspector */}
      {review && review.items.length > 0 && (
        <section
          className="card-tactile p-5 sm:p-6 space-y-5"
          aria-label="Bedah pembahasan per nomor soal"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-structural)] pb-4">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                Bedah Pembahasan Per Nomor ({review.items.length} Soal)
              </div>
              <h3 className="font-bold text-lg">Periksa Jawabanmu vs Kunci Resmi</h3>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter status jawaban">
              {(
                [
                  { id: "all", label: `Semua (${review.totalQuestions})` },
                  { id: "wrong", label: `Salah (${review.wrongCount})` },
                  {
                    id: "skipped_or_blank",
                    label: `Kosong (${review.skippedCount + review.unansweredCount})`,
                  },
                  { id: "correct", label: `Benar (${review.correctCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-extrabold font-num transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-[var(--accent-tint)] border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                      : "bg-[var(--surface-secondary)] border-[var(--border-structural)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {uniqueSubtests.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSubtestFilter("ALL")}
                className={`px-2.5 py-1 rounded-md border text-xs font-extrabold cursor-pointer ${
                  subtestFilter === "ALL"
                    ? "bg-[var(--olive-fill)] border-[var(--olive-fill)] text-white"
                    : "bg-[var(--surface-canvas)] border-[var(--border-structural)] text-[var(--ink-secondary)]"
                }`}
              >
                Semua Subtes
              </button>
              {uniqueSubtests.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubtestFilter(sub)}
                  className={`px-2.5 py-1 rounded-md border text-xs font-extrabold font-num cursor-pointer ${
                    subtestFilter === sub
                      ? "bg-[var(--olive-fill)] border-[var(--olive-fill)] text-white"
                      : "bg-[var(--surface-canvas)] border-[var(--border-structural)] text-[var(--ink-secondary)]"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="p-6 rounded-xl bg-[var(--surface-secondary)] text-center text-xs sm:text-sm font-bold text-[var(--ink-secondary)]">
              Tidak ada soal untuk kombinasi filter ini. Pilih filter &ldquo;Semua&rdquo; di atas.
            </div>
          ) : (
            <>
              {/* Quick Number Selector Grid */}
              <div className="flex flex-wrap gap-1.5">
                {filteredItems.map((it, idx) => {
                  const active = idx === cursorIndex;
                  const tone =
                    it.status === "correct"
                      ? "bg-[var(--accent-tint)] border-[var(--accent-tint-border)] text-[var(--accent-text-on-secondary)]"
                      : it.status === "wrong"
                        ? "bg-[var(--coral-tint)] border-[var(--coral-border)] text-[var(--coral-ink)]"
                        : it.status === "skipped"
                          ? "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)]"
                          : "bg-[var(--surface-secondary)] border-[var(--border-structural)] text-[var(--ink-secondary)]";
                  return (
                    <button
                      key={`${it.blockId}-${it.questionNumber}`}
                      type="button"
                      onClick={() => setCursorIndex(idx)}
                      className={`min-w-[36px] h-9 px-2 rounded-lg border font-num text-xs font-extrabold cursor-pointer transition-all ${tone} ${
                        active ? "ring-2 ring-[var(--ink-primary)]" : ""
                      }`}
                    >
                      {it.questionNumber}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Full Review Card */}
              {activeItem && (
                <article className="space-y-4 pt-3 border-t border-[var(--border-structural)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-num font-extrabold px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border-structural)]">
                        Nomor #{activeItem.questionNumber} · {activeItem.subtest}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border font-extrabold ${
                          reviewStatusMeta(activeItem.status).className
                        }`}
                      >
                        {reviewStatusMeta(activeItem.status).label}
                      </span>
                      <span className="font-bold text-[var(--ink-secondary)]">
                        {activeItem.skillNodeTitle}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 font-num font-bold text-[var(--ink-secondary)]">
                      <TimerIcon size={14} />
                      <span>
                        {activeItem.timeToSolveMs !== null
                          ? `${Math.max(1, Math.round(activeItem.timeToSolveMs / 1000))} dtk`
                          : "Belum dikerjakan"}{" "}
                        / target {activeItem.expectedSolveSeconds} dtk
                      </span>
                    </div>
                  </div>

                  {activeItem.passageText && (
                    <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-structural)] text-xs sm:text-sm leading-relaxed font-semibold text-[var(--ink-primary)] whitespace-pre-line">
                      {activeItem.passageText}
                    </div>
                  )}

                  <div className="text-sm sm:text-base font-bold leading-relaxed text-[var(--ink-primary)]">
                    <MathText text={activeItem.stemMarkdown} />
                  </div>

                  <div className="space-y-2">
                    {activeItem.options.map((opt) => {
                      const isCorrect = opt.key === activeItem.correctAnswerKey;
                      const isChosen = opt.key === activeItem.selectedAnswerKey;

                      let cls =
                        "border-[var(--border-structural)] bg-[var(--surface-canvas)]";
                      if (isCorrect) {
                        cls =
                          "border-[var(--accent-primary)] bg-[var(--accent-tint)]";
                      } else if (isChosen) {
                        cls =
                          "border-[var(--coral-border)] bg-[var(--coral-tint)]";
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-xl border-2 space-y-1 text-xs sm:text-sm ${cls}`}
                        >
                          <div className="flex items-start justify-between gap-2 font-semibold text-[var(--ink-primary)]">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="font-num font-extrabold shrink-0">{opt.key}.</span>
                              <div className="min-w-0">
                                <MathText text={opt.textMarkdown} />
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-extrabold">
                              {isChosen && (
                                <span
                                  className={
                                    isCorrect
                                      ? "text-[var(--accent-text-on-secondary)]"
                                      : "text-[var(--coral-ink)]"
                                  }
                                >
                                  Pilihanmu
                                </span>
                              )}
                              {isCorrect && (
                                <span className="text-[var(--accent-text-on-secondary)]">
                                  Kunci Benar
                                </span>
                              )}
                            </div>
                          </div>

                          {(isCorrect || isChosen) && opt.distractorRationale && (
                            <div className="text-xs font-semibold text-[var(--ink-secondary)] pl-5">
                              <MathText text={opt.distractorRationale} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step-by-step Official Solution */}
                  <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-structural)] space-y-3">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                      Pembahasan Resmi Langkah Demi Langkah
                    </div>
                    {activeItem.solutionSteps.length > 0 ? (
                      <ol className="space-y-2.5">
                        {activeItem.solutionSteps.map((st, idx) => (
                          <li
                            key={idx}
                            className="pl-3 border-l-2 border-[var(--accent-primary)] space-y-1 text-xs sm:text-sm"
                          >
                            <div className="font-extrabold text-[var(--olive-ink)]">
                              {idx + 1}. {st.title}
                            </div>
                            <div className="font-semibold text-[var(--ink-primary)] leading-relaxed">
                              <MathText text={st.instructionMarkdown} />
                            </div>
                            {st.formulaLatex && (
                              <div className="overflow-x-auto">
                                <MathText text={`$$${st.formulaLatex}$$`} />
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="text-xs sm:text-sm font-semibold leading-relaxed text-[var(--ink-primary)]">
                        <MathText text={activeItem.officialSolutionMarkdown} />
                      </div>
                    )}
                  </div>

                  {/* Bottom Navigation & Targeted Grilling Link */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={cursorIndex === 0}
                        onClick={() => setCursorIndex((prev) => Math.max(0, prev - 1))}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        <ArrowLeftIcon size={14} />
                        <span>Sebelumnya</span>
                      </button>
                      <button
                        type="button"
                        disabled={cursorIndex + 1 >= filteredItems.length}
                        onClick={() =>
                          setCursorIndex((prev) => Math.min(filteredItems.length - 1, prev + 1))
                        }
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        <span>Berikutnya</span>
                        <ArrowRightIcon size={14} />
                      </button>
                    </div>

                    <Link
                      href={`/tutor?mode=studio&subtest=${activeItem.subtest}&nodeId=${activeItem.skillNodeId}&topic=${encodeURIComponent(activeItem.skillNodeTitle)}`}
                      className="text-xs font-extrabold text-[var(--accent-text-on-secondary)] hover:underline"
                    >
                      Buat Modul & Grilling AI untuk Bab Ini →
                    </Link>
                  </div>
                </article>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
