"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { SnbtSubtest } from "@/domain/types";
import { buildNeuralCortexGraph } from "./neural-graph-builder";
import type {
  NeuralCortexPayload,
  NeuralTopologyMode,
  NeuronNode,
  Vec3,
} from "./neural-types";

export interface LiveBrainSignal {
  alpha: number;
  gamma: number;
  firingRate: number;
}

export interface NeuralCortexCanvasHandle {
  triggerCascade: (originId?: string) => void;
  resetView: () => void;
  exportStoryPng: (meta: {
    displayName: string;
    irt: number;
    targetScore: number;
    statsLine: string;
  }) => string | null;
}

interface NeuralCortexCanvasProps {
  payload: NeuralCortexPayload;
  topologyMode: NeuralTopologyMode;
  subtestFilter: SnbtSubtest | "ALL";
  selectedNeuronId: string | null;
  storyMode: boolean;
  signalRef: React.MutableRefObject<LiveBrainSignal>;
  onSelectNeuron: (neuron: NeuronNode | null, connectedCount: number) => void;
}

interface SynapticPulse {
  edgeIdx: number;
  t: number;
  speed: number;
  direction: 1 | -1;
  color: string;
  intensity: number;
}

interface ProjectedNeuron {
  neuron: NeuronNode;
  idx: number;
  sx: number;
  sy: number;
  depth: number;
  scale: number;
  visibleAlpha: number;
  highlighted: boolean;
}

interface DustParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  phase: number;
  warm: boolean;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "38, 217, 154";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "38, 217, 154";
  return `${r}, ${g}, ${b}`;
}

export const NeuralCortexCanvas = forwardRef<
  NeuralCortexCanvasHandle,
  NeuralCortexCanvasProps
>(function NeuralCortexCanvas(
  {
    payload,
    topologyMode,
    subtestFilter,
    selectedNeuronId,
    storyMode,
    signalRef,
    onSelectNeuron,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const graph = useMemo(() => buildNeuralCortexGraph(payload), [payload]);

  const adjacency = useMemo(() => {
    const map = new Map<string, Array<{ edgeIdx: number; neighborId: string }>>();
    graph.edges.forEach((edge, idx) => {
      const a = map.get(edge.from) ?? [];
      a.push({ edgeIdx: idx, neighborId: edge.to });
      map.set(edge.from, a);

      const b = map.get(edge.to) ?? [];
      b.push({ edgeIdx: idx, neighborId: edge.from });
      map.set(edge.to, b);
    });
    return map;
  }, [graph]);

  const neuronIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    graph.neurons.forEach((n, idx) => map.set(n.id, idx));
    return map;
  }, [graph]);

  const animStateRef = useRef({
    rotY: 0.42,
    rotX: 0.16,
    velY: 0,
    velX: 0,
    zoom: 1,
    morphT: topologyMode === "ann" ? 1 : 0,
    targetMorphT: topologyMode === "ann" ? 1 : 0,
    hoveredId: null as string | null,
    dragging: false,
    dragMoved: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    pulses: [] as SynapticPulse[],
    lastProjected: [] as ProjectedNeuron[],
    reducedMotion: false,
    cascadeBoost: 0,
  });

  const propsRef = useRef({
    topologyMode,
    subtestFilter,
    selectedNeuronId,
    storyMode,
    onSelectNeuron,
  });
  propsRef.current = {
    topologyMode,
    subtestFilter,
    selectedNeuronId,
    storyMode,
    onSelectNeuron,
  };

  useEffect(() => {
    animStateRef.current.targetMorphT = topologyMode === "ann" ? 1 : 0;
  }, [topologyMode]);

  useEffect(() => {
    if (storyMode) {
      animStateRef.current.hoveredId = null;
    }
  }, [storyMode]);

  const spawnCascade = (originId?: string) => {
    const st = animStateRef.current;
    const now = performance.now();
    const fallbackPool = graph.neurons.filter(
      (n) => n.kind === "nucleus" || n.kind === "output_core",
    );
    const startNeuron =
      (originId ? graph.neurons.find((n) => n.id === originId) : undefined) ??
      fallbackPool[Math.floor(Math.random() * Math.max(1, fallbackPool.length))] ??
      graph.neurons[0];

    if (!startNeuron) return;

    st.cascadeBoost = Math.min(1, st.cascadeBoost + 0.85);
    startNeuron.activationLevel = 1;
    startNeuron.lastFiredAt = now;

    const visited = new Set<string>([startNeuron.id]);
    const hop1 = adjacency.get(startNeuron.id) ?? [];

    hop1.slice(0, 18).forEach(({ edgeIdx, neighborId }, i) => {
      const edge = graph.edges[edgeIdx];
      const dir: 1 | -1 = edge.from === startNeuron.id ? 1 : -1;
      st.pulses.push({
        edgeIdx,
        t: dir === 1 ? 0 : 1,
        speed: 0.72 + (i % 5) * 0.11,
        direction: dir,
        color: startNeuron.color,
        intensity: 1,
      });

      const nIdx = neuronIndexMap.get(neighborId);
      if (nIdx !== undefined && !visited.has(neighborId)) {
        visited.add(neighborId);
        const nb = graph.neurons[nIdx];
        nb.activationLevel = Math.max(nb.activationLevel, 0.92);
        nb.lastFiredAt = now + 220;

        const hop2 = adjacency.get(neighborId) ?? [];
        hop2.slice(0, 4).forEach(({ edgeIdx: e2Idx, neighborId: n2Id }, j) => {
          const e2 = graph.edges[e2Idx];
          const dir2: 1 | -1 = e2.from === neighborId ? 1 : -1;
          st.pulses.push({
            edgeIdx: e2Idx,
            t: dir2 === 1 ? -0.18 - j * 0.05 : 1.18 + j * 0.05,
            speed: 0.65 + (j % 3) * 0.1,
            direction: dir2,
            color: nb.color,
            intensity: 0.78,
          });
          const n2Idx = neuronIndexMap.get(n2Id);
          if (n2Idx !== undefined) {
            graph.neurons[n2Idx].lastFiredAt = now + 520;
            graph.neurons[n2Idx].activationLevel = Math.max(
              graph.neurons[n2Idx].activationLevel,
              0.7,
            );
          }
        });
      }
    });

    if (st.pulses.length > 210) {
      st.pulses = st.pulses.slice(-210);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      triggerCascade: (originId?: string) => spawnCascade(originId),
      resetView: () => {
        const st = animStateRef.current;
        st.rotY = 0.42;
        st.rotX = 0.16;
        st.velX = 0;
        st.velY = 0;
        st.zoom = 1;
      },
      exportStoryPng: ({ displayName, irt, targetScore, statsLine }) => {
        const srcCanvas = canvasRef.current;
        if (!srcCanvas) return null;
        const off = document.createElement("canvas");
        off.width = srcCanvas.width;
        off.height = srcCanvas.height;
        const ctx = off.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(srcCanvas, 0, 0);
        const w = off.width;
        const h = off.height;
        const pad = Math.round(w * 0.045);

        const grad = ctx.createLinearGradient(0, h - pad * 3.4, 0, h);
        grad.addColorStop(0, "rgba(4, 11, 8, 0)");
        grad.addColorStop(0.55, "rgba(4, 11, 8, 0.84)");
        grad.addColorStop(1, "rgba(4, 11, 8, 0.96)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, h - pad * 3.4, w, pad * 3.4);

        const titleSize = Math.max(18, Math.round(w * 0.022));
        const subSize = Math.max(13, Math.round(w * 0.015));

        ctx.fillStyle = "#26D99A";
        ctx.font = `800 ${Math.max(11, Math.round(w * 0.012))}px sans-serif`;
        ctx.fillText("RASIONALIN · NEURAL CORTEX", pad, h - pad * 1.9);

        ctx.fillStyle = "#F4EFE3";
        ctx.font = `700 ${titleSize}px sans-serif`;
        ctx.fillText(
          `${displayName} · IRT ${Math.round(irt)} / ${targetScore}`,
          pad,
          h - pad * 1.15,
        );

        ctx.fillStyle = "#F5BC4E";
        ctx.font = `600 ${subSize}px monospace`;
        ctx.fillText(statsLine, pad, h - pad * 0.52);

        return off.toDataURL("image/png");
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph, adjacency, neuronIndexMap],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    animStateRef.current.reducedMotion = mq.matches;

    const dust: DustParticle[] = Array.from({ length: 110 }, (_, i) => ({
      x: Math.sin(i * 19.31) * 2.1,
      y: Math.cos(i * 11.73) * 1.5,
      z: Math.sin(i * 7.19) * 1.9,
      size: 0.7 + (i % 4) * 0.45,
      phase: i * 0.57,
      warm: i % 3 === 0,
    }));

    animStateRef.current.pulses = Array.from({ length: 68 }, (_, i) => {
      const edgeIdx = (i * 17) % Math.max(1, graph.edges.length);
      const edge = graph.edges[edgeIdx];
      return {
        edgeIdx,
        t: (i * 0.13) % 1,
        speed: 0.24 + (i % 7) * 0.045,
        direction: i % 2 === 0 ? 1 : -1,
        color: edge?.color ?? "#26D99A",
        intensity: 0.55 + (i % 4) * 0.12,
      };
    });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let rafId = 0;
    let lastTs = performance.now();
    let autoStoryTimer = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const tSec = now * 0.001;
      const st = animStateRef.current;
      const {
        subtestFilter: activeSubtest,
        selectedNeuronId: activeSelectedId,
        storyMode: isStory,
      } = propsRef.current;

      const w = canvas.width;
      const h = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = w / dpr;
      const cssH = h / dpr;
      const isPortrait = cssH > cssW;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      st.morphT = lerp(st.morphT, st.targetMorphT, Math.min(1, dt * 4.5));
      st.cascadeBoost = Math.max(0, st.cascadeBoost - dt * 0.45);

      if (!st.dragging) {
        st.rotY += st.velY;
        st.rotX = clamp(st.rotX + st.velX, -0.78, 0.78);
        st.velY *= 0.92;
        st.velX *= 0.92;
        if (!st.reducedMotion) {
          const autoSpeed = isStory ? 0.22 : 0.085;
          if (st.morphT > 0.65 && !isStory) {
            const targetAnnYaw = Math.sin(tSec * 0.35) * 0.22;
            st.rotY = lerp(st.rotY, targetAnnYaw, dt * 1.4);
          } else {
            st.rotY += autoSpeed * dt;
          }
        }
      }

      if (isStory && !st.reducedMotion) {
        autoStoryTimer += dt;
        if (autoStoryTimer > 3.1) {
          autoStoryTimer = 0;
          spawnCascade();
        }
      }

      const activePulsesCount = st.pulses.length;
      const waveA = Math.sin(tSec * 2.2) * 0.35 + Math.cos(tSec * 3.9) * 0.25;
      const waveG = Math.cos(tSec * 4.8) * 0.3 + Math.sin(tSec * 7.3) * 0.2;
      signalRef.current = {
        alpha: clamp(0.45 + waveA * 0.4 + st.cascadeBoost * 0.45, 0.05, 1),
        gamma: clamp(0.42 + waveG * 0.38 + st.cascadeBoost * 0.55, 0.05, 1),
        firingRate: Math.round(activePulsesCount * 0.65 + st.cascadeBoost * 48),
      };

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const bgGrad = ctx.createRadialGradient(
        cssW * 0.5,
        cssH * 0.47,
        Math.min(cssW, cssH) * 0.04,
        cssW * 0.5,
        cssH * 0.5,
        Math.max(cssW, cssH) * 0.76,
      );
      bgGrad.addColorStop(0, "#0C2117");
      bgGrad.addColorStop(0.5, "#06110C");
      bgGrad.addColorStop(1, "#020604");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      const cosY = Math.cos(st.rotY);
      const sinY = Math.sin(st.rotY);
      const cosX = Math.cos(st.rotX);
      const sinX = Math.sin(st.rotX);
      const baseFocal = isPortrait
        ? cssW * 1.06
        : Math.min(cssW * 0.72, cssH * 1.12);
      const focal = baseFocal * lerp(1, isPortrait ? 0.86 : 0.78, st.morphT) * st.zoom;
      const camDist = isPortrait ? 2.68 : 2.65;
      const centerX = cssW * 0.5;
      const centerY =
        cssH *
        lerp(isStory ? 0.44 : isPortrait ? 0.48 : 0.49, isStory ? 0.46 : 0.515, st.morphT);

      const project = (p: Vec3) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const persp = focal / Math.max(0.8, camDist + z2);
        return {
          sx: centerX + x1 * persp,
          sy: centerY + y2 * persp,
          depth: z2,
          scale: persp / focal,
        };
      };

      for (let i = 0; i < dust.length; i += 1) {
        const dp = dust[i];
        const drift = st.reducedMotion ? 0 : Math.sin(tSec * 0.5 + dp.phase) * 0.04;
        const p = project({ x: dp.x, y: dp.y + drift, z: dp.z });
        if (p.sx < -10 || p.sx > cssW + 10 || p.sy < -10 || p.sy > cssH + 10) continue;
        const alpha = clamp(0.18 - p.depth * 0.05, 0.03, 0.25);
        ctx.fillStyle = dp.warm
          ? `rgba(245, 188, 78, ${alpha})`
          : `rgba(82, 242, 184, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, dp.size * p.scale * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Faint anatomical sagittal cortical rib-arcs in Brain mode for unmistakable 3D volume
      if (st.morphT < 0.85) {
        const shellAlpha = (1 - st.morphT / 0.85) * 0.14;
        ctx.strokeStyle = `rgba(38, 217, 154, ${shellAlpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        for (const side of [-1, 1] as const) {
          for (const lat of [0.32, 0.68, 0.98]) {
            ctx.beginPath();
            const steps = 28;
            for (let s = 0; s <= steps; s += 1) {
              const ang = (s / steps) * Math.PI * 2;
              const z = Math.cos(ang) * 1.24 * (1 - lat * 0.12);
              const sinA = Math.sin(ang);
              const y =
                sinA >= 0
                  ? sinA * 0.86 * Math.sqrt(Math.max(0.2, 1 - lat * 0.35))
                  : sinA * (z < -0.1 ? 0.5 : 0.62) * Math.sqrt(Math.max(0.2, 1 - lat * 0.3));
              const x = side * (0.14 + lat * 0.96 * (0.72 + 0.28 * Math.sin((s / steps) * Math.PI)));
              const pt = project({ x, y, z });
              if (s === 0) ctx.moveTo(pt.sx, pt.sy);
              else ctx.lineTo(pt.sx, pt.sy);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      }

      if (isStory) {
        st.hoveredId = null;
      }
      const effSelectedId = isStory ? null : activeSelectedId;
      const effHoveredId = isStory ? null : st.hoveredId;
      const activeFocusId = effSelectedId ?? effHoveredId;
      const neighborSet = new Set<string>();
      if (activeFocusId) {
        neighborSet.add(activeFocusId);
        (adjacency.get(activeFocusId) ?? []).forEach((item) => neighborSet.add(item.neighborId));
      }

      const projectedList: ProjectedNeuron[] = new Array(graph.neurons.length);
      const projectedById = new Map<string, ProjectedNeuron>();
      const waveAmp = st.reducedMotion ? 0 : 1;

      for (let i = 0; i < graph.neurons.length; i += 1) {
        const n = graph.neurons[i];
        n.activationLevel = Math.max(0.16, n.activationLevel - dt * 0.28);

        const annTarget = isPortrait ? n.annPortraitPos : n.annLandscapePos;
        const bx = lerp(n.brainPos.x, annTarget.x, st.morphT);
        const by = lerp(n.brainPos.y, annTarget.y, st.morphT);
        const bz = lerp(n.brainPos.z, annTarget.z, st.morphT);

        const waveX = Math.sin(tSec * n.waveFreq + by * 3.1 + n.wavePhase) * 0.022 * waveAmp;
        const waveY =
          Math.cos(tSec * (n.waveFreq * 0.85) + bx * 2.8 + bz * 1.7) * 0.028 * waveAmp;
        const waveZ = Math.sin(tSec * 1.15 + bx * 2.4 + n.wavePhase) * 0.02 * waveAmp;

        const p = project({ x: bx + waveX, y: by + waveY, z: bz + waveZ });

        const matchesSubtest =
          activeSubtest === "ALL" ||
          n.subtest === activeSubtest ||
          n.subtest === "CORE" ||
          n.kind === "memory";
        const matchesFocus = !activeFocusId || neighborSet.has(n.id);

        let visibleAlpha = clamp(0.88 - p.depth * 0.22, 0.18, 1);
        if (!matchesSubtest) visibleAlpha *= 0.14;
        else if (activeFocusId && !matchesFocus) visibleAlpha *= 0.24;

        const proj: ProjectedNeuron = {
          neuron: n,
          idx: i,
          sx: p.sx,
          sy: p.sy,
          depth: p.depth,
          scale: p.scale,
          visibleAlpha,
          highlighted: Boolean(activeFocusId && neighborSet.has(n.id)),
        };
        projectedList[i] = proj;
        projectedById.set(n.id, proj);
      }
      st.lastProjected = projectedList;

      const edgeMidCache = new Array<{ mx: number; my: number }>(graph.edges.length);

      for (let i = 0; i < graph.edges.length; i += 1) {
        const edge = graph.edges[i];
        const a = projectedById.get(edge.from);
        const b = projectedById.get(edge.to);
        if (!a || !b) continue;

        const dx = b.sx - a.sx;
        const dy = b.sy - a.sy;
        const dist = Math.hypot(dx, dy) || 1;
        const bend =
          (edge.kind === "commissure" ? 0.18 : 0.12) *
          dist *
          (i % 2 === 0 ? 1 : -1) *
          (1 + Math.sin(tSec * 1.4 + i * 0.4) * 0.15 * waveAmp);
        const nx = -dy / dist;
        const ny = dx / dist;
        const mx = (a.sx + b.sx) * 0.5 + nx * bend;
        const my = (a.sy + b.sy) * 0.5 + ny * bend;
        edgeMidCache[i] = { mx, my };

        const subMatch =
          activeSubtest === "ALL" ||
          a.neuron.subtest === activeSubtest ||
          b.neuron.subtest === activeSubtest;
        const focusMatch =
          !activeFocusId || a.neuron.id === activeFocusId || b.neuron.id === activeFocusId;

        let baseAlpha = edge.kind === "prereq" ? 0.34 : edge.kind === "nucleus" ? 0.24 : 0.12;
        if (!subMatch) baseAlpha *= 0.12;
        else if (activeFocusId && !focusMatch) baseAlpha *= 0.16;
        else if (activeFocusId && focusMatch) baseAlpha = Math.min(0.85, baseAlpha * 2.5);

        const depthFactor = clamp(1 - (a.depth + b.depth) * 0.2, 0.25, 1);
        const alpha = baseAlpha * depthFactor;
        if (alpha < 0.018) continue;

        ctx.strokeStyle = `rgba(${hexToRgb(edge.color)}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = focusMatch && activeFocusId ? 1.7 : edge.kind === "prereq" ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.quadraticCurveTo(mx, my, b.sx, b.sy);
        ctx.stroke();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (let i = st.pulses.length - 1; i >= 0; i -= 1) {
        const pulse = st.pulses[i];
        pulse.t += pulse.speed * pulse.direction * dt * (st.reducedMotion ? 0.2 : 1);

        if (pulse.t > 1.05 || pulse.t < -0.05) {
          if (st.pulses.length > 72) {
            st.pulses.splice(i, 1);
            continue;
          }
          const nextIdx = (pulse.edgeIdx + 23) % Math.max(1, graph.edges.length);
          const nextEdge = graph.edges[nextIdx];
          pulse.edgeIdx = nextIdx;
          pulse.direction = Math.random() > 0.5 ? 1 : -1;
          pulse.t = pulse.direction === 1 ? 0 : 1;
          pulse.color = nextEdge?.color ?? "#26D99A";
          pulse.intensity = 0.6;
        }

        const ct = clamp(pulse.t, 0, 1);
        const edge = graph.edges[pulse.edgeIdx];
        if (!edge) continue;
        const a = projectedById.get(edge.from);
        const b = projectedById.get(edge.to);
        const mid = edgeMidCache[pulse.edgeIdx];
        if (!a || !b || !mid) continue;

        if (
          activeSubtest !== "ALL" &&
          a.neuron.subtest !== activeSubtest &&
          b.neuron.subtest !== activeSubtest
        ) {
          continue;
        }

        const inv = 1 - ct;
        const px = inv * inv * a.sx + 2 * inv * ct * mid.mx + ct * ct * b.sx;
        const py = inv * inv * a.sy + 2 * inv * ct * mid.my + ct * ct * b.sy;

        const tailT = clamp(ct - 0.08 * pulse.direction, 0, 1);
        const invT = 1 - tailT;
        const tx = invT * invT * a.sx + 2 * invT * tailT * mid.mx + tailT * tailT * b.sx;
        const ty = invT * invT * a.sy + 2 * invT * tailT * mid.my + tailT * tailT * b.sy;

        const rgb = hexToRgb(pulse.color);
        const pAlpha = clamp(
          pulse.intensity * ((a.visibleAlpha + b.visibleAlpha) * 0.5),
          0.1,
          0.95,
        );

        ctx.strokeStyle = `rgba(${rgb}, ${(pAlpha * 0.85).toFixed(3)})`;
        ctx.lineWidth = 2.1 * pulse.intensity;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = `rgba(244, 255, 248, ${pAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.2 * pulse.intensity, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const sorted = [...projectedList].sort((p1, p2) => p2.depth - p1.depth);

      for (let i = 0; i < sorted.length; i += 1) {
        const pn = sorted[i];
        const n = pn.neuron;
        const r = Math.max(1.5, n.radius * pn.scale);
        const isSelected = n.id === effSelectedId;
        const isHovered = n.id === effHoveredId;
        const rgb = hexToRgb(n.color);

        const timeSinceFire = now - n.lastFiredAt;
        if (n.lastFiredAt > 0 && timeSinceFire >= 0 && timeSinceFire < 850) {
          const prog = timeSinceFire / 850;
          const ringR = r + prog * (n.kind === "nucleus" ? 28 : 16);
          const ringAlpha = (1 - prog) * 0.72 * pn.visibleAlpha;
          ctx.strokeStyle = `rgba(${rgb}, ${ringAlpha.toFixed(3)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(pn.sx, pn.sy, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (
          n.kind === "nucleus" ||
          n.kind === "output_core" ||
          isSelected ||
          isHovered ||
          n.activationLevel > 0.65
        ) {
          const glowR = r * (isSelected || n.kind === "output_core" ? 4.2 : 2.8);
          const halo = ctx.createRadialGradient(pn.sx, pn.sy, r * 0.2, pn.sx, pn.sy, glowR);
          halo.addColorStop(0, `rgba(${rgb}, ${(0.55 * pn.visibleAlpha).toFixed(3)})`);
          halo.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(pn.sx, pn.sy, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${rgb}, ${pn.visibleAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pn.sx, pn.sy, isSelected || isHovered ? r * 1.4 : r, 0, Math.PI * 2);
        ctx.fill();

        if (n.kind === "nucleus" || n.kind === "output_core" || isSelected) {
          ctx.fillStyle = `rgba(255, 253, 245, ${(0.9 * pn.visibleAlpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(pn.sx, pn.sy, r * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }

        if (isSelected) {
          ctx.strokeStyle = "#F5BC4E";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pn.sx, pn.sy, r * 1.9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.textBaseline = "middle";
      const placedBoxes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
      const labelPriorityOrder = [...sorted].sort((a, b) => {
        const score = (pn: ProjectedNeuron) =>
          pn.neuron.id === effSelectedId || pn.neuron.id === effHoveredId
            ? 3
            : pn.neuron.kind === "output_core"
              ? 2
              : pn.neuron.kind === "nucleus"
                ? 1
                : 0;
        return score(b) - score(a) || a.depth - b.depth;
      });

      for (let i = 0; i < labelPriorityOrder.length; i += 1) {
        const pn = labelPriorityOrder[i];
        const n = pn.neuron;
        const isSelected = n.id === effSelectedId;
        const isHovered = n.id === effHoveredId;
        const showLabel =
          n.kind === "output_core" ||
          (n.kind === "nucleus" && pn.visibleAlpha > 0.34) ||
          isSelected ||
          isHovered;
        if (!showLabel) continue;

        const text =
          isSelected || isHovered
            ? n.title.length > 32
              ? `${n.title.slice(0, 30)}..`
              : n.title
            : n.label;
        ctx.font =
          n.kind === "output_core" || isSelected || isHovered
            ? "700 12px 'Nunito Variable', sans-serif"
            : "800 10.5px 'IBM Plex Mono', monospace";
        const tw = ctx.measureText(text).width;
        const padX = n.kind === "nucleus" ? 5.5 : 7;
        const boxW = tw + padX * 2;
        const boxH = n.kind === "nucleus" ? 19 : 21;
        const lx = clamp(pn.sx - boxW * 0.5, 8, cssW - boxW - 8);
        let ly = clamp(pn.sy - n.radius * pn.scale - 21, 8, cssH - boxH - 8);

        const overlaps = (yTry: number) =>
          placedBoxes.some(
            (b) => lx < b.x2 + 4 && lx + boxW > b.x1 - 4 && yTry < b.y2 + 3 && yTry + boxH > b.y1 - 3,
          );

        if (overlaps(ly)) {
          const offsets = [24, -22, 46, -44];
          let resolved = false;
          for (const dy of offsets) {
            const candidate = clamp(ly + dy, 8, cssH - boxH - 8);
            if (!overlaps(candidate)) {
              ly = candidate;
              resolved = true;
              break;
            }
          }
          if (!resolved && !isSelected && !isHovered && n.kind !== "output_core") {
            continue;
          }
        }
        placedBoxes.push({ x1: lx, y1: ly, x2: lx + boxW, y2: ly + boxH });

        ctx.fillStyle = "rgba(6, 17, 12, 0.84)";
        ctx.strokeStyle =
          isSelected || n.kind === "output_core"
            ? "rgba(245, 188, 78, 0.78)"
            : "rgba(38, 217, 154, 0.48)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(lx, ly, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#F4EFE3";
        ctx.fillText(text, lx + padX, ly + boxH * 0.5 + 0.5);
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [graph, adjacency, neuronIndexMap, signalRef]);

  const findNearestNeuron = (clientX: number, clientY: number): NeuronNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let best: ProjectedNeuron | null = null;
    let bestDist = 28;
    for (const pn of animStateRef.current.lastProjected) {
      if (pn.visibleAlpha < 0.2) continue;
      const d = Math.hypot(pn.sx - x, pn.sy - y);
      const priorityBias = pn.neuron.kind === "nucleus" || pn.neuron.kind === "skill" ? 4 : 0;
      if (d - priorityBias < bestDist) {
        bestDist = d - priorityBias;
        best = pn;
      }
    }
    return best?.neuron ?? null;
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        aria-label="Visualisasi 3D interaktif jaringan neuron materi, soal, WASM, dan memori Rasionalin"
        className="block w-full h-full touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          const st = animStateRef.current;
          st.dragging = true;
          st.dragMoved = 0;
          st.lastPointerX = e.clientX;
          st.lastPointerY = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const st = animStateRef.current;
          if (st.dragging) {
            const dx = e.clientX - st.lastPointerX;
            const dy = e.clientY - st.lastPointerY;
            st.dragMoved += Math.hypot(dx, dy);
            st.rotY += dx * 0.0075;
            st.rotX = clamp(st.rotX + dy * 0.0065, -0.78, 0.78);
            st.velY = dx * 0.003;
            st.velX = dy * 0.0025;
            st.lastPointerX = e.clientX;
            st.lastPointerY = e.clientY;
            return;
          }
          const hit = findNearestNeuron(e.clientX, e.clientY);
          st.hoveredId = hit?.id ?? null;
        }}
        onPointerUp={(e) => {
          const st = animStateRef.current;
          st.dragging = false;
          if (st.dragMoved < 7) {
            const hit = findNearestNeuron(e.clientX, e.clientY);
            if (hit) {
              spawnCascade(hit.id);
              onSelectNeuron(hit, (adjacency.get(hit.id) ?? []).length);
            } else {
              onSelectNeuron(null, 0);
            }
          }
        }}
        onPointerCancel={() => {
          animStateRef.current.dragging = false;
        }}
        onPointerLeave={() => {
          animStateRef.current.hoveredId = null;
        }}
        onWheel={(e) => {
          const st = animStateRef.current;
          st.zoom = clamp(st.zoom - e.deltaY * 0.0008, 0.68, 1.85);
        }}
      />
    </div>
  );
});
