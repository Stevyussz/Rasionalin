"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  PlayIcon,
  SimulationIcon,
  TargetIcon,
  TimerIcon,
} from "@/components/icons/ArchitecturalIcons";
import { AppShell } from "@/components/layout/AppShell";
import {
  SimulationFocusTunnel,
  type ActiveSimPayload,
} from "@/components/simulation/SimulationFocusTunnel";
import type {
  SimulationMode,
  SimulationSessionEntity,
  SnbtSubtest,
} from "@/domain/types";

const SUBTEST_OPTIONS: Array<{ code: SnbtSubtest; name: string }> = [
  { code: "PK", name: "PK · Pengetahuan Kuantitatif" },
  { code: "PU", name: "PU · Penalaran Umum" },
  { code: "PM", name: "PM · Penalaran Matematika" },
  { code: "LBI", name: "LBI · Literasi Bahasa Indonesia" },
  { code: "LBE", name: "LBE · Literasi Bahasa Inggris" },
  { code: "PBM", name: "PBM · Pemahaman Bacaan & Menulis" },
  { code: "PPU", name: "PPU · Pengetahuan & Pemahaman Umum" },
];

const MODES: Array<{
  mode: SimulationMode;
  badge: string;
  title: string;
  desc: string;
  cta: string;
  accent: "emerald" | "ochre" | "olive";
}> = [
  {
    mode: "diagnostic_placement",
    badge: "5 Subtes · ~15 Menit",
    title: "Diagnostik Penempatan Awal",
    desc: "Petakan materi dasar yang perlu diperbaiki lintas PK, PU, PM, LBI, dan LBE sekaligus ukur skor IRT awalmu.",
    cta: "Mulai Diagnostik",
    accent: "emerald",
  },
  {
    mode: "triage_sprint",
    badge: "PK & PM · Refleks 15-20 Detik",
    title: "Sprint Triase Cepat",
    desc: "Latih keputusan cepat antara mengerjakan soal sekarang atau melewati cerdas pada blok kuantitatif.",
    cta: "Mulai Sprint Triase",
    accent: "ochre",
  },
  {
    mode: "full_tryout_utbk",
    badge: "7 Subtes Resmi · Blok Terkunci",
    title: "Tryout Penuh UTBK-SNBT",
    desc: "Mode ujian fokus layar penuh dengan urutan 7 blok subtes terkunci permanen persis UTBK resmi.",
    cta: "Mulai Tryout UTBK",
    accent: "olive",
  },
];

function modeFriendlyLabel(mode: SimulationMode): string {
  switch (mode) {
    case "diagnostic_placement":
      return "Diagnostik Awal";
    case "triage_sprint":
      return "Sprint Triase";
    case "full_tryout_utbk":
      return "Tryout 7 Subtes";
    case "subtest_drill":
      return "Drill 1 Subtes Fokus";
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}d` : `${secs}d`;
}

export function SimulationWorkspace() {
  const [sim, setSim] = useState<ActiveSimPayload | null>(null);
  const [history, setHistory] = useState<SimulationSessionEntity[]>([]);
  const [drillSubtest, setDrillSubtest] = useState<SnbtSubtest>("PK");
  const [startingMode, setStartingMode] = useState<SimulationMode | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/simulation/start");
      if (!res.ok) return;
      const json = (await res.json()) as { simulations?: SimulationSessionEntity[] };
      setHistory(json.simulations ?? []);
    } catch {
      // Non-fatal on lobby load
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const activeBlock = useMemo(() => {
    if (!sim) return null;
    return sim.blocks.find((b) => !b.isLocked && b.startedAt !== null) ?? null;
  }, [sim]);

  async function startSimulation(mode: SimulationMode, subtest?: SnbtSubtest) {
    setStartingMode(mode);
    setError(null);
    try {
      const res = await fetch("/api/simulation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtest ? { mode, subtest } : { mode }),
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error ?? "Gagal memulai sesi tryout.");
      }
      const json = (await res.json()) as ActiveSimPayload;
      setSim(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai simulasi.");
    } finally {
      setStartingMode(null);
    }
  }

  async function resumeSimulation(sessionId: string) {
    setResumingId(sessionId);
    setError(null);
    try {
      const res = await fetch(`/api/simulation/${sessionId}`);
      if (!res.ok) throw new Error("Gagal memuat ulang sesi tryout.");
      const json = (await res.json()) as ActiveSimPayload;
      setSim(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sesi tidak dapat dilanjutkan.");
    } finally {
      setResumingId(null);
    }
  }

  // TRUE FULL-SCREEN FOCUS MODE WHEN EXAM IS ACTIVE (Zero Sidebar / Zero Mobile Nav Distraction!)
  if (sim && sim.session.status === "in_progress" && activeBlock) {
    return (
      <SimulationFocusTunnel
        sim={sim}
        activeBlock={activeBlock}
        onSessionUpdated={(session, blocks) => {
          setSim((prev) => (prev ? { ...prev, session, blocks } : prev));
          if (session.status === "completed") {
            void loadHistory();
          }
        }}
        onExitConfirmed={() => {
          setSim(null);
          void loadHistory();
        }}
      />
    );
  }

  const inProgressSession = history.find((h) => h.status === "in_progress") ?? null;

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="pb-4 border-b border-[var(--border-structural)] space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
            <SimulationIcon size={18} />
            <span>Simulator UTBK-SNBT · Focus Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tryout & Kalibrasi Skor IRT</h1>
          <p className="text-sm font-semibold text-[var(--ink-secondary)] max-w-2xl">
            Begitu mulai, layar otomatis masuk ke Focus Mode penuh (tanpa sidebar) dengan timer server, navigasi nomor soal, tanda ragu-ragu, kertas coretan, dan penguncian blok subtes resmi.
          </p>
        </header>

        {error && (
          <div className="card-tactile p-4 border-[var(--coral-border)] bg-[var(--coral-tint)] text-sm font-bold text-[var(--coral-ink)]">
            {error}
          </div>
        )}

        {/* Active Resume Banner if User Previously Exited Mid-Tryout */}
        {!sim && inProgressSession && (
          <section className="card-tactile p-5 border-[var(--ochre-border)] bg-[var(--ochre-tint)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                <TimerIcon size={15} />
                <span>Sesi Tryout Sedang Berlangsung</span>
              </div>
              <p className="text-sm font-bold text-[var(--ink-primary)]">
                {modeFriendlyLabel(inProgressSession.sessionMode)} masih aktif. Lanjutkan sebelum waktu blok habis.
              </p>
            </div>
            <button
              type="button"
              disabled={resumingId !== null}
              onClick={() => void resumeSimulation(inProgressSession.id)}
              className="btn-primary text-xs shrink-0"
            >
              <PlayIcon size={14} />
              <span>{resumingId === inProgressSession.id ? "Memuat..." : "Lanjutkan Tryout"}</span>
            </button>
          </section>
        )}

        {/* Lobby Mode Picker */}
        {!sim && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODES.map((m) => (
                <article key={m.mode} className="card-tactile p-6 flex flex-col justify-between gap-5">
                  <div className="space-y-2">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider block ${
                        m.accent === "emerald"
                          ? "text-[var(--accent-text-on-secondary)]"
                          : m.accent === "ochre"
                            ? "text-[var(--ochre-ink)]"
                            : "text-[var(--olive-ink)]"
                      }`}
                    >
                      {m.badge}
                    </span>
                    <h2 className="font-bold text-lg leading-snug">{m.title}</h2>
                    <p className="text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void startSimulation(m.mode)}
                    disabled={startingMode !== null}
                    className={m.accent === "olive" ? "btn-olive w-full" : "btn-primary w-full"}
                  >
                    <PlayIcon size={15} />
                    <span>{startingMode === m.mode ? "Menyiapkan Focus Mode..." : m.cta}</span>
                  </button>
                </article>
              ))}

              {/* 4th Mode: Custom Single-Subtest Focused Drill */}
              <article className="card-tactile p-6 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider block text-[var(--accent-text-on-secondary)]">
                      1 Subtes Pilihan · 5 Soal Fokus
                    </span>
                    <h2 className="font-bold text-lg leading-snug">Drill Subtes Spesifik</h2>
                    <p className="text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
                      Latih 1 subtes tertarget dalam Focus Mode berwaktu tanpa harus mengerjakan 7 subtes sekaligus.
                    </p>
                  </div>
                  <select
                    aria-label="Pilih subtes untuk drill"
                    value={drillSubtest}
                    onChange={(e) => setDrillSubtest(e.target.value as SnbtSubtest)}
                    className="input-tactile text-xs min-h-[42px]"
                  >
                    {SUBTEST_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => void startSimulation("subtest_drill", drillSubtest)}
                  disabled={startingMode !== null}
                  className="btn-secondary w-full"
                >
                  <TargetIcon size={16} />
                  <span>
                    {startingMode === "subtest_drill"
                      ? "Menyiapkan Focus Mode..."
                      : `Mulai Drill ${drillSubtest}`}
                  </span>
                </button>
              </article>
            </div>

            {history.length > 0 && (
              <section className="card-tactile p-5 space-y-3">
                <h2 className="font-bold text-base">Riwayat Tryout Terakhir</h2>
                <div className="divide-y divide-[var(--border-structural)] text-sm">
                  {history.slice(0, 8).map((h) => (
                    <div
                      key={h.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-extrabold">{modeFriendlyLabel(h.sessionMode)}</div>
                        <div className="text-xs font-semibold text-[var(--ink-muted)]">
                          {new Date(h.startedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" · "}
                          {h.status === "completed" ? "Selesai" : "Sedang Berlangsung"}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-num font-bold text-[var(--ink-secondary)]">
                        <span>IRT {h.estimatedIrtScore ? Math.round(h.estimatedIrtScore) : "-"}</span>
                        <span>
                          Akurasi {h.accuracyRate !== null ? `${Math.round(h.accuracyRate * 100)}%` : "-"}
                        </span>
                        {h.status === "in_progress" && (
                          <button
                            type="button"
                            onClick={() => void resumeSimulation(h.id)}
                            className="text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer"
                          >
                            Lanjut →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Detailed Post-Tryout Score & Per-Subtest Breakdown Report */}
        {sim && sim.session.status === "completed" && (
          <section className="card-tactile p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-structural)] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                  <CheckIcon size={16} />
                  <span>Tryout Selesai · {modeFriendlyLabel(sim.session.sessionMode)}</span>
                </div>
                <h2 className="text-2xl font-bold mt-1">Ringkasan Hasil & Analisis Per Subtes</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSim(null)} className="btn-secondary text-xs">
                  Pilih Mode Lain
                </button>
                <Link href="/graveyard" className="btn-primary text-xs">
                  <span>Pulihkan Soal Salah</span>
                  <ArrowRightIcon size={15} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-structural)]">
              <div className="py-3 sm:px-5 first:pl-0">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)]">Estimasi Skor IRT</span>
                <div className="text-3xl font-num font-bold text-[var(--accent-text-on-secondary)] mt-1">
                  {Math.round(sim.session.estimatedIrtScore ?? 400)}
                </div>
              </div>
              <div className="py-3 sm:px-5">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)]">Akurasi Total</span>
                <div className="text-3xl font-num font-bold text-[var(--olive-ink)] mt-1">
                  {Math.round((sim.session.accuracyRate ?? 0) * 100)}%
                </div>
              </div>
              <div className="py-3 sm:px-5">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)]">Efisiensi Triase</span>
                <div className="text-3xl font-num font-bold text-[var(--ochre-ink)] mt-1">
                  {Math.round((sim.session.triageEfficiencyScore ?? 0) * 100)}%
                </div>
              </div>
              <div className="py-3 sm:px-5">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)]">Durasi Total</span>
                <div className="text-3xl font-num font-bold text-[var(--ink-primary)] mt-1">
                  {formatDuration(sim.session.totalDurationSeconds)}
                </div>
              </div>
            </div>

            {/* Per-Subtest Breakdown */}
            <div className="space-y-3 pt-2 border-t border-[var(--border-structural)]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                Rincian Performa Per Subtes
              </h3>
              <div className="divide-y divide-[var(--border-structural)]">
                {sim.blocks.map((b) => {
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
                            {b.subtest} ·{" "}
                            {SUBTEST_OPTIONS.find((s) => s.code === b.subtest)?.name.split(" · ")[1] ??
                              b.subtest}
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
                      <div className="sm:w-28 sm:text-right font-num text-sm font-bold text-[var(--accent-text-on-secondary)] shrink-0">
                        IRT {b.subtestIrtScore ? Math.round(b.subtestIrtScore) : "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
