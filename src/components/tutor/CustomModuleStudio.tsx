"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import type {
  CustomModuleDrillOutput,
  CustomModuleLevel,
  CustomPracticeMode,
} from "@/application/tutor-service";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BrainIcon,
  CheckIcon,
  CloseIcon,
  HintIcon,
  MemoryIcon,
  PlayIcon,
  ResetIcon,
  TimerIcon,
  VerifyIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import type { SnbtSubtest } from "@/domain/types";
import type { UserMemoryNote } from "@/infrastructure/memory/user-memory-store";

interface SkillNodeOption {
  id: string;
  subtest: string;
  title: string;
}

interface CustomModuleStudioProps {
  skillNodes: SkillNodeOption[];
  personaNickname: string;
  initialSubtest?: SnbtSubtest | "";
  initialNodeId?: string;
  initialTopic?: string;
  onSavedMemoryNote?: (notes: UserMemoryNote[]) => void;
}

interface DrillAnswerRecord {
  selectedKey: "A" | "B" | "C" | "D" | "E";
  selfExplanation: string;
  elapsedSeconds: number;
  isCorrect: boolean;
}

const SUBTEST_LABELS: Array<{ value: "" | SnbtSubtest; label: string }> = [
  { value: "", label: "Otomatis dari Topik" },
  { value: "PK", label: "PK · Pengetahuan Kuantitatif" },
  { value: "PU", label: "PU · Penalaran Umum" },
  { value: "PM", label: "PM · Penalaran Matematika" },
  { value: "LBI", label: "LBI · Literasi Bahasa Indonesia" },
  { value: "LBE", label: "LBE · Literasi Bahasa Inggris" },
  { value: "PBM", label: "PBM · Pemahaman Bacaan & Menulis" },
  { value: "PPU", label: "PPU · Pengetahuan & Pemahaman Umum" },
];

const QUICK_PRESETS: Array<{
  title: string;
  subtest: SnbtSubtest;
  topic: string;
  level: CustomModuleLevel;
}> = [
  {
    title: "Grilling Jebakan Silogisme & Modus Tollens",
    subtest: "PU",
    topic: "Jebakan penarikan kesimpulan silogisme, modus ponens, modus tollens, dan ekuivalensi implikasi",
    level: "standard",
  },
  {
    title: "Perbandingan Senilai vs Berbalik Nilai + Soal Pekerja",
    subtest: "PK",
    topic: "Perbandingan senilai vs berbalik nilai serta soal jumlah pekerja dan waktu selesai",
    level: "foundation",
  },
  {
    title: "Specific Detail & Inference tanpa Terkecoh Kata Mutlak",
    subtest: "LBE",
    topic: "Specific Detail, Inference & Vocabulary in Context tanpa terkecoh extreme wording",
    level: "standard",
  },
];

function formatTimerClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function CustomModuleStudio({
  skillNodes,
  personaNickname,
  initialSubtest = "",
  initialNodeId = "",
  initialTopic = "",
  onSavedMemoryNote,
}: CustomModuleStudioProps) {
  const [topicPrompt, setTopicPrompt] = useState(initialTopic);
  const [subtest, setSubtest] = useState<"" | SnbtSubtest>(initialSubtest);
  const [skillNodeId, setSkillNodeId] = useState(initialNodeId);
  const [targetLevel, setTargetLevel] = useState<CustomModuleLevel>("standard");
  const [practiceMode, setPracticeMode] = useState<CustomPracticeMode>("interleaved");
  const [questionCount, setQuestionCount] = useState<3 | 5>(3);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomModuleDrillOutput | null>(null);

  // Interactive learning flow inside generated package
  const [pretestPicked, setPretestPicked] = useState<"A" | "B" | "C" | null>(null);
  const [moduleOpen, setModuleOpen] = useState(true);
  const [savedToNotes, setSavedToNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Grilling arena state
  const [drillIndex, setDrillIndex] = useState(0);
  const [draftChoice, setDraftChoice] = useState<"A" | "B" | "C" | "D" | "E" | null>(null);
  const [draftExplanation, setDraftExplanation] = useState("");
  const [answersById, setAnswersById] = useState<Record<string, DrillAnswerRecord>>({});
  const [showRecap, setShowRecap] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Save drills to personal bank
  const [savingBank, setSavingBank] = useState(false);
  const [savedBankOutcome, setSavedBankOutcome] = useState<{
    savedCount: number;
    studyHref: string;
  } | null>(null);

  useEffect(() => {
    if (initialSubtest) setSubtest(initialSubtest);
    if (initialNodeId) setSkillNodeId(initialNodeId);
    if (initialTopic) setTopicPrompt(initialTopic);
  }, [initialSubtest, initialNodeId, initialTopic]);

  const filteredSkillNodes = useMemo(() => {
    if (!subtest) return skillNodes;
    return skillNodes.filter((n) => n.subtest === subtest);
  }, [skillNodes, subtest]);

  const currentDrill = result?.drillQuestions[drillIndex] ?? null;
  const currentRecord = currentDrill ? answersById[currentDrill.id] ?? null : null;

  useEffect(() => {
    if (!result || !currentDrill || currentRecord || showRecap) return;
    const handle = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(handle);
  }, [result, currentDrill, currentRecord, showRecap]);

  function handleSelectLevel(nextLevel: CustomModuleLevel) {
    setTargetLevel(nextLevel);
    // Align with Kalyuga Expertise Reversal & Rohrer Interleaving defaults
    setPracticeMode(nextLevel === "foundation" ? "focused" : "interleaved");
  }

  async function generatePackage(overrides?: {
    topicPrompt?: string;
    subtest?: "" | SnbtSubtest;
    skillNodeId?: string;
    targetLevel?: CustomModuleLevel;
  }) {
    if (generating) return;
    const effectiveTopic = (overrides?.topicPrompt ?? topicPrompt).trim();
    const effectiveSubtest = overrides?.subtest !== undefined ? overrides.subtest : subtest;
    const effectiveNodeId = overrides?.skillNodeId !== undefined ? overrides.skillNodeId : skillNodeId;
    const effectiveLevel = overrides?.targetLevel ?? targetLevel;

    if (!effectiveTopic && !effectiveSubtest && !effectiveNodeId) {
      setError("Pilih subtes/bab atau ketik topik yang mau kamu bedah dulu.");
      return;
    }

    setGenerating(true);
    setError(null);
    setSavedBankOutcome(null);

    try {
      const res = await fetch("/api/tutor/generate-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicPrompt: effectiveTopic,
          subtest: effectiveSubtest || null,
          skillNodeId: effectiveNodeId || null,
          targetLevel: effectiveLevel,
          questionCount,
          practiceMode,
        }),
      });
      const json = (await res.json()) as CustomModuleDrillOutput & { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Gagal menyusun modul dan paket grilling.");
      }
      setResult(json);
      setPretestPicked(null);
      setModuleOpen(true);
      setSavedToNotes(false);
      setDrillIndex(0);
      setDraftChoice(null);
      setDraftExplanation("");
      setAnswersById({});
      setShowRecap(false);
      setElapsedSeconds(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kendala saat menyusun modul AI.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveModuleSummary() {
    if (!result || savedToNotes || savingNotes) return;
    setSavingNotes(true);
    try {
      const content = [
        `Why Before How: ${result.whyBeforeHowMarkdown}`,
        `Analogi: ${result.everydayAnalogy}`,
        result.shortcutWithBoundary
          ? `Cara Cepat (${result.shortcutWithBoundary.methodLabel}): ${result.shortcutWithBoundary.shortcutMarkdown} | Syarat: ${result.shortcutWithBoundary.validityConditions}`
          : "",
        `Jebakan UTBK: ${result.utbkTraps.join("; ")}`,
      ]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 1950);

      const res = await fetch("/api/tutor/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "note",
          title: `Modul Studio: ${result.moduleTitle}`.slice(0, 115),
          content,
          subtest: result.subtest,
          pinnedForAi: true,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan ringkasan ke Catatan AI.");
      const data = (await res.json()) as {
        bundle?: { notes: UserMemoryNote[] };
      };
      if (data.bundle?.notes && onSavedMemoryNote) {
        onSavedMemoryNote(data.bundle.notes);
      }
      setSavedToNotes(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan ringkasan modul.");
    } finally {
      setSavingNotes(false);
    }
  }

  function handleLockDrillAnswer() {
    if (!currentDrill || !draftChoice || currentRecord) return;
    const isCorrect = draftChoice === currentDrill.correctAnswerKey;
    setAnswersById((prev) => ({
      ...prev,
      [currentDrill.id]: {
        selectedKey: draftChoice,
        selfExplanation: draftExplanation.trim(),
        elapsedSeconds,
        isCorrect,
      },
    }));
  }

  function handleNextDrill() {
    if (!result) return;
    if (drillIndex + 1 >= result.drillQuestions.length) {
      setShowRecap(true);
      return;
    }
    setDrillIndex((prev) => prev + 1);
    setDraftChoice(null);
    setDraftExplanation("");
    setElapsedSeconds(0);
  }

  function handleRetryDrills() {
    setDrillIndex(0);
    setDraftChoice(null);
    setDraftExplanation("");
    setAnswersById({});
    setShowRecap(false);
    setElapsedSeconds(0);
    setModuleOpen(false);
  }

  async function handleSaveDrillsToBank() {
    if (!result || savingBank || savedBankOutcome) return;
    setSavingBank(true);
    setError(null);
    try {
      const res = await fetch("/api/tutor/save-drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtest: result.subtest,
          skillNodeId: result.skillNodeId,
          drills: result.drillQuestions.map((q) => ({
            strategyTag: q.strategyTag,
            difficultyTier: q.difficultyTier,
            passageText: q.passageText,
            stemMarkdown: q.stemMarkdown,
            options: q.options,
            correctAnswerKey: q.correctAnswerKey,
            whySolutionMarkdown: q.whySolutionMarkdown,
          })),
        }),
      });
      const json = (await res.json()) as {
        savedCount: number;
        studyHref: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan soal ke Bank Latihan.");
      setSavedBankOutcome({
        savedCount: json.savedCount,
        studyHref: json.studyHref,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan soal ke Bank Latihan.");
    } finally {
      setSavingBank(false);
    }
  }

  const recapSummary = useMemo(() => {
    if (!result) return null;
    const records = Object.values(answersById);
    const correctCount = records.filter((r) => r.isCorrect).length;
    const totalSeconds = records.reduce((sum, r) => sum + r.elapsedSeconds, 0);
    const total = result.drillQuestions.length;
    return {
      correctCount,
      total,
      accuracyPct: total > 0 ? Math.round((correctCount / total) * 100) : 0,
      avgSeconds: total > 0 ? Math.round(totalSeconds / total) : 0,
    };
  }, [result, answersById]);

  return (
    <div className="space-y-6 pb-8">
      {/* Configuration / Prompt Card */}
      <section className="card-tactile p-5 sm:p-6 space-y-5" aria-label="Konfigurasi Studio Modul AI">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
            <BrainIcon size={16} />
            <span>Pre-Test · Why Before How · Interleaved Grilling · Self-Explanation</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
            Buat Modul Kilat & Arena Grilling Custom
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[var(--ink-secondary)]">
            Hai {personaNickname || "Pejuang SNBT"}, minta topik atau jebakan UTBK spesifik. AI menyusun modul inti lalu langsung menguji pilihan strategimu.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generatePackage();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="studio-topic-input"
              className="block text-xs font-extrabold uppercase tracking-wider text-[var(--ink-secondary)]"
            >
              Topik atau Celah Materi yang Mau Dibedah
            </label>
            <textarea
              id="studio-topic-input"
              rows={2}
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="Contoh: Kenapa pertidaksamaan kuadrat wajib pakai garis bilangan & uji titik, atau jebakan modus tollens PU..."
              className="input-tactile w-full resize-none text-sm"
            />
          </div>

          {/* Flat Hairline Quick Presets */}
          <div className="divide-y divide-[var(--border-structural)] border-y border-[var(--border-structural)]">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                disabled={generating}
                onClick={() => {
                  setTopicPrompt(preset.topic);
                  setSubtest(preset.subtest);
                  setSkillNodeId("");
                  setTargetLevel(preset.level);
                  setPracticeMode(preset.level === "foundation" ? "focused" : "interleaved");
                  void generatePackage({
                    topicPrompt: preset.topic,
                    subtest: preset.subtest,
                    skillNodeId: "",
                    targetLevel: preset.level,
                  });
                }}
                className="w-full py-2.5 px-1 text-left flex items-center justify-between gap-2 text-xs font-bold text-[var(--ink-secondary)] hover:text-[var(--accent-text-on-secondary)] transition-colors cursor-pointer"
              >
                <span className="truncate">
                  <span className="font-num font-extrabold text-[var(--olive-ink)] mr-2">
                    [{preset.subtest}]
                  </span>
                  {preset.title}
                </span>
                <span className="shrink-0 text-[11px] font-extrabold text-[var(--accent-text-on-secondary)]">
                  Racik →
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="studio-subtest-select"
                className="block text-xs font-extrabold text-[var(--ink-secondary)]"
              >
                Subtes Target
              </label>
              <select
                id="studio-subtest-select"
                value={subtest}
                onChange={(e) => {
                  const nextSub = e.target.value as "" | SnbtSubtest;
                  setSubtest(nextSub);
                  setSkillNodeId("");
                }}
                className="input-tactile w-full text-sm cursor-pointer"
              >
                {SUBTEST_LABELS.map((item) => (
                  <option key={item.value || "auto"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="studio-node-select"
                className="block text-xs font-extrabold text-[var(--ink-secondary)]"
              >
                Bab Kurikulum (38 Node)
              </label>
              <select
                id="studio-node-select"
                value={skillNodeId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSkillNodeId(id);
                  const found = skillNodes.find((n) => n.id === id);
                  if (found && !subtest) {
                    setSubtest(found.subtest as SnbtSubtest);
                  }
                }}
                className="input-tactile w-full text-sm cursor-pointer"
              >
                <option value="">Otomatis sesuai topik</option>
                {filteredSkillNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    [{n.subtest}] {n.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pedagogy Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="space-y-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                Level Penjelasan
              </span>
              <div className="inline-flex rounded-xl border border-[var(--border-structural)] bg-[var(--surface-secondary)] p-0.5">
                {(
                  [
                    { id: "foundation", label: "Fondasi Nol" },
                    { id: "standard", label: "Standar UTBK" },
                    { id: "hots", label: "HOTS 800+" },
                  ] as const
                ).map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => handleSelectLevel(lvl.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      targetLevel === lvl.id
                        ? "bg-[var(--surface-elevated)] text-[var(--accent-text-on-secondary)] shadow-xs"
                        : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                Pola Latihan
              </span>
              <div className="inline-flex rounded-xl border border-[var(--border-structural)] bg-[var(--surface-secondary)] p-0.5">
                <button
                  type="button"
                  onClick={() => setPracticeMode("interleaved")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    practiceMode === "interleaved"
                      ? "bg-[var(--surface-elevated)] text-[var(--accent-text-on-secondary)] shadow-xs"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  Interleaved
                </button>
                <button
                  type="button"
                  onClick={() => setPracticeMode("focused")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    practiceMode === "focused"
                      ? "bg-[var(--surface-elevated)] text-[var(--accent-text-on-secondary)] shadow-xs"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  Fokus 1 Konsep
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[var(--ink-muted)]">
                Jumlah Soal
              </span>
              <div className="inline-flex rounded-xl border border-[var(--border-structural)] bg-[var(--surface-secondary)] p-0.5">
                {([3, 5] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-num font-extrabold transition-colors cursor-pointer ${
                      questionCount === cnt
                        ? "bg-[var(--surface-elevated)] text-[var(--accent-text-on-secondary)] shadow-xs"
                        : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {cnt} Soal
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[var(--coral-tint)] border border-[var(--coral-border)] text-xs font-bold text-[var(--coral-ink)]">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Tutup pesan galat"
                className="p-0.5 cursor-pointer"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] font-bold text-[var(--ink-muted)]">
              {practiceMode === "interleaved"
                ? "Mode Interleaved mencampur variasi strategi agar kamu terlatih memilih rumus tanpa contekan."
                : "Mode Fokus menguatkan satu pola inti bertahap dari langkah dasar."}
            </span>
            <button type="submit" disabled={generating} className="btn-primary text-sm">
              <PlayIcon size={15} />
              <span>
                {generating ? "Sedang Menyusun Modul & Soal..." : "Buat Modul & Paket Grilling"}
              </span>
            </button>
          </div>
        </form>
      </section>

      {/* Generated Output Workspace */}
      {result && (
        <div className="space-y-5">
          {/* Result Overview Strip */}
          <section className="card-tactile p-5 space-y-3" aria-label="Ringkasan paket modul hasil AI">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                  <span className="px-2 py-0.5 rounded-md bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)] font-num">
                    {result.subtest}
                  </span>
                  <span className="text-[var(--olive-ink)] font-num">
                    ±{result.estimatedMinutes} menit
                  </span>
                  <span className="text-[var(--ink-muted)]">·</span>
                  <span className="text-[var(--ink-secondary)]">
                    {result.sourceMode === "9router"
                      ? `AI Live (${result.modelUsed ?? "9Router"})`
                      : "Kurikulum & Bank Soal Terkurasi"}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--ink-primary)]">
                  {result.moduleTitle}
                </h3>
                <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                  Bab Kurikulum: {result.skillNodeTitle}
                  {result.pedagogyBadges.length > 0 ? ` · ${result.pedagogyBadges.join(" · ")}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleSaveModuleSummary()}
                  disabled={savedToNotes || savingNotes}
                  className="btn-secondary text-xs px-3 py-2"
                >
                  {savedToNotes ? (
                    <>
                      <CheckIcon size={14} />
                      <span>Tersimpan di Catatan AI</span>
                    </>
                  ) : (
                    <>
                      <MemoryIcon size={14} />
                      <span>{savingNotes ? "Menyimpan..." : "Simpan Ringkasan ke Catatan AI"}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setSavedBankOutcome(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                >
                  <ResetIcon size={14} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </section>

          {/* Stage 1: Pretesting Hook (Kornell & Kapur) */}
          <section className="card-tactile p-5 space-y-3" aria-label="Pemanasan intuisi sebelum materi">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                <HintIcon size={16} />
                <span>Langkah 1 · Pemanasan Intuisi (Tebak Dulu Sebelum Buka Rumus)</span>
              </div>
            </div>

            <div className="text-sm sm:text-[15px] font-bold text-[var(--ink-primary)] leading-relaxed">
              <MathText text={result.pretestHook.promptMarkdown} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {result.pretestHook.options.map((opt) => {
                const picked = pretestPicked === opt.key;
                const isRight = opt.key === result.pretestHook.correctKey;
                let cls =
                  "border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:border-[var(--accent-primary)]";
                if (pretestPicked) {
                  if (isRight) {
                    cls =
                      "border-[var(--accent-primary)] bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)]";
                  } else if (picked) {
                    cls = "border-[var(--coral-border)] bg-[var(--coral-tint)] text-[var(--coral-ink)]";
                  } else {
                    cls = "border-[var(--border-structural)] opacity-65";
                  }
                }
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPretestPicked(opt.key)}
                    className={`p-3 rounded-xl border-2 text-left text-xs font-bold transition-colors cursor-pointer ${cls}`}
                  >
                    <span className="font-num font-extrabold mr-1.5">{opt.key}.</span>
                    <MathText text={opt.text} />
                  </button>
                );
              })}
            </div>

            {pretestPicked && (
              <div className="p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] text-xs sm:text-sm font-semibold text-[var(--ink-primary)]">
                <span className="font-extrabold text-[var(--accent-text-on-secondary)] mr-1">
                  {pretestPicked === result.pretestHook.correctKey
                    ? "Intuisimu pas!"
                    : "Justru bagus kepleset di awal, ini poin kuncinya:"}
                </span>
                <MathText text={result.pretestHook.revealInsight} />
              </div>
            )}
          </section>

          {/* Stage 2: Core Module (Why Before How + Worked Example + Traps) */}
          <section className="card-tactile p-5 space-y-4" aria-label="Modul materi inti Why Before How">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                <BookOpenIcon size={16} />
                <span>Langkah 2 · Modul Materi Inti (Why Before How)</span>
              </div>
              <button
                type="button"
                onClick={() => setModuleOpen((v) => !v)}
                className="text-xs font-extrabold text-[var(--olive-ink)] hover:underline cursor-pointer"
              >
                {moduleOpen ? "Lipat Modul (Uji Ingatan)" : "Buka Lagi Modul"}
              </button>
            </div>

            {moduleOpen && (
              <div className="space-y-4 pt-2 border-t border-[var(--border-structural)]">
                <div className="text-sm sm:text-[15px] font-semibold leading-relaxed text-[var(--ink-primary)]">
                  <MathText text={result.whyBeforeHowMarkdown} />
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] space-y-1">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                    Analogi Sehari-hari
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[var(--ink-primary)] leading-relaxed">
                    <MathText text={result.everydayAnalogy} />
                  </div>
                </div>

                {result.coreFormulasLatex.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--ink-secondary)]">
                      Rumus & Kaidah Kunci
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.coreFormulasLatex.map((tex, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-structural)] overflow-x-auto text-sm font-semibold"
                        >
                          <MathText text={`$${tex}$`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t border-[var(--border-structural)]">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--ink-secondary)]">
                    Contoh Terpandu (Worked Example)
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] text-sm font-bold text-[var(--ink-primary)]">
                    <MathText text={result.workedExample.promptMarkdown} />
                  </div>
                  <ol className="space-y-2.5">
                    {result.workedExample.steps.map((st, idx) => (
                      <li
                        key={idx}
                        className="pl-3.5 border-l-2 border-[var(--accent-primary)] space-y-1"
                      >
                        <div className="text-xs font-extrabold text-[var(--olive-ink)]">
                          Langkah {idx + 1}: {st.title}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-[var(--ink-primary)] leading-relaxed">
                          <MathText text={st.explanationMarkdown} />
                        </div>
                        {st.formulaLatex && (
                          <div className="overflow-x-auto text-sm">
                            <MathText text={`$$${st.formulaLatex}$$`} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs font-bold text-[var(--accent-text-on-secondary)]">
                    Intisari: <MathText text={result.workedExample.finalTakeaway} />
                  </p>
                </div>

                {result.shortcutWithBoundary && (
                  <div className="p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                      <VerifyIcon size={14} />
                      <span>Cara Cepat: {result.shortcutWithBoundary.methodLabel}</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-[var(--ink-primary)]">
                      <MathText text={result.shortcutWithBoundary.shortcutMarkdown} />
                    </div>
                    <div className="text-xs font-bold text-[var(--coral-ink)]">
                      Syarat batas wajib cek:{" "}
                      <MathText text={result.shortcutWithBoundary.validityConditions} />
                    </div>
                  </div>
                )}

                <div className="border-l-4 border-[var(--coral-border)] pl-3.5 space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--coral-ink)]">
                    Jebakan UTBK yang Wajib Kamu Hindari
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm font-semibold text-[var(--ink-secondary)]">
                    {result.utbkTraps.map((trap, i) => (
                      <li key={i}>
                        <MathText text={trap} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Stage 3: Interactive Grilling Arena */}
          <section className="card-tactile p-5 sm:p-6 space-y-5" aria-label="Arena Grilling Soal Custom">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                <VerifyIcon size={16} />
                <span>
                  Langkah 3 · Arena Grilling{" "}
                  {result.practiceMode === "interleaved" ? "(Interleaved Campur Strategi)" : "(Fokus Bertahap)"}
                </span>
              </div>

              {!showRecap && currentDrill && (
                <div className="inline-flex items-center gap-3 text-xs font-num font-extrabold">
                  <span className="text-[var(--ink-secondary)]">
                    Soal {drillIndex + 1}/{result.drillQuestions.length}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] text-[var(--ink-primary)]">
                    <TimerIcon size={13} />
                    {formatTimerClock(currentRecord ? currentRecord.elapsedSeconds : elapsedSeconds)}
                  </span>
                </div>
              )}
            </div>

            {showRecap && recapSummary ? (
              <div className="space-y-4 pt-2 border-t border-[var(--border-structural)]">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)]">
                    <div className="text-xl sm:text-2xl font-num font-bold text-[var(--accent-text-on-secondary)]">
                      {recapSummary.correctCount}/{recapSummary.total}
                    </div>
                    <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Benar</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--surface-secondary)]">
                    <div className="text-xl sm:text-2xl font-num font-bold text-[var(--ink-primary)]">
                      {recapSummary.accuracyPct}%
                    </div>
                    <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Akurasi</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--surface-secondary)]">
                    <div className="text-xl sm:text-2xl font-num font-bold text-[var(--ink-primary)]">
                      {recapSummary.avgSeconds} dtk
                    </div>
                    <div className="text-[11px] font-bold text-[var(--ink-secondary)]">Rata-rata/Soal</div>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border-structural)] border-y border-[var(--border-structural)]">
                  {result.drillQuestions.map((q, idx) => {
                    const rec = answersById[q.id];
                    return (
                      <div
                        key={q.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs font-bold"
                      >
                        <div className="min-w-0">
                          <span className="font-num text-[var(--ink-muted)] mr-2">#{idx + 1}</span>
                          <span className="text-[var(--ink-primary)]">{q.strategyTag}</span>
                        </div>
                        <span
                          className={
                            rec?.isCorrect
                              ? "text-[var(--accent-text-on-secondary)] shrink-0"
                              : "text-[var(--coral-ink)] shrink-0"
                          }
                        >
                          {rec?.isCorrect ? "Tepat" : `Keliru (${rec?.selectedKey ?? "-"} vs ${q.correctAnswerKey})`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {savedBankOutcome ? (
                  <div className="p-4 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs sm:text-sm font-bold text-[var(--accent-text-on-secondary)]">
                      Berhasil! {savedBankOutcome.savedCount} soal tersimpan ke Bank Latihan pribadimu di PostgreSQL.
                    </div>
                    <Link href={savedBankOutcome.studyHref} className="btn-primary text-xs shrink-0">
                      <span>Latih di /study</span>
                      <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={savingBank}
                      onClick={() => void handleSaveDrillsToBank()}
                      className="btn-primary text-xs sm:text-sm"
                    >
                      <CheckIcon size={15} />
                      <span>
                        {savingBank
                          ? "Menyimpan ke Bank Latihan..."
                          : "Simpan Soal ke Bank Latihan Saya"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRetryDrills}
                      className="btn-secondary text-xs sm:text-sm"
                    >
                      <ResetIcon size={14} />
                      <span>Ulangi Grilling Ini</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              currentDrill && (
                <div className="space-y-4 pt-2 border-t border-[var(--border-structural)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[var(--ink-secondary)]">
                      {!currentRecord && result.practiceMode === "interleaved"
                        ? "Strategi sengaja disembunyikan: tentukan sendiri pola mana yang cocok!"
                        : `Strategi / Bab: ${currentDrill.strategyTag}`}
                    </span>
                    <span className="font-num font-bold text-[var(--ink-muted)]">
                      {currentDrill.difficultyTier.replaceAll("_", " ")}
                    </span>
                  </div>

                  {currentDrill.passageText && (
                    <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-structural)] text-xs sm:text-sm leading-relaxed font-semibold text-[var(--ink-primary)] whitespace-pre-line">
                      {currentDrill.passageText}
                    </div>
                  )}

                  <div className="text-sm sm:text-base font-bold leading-relaxed text-[var(--ink-primary)]">
                    <MathText text={currentDrill.stemMarkdown} />
                  </div>

                  <div className="space-y-2">
                    {currentDrill.options.map((opt) => {
                      const activeChoice = currentRecord ? currentRecord.selectedKey : draftChoice;
                      const isPicked = activeChoice === opt.key;
                      const isCorrect = opt.key === currentDrill.correctAnswerKey;

                      let cls =
                        "border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:border-[var(--accent-primary)]";
                      if (currentRecord) {
                        if (isCorrect) {
                          cls =
                            "border-[var(--accent-primary)] bg-[var(--accent-tint)] text-[var(--ink-primary)]";
                        } else if (isPicked) {
                          cls =
                            "border-[var(--coral-border)] bg-[var(--coral-tint)] text-[var(--ink-primary)]";
                        } else {
                          cls = "border-[var(--border-structural)] opacity-65";
                        }
                      } else if (isPicked) {
                        cls =
                          "border-[var(--accent-primary)] bg-[var(--accent-tint)] text-[var(--ink-primary)]";
                      }

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={Boolean(currentRecord)}
                          onClick={() => setDraftChoice(opt.key)}
                          className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border-2 text-left text-xs sm:text-sm font-semibold flex items-start gap-2.5 transition-colors cursor-pointer disabled:cursor-default ${cls}`}
                        >
                          <span className="font-num font-extrabold shrink-0 mt-0.5">{opt.key}.</span>
                          <span className="flex-1">
                            <MathText text={opt.textMarkdown} />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {!currentRecord ? (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label
                          htmlFor="studio-self-explain"
                          className="block text-[11px] font-extrabold uppercase tracking-wider text-[var(--olive-ink)]"
                        >
                          Self-Explanation (Memperkuat Daya Ingat +55% menurut riset)
                        </label>
                        <input
                          id="studio-self-explain"
                          type="text"
                          value={draftExplanation}
                          onChange={(e) => setDraftExplanation(e.target.value)}
                          placeholder="Opsional: tulis 1 alasan singkat kenapa kamu pilih opsi ini..."
                          className="input-tactile w-full text-xs sm:text-sm"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={!draftChoice}
                          onClick={handleLockDrillAnswer}
                          className="btn-primary text-xs sm:text-sm"
                        >
                          <CheckIcon size={15} />
                          <span>Kunci Jawaban</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-3 border-t border-[var(--border-structural)]">
                      <div
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold ${
                          currentRecord.isCorrect
                            ? "bg-[var(--accent-tint)] border-[var(--accent-tint-border)] text-[var(--accent-text-on-secondary)]"
                            : "bg-[var(--coral-tint)] border-[var(--coral-border)] text-[var(--coral-ink)]"
                        }`}
                      >
                        {currentRecord.isCorrect
                          ? `Tepat! Kamu memilih opsi ${currentDrill.correctAnswerKey} (${currentDrill.strategyTag}) dalam ${currentRecord.elapsedSeconds} detik.`
                          : `Belum tepat. Kamu memilih ${currentRecord.selectedKey}, sedangkan jawaban benar adalah ${currentDrill.correctAnswerKey} (${currentDrill.strategyTag}).`}
                      </div>

                      {currentRecord.selfExplanation && (
                        <div className="p-3 rounded-xl bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--ink-secondary)]">
                          <span className="font-extrabold text-[var(--ink-primary)] mr-1">
                            Alasanmu tadi:
                          </span>
                          &ldquo;{currentRecord.selfExplanation}&rdquo;
                        </div>
                      )}

                      <div className="space-y-1.5 pl-3.5 border-l-2 border-[var(--accent-primary)]">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                          Bedah Pembahasan (Why Before How)
                        </div>
                        <div className="text-xs sm:text-sm font-semibold leading-relaxed text-[var(--ink-primary)]">
                          <MathText text={currentDrill.whySolutionMarkdown} />
                        </div>
                      </div>

                      {!currentRecord.isCorrect && (
                        <div className="text-xs font-bold text-[var(--coral-ink)]">
                          Kenapa opsi {currentRecord.selectedKey} mengecoh:{" "}
                          <MathText
                            text={
                              currentDrill.options.find((o) => o.key === currentRecord.selectedKey)
                                ?.distractorRationale ?? ""
                            }
                          />
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] text-xs font-bold text-[var(--ochre-ink)]">
                        Cek Pemahaman (Self-Explanation):{" "}
                        <MathText text={currentDrill.selfExplanationPrompt} />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextDrill}
                          className="btn-primary text-xs sm:text-sm"
                        >
                          <span>
                            {drillIndex + 1 >= result.drillQuestions.length
                              ? "Lihat Rekap Grilling"
                              : "Soal Berikutnya"}
                          </span>
                          <ArrowRightIcon size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </section>
        </div>
      )}
    </div>
  );
}
