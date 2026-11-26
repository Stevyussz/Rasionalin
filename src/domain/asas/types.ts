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

export interface AsasChapter {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  targetMinutes: number;
  summary: string;
  coreIntuition: string;
  mentalChecklist: string[];
  formulas: AsasFormulaCard[];
  workedExample: {
    title: string;
    problem: string;
    steps: AsasWorkedStep[];
    finalAnswer: string;
  };
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
  oneDayNote: string;
  oneDayPlan: AsasOneDayBlock[];
  chapters: AsasChapter[];
  questions: AsasQuestion[];
}
