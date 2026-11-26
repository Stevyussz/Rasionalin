import { describe, expect, it } from "vitest";
import { ASAS_SUBJECTS, buildAsasSession, getAsasSubject } from "../src/domain/asas";

describe("ASAS Kelas XII Sains Curriculum & Bank Soal", () => {
  it("provides all 5 science subjects with Matematika Wajib prioritized first", () => {
    expect(ASAS_SUBJECTS.map((s) => s.id)).toEqual([
      "mtk-wajib",
      "mtk-lanjut",
      "fisika",
      "kimia",
      "biologi",
    ]);
  });

  it("contains 25 verified questions per subject (125 total) with valid keys, chapters, formulas, and zero em-dashes", () => {
    const seenIds = new Set<string>();
    let totalQuestions = 0;

    for (const sub of ASAS_SUBJECTS) {
      expect(sub.oneDayPlan.length).toBeGreaterThanOrEqual(4);
      expect(sub.chapters.length).toBeGreaterThanOrEqual(3);
      expect(sub.questions.length).toBe(25);
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

    expect(totalQuestions).toBe(125);
  });

  it("builds balanced 15-question tryouts across all chapters and supports wrong-only remedial filtering", () => {
    for (const sub of ASAS_SUBJECTS) {
      const tryout = buildAsasSession({ subjectId: sub.id, mode: "tryout", seed: 42 });
      expect(tryout.questions.length).toBe(15);

      const chaptersRepresented = new Set(tryout.questions.map((q) => q.chapterId));
      expect(chaptersRepresented.size).toBe(sub.chapters.length);

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
});
