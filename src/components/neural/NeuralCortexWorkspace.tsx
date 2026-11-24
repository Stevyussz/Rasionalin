"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { RasionalinLogo } from "@/components/brand/RasionalinLogo";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BrainIcon,
  CloseIcon,
  DeviceMobileIcon,
  DownloadIcon,
  FlameIcon,
  ResetIcon,
  TargetIcon,
} from "@/components/icons/ArchitecturalIcons";
import type { SnbtSubtest } from "@/domain/types";
import {
  NeuralCortexCanvas,
  type LiveBrainSignal,
  type NeuralCortexCanvasHandle,
} from "./NeuralCortexCanvas";
import type {
  NeuralCortexPayload,
  NeuralFilterKey,
  NeuralTopologyMode,
  NeuronKind,
  NeuronNode,
} from "./neural-types";

const SUBTEST_FILTERS: Array<{ code: NeuralFilterKey; label: string }> = [
  { code: "ALL", label: "Semua" },
  { code: "AI", label: "AI 9Router" },
  { code: "PK", label: "PK" },
  { code: "PM", label: "PM" },
  { code: "PU", label: "PU" },
  { code: "PPU", label: "PPU" },
  { code: "PBM", label: "PBM" },
  { code: "LBI", label: "LBI" },
  { code: "LBE", label: "LBE" },
];

function kindFriendlyLabel(kind: NeuronKind): string {
  switch (kind) {
    case "output_core":
      return "Pusat Target IRT";
    case "nucleus":
      return "Nukleus Subtes";
    case "skill":
      return "Simpul Materi Skill Tree";
    case "knowledge":
      return "Neuron Pustaka Materi";
    case "template":
      return "Generator Matematika WASM";
    case "memory":
      return "Memori Hippocampus & Vault";
    case "ai_hub":
      return "Orkestrator 9Router AI";
    case "ai_tier":
      return "Mesin Routing AI";
    case "ai_model":
      return "Model AI Aktif";
  }
}

function CorticalWaveStrip({
  signalRef,
  compact = false,
}: {
  signalRef: React.MutableRefObject<LiveBrainSignal>;
  compact?: boolean;
}) {
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = 0;
    let phase = 0;

    const drawWave = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const cssW = w / dpr;
        const cssH = h / dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);

        if (!mq.matches) {
          phase += 0.085;
        }
        const sig = signalRef.current;
        const midY = cssH * 0.5;

        // Baseline hairline
        ctx.strokeStyle = "rgba(38, 217, 154, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(cssW, midY);
        ctx.stroke();

        // Alpha wave (Quantitative Emerald)
        ctx.strokeStyle = "#26D99A";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let x = 0; x <= cssW; x += 3) {
          const norm = x / Math.max(1, cssW);
          const env = Math.sin(norm * Math.PI);
          const y =
            midY +
            Math.sin(norm * 14 + phase) * (midY * 0.62 * sig.alpha) * env +
            Math.cos(norm * 23 - phase * 1.4) * (midY * 0.22) * env;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Gamma wave (Literacy & Memory Warm Gold)
        ctx.strokeStyle = "rgba(245, 188, 78, 0.9)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let x = 0; x <= cssW; x += 3) {
          const norm = x / Math.max(1, cssW);
          const env = Math.sin(norm * Math.PI);
          const y =
            midY +
            Math.cos(norm * 20 - phase * 1.35) * (midY * 0.52 * sig.gamma) * env +
            Math.sin(norm * 31 + phase * 1.8) * (midY * 0.18) * env;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      rafId = requestAnimationFrame(drawWave);
    };

    rafId = requestAnimationFrame(drawWave);
    return () => cancelAnimationFrame(rafId);
  }, [signalRef]);

  return (
    <canvas
      ref={waveCanvasRef}
      aria-hidden="true"
      className={compact ? "w-full h-7 block" : "w-full h-8 sm:h-9 block"}
    />
  );
}

export function NeuralCortexWorkspace() {
  const [payload, setPayload] = useState<NeuralCortexPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topologyMode, setTopologyMode] = useState<NeuralTopologyMode>("brain");
  const [subtestFilter, setSubtestFilter] = useState<NeuralFilterKey>("ALL");
  const [selectedNeuron, setSelectedNeuron] = useState<{
    node: NeuronNode;
    connectedCount: number;
  } | null>(null);
  const [storyMode, setStoryMode] = useState(false);
  const [snapshotNotice, setSnapshotNotice] = useState<string | null>(null);

  const canvasHandleRef = useRef<NeuralCortexCanvasHandle | null>(null);
  const signalRef = useRef<LiveBrainSignal>({
    alpha: 0.55,
    gamma: 0.5,
    firingRate: 42,
  });

  const loadNeuralCortex = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/neural");
      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error ?? "Gagal memuat data Neural Cortex.");
      }
      const data = (await res.json()) as NeuralCortexPayload;
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNeuralCortex();
  }, [loadNeuralCortex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "Escape") {
        if (storyMode) {
          setStoryMode(false);
        } else if (selectedNeuron) {
          setSelectedNeuron(null);
        }
      } else if (e.key === " " && payload) {
        e.preventDefault();
        canvasHandleRef.current?.triggerCascade(selectedNeuron?.node.id);
      } else if (e.key.toLowerCase() === "m" && payload) {
        setTopologyMode((prev) => (prev === "brain" ? "ann" : "brain"));
      } else if (e.key.toLowerCase() === "s" && payload) {
        setStoryMode((prev) => {
          if (!prev) setSelectedNeuron(null);
          return !prev;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [payload, storyMode, selectedNeuron]);

  const handleSelectNeuron = useCallback(
    (node: NeuronNode | null, connectedCount: number) => {
      if (storyMode || !node) {
        setSelectedNeuron(null);
        return;
      }
      setSelectedNeuron({ node, connectedCount });
    },
    [storyMode],
  );

  const handleSaveSnapshot = () => {
    if (!payload) return;
    const statsLine = `${payload.stats.totalQuestions} Soal · ${payload.stats.totalKnowledge} Materi · ${payload.stats.totalNodes} Node · ${payload.stats.totalTemplates} WASM · ${payload.stats.totalAiNodes} AI`;
    const dataUrl = canvasHandleRef.current?.exportStoryPng({
      displayName: payload.user.displayName,
      irt: payload.momentum.estimatedIrtComposite,
      targetScore: payload.user.targetScore,
      statsLine,
    });
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `rasionalin-neural-cortex-${topologyMode}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setSnapshotNotice("Gambar PNG tersimpan!");
    window.setTimeout(() => setSnapshotNotice(null), 2600);
  };

  if (loading) {
    return (
      <main className="h-[100dvh] w-screen bg-[#040B08] text-[#F4EFE3] flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0B2218] border border-[#26D99A]/40 flex items-center justify-center">
          <BrainIcon size={30} className="text-[#26D99A] animate-pulse" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-xl font-bold text-[#F4EFE3]">
            Mengaktifkan Neural Cortex...
          </h1>
          <p className="text-sm font-semibold text-[#A7C4B5]">
            Menghubungkan 36 skill node, 111 pustaka materi, generator WASM, dan memori belajarmu.
          </p>
        </div>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="h-[100dvh] w-screen bg-[#040B08] text-[#F4EFE3] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl bg-[#0A1A13] border border-[#F07855]/60 p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#F4EFE3]">
            Gagal Memuat Jaringan Neural
          </h1>
          <p className="text-sm font-semibold text-[#F4C2B3]">
            {error ?? "Data Neural Cortex belum tersedia."}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => void loadNeuralCortex()}
              className="px-4 min-h-[44px] rounded-xl bg-[#26D99A] text-[#04120B] font-extrabold text-sm cursor-pointer"
            >
              Coba Muat Ulang
            </button>
            <Link
              href="/"
              className="px-4 min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#2A4C3A] text-[#F4EFE3] font-bold text-sm"
            >
              <ArrowLeftIcon size={16} />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentIrt = Math.round(payload.momentum.estimatedIrtComposite);

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden select-none bg-[#040B08] text-[#F4EFE3]">
      {/* 1. Interactive 3D Living Neural & Brainwave Canvas */}
      <NeuralCortexCanvas
        ref={canvasHandleRef}
        payload={payload}
        topologyMode={topologyMode}
        subtestFilter={subtestFilter}
        selectedNeuronId={selectedNeuron?.node.id ?? null}
        storyMode={storyMode}
        signalRef={signalRef}
        onSelectNeuron={handleSelectNeuron}
      />

      {/* 2. Normal Interactive HUD Overlay */}
      {!storyMode && (
        <>
          <header className="relative z-20 pointer-events-none px-3 sm:px-5 pt-3 sm:pt-4 space-y-2.5">
            <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#07150F]/88 backdrop-blur-md border border-[#1E4230] px-2.5 sm:px-4 py-2">
              {/* Brand + Back */}
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 min-h-[44px] rounded-xl border border-[#214734] bg-[#0B1F16] text-[#D8EBE1] hover:bg-[#123022] hover:text-white text-xs font-extrabold transition-colors"
                  aria-label="Kembali ke beranda belajar"
                >
                  <ArrowLeftIcon size={15} />
                  <span className="hidden sm:inline">Kembali</span>
                </Link>

                <div className="flex items-center gap-2 min-w-0 pl-0.5">
                  <RasionalinLogo size={30} showWordmark={false} />
                  <div className="min-w-0">
                    <h1 className="font-display text-sm sm:text-base font-bold leading-tight text-[#F4EFE3] truncate">
                      Neural Cortex
                    </h1>
                    <p className="text-[11px] font-bold text-[#7ECBA9] truncate">
                      {payload.user.displayName} · IRT {currentIrt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dual-Topology Morph Toggle */}
              <div
                role="group"
                aria-label="Pilih bentuk jaringan neural"
                className="flex items-center p-1 rounded-xl bg-[#040D09] border border-[#1E4230]"
              >
                <button
                  type="button"
                  onClick={() => setTopologyMode("brain")}
                  className={`px-3 min-h-[38px] rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    topologyMode === "brain"
                      ? "bg-[#26D99A] text-[#03140C]"
                      : "text-[#B4D0C2] hover:text-white"
                  }`}
                >
                  Korteks Otak 3D
                </button>
                <button
                  type="button"
                  onClick={() => setTopologyMode("ann")}
                  className={`px-3 min-h-[38px] rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    topologyMode === "ann"
                      ? "bg-[#F5BC4E] text-[#171104]"
                      : "text-[#B4D0C2] hover:text-white"
                  }`}
                >
                  Neural Network ANN
                </button>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => canvasHandleRef.current?.triggerCascade(selectedNeuron?.node.id)}
                  className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-[#102B1E] hover:bg-[#173D2B] border border-[#26D99A]/45 text-[#52F2B8] text-xs font-extrabold transition-colors cursor-pointer"
                  title="Pintasan: Spasi"
                >
                  <FlameIcon size={16} />
                  <span className="hidden md:inline">Tembak Sinyal</span>
                </button>

                <button
                  type="button"
                  onClick={() => canvasHandleRef.current?.resetView()}
                  aria-label="Reset sudut kamera 3D"
                  title="Reset kamera"
                  className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-[#214734] bg-[#0B1F16] hover:bg-[#123022] text-[#D8EBE1] cursor-pointer"
                >
                  <ResetIcon size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedNeuron(null);
                    setStoryMode(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-[#F5BC4E] hover:bg-[#F7C769] text-[#191205] text-xs font-extrabold transition-colors cursor-pointer"
                  title="Bersihkan HUD untuk rekam IG/WA Story"
                >
                  <DeviceMobileIcon size={16} />
                  <span>Mode Story</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSnapshot}
                  aria-label="Simpan snapshot PNG"
                  className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-[#214734] bg-[#0B1F16] hover:bg-[#123022] text-[#F4EFE3] text-xs font-extrabold transition-colors cursor-pointer"
                >
                  <DownloadIcon size={16} />
                  <span className="hidden sm:inline">Simpan PNG</span>
                </button>
              </div>
            </div>

            {/* Subtest Filter Pills + Hint */}
            <div className="flex items-center justify-between gap-2">
              <div
                className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-0.5"
                role="group"
                aria-label="Filter subtes pada jaringan neuron"
              >
                {SUBTEST_FILTERS.map((item) => {
                  const active = subtestFilter === item.code;
                  const count =
                    item.code === "ALL"
                      ? payload.stats.totalQuestions
                      : item.code === "AI"
                        ? payload.stats.totalAiNodes
                        : payload.stats.bySubtest[item.code] ?? 0;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setSubtestFilter(item.code)}
                      className={`shrink-0 px-3 min-h-[38px] rounded-lg border text-xs font-extrabold transition-colors cursor-pointer ${
                        active
                          ? "bg-[#15452F] border-[#26D99A] text-[#D4FFF0]"
                          : "bg-[#07150F]/82 border-[#1D3E2D] text-[#AFCBBF] hover:text-white"
                      }`}
                    >
                      {item.label} <span className="font-mono-telemetry opacity-80">{count}</span>
                    </button>
                  );
                })}
              </div>

              {snapshotNotice && (
                <div className="pointer-events-auto px-3 py-1.5 rounded-lg bg-[#15452F] border border-[#26D99A] text-xs font-extrabold text-[#D4FFF0] shrink-0">
                  {snapshotNotice}
                </div>
              )}
            </div>
          </header>

          {/* Neuron Inspector Drawer */}
          {selectedNeuron && (
            <aside
              aria-label="Detail neuron terpilih"
              className="fixed z-30 right-3 left-3 sm:left-auto sm:right-5 bottom-[112px] sm:top-[126px] sm:bottom-auto sm:w-[340px] rounded-2xl bg-[#07150F]/94 backdrop-blur-md border border-[#26563E] p-4 space-y-3 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#113122] border border-[#26D99A]/40 text-[11px] font-extrabold text-[#52F2B8] font-mono-telemetry">
                      {selectedNeuron.node.subtest}
                    </span>
                    <span className="text-[11px] font-bold text-[#F5BC4E]">
                      {kindFriendlyLabel(selectedNeuron.node.kind)}
                    </span>
                  </div>
                  <h2 className="font-display text-base font-bold text-[#F4EFE3] leading-snug">
                    {selectedNeuron.node.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNeuron(null)}
                  aria-label="Tutup detail neuron"
                  className="inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-lg border border-[#214734] text-[#D8EBE1] hover:bg-[#123022] cursor-pointer shrink-0"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              <p className="text-xs font-semibold text-[#B9D5C7] leading-relaxed">
                {selectedNeuron.node.subtitle}
              </p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-[#0B2016] border border-[#1C3D2C] p-2">
                  <div className="text-[10px] font-bold text-[#94B6A5]">Prioritas</div>
                  <div className="font-mono-telemetry text-sm font-bold text-[#F5BC4E]">
                    Lv.{selectedNeuron.node.priorityLevel}
                  </div>
                </div>
                <div className="rounded-xl bg-[#0B2016] border border-[#1C3D2C] p-2">
                  <div className="text-[10px] font-bold text-[#94B6A5]">Mastery</div>
                  <div className="font-mono-telemetry text-sm font-bold text-[#26D99A]">
                    {selectedNeuron.node.masteryScore}%
                  </div>
                </div>
                <div className="rounded-xl bg-[#0B2016] border border-[#1C3D2C] p-2">
                  <div className="text-[10px] font-bold text-[#94B6A5]">Sinapsis</div>
                  <div className="font-mono-telemetry text-sm font-bold text-[#F4EFE3]">
                    {selectedNeuron.connectedCount}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => canvasHandleRef.current?.triggerCascade(selectedNeuron.node.id)}
                  className="px-3 min-h-[44px] rounded-xl bg-[#102B1E] border border-[#26D99A]/45 text-[#52F2B8] text-xs font-extrabold cursor-pointer hover:bg-[#173D2B]"
                >
                  Kirim Pulsa
                </button>
                {selectedNeuron.node.href && (
                  <Link
                    href={selectedNeuron.node.href}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#26D99A] hover:bg-[#3CE5A9] text-[#03140C] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Buka Materi & Latih</span>
                    <ArrowRightIcon size={14} />
                  </Link>
                )}
              </div>
            </aside>
          )}

          {/* Bottom Real Telemetry & Live EEG Cortical Wave Strip */}
          <footer className="fixed z-20 bottom-3 inset-x-3 sm:inset-x-5 pointer-events-none">
            <div className="pointer-events-auto rounded-2xl bg-[#07150F]/88 border border-[#1E4230] px-3 sm:px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-telemetry">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-[#52F2B8]">
                  <TargetIcon size={15} />
                  <span>
                    IRT {currentIrt}/{payload.user.targetScore}
                  </span>
                </span>
                <span className="text-[#F4EFE3] font-bold">
                  {payload.stats.totalNodes} Skill Node
                </span>
                <span className="text-[#F5BC4E] font-bold">
                  {payload.stats.totalKnowledge} Materi
                </span>
                <span className="text-[#D8EBE1] font-bold">
                  {payload.stats.totalQuestions} Soal
                </span>
                <span className="text-[#F07855] font-bold">
                  {payload.stats.totalTemplates} WASM
                </span>
                <span className="text-[#52F2B8] font-bold">
                  {payload.stats.totalAiNodes} AI Engine
                </span>
                <span className="text-[#FFF1C9] font-bold">
                  {payload.stats.totalMemories + payload.stats.totalVaultChunks} Memori &amp; Vault
                </span>
              </div>

              <div className="w-full md:w-[280px] lg:w-[340px] flex items-center gap-2.5 shrink-0">
                <div className="text-[10px] font-mono-telemetry uppercase tracking-wider text-[#95B9A7] shrink-0">
                  Gelombang Korteks
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CorticalWaveStrip signalRef={signalRef} />
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* 3. Clean IG/WA Story Mode Overlay (9:16 & 16:9 Ready) */}
      {storyMode && (
        <>
          <div className="fixed z-30 top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTopologyMode((prev) => (prev === "brain" ? "ann" : "brain"))}
              className="px-3.5 min-h-[44px] rounded-xl bg-[#07150F]/75 border border-[#26D99A]/40 text-[#D4FFF0] text-xs font-extrabold opacity-65 hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
            >
              {topologyMode === "brain" ? "Morph ANN" : "Morph Otak 3D"}
            </button>
            <button
              type="button"
              onClick={() => setStoryMode(false)}
              className="px-3.5 min-h-[44px] rounded-xl bg-[#07150F]/80 border border-[#F5BC4E]/50 text-[#F5BC4E] text-xs font-extrabold opacity-75 hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
            >
              Keluar Story
            </button>
          </div>

          <div className="fixed z-20 bottom-4 inset-x-4 sm:inset-x-8 pointer-events-none flex flex-col gap-2.5 rounded-2xl bg-gradient-to-t from-[#030906]/95 via-[#06130D]/80 to-transparent px-4 py-4">
            <CorticalWaveStrip signalRef={signalRef} compact />
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <RasionalinLogo size={32} showWordmark={false} />
                <div>
                  <div className="text-[11px] font-mono-telemetry font-extrabold tracking-widest text-[#26D99A]">
                    RASIONALIN · NEURAL CORTEX
                  </div>
                  <div className="font-display text-lg font-bold text-[#F4EFE3]">
                    {payload.user.displayName} · Skor IRT {currentIrt}
                  </div>
                </div>
              </div>
              <div className="font-mono-telemetry text-xs font-bold text-[#F5BC4E]">
                {payload.stats.totalQuestions} Soal · {payload.stats.totalKnowledge} Materi ·{" "}
                {payload.stats.totalNodes} Node · {payload.stats.totalTemplates} WASM ·{" "}
                {payload.stats.totalAiNodes} AI
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
