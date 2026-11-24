"use client";

import React, { useEffect, useState } from "react";
import { CheckIcon, NoteEditIcon, TargetIcon, TimerIcon } from "@/components/icons/ArchitecturalIcons";
import {
  computeExamCountdown,
  computeRecommendedWeeklyNodes,
  DEFAULT_UTBK_EXAM_DATE,
} from "@/domain/exam-countdown";

interface ExamCountdownCardProps {
  examDate: string | null;
  masteredNodes: number;
  totalNodes: number;
  targetScore: number;
  onExamDateUpdated?: (nextDate: string | null) => void;
}

export function ExamCountdownCard({
  examDate,
  masteredNodes,
  totalNodes,
  targetScore,
  onExamDateUpdated,
}: ExamCountdownCardProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftDate, setDraftDate] = useState(examDate || DEFAULT_UTBK_EXAM_DATE);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setDraftDate(examDate || DEFAULT_UTBK_EXAM_DATE);
  }, [examDate]);

  const effectiveNow = nowMs ?? Date.parse(`${examDate || DEFAULT_UTBK_EXAM_DATE}T07:30:00+07:00`) - 86_400_000;
  const cd = computeExamCountdown(examDate, effectiveNow);
  const remainingNodes = Math.max(0, totalNodes - masteredNodes);
  const weeklyTarget = computeRecommendedWeeklyNodes(remainingNodes, cd.totalDaysRoundedUp);

  async function handleSaveDate(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !draftDate) return;
    setSaving(true);
    setSaveNotice(null);
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: draftDate }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui tanggal UTBK.");
      window.dispatchEvent(
        new CustomEvent("rasionalin:exam-date-changed", { detail: { examDate: draftDate } }),
      );
      onExamDateUpdated?.(draftDate);
      setEditing(false);
      setSaveNotice("Tanggal UTBK tersimpan!");
      window.setTimeout(() => setSaveNotice(null), 2600);
    } catch {
      setSaveNotice("Gagal menyimpan tanggal. Cek format tanggal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label="Hitung mundur hari ujian UTBK SNBT"
      className="card-tactile p-5 space-y-4 border-[var(--ochre-bevel)]/35 bg-[var(--surface-elevated)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
              <TimerIcon size={16} />
              <span>Countdown SNBT / UTBK</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)] text-[11px] font-extrabold">
              {cd.phaseLabel}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold leading-snug">
            {cd.isExamDay ? (
              "Hari-H UTBK-SNBT sudah tiba, kerjakan dengan tenang!"
            ) : (
              <>
                Menuju UTBK{" "}
                <span className="text-[var(--accent-primary)]">{cd.formattedDateId}</span>
              </>
            )}
          </h2>
          <p className="text-xs font-semibold text-[var(--ink-secondary)]">
            {remainingNodes > 0 ? (
              <>
                Ritme ideal: kuasai <strong className="font-num text-[var(--ink-primary)]">{weeklyTarget} bab/minggu</strong>{" "}
                (<span className="font-num">{remainingNodes}</span> dari{" "}
                <span className="font-num">{totalNodes}</span> bab tersisa menuju{" "}
                <span className="font-num">{targetScore}+</span>).
              </>
            ) : (
              "Seluruh bab silabus sudah tuntas! Tinggal jaga ketajaman lewat Tryout & Active Recall."
            )}
            {cd.isDefaultDate && " (Pakai estimasi jadwal UTBK)"}
          </p>
        </div>

        {/* Live Days · Hours · Minutes Telemetry */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-2 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] text-center min-w-[68px]">
            <div className="font-num text-xl sm:text-2xl font-extrabold text-[var(--accent-primary)] leading-none">
              {nowMs === null ? "--" : `H-${cd.daysLeft}`}
            </div>
            <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--accent-text-on-secondary)] mt-1">
              Hari
            </div>
          </div>
          <div className="px-2.5 py-2 rounded-xl bg-[var(--surface-secondary)] text-center min-w-[52px]">
            <div className="font-num text-lg sm:text-xl font-extrabold leading-none">
              {nowMs === null ? "--" : String(cd.hoursLeft).padStart(2, "0")}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-secondary)] mt-1">
              Jam
            </div>
          </div>
          <div className="px-2.5 py-2 rounded-xl bg-[var(--surface-secondary)] text-center min-w-[52px]">
            <div className="font-num text-lg sm:text-xl font-extrabold leading-none">
              {nowMs === null ? "--" : String(cd.minutesLeft).padStart(2, "0")}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-secondary)] mt-1">
              Menit
            </div>
          </div>
        </div>
      </div>

      {/* Inline UTBK Date Customizer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-structural)]">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink-secondary)]">
          <TargetIcon size={14} className="text-[var(--olive-ink)]" />
          <span>
            Waktu hitung WIB: 07.30 WIB · Gelombang targetmu{" "}
            <strong className="font-num text-[var(--ink-primary)]">{cd.formattedDateId}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg border border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)] text-xs font-extrabold text-[var(--ink-primary)] cursor-pointer transition-colors"
        >
          <NoteEditIcon size={14} />
          <span>{editing ? "Tutup" : "Ubah Tanggal"}</span>
        </button>
      </div>

      {saveNotice && (
        <div className="text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
          {saveNotice}
        </div>
      )}

      {editing && (
        <form
          onSubmit={handleSaveDate}
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          <input
            type="date"
            aria-label="Pilih tanggal ujian UTBK-SNBT"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            required
            className="min-h-[42px] px-3 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] font-num text-sm font-bold"
          />
          <button type="submit" disabled={saving} className="btn-primary min-h-[42px] px-4 text-xs">
            <CheckIcon size={15} />
            <span>{saving ? "Menyimpan..." : "Simpan Tanggal UTBK"}</span>
          </button>
        </form>
      )}
    </section>
  );
}
