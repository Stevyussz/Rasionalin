"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BrainIcon,
  CheckIcon,
  FlameIcon,
  FractureIcon,
  NodeLockIcon,
  PlayIcon,
  ShieldIcon,
  TargetIcon,
} from "@/components/icons/ArchitecturalIcons";
import { AppShell } from "@/components/layout/AppShell";
import type { AdaptiveDailyPlan } from "@/domain/daily-plan";
import type {
  SkillNode,
  SkillPrerequisiteEdge,
  SnbtSubtest,
  UserMomentumState,
  UserSkillMastery,
} from "@/domain/types";

interface TopologyPayload {
  nodes: SkillNode[];
  edges: SkillPrerequisiteEdge[];
  masteries: UserSkillMastery[];
  momentum: UserMomentumState;
  dueFsrsCount: number;
  conceptStability: Record<string, { stability: number; retrievability: number }>;
}

const SUBTESTS: SnbtSubtest[] = ["PK", "PU", "PM", "LBI", "LBE", "PBM", "PPU"];

const SUBTEST_META: Record<SnbtSubtest, { name: string }> = {
  PK: { name: "Pengetahuan Kuantitatif" },
  PU: { name: "Penalaran Umum" },
  PM: { name: "Penalaran Matematika" },
  LBI: { name: "Literasi Bahasa Indonesia" },
  LBE: { name: "Literasi Bahasa Inggris" },
  PBM: { name: "Pemahaman Bacaan & Menulis" },
  PPU: { name: "Pengetahuan & Pemahaman Umum" },
};

type UnitTheme = "emerald" | "ochre" | "coral";

interface LearningUnit {
  unitNumber: number;
  title: string;
  subtitle: string;
  theme: UnitTheme;
  nodes: SkillNode[];
}

const WINDING_OFFSETS_PX = [0, -40, -56, -24, 24, 52, 32, 0];

function statusLabel(status: UserSkillMastery["status"]): string {
  switch (status) {
    case "locked":
      return "Terkunci";
    case "foundation_fracture":
      return "Perlu Perbaikan";
    case "in_progress":
      return "Siap Dilatih";
    case "soft_passed":
      return "Lulus Sementara";
    case "mastered":
      return "Sudah Dikuasai";
  }
}

function tierFriendlyLabel(tier: SkillNode["tier"]): string {
  switch (tier) {
    case "tier_0_foundation":
      return "Fondasi Dasar";
    case "tier_1_core":
      return "Konsep Inti";
    case "tier_2_standard":
      return "Standar UTBK";
    case "tier_3_hots_800":
      return "Tantangan 800+";
  }
}

function unitBannerClasses(theme: UnitTheme): string {
  switch (theme) {
    case "emerald":
      return "bg-[var(--accent-primary)] border-[var(--accent-bevel)] text-white";
    case "ochre":
      return "bg-[var(--ochre-fill)] border-[var(--ochre-bevel)] text-white";
    case "coral":
      return "bg-[var(--coral-fill)] border-[var(--coral-bevel)] text-white";
  }
}

export function TopologyWorkspace() {
  const [data, setData] = useState<TopologyPayload | null>(null);
  const [dailyPlan, setDailyPlan] = useState<AdaptiveDailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubtest, setSelectedSubtest] = useState<SnbtSubtest>("PK");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [openGuideUnit, setOpenGuideUnit] = useState<number | null>(null);

  const loadTopology = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [topRes, dashRes] = await Promise.all([
        fetch("/api/topology"),
        fetch("/api/dashboard"),
      ]);
      if (!topRes.ok) throw new Error("Gagal memuat jalur belajar.");
      const json = (await topRes.json()) as TopologyPayload;
      setData(json);
      if (dashRes.ok) {
        const dashJson = (await dashRes.json()) as { dailyPlan?: AdaptiveDailyPlan };
        if (dashJson.dailyPlan) setDailyPlan(dashJson.dailyPlan);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTopology();
  }, [loadTopology]);

  const masteryMap = useMemo(() => {
    const map = new Map<string, UserSkillMastery>();
    data?.masteries.forEach((m) => map.set(m.skillNodeId, m));
    return map;
  }, [data]);

  const subtestNodes = useMemo(() => {
    if (!data) return [];
    return data.nodes
      .filter((n) => n.subtest === selectedSubtest)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [data, selectedSubtest]);

  const recommendedNodeId = useMemo(() => {
    const fracture = subtestNodes.find(
      (n) => masteryMap.get(n.id)?.status === "foundation_fracture",
    );
    if (fracture) return fracture.id;
    const active = subtestNodes.find((n) => masteryMap.get(n.id)?.status === "in_progress");
    if (active) return active.id;
    const soft = subtestNodes.find((n) => masteryMap.get(n.id)?.status === "soft_passed");
    if (soft) return soft.id;
    return subtestNodes[0]?.id ?? null;
  }, [subtestNodes, masteryMap]);

  useEffect(() => {
    if (recommendedNodeId) {
      setSelectedNodeId((prev) =>
        prev && subtestNodes.some((n) => n.id === prev) ? prev : recommendedNodeId,
      );
    }
  }, [recommendedNodeId, subtestNodes]);

  const units: LearningUnit[] = useMemo(() => {
    const u1 = subtestNodes.filter((n) => n.tier === "tier_0_foundation");
    const u2 = subtestNodes.filter((n) => n.tier === "tier_1_core" || n.tier === "tier_2_standard");
    const u3 = subtestNodes.filter((n) => n.tier === "tier_3_hots_800");

    const built: LearningUnit[] = [];
    if (u1.length > 0) {
      built.push({
        unitNumber: built.length + 1,
        title: "Perbaikan Fondasi Dasar",
        subtitle: "Pahami konsep dari nol dengan Perisai Pemulihan aktif.",
        theme: "emerald",
        nodes: u1,
      });
    }
    if (u2.length > 0) {
      built.push({
        unitNumber: built.length + 1,
        title: "Konsep Inti & Standar UTBK",
        subtitle: "Kuasai pola soal yang paling sering keluar di ujian.",
        theme: "ochre",
        nodes: u2,
      });
    }
    if (u3.length > 0) {
      built.push({
        unitNumber: built.length + 1,
        title: "Tantangan HOTS 800+",
        subtitle: "Soal penalaran tingkat lanjut untuk mengamankan skor puncak.",
        theme: "coral",
        nodes: u3,
      });
    }
    return built;
  }, [subtestNodes]);

  const selectedNode = useMemo(() => {
    return subtestNodes.find((n) => n.id === selectedNodeId) ?? subtestNodes[0] ?? null;
  }, [subtestNodes, selectedNodeId]);

  const selectedMastery = selectedNode ? masteryMap.get(selectedNode.id) : undefined;

  const summaryCounts = useMemo(() => {
    const list = data?.masteries ?? [];
    return {
      mastered: list.filter((m) => m.status === "mastered").length,
      total: list.length,
    };
  }, [data]);

  const rightRailContent = data ? (
    <>
      {/* 1. Compact Single-Layer Momentum Card */}
      <section className="card-tactile p-4 space-y-3" aria-label="Ringkasan momentum belajar">
        <div className="grid grid-cols-3 divide-x divide-[var(--border-structural)] text-center">
          <div className="px-1.5">
            <div className="inline-flex items-center justify-center gap-1 text-[var(--ochre-ink)] font-num font-bold text-lg">
              <FlameIcon size={18} />
              <span>{data.momentum.precisionComboCurrent}x</span>
            </div>
            <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Kombo</div>
          </div>

          <div className="px-1.5">
            <div className="inline-flex items-center justify-center gap-1 text-[var(--accent-primary)] font-num font-bold text-lg">
              <ShieldIcon size={18} />
              <span>{data.momentum.tier0RecoveryShieldsRemaining}</span>
            </div>
            <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Perisai</div>
          </div>

          <div className="px-1.5">
            <div className="inline-flex items-center justify-center gap-1 text-[var(--olive-ink)] font-num font-bold text-lg">
              <TargetIcon size={18} />
              <span>{Math.round(data.momentum.estimatedIrtComposite)}</span>
            </div>
            <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Skor IRT</div>
          </div>
        </div>

        <div className="space-y-1.5 pt-2.5 border-t border-[var(--border-structural)]">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-[var(--ink-secondary)]">Progres Target 800+</span>
            <span className="font-num text-[var(--accent-text-on-secondary)]">
              {summaryCounts.mastered}/{summaryCounts.total} tuntas
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{
                width: `${Math.max(8, Math.min(100, ((data.momentum.estimatedIrtComposite - 200) / 800) * 100))}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. Selected Node Detail Card (Responsive & Unclipped on Standard Laptop Heights) */}
      {selectedNode && (
        <section className="card-tactile p-4 space-y-3" aria-label="Detail materi terpilih">
          <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold">
            <span className="uppercase tracking-wider text-[var(--ink-muted)]">
              {tierFriendlyLabel(selectedNode.tier)}
            </span>
            {selectedNode.isFoundationRepair && (
              <span className="inline-flex items-center gap-1 text-[var(--accent-text-on-secondary)]">
                <ShieldIcon size={14} />
                Perisai Aktif
              </span>
            )}
          </div>

          <div>
            <h2 className="font-bold text-base leading-snug">{selectedNode.titleId}</h2>
            <p className="text-xs font-bold text-[var(--ink-secondary)] mt-0.5">
              {statusLabel(selectedMastery?.status ?? "locked")} · Target{" "}
              <span className="font-num">{selectedNode.targetSolveSeconds}</span> dtk/soal
            </p>
          </div>

          <div className="space-y-1 pt-2.5 border-t border-[var(--border-structural)]">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-[var(--ink-secondary)]">Penguasaan Materi</span>
              <span className="font-num text-[var(--accent-text-on-secondary)]">
                {Math.round((selectedMastery?.masteryScore ?? 0) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)] transition-all"
                style={{ width: `${Math.round((selectedMastery?.masteryScore ?? 0) * 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1 pt-2.5 border-t border-[var(--border-structural)]">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
              Why Before How (Inti Konsep)
            </h3>
            <p className="text-xs sm:text-[13px] font-semibold text-[var(--ink-primary)] leading-relaxed">
              {selectedNode.firstPrinciplesSummary}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <Link
              href={`/study?skillNodeId=${selectedNode.id}&mode=lesson`}
              className="btn-primary w-full min-h-[42px] text-xs"
            >
              <BookOpenIcon size={16} />
              <span>Pelajari Materi Dulu (3 Menit)</span>
            </Link>
            <Link
              href={`/study?skillNodeId=${selectedNode.id}&mode=practice`}
              className="btn-secondary w-full min-h-[40px] text-xs"
            >
              <PlayIcon size={14} />
              <span>Langsung Latihan Soal</span>
            </Link>
            <Link
              href="/tutor"
              className="block text-center text-xs font-extrabold text-[var(--olive-ink)] hover:underline pt-0.5"
            >
              Masih bingung? Tanya AI dari nol →
            </Link>
          </div>
        </section>
      )}

      {/* 3. Compact Active Recall & Spaced Repetition Bar */}
      <section className="card-tactile p-4 space-y-2.5" aria-label="Latihan Active Recall dan FSRS">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[var(--ochre-ink)]">
            <BrainIcon size={18} />
            <h2 className="font-bold text-sm text-[var(--ink-primary)]">Active Recall (FSRS)</h2>
          </div>
          {data.dueFsrsCount > 0 && (
            <span className="font-num text-xs font-extrabold text-[var(--ochre-ink)]">
              {data.dueFsrsCount} due
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
          {data.dueFsrsCount > 0
            ? `${data.dueFsrsCount} kartu ingatan siap diuji agar materi tidak cepat lupa.`
            : "Uji ingatan aktif prinsip dasar tiap materi tanpa melihat catatan."}
        </p>
        <Link href="/graveyard" className="btn-olive w-full min-h-[40px] text-xs">
          <span>Buka Kartu Active Recall</span>
          <ArrowRightIcon size={14} />
        </Link>
      </section>
    </>
  ) : null;

  return (
    <AppShell momentum={data?.momentum} rightRail={rightRailContent}>
      {loading && (
        <div className="space-y-5" aria-busy="true" aria-label="Memuat jalur belajar">
          <div className="h-12 rounded-xl bg-[var(--surface-secondary)]" />
          <div className="h-28 rounded-xl bg-[var(--surface-secondary)]" />
          <div className="flex flex-col items-center gap-8 py-6">
            {[0, -32, 24, 0].map((off, idx) => (
              <div
                key={idx}
                style={{ transform: `translateX(${off}px)` }}
                className="w-[76px] h-[76px] rounded-full bg-[var(--surface-secondary)]"
              />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="card-tactile p-6 border-[var(--coral-border)] bg-[var(--coral-tint)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-base text-[var(--coral-ink)]">Gagal memuat jalur belajar.</h2>
            <p className="text-sm font-semibold text-[var(--ink-primary)] mt-1">{error}</p>
          </div>
          <button type="button" onClick={loadTopology} className="btn-secondary">
            Muat Ulang
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Adaptive Daily Study Plan (Rencana Belajar Harian menuju UTBK) */}
          {dailyPlan && (
            <section
              aria-label="Rencana belajar harian adaptif"
              className="card-tactile p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                    <TargetIcon size={16} />
                    <span>
                      Rencana Hari Ini
                      {dailyPlan.daysUntilExam !== null ? ` · H-${dailyPlan.daysUntilExam} UTBK` : ""}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mt-0.5">
                    3 Langkah Kecil Menuju Skor{" "}
                    <span className="font-num text-[var(--accent-primary)]">
                      {dailyPlan.targetScore}+
                    </span>
                  </h2>
                </div>
                <div className="text-xs font-extrabold text-[var(--ink-secondary)]">
                  <span className="font-num text-base text-[var(--accent-text-on-secondary)]">
                    {dailyPlan.todayCompletedCount}/{dailyPlan.todayTotalMissions}
                  </span>{" "}
                  misi selesai · Selisih{" "}
                  <span className="font-num">{dailyPlan.scoreGap}</span> poin
                </div>
              </div>

              <div className="divide-y divide-[var(--border-structural)] border-t border-[var(--border-structural)]">
                {dailyPlan.missions.map((m) => (
                  <Link
                    key={m.id}
                    href={m.href}
                    className="py-3 flex items-center justify-between gap-3 group hover:bg-[var(--surface-canvas)] -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0 mt-0.5 text-xs font-num font-bold ${
                          m.completed
                            ? "bg-[var(--accent-primary)] text-white"
                            : "bg-[var(--surface-secondary)] text-[var(--ink-secondary)]"
                        }`}
                      >
                        {m.completed ? <CheckIcon size={14} /> : m.order}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-[var(--ink-primary)] group-hover:text-[var(--accent-text-on-secondary)] truncate">
                          {m.title}
                        </div>
                        <div className="text-xs font-semibold text-[var(--ink-secondary)] truncate">
                          {m.badgeLabel} · ±{m.estimatedMinutes} menit
                        </div>
                      </div>
                    </div>
                    <ArrowRightIcon
                      size={16}
                      className="text-[var(--ink-muted)] group-hover:text-[var(--accent-primary)] shrink-0"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Subtest Switcher (Clean Flat-Structured Tabs, Zero Nested Pill-in-Pill) */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Jalur Belajar SNBT</h1>
                <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                  {SUBTEST_META[selectedSubtest].name} · Ketuk lingkaran materi untuk langsung berlatih.
                </p>
              </div>
            </div>

            <div
              className="flex sm:flex-wrap items-center gap-2 overflow-x-auto sm:overflow-visible no-scrollbar pb-1"
              role="tablist"
              aria-label="Pilih subtes UTBK-SNBT"
            >
              {SUBTESTS.map((sub) => {
                const active = selectedSubtest === sub;
                const score = Math.round(data.momentum.subtestIrtScores[sub] ?? 400);
                return (
                  <button
                    key={sub}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setSelectedSubtest(sub);
                      setOpenGuideUnit(null);
                    }}
                    className={`shrink-0 min-h-[44px] px-3.5 rounded-xl border-2 border-b-4 transition-all cursor-pointer flex items-center gap-2 text-sm font-extrabold ${
                      active
                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] border-b-[var(--accent-bevel)]"
                        : "bg-[var(--surface-elevated)] text-[var(--ink-primary)] border-[var(--border-structural)] border-b-[var(--border-bevel)] hover:bg-[var(--surface-secondary)]"
                    }`}
                  >
                    <span>{sub}</span>
                    <span
                      className={`text-xs font-num font-bold ${
                        active ? "text-white/90" : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {score}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Winding Vertical Path Grouped by Earthy-Botanical Unit Banners */}
          <div className="space-y-8">
            {units.map((unit) => {
              const guideOpen = openGuideUnit === unit.unitNumber;
              return (
                <section key={unit.unitNumber} className="space-y-6">
                  <div
                    className={`rounded-2xl border-b-4 px-5 py-4 sm:px-6 sm:py-5 flex flex-wrap items-center justify-between gap-4 ${unitBannerClasses(
                      unit.theme,
                    )}`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs font-extrabold uppercase tracking-wider opacity-90">
                        {selectedSubtest} · UNIT {unit.unitNumber}
                      </span>
                      <h2 className="text-xl font-bold leading-tight">{unit.title}</h2>
                      <p className="text-xs sm:text-sm font-semibold opacity-95">{unit.subtitle}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenGuideUnit(guideOpen ? null : unit.unitNumber)}
                      aria-expanded={guideOpen}
                      className="inline-flex items-center gap-2 px-3.5 min-h-[42px] rounded-xl bg-black/15 hover:bg-black/25 text-white border border-white/30 text-xs font-extrabold cursor-pointer transition-colors shrink-0"
                    >
                      <BookOpenIcon size={18} />
                      <span>{guideOpen ? "Tutup Panduan" : "Panduan Unit"}</span>
                    </button>
                  </div>

                  {guideOpen && (
                    <div className="card-flat p-5 space-y-3 bg-[var(--surface-secondary)]">
                      <h3 className="font-display font-bold text-sm">
                        Prinsip Why Before How · Unit {unit.unitNumber}
                      </h3>
                      <div className="divide-y divide-[var(--border-structural)]">
                        {unit.nodes.map((n) => (
                          <div key={n.id} className="py-2.5 first:pt-0 last:pb-0 space-y-0.5">
                            <div className="font-extrabold text-sm text-[var(--accent-text-on-secondary)]">
                              {n.titleId}
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
                              {n.firstPrinciplesSummary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vertical Winding Stepping-Stone Path */}
                  <div className="relative py-4 flex flex-col items-center gap-7">
                    {unit.nodes.map((node, idx) => {
                      const m = masteryMap.get(node.id);
                      const status = m?.status ?? "locked";
                      const pct = Math.round((m?.masteryScore ?? 0) * 100);
                      const isSelected = selectedNode?.id === node.id;
                      const isRecommended = node.id === recommendedNodeId;
                      const offset = WINDING_OFFSETS_PX[idx % WINDING_OFFSETS_PX.length];

                      const ringRadius = 35;
                      const ringCirc = 2 * Math.PI * ringRadius;
                      const progressRatio =
                        status === "mastered"
                          ? 1
                          : status === "soft_passed"
                            ? 0.8
                            : Math.max(0.08, m?.masteryScore ?? 0);
                      const dashOffset = ringCirc * (1 - progressRatio);

                      let nodeCircleClass =
                        "bg-[var(--surface-secondary)] text-[var(--ink-muted)] border-[var(--border-structural)] border-b-[var(--border-bevel)]";
                      if (status === "mastered") {
                        nodeCircleClass =
                          "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] border-b-[var(--accent-bevel)]";
                      } else if (status === "foundation_fracture") {
                        nodeCircleClass =
                          "bg-[var(--coral-fill)] text-white border-[var(--coral-fill)] border-b-[var(--coral-bevel)]";
                      } else if (status === "in_progress" || status === "soft_passed") {
                        nodeCircleClass =
                          unit.theme === "ochre"
                            ? "bg-[var(--ochre-fill)] text-white border-[var(--ochre-fill)] border-b-[var(--ochre-bevel)]"
                            : unit.theme === "coral"
                              ? "bg-[var(--coral-fill)] text-white border-[var(--coral-fill)] border-b-[var(--coral-bevel)]"
                              : "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] border-b-[var(--accent-bevel)]";
                      }

                      return (
                        <div
                          key={node.id}
                          style={{ transform: `translateX(${offset}px)` }}
                          className="relative flex flex-col items-center max-w-[240px]"
                        >
                          {isRecommended && (
                            <div className="node-float-pill mb-2 px-3 py-1 rounded-lg bg-[var(--surface-elevated)] border-2 border-[var(--border-structural)] shadow-[var(--shadow-popover)] text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                              {status === "foundation_fracture" ? "PERBAIKI DULU" : "LANJUTKAN"}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedNodeId(node.id)}
                            aria-label={`${node.titleId}, ${statusLabel(status)}, penguasaan ${pct}%`}
                            aria-pressed={isSelected}
                            className="relative w-[82px] h-[82px] rounded-full flex items-center justify-center cursor-pointer group focus-visible:outline-offset-4"
                          >
                            {status !== "locked" && (
                              <svg
                                className="absolute inset-0 w-[82px] h-[82px] -rotate-90 pointer-events-none"
                                viewBox="0 0 82 82"
                                aria-hidden="true"
                              >
                                <circle
                                  cx="41"
                                  cy="41"
                                  r={ringRadius}
                                  fill="none"
                                  stroke="var(--border-structural)"
                                  strokeWidth={5}
                                />
                                <circle
                                  cx="41"
                                  cy="41"
                                  r={ringRadius}
                                  fill="none"
                                  stroke={
                                    status === "foundation_fracture"
                                      ? "var(--coral-fill)"
                                      : "var(--accent-primary)"
                                  }
                                  strokeWidth={5}
                                  strokeLinecap="round"
                                  strokeDasharray={ringCirc}
                                  strokeDashoffset={dashOffset}
                                />
                              </svg>
                            )}

                            <span
                              className={`w-[64px] h-[64px] rounded-full border-2 border-b-[6px] inline-flex items-center justify-center transition-transform group-hover:scale-105 group-active:translate-y-0.5 ${nodeCircleClass} ${
                                isSelected ? "ring-4 ring-[var(--accent-tint-border)]" : ""
                              }`}
                            >
                              {status === "locked" ? (
                                <NodeLockIcon size={24} />
                              ) : status === "mastered" ? (
                                <CheckIcon size={28} />
                              ) : status === "foundation_fracture" ? (
                                <FractureIcon size={25} weight="bold" />
                              ) : (
                                <PlayIcon size={24} />
                              )}
                            </span>
                          </button>

                          <div className="mt-2 text-center space-y-0.5">
                            <div
                              className={`text-sm font-extrabold leading-snug ${
                                status === "locked"
                                  ? "text-[var(--ink-muted)]"
                                  : "text-[var(--ink-primary)]"
                              }`}
                            >
                              {node.titleId}
                            </div>
                            <div className="text-xs font-bold text-[var(--ink-secondary)]">
                              {status === "locked" ? (
                                "Terkunci"
                              ) : (
                                <>
                                  <span className="font-num">{pct}%</span> · {statusLabel(status)}
                                </>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <div className="xl:hidden mt-3 w-full space-y-1.5">
                              <Link
                                href={`/study?skillNodeId=${node.id}&mode=lesson`}
                                className="btn-primary w-full text-xs min-h-[42px]"
                              >
                                <BookOpenIcon size={15} />
                                <span>Pelajari Materi Dulu</span>
                              </Link>
                              <Link
                                href={`/study?skillNodeId=${node.id}&mode=practice`}
                                className="btn-secondary w-full text-xs min-h-[40px]"
                              >
                                <PlayIcon size={14} />
                                <span>Langsung Latihan Soal</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
