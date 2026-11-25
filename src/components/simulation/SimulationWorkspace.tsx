"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  PlayIcon,
  SimulationIcon,
  TargetIcon,
  TimerIcon,
} from "@/components/icons/ArchitecturalIcons";
import { AppShell } from "@/components/layout/AppShell";
import { OFFICIAL_UTBK_BLUEPRINT, type SimulationIntensity } from "@/domain/simulation-rules";
import {
  SimulationFocusTunnel,
  type ActiveSimPayload,
} from "@/components/simulation/SimulationFocusTunnel";
import { SimulationReviewPanel } from "@/components/simulation/SimulationReviewPanel";
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
    badge: "5 Subtes · 15 Soal",
    title: "Diagnostik Penempatan Awal",
    desc: "Petakan materi dasar yang perlu diperbaiki lintas PK, PU, PM, LBI, dan LBE sekaligus ukur skor IRT awalmu.",
    cta: "Mulai Diagnostik",
    accent: "emerald",
  },
  {
    mode: "triage_sprint",
    badge: "PK & PM · 10 Soal Refleks",
    title: "Sprint Triase Cepat",
    desc: "Latih keputusan cepat antara mengerjakan soal sekarang atau melewati cerdas pada blok kuantitatif.",
    cta: "Mulai Sprint Triase",
    accent: "ochre",
  },
  {
    mode: "full_tryout_utbk",
    badge: "7 Subtes Resmi · 35 Soal Terkunci",
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

export function SimulationWorkspace() {
  const [sim, setSim] = useState<ActiveSimPayload | null>(null);
  const [history, setHistory] = useState<SimulationSessionEntity[]>([]);
  const [drillSubtest, setDrillSubtest] = useState<SnbtSubtest>("PK");
  const [tryoutIntensity, setTryoutIntensity] = useState<SimulationIntensity>("standard");
  const [drillIntensity, setDrillIntensity] = useState<SimulationIntensity>("standard");
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

  async function startSimulation(
    mode: SimulationMode,
    subtest?: SnbtSubtest,
    intensity: SimulationIntensity = "standard",
  ) {
    setStartingMode(mode);
    setError(null);
    try {
      const res = await fetch("/api/simulation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtest ? { mode, subtest, intensity } : { mode, intensity }),
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
        onSessionUpdated={(session, blocks, review) => {
          setSim((prev) =>
            prev ? { ...prev, session, blocks, review: review ?? prev.review ?? null } : prev,
          );
          if (session.status === "completed") {
            if (!review) {
              void resumeSimulation(session.id);
            }
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
  const completedHistory = [...history]
    .filter((h) => h.status === "completed" && h.estimatedIrtScore !== null)
    .reverse();
  const latestCompleted = completedHistory[completedHistory.length - 1] ?? null;
  const firstCompleted = completedHistory[0] ?? null;
  const bestIrt = completedHistory.reduce(
    (max, h) => Math.max(max, Math.round(h.estimatedIrtScore ?? 0)),
    0,
  );
  const deltaIrt =
    completedHistory.length >= 2 && latestCompleted && firstCompleted
      ? Math.round(latestCompleted.estimatedIrtScore ?? 0) -
        Math.round(firstCompleted.estimatedIrtScore ?? 0)
      : null;

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
              {MODES.map((m) => {
                const isFullTryout = m.mode === "full_tryout_utbk";
                const effectiveBadge = isFullTryout
                  ? tryoutIntensity === "official_utbk"
                    ? "7 Subtes Resmi BPPP · 160 Soal · 195 Menit"
                    : m.badge
                  : m.badge;
                const effectiveCta =
                  isFullTryout && tryoutIntensity === "official_utbk"
                    ? "Mulai Tryout Resmi 160 Soal"
                    : m.cta;

                return (
                  <article key={m.mode} className="card-tactile p-6 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
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
                          {effectiveBadge}
                        </span>
                        <h2 className="font-bold text-lg leading-snug">{m.title}</h2>
                        <p className="text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
                          {m.desc}
                        </p>
                      </div>

                      {isFullTryout && (
                        <div
                          className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-structural)]"
                          role="group"
                          aria-label="Pilih intensitas Tryout Penuh"
                        >
                          <button
                            type="button"
                            onClick={() => setTryoutIntensity("standard")}
                            className={`px-2.5 py-2 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer ${
                              tryoutIntensity === "standard"
                                ? "bg-[var(--surface-elevated)] text-[var(--ink-primary)] border border-[var(--border-structural)] shadow-sm"
                                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                            }`}
                          >
                            Ringkas (35 soal / 52m)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTryoutIntensity("official_utbk")}
                            className={`px-2.5 py-2 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer ${
                              tryoutIntensity === "official_utbk"
                                ? "bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)] border border-[var(--accent-primary)] shadow-sm"
                                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                            }`}
                          >
                            UTBK Resmi (160 soal / 195m)
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void startSimulation(
                          m.mode,
                          undefined,
                          isFullTryout ? tryoutIntensity : "standard",
                        )
                      }
                      disabled={startingMode !== null}
                      className={m.accent === "olive" ? "btn-olive w-full" : "btn-primary w-full"}
                    >
                      <PlayIcon size={15} />
                      <span>
                        {startingMode === m.mode ? "Menyiapkan Focus Mode..." : effectiveCta}
                      </span>
                    </button>
                  </article>
                );
              })}

              {/* 4th Mode: Custom Single-Subtest Focused Drill */}
              {(() => {
                const officialBlock = OFFICIAL_UTBK_BLUEPRINT[drillSubtest];
                const officialMins = Math.round(officialBlock.allocatedSeconds / 60);
                const drillBadge =
                  drillIntensity === "official_utbk"
                    ? `Standar UTBK Resmi · ${officialBlock.questionCount} Soal · ${officialMins} Menit`
                    : "1 Subtes Pilihan · 10 Soal · 15 Menit";

                return (
                  <article className="card-tactile p-6 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <span className="text-xs font-extrabold uppercase tracking-wider block text-[var(--accent-text-on-secondary)]">
                          {drillBadge}
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
                      <div
                        className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-structural)]"
                        role="group"
                        aria-label="Pilih intensitas Drill Subtes"
                      >
                        <button
                          type="button"
                          onClick={() => setDrillIntensity("standard")}
                          className={`px-2.5 py-2 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer ${
                            drillIntensity === "standard"
                              ? "bg-[var(--surface-elevated)] text-[var(--ink-primary)] border border-[var(--border-structural)] shadow-sm"
                              : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                          }`}
                        >
                          Latihan Cepat (10 soal / 15m)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrillIntensity("official_utbk")}
                          className={`px-2.5 py-2 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer ${
                            drillIntensity === "official_utbk"
                              ? "bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)] border border-[var(--accent-primary)] shadow-sm"
                              : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                          }`}
                        >
                          Standar UTBK Resmi ({officialBlock.questionCount} soal / {officialMins}m)
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void startSimulation("subtest_drill", drillSubtest, drillIntensity)}
                      disabled={startingMode !== null}
                      className="btn-secondary w-full"
                    >
                      <TargetIcon size={16} />
                      <span>
                        {startingMode === "subtest_drill"
                          ? "Menyiapkan Focus Mode..."
                          : `Mulai Drill ${drillSubtest} (${drillIntensity === "official_utbk" ? `${officialBlock.questionCount} Soal` : "10 Soal"})`}
                      </span>
                    </button>
                  </article>
                );
              })()}
            </div>

            {completedHistory.length > 0 && latestCompleted && (
              <section
                className="card-tactile p-5 sm:p-6 space-y-4"
                aria-label="Tren progres skor IRT tryout"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                      Tren Progres Skor IRT
                    </div>
                    <h2 className="font-bold text-base sm:text-lg">
                      Rekam Jejak Kalibrasi ({completedHistory.length} Tryout Selesai)
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-num font-bold">
                    <div>
                      <span className="text-[var(--ink-muted)] mr-1">Terakhir:</span>
                      <span className="text-[var(--accent-text-on-secondary)]">
                        {Math.round(latestCompleted.estimatedIrtScore ?? 400)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--ink-muted)] mr-1">Tertinggi:</span>
                      <span className="text-[var(--ink-primary)]">{bestIrt}</span>
                    </div>
                    {deltaIrt !== null && (
                      <div
                        className={
                          deltaIrt >= 0
                            ? "text-[var(--accent-text-on-secondary)]"
                            : "text-[var(--coral-ink)]"
                        }
                      >
                        Tren: {deltaIrt >= 0 ? `+${deltaIrt}` : deltaIrt} poin
                      </div>
                    )}
                  </div>
                </div>

                {completedHistory.length >= 2 ? (
                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox="0 0 640 120"
                      className="w-full min-w-[320px] h-28"
                      role="img"
                      aria-label="Grafik tren skor IRT tryout"
                    >
                      {/* Target 800 line */}
                      <line
                        x1="28"
                        y1="26"
                        x2="612"
                        y2="26"
                        stroke="var(--ochre-border)"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                      <text
                        x="610"
                        y="20"
                        textAnchor="end"
                        fill="var(--ochre-ink)"
                        fontSize="10"
                        fontWeight="700"
                      >
                        Target 800
                      </text>
                      {(() => {
                        const pts = completedHistory.slice(-10);
                        const coords = pts.map((h, i) => {
                          const x =
                            pts.length === 1
                              ? 320
                              : 36 + (i * (568)) / Math.max(1, pts.length - 1);
                          const score = Math.max(250, Math.min(950, h.estimatedIrtScore ?? 400));
                          const y = 104 - ((score - 250) / 700) * 86;
                          return { x, y, score: Math.round(score) };
                        });
                        const poly = coords.map((c) => `${c.x},${c.y}`).join(" ");
                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="var(--accent-primary)"
                              strokeWidth="3"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              points={poly}
                            />
                            {coords.map((c, idx) => (
                              <g key={idx}>
                                <circle
                                  cx={c.x}
                                  cy={c.y}
                                  r="5"
                                  fill="var(--surface-elevated)"
                                  stroke="var(--accent-primary)"
                                  strokeWidth="2.5"
                                />
                                <text
                                  x={c.x}
                                  y={Math.max(12, c.y - 9)}
                                  textAnchor="middle"
                                  fill="var(--ink-primary)"
                                  fontSize="10"
                                  fontWeight="800"
                                >
                                  {c.score}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                    Selesaikan minimal 1 tryout lagi untuk melihat grafik kenaikan skor IRT-mu secara visual.
                  </p>
                )}
              </section>
            )}

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
                        {h.status === "in_progress" ? (
                          <button
                            type="button"
                            disabled={resumingId !== null}
                            onClick={() => void resumeSimulation(h.id)}
                            className="text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer"
                          >
                            {resumingId === h.id ? "Memuat..." : "Lanjut →"}
                          </button>
                        ) : h.status === "completed" ? (
                          <button
                            type="button"
                            disabled={resumingId !== null}
                            onClick={() => void resumeSimulation(h.id)}
                            className="text-[var(--olive-ink)] hover:underline cursor-pointer"
                          >
                            {resumingId === h.id ? "Membuka..." : "Lihat Pembahasan →"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Detailed Post-Tryout Score, Per-Subtest Breakdown & Question-by-Question Review */}
        {sim && sim.session.status === "completed" && (
          <SimulationReviewPanel
            session={sim.session}
            blocks={sim.blocks}
            review={sim.review ?? null}
            modeLabel={modeFriendlyLabel(sim.session.sessionMode)}
            onBackToLobby={() => {
              setSim(null);
              void loadHistory();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
