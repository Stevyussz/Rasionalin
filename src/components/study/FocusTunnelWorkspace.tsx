"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BrainIcon,
  CalculatorIcon,
  CheckIcon,
  CloseIcon,
  FlagIcon,
  FlameIcon,
  HintIcon,
  KeyboardIcon,
  MemoryIcon,
  ScratchpadIcon,
  ShieldIcon,
  SoundOffIcon,
  SoundOnIcon,
  TimerIcon,
  TutorChatIcon,
  VariantSwapIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import { ComboCelebration } from "@/components/feedback/ComboCelebration";
import { MicroLessonView } from "@/components/study/MicroLessonView";
import { ScratchpadOverlay } from "@/components/study/ScratchpadOverlay";
import { SocraticDrawer, type SocraticHintRecord } from "@/components/study/SocraticDrawer";
import { StudyNotesDrawer } from "@/components/study/StudyNotesDrawer";
import { getMicroLessonForNode, type MicroLessonContent } from "@/domain/micro-lessons";
import { getRootCauseLabelId, getTrapLabelId } from "@/domain/root-cause-rules";
import { buildSbiSchemaChoices, getSbiGuideForQuestion } from "@/domain/sbi-enrichment";
import {
  installGlobalAudioUnlock,
  isSoundEnabled,
  playCelebrationFanfare,
  playCorrectSound,
  playHintSound,
  playStreakSound,
  playTapSound,
  playWrongSound,
  setSoundEnabled,
  unlockAudioContext,
} from "@/infrastructure/audio/sound-effects";
import type {
  MistakeFractureEntity,
  PassageSentence,
  QuestionOption,
  RootCauseType,
  SbiDeconstruction,
  SkillNode,
  SnbtSubtest,
  SocraticHintLevel,
  UserMomentumState,
  UserSkillMastery,
} from "@/domain/types";

interface StudyItemPayload {
  question: {
    id: string;
    skillNodeId: string;
    subtest: string;
    track: "quantitative" | "literacy";
    tier: string;
    sourceType: string;
    stemMarkdown: string;
    stemLatex: string | null;
    passageText: string | null;
    passageSentences: PassageSentence[] | null;
    evidenceSentenceIds: string[];
    diagramAssetUrl: string | null;
    diagramAltText: string | null;
    options: QuestionOption[];
    sbiDeconstruction: SbiDeconstruction | null;
    expectedSolveSeconds: number;
    solutionStepsPreview: Array<{
      stage: string;
      title: string;
      instructionMarkdown: string;
      formulaLatex: string | null;
      masked: boolean;
    }>;
  };
  skillNode: SkillNode;
  mastery: UserSkillMastery;
  fractureContext: MistakeFractureEntity | null;
  momentum: UserMomentumState;
  selectionReason: string;
}

interface SubmitResponse {
  isCorrect: boolean;
  correctAnswerKey: "A" | "B" | "C" | "D" | "E";
  officialSolutionMarkdown: string;
  solutionSteps: Array<{
    stage: string;
    title: string;
    instructionMarkdown: string;
    formulaLatex: string | null;
  }>;
  optionsFeedback: QuestionOption[];
  evidenceSentenceIds: string[];
  mastery: UserSkillMastery;
  unlockedNodeCodes: string[];
  momentum: UserMomentumState;
  shieldConsumed: boolean;
  fracture: MistakeFractureEntity | null;
  rootCauseAnalysis: { primaryRootCause: RootCauseType; summary: string } | null;
  fsrsNextDue: string | null;
}

interface AiExplainPayload {
  whyIntuitionMarkdown: string;
  everydayAnalogy: string;
  stepByStepHow: Array<{
    stepTitle: string;
    explanationMarkdown: string;
    formulaLatex: string | null;
  }>;
  trapWatchout: string;
  activeRecallPrompt: string;
  activeRecallAnswer: string;
  sourceMode: "9router" | "deterministic_fallback";
  modelUsed: string | null;
}

interface SessionAttemptRecord {
  questionId: string;
  skillTitle: string;
  isCorrect: boolean;
  solveSeconds: number;
}

const HINT_SEQUENCE: SocraticHintLevel[] = [
  "L1_vault_nudge",
  "L2_translation_prompt",
  "L3_guided_first_step",
  "L4_first_principles_analogy",
];

const SESSION_GOAL = 5;

function fadingStageFriendly(stage: string): string {
  switch (stage) {
    case "full_worked":
      return "Panduan Penuh";
    case "missing_final_step":
      return "Latihan Langkah Akhir";
    case "missing_multi_steps":
      return "Latihan Semi-Mandiri";
    default:
      return "Mandiri";
  }
}

export function FocusTunnelWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skillNodeIdParam = searchParams.get("skillNodeId");
  const fractureIdParam = searchParams.get("fractureId");
  const questionIdParam = searchParams.get("questionId");
  const modeParam = searchParams.get("mode"); // "lesson" | "practice" | "interleaved" | null
  const isInterleavedSprint = modeParam === "interleaved";

  const [item, setItem] = useState<StudyItemPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  // Micro-Lesson First Flow (Mandatory for Beginners Starting from Zero!)
  const [phase, setPhase] = useState<"lesson" | "practice">("practice");
  const [activeLesson, setActiveLesson] = useState<MicroLessonContent | null>(null);
  const lessonCheckedRef = useRef<boolean>(false);
  const recentNodeIdsRef = useRef<string[]>([]);
  const recentQuestionIdsRef = useRef<string[]>([]);

  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | "D" | "E" | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [usedScratchpad, setUsedScratchpad] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [socraticInitialTab, setSocraticInitialTab] = useState<"chat" | "hints">("chat");
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [comboTrigger, setComboTrigger] = useState(0);

  useEffect(() => {
    installGlobalAudioUnlock();
    setSoundOn(isSoundEnabled());
    const onSoundChanged = (evt: Event) => {
      const custom = evt as CustomEvent<{ enabled?: boolean }>;
      if (typeof custom.detail?.enabled === "boolean") {
        setSoundOn(custom.detail.enabled);
      }
    };
    window.addEventListener("rasionalin:sound-changed", onSoundChanged);
    return () => window.removeEventListener("rasionalin:sound-changed", onSoundChanged);
  }, []);

  // AI "Why Before How" Explanation after submit
  const [showFullSolution, setShowFullSolution] = useState(false);
  const [aiExplain, setAiExplain] = useState<AiExplainPayload | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [recallAnswerRevealed, setRecallAnswerRevealed] = useState(false);

  // Session progress & recap
  const [sessionHistory, setSessionHistory] = useState<SessionAttemptRecord[]>([]);
  const [recapOpen, setRecapOpen] = useState(false);

  // Quantitative Bedah Soal Cerita (Polya / SBI)
  const [sbiOpen, setSbiOpen] = useState(false);
  const [selectedSbiSchema, setSelectedSbiSchema] = useState<string | null>(null);
  const [sbiChecked, setSbiChecked] = useState(false);
  const [sbiFormulaRevealed, setSbiFormulaRevealed] = useState(false);
  const [polyaVars, setPolyaVars] = useState<Record<string, string>>({});

  // Isomorphic Variant Practice ("Uji Soal Serupa Beda Angka/Cerita")
  const [generatingVariant, setGeneratingVariant] = useState(false);
  const [variantNotice, setVariantNotice] = useState<string | null>(null);
  const [variantError, setVariantError] = useState<string | null>(null);

  // Literacy Evidence-First Highlighting Gate
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [evidenceUnlocked, setEvidenceUnlocked] = useState(true);
  const [evidenceFeedback, setEvidenceFeedback] = useState<string | null>(null);
  const [checkingEvidence, setCheckingEvidence] = useState(false);

  // Socratic Hints
  const [hints, setHints] = useState<SocraticHintRecord[]>([]);
  const [loadingHint, setLoadingHint] = useState<SocraticHintLevel | null>(null);
  const [hintError, setHintError] = useState<string | null>(null);

  // Submission & Telemetry
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmitResponse | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const firstInteractionRef = useRef<number | null>(null);
  const triageDecisionRef = useRef<number | null>(null);

  const loadQuestion = useCallback(
    async (overrideParams?: {
      skillNodeId?: string | null;
      fractureId?: string | null;
      questionId?: string | null;
      keepVariantNotice?: boolean;
    }) => {
      setLoading(true);
      setError(null);
      setSelectedKey(null);
      setFlagged(false);
      setSubmission(null);
      setShowFullSolution(false);
      setAiExplain(null);
      setRecallAnswerRevealed(false);
      setHints([]);
      setHintError(null);
      setHighlightedIds([]);
      setEvidenceFeedback(null);
      setSelectedSbiSchema(null);
      setSbiChecked(false);
      setSbiFormulaRevealed(false);
      setPolyaVars({});
      setVariantError(null);
      if (!overrideParams?.keepVariantNotice) {
        setVariantNotice(null);
      }
      setUsedScratchpad(false);

      const qs = new URLSearchParams();
      const sId =
        overrideParams?.skillNodeId !== undefined ? overrideParams.skillNodeId : skillNodeIdParam;
      const fId =
        overrideParams?.fractureId !== undefined ? overrideParams.fractureId : fractureIdParam;
      const qId =
        overrideParams?.questionId !== undefined ? overrideParams.questionId : questionIdParam;
      if (isInterleavedSprint && !sId && !fId && !qId) {
        qs.set("mode", "interleaved");
        const exNodes = recentNodeIdsRef.current.slice(-2);
        const exQuestions = recentQuestionIdsRef.current.slice(-15);
        if (exNodes.length > 0) qs.set("excludeNodeIds", exNodes.join(","));
        if (exQuestions.length > 0) qs.set("excludeQuestionIds", exQuestions.join(","));
      } else {
        if (sId) qs.set("skillNodeId", sId);
        if (fId) qs.set("fractureId", fId);
        if (qId) qs.set("questionId", qId);
      }

      try {
        const res = await fetch(`/api/study/next?${qs.toString()}`);
        if (!res.ok) throw new Error("Gagal memuat soal berikutnya.");
        const payload = (await res.json()) as StudyItemPayload;
        recentNodeIdsRef.current = [...recentNodeIdsRef.current, payload.skillNode.id].slice(-2);
        recentQuestionIdsRef.current = [
          ...recentQuestionIdsRef.current,
          payload.question.id,
        ].slice(-15);
        setItem(payload);
        const nodeLesson = getMicroLessonForNode(payload.skillNode.id);
        setActiveLesson(nodeLesson);
        if (!lessonCheckedRef.current) {
          lessonCheckedRef.current = true;
          const shouldShowLesson =
            !isInterleavedSprint &&
            Boolean(nodeLesson) &&
            !fractureIdParam &&
            !questionIdParam &&
            (modeParam === "lesson" ||
              (modeParam !== "practice" && payload.mastery.masteryScore < 0.15));
          setPhase(shouldShowLesson ? "lesson" : "practice");
        }
        const requiresEvidenceGate =
          payload.question.track === "literacy" &&
          (payload.question.passageSentences?.length ?? 0) > 0 &&
          payload.question.evidenceSentenceIds.length > 0;
        setEvidenceUnlocked(!requiresEvidenceGate);
        setSbiOpen(false);
        startTimeRef.current = Date.now();
        firstInteractionRef.current = null;
        triageDecisionRef.current = null;
        setElapsedMs(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat soal.");
      } finally {
        setLoading(false);
      }
    },
    [skillNodeIdParam, fractureIdParam, questionIdParam, isInterleavedSprint, modeParam],
  );

  useEffect(() => {
    void loadQuestion();
  }, [loadQuestion]);

  useEffect(() => {
    if (loading || submission || recapOpen || phase === "lesson") return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [loading, submission, recapOpen, phase]);

  function markFirstInteraction() {
    if (firstInteractionRef.current === null) {
      firstInteractionRef.current = Date.now() - startTimeRef.current;
    }
    if (triageDecisionRef.current === null) {
      triageDecisionRef.current = Date.now() - startTimeRef.current;
    }
  }

  async function handleLoadAiExplanation() {
    if (!item || !submission) return;
    setDrawerOpen(false);
    setNotesDrawerOpen(false);
    setShowFullSolution(true);
    if (aiExplain || loadingExplain) return;
    setLoadingExplain(true);
    try {
      const res = await fetch("/api/tutor/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: item.question.id,
          selectedAnswerKey: selectedKey,
          isCorrect: submission.isCorrect,
        }),
      });
      if (res.ok) {
        setAiExplain((await res.json()) as AiExplainPayload);
      }
    } finally {
      setLoadingExplain(false);
    }
  }

  async function handleVerifyEvidence() {
    if (!item || highlightedIds.length === 0 || checkingEvidence) return;
    setCheckingEvidence(true);
    setEvidenceFeedback(null);
    markFirstInteraction();
    try {
      const res = await fetch("/api/study/evidence-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: item.question.id,
          highlightedSentenceIds: highlightedIds,
        }),
      });
      const json = (await res.json()) as { passed: boolean; feedbackMessage: string };
      setEvidenceFeedback(json.feedbackMessage);
      if (json.passed) {
        setEvidenceUnlocked(true);
      }
    } catch {
      setEvidenceFeedback("Gagal memverifikasi bukti kalimat.");
    } finally {
      setCheckingEvidence(false);
    }
  }

  const handleRequestHint = useCallback(
    async (level: SocraticHintLevel, stuckNote?: string) => {
      if (!item || loadingHint) return;
      if (hints.some((h) => h.hintLevel === level)) {
        setDrawerOpen(true);
        return;
      }
      setLoadingHint(level);
      setHintError(null);
      markFirstInteraction();
      try {
        const res = await fetch("/api/tutor/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: item.question.id,
            hintLevel: level,
            userStuckInput: stuckNote ?? null,
          }),
        });
        if (!res.ok) throw new Error("Gagal mengambil petunjuk AI.");
        const hint = (await res.json()) as SocraticHintRecord;
        setHints((prev) => [...prev, hint]);
        setDrawerOpen(true);
      } catch (err) {
        setHintError(err instanceof Error ? err.message : "Gagal memuat petunjuk.");
      } finally {
        setLoadingHint(null);
      }
    },
    [item, hints, loadingHint],
  );

  const handleSubmit = useCallback(
    async (smartSkip = false) => {
      if (!item || submitting || submission) return;
      if (!smartSkip && !selectedKey) return;
      unlockAudioContext();
      setSubmitting(true);
      const solveMs = Date.now() - startTimeRef.current;
      const maxLevel = hints.length > 0 ? hints[hints.length - 1].hintLevel : null;

      try {
        const res = await fetch("/api/study/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: item.question.id,
            attemptMode: item.fractureContext ? "fsrs_revival" : "skill_drill",
            fractureId: item.fractureContext?.id ?? null,
            selectedAnswerKey: smartSkip ? null : selectedKey,
            timeToSolveMs: solveMs,
            firstInteractionMs: firstInteractionRef.current,
            triageDecisionMs: triageDecisionRef.current ?? solveMs,
            triageAction: smartSkip
              ? "skipped_smart"
              : flagged
                ? "flagged_and_solved"
                : "solved_directly",
            highlightedSentenceIds: highlightedIds,
            sbiSchemaSelected: selectedSbiSchema,
            sbiVariablesTagged: polyaVars,
            hintsUsedCount: hints.length,
            maxHintLevel: maxLevel,
            usedScratchpad,
          }),
        });
        if (!res.ok) throw new Error("Gagal mengirim jawaban.");
        const result = (await res.json()) as SubmitResponse;
        setSubmission(result);
        setEvidenceUnlocked(true);
        if (!smartSkip) {
          if (result.isCorrect) {
            const nextStreak = sessionStreak + 1;
            setSessionStreak(nextStreak);
            if (nextStreak >= 2) {
              setComboTrigger((k) => k + 1);
            }
            if (result.unlockedNodeCodes.length > 0) {
              playCelebrationFanfare();
            } else if (nextStreak >= 2) {
              playStreakSound(nextStreak);
            } else {
              playCorrectSound();
            }
          } else {
            setSessionStreak(0);
            playWrongSound();
          }
        }
        setSessionHistory((prev) => [
          ...prev,
          {
            questionId: item.question.id,
            skillTitle: item.skillNode.titleId,
            isCorrect: result.isCorrect,
            solveSeconds: Math.round(solveMs / 1000),
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan jawaban. Coba kirim ulang.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      item,
      submitting,
      submission,
      selectedKey,
      hints,
      flagged,
      highlightedIds,
      selectedSbiSchema,
      polyaVars,
      usedScratchpad,
      sessionStreak,
    ],
  );

  const handleContinueNext = useCallback(() => {
    if (sessionHistory.length > 0 && sessionHistory.length % SESSION_GOAL === 0 && !recapOpen) {
      playCelebrationFanfare();
      setRecapOpen(true);
      return;
    }
    void loadQuestion({ fractureId: null, questionId: null, keepVariantNotice: false });
  }, [sessionHistory.length, recapOpen, loadQuestion]);

  const handleTrySimilarVariant = useCallback(async () => {
    if (!item || generatingVariant) return;
    setGeneratingVariant(true);
    setVariantError(null);
    try {
      const res = await fetch("/api/study/variant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: item.question.id }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        questionId?: string;
        badgeLabel?: string;
        error?: string;
      };
      if (!res.ok || !json.questionId) {
        throw new Error(json.error ?? "Belum bisa membuat variasi soal serupa.");
      }
      setVariantNotice(json.badgeLabel ?? "Variasi Soal Serupa");
      setShowFullSolution(false);
      await loadQuestion({
        questionId: json.questionId,
        skillNodeId: item.skillNode.id,
        fractureId: null,
        keepVariantNotice: true,
      });
    } catch (err) {
      setVariantError(err instanceof Error ? err.message : "Gagal memuat variasi soal.");
    } finally {
      setGeneratingVariant(false);
    }
  }, [generatingVariant, item, loadQuestion]);

  // Browser tab close/refresh guard while actively practicing
  useEffect(() => {
    const hasUnsavedSession = Boolean(item && !recapOpen && (sessionHistory.length > 0 || selectedKey));
    if (!hasUnsavedSession) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [item, recapOpen, sessionHistory.length, selectedKey]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");

      if (e.key === "Escape") {
        if (exitConfirmOpen) {
          setExitConfirmOpen(false);
          return;
        }
        if (shortcutModalOpen) {
          setShortcutModalOpen(false);
          return;
        }
        if (showFullSolution) {
          setShowFullSolution(false);
          return;
        }
        if (notesDrawerOpen) {
          setNotesDrawerOpen(false);
          return;
        }
        if (scratchpadOpen) {
          setScratchpadOpen(false);
          return;
        }
        if (drawerOpen) {
          setDrawerOpen(false);
          return;
        }
      }

      if (isTyping) return;

      if (e.key === "?") {
        e.preventDefault();
        setShortcutModalOpen((v) => !v);
        return;
      }

      if (!item || recapOpen || phase === "lesson") return;

      if (["1", "2", "3", "4", "5"].includes(e.key) && evidenceUnlocked && !submission) {
        const idx = Number(e.key) - 1;
        const opt = item.question.options[idx];
        if (opt) {
          markFirstInteraction();
          setSelectedKey(opt.key);
        }
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        setScratchpadOpen((v) => !v);
      } else if (e.key.toLowerCase() === "f" && !submission) {
        e.preventDefault();
        markFirstInteraction();
        setFlagged((v) => !v);
      } else if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        if (!drawerOpen) {
          setDrawerOpen(true);
          if (hints.length === 0) {
            void handleRequestHint("L1_vault_nudge");
          }
        } else {
          const nextIdx = Math.min(HINT_SEQUENCE.length - 1, hints.length);
          void handleRequestHint(HINT_SEQUENCE[nextIdx]);
        }
      } else if (e.key === "Enter") {
        if (submission) {
          e.preventDefault();
          handleContinueNext();
        } else if (!evidenceUnlocked && highlightedIds.length > 0) {
          e.preventDefault();
          void handleVerifyEvidence();
        } else if (evidenceUnlocked && selectedKey) {
          e.preventDefault();
          void handleSubmit(false);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const secondsDisplay = (elapsedMs / 1000).toFixed(1);
  const pastTriageWindow = elapsedMs > 20000;
  const sessionProgressCount = sessionHistory.length % SESSION_GOAL;
  const sessionBarPct =
    sessionHistory.length > 0 && sessionProgressCount === 0
      ? 100
      : Math.max(8, Math.round((sessionProgressCount / SESSION_GOAL) * 100));

  const sessionCorrectCount = sessionHistory.filter((h) => h.isCorrect).length;
  const sessionAccuracy =
    sessionHistory.length > 0 ? Math.round((sessionCorrectCount / sessionHistory.length) * 100) : 0;
  const sessionAvgSeconds =
    sessionHistory.length > 0
      ? Math.round(
          sessionHistory.reduce((acc, h) => acc + h.solveSeconds, 0) / sessionHistory.length,
        )
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-canvas)] text-[var(--ink-primary)]">
      <ComboCelebration streak={sessionStreak} triggerKey={comboTrigger} />
      {/* Clean Distraction-Free Study Header (No Excess Pill Boxes) */}
      <header className="sticky top-0 z-30 bg-[var(--surface-elevated)] border-b border-[var(--border-structural)] px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[540px]">
          <button
            type="button"
            onClick={() => setExitConfirmOpen(true)}
            aria-label="Kembali ke Jalur Belajar"
            className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-secondary)] shrink-0 cursor-pointer"
          >
            <CloseIcon size={20} />
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="w-full h-3 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
                style={{ width: `${sessionBarPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[var(--ink-secondary)]">
              <span className="truncate">
                {!item
                  ? "Memuat soal..."
                  : isInterleavedSprint && !submission
                    ? "Interleaved Sprint · Strategi disembunyikan (tebak bab & pola dulu)"
                    : isInterleavedSprint
                      ? `Interleaved · ${item.question.subtest} · ${item.skillNode.titleId}`
                      : `${item.question.subtest} · ${item.skillNode.titleId}`}
              </span>
              <span className="font-num shrink-0 ml-2">
                {sessionHistory.length}/{SESSION_GOAL}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {sessionStreak > 0 && (
            <span
              key={`study-streak-${sessionStreak}`}
              className="animate-streak-bump inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--ochre-tint)] text-[var(--ochre-ink)] font-num text-xs font-extrabold"
              title="Combo benar beruntun sesi ini"
            >
              <FlameIcon size={15} />
              {sessionStreak}
            </span>
          )}
          <div
            className={`hidden md:inline-flex items-center gap-1 font-num text-sm font-bold px-2.5 min-h-[38px] rounded-lg ${
              pastTriageWindow ? "text-[var(--ochre-ink)] bg-[var(--ochre-tint)]" : "text-[var(--ink-secondary)]"
            }`}
            title="Waktu berjalan untuk refleks triase 15-20 detik"
          >
            <TimerIcon size={18} />
            <span>{secondsDisplay}d</span>
          </div>

          <button
            type="button"
            onClick={() => {
              markFirstInteraction();
              setFlagged((v) => !v);
            }}
            aria-pressed={flagged}
            title="Tandai soal [F]"
            className={`min-h-[38px] px-2.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              flagged
                ? "bg-[var(--ochre-tint)] text-[var(--ochre-ink)]"
                : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <FlagIcon size={18} />
            <span className="hidden lg:inline">Tandai</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !soundOn;
              if (next) unlockAudioContext();
              setSoundEnabled(next);
              setSoundOn(next);
              if (next) playCorrectSound();
            }}
            aria-label={soundOn ? "Matikan efek suara" : "Aktifkan efek suara"}
            title={soundOn ? "Efek suara aktif" : "Efek suara bisu"}
            className="min-h-[38px] px-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--ink-primary)] inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            {soundOn ? <SoundOnIcon size={18} /> : <SoundOffIcon size={18} className="text-[var(--ink-muted)]" />}
          </button>

          <button
            type="button"
            onClick={() => setScratchpadOpen((v) => !v)}
            aria-pressed={scratchpadOpen}
            title="Kertas coretan [S]"
            className={`min-h-[38px] px-2.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              scratchpadOpen
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <ScratchpadIcon size={18} />
            <span className="hidden sm:inline">Coretan</span>
          </button>

          <button
            type="button"
            onClick={() => setPhase((p) => (p === "lesson" ? "practice" : "lesson"))}
            disabled={!activeLesson}
            title="Lihat ringkasan materi Why Before How"
            className={`min-h-[38px] px-2.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 ${
              phase === "lesson"
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <BookOpenIcon size={18} />
            <span className="hidden sm:inline">{phase === "lesson" ? "Sedang Belajar" : "Materi"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              setShowFullSolution(false);
              setNotesDrawerOpen((v) => !v);
            }}
            title="Tulis & lihat catatan untuk soal ini"
            className={`min-h-[38px] px-2.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              notesDrawerOpen
                ? "bg-[var(--olive-fill)] text-white"
                : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            <MemoryIcon size={18} />
            <span className="hidden md:inline">Catatan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playHintSound();
              setNotesDrawerOpen(false);
              setShowFullSolution(false);
              setSocraticInitialTab("chat");
              setDrawerOpen(true);
            }}
            title="Tanya AI tentang soal ini [H]"
            className="min-h-[40px] px-3 rounded-xl bg-[var(--olive-fill)] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[var(--olive-hover)]"
          >
            <TutorChatIcon size={18} />
            <span>Tanya AI</span>
          </button>

          <button
            type="button"
            onClick={() => setShortcutModalOpen((v) => !v)}
            aria-label="Pintasan keyboard"
            className="hidden sm:inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
          >
            <KeyboardIcon size={19} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1160px] mx-auto px-4 sm:px-6 pt-5 pb-28">
        {loading && (
          <div className="max-w-[700px] mx-auto space-y-4" aria-busy="true">
            <div className="h-8 w-56 rounded-lg bg-[var(--surface-secondary)]" />
            <div className="h-44 rounded-xl bg-[var(--surface-secondary)]" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-[var(--surface-secondary)]" />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="max-w-[700px] mx-auto card-tactile p-6 border-[var(--coral-border)] bg-[var(--coral-tint)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm font-bold text-[var(--coral-ink)]">{error}</p>
            <button type="button" onClick={() => loadQuestion()} className="btn-secondary">
              Muat Ulang Soal
            </button>
          </div>
        )}

        {/* Session Recap Screen */}
        {!loading && recapOpen && (
          <section className="max-w-[600px] mx-auto card-tactile p-6 sm:p-8 text-center space-y-6">
            <CheckIcon size={44} className="text-[var(--accent-primary)] mx-auto" />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Sesi Latihan Selesai</h1>
              <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                Kamu baru saja menyelesaikan <span className="font-num">{sessionHistory.length}</span> soal fokus!
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[var(--border-structural)] py-3 border-y border-[var(--border-structural)]">
              <div>
                <div className="text-xs font-extrabold text-[var(--ink-secondary)]">Akurasi</div>
                <div className="text-2xl font-num font-bold text-[var(--accent-text-on-secondary)] mt-0.5">
                  {sessionAccuracy}%
                </div>
              </div>
              <div>
                <div className="text-xs font-extrabold text-[var(--ink-secondary)]">Rata Waktu</div>
                <div className="text-2xl font-num font-bold text-[var(--olive-ink)] mt-0.5">
                  {sessionAvgSeconds}d
                </div>
              </div>
              <div>
                <div className="text-xs font-extrabold text-[var(--ink-secondary)]">Kombo</div>
                <div className="text-2xl font-num font-bold text-[var(--ochre-ink)] mt-0.5 inline-flex items-center gap-1">
                  <FlameIcon size={20} />
                  {submission?.momentum.precisionComboCurrent ??
                    item?.momentum.precisionComboCurrent ??
                    0}
                  x
                </div>
              </div>
            </div>

            <div className="text-left space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                Ringkasan Soal Sesi Ini
              </h2>
              <div className="divide-y divide-[var(--border-structural)] max-h-44 overflow-y-auto">
                {sessionHistory.map((h, i) => (
                  <div
                    key={`${h.questionId}-${i}`}
                    className="flex items-center justify-between gap-2 py-2 text-xs font-bold"
                  >
                    <span className="truncate">
                      {i + 1}. {h.skillTitle}
                    </span>
                    <span
                      className={
                        h.isCorrect
                          ? "text-[var(--accent-text-on-secondary)] shrink-0"
                          : "text-[var(--coral-ink)] shrink-0"
                      }
                    >
                      {h.isCorrect ? "Tepat" : "Perlu Pulihkan"} ({h.solveSeconds}d)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/graveyard" className="btn-secondary flex-1">
                Active Recall & Pemulihan
              </Link>
              <button
                type="button"
                onClick={() => {
                  setRecapOpen(false);
                  void loadQuestion({ fractureId: null, questionId: null });
                }}
                className="btn-primary flex-1"
              >
                <span>Lanjut Latihan</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </section>
        )}

        {!loading && !error && item && !recapOpen && phase === "lesson" && activeLesson && (
          <MicroLessonView
            skillNode={item.skillNode}
            lesson={activeLesson}
            onStartPractice={() => {
              setPhase("practice");
              startTimeRef.current = Date.now();
              setElapsedMs(0);
            }}
          />
        )}

        {!loading && !error && item && !recapOpen && phase === "practice" && (
          <div
            className={
              item.question.track === "literacy" && item.question.passageSentences
                ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                : "max-w-[1060px] mx-auto space-y-4"
            }
          >
            {/* Literacy Left Pane */}
            {item.question.track === "literacy" && item.question.passageSentences && (
              <section
                aria-label="Bacaan dan gerbang bukti teks"
                className="lg:col-span-7 card-tactile p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-structural)]">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                      {evidenceUnlocked
                        ? "Bukti Teks Terkunci · Silakan Pilih Jawaban"
                        : "Langkah 1 dari 2 · Ketuk Kalimat Bukti di Teks"}
                    </div>
                    <p className="text-xs font-semibold text-[var(--ink-secondary)] mt-1">
                      Tunjuk kalimat yang langsung mendukung pertanyaan sebelum membuka opsi A sampai E.
                    </p>
                  </div>
                  {!evidenceUnlocked && (
                    <button
                      type="button"
                      onClick={handleVerifyEvidence}
                      disabled={highlightedIds.length === 0 || checkingEvidence}
                      className="btn-olive text-xs"
                    >
                      {checkingEvidence ? "Memeriksa..." : "Kunci Bukti [Enter]"}
                    </button>
                  )}
                </div>

                <div className="font-serif-passage max-w-[64ch] space-y-1.5">
                  {item.question.passageSentences.map((sent) => {
                    const isSelected = highlightedIds.includes(sent.id);
                    const isTrueEvidence =
                      submission && submission.evidenceSentenceIds.includes(sent.id);

                    return (
                      <button
                        key={sent.id}
                        type="button"
                        onClick={() => {
                          if (submission) return;
                          markFirstInteraction();
                          setHighlightedIds((prev) =>
                            prev.includes(sent.id)
                              ? prev.filter((id) => id !== sent.id)
                              : [...prev, sent.id],
                          );
                        }}
                        className={`block w-full text-left px-3 py-2 rounded-lg transition-all cursor-pointer border-l-4 ${
                          isTrueEvidence
                            ? "bg-[var(--accent-tint)] border-l-[var(--accent-primary)]"
                            : isSelected
                              ? "bg-[var(--ochre-tint)] border-l-[var(--ochre-fill)]"
                              : "border-l-transparent hover:bg-[var(--surface-secondary)]"
                        }`}
                      >
                        <span className="font-num text-xs font-bold text-[var(--ink-muted)] mr-2">
                          [{sent.id}]
                        </span>
                        <span>{sent.text}</span>
                      </button>
                    );
                  })}
                </div>

                {evidenceFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold border ${
                      evidenceUnlocked
                        ? "border-[var(--accent-tint-border)] bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)]"
                        : "border-[var(--ochre-border)] bg-[var(--ochre-tint)] text-[var(--ochre-ink)]"
                    }`}
                  >
                    {evidenceFeedback}
                  </div>
                )}
              </section>
            )}

            {/* Focal Question & Options Column */}
            <section
              className={
                item.question.track === "literacy" && item.question.passageSentences
                  ? "lg:col-span-5 space-y-4"
                  : "space-y-5"
              }
            >
              {/* Clean Typographic Status Line (Zero Pill Soup) */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[var(--ink-secondary)]">
                    {isInterleavedSprint && !submission
                      ? "Mode Campur Lintas Bab (Interleaved)"
                      : item.skillNode.titleId}
                  </span>
                  {item.mastery.recoveryShieldActive && (
                    <span className="inline-flex items-center gap-1 text-[var(--accent-text-on-secondary)]">
                      <ShieldIcon size={16} />
                      Perisai Fondasi Aktif
                    </span>
                  )}
                </div>

                {sessionHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecapOpen(true)}
                    className="text-xs font-extrabold text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer"
                  >
                    Ringkasan Sesi ({sessionHistory.length})
                  </button>
                )}
              </div>

              {variantNotice && (
                <div className="p-3 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[var(--accent-text-on-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <VariantSwapIcon size={15} />
                    <span>
                      {variantNotice} · Coba buktikan kamu paham polanya meski angka/cerita sudah
                      diubah!
                    </span>
                  </span>
                </div>
              )}

              {/* Prompt Card */}
              <div className="card-tactile p-5 sm:p-6 space-y-4">
                <div className="text-base sm:text-[17px] leading-relaxed font-bold">
                  <MathText text={item.question.stemMarkdown} />
                </div>

                {item.question.diagramAssetUrl && (
                  <figure className="p-3 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)]">
                    <img
                      src={item.question.diagramAssetUrl}
                      alt={item.question.diagramAltText ?? "Diagram soal SNBT"}
                      className="max-h-72 mx-auto object-contain"
                    />
                  </figure>
                )}

                {item.question.track === "quantitative" &&
                  (item.question.sbiDeconstruction || item.question.solutionStepsPreview.length > 0) &&
                  !submission && (
                    <div className="pt-3 border-t border-[var(--border-structural)] space-y-2.5 text-xs font-extrabold">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {item.question.sbiDeconstruction && (
                            <button
                              type="button"
                              onClick={() => setSbiOpen((v) => !v)}
                              className={`cursor-pointer inline-flex items-center gap-1.5 transition-colors ${
                                item.mastery.masteryScore < 0.35
                                  ? "px-3 py-1.5 rounded-lg bg-[var(--ochre-tint)] text-[var(--ochre-ink)] border border-[var(--ochre-border)] hover:opacity-90"
                                  : "text-[var(--olive-ink)] hover:underline"
                              }`}
                            >
                              <HintIcon size={14} />
                              <span>
                                {sbiOpen
                                  ? "Tutup Bedah Soal & Rumus"
                                  : "Bedah Soal Cerita & Pilih Rumus"}
                              </span>
                            </button>
                          )}

                          <Link
                            href="/math-gym"
                            className="inline-flex items-center gap-1 text-[var(--ink-secondary)] hover:text-[var(--accent-text-on-secondary)] hover:underline font-bold"
                          >
                            <CalculatorIcon size={14} />
                            <span>Pemanasan Hitung Dasar (3 Menit)</span>
                          </Link>
                        </div>
                      </div>

                      {!sbiOpen && item.question.sbiDeconstruction && item.mastery.masteryScore < 0.35 && (
                        <p className="text-[11px] font-semibold text-[var(--ink-secondary)]">
                          Bingung mulai dari mana atau bingung pakai rumus apa? Klik{" "}
                          <strong>Bedah Soal Cerita &amp; Pilih Rumus</strong> di atas untuk menerjemahkan
                          kalimat soal pelan-pelan.
                        </p>
                      )}

                      {item.question.solutionStepsPreview.length > 0 && (
                        <details className="w-full">
                          <summary className="cursor-pointer text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]">
                            Lihat Kerangka Langkah ({fadingStageFriendly(item.mastery.currentFadingStage)})
                          </summary>
                          <div className="mt-2.5 divide-y divide-[var(--border-structural)] border-t border-[var(--border-structural)]">
                            {item.question.solutionStepsPreview.map((st, idx) => (
                              <div key={idx} className="py-2.5 text-xs">
                                <div className="font-extrabold">{st.title}</div>
                                {st.masked ? (
                                  <p className="text-[var(--ink-muted)] font-semibold mt-0.5">
                                    Coba lanjutkan langkah ini sendiri dulu ya (Active Recall).
                                  </p>
                                ) : (
                                  <div className="mt-1 space-y-1 font-semibold">
                                    <MathText text={st.instructionMarkdown} />
                                    {st.formulaLatex && <MathText text={`$$${st.formulaLatex}$$`} />}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                {sbiOpen &&
                  item.question.sbiDeconstruction &&
                  !submission &&
                  (() => {
                    const sbi = item.question.sbiDeconstruction;
                    const guide = getSbiGuideForQuestion(
                      item.question.skillNodeId,
                      sbi.schemaType,
                    );
                    const schemaChoices = buildSbiSchemaChoices(
                      sbi,
                      item.question.subtest as SnbtSubtest,
                      item.question.id,
                    );
                    const isSchemaMatch =
                      Boolean(selectedSbiSchema) && selectedSbiSchema === sbi.schemaType;

                    return (
                      <div className="pt-3 border-t border-[var(--border-structural)] space-y-4">
                        {/* Step 1: Kamus Terjemah Cerita -> Matematika */}
                        <div className="p-3.5 rounded-xl bg-[var(--surface-canvas)] border border-[var(--border-structural)] space-y-2">
                          <div className="text-xs font-extrabold text-[var(--olive-ink)]">
                            1. Kamus Terjemah Cerita ke Matematika
                          </div>
                          <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                            <MathText text={guide.whenToUse} />
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {guide.wordClues.map((clue, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-structural)] text-[11px]"
                              >
                                <div className="font-extrabold text-[var(--ochre-ink)]">
                                  &quot;{clue.phrase}&quot;
                                </div>
                                <div className="font-semibold text-[var(--ink-primary)] mt-0.5">
                                  <MathText text={clue.mathMeaning} />
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] font-bold text-[var(--accent-text-on-secondary)] pt-0.5">
                            Langkah pertama aman: {guide.firstStepChecklist}
                          </p>
                        </div>

                        {/* Step 2: Pilih Pola & Cek Rumus Dasar */}
                        <div className="space-y-2">
                          <label
                            htmlFor="sbi-schema-select"
                            className="text-xs font-extrabold block"
                          >
                            2. Pilih Pola Rumus yang Cocok untuk Soal Ini:
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              id="sbi-schema-select"
                              value={selectedSbiSchema ?? ""}
                              onChange={(e) => {
                                markFirstInteraction();
                                setSelectedSbiSchema(e.target.value || null);
                                setSbiChecked(false);
                              }}
                              className="input-tactile text-xs min-h-[42px] flex-1 min-w-[220px]"
                            >
                              <option value="">Pilih pola rumus yang cocok...</option>
                              {schemaChoices.map((sc) => (
                                <option key={sc.id} value={sc.id}>
                                  {sc.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={!selectedSbiSchema}
                              onClick={() => setSbiChecked(true)}
                              className="btn-secondary text-xs min-h-[42px] px-3"
                            >
                              Cek Pola
                            </button>
                            <button
                              type="button"
                              onClick={() => setSbiFormulaRevealed((v) => !v)}
                              className="btn-secondary text-xs min-h-[42px] px-3"
                            >
                              {sbiFormulaRevealed ? "Tutup Rumus" : "Intip Rumus Dasar"}
                            </button>
                          </div>

                          {sbiChecked && selectedSbiSchema && (
                            <div
                              className={`p-2.5 rounded-lg text-xs font-bold border ${
                                isSchemaMatch
                                  ? "bg-[var(--accent-tint)] border-[var(--accent-tint-border)] text-[var(--accent-text-on-secondary)]"
                                  : "bg-[var(--coral-tint)] border-[var(--coral-border)] text-[var(--coral-ink)]"
                              }`}
                            >
                              {isSchemaMatch
                                ? `Tepat! Soal ini memakai pola "${sbi.schemaLabelId}". Lanjutkan memetakan angkanya di bawah.`
                                : "Pola itu belum paling pas dengan kata kunci soal. Cek ulang Kamus Terjemah di langkah 1 atau intip rumus dasarnya."}
                            </div>
                          )}

                          {sbiFormulaRevealed && sbi.baseRelationLatex && (
                            <div className="p-3 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] space-y-1">
                              <div className="text-[11px] font-extrabold text-[var(--ochre-ink)]">
                                Rumus Dasar ({sbi.schemaLabelId})
                              </div>
                              <div className="overflow-x-auto">
                                <MathText text={`$$${sbi.baseRelationLatex}$$`} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Step 3: Peta Diketahui -> Ditanya */}
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-extrabold">
                              3. Catat Diketahui &amp; Target Soal:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                markFirstInteraction();
                                const filled: Record<string, string> = {};
                                sbi.knownVariables.forEach((v) => {
                                  filled[v.symbol] = v.valueText;
                                });
                                setPolyaVars(filled);
                              }}
                              className="text-[11px] font-extrabold text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer"
                            >
                              Bantu isi dari teks soal
                            </button>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[var(--olive-tint)] border border-[var(--olive-border)] text-xs font-bold text-[var(--olive-ink)]">
                            Yang Ditanyakan: <MathText text={sbi.targetUnknown} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {sbi.knownVariables.map((v) => (
                              <div key={v.symbol}>
                                <label className="text-xs font-bold text-[var(--ink-secondary)] block mb-1">
                                  <MathText text={`$${v.symbol}$`} /> ({v.label})
                                </label>
                                <input
                                  type="text"
                                  value={polyaVars[v.symbol] ?? ""}
                                  onChange={(e) => {
                                    markFirstInteraction();
                                    setPolyaVars((prev) => ({
                                      ...prev,
                                      [v.symbol]: e.target.value,
                                    }));
                                  }}
                                  placeholder={`Contoh: ${v.valueText}`}
                                  className="input-tactile text-xs min-h-[40px]"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {/* Panoramic Horizontal Desktop Option Selector A-E (No Vertical Scroll Needed!) */}
              {(() => {
                const isSplitLiteracy = Boolean(
                  item.question.track === "literacy" && item.question.passageSentences,
                );
                const maxOptLen = Math.max(
                  ...item.question.options.map((o) =>
                    o.textMarkdown.replace(/\\dfrac|\\frac|\\text|\$/g, "").trim().length,
                  ),
                );
                const gridClasses = isSplitLiteracy
                  ? maxOptLen <= 24
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1"
                  : maxOptLen <= 30
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
                    : "grid-cols-1 md:grid-cols-2";

                return (
                  <div className="space-y-2.5" role="radiogroup" aria-label="Pilihan jawaban A sampai E">
                    {!evidenceUnlocked && (
                      <div className="p-3.5 rounded-xl border border-[var(--ochre-border)] bg-[var(--ochre-tint)] text-xs font-bold text-[var(--ochre-ink)]">
                        Langkah 1 belum selesai: ketuk kalimat bukti di panel bacaan sebelah kiri lalu tekan{" "}
                        <span className="underline">Kunci Bukti</span> untuk membuka pilihan jawaban.
                      </div>
                    )}

                    <div className={`grid gap-2.5 ${gridClasses}`}>
                      {item.question.options.map((opt, idx) => {
                        const isChosen = selectedKey === opt.key;
                        const feedbackOpt = submission?.optionsFeedback.find((o) => o.key === opt.key);
                        const isCorrectOpt = submission?.correctAnswerKey === opt.key;
                        const isWrongChosen = submission && isChosen && !submission.isCorrect;

                        let cardStyle =
                          "bg-[var(--surface-elevated)] border-[var(--border-structural)] border-b-[var(--border-bevel)] hover:bg-[var(--surface-secondary)]";
                        let keyStyle = "text-[var(--ink-secondary)] border-[var(--border-structural)]";

                        if (submission) {
                          if (isCorrectOpt) {
                            cardStyle =
                              "bg-[var(--accent-tint)] border-[var(--accent-primary)] border-b-[var(--accent-bevel)]";
                            keyStyle = "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]";
                          } else if (isWrongChosen) {
                            cardStyle =
                              "bg-[var(--coral-tint)] border-[var(--coral-fill)] border-b-[var(--coral-bevel)]";
                            keyStyle = "bg-[var(--coral-fill)] text-white border-[var(--coral-fill)]";
                          }
                        } else if (isChosen) {
                          cardStyle =
                            "bg-[var(--accent-tint)] border-[var(--accent-primary)] border-b-[var(--accent-bevel)]";
                          keyStyle = "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]";
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={!evidenceUnlocked || Boolean(submission)}
                            onClick={() => {
                              markFirstInteraction();
                              playTapSound();
                              setSelectedKey(opt.key);
                            }}
                            className={`w-full h-full text-left p-3.5 rounded-xl border-2 border-b-4 min-h-[60px] transition-all flex items-start gap-2.5 cursor-pointer active:translate-y-[1px] disabled:opacity-65 disabled:cursor-not-allowed ${cardStyle}`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg border-2 inline-flex items-center justify-center font-num font-bold text-xs shrink-0 ${keyStyle}`}
                              title={`Pintasan angka ${idx + 1}`}
                            >
                              {opt.key}
                            </span>
                            <div className="flex-1 min-w-0 text-[15px] font-bold pt-0.5 space-y-1">
                              <MathText text={opt.textMarkdown} />
                              {submission && feedbackOpt && (isWrongChosen || isCorrectOpt) && (
                                <div
                                  className={`text-[11px] font-extrabold ${
                                    isCorrectOpt
                                      ? "text-[var(--accent-text-on-secondary)]"
                                      : "text-[var(--coral-ink)]"
                                  }`}
                                >
                                  {isCorrectOpt
                                    ? "Jawaban Benar"
                                    : feedbackOpt.trapType !== "none"
                                      ? getTrapLabelId(feedbackOpt.trapType)
                                      : "Pilihanmu"}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Clean Full-Width Math-Formatted Rationale Strip (Never Cramped Inside Narrow Option Boxes!) */}
                    {submission && (() => {
                      const correctOpt = submission.optionsFeedback.find(
                        (o) => o.key === submission.correctAnswerKey,
                      );
                      const wrongOpt =
                        !submission.isCorrect && selectedKey
                          ? submission.optionsFeedback.find((o) => o.key === selectedKey)
                          : null;

                      return (
                        <div
                          className={`mt-3 p-4 rounded-xl border-l-4 space-y-2.5 ${
                            submission.isCorrect
                              ? "bg-[var(--accent-tint)] border-l-[var(--accent-primary)]"
                              : "bg-[var(--coral-tint)] border-l-[var(--coral-fill)]"
                          }`}
                        >
                          {wrongOpt && (
                            <div className="space-y-0.5">
                              <div className="text-xs font-extrabold text-[var(--coral-ink)]">
                                Mengapa pilihanmu ({wrongOpt.key}) belum tepat
                                {wrongOpt.trapType !== "none"
                                  ? ` · ${getTrapLabelId(wrongOpt.trapType)}`
                                  : ""}
                              </div>
                              <div className="text-sm font-semibold text-[var(--ink-primary)] leading-relaxed">
                                <MathText text={wrongOpt.distractorRationale} />
                              </div>
                            </div>
                          )}

                          {correctOpt && (
                            <div
                              className={
                                wrongOpt
                                  ? "pt-2.5 border-t border-black/10 space-y-0.5"
                                  : "space-y-0.5"
                              }
                            >
                              <div className="text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                                Mengapa jawaban benar ({correctOpt.key})
                              </div>
                              <div className="text-sm font-semibold text-[var(--ink-primary)] leading-relaxed">
                                <MathText text={correctOpt.distractorRationale} />
                              </div>
                            </div>
                          )}

                          <div className="pt-2.5 border-t border-black/10 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold">
                              <button
                                type="button"
                                disabled={generatingVariant}
                                onClick={() => void handleTrySimilarVariant()}
                                className={`min-h-[38px] px-3 py-1.5 rounded-xl border-2 border-b-4 inline-flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-60 ${
                                  !submission.isCorrect
                                    ? "bg-[var(--olive-fill)] text-white border-[var(--olive-fill)] border-b-[var(--olive-bevel)] hover:bg-[var(--olive-hover)]"
                                    : "bg-[var(--ochre-tint)] text-[var(--ochre-ink)] border-[var(--ochre-border)] border-b-[var(--ochre-fill)] hover:opacity-90"
                                }`}
                              >
                                <VariantSwapIcon size={15} />
                                <span>
                                  {generatingVariant
                                    ? "Menyiapkan variasi..."
                                    : "Uji Variasi Soal Serupa (Beda Angka/Cerita)"}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNotesDrawerOpen(false);
                                  setShowFullSolution(false);
                                  setSocraticInitialTab("chat");
                                  setDrawerOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 text-[var(--olive-ink)] hover:underline cursor-pointer"
                              >
                                <TutorChatIcon size={15} />
                                <span>Tanya AI tentang soal ini</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDrawerOpen(false);
                                  setShowFullSolution(false);
                                  setNotesDrawerOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer"
                              >
                                <MemoryIcon size={15} />
                                <span>Tambah catatan soal ini</span>
                              </button>
                            </div>
                            {variantError && (
                              <p className="text-xs font-bold text-[var(--coral-ink)]">
                                {variantError}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </section>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action & Feedback Sheet */}
      {!loading && !error && item && !recapOpen && phase === "practice" && (
        <footer
          aria-live="polite"
          className={`fixed bottom-0 inset-x-0 z-30 border-t-2 transition-colors ${
            !submission
              ? "bg-[var(--surface-elevated)] border-[var(--border-structural)]"
              : submission.isCorrect
                ? "bg-[var(--accent-tint)] border-[var(--accent-tint-border)]"
                : "bg-[var(--coral-tint)] border-[var(--coral-border)]"
          }`}
        >
          <div className="max-w-[980px] mx-auto px-4 sm:px-6 py-4">
            {!submission ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit(true)}
                  className="btn-secondary"
                >
                  Lewati Cerdas
                </button>
                <button
                  type="button"
                  disabled={!evidenceUnlocked || !selectedKey || submitting}
                  onClick={() => handleSubmit(false)}
                  className="btn-primary flex-1 sm:flex-none min-w-[200px]"
                >
                  {submitting ? "Memeriksa..." : "Periksa Jawaban"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 text-white ${
                      submission.isCorrect ? "bg-[var(--accent-primary)]" : "bg-[var(--coral-fill)]"
                    }`}
                  >
                    {submission.isCorrect ? <CheckIcon size={22} /> : <CloseIcon size={20} />}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <div
                      className={`font-display font-bold text-base ${
                        submission.isCorrect
                          ? "text-[var(--accent-text-on-secondary)]"
                          : "text-[var(--coral-ink)]"
                      }`}
                    >
                      {submission.isCorrect
                        ? `Tepat! Kunci jawaban adalah ${submission.correctAnswerKey}`
                        : `Belum tepat · Kunci yang benar adalah ${submission.correctAnswerKey}`}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-[var(--ink-primary)]">
                      <span>
                        Penguasaan <span className="font-num">{Math.round(submission.mastery.masteryScore * 100)}%</span>
                      </span>
                      {submission.shieldConsumed && (
                        <span className="inline-flex items-center gap-1 text-[var(--accent-text-on-secondary)]">
                          <ShieldIcon size={15} />
                          Perisai menjaga kombo tetap aman
                        </span>
                      )}
                      {submission.unlockedNodeCodes.length > 0 && (
                        <span className="text-[var(--accent-text-on-secondary)]">
                          Terbuka: {submission.unlockedNodeCodes.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      showFullSolution ? setShowFullSolution(false) : void handleLoadAiExplanation()
                    }
                    className="btn-secondary text-xs"
                  >
                    <HintIcon size={16} />
                    <span>{showFullSolution ? "Tutup Penjelasan" : "Penjelasan AI (Why)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueNext}
                    className={
                      submission.isCorrect ? "btn-primary min-w-[160px]" : "btn-danger min-w-[160px]"
                    }
                  >
                    <span>Lanjutkan</span>
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </footer>
      )}

      <ScratchpadOverlay
        open={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        onUsed={() => setUsedScratchpad(true)}
      />

      {item && (
        <SocraticDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          questionId={item.question.id}
          subtest={item.question.subtest as SnbtSubtest}
          skillTitle={item.skillNode.titleId}
          initialTab={socraticInitialTab}
          hints={hints}
          loadingLevel={loadingHint}
          error={hintError}
          onRequestHint={handleRequestHint}
        />
      )}

      {/* AI Explanation Slide-Over Sheet Overlay (Never stretches bottom of page!) */}
      {submission && showFullSolution && (
        <>
          <div
            onClick={() => setShowFullSolution(false)}
            aria-hidden="true"
            className="fixed inset-0 top-16 z-30 bg-black/25"
          />
          <aside
            role="dialog"
            aria-label="Penjelasan AI Why Before How"
            className="fixed right-0 bottom-0 top-16 lg:w-[490px] w-full z-40 bg-[var(--surface-elevated)] border-t-2 lg:border-t-0 lg:border-l-2 border-[var(--border-structural)] shadow-[var(--shadow-sheet)] flex flex-col"
          >
            <div className="px-5 py-3.5 border-b border-[var(--border-structural)] bg-[var(--accent-tint)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[var(--accent-text-on-secondary)]">
                <HintIcon size={20} />
                <div>
                  <h2 className="font-bold text-sm leading-tight">Penjelasan AI · Why Before How</h2>
                  <span className="text-xs font-semibold">
                    Penguasaan materi:{" "}
                    <strong className="font-num">{Math.round(submission.mastery.masteryScore * 100)}%</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullSolution(false)}
                aria-label="Tutup panel penjelasan AI"
                className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg text-[var(--accent-text-on-secondary)] hover:bg-black/5 cursor-pointer"
              >
                <CloseIcon size={17} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {submission.rootCauseAnalysis && (
                <div className="p-3.5 rounded-xl bg-[var(--coral-tint)] border border-[var(--coral-border)] space-y-1 text-xs">
                  <div className="font-extrabold text-[var(--coral-ink)]">
                    Akar Masalah: {getRootCauseLabelId(submission.rootCauseAnalysis.primaryRootCause)}
                  </div>
                  <p className="font-semibold text-[var(--ink-primary)]">
                    {submission.rootCauseAnalysis.summary}
                  </p>
                </div>
              )}

              {loadingExplain ? (
                <div className="py-6 text-sm font-bold text-[var(--accent-text-on-secondary)] animate-pulse">
                  Tutor AI sedang menyusun penjelasan Why Before How langkah demi langkah...
                </div>
              ) : aiExplain ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                      1. Mengapa Ini Bekerja (Why Before How)
                    </div>
                    <div className="text-sm font-semibold leading-relaxed">
                      <MathText text={aiExplain.whyIntuitionMarkdown} />
                    </div>
                    <p className="text-xs font-bold text-[var(--ink-secondary)] pt-1">
                      Analogi: {aiExplain.everydayAnalogy}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-[var(--border-structural)]">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                      2. Langkah Demi Langkah (How)
                    </div>
                    <ol className="space-y-3">
                      {aiExplain.stepByStepHow.map((st, idx) => (
                        <li key={idx} className="border-l-4 border-[var(--border-bevel)] pl-3.5 space-y-1">
                          <div className="text-xs font-extrabold text-[var(--ink-primary)]">
                            Langkah {idx + 1}: {st.stepTitle}
                          </div>
                          <div className="text-sm font-semibold text-[var(--ink-secondary)]">
                            <MathText text={st.explanationMarkdown} />
                          </div>
                          {st.formulaLatex && <MathText text={`$$${st.formulaLatex}$$`} />}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-structural)] space-y-1">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--coral-ink)]">
                      3. Jebakan yang Sering Menipu
                    </div>
                    <div className="text-sm font-semibold">
                      <MathText text={aiExplain.trapWatchout} />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] space-y-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                      <BrainIcon size={17} />
                      <span>4. Cek Ingatan Aktif (Active Recall)</span>
                    </div>
                    <div className="text-sm font-bold text-[var(--ink-primary)]">
                      <MathText text={aiExplain.activeRecallPrompt} />
                    </div>
                    {recallAnswerRevealed ? (
                      <div className="pt-2 border-t border-[var(--ochre-border)] text-xs font-bold text-[var(--accent-text-on-secondary)]">
                        Jawaban inti: <MathText text={aiExplain.activeRecallAnswer} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRecallAnswerRevealed(true)}
                        className="text-xs font-extrabold text-[var(--ochre-ink)] underline cursor-pointer"
                      >
                        Sudah kujawab di kepala · Lihat kunci inti
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold leading-relaxed">
                  <MathText text={submission.officialSolutionMarkdown} />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border-structural)] bg-[var(--surface-secondary)] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowFullSolution(false)}
                className="btn-secondary text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={generatingVariant}
                onClick={() => void handleTrySimilarVariant()}
                className="btn-olive text-xs flex-1 min-w-[155px]"
              >
                <VariantSwapIcon size={15} />
                <span>{generatingVariant ? "Menyiapkan..." : "Uji Soal Serupa"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFullSolution(false);
                  handleContinueNext();
                }}
                className="btn-primary flex-1 text-xs min-w-[140px]"
              >
                <span>Soal Berikutnya</span>
                <ArrowRightIcon size={15} />
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Exit Session Confirmation Overlay Modal */}
      {exitConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi keluar sesi latihan"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md card-tactile p-6 shadow-[var(--shadow-sheet)] space-y-4">
            <h2 className="text-xl font-bold">Yakin ingin meninggalkan sesi latihan?</h2>
            <p className="text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
              {sessionHistory.length > 0
                ? `Kamu sudah menyelesaikan ${sessionHistory.length} soal di sesi ini. Progres jawaban yang sudah diperiksa tetap tersimpan, namun sesi aktif akan diakhiri.`
                : phase === "lesson"
                  ? "Kamu sedang mempelajari ringkasan konsep materi ini. Yakin ingin kembali ke Jalur Belajar?"
                  : "Jawaban pada soal yang sedang terbuka belum diperiksa. Yakin ingin kembali ke Jalur Belajar?"}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExitConfirmOpen(false)}
                className="btn-primary flex-1"
              >
                Lanjut Belajar
              </button>
              <button
                type="button"
                onClick={() => {
                  setExitConfirmOpen(false);
                  router.push("/");
                }}
                className="btn-danger flex-1"
              >
                Ya, Keluar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Per-Question Notes & Brain Vault Drawer */}
      {item && (
        <StudyNotesDrawer
          open={notesDrawerOpen}
          onClose={() => setNotesDrawerOpen(false)}
          subtest={item.question.subtest as SnbtSubtest}
          skillTitle={item.skillNode.titleId}
          questionPreview={item.question.stemMarkdown.replace(/\$[^$]+\$/g, "").trim()}
        />
      )}

      {shortcutModalOpen && (
        <div
          role="dialog"
          aria-label="Daftar pintasan keyboard"
          className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md card-tactile p-6 shadow-[var(--shadow-sheet)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Pintasan Keyboard</h2>
              <button
                type="button"
                onClick={() => setShortcutModalOpen(false)}
                className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] cursor-pointer"
                aria-label="Tutup daftar pintasan"
              >
                <CloseIcon size={17} />
              </button>
            </div>
            <dl className="divide-y divide-[var(--border-structural)] text-sm">
              {[
                ["1 - 5", "Pilih jawaban A sampai E"],
                ["Enter", "Kunci bukti / Periksa / Lanjutkan"],
                ["H", "Buka Tutor AI & Petunjuk Bertahap"],
                ["S", "Buka atau tutup kertas coretan"],
                ["F", "Tandai soal untuk triase"],
                ["Esc", "Tutup panel bantuan"],
              ].map(([k, desc]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2">
                  <dt className="font-num font-bold text-[var(--accent-text-on-secondary)]">{k}</dt>
                  <dd className="text-[var(--ink-secondary)] text-right text-xs font-bold">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
