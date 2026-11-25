"use client";

import Link from "next/link";
import React, { useState } from "react";
import { ArrowRightIcon, TimerIcon } from "@/components/icons/ArchitecturalIcons";
import type { RoadmapPhaseKey, WeeklyStudyRoadmap } from "@/domain/weekly-roadmap";

interface WeeklyRoadmapSectionProps {
  roadmap: WeeklyStudyRoadmap;
}

function phaseTone(phase: RoadmapPhaseKey): string {
  switch (phase) {
    case "foundation":
      return "bg-[var(--accent-tint)] border-[var(--accent-tint-border)] text-[var(--accent-text-on-secondary)]";
    case "core_interleave":
      return "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)]";
    case "hots_sprint":
      return "bg-[var(--coral-tint)] border-[var(--coral-border)] text-[var(--coral-ink)]";
    case "final_taper":
      return "bg-[var(--surface-secondary)] border-[var(--border-structural)] text-[var(--olive-ink)]";
  }
}

export function WeeklyRoadmapSection({ roadmap }: WeeklyRoadmapSectionProps) {
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  const visibleWeeks = showAllWeeks ? roadmap.weeks : roadmap.weeks.slice(0, 1);

  return (
    <section
      aria-label="Roadmap jadwal belajar mingguan"
      className="card-tactile p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
            <TimerIcon size={15} />
            <span>
              Roadmap H-{roadmap.daysLeft} sampai H-0 ({roadmap.totalWeeks} Pekan)
            </span>
          </div>
          <h2 className="text-lg font-bold text-[var(--ink-primary)]">
            Peta Jadwal Mingguan · {roadmap.paceLabel}
          </h2>
          <p className="text-xs font-semibold text-[var(--ink-secondary)]">
            <span className="font-num font-bold text-[var(--ink-primary)]">
              {roadmap.remainingNodesCount}
            </span>{" "}
            bab tersisa dari{" "}
            <span className="font-num">{roadmap.totalNodesCount}</span> bab dibagi otomatis menuju hari ujianmu.
          </p>
        </div>

        {roadmap.weeks.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAllWeeks((v) => !v)}
            className="btn-secondary text-xs px-3 py-1.5 shrink-0"
          >
            {showAllWeeks
              ? "Tampilkan Pekan Ini Saja"
              : `Lihat Semua Pekan (${roadmap.weeks.length})`}
          </button>
        )}
      </div>

      {/* Phase Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {roadmap.phaseSummaries.map((ps) => (
          <div
            key={ps.phase}
            className={`px-3 py-2 rounded-xl border text-xs ${phaseTone(ps.phase)}`}
          >
            <div className="font-extrabold truncate">{ps.label}</div>
            <div className="font-num font-bold opacity-85 mt-0.5">
              {ps.weeksCount} pekan · {ps.nodesCount} bab
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Breakdown List */}
      <div
        className={`divide-y divide-[var(--border-structural)] border-t border-[var(--border-structural)] ${
          showAllWeeks && visibleWeeks.length > 5 ? "max-h-[460px] overflow-y-auto pr-1" : ""
        }`}
      >
        {visibleWeeks.map((wk) => (
          <div key={wk.weekNumber} className="py-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded-md border font-num font-extrabold ${
                    wk.isCurrentWeek
                      ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                      : "bg-[var(--surface-secondary)] border-[var(--border-structural)] text-[var(--ink-primary)]"
                  }`}
                >
                  Pekan {wk.weekNumber}
                  {wk.isCurrentWeek ? " · Sekarang" : ""}
                </span>
                <span className="font-num font-bold text-[var(--ink-secondary)]">
                  {wk.dateRangeLabel}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border text-[11px] font-extrabold ${phaseTone(
                    wk.phase,
                  )}`}
                >
                  {wk.phaseLabel}
                </span>
              </div>

              <Link
                href="/simulation"
                className="text-[11px] font-extrabold text-[var(--olive-ink)] hover:underline inline-flex items-center gap-1"
              >
                <span>{wk.recommendedTryout}</span>
                <ArrowRightIcon size={12} />
              </Link>
            </div>

            <p className="text-xs sm:text-sm font-bold text-[var(--ink-primary)]">
              {wk.focusHeadline}
            </p>

            {wk.phase === "foundation" && (
              <p className="text-xs font-semibold text-[var(--accent-text-on-secondary)]">
                Pemanasan disarankan: 3 menit di{" "}
                <Link href="/math-gym" className="font-extrabold underline">
                  Buka Gym Hitung
                </Link>{" "}
                sebelum masuk bab PK/PM.
              </p>
            )}

            {wk.nodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {wk.nodes.map((node) => (
                  <Link
                    key={node.id}
                    href={node.studyHref}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:border-[var(--accent-primary)] text-xs font-bold text-[var(--ink-primary)] transition-colors"
                  >
                    <span className="font-num font-extrabold text-[var(--accent-text-on-secondary)]">
                      {node.subtest}
                    </span>
                    <span className="truncate max-w-[200px] sm:max-w-[260px]">{node.titleId}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
