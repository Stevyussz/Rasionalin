"use client";

import Link from "next/link";
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
  TimerIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import { ScratchpadOverlay } from "@/components/study/ScratchpadOverlay";
import {
  generateMathGymSession,
  generateSingleMathGymQuestion,
  getCategoryMeta,
  MATH_GYM_BELTS,
  MATH_GYM_CATEGORIES,
  type MathGymCategory,
  type MathGymCoreCategory,
  type MathGymDifficulty,
  type MathGymQuestion,
} from "@/domain/math-gym-engine";

interface CategoryLocalStat {
  sessions: number;
  bestAccuracyPct: number;
  lastAccuracyPct: number;
}

type StoredGymStats = Partial<Record<MathGymCategory, CategoryLocalStat>>;

const STATS_STORAGE_KEY = "rasionalin_math_gym_stats_v1";
const SPRINT_COUNT = 10;
const MAX_REMEDIAL_RETRIES = 3;

const DIFFICULTY_META: Array<{
  id: MathGymDifficulty;
  label: string;
  desc: string;
}> = [
  { id: "dasar", label: "Level 1 · Dasar (Nol)", desc: "Angka kecil, konsep 1 langkah" },
  { id: "standar", label: "Level 2 · Standar SNBT", desc: "Campur & soal cerita rutin" },
  { id: "tantangan", label: "Level 3 · Tantangan", desc: "2 langkah & jebakan ekstra" },
];

interface AnsweredRecord {
  questionId: string;
  category: MathGymCoreCategory;
  categoryLabel: string;
  isCorrect: boolean;
  elapsedSec: number;
  isRemedialRetry?: boolean;
}

export function MathGymWorkspace() {
  const [view, setView] = useState<"lobby" | "sprint" | "summary">("lobby");
  const [selectedDifficulty, setSelectedDifficulty] = useState<MathGymDifficulty>("dasar");
  const [activeCategory, setActiveCategory] = useState<MathGymCategory>("mixed");
  const [activeDifficulty, setActiveDifficulty] = useState<MathGymDifficulty>("dasar");
  const [questions, setQuestions] = useState<MathGymQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [history, setHistory] = useState<AnsweredRecord[]>([]);
  const [remedialEnqueuedCount, setRemedialEnqueuedCount] = useState(0);
  const [justEnqueuedRemedial, setJustEnqueuedRemedial] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [sprintElapsedSec, setSprintElapsedSec] = useState(0);
  const [stats, setStats] = useState<StoredGymStats>({});

  const sprintStartRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        setStats(JSON.parse(raw) as StoredGymStats);
      }
    } catch {
      // Ignore storage unavailable errors
    }
  }, []);

  const persistCategoryResult = useCallback(
    (category: MathGymCategory, accuracyPct: number) => {
      setStats((prev) => {
        const existing = prev[category];
        const next: StoredGymStats = {
          ...prev,
          [category]: {
            sessions: (existing?.sessions ?? 0) + 1,
            bestAccuracyPct: Math.max(existing?.bestAccuracyPct ?? 0, accuracyPct),
            lastAccuracyPct: accuracyPct,
          },
        };
        try {
          localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore quota errors
        }
        return next;
      });
    },
    [],
  );

  const startSprint = useCallback(
    (category: MathGymCategory, difficulty: MathGymDifficulty = selectedDifficulty) => {
      const generated = generateMathGymSession(category, SPRINT_COUNT, Date.now(), difficulty);
      setActiveCategory(category);
      setActiveDifficulty(difficulty);
      setQuestions(generated);
      setCurrentIndex(0);
      setSelectedKey(null);
      setHintOpen(false);
      setStreak(0);
      setBestStreak(0);
      setHistory([]);
      setRemedialEnqueuedCount(0);
      setJustEnqueuedRemedial(false);
      setScratchpadOpen(false);
      setSprintElapsedSec(0);
      const now = Date.now();
      sprintStartRef.current = now;
      questionStartRef.current = now;
      setView("sprint");
    },
    [selectedDifficulty],
  );

  useEffect(() => {
    if (view !== "sprint") return;
    const id = window.setInterval(() => {
      setSprintElapsedSec(Math.floor((Date.now() - sprintStartRef.current) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [view]);

  const currentQuestion = questions[currentIndex] ?? null;

  const handleChooseOption = useCallback(
    (key: "A" | "B" | "C" | "D") => {
      if (!currentQuestion || selectedKey !== null) return;
      setSelectedKey(key);
      const chosen = currentQuestion.options.find((o) => o.key === key);
      const isCorrect = Boolean(chosen?.isCorrect);
      const qSec = Math.max(1, Math.round((Date.now() - questionStartRef.current) / 1000));

      setHistory((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          category: currentQuestion.category,
          categoryLabel: currentQuestion.categoryLabel,
          isCorrect,
          elapsedSec: qSec,
          isRemedialRetry: currentQuestion.isRemedialRetry,
        },
      ]);

      if (isCorrect) {
        setJustEnqueuedRemedial(false);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setStreak(0);
        if (!currentQuestion.isRemedialRetry && remedialEnqueuedCount < MAX_REMEDIAL_RETRIES) {
          const retryQ = generateSingleMathGymQuestion(
            currentQuestion.category,
            activeDifficulty,
            (Date.now() + (questions.length + 1) * 97) >>> 0,
            "remedial",
          );
          retryQ.isRemedialRetry = true;
          setQuestions((prev) => [...prev, retryQ]);
          setRemedialEnqueuedCount((c) => c + 1);
          setJustEnqueuedRemedial(true);
        } else {
          setJustEnqueuedRemedial(false);
        }
      }
    },
    [activeDifficulty, currentQuestion, questions.length, remedialEnqueuedCount, selectedKey],
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedKey(null);
      setHintOpen(false);
      setJustEnqueuedRemedial(false);
      questionStartRef.current = Date.now();
      return;
    }

    const total = history.length || questions.length;
    const correctCount = history.filter((h) => h.isCorrect).length;
    const accPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    persistCategoryResult(activeCategory, accPct);
    setSprintElapsedSec(Math.max(1, Math.floor((Date.now() - sprintStartRef.current) / 1000)));
    setScratchpadOpen(false);
    setView("summary");
  }, [activeCategory, currentIndex, history, persistCategoryResult, questions.length]);

  useEffect(() => {
    if (view !== "sprint" || !currentQuestion) return;
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "Escape" && scratchpadOpen) {
        setScratchpadOpen(false);
        return;
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        setScratchpadOpen((v) => !v);
        return;
      }

      if (["1", "2", "3", "4"].includes(e.key) && selectedKey === null) {
        const idx = Number(e.key) - 1;
        const opt = currentQuestion.options[idx];
        if (opt) handleChooseOption(opt.key);
      } else if (e.key === "Enter" && selectedKey !== null) {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentQuestion, handleChooseOption, handleNext, scratchpadOpen, selectedKey, view]);

  if (view === "lobby") {
    const mixedStat = stats.mixed;
    const masteredCategoriesCount = MATH_GYM_CATEGORIES.filter(
      (c) => (stats[c.id]?.bestAccuracyPct ?? 0) >= 80,
    ).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
              <CalculatorIcon size={17} />
              <span>Math Rescue · Kurikulum 3 Sabuk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              Gym Refleks Hitung &amp; Otak Soal Cerita
            </h1>
            <p className="text-sm font-semibold text-[var(--ink-secondary)] max-w-2xl mt-1 leading-relaxed">
              Disusun bertahap dari nol sampai lancar pilih rumus soal cerita SNBT. Kalau ada yang
              salah, sistem langsung tampilkan langkah hitung dari nol dan memberi 1 soal angka baru
              di akhir sesi.
            </p>
          </div>
          <Link href="/" className="btn-secondary text-xs">
            <ArrowLeftIcon size={15} />
            <span>Kembali ke Jalur Belajar</span>
          </Link>
        </div>

        {/* Belt Progress & Difficulty Selector */}
        <section className="card-tactile p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-[var(--ink-primary)]">
                Pilih Level Latihan (Rekomendasi mulai dari Level 1 Dasar)
              </h2>
              <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                Progres Tuntas (≥80%):{" "}
                <span className="font-num font-bold text-[var(--accent-text-on-secondary)]">
                  {masteredCategoriesCount}/{MATH_GYM_CATEGORIES.length}
                </span>{" "}
                kategori selesai
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DIFFICULTY_META.map((lvl) => {
              const active = selectedDifficulty === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(lvl.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    active
                      ? "bg-[var(--accent-tint)] border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                      : "bg-[var(--surface-canvas)] border-[var(--border-structural)] text-[var(--ink-primary)] hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  <div className="text-xs font-extrabold">{lvl.label}</div>
                  <div className="text-[11px] font-semibold opacity-85 mt-0.5">{lvl.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Hero Mixed Sprint Card */}
        <section className="card-tactile p-5 sm:p-6 bg-[var(--accent-tint)] border-[var(--accent-tint-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
              <span>PEMANASAN LINTAS 3 SABUK</span>
              {mixedStat && (
                <span className="font-num px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--accent-tint-border)]">
                  Rekor: {mixedStat.bestAccuracyPct}% ({mixedStat.sessions}x sesi)
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[var(--ink-primary)]">
              Pemanasan Campur Lengkap (10 Soal · ±3 Menit)
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[var(--ink-secondary)]">
              Menggabungkan hitung minus, pecahan, aljabar, geometri, statistika, terjemah cerita,
              dan pemilih rumus pada level{" "}
              <strong>{DIFFICULTY_META.find((d) => d.id === selectedDifficulty)?.label}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startSprint("mixed", selectedDifficulty)}
            className="btn-primary px-5 min-h-[48px] shrink-0"
          >
            <PlayIcon size={17} />
            <span>Mulai Pemanasan Campur</span>
          </button>
        </section>

        {/* 3-Belt Structured Curriculum */}
        <div className="space-y-8">
          {MATH_GYM_BELTS.map((belt) => {
            const beltCats = MATH_GYM_CATEGORIES.filter((c) => c.belt === belt.beltNumber);
            return (
              <section key={belt.id} className="space-y-3">
                <div className="border-b border-[var(--border-structural)] pb-2">
                  <h2 className="text-lg font-bold text-[var(--ink-primary)]">{belt.title}</h2>
                  <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                    {belt.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {beltCats.map((cat) => {
                    const st = stats[cat.id];
                    const isDone = (st?.bestAccuracyPct ?? 0) >= 80;
                    return (
                      <div
                        key={cat.id}
                        className="card-tactile p-4 sm:p-5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-bold text-base leading-snug">
                              {cat.label}
                            </h3>
                            {st && (
                              <span
                                className={`text-[11px] font-num font-bold px-2 py-0.5 rounded-md shrink-0 inline-flex items-center gap-1 ${
                                  isDone
                                    ? "text-[var(--accent-text-on-secondary)] bg-[var(--accent-tint)]"
                                    : "text-[var(--ochre-ink)] bg-[var(--ochre-tint)]"
                                }`}
                              >
                                {isDone && <CheckIcon size={12} />}
                                <span>Terbaik {st.bestAccuracyPct}%</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                            {cat.subtitle}
                          </p>

                          <div className="p-2.5 rounded-xl bg-[var(--surface-canvas)] border border-[var(--border-structural)] text-xs font-bold text-[var(--ink-primary)]">
                            Contoh: <MathText text={cat.examplePreview} />
                          </div>

                          <details className="rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] px-3 py-2 text-xs">
                            <summary className="cursor-pointer font-extrabold text-[var(--olive-ink)] inline-flex items-center gap-1.5">
                              <BookOpenIcon size={14} />
                              <span>Ringkasan 15 Detik (Baca Sebelum Mulai)</span>
                            </summary>
                            <div className="mt-2 pt-2 border-t border-[var(--border-structural)] space-y-2">
                              {cat.cheatSheetRules.map((item, rIdx) => (
                                <div key={rIdx} className="space-y-0.5">
                                  <div className="font-bold text-[var(--ink-primary)]">
                                    • <MathText text={item.rule} />
                                  </div>
                                  <div className="text-[11px] font-semibold text-[var(--ink-secondary)] pl-2.5">
                                    <MathText text={item.example} />
                                  </div>
                                </div>
                              ))}
                              <p className="text-[11px] font-bold text-[var(--ochre-ink)] pt-1">
                                Tips cepat: <MathText text={cat.studyTip} />
                              </p>
                            </div>
                          </details>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startSprint(cat.id, selectedDifficulty)}
                            className="btn-primary flex-1 text-xs min-h-[42px]"
                          >
                            <PlayIcon size={14} />
                            <span>Latih 10 Soal</span>
                          </button>
                          <Link
                            href={`/study?skillNodeId=${cat.linkedSkillNodeId}&mode=lesson`}
                            className="btn-secondary text-xs min-h-[42px] px-3 shrink-0"
                            title={cat.linkedSkillLabel}
                          >
                            <span>Ke Bab SNBT</span>
                            <ArrowRightIcon size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "sprint" && currentQuestion) {
    const progressPct = Math.max(
      8,
      Math.round(((currentIndex + (selectedKey ? 1 : 0)) / questions.length) * 100),
    );
    const chosenOpt = selectedKey
      ? currentQuestion.options.find((o) => o.key === selectedKey) ?? null
      : null;

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Compact Sprint Top Bar */}
        <div className="card-flat p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setView("lobby")}
            className="text-xs font-extrabold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] inline-flex items-center gap-1.5 cursor-pointer min-h-[36px]"
          >
            <CloseIcon size={16} />
            <span>Pilih Kategori</span>
          </button>

          <div className="flex-1 min-w-[160px] space-y-1">
            <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--ink-secondary)]">
              <span className="truncate">
                {currentQuestion.categoryLabel} · {activeDifficulty.toUpperCase()}
              </span>
              <span className="font-num shrink-0 ml-2">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-num font-bold shrink-0">
            <button
              type="button"
              onClick={() => setScratchpadOpen((v) => !v)}
              aria-pressed={scratchpadOpen}
              title="Kertas coretan [S]"
              className={`min-h-[34px] px-2.5 rounded-lg font-sans font-extrabold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                scratchpadOpen
                  ? "bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)]"
                  : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <ScratchpadIcon size={16} />
              <span>Coretan</span>
            </button>
            <span className="inline-flex items-center gap-1 text-[var(--ochre-ink)]">
              <FlameIcon size={16} />
              {streak}
            </span>
            <span className="inline-flex items-center gap-1 text-[var(--ink-secondary)]">
              <TimerIcon size={16} />
              {sprintElapsedSec}d
            </span>
          </div>
        </div>

        {/* Remedial Retry Notice */}
        {currentQuestion.isRemedialRetry && (
          <div className="p-3 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] text-xs font-extrabold text-[var(--ochre-ink)]">
            Ronde Pemulihan · Soal Serupa Angka Baru (tadi masih selip, yuk buktikan sekarang sudah
            paham!)
          </div>
        )}

        {/* Question Card */}
        <section className="card-tactile p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--olive-ink)] bg-[var(--olive-tint)] px-2.5 py-1 rounded-md">
              {currentQuestion.categoryLabel}
            </span>
            {selectedKey === null && (
              <button
                type="button"
                onClick={() => setHintOpen((v) => !v)}
                className="text-xs font-extrabold text-[var(--ochre-ink)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <HintIcon size={15} />
                <span>{hintOpen ? "Tutup Petunjuk" : "Intip Cara Mulai"}</span>
              </button>
            )}
          </div>

          <div className="text-base sm:text-xl font-bold leading-relaxed text-[var(--ink-primary)] break-words">
            <MathText text={currentQuestion.promptMarkdown} />
          </div>

          {hintOpen && selectedKey === null && (
            <div className="p-3.5 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] text-xs font-bold text-[var(--ochre-ink)] leading-relaxed">
              <MathText text={currentQuestion.hintText} />
            </div>
          )}

          {/* 4 Option Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, idx) => {
              const isChosen = selectedKey === opt.key;
              const isCorrectOpt = opt.isCorrect;

              let tileClass =
                "bg-[var(--surface-elevated)] border-[var(--border-structural)] border-b-[var(--border-bevel)] hover:bg-[var(--surface-canvas)]";
              if (selectedKey !== null) {
                if (isCorrectOpt) {
                  tileClass =
                    "bg-[var(--accent-tint)] border-[var(--accent-primary)] border-b-[var(--accent-bevel)]";
                } else if (isChosen) {
                  tileClass =
                    "bg-[var(--coral-tint)] border-[var(--coral-fill)] border-b-[var(--coral-bevel)]";
                } else {
                  tileClass =
                    "bg-[var(--surface-canvas)] border-[var(--border-structural)] opacity-65";
                }
              }

              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={selectedKey !== null}
                  onClick={() => handleChooseOption(opt.key)}
                  className={`min-h-[58px] p-3.5 sm:p-4 rounded-xl border-2 border-b-4 text-left flex items-center gap-3 transition-all min-w-0 ${
                    selectedKey === null ? "cursor-pointer" : "cursor-default"
                  } ${tileClass}`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg border-2 font-num text-xs font-bold inline-flex items-center justify-center shrink-0 ${
                      selectedKey !== null && isCorrectOpt
                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                        : selectedKey !== null && isChosen && !isCorrectOpt
                          ? "bg-[var(--coral-fill)] text-white border-[var(--coral-fill)]"
                          : "bg-[var(--surface-canvas)] border-[var(--border-bevel)] text-[var(--ink-secondary)]"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="text-sm font-bold text-[var(--ink-primary)] leading-snug break-words min-w-0">
                    <MathText text={opt.labelLatexOrText} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Instant Step-by-Step Micro-Fix Feedback */}
          {selectedKey !== null && chosenOpt && (
            <div
              className={`p-4 sm:p-5 rounded-xl border-l-4 space-y-3 ${
                chosenOpt.isCorrect
                  ? "bg-[var(--accent-tint)] border-l-[var(--accent-primary)]"
                  : "bg-[var(--coral-tint)] border-l-[var(--coral-fill)]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-white shrink-0 mt-0.5 ${
                    chosenOpt.isCorrect ? "bg-[var(--accent-primary)]" : "bg-[var(--coral-fill)]"
                  }`}
                >
                  {chosenOpt.isCorrect ? <CheckIcon size={16} /> : <CloseIcon size={15} />}
                </span>
                <div className="space-y-1 min-w-0">
                  <div
                    className={`text-sm font-extrabold ${
                      chosenOpt.isCorrect
                        ? "text-[var(--accent-text-on-secondary)]"
                        : "text-[var(--coral-ink)]"
                    }`}
                  >
                    {chosenOpt.isCorrect
                      ? "Tepat sekali! Refleks hitungmu makin cepat."
                      : "Belum tepat · Kenali letak selipnya:"}
                  </div>
                  {!chosenOpt.isCorrect && (
                    <p className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] leading-relaxed">
                      <MathText text={chosenOpt.trapFeedback} />
                    </p>
                  )}
                  {justEnqueuedRemedial && (
                    <p className="text-xs font-extrabold text-[var(--ochre-ink)]">
                      Tenang, 1 soal serupa dengan angka baru sudah dimasukkan ke akhir sesi ini
                      biar kamu langsung lancar!
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-black/10 space-y-1.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--ink-secondary)]">
                  Langkah Hitung dari Nol
                </div>
                <ol className="space-y-1 text-xs sm:text-sm font-semibold text-[var(--ink-primary)]">
                  {currentQuestion.stepByStep.map((step, sIdx) => (
                    <li key={sIdx} className="leading-relaxed break-words">
                      <span className="font-num font-extrabold mr-1.5">{sIdx + 1}.</span>
                      <MathText text={step} />
                    </li>
                  ))}
                </ol>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="button" onClick={handleNext} className="btn-primary text-xs min-h-[42px]">
                  <span>
                    {currentIndex + 1 < questions.length
                      ? "Soal Berikutnya [Enter]"
                      : "Lihat Rapor Refleks"}
                  </span>
                  <ArrowRightIcon size={15} />
                </button>
              </div>
            </div>
          )}
        </section>

        <ScratchpadOverlay
          open={scratchpadOpen}
          onClose={() => setScratchpadOpen(false)}
          onUsed={() => {}}
        />
      </div>
    );
  }

  // Summary View
  const total = history.length || 1;
  const correctCount = history.filter((h) => h.isCorrect).length;
  const accuracyPct = Math.round((correctCount / total) * 100);
  const avgSec = Math.round(
    history.reduce((acc, item) => acc + item.elapsedSec, 0) / total,
  );

  const byCatMap = new Map<
    MathGymCoreCategory,
    { label: string; correct: number; total: number }
  >();
  for (const h of history) {
    const existing = byCatMap.get(h.category) ?? {
      label: h.categoryLabel,
      correct: 0,
      total: 0,
    };
    existing.total += 1;
    if (h.isCorrect) existing.correct += 1;
    byCatMap.set(h.category, existing);
  }
  const catBreakdown = Array.from(byCatMap.entries()).map(([id, data]) => ({
    id,
    ...data,
    accPct: Math.round((data.correct / data.total) * 100),
    meta: getCategoryMeta(id),
  }));
  const weakestCat = [...catBreakdown].sort((a, b) => a.accPct - b.accPct)[0] ?? null;
  const bridgeMeta =
    weakestCat?.meta ??
    (activeCategory === "mixed" ? getCategoryMeta("word_translate") : getCategoryMeta(activeCategory));
  const nextDifficulty: MathGymDifficulty | null =
    activeDifficulty === "dasar"
      ? "standar"
      : activeDifficulty === "standar"
        ? "tantangan"
        : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section className="card-tactile p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
            Sesi Gym Hitung Selesai · Level {activeDifficulty.toUpperCase()}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold">Rapor Refleks Hitungmu</h1>
          <p className="text-sm font-semibold text-[var(--ink-secondary)]">
            {accuracyPct >= 80
              ? "Mantap! Fondasimu di level ini sudah kokoh. Siap naik level atau langsung praktik di soal SNBT!"
              : "Bagus sudah melatih titik lemahmu dari nol. Coba ulangi bagian yang masih di bawah 80% sekali lagi."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-[var(--surface-canvas)] border border-[var(--border-structural)]">
            <div className="text-xs font-extrabold text-[var(--ink-secondary)]">Akurasi</div>
            <div className="font-num text-2xl font-bold text-[var(--accent-primary)]">
              {accuracyPct}%
            </div>
            <div className="text-[11px] font-bold text-[var(--ink-muted)]">
              {correctCount}/{total} tepat
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--surface-canvas)] border border-[var(--border-structural)]">
            <div className="text-xs font-extrabold text-[var(--ink-secondary)]">Rata-rata</div>
            <div className="font-num text-2xl font-bold">{avgSec}d</div>
            <div className="text-[11px] font-bold text-[var(--ink-muted)]">
              Total {sprintElapsedSec}d
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--surface-canvas)] border border-[var(--border-structural)]">
            <div className="text-xs font-extrabold text-[var(--ink-secondary)]">Rekor Beruntun</div>
            <div className="font-num text-2xl font-bold text-[var(--ochre-ink)]">{bestStreak}x</div>
            <div className="text-[11px] font-bold text-[var(--ink-muted)]">Tanpa salah</div>
          </div>
        </div>

        {catBreakdown.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[var(--border-structural)]">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--ink-secondary)]">
              Rincian Per Kategori &amp; Jembatan Kurikulum SNBT
            </h2>
            <div className="divide-y divide-[var(--border-structural)]">
              {catBreakdown.map((c) => (
                <div key={c.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-[var(--ink-primary)]">{c.label}</div>
                    <Link
                      href={`/study?skillNodeId=${c.meta.linkedSkillNodeId}&mode=lesson`}
                      className="text-[11px] font-bold text-[var(--accent-text-on-secondary)] hover:underline"
                    >
                      Buka materi SNBT: {c.meta.linkedSkillLabel}
                    </Link>
                  </div>
                  <span
                    className={`font-num font-extrabold ${
                      c.accPct >= 80
                        ? "text-[var(--accent-text-on-secondary)]"
                        : "text-[var(--coral-ink)]"
                    }`}
                  >
                    {c.correct}/{c.total} ({c.accPct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-2">
          {weakestCat && weakestCat.accPct < 80 && (
            <button
              type="button"
              onClick={() => startSprint(weakestCat.id, "dasar")}
              className="btn-olive flex-1 text-xs min-h-[44px]"
            >
              <ResetIcon size={15} />
              <span>Ulangi Khusus: {weakestCat.label} (Dasar)</span>
            </button>
          )}
          {accuracyPct >= 80 && nextDifficulty && (
            <button
              type="button"
              onClick={() => startSprint(activeCategory, nextDifficulty)}
              className="btn-olive flex-1 text-xs min-h-[44px]"
            >
              <PlayIcon size={14} />
              <span>Naik ke Level {nextDifficulty.toUpperCase()}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => startSprint(activeCategory, activeDifficulty)}
            className="btn-secondary flex-1 text-xs min-h-[44px]"
          >
            <ResetIcon size={15} />
            <span>Ulangi Sesi Ini</span>
          </button>
          <Link
            href={`/study?skillNodeId=${bridgeMeta.linkedSkillNodeId}&mode=lesson`}
            className="btn-primary flex-1 text-xs min-h-[44px]"
          >
            <span>Lanjut Materi SNBT Terkait</span>
            <ArrowRightIcon size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
