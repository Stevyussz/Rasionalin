import type { SnbtSubtest } from "@/domain/types";
import type {
  NeuralCortexPayload,
  NeuronNode,
  SynapseEdge,
  Vec3,
} from "./neural-types";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function subtestColors(subtest: SnbtSubtest): { color: string; glow: string } {
  switch (subtest) {
    case "PK":
      return { color: "#26D99A", glow: "rgba(38, 217, 154, 0.85)" };
    case "PM":
      return { color: "#4EE8B0", glow: "rgba(78, 232, 176, 0.82)" };
    case "PU":
      return { color: "#19B37D", glow: "rgba(25, 179, 125, 0.8)" };
    case "LBI":
      return { color: "#F07855", glow: "rgba(240, 120, 85, 0.85)" };
    case "LBE":
      return { color: "#F5BC4E", glow: "rgba(245, 188, 78, 0.85)" };
    case "PBM":
      return { color: "#F4EFE3", glow: "rgba(244, 239, 227, 0.78)" };
    case "PPU":
      return { color: "#D9923B", glow: "rgba(217, 146, 59, 0.82)" };
  }
}

const LOBE_CENTERS: Record<SnbtSubtest, Vec3> = {
  PK: { x: -0.66, y: 0.34, z: 0.1 },
  PM: { x: -0.54, y: 0.18, z: 0.78 },
  PU: { x: -0.54, y: 0.18, z: -0.76 },
  LBI: { x: 0.56, y: 0.22, z: 0.74 },
  LBE: { x: 0.66, y: 0.32, z: -0.04 },
  PBM: { x: 0.54, y: 0.36, z: -0.72 },
  PPU: { x: 0.68, y: -0.22, z: 0.18 },
};

const SUBTEST_ORDER: SnbtSubtest[] = ["PK", "PM", "PU", "PPU", "PBM", "LBI", "LBE"];

const SUBTEST_TITLES: Record<SnbtSubtest, string> = {
  PK: "Pengetahuan Kuantitatif",
  PM: "Penalaran Matematika",
  PU: "Penalaran Umum",
  PPU: "Pengetahuan & Pemahaman Umum",
  PBM: "Pemahaman Bacaan & Menulis",
  LBI: "Literasi Bahasa Indonesia",
  LBE: "Literasi Bahasa Inggris",
};

/**
 * Sculpts a point onto a realistic dual-hemisphere anatomical brain cortex
 * around a subtest lobe center while maintaining the median longitudinal fissure.
 */
function sculptBrainSurfacePoint(
  hemisphereSign: -1 | 1,
  lobe: Vec3,
  rand: () => number,
  radiusScale: number,
  phaseOffset: number,
): Vec3 {
  const theta = (rand() - 0.5) * Math.PI * 1.18;
  const phi = rand() * Math.PI * 2;
  const r = (0.18 + rand() * 0.28) * radiusScale;

  let x = lobe.x + Math.cos(phi) * r * 0.94;
  let y = lobe.y + Math.sin(theta) * r * 0.98;
  let z = lobe.z + Math.sin(phi) * r * 1.12;

  // Enforce longitudinal hemispheric fissure separation
  if (hemisphereSign < 0) {
    x = clamp(x, -1.22, -0.12);
  } else {
    x = clamp(x, 0.12, 1.22);
  }

  // Soft anatomical cerebral silhouette & cortical gyri folding
  const zNorm = clamp(z / 1.28, -1, 1);
  const envelopeWidth = Math.sqrt(Math.max(0.12, 1 - zNorm * zNorm * 0.68));
  const maxX = 1.18 * envelopeWidth;
  if (Math.abs(x) > maxX) {
    x = Math.sign(x) * (maxX - rand() * 0.08);
  }
  const crownY = 0.88 * Math.sqrt(Math.max(0.16, 1 - zNorm * zNorm * 0.62));
  const lowerTuck = z < -0.2 ? -0.58 : -0.66;
  y = clamp(y, lowerTuck * envelopeWidth, crownY);

  // Subtle cortical gyri surface undulation
  const fold = Math.sin(z * 5.0 + phaseOffset) * Math.cos(y * 5.2) * 0.056;
  x += Math.sign(x) * fold * 0.52;
  y += fold * 0.4;

  return { x, y, z };
}

export function buildNeuralCortexGraph(payload: NeuralCortexPayload): {
  neurons: NeuronNode[];
  edges: SynapseEdge[];
} {
  const rand = mulberry32(20270800);
  const neurons: NeuronNode[] = [];
  const neuronMap = new Map<string, NeuronNode>();

  const registerNeuron = (node: NeuronNode) => {
    neurons.push(node);
    neuronMap.set(node.id, node);
  };

  // 1. Target IRT Output Core (Prefrontal Executive Center / Final ANN Layer)
  const coreId = "core:irt-target";
  registerNeuron({
    id: coreId,
    kind: "output_core",
    subtest: "CORE",
    track: "core",
    label: `IRT ${Math.round(payload.momentum.estimatedIrtComposite)}`,
    title: `Target IRT ${payload.user.targetScore}`,
    subtitle: payload.user.targetMajor
      ? `${payload.user.displayName} | ${payload.user.targetMajor}`
      : `${payload.user.displayName} | Kombo ${payload.momentum.precisionComboCurrent}x`,
    skillNodeId: null,
    radius: 11,
    color: "#D4FFF0",
    glowColor: "rgba(38, 217, 154, 0.95)",
    priorityLevel: 10,
    masteryScore: clamp(
      Math.round((payload.momentum.estimatedIrtComposite / Math.max(400, payload.user.targetScore)) * 100),
      0,
      100,
    ),
    masteryStatus: "active",
    questionCount: payload.stats.totalQuestions,
    knowledgeCount: payload.stats.totalKnowledge,
    templateCount: payload.stats.totalTemplates,
    brainPos: { x: 0, y: 0.28, z: 1.04 },
    annLandscapePos: { x: 1.66, y: 0, z: 0 },
    annPortraitPos: { x: 0, y: 1.24, z: 0 },
    wavePhase: 0,
    waveFreq: 1.35,
    activationLevel: 0.85,
    lastFiredAt: 0,
    href: "/simulation",
  });

  // 2. 7 Subtest Nuclei (Left Hemisphere Quant / Right Hemisphere Literacy | Input Layer 0 in ANN)
  SUBTEST_ORDER.forEach((sub, idx) => {
    const palette = subtestColors(sub);
    const isQuant = sub === "PK" || sub === "PM" || sub === "PU";
    const spanT = (idx / (SUBTEST_ORDER.length - 1)) * 2 - 1; // -1..1
    const qCount = payload.stats.bySubtest[sub] ?? 0;
    const irtScore = Math.round(payload.momentum.subtestIrtScores[sub] ?? 500);

    registerNeuron({
      id: `nucleus:${sub}`,
      kind: "nucleus",
      subtest: sub,
      track: isQuant ? "quantitative" : "literacy",
      label: sub,
      title: `${sub} · ${SUBTEST_TITLES[sub]}`,
      subtitle: `${qCount} soal terverifikasi | Skor IRT ${irtScore}`,
      skillNodeId: null,
      radius: 8.4,
      color: palette.color,
      glowColor: palette.glow,
      priorityLevel: 10,
      masteryScore: clamp(Math.round((irtScore / 850) * 100), 10, 100),
      masteryStatus: "active",
      questionCount: qCount,
      knowledgeCount: payload.knowledgeNodes.filter((k) => k.subtest === sub).length,
      templateCount: payload.templateNodes.filter((t) => t.subtest === sub).length,
      brainPos: { ...LOBE_CENTERS[sub] },
      annLandscapePos: {
        x: -1.66,
        y: spanT * 0.92,
        z: Math.cos(spanT * 1.4) * 0.28,
      },
      annPortraitPos: {
        x: spanT * 0.88,
        y: -1.24,
        z: Math.cos(spanT * 1.4) * 0.24,
      },
      wavePhase: idx * 0.72,
      waveFreq: 1.1 + idx * 0.08,
      activationLevel: 0.65,
      lastFiredAt: 0,
      href: "/vault",
    });
  });

  // 3. 36 Skill Nodes (Cortical Nodes + ANN Hidden Layer 2)
  const skillCount = Math.max(1, payload.skillNodes.length);
  payload.skillNodes.forEach((sk, idx) => {
    const palette = subtestColors(sk.subtest);
    const hemi: -1 | 1 = sk.track === "quantitative" ? -1 : 1;
    const lobe = LOBE_CENTERS[sk.subtest];
    const brainPos = sculptBrainSurfacePoint(hemi, lobe, rand, 1.05, idx * 0.4);

    // ANN Layer 2: double-helix ribbon around x = -0.02 (or y = +0.02 portrait)
    const tNorm = (idx / Math.max(1, skillCount - 1)) * 2 - 1;
    const helixAngle = idx * 0.74;
    const helixRadius = 0.34 + (idx % 3) * 0.06;

    registerNeuron({
      id: sk.id,
      kind: "skill",
      subtest: sk.subtest,
      track: sk.track,
      label: sk.code,
      title: sk.titleId,
      subtitle: `${sk.subtest} · Analitica Lv.${sk.priorityLevel} · ${sk.questionCount} soal · ${sk.knowledgeCount} bab`,
      skillNodeId: sk.id,
      radius: 4.5 + (sk.priorityLevel >= 9 ? 1.2 : 0) + (sk.masteryStatus === "mastered" ? 0.9 : 0),
      color:
        sk.masteryStatus === "mastered"
          ? "#D4FFF0"
          : sk.masteryStatus === "foundation_fracture"
            ? "#FF6A4A"
            : palette.color,
      glowColor: palette.glow,
      priorityLevel: sk.priorityLevel,
      masteryScore: sk.masteryScore,
      masteryStatus: sk.masteryStatus,
      questionCount: sk.questionCount,
      knowledgeCount: sk.knowledgeCount,
      templateCount: sk.templateCount,
      brainPos,
      annLandscapePos: {
        x: -0.02 + Math.cos(helixAngle) * 0.16,
        y: tNorm * 1.02,
        z: Math.sin(helixAngle) * helixRadius,
      },
      annPortraitPos: {
        x: tNorm * 0.9,
        y: 0.02 + Math.cos(helixAngle) * 0.12,
        z: Math.sin(helixAngle) * 0.34,
      },
      wavePhase: idx * 0.31,
      waveFreq: 1.05 + (idx % 5) * 0.12,
      activationLevel: sk.masteryScore > 0 ? Math.max(0.3, sk.masteryScore / 100) : 0.25,
      lastFiredAt: 0,
      href: `/study?skillNodeId=${sk.id}&mode=lesson`,
    });
  });

  // 4. 111 Knowledge Neurons (Folded Cortical Layer + ANN Embedding Sheet Layer 1)
  const kbTotal = Math.max(1, payload.knowledgeNodes.length);
  payload.knowledgeNodes.forEach((kb, idx) => {
    const parent = neuronMap.get(kb.skillNodeId);
    const palette = subtestColors(kb.subtest);
    const hemi: -1 | 1 =
      kb.subtest === "PK" || kb.subtest === "PM" || kb.subtest === "PU" ? -1 : 1;
    const anchor = parent?.brainPos ?? LOBE_CENTERS[kb.subtest];
    const brainPos = sculptBrainSurfacePoint(hemi, anchor, rand, 0.72, idx * 0.19);

    const row = idx % 7;
    const col = Math.floor(idx / 7);
    const totalCols = Math.ceil(kbTotal / 7);
    const u = (col / Math.max(1, totalCols - 1)) * 2 - 1;
    const v = (row / 6) * 2 - 1;

    registerNeuron({
      id: `kb:${kb.id}`,
      kind: "knowledge",
      subtest: kb.subtest,
      track: hemi < 0 ? "quantitative" : "literacy",
      label: kb.chapterGroup ?? kb.subtest,
      title: kb.topicTitle,
      subtitle: `${kb.subtest} · Pustaka Materi Lv.${kb.priorityLevel}`,
      skillNodeId: kb.skillNodeId,
      radius: kb.priorityLevel >= 9 ? 2.75 : 2.1,
      color: kb.priorityLevel >= 9 ? "#F5BC4E" : palette.color,
      glowColor: palette.glow,
      priorityLevel: kb.priorityLevel,
      masteryScore: parent?.masteryScore ?? 0,
      masteryStatus: "active",
      questionCount: parent?.questionCount ?? 0,
      knowledgeCount: 1,
      templateCount: parent?.templateCount ?? 0,
      brainPos,
      annLandscapePos: {
        x: -0.86 + Math.sin(u * Math.PI) * 0.12,
        y: v * 0.92 + Math.sin(u * 2.6) * 0.09,
        z: u * 0.68,
      },
      annPortraitPos: {
        x: u * 0.88,
        y: -0.64 + v * 0.15 + Math.sin(u * 2.6) * 0.06,
        z: v * 0.36,
      },
      wavePhase: idx * 0.21,
      waveFreq: 1.25 + (idx % 7) * 0.09,
      activationLevel: kb.priorityLevel >= 9 ? 0.45 : 0.2,
      lastFiredAt: 0,
      href: `/study?skillNodeId=${kb.skillNodeId}&mode=lesson`,
    });
  });

  // 5. 24 QuickJS-WASM Math Templates (Golden Interneurons + ANN Layer 3 Top Helix)
  const tplTotal = Math.max(1, payload.templateNodes.length);
  payload.templateNodes.forEach((tpl, idx) => {
    const parent = neuronMap.get(tpl.skillNodeId);
    const tNorm = (idx / Math.max(1, tplTotal - 1)) * 2 - 1;
    const anchor = parent?.brainPos ?? LOBE_CENTERS[tpl.subtest];
    const brainPos: Vec3 = {
      x: clamp(anchor.x * 0.68 + (rand() - 0.5) * 0.14, -0.82, -0.09),
      y: clamp(anchor.y * 0.78 + 0.08 + (rand() - 0.5) * 0.14, -0.35, 0.55),
      z: clamp(anchor.z * 0.78 + (rand() - 0.5) * 0.14, -0.9, 0.9),
    };

    registerNeuron({
      id: `tpl:${tpl.id}`,
      kind: "template",
      subtest: tpl.subtest,
      track: "quantitative",
      label: "WASM",
      title: tpl.templateTitle,
      subtitle: `Generator Matematika Deterministik · QuickJS-WASM (${tpl.subtest})`,
      skillNodeId: tpl.skillNodeId,
      radius: 3.1,
      color: "#F5BC4E",
      glowColor: "rgba(245, 188, 78, 0.9)",
      priorityLevel: 9,
      masteryScore: parent?.masteryScore ?? 0,
      masteryStatus: "active",
      questionCount: 1,
      knowledgeCount: 0,
      templateCount: 1,
      brainPos,
      annLandscapePos: {
        x: 0.86 + Math.cos(idx * 0.8) * 0.08,
        y: -0.18 + tNorm * 0.66,
        z: Math.sin(idx * 0.9) * 0.38,
      },
      annPortraitPos: {
        x: tNorm * 0.82,
        y: 0.64 + Math.cos(idx * 0.9) * 0.09,
        z: Math.sin(idx * 0.9) * 0.3,
      },
      wavePhase: idx * 0.5,
      waveFreq: 1.5,
      activationLevel: 0.5,
      lastFiredAt: 0,
      href: `/study?skillNodeId=${tpl.skillNodeId}&mode=lesson`,
    });
  });

  // 6. Personal Memory & Brain Vault Nodes (Inner Hippocampus Ring)
  const memItems =
    payload.memoryNodes.length > 0
      ? payload.memoryNodes
      : Array.from({ length: 8 }, (_, idx) => ({
          id: `fsrs-anchor-${idx}`,
          kind: "memory" as const,
          subtest: SUBTEST_ORDER[idx % SUBTEST_ORDER.length],
          title: `Hippocampus FSRS (${payload.stats.dueFsrsCount} kartu aktif)`,
          pinned: true,
        }));

  memItems.forEach((mem, idx) => {
    const angle = (idx / memItems.length) * Math.PI * 2;
    registerNeuron({
      id: mem.id,
      kind: "memory",
      subtest: mem.subtest ?? "CORE",
      track: "core",
      label: mem.kind === "vault" ? "Vault" : "Memori",
      title: mem.title,
      subtitle:
        mem.kind === "vault"
          ? "Brain Vault Catatan Cepat Pribadi"
          : "Memori Konteks Tutor AI & FSRS",
      skillNodeId: null,
      radius: mem.pinned ? 3.5 : 2.8,
      color: "#FFF1C9",
      glowColor: "rgba(245, 188, 78, 0.92)",
      priorityLevel: 9,
      masteryScore: 100,
      masteryStatus: "active",
      questionCount: 0,
      knowledgeCount: 0,
      templateCount: 0,
      brainPos: {
        x: Math.cos(angle) * 0.18,
        y: -0.06 + Math.sin(angle * 2) * 0.14,
        z: Math.sin(angle) * 0.34,
      },
      annLandscapePos: {
        x: 0.88,
        y: 0.54 + Math.sin(angle) * 0.3,
        z: Math.cos(angle) * 0.34,
      },
      annPortraitPos: {
        x: Math.cos(angle) * 0.46,
        y: 0.82 + Math.sin(angle) * 0.11,
        z: Math.sin(angle) * 0.26,
      },
      wavePhase: angle,
      waveFreq: 1.65,
      activationLevel: mem.pinned ? 0.65 : 0.35,
      lastFiredAt: 0,
      href: "/vault",
    });
  });

  // =========================================================================
  // Synaptic Connections (Axons & Dendrites)
  // =========================================================================
  const edges: SynapseEdge[] = [];
  const edgeKeys = new Set<string>();

  const pushEdge = (
    from: string,
    to: string,
    kind: SynapseEdge["kind"],
    strength: number,
    color: string,
  ) => {
    if (!neuronMap.has(from) || !neuronMap.has(to) || from === to) return;
    const key = from < to ? `${from}->${to}` : `${to}->${from}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ id: key, from, to, kind, strength, color });
  };

  // A. Skill prerequisite edges (myelinated tracts)
  for (const e of payload.edges) {
    const parent = neuronMap.get(e.parentNodeId);
    pushEdge(
      e.parentNodeId,
      e.childNodeId,
      "prereq",
      0.85,
      parent?.color ?? "#26D99A",
    );
  }

  // B. Subtest Nucleus <-> Skill hubs & Skill hubs <-> Target IRT Output Core
  for (const sk of payload.skillNodes) {
    const palette = subtestColors(sk.subtest);
    pushEdge(`nucleus:${sk.subtest}`, sk.id, "nucleus", 0.72, palette.color);
    if (sk.priorityLevel >= 8 || sk.masteryStatus !== "locked") {
      pushEdge(sk.id, coreId, "commissure", 0.55, palette.color);
    }
  }

  // C. Knowledge neurons & WASM templates -> Parent Skill + neighbor associative fibers
  const kbBySubtest = new Map<string, string[]>();
  for (const kb of payload.knowledgeNodes) {
    const kbId = `kb:${kb.id}`;
    const palette = subtestColors(kb.subtest);
    pushEdge(kb.skillNodeId, kbId, "dendrite", 0.36, palette.color);
    const arr = kbBySubtest.get(kb.subtest) ?? [];
    if (arr.length > 0) {
      pushEdge(arr[arr.length - 1], kbId, "dendrite", 0.24, palette.color);
    }
    arr.push(kbId);
    kbBySubtest.set(kb.subtest, arr);
  }

  for (const tpl of payload.templateNodes) {
    pushEdge(tpl.skillNodeId, `tpl:${tpl.id}`, "nucleus", 0.58, "#F5BC4E");
    pushEdge(`tpl:${tpl.id}`, coreId, "memory_bridge", 0.42, "#F5BC4E");
  }

  // D. Memory Hippocampus ring + Corpus Callosum Quant <-> Literacy bridges
  for (let i = 0; i < memItems.length; i += 1) {
    const mem = memItems[i];
    const nextMem = memItems[(i + 1) % memItems.length];
    pushEdge(mem.id, nextMem.id, "memory_bridge", 0.5, "#F5BC4E");
    pushEdge(mem.id, coreId, "memory_bridge", 0.52, "#F5BC4E");
    const targetSub = mem.subtest ?? SUBTEST_ORDER[i % SUBTEST_ORDER.length];
    pushEdge(mem.id, `nucleus:${targetSub}`, "memory_bridge", 0.42, "#F5BC4E");
  }

  // E. Cross-hemisphere Corpus Callosum fibers (Quant <-> Literacy synergy)
  const quantSkills = payload.skillNodes.filter((s) => s.track === "quantitative");
  const litSkills = payload.skillNodes.filter((s) => s.track === "literacy");
  for (let i = 0; i < Math.min(quantSkills.length, litSkills.length); i += 2) {
    pushEdge(quantSkills[i].id, litSkills[i].id, "commissure", 0.34, "#D4FFF0");
  }

  return { neurons, edges };
}
