"use client";

import React, { useState } from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BrainIcon,
  CheckIcon,
  CloseIcon,
  HintIcon,
  PlayIcon,
  ShieldIcon,
  TutorChatIcon,
} from "@/components/icons/ArchitecturalIcons";
import { MathText } from "@/components/math/MathText";
import type { MicroLessonContent } from "@/domain/micro-lessons";
import type { SkillNode } from "@/domain/types";

interface MicroLessonViewProps {
  skillNode: SkillNode;
  lesson: MicroLessonContent;
  onStartPractice: () => void;
}

export function MicroLessonView({ skillNode, lesson, onStartPractice }: MicroLessonViewProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [warmupSelected, setWarmupSelected] = useState<"A" | "B" | "C" | null>(null);
  const [aiSimpleLoading, setAiSimpleLoading] = useState(false);
  const [aiSimpleText, setAiSimpleText] = useState<string | null>(null);

  const selectedWarmupOpt = warmupSelected
    ? lesson.warmupCheck.options.find((o) => o.key === warmupSelected)
    : null;
  const warmupCorrect = warmupSelected === lesson.warmupCheck.correctKey;

  async function askAiSimplerAnalogy() {
    if (aiSimpleLoading) return;
    setAiSimpleLoading(true);
    try {
      const res = await fetch("/api/tutor/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtest: skillNode.subtest,
          message: `Aku benar-benar nol di materi "${skillNode.titleId}". Jelaskan dengan bahasa paling santai dan analogi kehidupan sehari-hari yang berbeda dari buku biasa: ${lesson.whyHeadline}`,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { whyFirstMarkdown?: string };
        setAiSimpleText(json.whyFirstMarkdown ?? null);
      }
    } finally {
      setAiSimpleLoading(false);
    }
  }

  return (
    <div className="max-w-[740px] mx-auto space-y-5">
      {/* Top Micro-Lesson Progress Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
            <BookOpenIcon size={17} />
            <span>
              Pahami dari Nol · {skillNode.subtest} · ±{lesson.estimatedMinutes} Menit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold leading-snug">{skillNode.titleId}</h1>
        </div>

        <button
          type="button"
          onClick={onStartPractice}
          className="text-xs font-extrabold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline cursor-pointer"
        >
          Sudah paham? Langsung latihan soal →
        </button>
      </div>

      {/* 4-Segment Visual Progress Bar */}
      <div className="grid grid-cols-4 gap-2" aria-label={`Tahap materi ${step} dari 4`}>
        {[
          { num: 1 as const, label: "1. Mengapa (Why)" },
          { num: 2 as const, label: "2. Contoh Langkah" },
          { num: 3 as const, label: "3. Jebakan UTBK" },
          { num: 4 as const, label: "4. Pemanasan" },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className="text-left space-y-1.5 cursor-pointer group"
          >
            <div
              className={`h-2.5 rounded-full transition-colors ${
                s.num <= step ? "bg-[var(--accent-primary)]" : "bg-[var(--surface-secondary)]"
              }`}
            />
            <span
              className={`text-[11px] font-extrabold block truncate ${
                s.num === step
                  ? "text-[var(--accent-text-on-secondary)]"
                  : "text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)]"
              }`}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* STEP 1: WHY BEFORE HOW */}
      {step === 1 && (
        <section className="card-tactile p-6 sm:p-7 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
            <HintIcon size={18} />
            <span>Langkah 1 · Why Before How</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold leading-snug">{lesson.whyHeadline}</h2>

          <div className="text-[15px] sm:text-base font-semibold leading-relaxed text-[var(--ink-primary)]">
            <MathText text={lesson.whyStory} />
          </div>

          <div className="p-4 rounded-xl bg-[var(--ochre-tint)] border border-[var(--ochre-border)] space-y-1">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
              Analogi Sehari-hari
            </div>
            <div className="text-sm font-bold text-[var(--ink-primary)] leading-relaxed">
              <MathText text={lesson.analogy} />
            </div>
          </div>

          {lesson.coreRuleLatex && (
            <div className="space-y-1.5 pt-2 border-t border-[var(--border-structural)]">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
                Bentuk Inti yang Perlu Diingat
              </div>
              <MathText text={`$$${lesson.coreRuleLatex}$$`} />
            </div>
          )}

          <p className="text-xs sm:text-sm font-bold text-[var(--ink-secondary)]">
            Catatan kunci: <MathText text={lesson.coreRuleNote} />
          </p>

          {/* Optional Live AI Re-Explanation for Beginners */}
          <div className="pt-3 border-t border-[var(--border-structural)] space-y-3">
            <button
              type="button"
              disabled={aiSimpleLoading}
              onClick={askAiSimplerAnalogy}
              className="text-xs font-extrabold text-[var(--olive-ink)] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <TutorChatIcon size={17} />
              <span>
                {aiSimpleLoading
                  ? "Tutor AI sedang membuat analogi lebih santai..."
                  : "Masih bingung? Minta Tutor AI jelaskan lebih sederhana lagi"}
              </span>
            </button>

            {aiSimpleText && (
              <div className="border-l-4 border-[var(--accent-primary)] pl-4 py-1 text-sm font-semibold leading-relaxed">
                <MathText text={aiSimpleText} />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button type="button" onClick={() => setStep(2)} className="btn-primary">
              <span>Lanjut ke Contoh Langkah</span>
              <ArrowRightIcon size={17} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: WORKED EXAMPLE STEP-BY-STEP */}
      {step === 2 && (
        <section className="card-tactile p-6 sm:p-7 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
            <BookOpenIcon size={18} />
            <span>Langkah 2 · Contoh Terpandu (Step-by-Step)</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-secondary)] text-[15px] font-bold leading-relaxed">
            <MathText text={lesson.workedExample.prompt} />
          </div>

          <ol className="space-y-4">
            {lesson.workedExample.steps.map((st, idx) => (
              <li
                key={idx}
                className="border-l-4 border-[var(--accent-primary)] pl-4 space-y-1.5"
              >
                <div className="text-sm font-extrabold text-[var(--ink-primary)]">
                  <span className="font-num text-[var(--accent-text-on-secondary)] mr-1.5">
                    {idx + 1}.
                  </span>
                  {st.title}
                </div>
                <div className="text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
                  <MathText text={st.detail} />
                </div>
                {st.formulaLatex && <MathText text={`$$${st.formulaLatex}$$`} />}
              </li>
            ))}
          </ol>

          <div className="p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] text-sm font-extrabold text-[var(--accent-text-on-secondary)]">
            Ringkasan cepat: <MathText text={lesson.workedExample.takeaway} />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              ← Kembali
            </button>
            <button type="button" onClick={() => setStep(3)} className="btn-primary">
              <span>Lihat Jebakan UTBK</span>
              <ArrowRightIcon size={17} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: COMMON UTBK TRAP */}
      {step === 3 && (
        <section className="card-tactile p-6 sm:p-7 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--coral-ink)]">
            <ShieldIcon size={18} />
            <span>Langkah 3 · Jebakan Paling Sering di UTBK</span>
          </div>

          <h2 className="text-xl font-bold leading-snug">{lesson.commonTrap.trapTitle}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--coral-tint)] border border-[var(--coral-border)] space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--coral-ink)]">
                <CloseIcon size={15} />
                <span>Hindari Cara Ini</span>
              </div>
              <div className="text-sm font-semibold leading-relaxed text-[var(--ink-primary)]">
                <MathText text={lesson.commonTrap.wrongWay} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                <CheckIcon size={15} />
                <span>Lakukan Cara Benar</span>
              </div>
              <div className="text-sm font-semibold leading-relaxed text-[var(--ink-primary)]">
                <MathText text={lesson.commonTrap.rightWay} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
              ← Kembali
            </button>
            <button type="button" onClick={() => setStep(4)} className="btn-primary">
              <span>Coba 1 Pemanasan Ringan</span>
              <ArrowRightIcon size={17} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: ZERO-RISK ACTIVE RECALL WARMUP */}
      {step === 4 && (
        <section className="card-tactile p-6 sm:p-7 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
            <BrainIcon size={18} />
            <span>Langkah 4 · Pemanasan Active Recall (Tanpa Risiko Skor)</span>
          </div>

          <div className="text-base sm:text-[17px] font-bold leading-relaxed">
            <MathText text={lesson.warmupCheck.question} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lesson.warmupCheck.options.map((opt) => {
              const chosen = warmupSelected === opt.key;
              const isCorrect = opt.key === lesson.warmupCheck.correctKey;
              let style =
                "bg-[var(--surface-elevated)] border-[var(--border-structural)] border-b-[var(--border-bevel)] hover:bg-[var(--surface-secondary)]";
              if (chosen && isCorrect) {
                style = "bg-[var(--accent-tint)] border-[var(--accent-primary)] border-b-[var(--accent-bevel)]";
              } else if (chosen && !isCorrect) {
                style = "bg-[var(--coral-tint)] border-[var(--coral-fill)] border-b-[var(--coral-bevel)]";
              }
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setWarmupSelected(opt.key)}
                  className={`w-full text-left p-4 rounded-xl border-2 border-b-4 transition-all flex items-start gap-3 cursor-pointer ${style}`}
                >
                  <span className="w-7 h-7 rounded-lg border-2 border-[var(--border-structural)] inline-flex items-center justify-center font-num font-bold text-xs shrink-0">
                    {opt.key}
                  </span>
                  <div className="text-sm font-bold pt-0.5">
                    <MathText text={opt.text} />
                  </div>
                </button>
              );
            })}
          </div>

          {selectedWarmupOpt && (
            <div
              className={`p-4 rounded-xl border text-sm font-bold ${
                warmupCorrect
                  ? "bg-[var(--accent-tint)] border-[var(--accent-tint-border)] text-[var(--accent-text-on-secondary)]"
                  : "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)]"
              }`}
            >
              <MathText text={selectedWarmupOpt.feedback} />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-structural)]">
            <button type="button" onClick={() => setStep(3)} className="btn-secondary">
              ← Kembali
            </button>
            <button type="button" onClick={onStartPractice} className="btn-primary min-w-[220px]">
              <PlayIcon size={16} />
              <span>{warmupCorrect ? "Mantap! Mulai Latihan Soal" : "Mulai Latihan Soal"}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
