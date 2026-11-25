"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  FlagIcon,
  GridNumbersIcon,
  KeyboardIcon,
  NodeLockIcon,
  ScratchpadIcon,
  TextSizeIcon,
  TimerIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import { ScratchpadOverlay } from "@/components/study/ScratchpadOverlay";
import type {
  ActiveBlockAnswerMap,
  SimulationReviewPayload,
} from "@/application/simulation-service";
import type {
  QuestionOption,
  SimulationSessionEntity,
  SimulationSubtestBlockEntity,
} from "@/domain/types";

export interface SimQuestionPublic {
  id: string;
  subtest: string;
  track?: "quantitative" | "literacy";
  stemMarkdown: string;
  passageText: string | null;
  diagramAssetUrl?: string | null;
  diagramAltText?: string | null;
  options: QuestionOption[];
}

export interface ActiveSimPayload {
  session: SimulationSessionEntity;
  blocks: SimulationSubtestBlockEntity[];
  questionsById: Record<string, SimQuestionPublic>;
  review?: SimulationReviewPayload | null;
  activeBlockAnswers?: ActiveBlockAnswerMap;
}

interface SimulationFocusTunnelProps {
  sim: ActiveSimPayload;
  activeBlock: SimulationSubtestBlockEntity;
  onSessionUpdated: (
    session: SimulationSessionEntity,
    blocks: SimulationSubtestBlockEntity[],
    review?: SimulationReviewPayload | null,
  ) => void;
  onExitConfirmed: () => void;
}

const SUBTEST_FULL_NAME: Record<string, string> = {
  PU: "Penalaran Umum",
  PPU: "Pengetahuan & Pemahaman Umum",
  PBM: "Pemahaman Bacaan & Menulis",
  PK: "Pengetahuan Kuantitatif",
  LBI: "Literasi Bahasa Indonesia",
  LBE: "Literasi Bahasa Inggris",
  PM: "Penalaran Matematika",
};

export function SimulationFocusTunnel({
  sim,
  activeBlock,
  onSessionUpdated,
  onExitConfirmed,
}: SimulationFocusTunnelProps) {
  const [qIndex, setQIndex] = useState(0);
  const [draftChoices, setDraftChoices] = useState<Record<string, "A" | "B" | "C" | "D" | "E">>({});
  const [submittedState, setSubmittedState] = useState<
    Record<string, { status: "answered" | "skipped"; key: "A" | "B" | "C" | "D" | "E" | null }>
  >({});
  const [flaggedMap, setFlaggedMap] = useState<Record<string, boolean>>({});

  const [secondsLeft, setSecondsLeft] = useState(activeBlock.allocatedSeconds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineBanner, setOfflineBanner] = useState<string | null>(null);

  // Focus Mode Utilities
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);

  const questionStartRef = useRef<number>(Date.now());
  const autoLockedBlockRef = useRef<string | null>(null);

  // Reset or hydrate question cursor & local block maps when entering/resuming a block
  useEffect(() => {
    const initialSubmitted: Record<
      string,
      { status: "answered" | "skipped"; key: "A" | "B" | "C" | "D" | "E" | null }
    > = {};
    if (sim.activeBlockAnswers) {
      for (const qId of activeBlock.questionIds) {
        const saved = sim.activeBlockAnswers[qId];
        if (saved) initialSubmitted[qId] = saved;
      }
    }
    const firstPending = activeBlock.questionIds.findIndex(
      (qId) => initialSubmitted[qId]?.status !== "answered",
    );
    setQIndex(firstPending >= 0 ? firstPending : 0);
    setDraftChoices({});
    setSubmittedState(initialSubmitted);
    setFlaggedMap({});
    setLockConfirmOpen(false);
    setError(null);
    questionStartRef.current = Date.now();
  }, [activeBlock.id, activeBlock.questionIds, sim.activeBlockAnswers]);

  // Browser tab/refresh safety guard while exam is running
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const executeLockBlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setLockConfirmOpen(false);
    try {
      const res = await fetch(`/api/simulation/${sim.session.id}/lock-block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId: activeBlock.id }),
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error ?? "Gagal mengunci blok subtes.");
      }
      const updated = (await res.json()) as {
        session: SimulationSessionEntity;
        blocks: SimulationSubtestBlockEntity[];
        review?: SimulationReviewPayload | null;
      };
      onSessionUpdated(updated.session, updated.blocks, updated.review ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunci blok subtes.");
    } finally {
      setBusy(false);
    }
  }, [busy, sim.session.id, activeBlock.id, onSessionUpdated]);

  // Countdown clock synced to server endsAt + automatic lock when hitting 0
  useEffect(() => {
    if (!activeBlock.endsAt) return;
    const tick = () => {
      const diff = Math.max(
        0,
        Math.round((new Date(activeBlock.endsAt!).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(diff);
      if (diff === 0 && autoLockedBlockRef.current !== activeBlock.id) {
        autoLockedBlockRef.current = activeBlock.id;
        void executeLockBlock();
      }
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [activeBlock.id, activeBlock.endsAt, executeLockBlock]);

  const currentQId = activeBlock.questionIds[qIndex];
  const currentQuestion = currentQId ? sim.questionsById[currentQId] ?? null : null;
  const currentSubmission = currentQId ? submittedState[currentQId] : undefined;
  const selectedKey = currentQId
    ? currentSubmission?.key ?? draftChoices[currentQId] ?? null
    : null;
  const isCurrentFlagged = Boolean(currentQId && flaggedMap[currentQId]);

  const blockStats = useMemo(() => {
    const total = activeBlock.questionIds.length;
    let answered = 0;
    let skipped = 0;
    let flagged = 0;
    for (const qId of activeBlock.questionIds) {
      const st = submittedState[qId];
      if (st?.status === "answered") answered += 1;
      else if (st?.status === "skipped") skipped += 1;
      if (flaggedMap[qId]) flagged += 1;
    }
    return {
      total,
      answered,
      skipped,
      unanswered: Math.max(0, total - answered),
      flagged,
    };
  }, [activeBlock.questionIds, submittedState, flaggedMap]);

  const jumpToQuestion = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= activeBlock.questionIds.length) return;
      setQIndex(idx);
      setNavDrawerOpen(false);
      questionStartRef.current = Date.now();
    },
    [activeBlock.questionIds.length],
  );

  const submitAnswer = useCallback(
    async (smartSkip: boolean) => {
      if (!currentQId || busy) return;
      // Prevent double-scoring an already answered question in this block
      if (submittedState[currentQId]?.status === "answered") {
        if (qIndex + 1 < activeBlock.questionIds.length) {
          jumpToQuestion(qIndex + 1);
        }
        return;
      }

      const chosen = draftChoices[currentQId] ?? null;
      if (!smartSkip && !chosen) return;

      setBusy(true);
      setError(null);
      setOfflineBanner(null);
      const solveMs = Date.now() - questionStartRef.current;

      const payload = {
        blockId: activeBlock.id,
        questionId: currentQId,
        selectedAnswerKey: smartSkip ? null : chosen,
        timeToSolveMs: solveMs,
        triageDecisionMs: solveMs,
        triageAction: smartSkip
          ? "skipped_smart"
          : flaggedMap[currentQId]
            ? "flagged_and_solved"
            : "solved_directly",
      };

      try {
        const res = await fetch(`/api/simulation/${sim.session.id}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errJson?.error ?? "Gagal mengirim jawaban.");
        }

        setSubmittedState((prev) => ({
          ...prev,
          [currentQId]: {
            status: smartSkip ? "skipped" : "answered",
            key: smartSkip ? null : chosen,
          },
        }));

        // Advance smoothly to next unanswered question or next index
        const nextIdx = activeBlock.questionIds.findIndex(
          (id, idx) => idx > qIndex && submittedState[id]?.status !== "answered",
        );
        if (nextIdx >= 0) {
          jumpToQuestion(nextIdx);
        } else if (qIndex + 1 < activeBlock.questionIds.length) {
          jumpToQuestion(qIndex + 1);
        }
      } catch (err) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          localStorage.setItem(`kejarsnbt_sim_pending_${currentQId}`, JSON.stringify(payload));
          setOfflineBanner("Koneksi terputus, jawaban tersimpan sementara di perangkatmu.");
        } else {
          setError(err instanceof Error ? err.message : "Gagal menyimpan jawaban tryout.");
        }
      } finally {
        setBusy(false);
      }
    },
    [
      currentQId,
      busy,
      submittedState,
      draftChoices,
      flaggedMap,
      activeBlock.id,
      activeBlock.questionIds,
      sim.session.id,
      qIndex,
      jumpToQuestion,
    ],
  );

  // Full CBT Keyboard Shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (exitModalOpen) {
          setExitModalOpen(false);
          return;
        }
        if (lockConfirmOpen) {
          setLockConfirmOpen(false);
          return;
        }
        if (shortcutModalOpen) {
          setShortcutModalOpen(false);
          return;
        }
        if (navDrawerOpen) {
          setNavDrawerOpen(false);
          return;
        }
        if (scratchpadOpen) {
          setScratchpadOpen(false);
          return;
        }
      }

      if (exitModalOpen || lockConfirmOpen || shortcutModalOpen) return;

      if (e.key === "?") {
        e.preventDefault();
        setShortcutModalOpen((v) => !v);
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        setScratchpadOpen((v) => !v);
      } else if (e.key.toLowerCase() === "f" && currentQId) {
        e.preventDefault();
        setFlaggedMap((prev) => ({ ...prev, [currentQId]: !prev[currentQId] }));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        jumpToQuestion(qIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        jumpToQuestion(qIndex + 1);
      } else if (
        ["1", "2", "3", "4", "5"].includes(e.key) &&
        currentQuestion &&
        currentQId &&
        currentSubmission?.status !== "answered"
      ) {
        const opt = currentQuestion.options[Number(e.key) - 1];
        if (opt) {
          setDraftChoices((prev) => ({ ...prev, [currentQId]: opt.key }));
        }
      } else if (e.key === "Enter" && selectedKey && currentSubmission?.status !== "answered") {
        e.preventDefault();
        void submitAnswer(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    exitModalOpen,
    lockConfirmOpen,
    shortcutModalOpen,
    navDrawerOpen,
    scratchpadOpen,
    currentQId,
    currentQuestion,
    currentSubmission,
    selectedKey,
    qIndex,
    jumpToQuestion,
    submitAnswer,
  ]);

  const isTimeUrgent = secondsLeft <= 60;
  const activeBlockIdx = sim.blocks.findIndex((b) => b.id === activeBlock.id);
  const isLastBlock = activeBlockIdx === sim.blocks.length - 1;
  const hasPassage = Boolean(currentQuestion?.passageText);

  const maxOptLen = currentQuestion
    ? Math.max(
        ...currentQuestion.options.map((o) =>
          o.textMarkdown.replace(/\\dfrac|\\frac|\\text|\$/g, "").trim().length,
        ),
      )
    : 40;

  const optionGridClasses = hasPassage
    ? maxOptLen <= 22
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1"
    : maxOptLen <= 28
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
      : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-canvas)] text-[var(--ink-primary)]">
      {/* Zero-Distraction Focus Exam Top Bar */}
      <header className="sticky top-0 z-30 h-16 bg-[var(--surface-elevated)] border-b border-[var(--border-structural)] px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Exit + Active Subtest + Block Stepper */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setExitModalOpen(true)}
            aria-label="Keluar Tryout"
            title="Keluar Tryout"
            className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-[var(--ink-secondary)] hover:text-[var(--coral-ink)] hover:bg-[var(--coral-tint)] shrink-0 cursor-pointer transition-colors"
          >
            <CloseIcon size={19} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base truncate">
                {activeBlock.subtest} · {SUBTEST_FULL_NAME[activeBlock.subtest] ?? activeBlock.subtest}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink-secondary)]">
              <span>
                Blok <span className="font-num">{activeBlockIdx + 1}/{sim.blocks.length}</span>
              </span>
              <span>·</span>
              <span>
                Terjawab{" "}
                <span className="font-num text-[var(--accent-text-on-secondary)]">
                  {blockStats.answered}/{blockStats.total}
                </span>
              </span>
            </div>
          </div>

          {/* Desktop Subtest Block Stepper */}
          <div className="hidden xl:flex items-center gap-1 pl-3 ml-2 border-l border-[var(--border-structural)]">
            {sim.blocks.map((b) => (
              <span
                key={b.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-extrabold ${
                  b.id === activeBlock.id
                    ? "bg-[var(--accent-primary)] text-white"
                    : b.isLocked
                      ? "bg-[var(--surface-secondary)] text-[var(--ink-muted)]"
                      : "text-[var(--ink-secondary)]"
                }`}
              >
                {b.isLocked && <NodeLockIcon size={11} />}
                {b.subtest}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Exam Utilities + Live Countdown Clock */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div
            aria-label="Sisa waktu subtes"
            className={`inline-flex items-center gap-1.5 font-num text-sm sm:text-base font-bold px-3 min-h-[40px] rounded-xl border ${
              isTimeUrgent
                ? "bg-[var(--coral-tint)] border-[var(--coral-border)] text-[var(--coral-ink)] animate-pulse"
                : "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)]"
            }`}
          >
            <TimerIcon size={18} />
            <span>
              {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLargeText((v) => !v)}
            aria-pressed={largeText}
            title="Perbesar / normalkan ukuran teks soal"
            className={`hidden sm:inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
              largeText
                ? "bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)]"
                : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            <TextSizeIcon size={19} />
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
            <span className="hidden md:inline">Coretan</span>
          </button>

          <button
            type="button"
            onClick={() => setNavDrawerOpen((v) => !v)}
            aria-label="Buka navigasi nomor soal"
            className="lg:hidden min-h-[38px] px-2.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1 text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
          >
            <GridNumbersIcon size={18} />
            <span className="font-num">
              {qIndex + 1}/{activeBlock.questionIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLockConfirmOpen(true)}
            disabled={busy}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl bg-[var(--olive-fill)] hover:bg-[var(--olive-hover)] text-white text-xs font-extrabold cursor-pointer transition-colors"
          >
            <NodeLockIcon size={15} />
            <span>{isLastBlock ? "Selesaikan Tryout" : "Kunci Subtes"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShortcutModalOpen((v) => !v)}
            aria-label="Pintasan keyboard"
            className="hidden md:inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
          >
            <KeyboardIcon size={19} />
          </button>
        </div>
      </header>

      {/* Main Distraction-Free Exam Canvas */}
      <main className="flex-1 w-full max-w-[1160px] mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl border border-[var(--coral-border)] bg-[var(--coral-tint)] text-xs font-bold text-[var(--coral-ink)]">
            {error}
          </div>
        )}

        {offlineBanner && (
          <div className="p-3.5 rounded-xl border border-[var(--ochre-border)] bg-[var(--ochre-tint)] text-xs font-bold text-[var(--ochre-ink)]">
            {offlineBanner}
          </div>
        )}

        {/* Desktop Compact Question Number Navigator Strip */}
        <section
          aria-label="Navigasi nomor soal subtes"
          className="hidden lg:flex items-center justify-between gap-4 pb-3 border-b border-[var(--border-structural)]"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {activeBlock.questionIds.map((qId, idx) => {
              const st = submittedState[qId];
              const isFlagged = Boolean(flaggedMap[qId]);
              const isActive = idx === qIndex;

              let btnClass =
                "bg-[var(--surface-elevated)] border-[var(--border-structural)] text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]";
              if (st?.status === "answered") {
                btnClass =
                  "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white";
              } else if (isFlagged) {
                btnClass =
                  "bg-[var(--ochre-tint)] border-[var(--ochre-fill)] text-[var(--ochre-ink)]";
              } else if (st?.status === "skipped") {
                btnClass =
                  "bg-[var(--surface-secondary)] border-[var(--border-bevel)] text-[var(--ink-muted)]";
              }

              return (
                <button
                  key={qId}
                  type="button"
                  onClick={() => jumpToQuestion(idx)}
                  aria-label={`Soal nomor ${idx + 1}${st?.status === "answered" ? " sudah dijawab" : ""}${isFlagged ? " ragu-ragu" : ""}`}
                  className={`relative w-9 h-9 rounded-lg border-2 font-num text-xs font-bold inline-flex items-center justify-center cursor-pointer transition-all ${btnClass} ${
                    isActive ? "ring-2 ring-offset-2 ring-[var(--accent-primary)]" : ""
                  }`}
                >
                  {idx + 1}
                  {isFlagged && st?.status === "answered" && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--ochre-fill)] border border-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-[var(--ink-secondary)] shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-primary)]" />
              Tersimpan ({blockStats.answered})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--ochre-fill)]" />
              Ragu-ragu ({blockStats.flagged})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm border border-[var(--border-bevel)] bg-[var(--surface-elevated)]" />
              Belum ({blockStats.unanswered})
            </span>
          </div>
        </section>

        {/* Active Exam Question Surface (Split-Pane Literacy vs Panoramic Quantitative) */}
        {currentQuestion && (
          <div
            className={
              hasPassage
                ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                : "max-w-[1060px] mx-auto space-y-4"
            }
          >
            {hasPassage && currentQuestion.passageText && (
              <section
                aria-label="Teks bacaan soal"
                className="lg:col-span-6 card-tactile p-5 sm:p-6 space-y-3 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto"
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                  Bacaan Subtes {activeBlock.subtest}
                </div>
                <div
                  className={`font-serif-passage leading-relaxed whitespace-pre-line ${
                    largeText ? "text-lg" : "text-[15px] sm:text-base"
                  }`}
                >
                  {currentQuestion.passageText}
                </div>
              </section>
            )}

            <section className={hasPassage ? "lg:col-span-6 space-y-4" : "space-y-4"}>
              {/* Question Header & Stem Card */}
              <div className="card-tactile p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[var(--ink-secondary)]">
                  <span>
                    Soal <span className="font-num text-[var(--ink-primary)]">{qIndex + 1}</span> dari{" "}
                    <span className="font-num">{activeBlock.questionIds.length}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    {isCurrentFlagged && (
                      <span className="inline-flex items-center gap-1 text-[var(--ochre-ink)]">
                        <FlagIcon size={14} />
                        Ditandai Ragu-Ragu
                      </span>
                    )}
                    {currentSubmission?.status === "answered" && (
                      <span className="inline-flex items-center gap-1 text-[var(--accent-text-on-secondary)]">
                        <CheckIcon size={14} />
                        Tersimpan (Opsi {currentSubmission.key})
                      </span>
                    )}
                    {currentSubmission?.status === "skipped" && (
                      <span className="text-[var(--ink-muted)]">Dilewati Cerdas · Bisa dijawab lagi</span>
                    )}
                  </div>
                </div>

                <div
                  className={`leading-relaxed font-bold ${
                    largeText ? "text-lg sm:text-xl" : "text-base sm:text-[17px]"
                  }`}
                >
                  <MathText text={currentQuestion.stemMarkdown} />
                </div>

                {currentQuestion.diagramAssetUrl && (
                  <figure className="p-3 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)]">
                    <img
                      src={currentQuestion.diagramAssetUrl}
                      alt={currentQuestion.diagramAltText ?? "Diagram soal tryout"}
                      className="max-h-72 mx-auto object-contain"
                    />
                  </figure>
                )}
              </div>

              {/* Horizontal Adaptive Option Selector A-E */}
              <div
                className={`grid gap-2.5 ${optionGridClasses}`}
                role="radiogroup"
                aria-label="Pilihan jawaban A sampai E"
              >
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedKey === opt.key;
                  const isLockedAnswer = currentSubmission?.status === "answered";

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={isLockedAnswer || busy}
                      onClick={() => {
                        if (currentQId) {
                          setDraftChoices((prev) => ({ ...prev, [currentQId]: opt.key }));
                        }
                      }}
                      className={`w-full h-full text-left p-3.5 rounded-xl border-2 border-b-4 min-h-[58px] flex items-start gap-2.5 cursor-pointer transition-all disabled:cursor-not-allowed ${
                        isSelected
                          ? "border-[var(--accent-primary)] border-b-[var(--accent-bevel)] bg-[var(--accent-tint)]"
                          : "border-[var(--border-structural)] border-b-[var(--border-bevel)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-secondary)] disabled:opacity-65"
                      }`}
                    >
                      <span
                        title={`Pintasan ${idx + 1}`}
                        className={`w-7 h-7 rounded-lg border-2 inline-flex items-center justify-center font-num font-bold text-xs shrink-0 ${
                          isSelected
                            ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                            : "text-[var(--ink-secondary)] border-[var(--border-structural)]"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <MathText
                        text={opt.textMarkdown}
                        className={`font-bold pt-0.5 ${largeText ? "text-base" : "text-sm sm:text-[15px]"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Sticky Bottom Exam Controls Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-[var(--surface-elevated)] border-t-2 border-[var(--border-structural)] px-4 sm:px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
        <div className="max-w-[1060px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Prev / Flag / Next */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={qIndex === 0}
              onClick={() => jumpToQuestion(qIndex - 1)}
              className="btn-secondary min-h-[42px] px-3 text-xs disabled:opacity-40"
              aria-label="Soal sebelumnya"
            >
              <ArrowLeftIcon size={15} />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentQId) {
                  setFlaggedMap((prev) => ({ ...prev, [currentQId]: !prev[currentQId] }));
                }
              }}
              aria-pressed={isCurrentFlagged}
              className={`min-h-[42px] px-3 rounded-xl border-2 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                isCurrentFlagged
                  ? "bg-[var(--ochre-tint)] border-[var(--ochre-fill)] text-[var(--ochre-ink)]"
                  : "bg-[var(--surface-elevated)] border-[var(--border-structural)] text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]"
              }`}
            >
              <FlagIcon size={15} />
              <span>Ragu-Ragu</span>
            </button>

            <button
              type="button"
              disabled={qIndex >= activeBlock.questionIds.length - 1}
              onClick={() => jumpToQuestion(qIndex + 1)}
              className="btn-secondary min-h-[42px] px-3 text-xs disabled:opacity-40"
              aria-label="Soal berikutnya"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ArrowRightIcon size={15} />
            </button>
          </div>

          {/* Right: Smart Skip + Save Answer + Mobile Lock Block */}
          <div className="flex items-center gap-2">
            {currentSubmission?.status !== "answered" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitAnswer(true)}
                className="btn-secondary min-h-[42px] px-3 text-xs"
              >
                Lewati Cerdas
              </button>
            )}

            {currentSubmission?.status === "answered" ? (
              qIndex < activeBlock.questionIds.length - 1 ? (
                <button
                  type="button"
                  onClick={() => jumpToQuestion(qIndex + 1)}
                  className="btn-primary min-h-[42px] text-xs"
                >
                  <span>Soal Berikutnya</span>
                  <ArrowRightIcon size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setLockConfirmOpen(true)}
                  className="btn-primary min-h-[42px] text-xs"
                >
                  <NodeLockIcon size={15} />
                  <span>{isLastBlock ? "Selesaikan Tryout" : "Kunci Subtes & Lanjut"}</span>
                </button>
              )
            ) : (
              <button
                type="button"
                disabled={!selectedKey || busy}
                onClick={() => void submitAnswer(false)}
                className="btn-primary min-h-[42px] min-w-[148px] text-xs"
              >
                {busy ? "Menyimpan..." : "Simpan Jawaban"}
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Scratchpad Overlay */}
      <ScratchpadOverlay
        open={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        onUsed={() => {}}
      />

      {/* Mobile Question Navigator Sheet */}
      {navDrawerOpen && (
        <>
          <div
            onClick={() => setNavDrawerOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/35"
          />
          <aside
            role="dialog"
            aria-label="Navigasi nomor soal mobile"
            className="fixed bottom-0 inset-x-0 z-50 bg-[var(--surface-elevated)] border-t-2 border-[var(--border-structural)] rounded-t-2xl p-5 space-y-4 max-h-[75vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Navigasi Soal · {activeBlock.subtest}</h2>
              <button
                type="button"
                onClick={() => setNavDrawerOpen(false)}
                aria-label="Tutup navigasi soal"
                className="p-2 rounded-lg text-[var(--ink-secondary)] cursor-pointer"
              >
                <CloseIcon size={17} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {activeBlock.questionIds.map((qId, idx) => {
                const st = submittedState[qId];
                const isFlagged = Boolean(flaggedMap[qId]);
                const isActive = idx === qIndex;
                return (
                  <button
                    key={qId}
                    type="button"
                    onClick={() => jumpToQuestion(idx)}
                    className={`h-11 rounded-xl border-2 font-num text-sm font-bold cursor-pointer ${
                      st?.status === "answered"
                        ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                        : isFlagged
                          ? "bg-[var(--ochre-tint)] border-[var(--ochre-fill)] text-[var(--ochre-ink)]"
                          : "bg-[var(--surface-canvas)] border-[var(--border-structural)] text-[var(--ink-primary)]"
                    } ${isActive ? "ring-2 ring-[var(--accent-primary)]" : ""}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setNavDrawerOpen(false);
                setLockConfirmOpen(true);
              }}
              className="btn-olive w-full text-xs"
            >
              <NodeLockIcon size={15} />
              <span>{isLastBlock ? "Selesaikan Tryout" : "Kunci Subtes & Lanjut"}</span>
            </button>
          </aside>
        </>
      )}

      {/* Lock Subtest Confirmation Modal */}
      {lockConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi kunci subtes"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md card-tactile p-6 shadow-[var(--shadow-sheet)] space-y-4">
            <h2 className="text-xl font-bold">
              {isLastBlock ? "Selesaikan & hitung skor tryout?" : `Kunci subtes ${activeBlock.subtest} sekarang?`}
            </h2>
            <p className="text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
              Setelah dikunci, kamu tidak dapat kembali ke subtes{" "}
              <strong>{activeBlock.subtest}</strong> persis seperti aturan resmi UTBK-SNBT.
            </p>
            <div className="grid grid-cols-3 divide-x divide-[var(--border-structural)] py-2.5 border-y border-[var(--border-structural)] text-center text-xs">
              <div>
                <div className="font-num text-lg font-bold text-[var(--accent-text-on-secondary)]">
                  {blockStats.answered}
                </div>
                <div className="font-bold text-[var(--ink-secondary)]">Terjawab</div>
              </div>
              <div>
                <div className="font-num text-lg font-bold text-[var(--ochre-ink)]">
                  {blockStats.flagged}
                </div>
                <div className="font-bold text-[var(--ink-secondary)]">Ragu-ragu</div>
              </div>
              <div>
                <div className="font-num text-lg font-bold text-[var(--coral-ink)]">
                  {blockStats.unanswered}
                </div>
                <div className="font-bold text-[var(--ink-secondary)]">Belum Dijawab</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setLockConfirmOpen(false)}
                className="btn-secondary flex-1"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void executeLockBlock()}
                className="btn-primary flex-1"
              >
                {busy ? "Mengunci..." : isLastBlock ? "Ya, Selesaikan" : "Ya, Kunci & Lanjut"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Simulation Confirmation Overlay */}
      {exitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi keluar tryout"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md card-tactile p-6 shadow-[var(--shadow-sheet)] space-y-4">
            <h2 className="text-xl font-bold">Yakin ingin meninggalkan tryout?</h2>
            <p className="text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
              Sesi tryout masih berjalan (waktu server terus menghitung). Jawaban yang sudah kamu simpan tetap aman, dan kamu bisa melanjutkannya lagi dari lobby Tryout selama waktu blok belum habis.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExitModalOpen(false)}
                className="btn-primary flex-1"
              >
                Lanjut Tryout
              </button>
              <button
                type="button"
                onClick={() => {
                  setExitModalOpen(false);
                  onExitConfirmed();
                }}
                className="btn-danger flex-1"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Guide Modal */}
      {shortcutModalOpen && (
        <div
          role="dialog"
          aria-label="Daftar pintasan keyboard tryout"
          className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md card-tactile p-6 shadow-[var(--shadow-sheet)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Pintasan Keyboard Tryout</h2>
              <button
                type="button"
                onClick={() => setShortcutModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)] cursor-pointer"
                aria-label="Tutup daftar pintasan"
              >
                <CloseIcon size={17} />
              </button>
            </div>
            <dl className="divide-y divide-[var(--border-structural)] text-sm">
              {[
                ["1 - 5", "Pilih jawaban A sampai E"],
                ["Enter", "Simpan jawaban & lanjut"],
                ["← / →", "Pindah soal sebelumnya / berikutnya"],
                ["F", "Tandai / hapus tanda Ragu-Ragu"],
                ["S", "Buka atau tutup kertas coretan"],
                ["Esc", "Tutup jendela bantuan"],
              ].map(([k, desc]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2">
                  <dt className="font-mono-telemetry text-xs font-bold px-2 py-0.5 rounded bg-[var(--surface-secondary)]">
                    {k}
                  </dt>
                  <dd className="text-xs font-semibold text-[var(--ink-secondary)]">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
