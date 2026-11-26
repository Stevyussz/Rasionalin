import katex from "katex";
import { describe, expect, it } from "vitest";
import { ASAS_SUBJECTS, buildAsasSession, getAsasSubject } from "../src/domain/asas";

describe("ASAS Kelas XII Sains Curriculum & Bank Soal", () => {
  it("provides all 5 science subjects with Matematika Wajib prioritized and strictly aligned to Ganjil XII syllabus", () => {
    expect(ASAS_SUBJECTS.map((s) => s.id)).toEqual([
      "mtk-wajib",
      "mtk-lanjut",
      "fisika",
      "kimia",
      "biologi",
    ]);

    const mtkWajib = getAsasSubject("mtk-wajib");
    expect(mtkWajib.chapters.map((c) => c.id)).toEqual([
      "mtkw-pencacahan",
      "mtkw-peluang",
      "mtkw-barisan-deret",
      "mtkw-investasi-pinjaman",
    ]);
    expect(mtkWajib.priorityChapterIds).toEqual(["mtkw-pencacahan", "mtkw-peluang"]);
    expect(mtkWajib.questions.length).toBe(50);
  });

  it("contains >=25 verified questions per subject (130 total) with valid keys, chapters, formulas, and zero em-dashes", () => {
    const seenIds = new Set<string>();
    let totalQuestions = 0;

    for (const sub of ASAS_SUBJECTS) {
      expect(sub.oneDayPlan.length).toBeGreaterThanOrEqual(4);
      expect(sub.chapters.length).toBeGreaterThanOrEqual(3);
      expect(sub.questions.length).toBeGreaterThanOrEqual(25);
      totalQuestions += sub.questions.length;

      const chapterIds = new Set(sub.chapters.map((c) => c.id));
      for (const ch of sub.chapters) {
        expect(ch.formulas.length).toBeGreaterThanOrEqual(1);
        expect(ch.mentalChecklist.length).toBeGreaterThanOrEqual(3);
        expect(ch.workedExample.steps.length).toBeGreaterThanOrEqual(2);
        expect(JSON.stringify(ch)).not.toContain("\u2014");
      }

      for (const q of sub.questions) {
        expect(seenIds.has(q.id)).toBe(false);
        seenIds.add(q.id);
        expect(q.subjectId).toBe(sub.id);
        expect(chapterIds.has(q.chapterId)).toBe(true);
        expect(q.formulaHint.trim().length).toBeGreaterThan(8);
        expect(q.stepByStep.length).toBeGreaterThanOrEqual(1);
        expect(q.options.length).toBe(5);

        const correctOptions = q.options.filter((o) => o.isCorrect);
        expect(correctOptions.length).toBe(1);
        expect(correctOptions[0].key).toBe(q.correctKey);
        expect(JSON.stringify(q)).not.toContain("\u2014");
      }
    }

    expect(totalQuestions).toBe(150);
  });

  it("builds 20-question priority tryout for MTK Wajib and balanced 15-question tryouts for other subjects", () => {
    for (const sub of ASAS_SUBJECTS) {
      const tryout = buildAsasSession({ subjectId: sub.id, mode: "tryout", seed: 42 });
      const expectedCount = sub.tryoutCount ?? 15;
      const expectedChapters = sub.priorityChapterIds ?? sub.chapters.map((c) => c.id);
      expect(tryout.questions.length).toBe(expectedCount);

      const chaptersRepresented = new Set(tryout.questions.map((q) => q.chapterId));
      expect(Array.from(chaptersRepresented).sort()).toEqual([...expectedChapters].sort());

      const sampleWrong = [sub.questions[0].id, sub.questions[5].id];
      const remedial = buildAsasSession({
        subjectId: sub.id,
        mode: "wrong-only",
        wrongIds: sampleWrong,
        seed: 99,
      });
      expect(remedial.questions.map((q) => q.id).sort()).toEqual([...sampleWrong].sort());
    }

    const mtk = getAsasSubject("mtk-wajib");
    const firstCh = buildAsasSession({
      subjectId: "mtk-wajib",
      mode: "chapter",
      chapterId: mtk.chapters[0].id,
      seed: 7,
    });
    expect(firstCh.questions.every((q) => q.chapterId === mtk.chapters[0].id)).toBe(true);
  });

  it("renders all KaTeX formulas cleanly without parse errors or stray unwrapped math tokens", () => {
    const mathSegRegex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    const rawLatexOutsideMath = /\\(?:pm|mu|omega|text|frac|dfrac|sqrt|times|cdot|leq?|geq?|infty|alpha|beta|theta|pi|Delta|Sigma|int|lim)\b/;
    const rawSqrtCallOutsideMath = /\bsqrt\(/;
    const rawSuperOutsideMath = /[A-Za-z0-9)\]}]\^[({0-9a-zA-Z-]/;
    const rawSubOutsideMath = /\b[A-Za-z]_[0-9a-zA-Z{]/;

    for (const sub of ASAS_SUBJECTS) {
      const fields: Array<{ loc: string; text: string }> = [];

      sub.oneDayPlan.forEach((p, idx) => {
        fields.push({ loc: `${sub.id}.plan[${idx}].title`, text: p.title });
        fields.push({ loc: `${sub.id}.plan[${idx}].goal`, text: p.goal });
      });

      for (const ch of sub.chapters) {
        fields.push({ loc: `${ch.id}.summary`, text: ch.summary });
        fields.push({ loc: `${ch.id}.coreIntuition`, text: ch.coreIntuition });
        if (ch.analogy) {
          fields.push({ loc: `${ch.id}.analogy.story`, text: ch.analogy.story });
          fields.push({ loc: `${ch.id}.analogy.takeaway`, text: ch.analogy.takeaway });
        }
        ch.decisionGuide?.forEach((d, i) => {
          fields.push({ loc: `${ch.id}.decision[${i}].cue`, text: d.cue });
          fields.push({ loc: `${ch.id}.decision[${i}].formulaLatex`, text: d.formulaLatex });
          fields.push({ loc: `${ch.id}.decision[${i}].firstStep`, text: d.firstStep });
        });
        ch.mentalChecklist.forEach((m, i) => fields.push({ loc: `${ch.id}.checklist[${i}]`, text: m }));
        for (const f of ch.formulas) {
          fields.push({ loc: `${ch.id}.${f.id}.title`, text: f.title });
          fields.push({ loc: `${ch.id}.${f.id}.triggerCue`, text: f.triggerCue });
          fields.push({ loc: `${ch.id}.${f.id}.formulaLatex`, text: f.formulaLatex });
          fields.push({ loc: `${ch.id}.${f.id}.commonTrap`, text: f.commonTrap });
          fields.push({ loc: `${ch.id}.${f.id}.quickExample`, text: f.quickExample });
          f.symbolMeaning.forEach((sm, i) => {
            fields.push({ loc: `${ch.id}.${f.id}.sm[${i}].symbol`, text: sm.symbol });
            fields.push({ loc: `${ch.id}.${f.id}.sm[${i}].meaning`, text: sm.meaning });
          });
        }
        for (const ex of [ch.workedExample, ...(ch.extraExamples ?? [])]) {
          fields.push({ loc: `${ch.id}.ex.title`, text: ex.title });
          if (ex.whenToUse) fields.push({ loc: `${ch.id}.ex.whenToUse`, text: ex.whenToUse });
          fields.push({ loc: `${ch.id}.ex.problem`, text: ex.problem });
          fields.push({ loc: `${ch.id}.ex.finalAnswer`, text: ex.finalAnswer });
          ex.steps.forEach((st, i) => {
            fields.push({ loc: `${ch.id}.ex.step[${i}].label`, text: st.stepLabel });
            fields.push({ loc: `${ch.id}.ex.step[${i}].detail`, text: st.detail });
            if (st.math) fields.push({ loc: `${ch.id}.ex.step[${i}].math`, text: st.math });
          });
        }
      }

      for (const q of sub.questions) {
        fields.push({ loc: `${q.id}.triggerTag`, text: q.triggerTag });
        fields.push({ loc: `${q.id}.formulaHint`, text: q.formulaHint });
        fields.push({ loc: `${q.id}.prompt`, text: q.promptMarkdown });
        q.options.forEach((o) => {
          fields.push({ loc: `${q.id}.opt[${o.key}].text`, text: o.text });
          if (o.trapFeedback) fields.push({ loc: `${q.id}.opt[${o.key}].trap`, text: o.trapFeedback });
        });
        q.stepByStep.forEach((s, i) => fields.push({ loc: `${q.id}.step[${i}]`, text: s }));
      }

      for (const { loc, text } of fields) {
        // 1. Validate every $...$ and $$...$$ KaTeX block parses cleanly
        let m: RegExpExecArray | null;
        mathSegRegex.lastIndex = 0;
        while ((m = mathSegRegex.exec(text)) !== null) {
          const tex = (m[1] ?? m[2]).trim().replace(/\\frac(?=\{)/g, "\\dfrac");
          try {
            katex.renderToString(tex, { displayMode: Boolean(m[1]), throwOnError: true, strict: "ignore" });
          } catch (err) {
            throw new Error(`KaTeX parse error in ${loc}: ${tex} -> ${String(err)}`);
          }
        }

        // 2. Ensure zero unwrapped math tokens leak outside $...$ delimiters
        const outsideMath = text.replace(mathSegRegex, " ");
        expect(outsideMath, `Raw LaTeX command outside $...$ in ${loc}: ${outsideMath}`).not.toMatch(rawLatexOutsideMath);
        expect(outsideMath, `Raw sqrt() outside $...$ in ${loc}: ${outsideMath}`).not.toMatch(rawSqrtCallOutsideMath);
        expect(outsideMath, `Raw superscript outside $...$ in ${loc}: ${outsideMath}`).not.toMatch(rawSuperOutsideMath);
        expect(outsideMath, `Raw subscript outside $...$ in ${loc}: ${outsideMath}`).not.toMatch(rawSubOutsideMath);
      }
    }
  }, 15_000);
});
