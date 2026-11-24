"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { RasionalinLogo } from "@/components/brand/RasionalinLogo";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BrainIcon,
  CheckIcon,
  FlameIcon,
  ShieldIcon,
  TargetIcon,
  TutorChatIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import type { SnbtSubtest } from "@/domain/types";

interface DiagnosticQuestionItem {
  id: string;
  subtest: SnbtSubtest;
  skillNodeId: string;
  skillTitle: string;
  tier: string;
  stemMarkdown: string;
  passageText: string | null;
  options: Array<{
    key: "A" | "B" | "C" | "D" | "E";
    textMarkdown: string;
  }>;
}

interface OnboardingInitPayload {
  user: {
    id: string;
    displayName: string;
    targetScore: number;
    targetMajor: string | null;
    examDate: string | null;
    diagnosticCompleted: boolean;
  };
  persona: {
    nickname: string;
    startingLevel: "nol_total" | "dasar" | "menengah";
    studyPace?: "santuy_dalam" | "seimbang" | "kejar_cepat";
    explanationStyle: "analogi_sehari_hari" | "step_by_step_pelan" | "ringkas_langsung";
    targetGoal: string;
    weakSubtests: SnbtSubtest[];
    personalContext: string;
  };
  questions: DiagnosticQuestionItem[];
}

interface DiagnosticAnswerRecord {
  questionId: string;
  subtest: SnbtSubtest;
  skillNodeId: string;
  selectedKey: "A" | "B" | "C" | "D" | "E" | null;
  timeMs: number;
}

interface CalibrationSummary {
  estimatedIrt: number;
  totalCorrect: number;
  totalQuestions: number;
  subtestResults: Array<{
    subtest: SnbtSubtest;
    irtScore: number;
    status: "correct" | "wrong" | "skipped" | "priority" | "neutral";
  }>;
  weakSubtests: SnbtSubtest[];
  fastTrackedNodesCount: number;
  studyPace: "santuy_dalam" | "seimbang" | "kejar_cepat";
  startingLevel: "nol_total" | "dasar" | "menengah";
  explanationStyle: "analogi_sehari_hari" | "step_by_step_pelan" | "ringkas_langsung";
  firstRecommendedHref: string;
}

const SUBTESTS: Array<{ code: SnbtSubtest; label: string }> = [
  { code: "PK", label: "Pengetahuan Kuantitatif" },
  { code: "PM", label: "Penalaran Matematika" },
  { code: "PU", label: "Penalaran Umum" },
  { code: "PPU", label: "Pemahaman Umum" },
  { code: "PBM", label: "Bacaan & Menulis" },
  { code: "LBI", label: "Literasi Indonesia" },
  { code: "LBE", label: "Literasi Inggris" },
];

const PACE_OPTIONS: Array<{
  id: "santuy_dalam" | "seimbang" | "kejar_cepat";
  title: string;
  desc: string;
}> = [
  {
    id: "santuy_dalam",
    title: "Santai Paham Dalam",
    desc: "Jalan pelan dari paling dasar dengan banyak perumpamaan sehari-hari.",
  },
  {
    id: "seimbang",
    title: "Seimbang Harian",
    desc: "Pahami konsep intinya lalu langsung mantapkan lewat latihan terarah.",
  },
  {
    id: "kejar_cepat",
    title: "Kejar Cepat (Akselerasi)",
    desc: "Fokus pola UTBK berbobot tinggi, trik cepat, dan lompati bab dasar jika tes lolos.",
  },
];

const LEVEL_OPTIONS: Array<{
  id: "nol_total" | "dasar" | "menengah";
  title: string;
  desc: string;
}> = [
  {
    id: "nol_total",
    title: "Mulai dari Nol Banget",
    desc: "Lupa hampir semua rumus SMA, butuh bimbingan sabar dari awal.",
  },
  {
    id: "dasar",
    title: "Paham Dasar",
    desc: "Tahu garis besar materinya, masih sering selip di hitungan atau jebakan soal.",
  },
  {
    id: "menengah",
    title: "Menengah / Kejar 800+",
    desc: "Konsep inti cukup aman, siap digeber kecepatan pola dan soal HOTS.",
  },
];

const STYLE_OPTIONS: Array<{
  id: "analogi_sehari_hari" | "step_by_step_pelan" | "ringkas_langsung";
  title: string;
  desc: string;
}> = [
  {
    id: "analogi_sehari_hari",
    title: "Analogi Sehari-hari",
    desc: "Ceritain pakai contoh nyata kayak pizza atau timbangan sebelum masuk rumus.",
  },
  {
    id: "step_by_step_pelan",
    title: "Pelan Baris demi Baris",
    desc: "Jabarkan langkah kecilnya satu per satu tanpa ada bagian yang diloncati.",
  },
  {
    id: "ringkas_langsung",
    title: "Ringkas & Taktis",
    desc: "To the point ke logika utama, cara cepat, dan jebakan UTBK.",
  },
];

function subtestStatusBadge(status: CalibrationSummary["subtestResults"][number]["status"]) {
  switch (status) {
    case "correct":
      return {
        label: "Kuat",
        cls: "bg-[var(--accent-soft)] text-[var(--accent-text-on-secondary)] border-[var(--accent-primary)]/40",
      };
    case "wrong":
    case "skipped":
    case "priority":
      return {
        label: "Prioritas",
        cls: "bg-[var(--coral-tint)] text-[var(--coral-ink)] border-[var(--coral-border)]",
      };
    default:
      return {
        label: "Siap",
        cls: "bg-[var(--surface-secondary)] text-[var(--ink-secondary)] border-[var(--border-structural)]",
      };
  }
}

export function OnboardingWorkspace() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [questions, setQuestions] = useState<DiagnosticQuestionItem[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosticAnswerRecord[]>([]);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | "E" | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  const [nickname, setNickname] = useState("");
  const [targetMajor, setTargetMajor] = useState("");
  const [targetScore, setTargetScore] = useState(750);
  const [examDate, setExamDate] = useState("");
  const [studyPace, setStudyPace] = useState<"santuy_dalam" | "seimbang" | "kejar_cepat">(
    "kejar_cepat",
  );
  const [startingLevel, setStartingLevel] = useState<"nol_total" | "dasar" | "menengah">("dasar");
  const [explanationStyle, setExplanationStyle] = useState<
    "analogi_sehari_hari" | "step_by_step_pelan" | "ringkas_langsung"
  >("analogi_sehari_hari");
  const [weakSubtests, setWeakSubtests] = useState<SnbtSubtest[]>(["PK", "PM"]);
  const [personalContext, setPersonalContext] = useState("");

  const [summary, setSummary] = useState<CalibrationSummary | null>(null);

  const loadInit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("Gagal menyiapkan kuesioner kalibrasi.");
      const data = (await res.json()) as OnboardingInitPayload;
      setNickname(data.persona.nickname || data.user.displayName);
      setTargetMajor(data.user.targetMajor ?? "");
      setTargetScore(data.user.targetScore || 750);
      setExamDate(data.user.examDate ?? "");
      if (data.persona.studyPace) setStudyPace(data.persona.studyPace);
      setStartingLevel(data.persona.startingLevel);
      setExplanationStyle(data.persona.explanationStyle);
      if (data.persona.weakSubtests.length > 0) setWeakSubtests(data.persona.weakSubtests);
      setPersonalContext(data.persona.personalContext ?? "");
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan memuat kalibrasi.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadInit();
  }, [loadInit]);

  useEffect(() => {
    if (step === 3) {
      questionStartRef.current = Date.now();
    }
  }, [step, qIndex]);

  function toggleWeakSubtest(code: SnbtSubtest) {
    setWeakSubtests((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code],
    );
  }

  async function handleSkipAll() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skip: true,
          nickname: nickname.trim() || undefined,
          targetMajor: targetMajor.trim() || undefined,
          targetScore: Number(targetScore) || 750,
          examDate: examDate || null,
          studyPace,
          startingLevel,
          explanationStyle,
        }),
      });
      if (!res.ok) throw new Error("Gagal melewati kalibrasi.");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses.");
      setSubmitting(false);
    }
  }

  async function submitCalibration(finalAnswers: DiagnosticAnswerRecord[]) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skip: false,
          nickname: nickname.trim() || "Pejuang SNBT",
          targetMajor: targetMajor.trim(),
          targetScore: Number(targetScore) || 750,
          examDate: examDate || null,
          startingLevel,
          studyPace,
          explanationStyle,
          weakSubtests,
          personalContext: personalContext.trim(),
          answers: finalAnswers,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        summary?: CalibrationSummary;
      };
      if (!res.ok || !json.ok || !json.summary) {
        throw new Error(json.error ?? "Gagal menyimpan hasil kalibrasi.");
      }
      setSummary(json.summary);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kalibrasi.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuestionNext(chosenKey: "A" | "B" | "C" | "D" | "E" | null) {
    const currentQ = questions[qIndex];
    if (!currentQ || submitting) return;

    const elapsedMs = Math.max(500, Date.now() - questionStartRef.current);
    const nextRecord: DiagnosticAnswerRecord = {
      questionId: currentQ.id,
      subtest: currentQ.subtest,
      skillNodeId: currentQ.skillNodeId,
      selectedKey: chosenKey,
      timeMs: elapsedMs,
    };

    const nextAnswers = [
      ...answers.filter((a) => a.questionId !== currentQ.id),
      nextRecord,
    ];
    setAnswers(nextAnswers);
    setSelectedOption(null);

    if (qIndex + 1 < questions.length) {
      setQIndex((prev) => prev + 1);
    } else {
      void submitCalibration(nextAnswers);
    }
  }

  const currentQuestion = questions[qIndex] ?? null;

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--ink-primary)] flex flex-col">
      {/* Top Bar */}
      <header className="w-full max-w-[820px] mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between gap-3">
        <RasionalinLogo size={36} subtitle="Kalibrasi Jalur Belajar" />
        {step < 4 && (
          <button
            type="button"
            onClick={() => void handleSkipAll()}
            disabled={submitting}
            className="px-3.5 min-h-[44px] rounded-xl border border-[var(--border-structural)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-secondary)] text-xs font-extrabold text-[var(--ink-secondary)] cursor-pointer transition-colors"
          >
            Lewati dulu
          </button>
        )}
      </header>

      <main className="flex-1 w-full max-w-[820px] mx-auto px-4 sm:px-6 pb-12 pt-2 space-y-6">
        {/* Progress Indicator */}
        {step < 4 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-[var(--ink-secondary)]">
              <span>
                {step === 1 && "Tahap 1 dari 3 · Target & Tempo Belajar"}
                {step === 2 && "Tahap 2 dari 3 · Kondisi Awal & Gaya Tutor AI"}
                {step === 3 &&
                  `Tahap 3 dari 3 · Cek Peta 7 Subtes (${qIndex + 1}/${Math.max(1, questions.length)})`}
              </span>
              <span className="font-num text-[var(--accent-text-on-secondary)]">
                {step === 1 ? "33%" : step === 2 ? "66%" : `${Math.round(((qIndex + 1) / Math.max(1, questions.length)) * 34 + 66)}%`}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={step === 1 ? 33 : step === 2 ? 66 : 95}
              className="h-2.5 w-full rounded-full bg-[var(--surface-secondary)] overflow-hidden"
            >
              <div
                className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                style={{
                  width:
                    step === 1
                      ? "33%"
                      : step === 2
                        ? "66%"
                        : `${Math.min(100, Math.round(((qIndex + 1) / Math.max(1, questions.length)) * 34 + 66))}%`,
                }}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="card-tactile p-8 text-center space-y-3" aria-busy="true">
            <BrainIcon size={32} className="mx-auto text-[var(--accent-primary)] animate-pulse" />
            <p className="text-sm font-bold text-[var(--ink-secondary)]">
              Menyiapkan soal kalibrasi dan profil belajarmu...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="card-tactile p-5 border-[var(--coral-border)] bg-[var(--coral-tint)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-bold text-[var(--coral-ink)]">{error}</p>
            <button type="button" onClick={() => void loadInit()} className="btn-secondary">
              Coba Lagi
            </button>
          </div>
        )}

        {/* STEP 1: TARGET & TEMPO */}
        {!loading && step === 1 && (
          <section className="card-tactile p-5 sm:p-7 space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                <TargetIcon size={16} />
                <span>Kenalan Sebentar</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                Mau kejar kampus mana dan seberapa cepat ritmemu?
              </h1>
              <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                Biar Tutor AI nyapa kamu dengan pas dan jadwal harian langsung ngikutin targetmu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                  Nama Panggilan
                </span>
                <input
                  id="onboarding-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={60}
                  placeholder="Contoh: Stevy"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                  Target PTN &amp; Jurusan
                </span>
                <input
                  id="onboarding-major"
                  type="text"
                  value={targetMajor}
                  onChange={(e) => setTargetMajor(e.target.value)}
                  maxLength={140}
                  placeholder="Contoh: Teknik Informatika ITB / Kedokteran UI"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                  Target Skor UTBK-SNBT
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[650, 700, 750, 800].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetScore(preset)}
                      className={`px-3 min-h-[40px] rounded-xl border font-num text-sm font-bold cursor-pointer transition-colors ${
                        targetScore === preset
                          ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                          : "bg-[var(--surface-canvas)] text-[var(--ink-primary)] border-[var(--border-structural)]"
                      }`}
                    >
                      {preset}+
                    </button>
                  ))}
                  <input
                    id="onboarding-target-score"
                    type="number"
                    min={400}
                    max={900}
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    aria-label="Target skor custom"
                    className="w-24 min-h-[40px] px-2.5 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] font-num text-sm font-bold"
                  />
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                  Tanggal UTBK (opsional, buat hitung mundur)
                </span>
                <input
                  id="onboarding-exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] text-sm font-bold"
                />
              </label>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                Pilih Tempo Belajar
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PACE_OPTIONS.map((opt) => {
                  const selected = studyPace === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStudyPace(opt.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                        selected
                          ? "border-[var(--accent-primary)] bg-[var(--accent-soft)]/55"
                          : "border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm">{opt.title}</span>
                        {opt.id === "kejar_cepat" && (
                          <FlameIcon size={16} className="text-[var(--ochre-ink)] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary px-6 min-h-[46px] text-sm"
              >
                <span>Lanjut ke Kondisi Awal</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: KONDISI AWAL & GAYA AI */}
        {!loading && step === 2 && (
          <section className="card-tactile p-5 sm:p-7 space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                <TutorChatIcon size={16} />
                <span>Setelan Tutor AI Pribadimu</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                Bagaimana kondisimu sekarang &amp; gaya ngajar AI yang paling masuk?
              </h1>
              <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                AI otomatis pakai bahasa ngobrol yang natural sesuai pilihanmu di sini.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                Posisi Paham Materi Saat Ini
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LEVEL_OPTIONS.map((opt) => {
                  const selected = startingLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStartingLevel(opt.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                        selected
                          ? "border-[var(--accent-primary)] bg-[var(--accent-soft)]/55"
                          : "border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)]"
                      }`}
                    >
                      <div className="font-extrabold text-sm">{opt.title}</div>
                      <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                Gaya Penjelasan Tutor AI
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STYLE_OPTIONS.map((opt) => {
                  const selected = explanationStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExplanationStyle(opt.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                        selected
                          ? "border-[var(--ochre-fill)] bg-[var(--ochre-tint)]/70"
                          : "border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)]"
                      }`}
                    >
                      <div className="font-extrabold text-sm">{opt.title}</div>
                      <p className="text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                Subtes mana yang paling bikin pusing sekarang? (boleh pilih lebih dari satu)
              </span>
              <div className="flex flex-wrap gap-2">
                {SUBTESTS.map((sub) => {
                  const active = weakSubtests.includes(sub.code);
                  return (
                    <button
                      key={sub.code}
                      type="button"
                      onClick={() => toggleWeakSubtest(sub.code)}
                      className={`px-3.5 min-h-[42px] rounded-xl border text-xs font-extrabold cursor-pointer transition-colors ${
                        active
                          ? "bg-[var(--coral-fill)] text-white border-[var(--coral-bevel)]"
                          : "bg-[var(--surface-canvas)] text-[var(--ink-primary)] border-[var(--border-structural)] hover:bg-[var(--surface-secondary)]"
                      }`}
                    >
                      {sub.code} · {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-extrabold text-[var(--ink-secondary)]">
                Cerita singkat buat Tutor AI (opsional)
              </span>
              <textarea
                id="onboarding-context"
                rows={2}
                value={personalContext}
                onChange={(e) => setPersonalContext(e.target.value)}
                maxLength={1200}
                placeholder="Contoh: Aku anak IPS/SMK jadi kaku di pecahan & aljabar, tolong jelasin pakai bahasa simpel jangan terlalu kaku."
                className="w-full p-3 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </label>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary min-h-[44px] px-4 text-sm"
              >
                <ArrowLeftIcon size={16} />
                <span>Kembali</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (questions.length > 0) {
                    setQIndex(0);
                    setSelectedOption(null);
                    setStep(3);
                  } else {
                    void submitCalibration([]);
                  }
                }}
                disabled={submitting}
                className="btn-primary px-6 min-h-[46px] text-sm"
              >
                <span>
                  {questions.length > 0 ? `Lanjut Mini Tes (${questions.length} Soal)` : "Simpan & Kalibrasi"}
                </span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: 7-QUESTION DIAGNOSTIC PROBE */}
        {!loading && step === 3 && currentQuestion && (
          <section className="card-tactile p-5 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text-on-secondary)] font-num text-xs font-extrabold">
                  {currentQuestion.subtest}
                </span>
                <span className="text-xs font-bold text-[var(--ink-secondary)]">
                  {currentQuestion.skillTitle}
                </span>
              </div>
              <span className="text-xs font-extrabold text-[var(--ochre-ink)]">
                Soal {qIndex + 1} dari {questions.length}
              </span>
            </div>

            <p className="text-xs font-semibold text-[var(--ink-secondary)]">
              Nggak perlu nebak ngasal. Kalau memang belum kebayang caranya, pencet aja{" "}
              <strong>Belum tahu / Lewati</strong> biar sistem tandain topik ini buat dibimbing dari awal.
            </p>

            {currentQuestion.passageText && (
              <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-structural)] max-h-56 overflow-y-auto text-sm leading-relaxed">
                <MathText text={currentQuestion.passageText} />
              </div>
            )}

            <div className="text-base font-bold leading-relaxed">
              <MathText text={currentQuestion.stemMarkdown} />
            </div>

            <div className="space-y-2.5">
              {currentQuestion.options.map((opt) => {
                const chosen = selectedOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedOption(opt.key)}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl border-2 text-left flex items-start gap-3 cursor-pointer transition-all ${
                      chosen
                        ? "border-[var(--accent-primary)] bg-[var(--accent-soft)]/55"
                        : "border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:bg-[var(--surface-secondary)]"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0 font-num text-xs font-extrabold border ${
                        chosen
                          ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                          : "bg-[var(--surface-secondary)] text-[var(--ink-primary)] border-[var(--border-structural)]"
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm font-semibold pt-0.5">
                      <MathText text={opt.textMarkdown} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuestionNext(null)}
                className="btn-secondary min-h-[44px] px-4 text-xs sm:text-sm"
              >
                Belum tahu / Lewati soal ini
              </button>

              <button
                type="button"
                disabled={!selectedOption || submitting}
                onClick={() => handleQuestionNext(selectedOption)}
                className="btn-primary px-6 min-h-[46px] text-sm disabled:opacity-50"
              >
                <span>
                  {submitting
                    ? "Mengkalibrasi..."
                    : qIndex + 1 === questions.length
                      ? "Selesaikan & Kalibrasi AI"
                      : "Kunci & Lanjut"}
                </span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: CALIBRATION RESULT */}
        {!loading && step === 4 && summary && (
          <section className="card-tactile p-5 sm:p-7 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                  <ShieldIcon size={16} />
                  <span>Kalibrasi Selesai</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Jalur Belajar &amp; Tutor AI Sudah Disesuaikan buat {nickname || "Kamu"}!
                </h1>
                <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                  Semua rekomendasi harian dan cara Tutor AI ngobrol sekarang ngikutin hasil cek awalmu.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-primary)]/40 px-5 py-3 text-center shrink-0">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                  Estimasi IRT Awal
                </div>
                <div className="font-num text-3xl font-extrabold text-[var(--accent-primary)]">
                  {summary.estimatedIrt}
                </div>
                <div className="text-xs font-bold text-[var(--ink-secondary)]">
                  {summary.totalCorrect}/{summary.totalQuestions} soal tepat
                </div>
              </div>
            </div>

            {summary.fastTrackedNodesCount > 0 && (
              <div className="p-4 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-bevel)]/40 flex items-start gap-3">
                <FlameIcon size={20} className="text-[var(--ochre-ink)] shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-[var(--ink-primary)]">
                  Mode Kejar Cepat aktif:{" "}
                  <span className="font-num">{summary.fastTrackedNodesCount}</span> materi dasar yang udah kamu kuasai langsung diluluskan sementara supaya bab lanjutan terbuka lebih cepat.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {summary.subtestResults.map((item) => {
                const badge = subtestStatusBadge(item.status);
                return (
                  <div
                    key={item.subtest}
                    className="p-3 rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] text-center space-y-1"
                  >
                    <div className="font-extrabold text-xs text-[var(--ink-secondary)]">
                      {item.subtest}
                    </div>
                    <div className="font-num text-lg font-extrabold">{item.irtScore}</div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--ink-secondary)] space-y-1">
              <div>
                <strong className="text-[var(--ink-primary)]">Fokus Prioritas AI:</strong>{" "}
                {summary.weakSubtests.length > 0
                  ? summary.weakSubtests.join(", ")
                  : "Seimbang di semua subtes"}
              </div>
              <div>
                <strong className="text-[var(--ink-primary)]">Gaya Bahasa Tutor:</strong>{" "}
                Santai natural kayak kakak tingkat, disesuaikan untuk level{" "}
                <span className="font-bold">{summary.startingLevel.replaceAll("_", " ")}</span>.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={summary.firstRecommendedHref}
                className="btn-primary px-6 min-h-[48px] text-sm"
              >
                <CheckIcon size={16} />
                <span>Mulai Belajar Sekarang</span>
                <ArrowRightIcon size={16} />
              </Link>
              <Link href="/" className="btn-secondary px-5 min-h-[48px] text-sm">
                <span>Lihat Peta Belajar</span>
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
