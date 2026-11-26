export type AsasSubjectId = "mtk-wajib" | "mtk-lanjut" | "fisika" | "kimia" | "biologi";

export type AsasOptionKey = "A" | "B" | "C" | "D" | "E";

export interface AsasFormulaCard {
  id: string;
  title: string;
  triggerCue: string;
  formulaLatex: string;
  symbolMeaning: Array<{ symbol: string; meaning: string }>;
  commonTrap: string;
  quickExample: string;
}

export interface AsasWorkedStep {
  stepLabel: string;
  detail: string;
  math?: string;
}

export interface AsasRealLifeAnalogy {
  title: string;
  story: string;
  takeaway: string;
}

export interface AsasWorkedExample {
  title: string;
  whenToUse?: string;
  problem: string;
  steps: AsasWorkedStep[];
  finalAnswer: string;
}

export interface AsasDecisionRow {
  cue: string;
  formulaLatex: string;
  firstStep: string;
}

export interface AsasChapter {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  targetMinutes: number;
  summary: string;
  coreIntuition: string;
  analogy?: AsasRealLifeAnalogy;
  decisionGuide?: AsasDecisionRow[];
  mentalChecklist: string[];
  formulas: AsasFormulaCard[];
  workedExample: AsasWorkedExample;
  extraExamples?: AsasWorkedExample[];
}

export interface AsasOption {
  key: AsasOptionKey;
  text: string;
  isCorrect: boolean;
  trapFeedback: string;
}

export interface AsasQuestion {
  id: string;
  subjectId: AsasSubjectId;
  chapterId: string;
  difficulty: "dasar" | "ujian" | "hots";
  format: "mcq" | "statements";
  triggerTag: string;
  promptMarkdown: string;
  formulaHint: string;
  options: AsasOption[];
  correctKey: AsasOptionKey;
  stepByStep: string[];
}

export interface AsasOneDayBlock {
  id: string;
  timeSlot: string;
  title: string;
  chapterId: string | "tryout";
  goal: string;
}

export interface AsasSubject {
  id: AsasSubjectId;
  name: string;
  shortName: string;
  badge: string;
  tagline: string;
  examSpecs: string;
  priorityChapterIds?: string[];
  tryoutCount?: number;
  oneDayNote: string;
  oneDayPlan: AsasOneDayBlock[];
  chapters: AsasChapter[];
  questions: AsasQuestion[];
}
