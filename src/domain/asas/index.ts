import { BIOLOGI_SUBJECT } from "./data-biologi";
import { FISIKA_SUBJECT } from "./data-fisika";
import { KIMIA_SUBJECT } from "./data-kimia";
import { MTK_LANJUT_SUBJECT } from "./data-mtk-lanjut";
import { MTK_WAJIB_SUBJECT } from "./data-mtk-wajib";
import type { AsasChapter, AsasQuestion, AsasSubject, AsasSubjectId } from "./types";

export type {
  AsasChapter,
  AsasFormulaCard,
  AsasOneDayBlock,
  AsasOption,
  AsasOptionKey,
  AsasQuestion,
  AsasSubject,
  AsasSubjectId,
  AsasWorkedStep,
} from "./types";

/** Ordered with Matematika Wajib first (exam tomorrow) followed by Science subjects */
export const ASAS_SUBJECTS: AsasSubject[] = [
  MTK_WAJIB_SUBJECT,
  MTK_LANJUT_SUBJECT,
  FISIKA_SUBJECT,
  KIMIA_SUBJECT,
  BIOLOGI_SUBJECT,
];

export function getAsasSubject(id: AsasSubjectId): AsasSubject {
  return ASAS_SUBJECTS.find((s) => s.id === id) ?? MTK_WAJIB_SUBJECT;
}

export function getAsasChapter(subject: AsasSubject, chapterId: string): AsasChapter {
  return subject.chapters.find((c) => c.id === chapterId) ?? subject.chapters[0];
}

function shuffleWithSeed<T>(items: T[], seedInput: number): T[] {
  const arr = [...items];
  let seed = (seedInput % 2147483647) || 1337;
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 48271) % 2147483647;
    const j = seed % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export type AsasSessionMode = "chapter" | "tryout" | "all" | "wrong-only";

export function buildAsasSession(params: {
  subjectId: AsasSubjectId;
  mode: AsasSessionMode;
  chapterId?: string;
  wrongIds?: string[];
  seed?: number;
}): {
  title: string;
  subtitle: string;
  questions: AsasQuestion[];
} {
  const subject = getAsasSubject(params.subjectId);
  const seed = params.seed ?? Date.now();

  if (params.mode === "wrong-only") {
    const wrongSet = new Set(params.wrongIds ?? []);
    const missed = subject.questions.filter((q) => wrongSet.has(q.id));
    const list = missed.length > 0 ? missed : subject.questions.slice(0, 5);
    return {
      title: `Remedial Soal Salah · ${subject.shortName}`,
      subtitle: "Basmi titik lemah sebelum masuk ruang ujian",
      questions: shuffleWithSeed(list, seed),
    };
  }

  if (params.mode === "chapter" && params.chapterId) {
    const ch = getAsasChapter(subject, params.chapterId);
    const qs = subject.questions.filter((q) => q.chapterId === ch.id);
    return {
      title: `${subject.shortName} · Bab ${ch.order}: ${ch.shortTitle}`,
      subtitle: "Latihan terfokus per bab dengan Rumus & Pembahasan dari Nol",
      questions: shuffleWithSeed(qs, seed),
    };
  }

  if (params.mode === "all") {
    return {
      title: `Latihan Penuh · ${subject.name}`,
      subtitle: `${subject.questions.length} soal lengkap seluruh bab`,
      questions: shuffleWithSeed(subject.questions, seed),
    };
  }

  // Balanced Tryout: prioritize priorityChapterIds if present (e.g., 20-soal Fokus Pencacahan & Peluang)
  const targetCount = subject.tryoutCount ?? 15;
  const activeChapters =
    subject.priorityChapterIds && subject.priorityChapterIds.length > 0
      ? subject.chapters.filter((ch) => subject.priorityChapterIds!.includes(ch.id))
      : subject.chapters;

  const buckets = activeChapters.map((ch) =>
    shuffleWithSeed(
      subject.questions.filter((q) => q.chapterId === ch.id),
      seed + ch.order * 97,
    ),
  );
  const picked: AsasQuestion[] = [];
  let cursor = 0;
  while (picked.length < targetCount) {
    let pushedThisRound = false;
    for (const b of buckets) {
      if (cursor < b.length && picked.length < targetCount) {
        picked.push(b[cursor]);
        pushedThisRound = true;
      }
    }
    if (!pushedThisRound) break;
    cursor += 1;
  }

  const isPriorityTryout = Boolean(subject.priorityChapterIds && subject.priorityChapterIds.length > 0);
  return {
    title: isPriorityTryout
      ? `Tryout Fokus Besok (${picked.length} Soal) · ${subject.name}`
      : `Tryout Campur ASAS · ${subject.name}`,
    subtitle: isPriorityTryout
      ? `Simulasi ${picked.length} pola inti mewakili soal ASAS besok (skor 0-100)`
      : `${picked.length} soal seimbang lintas semua bab (skor 0-100)`,
    questions: shuffleWithSeed(picked, seed + 41),
  };
}
