import type { SimulationMode, SimulationSubtestBlockEntity, SnbtSubtest } from "./types";

export interface SimulationBlockBlueprint {
  subtest: SnbtSubtest;
  questionCount: number;
  allocatedSeconds: number;
}

export type SimulationIntensity = "standard" | "official_utbk";

export const OFFICIAL_UTBK_BLUEPRINT: Record<SnbtSubtest, SimulationBlockBlueprint> = {
  PU: { subtest: "PU", questionCount: 30, allocatedSeconds: 1800 },
  PPU: { subtest: "PPU", questionCount: 20, allocatedSeconds: 900 },
  PBM: { subtest: "PBM", questionCount: 20, allocatedSeconds: 1500 },
  PK: { subtest: "PK", questionCount: 20, allocatedSeconds: 1200 },
  LBI: { subtest: "LBI", questionCount: 30, allocatedSeconds: 2550 },
  LBE: { subtest: "LBE", questionCount: 20, allocatedSeconds: 1200 },
  PM: { subtest: "PM", questionCount: 20, allocatedSeconds: 2550 },
};

const OFFICIAL_UTBK_ORDER: SnbtSubtest[] = ["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"];

export function getSimulationBlueprint(
  mode: SimulationMode,
  focusSubtest?: SnbtSubtest | null,
  intensity: SimulationIntensity = "standard",
): SimulationBlockBlueprint[] {
  if (mode === "full_tryout_utbk" && intensity === "official_utbk") {
    return OFFICIAL_UTBK_ORDER.map((sub) => OFFICIAL_UTBK_BLUEPRINT[sub]);
  }
  if (mode === "subtest_drill") {
    const targetSub: SnbtSubtest = focusSubtest ?? "PK";
    if (intensity === "official_utbk") {
      return [OFFICIAL_UTBK_BLUEPRINT[targetSub]];
    }
    const drillPreset = SIMULATION_PRESETS.subtest_drill[0];
    return [
      {
        subtest: targetSub,
        questionCount: drillPreset.questionCount,
        allocatedSeconds: drillPreset.allocatedSeconds,
      },
    ];
  }
  return SIMULATION_PRESETS[mode];
}

export const SIMULATION_PRESETS: Record<SimulationMode, SimulationBlockBlueprint[]> = {
  diagnostic_placement: [
    { subtest: "PK", questionCount: 3, allocatedSeconds: 270 },
    { subtest: "PU", questionCount: 3, allocatedSeconds: 270 },
    { subtest: "PM", questionCount: 3, allocatedSeconds: 270 },
    { subtest: "LBI", questionCount: 3, allocatedSeconds: 270 },
    { subtest: "LBE", questionCount: 3, allocatedSeconds: 270 },
  ],
  triage_sprint: [
    { subtest: "PK", questionCount: 5, allocatedSeconds: 360 },
    { subtest: "PM", questionCount: 5, allocatedSeconds: 360 },
  ],
  subtest_drill: [
    { subtest: "PK", questionCount: 10, allocatedSeconds: 900 },
  ],
  full_tryout_utbk: [
    { subtest: "PU", questionCount: 5, allocatedSeconds: 450 },
    { subtest: "PPU", questionCount: 5, allocatedSeconds: 450 },
    { subtest: "PBM", questionCount: 5, allocatedSeconds: 450 },
    { subtest: "PK", questionCount: 5, allocatedSeconds: 450 },
    { subtest: "LBI", questionCount: 5, allocatedSeconds: 450 },
    { subtest: "LBE", questionCount: 5, allocatedSeconds: 450 },
    { subtest: "PM", questionCount: 5, allocatedSeconds: 450 },
  ],
};

export const SERVER_CLOCK_GRACE_MS = 2000;

export function isBlockSubmissionAllowed(
  block: SimulationSubtestBlockEntity,
  nowMs: number,
): { allowed: boolean; reason?: string } {
  if (block.isLocked) {
    return { allowed: false, reason: "Blok subtes ini sudah terkunci permanen." };
  }
  if (!block.endsAt) {
    return { allowed: false, reason: "Blok subtes belum dimulai." };
  }
  const deadlineMs = new Date(block.endsAt).getTime() + SERVER_CLOCK_GRACE_MS;
  if (nowMs > deadlineMs) {
    return { allowed: false, reason: "Batas waktu blok subtes telah berakhir." };
  }
  return { allowed: true };
}
