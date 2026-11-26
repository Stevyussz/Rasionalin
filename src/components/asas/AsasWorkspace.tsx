"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CalculatorIcon,
  CheckIcon,
  CloseIcon,
  FlameIcon,
  HintIcon,
  PlayIcon,
  ResetIcon,
  ScratchpadIcon,
  SoundOffIcon,
  SoundOnIcon,
  TargetIcon,
  TimerIcon,
  TutorChatIcon,
} from "@/components/icons/ArchitecturalIcons";
import { AsasAiDrawer } from "@/components/asas/AsasAiDrawer";
import { AppShell } from "@/components/layout/AppShell";
import { ComboCelebration } from "@/components/feedback/ComboCelebration";
import { MathText } from "@/components/math/MathText";
import { ScratchpadOverlay } from "@/components/study/ScratchpadOverlay";
import {
  ASAS_SUBJECTS,
  buildAsasSession,
  getAsasChapter,
  getAsasSubject,
  type AsasOptionKey,
  type AsasQuestion,
  type AsasSessionMode,
  type AsasSubjectId,
} from "@/domain/asas";
import {
  installGlobalAudioUnlock,
  isSoundEnabled,
  playCelebrationFanfare,
  playCheckSound,
  playCorrectSound,
  playHintSound,
  playStreakSound,
  playTapSound,
  playWrongSound,
  setSoundEnabled,
  unlockAudioContext,
} from "@/infrastructure/audio/sound-effects";

const ASAS_STORAGE_KEY = "rasionalin_asas_progress_v1";
const MAX_REMEDIAL_RETRIES = 3;

interface AsasProgressState {
  checkedPlanIds: string[];
  bestChapterAccuracy: Record<string, number>;
  bestTryoutScore: Partial<Record<AsasSubjectId, number>>;
  wrongIdsBySubject: Partial<Record<AsasSubjectId, string[]>>;
  masteredIdsBySubject: Partial<Record<AsasSubjectId, string[]>>;
}

const DEFAULT_PROGRESS: AsasProgressState = {
  checkedPlanIds: [],
  bestChapterAccuracy: {},
  bestTryoutScore: {},
  wrongIdsBySubject: {},
  masteredIdsBySubject: {},
};

interface AsasAnswerRecord {
  questionId: string;
  chapterId: string;
  triggerTag: string;
  isCorrect: boolean;
  isRemedial?: boolean;
}

export function AsasWorkspace() {
  const [view, setView] = useState<"lobby" | "focus" | "summary">("lobby");
  const [subjectId, setSubjectId] = useState<AsasSubjectId>("mtk-wajib");
  const [chapterId, setChapterId] = useState<string>(ASAS_SUBJECTS[0].chapters[0].id);
  const [studyTab, setStudyTab] = useState<"formulas" | "module" | "practice">("module");
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [planOpen, setPlanOpen] = useState(true);
  const [memoryTestMode, setMemoryTestMode] = useState(false);
  const [revealedFormulaIds, setRevealedFormulaIds] = useState<string[]>([]);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [progress, setProgress] = useState<AsasProgressState>(DEFAULT_PROGRESS);
  const [soundOn, setSoundOn] = useState(true);

  // Focus session state
  const [sessionMode, setSessionMode] = useState<AsasSessionMode>("chapter");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionSubtitle, setSessionSubtitle] = useState("");
  const [questions, setQuestions] = useState<AsasQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<AsasOptionKey | null>(null);
  const [hintStage, setHintStage] = useState<0 | 1 | 2>(0);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [comboTrigger, setComboTrigger] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [history, setHistory] = useState<AsasAnswerRecord[]>([]);
  const [remedialEnqueued, setRemedialEnqueued] = useState(0);
  const [justEnqueuedRemedial, setJustEnqueuedRemedial] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const startTimeRef = useRef<number>(0);

  const subject = getAsasSubject(subjectId);
  const chapter = getAsasChapter(subject, chapterId);

  useEffect(() => {
    installGlobalAudioUnlock();
    setSoundOn(isSoundEnabled());
    try {
      setSidebarHidden(localStorage.getItem("rasionalin_sidebar_collapsed") === "true");
    } catch {
      // Ignore storage unavailable errors
    }
    const onSoundChanged = (evt: Event) => {
      const custom = evt as CustomEvent<{ enabled?: boolean }>;
      if (typeof custom.detail?.enabled === "boolean") {
        setSoundOn(custom.detail.enabled);
      }
    };
    const onSidebarChanged = (evt: Event) => {
      const custom = evt as CustomEvent<{ hidden?: boolean }>;
      if (typeof custom.detail?.hidden === "boolean") {
        setSidebarHidden(custom.detail.hidden);
      }
    };
    window.addEventListener("rasionalin:sound-changed", onSoundChanged);
    window.addEventListener("rasionalin:sidebar-changed", onSidebarChanged);
    try {
      const raw = localStorage.getItem(ASAS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AsasProgressState>;
        setProgress({
          checkedPlanIds: Array.isArray(parsed.checkedPlanIds) ? parsed.checkedPlanIds : [],
          bestChapterAccuracy: parsed.bestChapterAccuracy ?? {},
          bestTryoutScore: parsed.bestTryoutScore ?? {},
          wrongIdsBySubject: parsed.wrongIdsBySubject ?? {},
          masteredIdsBySubject: parsed.masteredIdsBySubject ?? {},
        });
      }
    } catch {
      // Ignore storage unavailable errors
    }
    return () => {
      window.removeEventListener("rasionalin:sound-changed", onSoundChanged);
      window.removeEventListener("rasionalin:sidebar-changed", onSidebarChanged);
    };
  }, []);

  const persistProgress = useCallback((updater: (prev: AsasProgressState) => AsasProgressState) => {
    setProgress((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(ASAS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    if (next) unlockAudioContext();
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playCorrectSound();
  }, [soundOn]);

  function selectSubject(nextId: AsasSubjectId) {
    playTapSound();
    const nextSub = getAsasSubject(nextId);
    setSubjectId(nextId);
    setChapterId(nextSub.chapters[0]?.id ?? "");
    setStudyTab("module");
    setExampleIdx(0);
    setRevealedFormulaIds([]);
  }

  function togglePlanBlock(blockId: string) {
    persistProgress((prev) => {
      const exists = prev.checkedPlanIds.includes(blockId);
      if (!exists) {
        playCheckSound();
      } else {
        playTapSound();
      }
      return {
        ...prev,
        checkedPlanIds: exists
          ? prev.checkedPlanIds.filter((id) => id !== blockId)
          : [...prev.checkedPlanIds, blockId],
      };
    });
  }

  function startSession(mode: AsasSessionMode, targetChapterId?: string) {
    const wrongIds = progress.wrongIdsBySubject[subjectId] ?? [];
    const built = buildAsasSession({
      subjectId,
      mode,
      chapterId: targetChapterId ?? chapter.id,
      wrongIds,
      seed: Date.now(),
    });
    if (built.questions.length === 0) return;

    playTapSound();
    setSessionMode(mode);
    setSessionTitle(built.title);
    setSessionSubtitle(built.subtitle);
    setQuestions(built.questions.map((q) => ({ ...q })));
    setCurrentIndex(0);
    setSelectedKey(null);
    setHintStage(0);
    setAiDrawerOpen(false);
    setScratchpadOpen(false);
    setStreak(0);
    setBestStreak(0);
    setHistory([]);
    setRemedialEnqueued(0);
    setJustEnqueuedRemedial(false);
    setElapsedSec(0);
    startTimeRef.current = Date.now();
    setView("focus");
  }

  // Live session timer
  useEffect(() => {
    if (view !== "focus") return;
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [view]);

  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedKey !== null;

  const finishSession = useCallback(
    (finalHistory: AsasAnswerRecord[]) => {
      const firstPass = finalHistory.filter((h) => !h.isRemedial);
      const baseList = firstPass.length > 0 ? firstPass : finalHistory;
      const correctCount = baseList.filter((h) => h.isCorrect).length;
      const accuracyPct = baseList.length > 0 ? Math.round((correctCount / baseList.length) * 100) : 0;

      const rightIds = new Set(finalHistory.filter((h) => h.isCorrect).map((h) => h.questionId));
      const wrongIds = finalHistory.filter((h) => !h.isCorrect).map((h) => h.questionId);

      // Update per-chapter best accuracy if all records include that chapter
      const byChapter = new Map<string, { total: number; correct: number }>();
      for (const rec of baseList) {
        const cur = byChapter.get(rec.chapterId) ?? { total: 0, correct: 0 };
        cur.total += 1;
        if (rec.isCorrect) cur.correct += 1;
        byChapter.set(rec.chapterId, cur);
      }

      persistProgress((prev) => {
        const nextChapters = { ...prev.bestChapterAccuracy };
        for (const [chId, counts] of byChapter.entries()) {
          const pct = Math.round((counts.correct / counts.total) * 100);
          nextChapters[chId] = Math.max(nextChapters[chId] ?? 0, pct);
        }

        const prevWrong = prev.wrongIdsBySubject[subjectId] ?? [];
        const mergedWrong = Array.from(
          new Set([
            ...prevWrong.filter((id) => !rightIds.has(id)),
            ...wrongIds.filter((id) => !rightIds.has(id)),
          ]),
        );

        const prevMastered = prev.masteredIdsBySubject[subjectId] ?? [];
        const mergedMastered = Array.from(new Set([...prevMastered, ...Array.from(rightIds)]));

        const prevTryout = prev.bestTryoutScore[subjectId] ?? 0;

        return {
          ...prev,
          bestChapterAccuracy: nextChapters,
          bestTryoutScore:
            sessionMode === "tryout" || sessionMode === "all"
              ? { ...prev.bestTryoutScore, [subjectId]: Math.max(prevTryout, accuracyPct) }
              : prev.bestTryoutScore,
          wrongIdsBySubject: { ...prev.wrongIdsBySubject, [subjectId]: mergedWrong },
          masteredIdsBySubject: { ...prev.masteredIdsBySubject, [subjectId]: mergedMastered },
        };
      });

      playCelebrationFanfare();
      setView("summary");
    },
    [persistProgress, sessionMode, subjectId],
  );

  const handleSelectOption = useCallback(
    (key: AsasOptionKey) => {
      if (!currentQuestion || isAnswered) return;
      const chosen = currentQuestion.options.find((o) => o.key === key);
      if (!chosen) return;

      setSelectedKey(key);
      const isCorrect = chosen.isCorrect;

      if (isCorrect) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak > bestStreak) setBestStreak(nextStreak);
        if (nextStreak >= 2) {
          setComboTrigger((k) => k + 1);
          playStreakSound(nextStreak);
        } else {
          playCorrectSound();
        }
      } else {
        setStreak(0);
        playWrongSound();
      }

      const isRemedialAlready = Boolean(currentQuestion.triggerTag.startsWith("[Ulang]"));
      const nextHistory: AsasAnswerRecord[] = [
        ...history,
        {
          questionId: currentQuestion.id,
          chapterId: currentQuestion.chapterId,
          triggerTag: currentQuestion.triggerTag,
          isCorrect,
          isRemedial: isRemedialAlready,
        },
      ];
      setHistory(nextHistory);

      // Enqueue up to MAX_REMEDIAL_RETRIES missed items at end of non-tryout practice
      if (
        !isCorrect &&
        sessionMode !== "tryout" &&
        remedialEnqueued < MAX_REMEDIAL_RETRIES &&
        !isRemedialAlready
      ) {
        const retryCopy: AsasQuestion = {
          ...currentQuestion,
          triggerTag: `[Ulang] ${currentQuestion.triggerTag}`,
        };
        setQuestions((prev) => [...prev, retryCopy]);
        setRemedialEnqueued((c) => c + 1);
        setJustEnqueuedRemedial(true);
      } else {
        setJustEnqueuedRemedial(false);
      }
    },
    [bestStreak, currentQuestion, history, isAnswered, remedialEnqueued, sessionMode, streak],
  );

  const handleAdvance = useCallback(() => {
    if (!isAnswered) return;
    if (currentIndex + 1 >= questions.length) {
      finishSession(history);
      return;
    }
    playTapSound();
    setCurrentIndex((i) => i + 1);
    setSelectedKey(null);
    setHintStage(0);
    setAiDrawerOpen(false);
    setJustEnqueuedRemedial(false);
  }, [currentIndex, finishSession, history, isAnswered, questions.length]);

  // Keyboard shortcuts during Focus Mode
  useEffect(() => {
    if (view !== "focus") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        if (aiDrawerOpen) {
          e.preventDefault();
          setAiDrawerOpen(false);
          return;
        }
        if (scratchpadOpen) {
          e.preventDefault();
          setScratchpadOpen(false);
          return;
        }
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        playTapSound();
        setAiDrawerOpen((o) => !o);
        return;
      }
      if (aiDrawerOpen) return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setScratchpadOpen((o) => !o);
        return;
      }
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        playHintSound();
        setHintStage((s) => (s === 0 ? 1 : 0));
        return;
      }
      if (!isAnswered && currentQuestion) {
        const numMap: Record<string, AsasOptionKey> = {
          "1": "A",
          "2": "B",
          "3": "C",
          "4": "D",
          "5": "E",
          a: "A",
          b: "B",
          c: "C",
          d: "D",
          e: "E",
        };
        const mapped = numMap[e.key.toLowerCase()];
        if (mapped && currentQuestion.options.some((o) => o.key === mapped)) {
          e.preventDefault();
          handleSelectOption(mapped);
        }
      } else if (isAnswered && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        handleAdvance();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aiDrawerOpen, currentQuestion, handleAdvance, handleSelectOption, isAnswered, scratchpadOpen, view]);

  const formatMMSS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // =========================================================
  // 1. FULL-SCREEN DISTRACTION-FREE FOCUS MODE (No AppShell!)
  // =========================================================
  if (view === "focus" && currentQuestion) {
    const progressPct = Math.round(((currentIndex + (isAnswered ? 1 : 0)) / Math.max(1, questions.length)) * 100);
    const chosenOption = currentQuestion.options.find((o) => o.key === selectedKey);
    const correctOption = currentQuestion.options.find((o) => o.isCorrect);
    const wasCorrect = Boolean(chosenOption?.isCorrect);

    return (
      <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--ink-primary)] flex flex-col">
        <ComboCelebration streak={streak} triggerKey={comboTrigger} />
        {/* Sticky Focus Header */}
        <header
          aria-label="Header fokus ASAS"
          className="sticky top-0 z-30 bg-[var(--surface-elevated)] border-b border-[var(--border-structural)] px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4"
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setView("lobby");
              }}
              aria-label="Keluar dari sesi ASAS"
              className="inline-flex items-center gap-1.5 px-2.5 min-h-[38px] rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)] text-xs font-extrabold cursor-pointer shrink-0"
            >
              <CloseIcon size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">{sessionTitle}</div>
              <div className="font-num text-[11px] font-bold text-[var(--ink-secondary)] truncate">
                Soal {currentIndex + 1} / {questions.length}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-[260px]">
            <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span
              key={`asas-streak-${streak}`}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--ochre-tint)] text-[var(--ochre-ink)] font-num text-xs font-extrabold ${
                streak >= 2 ? "animate-streak-bump" : ""
              }`}
              title="Streak benar beruntun"
            >
              <FlameIcon size={14} />
              {streak}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--surface-secondary)] text-[var(--ink-secondary)] font-num text-xs font-bold">
              <TimerIcon size={14} />
              {formatMMSS(elapsedSec)}
            </span>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundOn ? "Matikan efek suara" : "Aktifkan efek suara"}
              className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg border border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)] cursor-pointer"
            >
              {soundOn ? (
                <SoundOnIcon size={17} className="text-[var(--accent-primary)]" />
              ) : (
                <SoundOffIcon size={17} className="text-[var(--ink-muted)]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAiDrawerOpen((o) => !o);
              }}
              title="Tanya AI tentang soal ini [T]"
              className={`inline-flex items-center gap-1.5 px-2.5 min-h-[36px] rounded-lg border text-xs font-extrabold cursor-pointer transition-colors ${
                aiDrawerOpen
                  ? "bg-[var(--olive-tint)] border-[var(--olive-fill)] text-[var(--olive-ink)]"
                  : "bg-[var(--surface-canvas)] border-[var(--border-structural)] hover:bg-[var(--surface-secondary)] text-[var(--ink-primary)]"
              }`}
            >
              <TutorChatIcon size={15} />
              <span>Tanya AI</span>
            </button>
            <button
              type="button"
              onClick={() => setScratchpadOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 px-2.5 min-h-[36px] rounded-lg border text-xs font-extrabold cursor-pointer transition-colors ${
                scratchpadOpen
                  ? "bg-[var(--accent-tint)] border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                  : "bg-[var(--surface-canvas)] border-[var(--border-structural)] hover:bg-[var(--surface-secondary)]"
              }`}
            >
              <ScratchpadIcon size={15} />
              <span className="hidden sm:inline">Coretan</span>
            </button>
          </div>
        </header>

        {/* Question Workspace */}
        <main className="flex-1 w-full max-w-[740px] mx-auto px-4 sm:px-6 py-6 pb-36 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)] text-[11px] font-extrabold uppercase tracking-wide">
                {currentQuestion.difficulty === "dasar"
                  ? "Fondasi"
                  : currentQuestion.difficulty === "hots"
                    ? "HOTS Ujian"
                    : "Standar ASAS"}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[var(--surface-secondary)] text-[var(--ink-secondary)] text-[11px] font-extrabold">
                <MathText text={currentQuestion.triggerTag} />
              </span>
              {currentQuestion.format === "statements" && (
                <span className="px-2.5 py-0.5 rounded-md bg-[var(--ochre-tint)] text-[var(--ochre-ink)] text-[11px] font-extrabold">
                  Analisis Pernyataan
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                playHintSound();
                setHintStage((s) => (s === 0 ? 1 : 0));
              }}
              className="inline-flex items-center gap-1.5 px-3 min-h-[34px] rounded-lg border border-[var(--ochre-border)] bg-[var(--ochre-tint)] text-[var(--ochre-ink)] text-xs font-extrabold cursor-pointer"
            >
              <HintIcon size={15} />
              <span>{hintStage > 0 ? "Tutup Bantuan [H]" : "Blank? Mulai Dari Mana? [H]"}</span>
            </button>
          </div>

          {hintStage >= 1 && (
            <div className="p-4 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] text-xs sm:text-sm space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-extrabold text-[var(--ochre-ink)]">
                  Petunjuk Rumus & Kata Kunci: <MathText text={currentQuestion.triggerTag} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setAiDrawerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--ochre-border)] text-[11px] font-extrabold text-[var(--olive-ink)] hover:bg-[var(--surface-secondary)] cursor-pointer"
                >
                  <TutorChatIcon size={13} />
                  <span>Tanya AI Soal Ini</span>
                </button>
              </div>
              <MathText text={currentQuestion.formulaHint} className="leading-relaxed block text-sm" />

              {!isAnswered && currentQuestion.stepByStep.length >= 2 && (
                hintStage === 1 ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        playHintSound();
                        setHintStage(2);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--ochre-border)] bg-[var(--surface-elevated)] text-xs font-extrabold text-[var(--ochre-ink)] hover:opacity-90 cursor-pointer"
                    >
                      Masih bingung awalnya? Buka Langkah 1 Saja (Tanpa Bocorin Jawaban)
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--ochre-border)] space-y-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--accent-text-on-secondary)]">
                      Langkah 1 Pembuka (Lanjutkan sisanya di Coretan!)
                    </div>
                    <MathText text={currentQuestion.stepByStep[0]} className="leading-relaxed text-xs sm:text-sm" />
                  </div>
                )
              )}
            </div>
          )}

          {/* Question Card */}
          <div className="card-tactile p-5 sm:p-6 space-y-5">
            <div className="text-[15px] sm:text-[17px] font-semibold leading-relaxed text-[var(--ink-primary)]">
              <MathText text={currentQuestion.promptMarkdown} />
            </div>

            <div className="space-y-2.5" role="radiogroup" aria-label="Pilihan jawaban soal ASAS">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedKey === opt.key;
                let styleClass =
                  "border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-interactive)]";
                if (isAnswered) {
                  if (opt.isCorrect) {
                    styleClass =
                      "border-[var(--accent-primary)] bg-[var(--semantic-correct-bg)] text-[var(--accent-text-on-secondary)]";
                  } else if (isSelected && !opt.isCorrect) {
                    styleClass =
                      "border-[var(--coral-fill)] bg-[var(--semantic-incorrect-bg)] text-[var(--coral-ink)]";
                  } else {
                    styleClass = "border-[var(--border-structural)] bg-[var(--surface-canvas)] opacity-60";
                  }
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt.key)}
                    data-option-key={opt.key}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                      isAnswered ? "cursor-default" : "cursor-pointer"
                    } ${
                      isAnswered && isSelected
                        ? opt.isCorrect
                          ? "animate-answer-correct"
                          : "animate-answer-wrong"
                        : ""
                    } ${styleClass}`}
                  >
                    <span className="font-num text-xs font-extrabold w-6 h-6 rounded-md border border-current/25 flex items-center justify-center shrink-0 mt-0.5">
                      {opt.key}
                    </span>
                    <div className="flex-1 text-sm sm:text-[15px] font-semibold leading-snug">
                      <MathText text={opt.text} />
                    </div>
                    {!isAnswered && (
                      <span className="hidden sm:inline font-num text-[11px] font-bold text-[var(--ink-muted)] shrink-0 mt-0.5">
                        [{idx + 1}]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Sticky Duolingo-Style Feedback & Step-by-Step Footer */}
        {isAnswered && (
          <footer
            className={`fixed bottom-0 inset-x-0 z-40 border-t-2 px-4 sm:px-6 py-4 shadow-lg max-h-[55vh] overflow-y-auto ${
              wasCorrect
                ? "bg-[var(--semantic-correct-bg)] border-[var(--accent-primary)]"
                : "bg-[var(--semantic-incorrect-bg)] border-[var(--coral-fill)]"
            }`}
          >
            <div className="max-w-[740px] mx-auto space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div
                    className={`text-base font-extrabold flex items-center gap-2 ${
                      wasCorrect ? "text-[var(--accent-text-on-secondary)]" : "text-[var(--coral-ink)]"
                    }`}
                  >
                    {wasCorrect ? <CheckIcon size={18} /> : <CloseIcon size={18} />}
                    <span>
                      {wasCorrect
                        ? streak >= 2
                          ? `Mantap! ${streak} beruntun benar!`
                          : "Tepat sekali!"
                        : `Meleset · Jawaban benar: ${correctOption?.key}`}
                    </span>
                  </div>
                  {!wasCorrect && chosenOption?.trapFeedback && (
                    <p className="text-xs sm:text-sm font-bold text-[var(--coral-ink)]">
                      Letak jebakan: <MathText text={chosenOption.trapFeedback} />
                    </p>
                  )}
                  {justEnqueuedRemedial && (
                    <p className="text-[11px] font-extrabold text-[var(--ochre-ink)]">
                      Soal ini masuk antrean ulang di akhir sesi agar besok tidak terulang lagi.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setAiDrawerOpen(true);
                    }}
                    className="btn-secondary min-h-[42px] px-3.5 text-xs sm:text-sm"
                  >
                    <TutorChatIcon size={15} />
                    <span>Tanya AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAdvance}
                    className="btn-primary min-h-[42px] px-5 text-sm"
                  >
                    <span>{currentIndex + 1 >= questions.length ? "Lihat Skor Akhir [Enter]" : "Soal Berikutnya [Enter]"}</span>
                    <ArrowRightIcon size={15} />
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-structural)] space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-secondary)]">
                  Pembahasan dari Nol
                </div>
                <ol className="space-y-1.5 text-xs sm:text-sm text-[var(--ink-primary)]">
                  {currentQuestion.stepByStep.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-num font-extrabold text-[var(--accent-primary)] shrink-0">
                        {idx + 1}.
                      </span>
                      <MathText text={step} className="leading-relaxed" />
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </footer>
        )}

        <AsasAiDrawer
          open={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          subjectName={subject.name}
          chapterTitle={getAsasChapter(subject, currentQuestion.chapterId).title}
          question={currentQuestion}
          isAnswered={isAnswered}
          selectedKey={selectedKey}
        />
        <ScratchpadOverlay open={scratchpadOpen} onClose={() => setScratchpadOpen(false)} onUsed={() => {}} />
      </div>
    );
  }

  // =========================================================
  // 2. SUMMARY VIEW (Inside AppShell)
  // =========================================================
  if (view === "summary") {
    const firstPass = history.filter((h) => !h.isRemedial);
    const baseList = firstPass.length > 0 ? firstPass : history;
    const correctCount = baseList.filter((h) => h.isCorrect).length;
    const score = baseList.length > 0 ? Math.round((correctCount / baseList.length) * 100) : 0;

    // Find weakest chapter from this run
    const chPerf = new Map<string, { total: number; correct: number }>();
    for (const r of baseList) {
      const c = chPerf.get(r.chapterId) ?? { total: 0, correct: 0 };
      c.total += 1;
      if (r.isCorrect) c.correct += 1;
      chPerf.set(r.chapterId, c);
    }
    let weakestChId = chapter.id;
    let lowestPct = 101;
    for (const [chId, stat] of chPerf.entries()) {
      const pct = Math.round((stat.correct / stat.total) * 100);
      if (pct < lowestPct) {
        lowestPct = pct;
        weakestChId = chId;
      }
    }

    const wrongCount = (progress.wrongIdsBySubject[subjectId] ?? []).length;

    return (
      <AppShell>
        <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          <div className="card-tactile p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--accent-text-on-secondary)]">
                  Rekap Sesi ASAS · {subject.name}
                </div>
                <h1 className="text-2xl font-extrabold">{sessionTitle}</h1>
                <p className="text-sm text-[var(--ink-secondary)]">
                  {score >= 90
                    ? "Siap tempur menuju 100! Pertahankan ketelitian tanpa salah tanda."
                    : score >= 75
                      ? "Sudah kuat! Sekali lagi sikat soal yang salah biar menembus 95-100."
                      : "Bagus sudah berani mulai! Buka Peta Rumus bab terlemah lalu ulangi soal salahnya."}
                </p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] text-center shrink-0">
                <div className="font-num text-3xl font-extrabold text-[var(--accent-primary)] leading-none">
                  {score}
                </div>
                <div className="text-[11px] font-extrabold text-[var(--accent-text-on-secondary)] mt-1">
                  Skor (0-100)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-[var(--surface-secondary)]">
                <div className="font-num text-lg font-extrabold">
                  {correctCount}/{baseList.length}
                </div>
                <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Benar Utama</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-secondary)]">
                <div className="font-num text-lg font-extrabold">{bestStreak}</div>
                <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Streak Terbaik</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-secondary)]">
                <div className="font-num text-lg font-extrabold">{formatMMSS(elapsedSec)}</div>
                <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Durasi</div>
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--border-structural)] pt-4">
              <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-secondary)]">
                Rincian Per Bab
              </div>
              {Array.from(chPerf.entries()).map(([chId, stat]) => {
                const chMeta = getAsasChapter(subject, chId);
                const pct = Math.round((stat.correct / stat.total) * 100);
                return (
                  <div key={chId} className="flex items-center justify-between gap-3 text-xs sm:text-sm py-1">
                    <span className="font-bold truncate">{chMeta.title}</span>
                    <span
                      className={`font-num font-extrabold shrink-0 ${
                        pct >= 80 ? "text-[var(--accent-text-on-secondary)]" : "text-[var(--ochre-ink)]"
                      }`}
                    >
                      {stat.correct}/{stat.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {wrongCount > 0 && (
                <button
                  type="button"
                  onClick={() => startSession("wrong-only")}
                  className="btn-primary min-h-[42px] px-4 text-xs sm:text-sm"
                >
                  <ResetIcon size={15} />
                  <span>Ulangi {wrongCount} Soal Salah</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setChapterId(weakestChId);
                  setStudyTab("formulas");
                  setView("lobby");
                }}
                className="btn-secondary min-h-[42px] px-4 text-xs sm:text-sm"
              >
                <BookOpenIcon size={15} />
                <span>Peta Rumus Bab Terlemah</span>
              </button>
              <button
                type="button"
                onClick={() => setView("lobby")}
                className="btn-secondary min-h-[42px] px-4 text-xs sm:text-sm"
              >
                <ArrowLeftIcon size={15} />
                <span>Kembali ke Hub ASAS</span>
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // =========================================================
  // 3. LOBBY HUB (Inside AppShell)
  // =========================================================
  const subjectMasteredCount = (progress.masteredIdsBySubject[subjectId] ?? []).length;
  const subjectWrongIds = progress.wrongIdsBySubject[subjectId] ?? [];
  const subjectReadinessPct = Math.round((subjectMasteredCount / Math.max(1, subject.questions.length)) * 100);
  const completedPlanCount = subject.oneDayPlan.filter((b) => progress.checkedPlanIds.includes(b.id)).length;
  const chapterBestPct = progress.bestChapterAccuracy[chapter.id];
  const chapterQuestionCount = subject.questions.filter((q) => q.chapterId === chapter.id).length;

  return (
    <AppShell>
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5">
        {/* Page Header + Subject Switcher */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[var(--accent-text-on-secondary)]">
                <TargetIcon size={15} />
                <span>ASAS Kelas XII Sains · Target Skor 100</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                Pusat Belajar & Drill ASAS (Anti-Blank Rumus)
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-secondary)] mt-0.5">
                Baca analoginya pelan-pelan, pahami kapan rumus dipakai lewat contoh penerapan nyata, lalu uji dirimu
                di mode layar fokus.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playTapSound();
                window.dispatchEvent(new CustomEvent("rasionalin:toggle-sidebar"));
              }}
              className="hidden lg:inline-flex items-center gap-2 px-3.5 min-h-[38px] rounded-xl border border-[var(--border-structural)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-secondary)] text-xs font-extrabold text-[var(--ink-primary)] cursor-pointer shrink-0 transition-colors"
              title="Pintasan keyboard: Ctrl+B"
            >
              {sidebarHidden ? <ArrowRightIcon size={14} /> : <ArrowLeftIcon size={14} />}
              <span>{sidebarHidden ? "Tampilkan Sidebar [Ctrl+B]" : "Mode Baca Fokus (Sembunyikan Sidebar)"}</span>
            </button>
          </div>

          <div role="tablist" aria-label="Pilih mata pelajaran ASAS" className="flex flex-wrap gap-2">
            {ASAS_SUBJECTS.map((sub) => {
              const active = sub.id === subjectId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectSubject(sub.id)}
                  className={`inline-flex items-center gap-2 px-3.5 min-h-[40px] rounded-xl border text-xs sm:text-sm font-extrabold cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                      : "bg-[var(--surface-elevated)] border-[var(--border-structural)] text-[var(--ink-primary)] hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  <span>{sub.shortName}</span>
                  {sub.id === "mtk-wajib" && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-[var(--ochre-tint)] text-[var(--ochre-ink)]"
                      }`}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Unified Action + 1-Day Sprint Control Card */}
        <section aria-label="Kontrol belajar cepat ASAS" className="card-tactile p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold">{subject.name}</h2>
                <span className="px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] text-[var(--ink-secondary)] text-[11px] font-bold">
                  {subject.examSpecs}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">{subject.tagline}</p>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 max-w-[260px] h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                    style={{ width: `${subjectReadinessPct}%` }}
                  />
                </div>
                <span className="font-num text-xs font-extrabold text-[var(--ink-secondary)]">
                  {subjectMasteredCount}/{subject.questions.length} soal dikuasai ({subjectReadinessPct}%)
                </span>
                {progress.bestTryoutScore[subjectId] !== undefined && (
                  <span className="font-num text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                    · Tryout Terbaik: {progress.bestTryoutScore[subjectId]}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startSession("tryout")}
                className="btn-primary min-h-[42px] px-4 text-xs sm:text-sm"
              >
                <PlayIcon size={15} />
                <span>
                  {subject.priorityChapterIds && subject.priorityChapterIds.length > 0
                    ? `Tryout Fokus Besok (${subject.tryoutCount ?? 20} Soal)`
                    : `Tryout Campur ${subject.tryoutCount ?? 15} Soal`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => startSession("all")}
                className="btn-secondary min-h-[42px] px-4 text-xs sm:text-sm"
              >
                <CalculatorIcon size={15} />
                <span>Semua ({subject.questions.length} Soal)</span>
              </button>
              {subjectWrongIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => startSession("wrong-only")}
                  className="btn-secondary min-h-[42px] px-3.5 text-xs sm:text-sm text-[var(--coral-ink)]"
                >
                  <ResetIcon size={15} />
                  <span>Ulangi {subjectWrongIds.length} Salah</span>
                </button>
              )}
            </div>
          </div>

          {/* 1-Day Sprint Schedule Drawer */}
          <div className="border-t border-[var(--border-structural)] pt-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPlanOpen((o) => !o)}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[var(--ink-primary)] cursor-pointer"
              >
                <TimerIcon size={16} className="text-[var(--ochre-ink)]" />
                <span>Jadwal Kebut 1 Hari Tuntas</span>
                <span className="font-num px-2 py-0.5 rounded bg-[var(--ochre-tint)] text-[var(--ochre-ink)] text-[11px]">
                  {completedPlanCount}/{subject.oneDayPlan.length} selesai
                </span>
              </button>
              <span className="text-[11px] font-bold text-[var(--ink-secondary)]">
                {planOpen ? "Klik jadwal untuk centang" : "Klik judul untuk lihat jadwal"}
              </span>
            </div>

            {planOpen && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">{subject.oneDayNote}</p>
                <div className="divide-y divide-[var(--border-structural)] border border-[var(--border-structural)] rounded-xl bg-[var(--surface-canvas)]">
                  {subject.oneDayPlan.map((blk) => {
                    const checked = progress.checkedPlanIds.includes(blk.id);
                    return (
                      <div
                        key={blk.id}
                        className="px-3 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => togglePlanBlock(blk.id)}
                          className="flex items-start gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <span
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              checked
                                ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                                : "border-[var(--border-bevel)] bg-[var(--surface-elevated)]"
                            }`}
                          >
                            {checked && <CheckIcon size={12} />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-num text-[11px] font-extrabold text-[var(--ochre-ink)]">
                                {blk.timeSlot}
                              </span>
                              <span
                                className={`text-xs sm:text-sm font-extrabold ${
                                  checked ? "line-through text-[var(--ink-muted)]" : "text-[var(--ink-primary)]"
                                }`}
                              >
                                {blk.title}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                              <MathText text={blk.goal} />
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (blk.chapterId === "tryout") {
                              startSession("tryout");
                            } else {
                              playTapSound();
                              setChapterId(blk.chapterId);
                              setStudyTab("module");
                            }
                          }}
                          className="px-3 min-h-[32px] rounded-lg border border-[var(--border-structural)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-secondary)] text-[11px] font-extrabold cursor-pointer shrink-0"
                        >
                          {blk.chapterId === "tryout" ? "Mulai Tryout" : "Buka Bab"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Chapter Pills & Unified 3-Tab Study Panel */}
        <section aria-label="Materi dan peta rumus per bab" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {subject.chapters.map((ch) => {
              const active = ch.id === chapter.id;
              const chBest = progress.bestChapterAccuracy[ch.id];
              const hasPriorityList = Boolean(subject.priorityChapterIds && subject.priorityChapterIds.length > 0);
              const isPriorityChapter = hasPriorityList && subject.priorityChapterIds!.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setChapterId(ch.id);
                    setExampleIdx(0);
                    setRevealedFormulaIds([]);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 min-h-[38px] rounded-xl border text-xs sm:text-sm font-extrabold cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--olive-fill)] border-[var(--olive-fill)] text-white"
                      : "bg-[var(--surface-elevated)] border-[var(--border-structural)] text-[var(--ink-primary)] hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  <span className="font-num opacity-80">0{ch.order}</span>
                  <span>{ch.shortTitle}</span>
                  {hasPriorityList && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                        isPriorityChapter
                          ? active
                            ? "bg-white/20 text-white"
                            : "bg-[var(--ochre-tint)] text-[var(--ochre-ink)]"
                          : active
                            ? "bg-white/15 text-white/90"
                            : "bg-[var(--surface-secondary)] text-[var(--ink-muted)]"
                      }`}
                    >
                      {isPriorityChapter ? "Fokus" : "Tambahan"}
                    </span>
                  )}
                  {chBest !== undefined && (
                    <span
                      className={`font-num text-[11px] px-1.5 py-0.5 rounded ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)]"
                      }`}
                    >
                      {chBest}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="card-tactile p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-structural)] pb-4">
              <div className="space-y-1 max-w-[580px]">
                <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-secondary)]">
                  Bab {chapter.order} · Estimasi {chapter.targetMinutes} Menit
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold">{chapter.title}</h2>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                  <MathText text={chapter.summary} />
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setAiDrawerOpen(true);
                  }}
                  className="btn-secondary min-h-[40px] px-3.5 text-xs sm:text-sm"
                >
                  <TutorChatIcon size={15} />
                  <span>Tanya AI Bab Ini</span>
                </button>
                <button
                  type="button"
                  onClick={() => startSession("chapter", chapter.id)}
                  className="btn-primary min-h-[40px] px-4 text-xs sm:text-sm"
                >
                  <PlayIcon size={14} />
                  <span>Latihan Fokus Bab Ini ({chapterQuestionCount})</span>
                </button>
              </div>
            </div>

            {/* Inner Study Mode Tabs */}
            <div role="tablist" aria-label="Mode belajar bab ASAS" className="flex flex-wrap gap-2">
              {(
                [
                  { id: "module", label: "1. Belajar dari Nol (Anti-Blank)" },
                  { id: "formulas", label: `2. Peta Rumus (${chapter.formulas.length})` },
                  { id: "practice", label: `3. Latihan Bab Ini (${chapterQuestionCount})` },
                ] as const
              ).map((tab) => {
                const active = studyTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      playTapSound();
                      setStudyTab(tab.id);
                    }}
                    className={`px-3.5 min-h-[36px] rounded-lg border text-xs font-extrabold cursor-pointer transition-colors ${
                      active
                        ? "bg-[var(--accent-tint)] border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                        : "bg-[var(--surface-canvas)] border-[var(--border-structural)] text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB 1: FORMULA DECODER + MEMORY TEST */}
            {studyTab === "formulas" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[var(--surface-secondary)]">
                  <div className="text-xs font-bold text-[var(--ink-secondary)]">
                    Baca kolom <strong>Ciri Soal</strong> dulu, lalu uji ingatan rumusmu sebelum membuka contekannya!
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setMemoryTestMode((v) => !v);
                      setRevealedFormulaIds([]);
                    }}
                    className={`px-3 min-h-[34px] rounded-lg border text-xs font-extrabold cursor-pointer transition-colors ${
                      memoryTestMode
                        ? "bg-[var(--ochre-fill)] border-[var(--ochre-bevel)] text-white"
                        : "bg-[var(--surface-elevated)] border-[var(--border-structural)] text-[var(--ink-primary)]"
                    }`}
                  >
                    {memoryTestMode ? "Mode Uji Hafalan: AKTIF" : "Aktifkan Uji Hafalan Rumus"}
                  </button>
                </div>

                <div className="divide-y divide-[var(--border-structural)] border border-[var(--border-structural)] rounded-xl bg-[var(--surface-canvas)]">
                  {chapter.formulas.map((fc) => {
                    const formulaVisible = !memoryTestMode || revealedFormulaIds.includes(fc.id);
                    return (
                      <div key={fc.id} className="p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold">
                            <MathText text={fc.title} />
                          </h3>
                          <span className="px-2.5 py-1 rounded-md bg-[var(--ochre-tint)] text-[var(--ochre-ink)] text-[11px] font-extrabold">
                            Kapan dipakai: <MathText text={fc.triggerCue} />
                          </span>
                        </div>

                        {formulaVisible ? (
                          <div className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-structural)] overflow-x-auto">
                            <MathText text={fc.formulaLatex} className="text-sm" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playHintSound();
                              setRevealedFormulaIds((prev) => [...prev, fc.id]);
                            }}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--ochre-border)] bg-[var(--ochre-tint)] text-[var(--ochre-ink)] text-xs font-extrabold cursor-pointer hover:opacity-90"
                          >
                            Coba sebutkan rumusnya di kepala dulu... Klik untuk buka rumus!
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                          <div className="space-y-1">
                            <div className="font-extrabold text-[var(--ink-secondary)]">Arti Simbol:</div>
                            <ul className="space-y-0.5 text-[var(--ink-primary)]">
                              {fc.symbolMeaning.map((sm, idx) => (
                                <li key={idx}>
                                  <strong className="font-extrabold text-[var(--ink-primary)]">
                                    <MathText text={sm.symbol} />
                                  </strong>
                                  : <MathText text={sm.meaning} />
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-1.5">
                            <div>
                              <span className="font-extrabold text-[var(--coral-ink)]">Jebakan umum: </span>
                              <MathText text={fc.commonTrap} />
                            </div>
                            <div>
                              <span className="font-extrabold text-[var(--accent-text-on-secondary)]">Contoh kilat: </span>
                              <MathText text={fc.quickExample} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: MODUL ANTI-BLANK DARI NOL */}
            {studyTab === "module" && (() => {
              const allExamples = [chapter.workedExample, ...(chapter.extraExamples ?? [])];
              const activeExample = allExamples[Math.min(exampleIdx, allExamples.length - 1)] ?? chapter.workedExample;
              const decisionRows =
                chapter.decisionGuide && chapter.decisionGuide.length > 0
                  ? chapter.decisionGuide
                  : chapter.formulas.map((f) => ({
                      cue: f.triggerCue,
                      formulaLatex: f.formulaLatex,
                      firstStep: f.quickExample,
                    }));

              return (
                <div className="space-y-6">
                  {/* 1. Bayangkan Dulu + Inti Bab */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {chapter.analogy && (
                      <div className="p-4 sm:p-5 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] space-y-2">
                        <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--ochre-ink)]">
                          1. Bayangkan Dulu · {chapter.analogy.title}
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--ink-primary)]">
                          <MathText text={chapter.analogy.story} />
                        </p>
                        <p className="text-xs sm:text-sm font-extrabold text-[var(--ochre-ink)] pt-1">
                          Intinya: <MathText text={chapter.analogy.takeaway} />
                        </p>
                      </div>
                    )}

                    <div
                      className={`p-4 sm:p-5 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] space-y-2 ${
                        chapter.analogy ? "" : "lg:col-span-2"
                      }`}
                    >
                      <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--accent-text-on-secondary)]">
                        {chapter.analogy ? "2. Pembeda Utama Biar Nggak Ketukar" : "1. Logika Inti dari Nol"}
                      </div>
                      <div className="text-sm sm:text-[15px] font-semibold leading-relaxed text-[var(--ink-primary)]">
                        <MathText text={chapter.coreIntuition} />
                      </div>
                    </div>
                  </div>

                  {/* 2. Tabel Contekan Anti-Blank */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold">
                        Tabel Contekan Anti-Blank (Kalau Soal Bilang Ini → Pakai Rumus Ini)
                      </h3>
                      <span className="text-[11px] font-bold text-[var(--ink-secondary)]">
                        Cukup lihat ciri kalimat soalnya, lalu tulis langkah pertamanya!
                      </span>
                    </div>

                    <div className="divide-y divide-[var(--border-structural)] border border-[var(--border-structural)] rounded-xl bg-[var(--surface-canvas)] overflow-hidden">
                      {decisionRows.map((row, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start text-sm"
                        >
                          <div className="md:col-span-4 space-y-0.5">
                            <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--ochre-ink)]">
                              Kalau Soal Bilang
                            </div>
                            <div className="font-bold text-[var(--ink-primary)] leading-snug">
                              <MathText text={row.cue} />
                            </div>
                          </div>
                          <div className="md:col-span-4 p-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-structural)] overflow-x-auto">
                            <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--accent-text-on-secondary)] mb-1">
                              Pakai Rumus
                            </div>
                            <MathText text={row.formulaLatex} className="text-sm font-semibold" />
                          </div>
                          <div className="md:col-span-4 space-y-0.5">
                            <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--olive-ink)]">
                              Langsung Tulis Ini Dulu
                            </div>
                            <div className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                              <MathText text={row.firstStep} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Bedah Contoh Soal 1-per-1 (Clean Stepper) */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold">
                        Bedah Contoh Soal Pelan-Pelan ({allExamples.length} Pola)
                      </h3>
                      {allExamples.length > 1 && (
                        <div className="flex flex-wrap gap-1.5">
                          {allExamples.map((_, idx) => {
                            const active = idx === Math.min(exampleIdx, allExamples.length - 1);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  playTapSound();
                                  setExampleIdx(idx);
                                }}
                                className={`px-3 min-h-[32px] rounded-lg border text-xs font-extrabold cursor-pointer transition-colors ${
                                  active
                                    ? "bg-[var(--ochre-fill)] border-[var(--ochre-bevel)] text-white"
                                    : "bg-[var(--surface-canvas)] border-[var(--border-structural)] text-[var(--ink-primary)] hover:bg-[var(--surface-secondary)]"
                                }`}
                              >
                                Contoh {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] space-y-4">
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--ochre-ink)]">
                          {activeExample.title}
                        </div>
                        {activeExample.whenToUse && (
                          <div className="text-xs font-bold text-[var(--ink-secondary)]">
                            Kapan pola ini keluar: <MathText text={activeExample.whenToUse} />
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-structural)] text-sm sm:text-[15px] font-bold text-[var(--ink-primary)] leading-relaxed">
                        <MathText text={activeExample.problem} />
                      </div>

                      <div className="space-y-3">
                        {activeExample.steps.map((st, idx) => (
                          <div key={idx} className="pl-3.5 border-l-2 border-[var(--accent-primary)] space-y-1.5">
                            <div className="text-xs sm:text-sm font-extrabold text-[var(--accent-text-on-secondary)]">
                              <MathText text={st.stepLabel} />
                            </div>
                            <div className="text-sm text-[var(--ink-primary)] leading-relaxed">
                              <MathText text={st.detail} />
                            </div>
                            {st.math && (
                              <div className="overflow-x-auto text-sm">
                                <MathText text={st.math} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2.5 border-t border-[var(--border-structural)] text-sm font-extrabold text-[var(--accent-text-on-secondary)]">
                        Jawaban Akhir: <MathText text={activeExample.finalAnswer} />
                      </div>
                    </div>
                  </div>

                  {/* 4. Checklist Anti-Jebakan */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm sm:text-base font-extrabold">Checklist Anti-Jebakan Sebelum Pilih A-E</h3>
                    <div className="divide-y divide-[var(--border-structural)] border border-[var(--border-structural)] rounded-xl bg-[var(--surface-canvas)]">
                      {chapter.mentalChecklist.map((item, idx) => (
                        <div key={idx} className="px-4 py-3 flex items-start gap-3 text-sm">
                          <span className="font-num font-extrabold text-[var(--accent-primary)] shrink-0">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <MathText text={item} className="leading-relaxed" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setAiDrawerOpen(true);
                      }}
                      className="btn-secondary min-h-[42px] px-4 text-sm"
                    >
                      <TutorChatIcon size={15} />
                      <span>Masih Bingung? Tanya AI Bab Ini</span>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setStudyTab("formulas");
                        }}
                        className="btn-secondary min-h-[42px] px-4 text-sm"
                      >
                        <BookOpenIcon size={15} />
                        <span>Lanjut ke Peta Rumus</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startSession("chapter", chapter.id)}
                        className="btn-primary min-h-[42px] px-5 text-sm"
                      >
                        <PlayIcon size={15} />
                        <span>Siap Coba? Latihan Bab Ini!</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SUB-TAB 3: READY TO PRACTICE OVERVIEW */}
            {studyTab === "practice" && (
              <div className="p-4 rounded-xl bg-[var(--surface-canvas)] border border-[var(--border-structural)] flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-extrabold">
                    Latihan Bab {chapter.order}: {chapter.title}
                  </div>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    {chapterQuestionCount} soal terverifikasi lengkap dengan tombol Rumus Apa [H], Coretan [S], dan
                    Pembahasan dari Nol.
                    {chapterBestPct !== undefined ? ` Akurasi terbaikmu: ${chapterBestPct}%.` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startSession("chapter", chapter.id)}
                  className="btn-primary min-h-[42px] px-5 text-sm shrink-0"
                >
                  <PlayIcon size={15} />
                  <span>Mulai Latihan Fokus Bab Ini</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <AsasAiDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        subjectName={subject.name}
        chapterTitle={chapter.title}
        chapterSummary={chapter.summary}
        question={null}
      />
    </AppShell>
  );
}
