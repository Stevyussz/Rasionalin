import type {
  DifficultyTier,
  MasteryStatus,
  PedagogyTrack,
  SkillEdgeType,
  SnbtSubtest,
} from "@/domain/types";

export type NeuralTopologyMode = "brain" | "ann";

export type NeuralFilterKey = SnbtSubtest | "ALL" | "AI";

export type NeuronKind =
  | "output_core"
  | "nucleus"
  | "skill"
  | "knowledge"
  | "template"
  | "memory"
  | "ai_hub"
  | "ai_tier"
  | "ai_model";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface NeuralSkillNodeSummary {
  id: string;
  code: string;
  subtest: SnbtSubtest;
  track: PedagogyTrack;
  tier: DifficultyTier;
  titleId: string;
  masteryScore: number;
  masteryStatus: MasteryStatus;
  questionCount: number;
  knowledgeCount: number;
  templateCount: number;
  priorityLevel: number;
}

export interface NeuralKnowledgeSummary {
  id: string;
  skillNodeId: string;
  subtest: SnbtSubtest;
  topicTitle: string;
  priorityLevel: number;
  chapterGroup: string | null;
}

export interface NeuralTemplateSummary {
  id: string;
  skillNodeId: string;
  subtest: "PU" | "PK" | "PM";
  templateTitle: string;
}

export interface NeuralMemorySummary {
  id: string;
  kind: "memory" | "vault";
  subtest: SnbtSubtest | null;
  title: string;
  pinned: boolean;
}

export interface NeuralAiEngineSummary {
  id: string;
  kind: "ai_hub" | "ai_tier" | "ai_model";
  code: string;
  title: string;
  subtitle: string;
  tier: string;
  modelAlias: string;
  status: "online" | "configured" | "fallback";
  callCount: number;
  avgLatencyMs: number | null;
  linkedSubtests: SnbtSubtest[];
}

export interface NeuralCortexPayload {
  user: {
    displayName: string;
    targetScore: number;
    targetMajor: string | null;
  };
  momentum: {
    estimatedIrtComposite: number;
    precisionComboCurrent: number;
    subtestIrtScores: Record<SnbtSubtest, number>;
  };
  stats: {
    totalQuestions: number;
    totalKnowledge: number;
    totalNodes: number;
    totalTemplates: number;
    totalMemories: number;
    totalVaultChunks: number;
    totalAiNodes: number;
    liveAiModelsCount: number;
    aiCallsCount: number;
    aiOnline: boolean;
    masteredNodes: number;
    inProgressNodes: number;
    dueFsrsCount: number;
    bySubtest: Record<SnbtSubtest, number>;
  };
  skillNodes: NeuralSkillNodeSummary[];
  edges: Array<{
    parentNodeId: string;
    childNodeId: string;
    edgeType: SkillEdgeType;
  }>;
  knowledgeNodes: NeuralKnowledgeSummary[];
  templateNodes: NeuralTemplateSummary[];
  memoryNodes: NeuralMemorySummary[];
  aiNodes: NeuralAiEngineSummary[];
}

export interface NeuronNode {
  id: string;
  kind: NeuronKind;
  subtest: SnbtSubtest | "CORE" | "AI";
  track: PedagogyTrack | "core" | "ai";
  label: string;
  title: string;
  subtitle: string;
  skillNodeId: string | null;
  radius: number;
  color: string;
  glowColor: string;
  priorityLevel: number;
  masteryScore: number;
  masteryStatus: MasteryStatus | "active";
  questionCount: number;
  knowledgeCount: number;
  templateCount: number;
  brainPos: Vec3;
  annLandscapePos: Vec3;
  annPortraitPos: Vec3;
  wavePhase: number;
  waveFreq: number;
  activationLevel: number;
  lastFiredAt: number;
  href: string | null;
}

export interface SynapseEdge {
  id: string;
  from: string;
  to: string;
  kind: "prereq" | "nucleus" | "dendrite" | "commissure" | "memory_bridge" | "ai_route";
  label: string;
  strength: number;
  color: string;
}
