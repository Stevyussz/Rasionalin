"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowRightIcon,
  BrainIcon,
  FractureIcon,
  HealedIcon,
  HintIcon,
  PlayIcon,
  VerifyIcon,
} from "@/components/icons/ArchitecturalIcons";
import { AppShell } from "@/components/layout/AppShell";
import { MathText } from "@/components/math/MathText";
import { getRootCauseLabelId, getTrapLabelId } from "@/domain/root-cause-rules";
import {
  installGlobalAudioUnlock,
  playCheckSound,
  playCorrectSound,
  playHintSound,
  playWrongSound,
  unlockAudioContext,
} from "@/infrastructure/audio/sound-effects";
import type {
  DistractorTrapType,
  FractureStatus,
  FsrsRatingName,
  MathVerificationRunEntity,
  QuestionEntity,
  QuestionTemplateEntity,
  RootCauseType,
} from "@/domain/types";

interface EnrichedFracture {
  id: string;
  skillNodeId: string;
  skillCode: string;
  skillTitle: string;
  subtest: string;
  originStemPreview: string;
  primaryRootCause: RootCauseType;
  distractorTrapCaught: DistractorTrapType;
  diagnosticSummary: string;
  status: FractureStatus;
  revivalPassesAchieved: number;
  revivalPassesRequired: number;
  fsrsDue: string | null;
  fsrsStability: number;
}

interface RecallCard {
  skillNodeId: string;
  subtest: string;
  titleId: string;
  isFoundationRepair: boolean;
  hasActiveFracture: boolean;
  promptQuestion: string;
  whyAnswer: string;
  deepContext: string;
  fsrsState: string;
  fsrsDue: string | null;
  fsrsReps: number;
  isDue: boolean;
}

interface SandboxGenOutcome {
  ok: boolean;
  question: QuestionEntity | null;
  verificationRun: MathVerificationRunEntity | null;
  multiSeedPassed: number;
  failureReason: string | null;
}

export function GraveyardWorkspace() {
  const [activeTab, setActiveTab] = useState<"recall" | "mistakes" | "generator">("recall");
  const [fractures, setFractures] = useState<EnrichedFracture[]>([]);
  const [templates, setTemplates] = useState<QuestionTemplateEntity[]>([]);
  const [recentRuns, setRecentRuns] = useState<MathVerificationRunEntity[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | FractureStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Recall & FSRS Spaced Repetition Deck
  const [recallDeck, setRecallDeck] = useState<RecallCard[]>([]);
  const [recallIndex, setRecallIndex] = useState(0);
  const [recallRevealed, setRecallRevealed] = useState(false);
  const [recallUserDraft, setRecallUserDraft] = useState("");
  const [recallBusy, setRecallBusy] = useState(false);
  const [recallToast, setRecallToast] = useState<string | null>(null);

  // Neuro-Symbolic Variation Generator State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [genOutcome, setGenOutcome] = useState<SandboxGenOutcome | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const [gravRes, recRes] = await Promise.all([
        fetch(`/api/graveyard${qs}`),
        fetch("/api/graveyard/recall"),
      ]);
      if (!gravRes.ok) throw new Error("Gagal memuat data pemulihan.");
      const json = (await gravRes.json()) as {
        fractures: EnrichedFracture[];
        templates: QuestionTemplateEntity[];
        recentRuns: MathVerificationRunEntity[];
      };
      setFractures(json.fractures);
      setTemplates(json.templates);
      setRecentRuns(json.recentRuns);
      if (json.templates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(json.templates[0].id);
      }
      if (recRes.ok) {
        const recJson = (await recRes.json()) as { deck: RecallCard[] };
        setRecallDeck(recJson.deck ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedTemplateId]);

  useEffect(() => {
    installGlobalAudioUnlock();
    void loadData();
  }, [loadData]);

  async function handleRecallRate(rating: FsrsRatingName) {
    const card = recallDeck[recallIndex];
    if (!card || recallBusy) return;
    unlockAudioContext();
    setRecallBusy(true);
    setRecallToast(null);
    try {
      const res = await fetch("/api/graveyard/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillNodeId: card.skillNodeId, rating }),
      });
      if (res.ok) {
        if (rating === "again") {
          playWrongSound();
        } else if (rating === "easy") {
          playCorrectSound();
        } else {
          playCheckSound();
        }
        const json = (await res.json()) as { nextDueIso: string; scheduledDays: number };
        const daysLabel =
          json.scheduledDays >= 1
            ? `${json.scheduledDays} hari lagi`
            : "dalam sesi ulang singkat hari ini";
        setRecallToast(`Tersimpan di FSRS · "${card.titleId}" dijadwalkan ulang ${daysLabel}.`);
        setRecallRevealed(false);
        setRecallUserDraft("");
        setRecallIndex((prev) => (prev + 1) % Math.max(1, recallDeck.length));
      }
    } finally {
      setRecallBusy(false);
    }
  }

  async function runSandboxVerification() {
    if (!selectedTemplateId || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/sandbox/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          verifyMultiSeed: true,
        }),
      });
      const json = (await res.json()) as SandboxGenOutcome;
      setGenOutcome(json);
      await loadData();
    } finally {
      setGenerating(false);
    }
  }

  const activeCard = recallDeck[recallIndex] ?? null;
  const activeCount = fractures.filter((f) => f.status !== "healed").length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Clean Editorial Header (Zero Nested Box Soup) */}
        <header className="pb-4 border-b border-[var(--border-structural)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--coral-ink)]">
              <BrainIcon size={18} />
              <span>Active Recall & Spaced Repetition (FSRS)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Pemulihan & Ingatan Aktif</h1>
            <p className="text-sm font-semibold text-[var(--ink-secondary)] max-w-2xl">
              Kunci pemahaman dari nol adalah menarik ulang konsep dari kepala sendiri (Active Recall) dan mengulangnya tepat sebelum lupa (Spaced Repetition FSRS).
            </p>
          </div>
          <div className="text-sm font-extrabold text-[var(--coral-ink)] shrink-0">
            <span className="font-num text-xl mr-1">{activeCount}</span>
            kesalahan perlu dilatih ulang
          </div>
        </header>

        {/* Clean Underline Tab Bar */}
        <div
          className="flex flex-wrap gap-6 border-b border-[var(--border-structural)]"
          role="tablist"
          aria-label="Pilih mode pemulihan"
        >
          {[
            { id: "recall" as const, label: `Active Recall FSRS (${recallDeck.length})` },
            { id: "mistakes" as const, label: `Antrean Kesalahan (${fractures.length})` },
            { id: "generator" as const, label: "Buat Variasi Soal Baru" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] text-sm font-extrabold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                  : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ACTIVE RECALL & SPACED REPETITION (FSRS) */}
        {activeTab === "recall" && (
          <section className="max-w-[740px] space-y-4">
            {recallToast && (
              <div className="p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                {recallToast}
              </div>
            )}

            {loading ? (
              <div className="h-64 rounded-xl bg-[var(--surface-secondary)]" />
            ) : activeCard ? (
              <article className="card-tactile p-6 sm:p-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
                  <span className="text-[var(--accent-text-on-secondary)] uppercase tracking-wider">
                    {activeCard.subtest} · Kartu <span className="font-num">{recallIndex + 1}/{recallDeck.length}</span>
                  </span>
                  <span className="text-[var(--ink-muted)]">
                    Status FSRS: {activeCard.fsrsState} · Ulang <span className="font-num">{activeCard.fsrsReps}x</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold leading-snug">{activeCard.titleId}</h2>
                  <p className="text-sm sm:text-base font-bold text-[var(--ink-secondary)] leading-relaxed">
                    {activeCard.promptQuestion}
                  </p>
                </div>

                {!recallRevealed ? (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label htmlFor="recall-draft" className="text-xs font-extrabold text-[var(--ink-secondary)] block mb-1.5">
                        Tulis singkat jawaban ingatanmu (opsional, membantu otak lebih aktif):
                      </label>
                      <textarea
                        id="recall-draft"
                        rows={2}
                        value={recallUserDraft}
                        onChange={(e) => setRecallUserDraft(e.target.value)}
                        placeholder="Coba ingat alasan dasarnya dengan bahasamu sendiri..."
                        className="input-tactile text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playHintSound();
                        setRecallRevealed(true);
                      }}
                      className="btn-primary w-full"
                    >
                      <HintIcon size={18} />
                      <span>Buka Prinsip Why Before How</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5 pt-4 border-t border-[var(--border-structural)]">
                    <div className="space-y-1.5 border-l-4 border-[var(--accent-primary)] pl-4">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                        Prinsip Why Before How
                      </div>
                      <p className="text-base font-bold leading-relaxed text-[var(--ink-primary)]">
                        {activeCard.whyAnswer}
                      </p>
                      <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                        {activeCard.deepContext}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-xs font-extrabold text-[var(--ink-secondary)]">
                        Seberapa lancar kamu mengingatnya tadi? FSRS akan mengatur jadwal ulang otomatis:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { rating: "again" as const, label: "Lupa Lagi", style: "btn-danger" },
                          { rating: "hard" as const, label: "Masih Berat", style: "btn-secondary" },
                          { rating: "good" as const, label: "Paham", style: "btn-primary" },
                          { rating: "easy" as const, label: "Sangat Paham", style: "btn-olive" },
                        ].map((btn) => (
                          <button
                            key={btn.rating}
                            type="button"
                            disabled={recallBusy}
                            onClick={() => void handleRecallRate(btn.rating)}
                            className={`${btn.style} text-xs min-h-[44px]`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-structural)] text-xs font-extrabold">
                      <Link
                        href={`/study?skillNodeId=${activeCard.skillNodeId}`}
                        className="text-[var(--accent-text-on-secondary)] hover:underline inline-flex items-center gap-1"
                      >
                        <PlayIcon size={14} />
                        Langsung Latih Soal Materi Ini
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setRecallRevealed(false);
                          setRecallUserDraft("");
                          setRecallIndex((prev) => (prev + 1) % recallDeck.length);
                        }}
                        className="text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
                      >
                        Lewati ke Kartu Berikutnya →
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ) : null}
          </section>
        )}

        {/* TAB 2: MISTAKE RECOVERY QUEUE */}
        {activeTab === "mistakes" && (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["all", "active", "healing", "healed"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-extrabold border-2 transition-colors cursor-pointer ${
                    statusFilter === st
                      ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                      : "bg-[var(--surface-elevated)] text-[var(--ink-secondary)] border-[var(--border-structural)] hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  {st === "all"
                    ? "Semua"
                    : st === "active"
                      ? "Belum Dilatih"
                      : st === "healing"
                        ? "Setengah Jalan (1/2)"
                        : "Sudah Tuntas"}
                </button>
              ))}
            </div>

            {loading && <div className="h-44 rounded-xl bg-[var(--surface-secondary)]" />}

            {!loading && error && (
              <div className="card-tactile p-5 border-[var(--coral-border)] bg-[var(--coral-tint)] flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[var(--coral-ink)]">{error}</span>
                <button type="button" onClick={loadData} className="btn-secondary">
                  Muat Ulang
                </button>
              </div>
            )}

            {!loading && !error && fractures.length === 0 && (
              <div className="card-tactile p-8 text-center space-y-4 max-w-xl">
                <HealedIcon size={40} className="text-[var(--accent-primary)] mx-auto" />
                <div className="space-y-1">
                  <h2 className="font-bold text-lg">Belum ada antrean kesalahan</h2>
                  <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                    Setiap soal yang keliru saat latihan atau tryout akan otomatis masuk ke sini lengkap dengan jadwal pengulangan FSRS.
                  </p>
                </div>
                <Link href="/study" className="btn-primary">
                  <PlayIcon size={15} />
                  <span>Mulai Latihan Sekarang</span>
                </Link>
              </div>
            )}

            {!loading && !error && fractures.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fractures.map((f) => {
                  const isHealed = f.status === "healed";
                  return (
                    <article key={f.id} className="card-tactile p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
                          <span className="text-[var(--ink-secondary)]">
                            {f.subtest} · {f.skillTitle}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isHealed
                                ? "text-[var(--accent-text-on-secondary)]"
                                : "text-[var(--coral-ink)]"
                            }`}
                          >
                            {isHealed ? <HealedIcon size={16} /> : <FractureIcon size={16} />}
                            <span className="font-num">
                              {f.revivalPassesAchieved}/{f.revivalPassesRequired}
                            </span>{" "}
                            Tuntas
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2" aria-hidden="true">
                          {[0, 1].map((seg) => (
                            <div
                              key={seg}
                              className={`h-2 rounded-full ${
                                seg < f.revivalPassesAchieved
                                  ? "bg-[var(--accent-primary)]"
                                  : "bg-[var(--coral-tint)]"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-extrabold text-[var(--coral-ink)]">
                            {getRootCauseLabelId(f.primaryRootCause)}
                            {f.distractorTrapCaught !== "none" &&
                              ` · Jebakan: ${getTrapLabelId(f.distractorTrapCaught)}`}
                          </div>
                          <p className="text-sm font-semibold text-[var(--ink-primary)] leading-relaxed">
                            {f.diagnosticSummary}
                          </p>
                        </div>

                        {f.originStemPreview && (
                          <div className="text-xs font-semibold text-[var(--ink-secondary)] pt-2 border-t border-[var(--border-structural)]">
                            <MathText text={`${f.originStemPreview}...`} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-structural)]">
                        <span className="text-xs font-bold text-[var(--ink-muted)]">
                          {f.fsrsDue
                            ? `Jadwal ulang: ${new Date(f.fsrsDue).toLocaleDateString("id-ID")}`
                            : "Siap dilatih ulang"}
                        </span>
                        {!isHealed && (
                          <Link href={`/study?fractureId=${f.id}`} className="btn-primary text-xs min-h-[40px]">
                            <span>Latih Ulang</span>
                            <ArrowRightIcon size={15} />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: NEURO-SYMBOLIC VARIATION GENERATOR */}
        {activeTab === "generator" && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 card-tactile p-6 space-y-4">
              <div className="flex items-start gap-2.5">
                <VerifyIcon size={24} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-base">Generator Variasi Terverifikasi</h2>
                  <p className="text-xs font-semibold text-[var(--ink-secondary)] mt-0.5">
                    Angka baru, kunci jawaban dicek otomatis oleh mesin kalkulasi deterministik.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sandbox-tpl-select" className="text-xs font-extrabold block">
                  Pilih Pola Soal Matematika
                </label>
                <select
                  id="sandbox-tpl-select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="input-tactile text-sm"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      [{tpl.subtest}] {tpl.templateTitle}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={runSandboxVerification}
                disabled={generating || !selectedTemplateId}
                className="btn-olive w-full"
              >
                {generating ? "Membuat & Memverifikasi Soal..." : "Buat Soal Variasi Baru"}
              </button>

              {recentRuns.length > 0 && (
                <details className="pt-3 border-t border-[var(--border-structural)]">
                  <summary className="text-xs font-extrabold text-[var(--ink-secondary)] cursor-pointer">
                    Riwayat Verifikasi Deterministik ({recentRuns.length})
                  </summary>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto text-xs font-mono-telemetry">
                    {recentRuns.slice(0, 6).map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between gap-2 py-1 border-b border-[var(--border-structural)]"
                      >
                        <span className="font-bold text-[var(--accent-text-on-secondary)]">{run.status}</span>
                        <span className="text-[var(--ink-secondary)]">
                          seed {run.seedValue} · {run.executionTimeMs}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            <div className="lg:col-span-7 card-tactile p-6 space-y-4">
              {!genOutcome ? (
                <div className="py-8 text-center space-y-2">
                  <h3 className="font-display font-bold text-base">Pratinjau Soal Baru</h3>
                  <p className="text-sm font-semibold text-[var(--ink-secondary)] max-w-md mx-auto">
                    Pilih pola soal di sebelah kiri lalu klik <strong>Buat Soal Variasi Baru</strong> untuk melatih pola yang sama dengan angka baru.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-structural)] text-xs font-extrabold">
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        genOutcome.ok
                          ? "text-[var(--accent-text-on-secondary)]"
                          : "text-[var(--coral-ink)]"
                      }`}
                    >
                      <VerifyIcon size={17} />
                      {genOutcome.ok ? "Lolos Verifikasi Otomatis" : "Verifikasi Gagal"}
                    </span>
                    <span className="font-num text-[var(--ink-secondary)]">
                      {genOutcome.multiSeedPassed}/3 uji seed · {genOutcome.verificationRun?.executionTimeMs ?? 0}ms
                    </span>
                  </div>

                  {genOutcome.question && (
                    <>
                      <div className="text-base leading-relaxed font-bold">
                        <MathText text={genOutcome.question.stemMarkdown} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm font-bold">
                        {genOutcome.question.options.map((o) => (
                          <div
                            key={o.key}
                            className={`p-3 rounded-xl border-2 ${
                              o.key === genOutcome.question?.correctAnswerKey
                                ? "border-[var(--accent-primary)] bg-[var(--accent-tint)]"
                                : "border-[var(--border-structural)] bg-[var(--surface-canvas)]"
                            }`}
                          >
                            <span className="font-num mr-1.5">{o.key}.</span>
                            <MathText text={o.textMarkdown} />
                          </div>
                        ))}
                      </div>
                      <Link
                        href={`/study?questionId=${genOutcome.question.id}`}
                        className="btn-primary w-full"
                      >
                        <PlayIcon size={16} />
                        <span>Latih Soal Baru Ini Sekarang</span>
                      </Link>
                    </>
                  )}

                  {genOutcome.failureReason && (
                    <p className="text-xs font-bold text-[var(--coral-ink)]">
                      {genOutcome.failureReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
