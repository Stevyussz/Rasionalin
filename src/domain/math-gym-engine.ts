import { NODE_IDS } from "./node-ids";

export type MathGymDifficulty = "dasar" | "standar" | "tantangan";

export type MathGymCategory =
  | "mixed"
  | "negative_order"
  | "fractions"
  | "powers_roots"
  | "algebra_shift"
  | "percent_ratio"
  | "geometry_basics"
  | "stat_prob_basics"
  | "word_translate"
  | "formula_selector";

export type MathGymCoreCategory = Exclude<MathGymCategory, "mixed">;

export interface MathGymOption {
  key: "A" | "B" | "C" | "D";
  labelLatexOrText: string;
  isCorrect: boolean;
  trapFeedback: string;
}

export interface MathGymQuestion {
  id: string;
  category: MathGymCoreCategory;
  categoryLabel: string;
  difficulty: MathGymDifficulty;
  promptMarkdown: string;
  hintText: string;
  options: MathGymOption[];
  correctKey: "A" | "B" | "C" | "D";
  stepByStep: string[];
  isRemedialRetry?: boolean;
}

export interface MathGymBeltMeta {
  id: string;
  beltNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  categories: MathGymCoreCategory[];
}

export interface MathGymCategoryMeta {
  id: MathGymCoreCategory;
  belt: 1 | 2 | 3;
  label: string;
  subtitle: string;
  examplePreview: string;
  studyTip: string;
  cheatSheetRules: Array<{ rule: string; example: string }>;
  linkedSkillNodeId: string;
  linkedSkillLabel: string;
}

export const MATH_GYM_BELTS: MathGymBeltMeta[] = [
  {
    id: "belt_1_hitung",
    beltNumber: 1,
    title: "Sabuk 1 · Fondasi Hitung Nol",
    subtitle: "Otomatiskan minus, pecahan, dan pangkat supaya otak tidak kelelahan saat baca soal UTBK.",
    categories: ["negative_order", "fractions", "powers_roots"],
  },
  {
    id: "belt_2_inti",
    beltNumber: 2,
    title: "Sabuk 2 · Aljabar, Persen, Geometri & Data",
    subtitle: "Bekal wajib untuk 70% soal PK dan PU: pindah ruas, diskon, sudut/Pythagoras, dan rata-rata/peluang.",
    categories: ["algebra_shift", "percent_ratio", "geometry_basics", "stat_prob_basics"],
  },
  {
    id: "belt_3_cerita",
    beltNumber: 3,
    title: "Sabuk 3 · Otak Soal Cerita & Pemilih Rumus",
    subtitle: "Khusus mengatasi rasa blank saat ketemu soal cerita panjang: terjemah kalimat dan pilih rumus tepat.",
    categories: ["word_translate", "formula_selector"],
  },
];

export const MATH_GYM_CATEGORIES: MathGymCategoryMeta[] = [
  {
    id: "negative_order",
    belt: 1,
    label: "Tanda Minus & Urutan Hitung",
    subtitle: "Kurung, perkalian dulu, dan minus ketemu minus.",
    examplePreview: "$6 - (-2) \\times 4$",
    studyTip: "Selesaikan kurung dan kali/bagi dulu sebelum tambah/kurang.",
    cheatSheetRules: [
      { rule: "Minus ketemu minus jadi tambah", example: "$a - (-b) = a + b$" },
      { rule: "Kurung dulu, baru pangkat, lalu kali/bagi", example: "$2 + 3 \\times (-4) = 2 - 12 = -10$" },
      { rule: "Minus di dalam kurung ikut dikuadratkan", example: "$(-3)^2 = (-3)\\times(-3) = +9$" },
    ],
    linkedSkillNodeId: NODE_IDS.PK_T0_FRAC,
    linkedSkillLabel: "PK · Operasi Pecahan, Rasio & Tanda Negatif",
  },
  {
    id: "fractions",
    belt: 1,
    label: "Pecahan Dasar & Desimal (+, -, ×, ÷)",
    subtitle: "Samakan penyebut, bagi = kali balik, dan pecahan campuran.",
    examplePreview: "$\\dfrac{2}{3} + \\dfrac{1}{4}$",
    studyTip: "Jangan pernah menjumlahkan penyebut dengan penyebut secara langsung!",
    cheatSheetRules: [
      { rule: "Tambah/kurang wajib samakan penyebut", example: "$\\dfrac{a}{b} + \\dfrac{c}{d} = \\dfrac{ad + bc}{bd}$" },
      { rule: "Bagi pecahan = kali kebalikannya", example: "$\\dfrac{a}{b} \\div \\dfrac{c}{d} = \\dfrac{a}{b} \\times \\dfrac{d}{c}$" },
      { rule: "Ubah desimal umum ke pecahan cepat", example: "$0{,}25 = \\dfrac{1}{4},\\; 0{,}5 = \\dfrac{1}{2},\\; 0{,}75 = \\dfrac{3}{4}$" },
    ],
    linkedSkillNodeId: NODE_IDS.PK_T0_FRAC,
    linkedSkillLabel: "PK · Operasi Pecahan, Rasio & Tanda Negatif",
  },
  {
    id: "powers_roots",
    belt: 1,
    label: "Pangkat & Akar Dasar",
    subtitle: "Basis sama pangkat ditambah, pangkat negatif & akar kuadrat.",
    examplePreview: "$2^3 \\times 2^4 = 2^?$",
    studyTip: "Kali basis sama = pangkat DIJUMLAHKAN, bukan dikali.",
    cheatSheetRules: [
      { rule: "Kali basis sama -> jumlahkan pangkat", example: "$a^m \\times a^n = a^{m+n}$" },
      { rule: "Bagi basis sama -> kurangkan pangkat", example: "$\\dfrac{a^m}{a^n} = a^{m-n}$" },
      { rule: "Akar tidak bisa digabung saat tambah", example: "$\\sqrt{9} + \\sqrt{16} = 3 + 4 = 7$" },
    ],
    linkedSkillNodeId: NODE_IDS.PK_T1_EXP,
    linkedSkillLabel: "PK · Eksponen, Bentuk Akar & Logaritma",
  },
  {
    id: "algebra_shift",
    belt: 2,
    label: "Aljabar Pindah Ruas & Kurung",
    subtitle: "Mencari nilai $x$, distributif $a(x - b)$, dan variabel di dua sisi.",
    examplePreview: "$3(x - 2) = 12$",
    studyTip: "Setiap menyeberangi tanda '=', tanda (+) jadi (-) dan (×) jadi (÷).",
    cheatSheetRules: [
      { rule: "Pindah ruas membalik tanda", example: "$2x + 5 = 11 \\implies 2x = 11 - 5$" },
      { rule: "Buka kurung harus adil ke semua isi", example: "$a(x - b) = ax - ab$" },
      { rule: "Huruf di dua sisi -> kumpulkan ke satu sisi", example: "$5x - 2 = 2x + 7 \\implies 3x = 9$" },
    ],
    linkedSkillNodeId: NODE_IDS.PK_T0_ALG,
    linkedSkillLabel: "PK · Manipulasi Aljabar & Pindah Ruas",
  },
  {
    id: "percent_ratio",
    belt: 2,
    label: "Persen, Diskon Ganda & Rasio",
    subtitle: "Persentase cepat, membagi rasio total, dan diskon bertingkat.",
    examplePreview: "Diskon $20\\%$ lalu $10\\%$",
    studyTip: "Diskon beruntun tidak dijumlah langsung; kalikan faktor bayarnya $(1 - d_1)(1 - d_2)$.",
    cheatSheetRules: [
      { rule: "Cari $p\\%$ dari bilangan", example: "$p\\% \\times N = \\dfrac{p \\times N}{100}$" },
      { rule: "Bagi rasio $A : B$ dari TOTAL", example: "$\\text{Bagian } A = \\dfrac{A}{A+B} \\times \\text{Total}$" },
      { rule: "Diskon ganda wajib dikali pengalinya", example: "Diskon $20\\%$ lalu $10\\% \\to 0{,}8 \\times 0{,}9 = 0{,}72$" },
    ],
    linkedSkillNodeId: NODE_IDS.PM_T1_PCT,
    linkedSkillLabel: "PM · Persentase Bertingkat, Diskon & Bunga",
  },
  {
    id: "geometry_basics",
    belt: 2,
    label: "Geometri Sudut, Segitiga & Luas",
    subtitle: "Sudut lurus $180^\\circ$, Pythagoras dasar, lingkaran & skala luas.",
    examplePreview: "Siku-siku sisi $6$ dan $8$ -> $c = ?$",
    studyTip: "Hafal tripel Pythagoras dasar ($3$-$4$-$5$, $5$-$12$-$13$) hemat waktu 40 detik.",
    cheatSheetRules: [
      { rule: "Sudut garis lurus $= 180^\\circ$, segitiga $= 180^\\circ$", example: "Sudut ketiga $= 180^\\circ - A - B$" },
      { rule: "Pythagoras segitiga siku-siku", example: "$c^2 = a^2 + b^2$ (sisi miring paling panjang)" },
      { rule: "Sisi diperbesar $k$ kali -> luas $k^2$ kali", example: "Sisi $\\times 3 \\implies$ Luas $\\times 9$" },
    ],
    linkedSkillNodeId: NODE_IDS.PK_T2_GEO,
    linkedSkillLabel: "PK · Geometri Sudut, Bangun Datar & Lingkaran",
  },
  {
    id: "stat_prob_basics",
    belt: 2,
    label: "Statistika & Peluang Dasar",
    subtitle: "Rata-rata ubah ke Total, Median urutkan dulu, Peluang & Kombinasi.",
    examplePreview: "Rata-rata $4$ anak $75$ -> Total $= 300$",
    studyTip: "Kunci rata-rata gabungan atau anak baru masuk: kalikan dulu rata-rata dengan jumlah orang!",
    cheatSheetRules: [
      { rule: "Ubah rata-rata jadi Total Nilai", example: "$\\text{Total} = \\text{Rata-rata} \\times n$" },
      { rule: "Median = nilai tengah setelah DIURUTKAN", example: "$[9, 3, 7] \\to [3, 7, 9] \\implies 7$" },
      { rule: "Peluang kejadian $A$", example: "$P(A) = \\dfrac{\\text{banyak cara } A}{\\text{total semua cara}}$" },
    ],
    linkedSkillNodeId: NODE_IDS.PK_T3_STAT,
    linkedSkillLabel: "PK · Statistika, Himpunan & Matriks 2x2",
  },
  {
    id: "word_translate",
    belt: 3,
    label: "Terjemah Soal Cerita -> Rumus",
    subtitle: "Ubah kalimat cerita sehari-hari jadi ekspresi aljabar atau hitungan konversi.",
    examplePreview: "\"$3$ tahun lebih tua dari $2u$\" -> $2u + 3$",
    studyTip: "Baca kalimat pertanyaan terakhir dulu, baru catat angka dan ubah satuan jadi seragam.",
    cheatSheetRules: [
      { rule: "Lebih tua/mahal/banyak -> (+), kurang/selisih -> (-)", example: "$3$ lebihnya dari $2u \\implies 2u + 3$" },
      { rule: "Menit ke jam -> bagi $60$", example: "$45\\text{ menit} = \\dfrac{45}{60}\\text{ jam}$" },
      { rule: "Biaya tetap dibayar $1\\times$, biaya/jam dikali $n$", example: "$\\text{Total} = \\text{Awal} + (\\text{Tarif} \\times n)$" },
    ],
    linkedSkillNodeId: NODE_IDS.PM_T0_UNIT,
    linkedSkillLabel: "PM · Konversi Satuan & Translasi Soal Cerita",
  },
  {
    id: "formula_selector",
    belt: 3,
    label: "Pemilih Rumus Soal Cerita (Anti Blank)",
    subtitle: "Latih refleks otak menjawab: \"Kalau ketemu cerita begini, rumus mana yang dipakai?\"",
    examplePreview: "Tambah pekerja makin cepat -> rumus mana?",
    studyTip: "Fokus temukan kata kunci hubungan sebab-akibat di cerita sebelum mulai menghitung.",
    cheatSheetRules: [
      { rule: "A naik tapi B makin kecil/cepat", example: "Berbalik Nilai: $P_1 \\cdot t_1 = P_2 \\cdot t_2$" },
      { rule: "Pilih tim acak vs pilih ketua & wakil", example: "Acak = Kombinasi $C(n,k)$, Jabatan = Permutasi" },
      { rule: "Persentase untung/rugi barang", example: "Selalu bandingkan ke Harga BELI (Modal Awal)" },
    ],
    linkedSkillNodeId: NODE_IDS.PM_T2_LIN,
    linkedSkillLabel: "PM · Optimasi Biaya Linear & Titik Impas",
  },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  MATH_GYM_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<MathGymCoreCategory, string>;

export function getCategoryMeta(cat: MathGymCoreCategory): MathGymCategoryMeta {
  return MATH_GYM_CATEGORIES.find((c) => c.id === cat) ?? MATH_GYM_CATEGORIES[0];
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)] ?? items[0];
}

function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const tmp = y;
    y = x % y;
    x = tmp;
  }
  return x || 1;
}

export function formatFractionLatex(num: number, den: number): string {
  if (den === 0) return "$0$";
  const sign = (num < 0) !== (den < 0) ? -1 : 1;
  const nAbs = Math.abs(num);
  const dAbs = Math.abs(den);
  const g = gcd(nAbs, dAbs);
  const rn = (nAbs / g) * sign;
  const rd = dAbs / g;
  if (rd === 1) return `$${rn}$`;
  if (rn < 0) return `$-\\dfrac{${Math.abs(rn)}}{${rd}}$`;
  return `$\\dfrac{${rn}}{${rd}}$`;
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

interface RawChoice {
  canonical: string;
  label: string;
  trapFeedback: string;
}

function buildFourUniqueOptions(
  rand: () => number,
  correct: { canonical: string; label: string },
  candidateWrongs: RawChoice[],
  fallbackBuilder: (offset: number) => RawChoice,
): { options: MathGymOption[]; correctKey: "A" | "B" | "C" | "D" } {
  const normLabel = (lbl: string) => lbl.replace(/\s+/g, "").toLowerCase();
  const usedCanonical = new Set<string>([correct.canonical]);
  const usedLabels = new Set<string>([normLabel(correct.label)]);
  const wrongs: RawChoice[] = [];

  for (const w of candidateWrongs) {
    if (wrongs.length >= 3) break;
    const lblKey = normLabel(w.label);
    if (!w.canonical || usedCanonical.has(w.canonical) || usedLabels.has(lblKey)) continue;
    usedCanonical.add(w.canonical);
    usedLabels.add(lblKey);
    wrongs.push(w);
  }

  let safetyOffset = 1;
  while (wrongs.length < 3 && safetyOffset < 60) {
    const fb = fallbackBuilder(safetyOffset);
    safetyOffset += 1;
    const lblKey = normLabel(fb.label);
    if (!usedCanonical.has(fb.canonical) && !usedLabels.has(lblKey)) {
      usedCanonical.add(fb.canonical);
      usedLabels.add(lblKey);
      wrongs.push(fb);
    }
  }

  const combined: Array<{ label: string; isCorrect: boolean; trapFeedback: string }> = [
    {
      label: correct.label,
      isCorrect: true,
      trapFeedback: "Langkah hitungmu sudah tepat!",
    },
    ...wrongs.slice(0, 3).map((w) => ({
      label: w.label,
      isCorrect: false,
      trapFeedback: w.trapFeedback,
    })),
  ];

  for (let i = combined.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = combined[i];
    combined[i] = combined[j];
    combined[j] = tmp;
  }

  const keys: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
  const options: MathGymOption[] = combined.map((c, idx) => ({
    key: keys[idx],
    labelLatexOrText: c.label,
    isCorrect: c.isCorrect,
    trapFeedback: c.trapFeedback,
  }));
  const correctKey = options.find((o) => o.isCorrect)?.key ?? "A";
  return { options, correctKey };
}

function genNegativeOrder(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  let promptMarkdown = "";
  let hintText = "";
  let ansVal = 0;
  let wrongs: RawChoice[] = [];
  let stepByStep: string[] = [];

  if (difficulty === "dasar") {
    const variant = randInt(rand, 0, 1);
    if (variant === 0) {
      const a = randInt(rand, 4, 15);
      const b = randInt(rand, 2, 11);
      ansVal = a + b;
      promptMarkdown = `Hitung nilai dari $${a} - (-${b})$`;
      hintText = "Tanda kurang bertemu bilangan negatif: $-(-b)$ berubah menjadi $+b$.";
      wrongs = [
        {
          canonical: String(a - b),
          label: `$${a - b}$`,
          trapFeedback: `Mengurangi angka negatif bukan dikurang biasa; $-(-${b})$ berubah menjadi $+${b}$.`,
        },
        {
          canonical: String(-(a + b)),
          label: `$${-(a + b)}$`,
          trapFeedback: "Kedua bilangan menjadi dijumlahkan dan bertanda positif.",
        },
        {
          canonical: String(b - a),
          label: `$${b - a}$`,
          trapFeedback: "Cek urutan penjumlahan dan tanda positifnya.",
        },
      ];
      stepByStep = [
        `Ubah dua tanda minus berdekatan menjadi tambah: $-(-${b}) = +${b}$.`,
        `Hitung hasil akhir: $${a} + ${b} = ${ansVal}$.`,
      ];
    } else {
      const a = randInt(rand, 5, 14);
      const b = randInt(rand, 2, 9);
      ansVal = -a - b;
      promptMarkdown = `Tentukan nilai dari $-${a} - ${b}$`;
      hintText = "Bayangkan punya utang a lalu tambah utang lagi b: angkanya dijumlahkan dan tandanya tetap minus.";
      wrongs = [
        {
          canonical: String(-(a - b)),
          label: `$${-(a - b)}$`,
          trapFeedback: "Jika kedua angka bertanda minus (-a - b), angkanya dijumlahkan, bukan dikurangkan.",
        },
        {
          canonical: String(a + b),
          label: `$${a + b}$`,
          trapFeedback: "Penjumlahan dua bilangan negatif hasilnya tetap negatif, bukan positif (itu hanya untuk perkalian).",
        },
        {
          canonical: String(a - b),
          label: `$${a - b}$`,
          trapFeedback: "Tanda minus di depan angka pertama tetap memengaruhi hasil akhir.",
        },
      ];
      stepByStep = [
        `Kedua angka sama-sama bergerak ke arah negatif: $-${a}$ lalu mundur lagi $${b}$.`,
        `Jumlahkan besarannya dengan tanda minus: $-(${a} + ${b}) = ${ansVal}$.`,
      ];
    }
  } else if (difficulty === "standar") {
    const variant = randInt(rand, 0, 1);
    if (variant === 0) {
      const a = randInt(rand, 4, 12);
      const b = randInt(rand, 2, 6);
      const c = randInt(rand, 2, 5);
      ansVal = a + b * c;
      promptMarkdown = `Hitung nilai dari $${a} - (-${b}) \\times ${c}$`;
      hintText = "Kerjakan perkalian $(-b) \\times c$ terlebih dahulu, lalu ingat tanda kurang ketemu minus menjadi tambah.";
      wrongs = [
        {
          canonical: String((a + b) * c),
          label: `$${(a + b) * c}$`,
          trapFeedback: `Kamu menghitung $${a} + ${b}$ duluan sebelum dikali $${c}$. Perkalian harus didahulukan.`,
        },
        {
          canonical: String(a - b * c),
          label: `$${a - b * c}$`,
          trapFeedback: "Hati-hati tanda minus! Mengurangi bilangan negatif sama dengan menjumlahkan ($-(-n) = +n$).",
        },
        {
          canonical: String(a - b + c),
          label: `$${a - b + c}$`,
          trapFeedback: `Perhatikan simbol kali $\\times ${c}$, bukan ditambah $${c}$.`,
        },
      ];
      stepByStep = [
        `Kalikan lebih dulu: $(-${b}) \\times ${c} = -${b * c}$.`,
        `Masukkan kembali ke soal: $${a} - (-${b * c})$.`,
        `Kurang ketemu minus menjadi tambah: $${a} + ${b * c} = ${ansVal}$.`,
      ];
    } else {
      const a = randInt(rand, 3, 7);
      const b = randInt(rand, 4, 12);
      ansVal = a * a - b;
      promptMarkdown = `Tentukan hasil dari $(-${a})^2 - ${b}$`;
      hintText = "Karena tanda minus ada DI DALAM kurung, $(-a)^2$ artinya $(-a) \\times (-a)$ yang hasilnya positif.";
      wrongs = [
        {
          canonical: String(-(a * a) - b),
          label: `$${-(a * a) - b}$`,
          trapFeedback: `$(-${a})^2$ itu $(-${a}) \\times (-${a}) = +${a * a}$, bukan $-${a * a}$.`,
        },
        {
          canonical: String(a * 2 - b),
          label: `$${a * 2 - b}$`,
          trapFeedback: `Pangkat dua artinya $${a} \\times ${a}$, bukan $${a} \\times 2$.`,
        },
        {
          canonical: String(a * a + b),
          label: `$${a * a + b}$`,
          trapFeedback: `Operasi akhirnya adalah dikurangi $${b}$, bukan ditambah.`,
        },
      ];
      stepByStep = [
        `Hitung kuadrat dalam kurung: $(-${a})^2 = (-${a}) \\times (-${a}) = ${a * a}$.`,
        `Kurangi dengan $${b}$: $${a * a} - ${b} = ${ansVal}$.`,
      ];
    }
  } else {
    // tantangan: -a * (b - c) + (-d)
    const a = randInt(rand, 2, 5);
    const b = randInt(rand, 2, 5);
    const c = b + randInt(rand, 3, 6); // b - c is negative
    const d = randInt(rand, 3, 9);
    const inner = b - c; // negative
    ansVal = -a * inner - d;
    promptMarkdown = `Hitung nilai dari $-${a}(${b} - ${c}) + (-${d})$`;
    hintText = "Hitung isi dalam kurung lebih dulu, lalu ingat minus dikali minus menghasilkan positif!";
    wrongs = [
      {
        canonical: String(a * inner - d),
        label: `$${a * inner - d}$`,
        trapFeedback: `Kamu lupa mengalikan tanda minus di depan angka $${a}$ dengan hasil kurung (${inner}).`,
      },
      {
        canonical: String(-a * inner + d),
        label: `$${-a * inner + d}$`,
        trapFeedback: `Di bagian belakang tertulis $+(-${d})$ yang berarti dikurang $${d}$, bukan ditambah.`,
      },
      {
        canonical: String(-a * b - c - d),
        label: `$${-a * b - c - d}$`,
        trapFeedback: `Kalau membuka kurung, $-${a}$ juga harus dikalikan dengan $-${c}$ menjadi $+${a * c}$.`,
      },
    ];
    stepByStep = [
      `Kerjakan isi kurung dulu: $${b} - ${c} = ${inner}$.`,
      `Kalikan dengan $-${a}$ (minus × minus = plus): $(-${a}) \\times (${inner}) = ${-a * inner}$.`,
      `Kurangi $${d}$: $${-a * inner} - ${d} = ${ansVal}$.`,
    ];
  }

  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(ansVal), label: `$${ansVal}$` },
    wrongs,
    (k) => ({
      canonical: String(ansVal + k * 2),
      label: `$${ansVal + k * 2}$`,
      trapFeedback: "Cek ulang urutan kurung, perkalian, dan tanda plus/minusnya.",
    }),
  );

  return {
    id,
    category: "negative_order",
    categoryLabel: CATEGORY_LABEL_MAP.negative_order,
    difficulty,
    promptMarkdown,
    hintText,
    options,
    correctKey,
    stepByStep,
  };
}

function genFractions(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  if (difficulty === "dasar") {
    const den = pick(rand, [3, 4, 5, 7, 8]);
    const n1 = randInt(rand, 1, den - 1);
    const n2 = randInt(rand, 1, den - 1);
    const ansNum = n1 + n2;
    const g = gcd(ansNum, den);
    const promptMarkdown = `Hitung jumlah pecahan berpenyebut sama: $\\dfrac{${n1}}{${den}} + \\dfrac{${n2}}{${den}}$`;
    const hintText = "Karena penyebut sudah sama, cukup jumlahkan pembilang (angka atas); penyebut (angka bawah) tetap!";
    const wrongs: RawChoice[] = [
      {
        canonical: `${ansNum}/${den * 2}`,
        label: formatFractionLatex(ansNum, den * 2),
        trapFeedback: `Penyebut TIDAK ikut dijumlahkan menjadi $${den + den}$! Penyebut tetap $${den}$.`,
      },
      {
        canonical: `${Math.abs(n1 - n2) || 1}/${den}`,
        label: formatFractionLatex(Math.abs(n1 - n2) || 1, den),
        trapFeedback: "Operasinya penjumlahan (+), bukan pengurangan (-).",
      },
      {
        canonical: `${ansNum + 1}/${den}`,
        label: formatFractionLatex(ansNum + 1, den),
        trapFeedback: "Jumlah pembilangnya selisih 1 angka.",
      },
    ];
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: `${ansNum / g}/${den / g}`, label: formatFractionLatex(ansNum, den) },
      wrongs,
      (k) => ({
        canonical: `${ansNum + k}/${den}`,
        label: formatFractionLatex(ansNum + k, den),
        trapFeedback: "Jumlahkan pembilangnya dan biarkan penyebut tetap sama.",
      }),
    );
    return {
      id,
      category: "fractions",
      categoryLabel: CATEGORY_LABEL_MAP.fractions,
      difficulty,
      promptMarkdown,
      hintText,
      options,
      correctKey,
      stepByStep: [
        `Penyebut sudah sama ($${den}$), jumlahkan pembilang: $${n1} + ${n2} = ${ansNum}$.`,
        `Tulis hasilnya: $\\dfrac{${ansNum}}{${den}}${g > 1 ? ` = ${formatFractionLatex(ansNum, den).replace(/\$/g, "")}` : ""}.`,
      ],
    };
  }

  if (difficulty === "tantangan") {
    // Mixed fraction + decimal -> common fraction
    const [decText, decNum, decDen] = pick(rand, [
      ["0{,}5", 1, 2],
      ["0{,}25", 1, 4],
      ["0{,}75", 3, 4],
      ["0{,}2", 1, 5],
    ]);
    const whole = pick(rand, [1, 2]);
    const fDen = pick(rand, [3, 4, 5].filter((d) => d !== decDen));
    const fNum = randInt(rand, 1, fDen - 1);
    const leftNum = whole * fDen + fNum;
    const ansNum = leftNum * decDen + decNum * fDen;
    const ansDen = fDen * decDen;
    const g = gcd(ansNum, ansDen);
    const promptMarkdown = `Hitung nilai dari $${whole}\\dfrac{${fNum}}{${fDen}} + ${decText}$ dalam bentuk pecahan sederhana`;
    const hintText = `Ubah pecahan campuran dan desimal (${decText}) ke pecahan biasa dulu sebelum disamakan penyebutnya.`;
    const wrongs: RawChoice[] = [
      {
        canonical: `${leftNum + decNum}/${fDen + decDen}`,
        label: formatFractionLatex(leftNum + decNum, fDen + decDen),
        trapFeedback: "Jangan langsung menambah pembilang dengan pembilang dan penyebut dengan penyebut!",
      },
      {
        canonical: `${ansNum - whole * fDen * decDen}/${ansDen}`,
        label: formatFractionLatex(Math.max(1, ansNum - whole * fDen * decDen), ansDen),
        trapFeedback: `Kamu lupa memasukkan bilangan bulat $${whole}$ saat mengubah pecahan campuran!`,
      },
      {
        canonical: `${ansNum + fDen}/${ansDen}`,
        label: formatFractionLatex(ansNum + fDen, ansDen),
        trapFeedback: "Cek ulang konversi desimal dan perkalian silang pembilangnya.",
      },
    ];
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: `${ansNum / g}/${ansDen / g}`, label: formatFractionLatex(ansNum, ansDen) },
      wrongs,
      (k) => ({
        canonical: `${ansNum + k}/${ansDen}`,
        label: formatFractionLatex(ansNum + k, ansDen),
        trapFeedback: "Ubah keduanya jadi pecahan biasa lalu samakan penyebutnya.",
      }),
    );
    return {
      id,
      category: "fractions",
      categoryLabel: CATEGORY_LABEL_MAP.fractions,
      difficulty,
      promptMarkdown,
      hintText,
      options,
      correctKey,
      stepByStep: [
        `Ubah ke pecahan biasa: $${whole}\\dfrac{${fNum}}{${fDen}} = \\dfrac{${leftNum}}{${fDen}}$ dan $${decText} = \\dfrac{${decNum}}{${decDen}}$.`,
        `Samakan penyebut ke $${ansDen}$: $\\dfrac{${leftNum * decDen}}{${ansDen}} + \\dfrac{${decNum * fDen}}{${ansDen}} = \\dfrac{${ansNum}}{${ansDen}}$.`,
        `Sederhanakan: ${formatFractionLatex(ansNum, ansDen)}.`,
      ],
    };
  }

  // standar: different denominators + or div
  const op = randInt(rand, 0, 1);
  const d1 = pick(rand, [2, 3, 4, 5]);
  const d2 = pick(rand, [3, 4, 5, 6].filter((d) => d !== d1));
  const n1 = randInt(rand, 1, d1 - 1);
  const n2 = randInt(rand, 1, d2 - 1);

  if (op === 0) {
    const ansNum = n1 * d2 + n2 * d1;
    const ansDen = d1 * d2;
    const g = gcd(ansNum, ansDen);
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: `${ansNum / g}/${ansDen / g}`, label: formatFractionLatex(ansNum, ansDen) },
      [
        {
          canonical: `${n1 + n2}/${d1 + d2}`,
          label: formatFractionLatex(n1 + n2, d1 + d2),
          trapFeedback: "Jangan langsung menambah pembilang dengan pembilang dan penyebut dengan penyebut!",
        },
        {
          canonical: `${n1 + n2}/${ansDen}`,
          label: formatFractionLatex(n1 + n2, ansDen),
          trapFeedback: "Penyebut sudah dikalikan, tapi pembilang belum ikut dikali silang.",
        },
        {
          canonical: `${Math.abs(n1 * d2 - n2 * d1) || 1}/${ansDen}`,
          label: formatFractionLatex(Math.abs(n1 * d2 - n2 * d1) || 1, ansDen),
          trapFeedback: "Operasinya penjumlahan (+), bukan pengurangan (-).",
        },
      ],
      (k) => ({
        canonical: `${ansNum / g + k}/${ansDen / g}`,
        label: formatFractionLatex(ansNum / g + k, ansDen / g),
        trapFeedback: "Periksa lagi perkalian silang pembilangnya.",
      }),
    );
    return {
      id,
      category: "fractions",
      categoryLabel: CATEGORY_LABEL_MAP.fractions,
      difficulty,
      promptMarkdown: `Hitung jumlah pecahan: $\\dfrac{${n1}}{${d1}} + \\dfrac{${n2}}{${d2}}$`,
      hintText: "Samakan penyebut lebih dulu dengan KPK atau kali silang penyebut.",
      options,
      correctKey,
      stepByStep: [
        `Samakan penyebut ke $${ansDen}$: $\\dfrac{${n1 * d2}}{${ansDen}} + \\dfrac{${n2 * d1}}{${ansDen}}$.`,
        `Jumlahkan pembilang dan sederhanakan: ${formatFractionLatex(ansNum, ansDen)}.`,
      ],
    };
  }

  const ansNum = n1 * d2;
  const ansDen = d1 * n2;
  const g = gcd(ansNum, ansDen);
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: `${ansNum / g}/${ansDen / g}`, label: formatFractionLatex(ansNum, ansDen) },
    [
      {
        canonical: `${n1 * n2}/${d1 * d2}`,
        label: formatFractionLatex(n1 * n2, d1 * d2),
        trapFeedback: "Kamu langsung mengalikan tanpa membalik pecahan kedua!",
      },
      {
        canonical: `${d1 * n2}/${n1 * d2}`,
        label: formatFractionLatex(d1 * n2, n1 * d2),
        trapFeedback: "Kamu terbalik membalik pecahan PERTAMA; yang dibalik harus pecahan KEDUA.",
      },
      {
        canonical: `${ansNum + d2}/${ansDen}`,
        label: formatFractionLatex(ansNum + d2, ansDen),
        trapFeedback: "Cek perkalian lurus setelah pecahan kedua dibalik.",
      },
    ],
    (k) => ({
      canonical: `${ansNum / g + k}/${ansDen / g}`,
      label: formatFractionLatex(ansNum / g + k, ansDen / g),
      trapFeedback: "Pastikan pecahan kedua dibalik sebelum dikali lurus.",
    }),
  );
  return {
    id,
    category: "fractions",
    categoryLabel: CATEGORY_LABEL_MAP.fractions,
    difficulty,
    promptMarkdown: `Hasil dari $\\dfrac{${n1}}{${d1}} \\div \\dfrac{${n2}}{${d2}}$ adalah $\\dots$`,
    hintText: "Membagi pecahan = MENGALI dengan kebalikan pecahan yang kedua.",
    options,
    correctKey,
    stepByStep: [
      `Balik pecahan kedua lalu kalikan: $\\dfrac{${n1}}{${d1}} \\times \\dfrac{${d2}}{${n2}}$.`,
      `Kalikan atas × atas dan bawah × bawah, lalu sederhanakan: ${formatFractionLatex(ansNum, ansDen)}.`,
    ],
  };
}

function genPowersRoots(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  const base = pick(rand, [2, 3, 5]);
  if (difficulty === "dasar") {
    const p = pick(rand, [3, 4, 5, 6, 7]);
    const q = pick(rand, [4, 5, 6, 8, 9].filter((x) => x !== p));
    const ansVal = p + q;
    const trapInside = Math.round(Math.sqrt(p * p + q * q));
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(ansVal), label: `$${ansVal}$` },
      [
        {
          canonical: String(trapInside),
          label: `$${trapInside}$`,
          trapFeedback: `Hati-hati! $\\sqrt{a} + \\sqrt{b}$ TIDAK sama dengan $\\sqrt{a + b}$.`,
        },
        {
          canonical: String(p * q),
          label: `$${p * q}$`,
          trapFeedback: "Operasi di tengah adalah tambah (+), bukan kali (×).",
        },
        {
          canonical: String(ansVal + 2),
          label: `$${ansVal + 2}$`,
          trapFeedback: "Periksa ulang nilai akar masing-masing bilangan kuadrat.",
        },
      ],
      (k) => ({
        canonical: String(ansVal + k),
        label: `$${ansVal + k}$`,
        trapFeedback: "Hitung masing-masing akar terlebih dahulu.",
      }),
    );
    return {
      id,
      category: "powers_roots",
      categoryLabel: CATEGORY_LABEL_MAP.powers_roots,
      difficulty,
      promptMarkdown: `Hitung nilai dari $\\sqrt{${p * p}} + \\sqrt{${q * q}}$`,
      hintText: "Cari nilai masing-masing akar lebih dulu, baru jumlahkan.",
      options,
      correctKey,
      stepByStep: [
        `Cari akar satu per satu: $\\sqrt{${p * p}} = ${p}$ dan $\\sqrt{${q * q}} = ${q}$.`,
        `Jumlahkan: $${p} + ${q} = ${ansVal}$.`,
      ],
    };
  }

  if (difficulty === "tantangan") {
    const k = randInt(rand, 2, 4);
    const m = randInt(rand, 1, 3);
    // (base^k)^2 * base^(-m)
    const ansExp = k * 2 - m;
    const ansStr = `${base}^{${ansExp}}`;
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: ansStr, label: `$${ansStr}$` },
      [
        {
          canonical: `${base}^{${k + 2 - m}}`,
          label: `$${base}^{${k + 2 - m}}$`,
          trapFeedback: `Bentuk kurung $(${base}^${k})^2$ berarti pangkatnya DIKALI ($${k}\\times 2 = ${k * 2}$), bukan ditambah.`,
        },
        {
          canonical: `${base}^{${k * 2 + m}}`,
          label: `$${base}^{${k * 2 + m}}$`,
          trapFeedback: `Pangkat negatif $-${m}$ mengurangi total pangkat, bukan menambah.`,
        },
        {
          canonical: `${base}^{${k * 2 * -m}}`,
          label: `$${base}^{${k * 2 * -m}}$`,
          trapFeedback: "Saat dikali basis sama ($a^p \\times a^q$), pangkat dijumlahkan ($p + q$), bukan dikali.",
        },
      ],
      (offset) => ({
        canonical: `${base}^{${ansExp + offset}}`,
        label: `$${base}^{${ansExp + offset}}$`,
        trapFeedback: "Selesaikan kurung $(a^k)^2$ dengan kali pangkat, lalu gabungkan pangkat negatifnya.",
      }),
    );
    return {
      id,
      category: "powers_roots",
      categoryLabel: CATEGORY_LABEL_MAP.powers_roots,
      difficulty,
      promptMarkdown: `Sederhanakan: $(${base}^{${k}})^2 \\times ${base}^{-${m}}$`,
      hintText: "Pangkat dalam kurung dipangkatkan lagi -> pangkat DIKALI. Lalu gabung basis sama -> pangkat DITAMBAH.",
      options,
      correctKey,
      stepByStep: [
        `Pangkat dipangkatkan = dikali: $(${base}^{${k}})^2 = ${base}^{${k * 2}}$.`,
        `Kali basis sama = tambah pangkat: $${base}^{${k * 2} + (-${m})} = ${ansStr}$.`,
      ],
    };
  }

  const m = randInt(rand, 2, 5);
  const n = randInt(rand, 2, 4);
  const p = randInt(rand, 1, 3);
  const ansExp = m + n - p;
  const ansStr = `${base}^{${ansExp}}`;
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: ansStr, label: `$${ansStr}$` },
    [
      {
        canonical: `${base}^{${m * n - p}}`,
        label: `$${base}^{${m * n - p}}$`,
        trapFeedback: "Saat dikali basis sama, pangkat DIJUMLAHKAN ($m + n$), bukan dikali ($m \\times n$)! ",
      },
      {
        canonical: `${base}^{${m + n + p}}`,
        label: `$${base}^{${m + n + p}}$`,
        trapFeedback: `Penyebut $${base}^{${p}}$ membagi, jadi pangkatnya dikurangi $${p}$.`,
      },
      {
        canonical: `${base * base}^{${ansExp}}`,
        label: `$${base * base}^{${ansExp}}$`,
        trapFeedback: `Angka basis ($${base}$) tetap utuh.`,
      },
    ],
    (k) => ({
      canonical: `${base}^{${ansExp + k}}`,
      label: `$${base}^{${ansExp + k}}$`,
      trapFeedback: "Cek lagi penjumlahan dan pengurangan pangkatnya.",
    }),
  );
  return {
    id,
    category: "powers_roots",
    categoryLabel: CATEGORY_LABEL_MAP.powers_roots,
    difficulty,
    promptMarkdown: `Sederhanakan bentuk pangkat: $\\dfrac{${base}^{${m}} \\times ${base}^{${n}}}{${base}^{${p}}}$`,
    hintText: "Basis sama: kali = tambah pangkat, bagi = kurang pangkat.",
    options,
    correctKey,
    stepByStep: [
      `Atas: $${base}^{${m} + ${n}} = ${base}^{${m + n}}$.`,
      `Dibagi bawah: $${base}^{${m + n} - ${p}} = ${ansStr}$.`,
    ],
  };
}

function genAlgebraShift(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  const xSol = pick(rand, [-4, -3, -2, 2, 3, 4, 5, 6, 7]);

  if (difficulty === "dasar") {
    const a = pick(rand, [2, 3, 4, 5]);
    const b = pick(rand, [3, 4, 5, 6, 8]);
    const c = xSol + b;
    const useMult = randInt(rand, 0, 1) === 1;
    if (useMult) {
      const rhs = a * xSol;
      const { options, correctKey } = buildFourUniqueOptions(
        rand,
        { canonical: String(xSol), label: `$${xSol}$` },
        [
          {
            canonical: String(rhs - a),
            label: `$${rhs - a}$`,
            trapFeedback: `Di $${a}x$, $${a}$ itu MENGALI $x$. Pindah ruasnya menjadi DIBAGI $${a}$, bukan dikurangi $${a}$!`,
          },
          {
            canonical: String(-xSol),
            label: `$${-xSol}$`,
            trapFeedback: "Perhatikan tanda positif/negatif saat membagi kedua sisi.",
          },
          {
            canonical: String(rhs + a),
            label: `$${rhs + a}$`,
            trapFeedback: `Untuk melepas angka $${a}$ di depan $x$, bagi kedua sisi dengan $${a}$.`,
          },
        ],
        (k) => ({
          canonical: String(xSol + k),
          label: `$${xSol + k}$`,
          trapFeedback: "Bagi sisi kanan dengan koefisien di depan $x$.",
        }),
      );
      return {
        id,
        category: "algebra_shift",
        categoryLabel: CATEGORY_LABEL_MAP.algebra_shift,
        difficulty,
        promptMarkdown: `Jika $${a}x = ${rhs}$, berapakah nilai $x$?`,
        hintText: `Bagi kedua sisi dengan angka di depan $x$ ($${a}$).`,
        options,
        correctKey,
        stepByStep: [
          `Untuk menyisakan $x$ sendirian, bagi kedua sisi dengan $${a}$: $x = \\dfrac{${rhs}}{${a}} = ${xSol}$.`,
        ],
      };
    }

    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(xSol), label: `$${xSol}$` },
      [
        {
          canonical: String(c + b),
          label: `$${c + b}$`,
          trapFeedback: `Saat $+${b}$ pindah ke sisi kanan, tandanya harus berbalik menjadi $-${b}$, bukan $+${b}$!`,
        },
        {
          canonical: String(-xSol),
          label: `$${-xSol}$`,
          trapFeedback: "Cek tanda hasil pengurangan sisi kanan.",
        },
        {
          canonical: String(b - c),
          label: `$${b - c}$`,
          trapFeedback: `Kurangi bilangan di sisi kanan ($${c}$) dengan $${b}$, bukan terbalik.`,
        },
      ],
      (k) => ({
        canonical: String(xSol + k),
        label: `$${xSol + k}$`,
        trapFeedback: "Pindahkan $+b$ menyeberangi '=' menjadi $-b$.",
      }),
    );
    return {
      id,
      category: "algebra_shift",
      categoryLabel: CATEGORY_LABEL_MAP.algebra_shift,
      difficulty,
      promptMarkdown: `Tentukan nilai $x$ dari persamaan $x + ${b} = ${c}$`,
      hintText: `Pindahkan $+${b}$ ke sisi kanan menjadi $-${b}$.`,
      options,
      correctKey,
      stepByStep: [
        `Pindah ruas $+${b}$ ke kanan jadi $-${b}$: $x = ${c} - ${b} = ${xSol}$.`,
      ],
    };
  }

  if (difficulty === "tantangan") {
    // a x + b = d x + e
    const a = pick(rand, [4, 5, 6]);
    const d = pick(rand, [2, 3]);
    const b = pick(rand, [2, 3, 5, 7]);
    const e = (a - d) * xSol + b;
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(xSol), label: `$${xSol}$` },
      [
        {
          canonical: String(Math.round((e + b) / (a - d))),
          label: `$${Math.round((e + b) / (a - d))}$`,
          trapFeedback: `Saat $+${b}$ pindah ke kanan, tandanya berbalik menjadi $-${b}$, bukan $+${b}$!`,
        },
        {
          canonical: String(Math.round((e - b) / (a + d))),
          label: `$${Math.round((e - b) / (a + d))}$`,
          trapFeedback: `Saat $${d}x$ pindah ke kiri, tandanya jadi $-${d}x$ (dikurangi, bukan ditambah $${a} + ${d}$).`,
        },
        {
          canonical: String(-xSol),
          label: `$${-xSol}$`,
          trapFeedback: "Perhatikan tanda positif/negatif saat memindahkan suku kanan dan kiri.",
        },
      ],
      (k) => ({
        canonical: String(xSol + k),
        label: `$${xSol + k}$`,
        trapFeedback: "Kumpulkan $x$ di kiri dan angka polos di kanan, lalu bagi koefisiennya.",
      }),
    );
    return {
      id,
      category: "algebra_shift",
      categoryLabel: CATEGORY_LABEL_MAP.algebra_shift,
      difficulty,
      promptMarkdown: `Tentukan nilai $x$ jika $${a}x + ${b} = ${d}x ${e >= 0 ? `+ ${e}` : `- ${Math.abs(e)}`}$`,
      hintText: "Kumpulkan suku ber-x di sebelah kiri dan angka polos di sebelah kanan (jangan lupa balik tanda tiap pindah ruas).",
      options,
      correctKey,
      stepByStep: [
        `Pindah $${d}x$ ke kiri jadi $-${d}x$, pindah $+${b}$ ke kanan jadi $-${b}$: $${a}x - ${d}x = ${e} - ${b}$.`,
        `Sederhanakan: $${a - d}x = ${e - b} \\implies x = \\dfrac{${e - b}}{${a - d}} = ${xSol}$.`,
      ],
    };
  }

  // standar
  const a = pick(rand, [2, 3, 4]);
  const b = pick(rand, [1, 2, 3, 4]);
  const c = a * (xSol - b);
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(xSol), label: `$${xSol}$` },
    [
      {
        canonical: String(Math.round((c + b) / a)),
        label: `$${Math.round((c + b) / a)}$`,
        trapFeedback: `Kalau membuka kurung, $${a}$ wajib dikali ke keduanya: $${a}x - ${a * b}$, bukan $${a}x - ${b}$!`,
      },
      {
        canonical: String(Math.round(c / a - b)),
        label: `$${Math.round(c / a - b)}$`,
        trapFeedback: `Setelah mendapat $x - ${b} = ${c / a}$, pindah ruas $-${b}$ jadi $+${b}$.`,
      },
      {
        canonical: String(-xSol),
        label: `$${-xSol}$`,
        trapFeedback: "Cek tanda negatif ketika memindah ruas suku konstanta.",
      },
    ],
    (k) => ({
      canonical: String(xSol + k),
      label: `$${xSol + k}$`,
      trapFeedback: "Bagi kedua sisi dengan angka depan kurung dulu biar simpel.",
    }),
  );
  return {
    id,
    category: "algebra_shift",
    categoryLabel: CATEGORY_LABEL_MAP.algebra_shift,
    difficulty,
    promptMarkdown: `Jika $${a}(x - ${b}) = ${c}$, berapakah nilai $x$?`,
    hintText: `Bagi langsung kedua sisi dengan $${a}$ sebelum memindahkan $-${b}$.`,
    options,
    correctKey,
    stepByStep: [
      `Bagi kedua sisi dengan $${a}$: $x - ${b} = \\dfrac{${c}}{${a}} = ${c / a}$.`,
      `Pindah $-${b}$ ke kanan jadi $+${b}$: $x = ${c / a} + ${b} = ${xSol}$.`,
    ],
  };
}

function genPercentRatio(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  if (difficulty === "dasar") {
    const pct = pick(rand, [10, 15, 20, 25, 30, 40]);
    const base = pick(rand, [80, 120, 160, 200, 240, 300, 400]);
    const ansVal = (pct * base) / 100;
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(ansVal), label: `$${ansVal}$` },
      [
        {
          canonical: String(base - ansVal),
          label: `$${base - ansVal}$`,
          trapFeedback: "Itu sisanya, sedangkan soal menanyakan besar bagian persennya saja.",
        },
        {
          canonical: String(ansVal * 10),
          label: `$${ansVal * 10}$`,
          trapFeedback: "Kelebihan nol satu digit saat membagi dengan $100$.",
        },
        {
          canonical: String(pct + base),
          label: `$${pct + base}$`,
          trapFeedback: "Persen dikalikan per seratus, bukan dijumlahkan dengan bilangan asal.",
        },
      ],
      (k) => ({
        canonical: String(ansVal + k * 5),
        label: `$${ansVal + k * 5}$`,
        trapFeedback: "Hitung (persen / 100) × nilai awal.",
      }),
    );
    return {
      id,
      category: "percent_ratio",
      categoryLabel: CATEGORY_LABEL_MAP.percent_ratio,
      difficulty,
      promptMarkdown: `Berapakah $${pct}\\%$ dari $${base}$?`,
      hintText: "Cari $10\\%$ terlebih dahulu (cukup bagi $10$), lalu skalakan ke persen soal.",
      options,
      correctKey,
      stepByStep: [
        `Ubah persen jadi pecahan: $${pct}\\% = \\dfrac{${pct}}{100}$.`,
        `Kalikan dengan $${base}$: $\\dfrac{${pct} \\times ${base}}{100} = ${ansVal}$.`,
      ],
    };
  }

  if (difficulty === "tantangan") {
    // Chained discount -> final price
    const d1 = pick(rand, [20, 25]);
    const d2 = pick(rand, [10, 20]);
    const price = pick(rand, [100000, 200000, 400000]);
    const afterD1 = (price * (100 - d1)) / 100;
    const finalPrice = (afterD1 * (100 - d2)) / 100;
    const naiveSum = (price * (100 - (d1 + d2))) / 100;
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(finalPrice), label: formatRupiah(finalPrice) },
      [
        {
          canonical: String(naiveSum),
          label: formatRupiah(naiveSum),
          trapFeedback: `Diskon ganda $${d1}\\% + ${d2}\\%$ BUKAN langsung $${d1 + d2}\\%$! Diskon kedua memotong dari harga yang SUDAH didiskon.`,
        },
        {
          canonical: String(afterD1),
          label: formatRupiah(afterD1),
          trapFeedback: `Kamu baru menghitung diskon pertama ($${d1}\\%$), lupa memotong diskon tambahan $${d2}\\%$.`,
        },
        {
          canonical: String(price - finalPrice),
          label: formatRupiah(price - finalPrice),
          trapFeedback: "Itu total nominal potongan diskonnya, bukan harga akhir yang harus dibayar.",
        },
      ],
      (k) => ({
        canonical: String(finalPrice + k * 4000),
        label: formatRupiah(finalPrice + k * 4000),
        trapFeedback: "Hitung diskon tahap 1 dulu, lalu diskon tahap 2 dari hasilnya.",
      }),
    );
    return {
      id,
      category: "percent_ratio",
      categoryLabel: CATEGORY_LABEL_MAP.percent_ratio,
      difficulty,
      promptMarkdown: `Harga jaket **${formatRupiah(price)}** mendapat **diskon $${d1}\\%$**, lalu ditambah **diskon ekstra $${d2}\\%$**. Berapa harga bayar akhirnya?`,
      hintText: "Jangan jumlahkan diskonnya langsung! Hitung harga setelah diskon ke-1 dulu, baru potong diskon ke-2.",
      options,
      correctKey,
      stepByStep: [
        `Setelah diskon $${d1}\\%$: $(100\\% - ${d1}\\%) \\times ${formatRupiah(price)} = ${formatRupiah(afterD1)}$.`,
        `Setelah diskon ekstra $${d2}\\%$: $(100\\% - ${d2}\\%) \\times ${formatRupiah(afterD1)} = ${formatRupiah(finalPrice)}$.`,
      ],
    };
  }

  // standar: ratio or single discount
  const rA = pick(rand, [2, 3, 4]);
  const rB = pick(rand, [3, 5, 7].filter((x) => x !== rA));
  const mult = pick(rand, [4, 5, 6, 8, 10]);
  const total = (rA + rB) * mult;
  const ansVal = rA * mult;
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(ansVal), label: `$${ansVal}$` },
    [
      {
        canonical: String(rB * mult),
        label: `$${rB * mult}$`,
        trapFeedback: `Itu milik Budi! Yang ditanya adalah kelereng Andi (angka rasio ${rA}).`,
      },
      {
        canonical: String(Math.round((rA / rB) * total)),
        label: `$${Math.round((rA / rB) * total)}$`,
        trapFeedback: "Penyebut harus jumlah rasio ($r_A + r_B$), bukan $r_B$ saja.",
      },
      {
        canonical: String(total - rA),
        label: `$${total - rA}$`,
        trapFeedback: "Perbandingan adalah rasio pengali, bukan dikurangi langsung.",
      },
    ],
    (k) => ({
      canonical: String(ansVal + k * 4),
      label: `$${ansVal + k * 4}$`,
      trapFeedback: "Jumlahkan angka rasio untuk mencari nilai 1 bagian.",
    }),
  );
  return {
    id,
    category: "percent_ratio",
    categoryLabel: CATEGORY_LABEL_MAP.percent_ratio,
    difficulty,
    promptMarkdown: `Perbandingan kelereng Andi dan Budi adalah $${rA} : ${rB}$. Jika total kelereng mereka **$${total}$ butir**, berapa kelereng Andi?`,
    hintText: "Karena yang diketahui TOTAL, jumlahkan kedua angka perbandingan sebagai penyebut!",
    options,
    correctKey,
    stepByStep: [
      `Jumlah bagian rasio $= ${rA} + ${rB} = ${rA + rB}$ bagian.`,
      `Nilai $1$ bagian $= ${total} \\div ${rA + rB} = ${mult}$, jadi Andi $= ${rA} \\times ${mult} = ${ansVal}$ butir.`,
    ],
  };
}

function genGeometryBasics(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  if (difficulty === "dasar") {
    const a1 = pick(rand, [40, 50, 65, 70, 80]);
    const a2 = pick(rand, [35, 45, 55, 60]);
    const ans = 180 - a1 - a2;
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(ans), label: `$${ans}^\\circ$` },
      [
        {
          canonical: String(90 - Math.min(80, a1)),
          label: `$${90 - Math.min(80, a1)}^\\circ$`,
          trapFeedback: "Total sudut segitiga itu $180^\\circ$, bukan $90^\\circ$!",
        },
        {
          canonical: String(360 - a1 - a2),
          label: `$${360 - a1 - a2}^\\circ$`,
          trapFeedback: "$360^\\circ$ itu jumlah sudut SEGI EMPAT atau lingkaran penuh; segitiga jumlahnya $180^\\circ$.",
        },
        {
          canonical: String(a1 + a2),
          label: `$${a1 + a2}^\\circ$`,
          trapFeedback: "Itu baru jumlah dua sudut yang diketahui; harus dikurangkan dari $180^\\circ$.",
        },
      ],
      (k) => ({
        canonical: String(ans + k * 5),
        label: `$${ans + k * 5}^\\circ$`,
        trapFeedback: "Jumlah ketiga sudut segitiga selalu $180^\\circ$.",
      }),
    );
    return {
      id,
      category: "geometry_basics",
      categoryLabel: CATEGORY_LABEL_MAP.geometry_basics,
      difficulty,
      promptMarkdown: `Sebuah segitiga memiliki dua sudut sebesar $${a1}^\\circ$ dan $${a2}^\\circ$. Berapa besar sudut ketiganya?`,
      hintText: "Jumlah semua sudut dalam segitiga apa pun selalu tepat $180^\\circ$.",
      options,
      correctKey,
      stepByStep: [
        `Jumlahkan dua sudut yang diketahui: $${a1}^\\circ + ${a2}^\\circ = ${a1 + a2}^\\circ$.`,
        `Kurangkan dari $180^\\circ$: $180^\\circ - ${a1 + a2}^\\circ = ${ans}^\\circ$.`,
      ],
    };
  }

  if (difficulty === "tantangan") {
    const scale = pick(rand, [2, 3, 4]);
    const ansMult = scale * scale;
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(ansMult), label: `$${ansMult}$ kali semula` },
      [
        {
          canonical: String(scale),
          label: `$${scale}$ kali semula`,
          trapFeedback: `Yang menjadi $${scale}$ kali itu baru PANJANG SISINYA (kelilingnya). Luas itu sisi × sisi = $${scale} \\times ${scale}$ kali!`,
        },
        {
          canonical: String(scale * 2),
          label: `$${scale * 2}$ kali semula`,
          trapFeedback: `Pangkat dua artinya $${scale} \\times ${scale} = ${ansMult}$, bukan $${scale} \\times 2$!`,
        },
        {
          canonical: String(scale + 2),
          label: `$${scale + 2}$ kali semula`,
          trapFeedback: "Perbesaran luas mengikuti kuadrat faktor skalanya ($k^2$).",
        },
      ],
      (k) => ({
        canonical: String(ansMult + k * 3),
        label: `$${ansMult + k * 3}$ kali semula`,
        trapFeedback: "Luas = p × l, jadi keduanya dikali $k$ -> $k^2$.",
      }),
    );
    return {
      id,
      category: "geometry_basics",
      categoryLabel: CATEGORY_LABEL_MAP.geometry_basics,
      difficulty,
      promptMarkdown: `Jika semua sisi sebuah persegi panjang diperbesar menjadi **$${scale}$ kali lipat** panjang awalnya, maka **luasnya** menjadi berapa kali semula?`,
      hintText: "Luas = panjang × lebar. Jika panjang dikali k DAN lebar ikut dikali k, berapa faktor pengali luasnya?",
      options,
      correctKey,
      stepByStep: [
        `Luas baru $= (${scale} \\times p) \\times (${scale} \\times l) = (${scale} \\times ${scale}) \\times (p \\times l)$.`,
        `Faktor pengali luas $= ${scale}^2 = ${ansMult}$ kali semula.`,
      ],
    };
  }

  // standar: Pythagoras triple
  const triples: Array<[number, number, number]> = [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [8, 15, 17],
    [9, 12, 15],
  ];
  const [a, b, c] = pick(rand, triples);
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(c), label: `$${c}$ cm` },
    [
      {
        canonical: String(a + b),
        label: `$${a + b}$ cm`,
        trapFeedback: "Sisi miring segitiga siku-siku TIDAK boleh langsung menjumlahkan $a + b$! Pakai $\\sqrt{a^2 + b^2}$.",
      },
      {
        canonical: String(b - a),
        label: `$${b - a}$ cm`,
        trapFeedback: "Sisi miring harus LEBIH PANJANG daripada kedua sisi penyikunya.",
      },
      {
        canonical: String(c + 2),
        label: `$${c + 2}$ cm`,
        trapFeedback: "Cek kembali nilai akar dari $a^2 + b^2$.",
      },
    ],
    (k) => ({
      canonical: String(c + k),
      label: `$${c + k}$ cm`,
      trapFeedback: "Gunakan $c = \\sqrt{a^2 + b^2}$.",
    }),
  );
  return {
    id,
    category: "geometry_basics",
    categoryLabel: CATEGORY_LABEL_MAP.geometry_basics,
    difficulty,
    promptMarkdown: `Sebuah tangga bersandar membentuk segitiga siku-siku dengan sisi tegak **$${a}$ cm** dan alas **$${b}$ cm**. Berapa panjang sisi miringnya?`,
    hintText: "Gunakan rumus Pythagoras: sisi miring kuadrat $= a^2 + b^2$.",
    options,
    correctKey,
    stepByStep: [
      `Kuadratkan kedua sisi siku: $${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}$.`,
      `Tarik akarnya: $c = \\sqrt{${c * c}} = ${c}$ cm.`,
    ],
  };
}

function genStatProbBasics(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  if (difficulty === "dasar") {
    // Unsorted median trap!
    const sorted = [
      randInt(rand, 3, 5),
      randInt(rand, 6, 8),
      randInt(rand, 9, 11),
      randInt(rand, 12, 14),
      randInt(rand, 15, 18),
    ];
    const medianVal = sorted[2];
    const shuffled = [sorted[4], sorted[0], sorted[3], sorted[1], sorted[2]];
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(medianVal), label: `$${medianVal}$` },
      [
        {
          canonical: String(shuffled[2]),
          label: `$${shuffled[2]}$`,
          trapFeedback: `Kamu langsung ambil angka paling tengah (${shuffled[2]}) TANPA mengurutkan data dari kecil ke besar dulu!`,
        },
        {
          canonical: String(sorted[1]),
          label: `$${sorted[1]}$`,
          trapFeedback: "Itu urutan ke-2, sedangkan untuk 5 data, posisi tengah setelah urut adalah urutan ke-3.",
        },
        {
          canonical: String(sorted[3]),
          label: `$${sorted[3]}$`,
          trapFeedback: "Itu urutan ke-4 setelah diurutkan.",
        },
      ],
      (k) => ({
        canonical: String(medianVal + k),
        label: `$${medianVal + k}$`,
        trapFeedback: "Urutkan data dari terkecil dulu lalu ambil nilai ke-3.",
      }),
    );
    return {
      id,
      category: "stat_prob_basics",
      categoryLabel: CATEGORY_LABEL_MAP.stat_prob_basics,
      difficulty,
      promptMarkdown: `Tentukan **median** (nilai tengah) dari data berikut: **$${shuffled.join(",\\; ")}$**`,
      hintText: "AWAS JEBAKAN! Urutkan angkanya dari paling KECIL ke BESAR terlebih dahulu baru cari yang tengah.",
      options,
      correctKey,
      stepByStep: [
        `Urutkan data dari terkecil: $${sorted.join(",\\; ")}$.`,
        `Ambil angka tepat di tengah (data ke-3 dari 5 data): $${medianVal}$.`,
      ],
    };
  }

  if (difficulty === "tantangan") {
    // Combination C(n, 2) vs Permutation
    const n = pick(rand, [5, 6, 7, 8]);
    const ans = (n * (n - 1)) / 2;
    const perm = n * (n - 1);
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(ans), label: `$${ans}$ cara` },
      [
        {
          canonical: String(perm),
          label: `$${perm}$ cara`,
          trapFeedback: "Memilih A & B sama saja dengan memilih B & A (tanpa jabatan). Jadi harus dibagi $2! = 2$ (Kombinasi).",
        },
        {
          canonical: String(n * 2),
          label: `$${n * 2}$ cara`,
          trapFeedback: "Rumus memilih 2 dari n adalah $n(n-1)/2$, bukan $n \\times 2$.",
        },
        {
          canonical: String(n - 2),
          label: `$${n - 2}$ cara`,
          trapFeedback: "Hitung kombinasi $\\dfrac{n(n-1)}{2}$.",
        },
      ],
      (k) => ({
        canonical: String(ans + k * 2),
        label: `$${ans + k * 2}$ cara`,
        trapFeedback: "Gunakan kombinasi $C(n, 2) = n(n-1)/2$.",
      }),
    );
    return {
      id,
      category: "stat_prob_basics",
      categoryLabel: CATEGORY_LABEL_MAP.stat_prob_basics,
      difficulty,
      promptMarkdown: `Dari **$${n}$ siswa**, akan dipilih **2 orang anggota tim kebersihan** tanpa membedakan jabatan. Ada berapa banyak pasangan berbeda yang bisa dipilih?`,
      hintText: "Urutan tidak penting (Budi-Ani sama saja dengan Ani-Budi), jadi gunakan Kombinasi $C(n, 2)$.",
      options,
      correctKey,
      stepByStep: [
        `Karena urutan tidak diperhatikan, gunakan Kombinasi: $C(${n}, 2) = \\dfrac{${n} \\times ${n - 1}}{2}$.`,
        `Hitung hasil: $\\dfrac{${perm}}{2} = ${ans}$ cara.`,
      ],
    };
  }

  // standar: average with 1 new member joining
  const count = pick(rand, [4, 5, 6]);
  const oldAvg = pick(rand, [72, 74, 76, 80]);
  const deltaAvg = pick(rand, [2, 3, 4]);
  const newAvg = oldAvg + deltaAvg;
  const oldTotal = count * oldAvg;
  const newTotal = (count + 1) * newAvg;
  const newScore = newTotal - oldTotal;
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(newScore), label: `$${newScore}$` },
    [
      {
        canonical: String(oldAvg + deltaAvg * 2),
        label: `$${oldAvg + deltaAvg * 2}$`,
        trapFeedback: "Anak baru harus mengangkat nilai rata-rata SEMUA anggota sebelumnya; wajib ubah ke Total Nilai!",
      },
      {
        canonical: String(newAvg),
        label: `$${newAvg}$`,
        trapFeedback: `${newAvg} adalah rata-rata barunya, bukan nilai anak yang baru masuk.`,
      },
      {
        canonical: String(newScore - count),
        label: `$${newScore - count}$`,
        trapFeedback: "Cek lagi perkalian $(n+1) \\times \\text{rata-rata baru}$ lalu kurangi total lama.",
      },
    ],
    (k) => ({
      canonical: String(newScore + k * 3),
      label: `$${newScore + k * 3}$`,
      trapFeedback: "Nilai anak baru = Total nilai baru - Total nilai lama.",
    }),
  );
  return {
    id,
    category: "stat_prob_basics",
    categoryLabel: CATEGORY_LABEL_MAP.stat_prob_basics,
    difficulty,
    promptMarkdown: `Rata-rata nilai ulangan **$${count}$ siswa** adalah **$${oldAvg}$**. Setelah **1 siswa susulan** ikut ujian, rata-ratanya naik menjadi **$${newAvg}$**. Berapa nilai siswa susulan itu?`,
    hintText: "Ubah setiap rata-rata menjadi TOTAL NILAI dulu: Total = Rata-rata × Banyak Siswa.",
    options,
    correctKey,
    stepByStep: [
      `Total nilai awal ($${count}$ anak) $= ${count} \\times ${oldAvg} = ${oldTotal}$.`,
      `Total nilai baru ($${count + 1}$ anak) $= ${count + 1} \\times ${newAvg} = ${newTotal}$.`,
      `Nilai siswa susulan $= ${newTotal} - ${oldTotal} = ${newScore}$.`,
    ],
  };
}

function genWordTranslate(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  if (difficulty === "dasar") {
    const m = pick(rand, [2, 3, 4]);
    const k = pick(rand, [3, 4, 5, 7]);
    const correctExpr = `${m}u + ${k}`;
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: correctExpr, label: `$${correctExpr}$` },
      [
        {
          canonical: `${m}u - ${k}`,
          label: `$${m}u - ${k}$`,
          trapFeedback: "Kata 'lebih tua' berarti lebih besar (+), bukan dikurang (-).",
        },
        {
          canonical: `${m}(u + ${k})`,
          label: `$${m}(u + ${k})$`,
          trapFeedback: "Yang dikali $m$ hanya umur Adik ($u$), lalu baru ditambah $k$, bukan $(u + k)$ yang dikali $m$.",
        },
        {
          canonical: `${k}u + ${m}`,
          label: `$${k}u + ${m}$`,
          trapFeedback: `Angka pengali umur adalah $${m}$, sedangkan selisih tambahnya $${k}$ (jangan tertukar!).`,
        },
      ],
      (offset) => ({
        canonical: `${m}u + ${k + offset}`,
        label: `$${m}u + ${k + offset}$`,
        trapFeedback: "Baca ulang angka pengali dan angka selisihnya di soal.",
      }),
    );
    return {
      id,
      category: "word_translate",
      categoryLabel: CATEGORY_LABEL_MAP.word_translate,
      difficulty,
      promptMarkdown: `Terjemahkan kalimat ini ke bentuk aljabar:\n\n*"Umur Kakak adalah **$${k}$ tahun lebih tua** dari **$${m}$ kali** umur Adik ($u$)."*`,
      hintText: "'lebih tua k tahun' artinya DITAMBAH k (+k). '$m$ kali umur Adik' artinya $mu$.",
      options,
      correctKey,
      stepByStep: [
        `Frasa "$${m}$ kali umur Adik ($u$)" ditulis: $${m}u$.`,
        `Frasa "$${k}$ tahun lebih tua" berarti ditambah $${k}$: $${m}u + ${k}$.`,
      ],
    };
  }

  if (difficulty === "tantangan") {
    // Tank remaining volume / debit + unit conversion
    const cap = pick(rand, [180, 240, 300]);
    const initFill = pick(rand, [40, 60, 80]);
    const rem = cap - initFill;
    const debit = rem % 20 === 0 ? 20 : 10;
    const mins = rem / debit;
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(mins), label: `$${mins}$ menit` },
      [
        {
          canonical: String(Math.round(cap / debit)),
          label: `$${Math.round(cap / debit)}$ menit`,
          trapFeedback: `Tangki SUDAH terisi $${initFill}$ liter! Jadi yang perlu diisi tinggal sisanya (${cap} - ${initFill} = ${rem} liter).`,
        },
        {
          canonical: String(Math.round(initFill / debit)),
          label: `$${Math.round(initFill / debit)}$ menit`,
          trapFeedback: `${initFill} liter adalah isi awal, bukan sisa volume kosong yang perlu diisi.`,
        },
        {
          canonical: String(mins + 5),
          label: `$${mins + 5}$ menit`,
          trapFeedback: "Bagi sisa volume dengan kecepatan debit pompa.",
        },
      ],
      (k) => ({
        canonical: String(mins + k * 2),
        label: `$${mins + k * 2}$ menit`,
        trapFeedback: "Kurangi kapasitas maksimal dengan isi awal, lalu bagi dengan debit.",
      }),
    );
    return {
      id,
      category: "word_translate",
      categoryLabel: CATEGORY_LABEL_MAP.word_translate,
      difficulty,
      promptMarkdown: `Sebuah bak berkapasitas **$${cap}$ liter** sudah terisi air **$${initFill}$ liter**. Jika keran dibuka dengan debit **$${debit}$ liter/menit**, berapa menit lagi bak akan penuh?`,
      hintText: "Cari SISA ruang kosong di bak terlebih dahulu sebelum dibagi debit air.",
      options,
      correctKey,
      stepByStep: [
        `Sisa air yang perlu ditambahkan $= ${cap} - ${initFill} = ${rem}$ liter.`,
        `Waktu pengisian $= \\dfrac{${rem}}{${debit}} = ${mins}$ menit.`,
      ],
    };
  }

  // standar
  const speed = pick(rand, [40, 60, 80]);
  const mins = pick(rand, [30, 45, 90]);
  const dist = (speed * mins) / 60;
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(dist), label: `$${dist}$ km` },
    [
      {
        canonical: String(speed * mins),
        label: `$${speed * mins}$ km`,
        trapFeedback: `Kamu langsung mengalikan $${speed} \\times ${mins}$ tanpa mengubah menit ke jam!`,
      },
      {
        canonical: String(Math.round((speed * 60) / mins)),
        label: `$${Math.round((speed * 60) / mins)}$ km`,
        trapFeedback: "Terbalik membagi konversi waktunya: waktu dalam jam = menit ÷ $60$.",
      },
      {
        canonical: String(dist + 10),
        label: `$${dist + 10}$ km`,
        trapFeedback: "Cek lagi hasil perkalian kecepatan dengan pecahan jamnya.",
      },
    ],
    (k) => ({
      canonical: String(dist + k * 5),
      label: `$${dist + k * 5}$ km`,
      trapFeedback: "Ubah menit ke jam (menit/60) lalu kalikan kecepatan.",
    }),
  );
  return {
    id,
    category: "word_translate",
    categoryLabel: CATEGORY_LABEL_MAP.word_translate,
    difficulty,
    promptMarkdown: `Motor melaju dengan kecepatan konstan **$${speed}$ km/jam** selama **$${mins}$ menit**. Berapa km jarak yang ditempuh?`,
    hintText: "Satuan kecepatan memakai JAM, sedangkan waktu masih MENIT. Ubah menit ke jam dulu (bagi $60$).",
    options,
    correctKey,
    stepByStep: [
      `Ubah menit ke jam: $${mins}\\text{ menit} = \\dfrac{${mins}}{60}\\text{ jam}$.`,
      `Hitung jarak: $s = v \\times t = ${speed} \\times \\dfrac{${mins}}{60} = ${dist}$ km.`,
    ],
  };
}

function genFormulaSelector(
  rand: () => number,
  id: string,
  difficulty: MathGymDifficulty,
): MathGymQuestion {
  interface FormulaCardSpec {
    prompt: string;
    hint: string;
    correct: RawChoice;
    wrongs: RawChoice[];
    steps: string[];
  }

  const p1 = pick(rand, [6, 8, 10]);
  const t1 = pick(rand, [12, 15, 18]);
  const p2 = p1 + 4;
  const disc1 = pick(rand, [15, 20]);
  const disc2 = pick(rand, [10, 15]);
  const fixedCost = pick(rand, [15000, 20000]);
  const unitCost = pick(rand, [3000, 5000]);

  const pool: FormulaCardSpec[] = [
    {
      prompt: `*"$${p1}$ pekerja menyelesaikan proyek dalam $${t1}$ hari. Jika pekerja ditambah menjadi $${p2}$ orang, butuh berapa hari?"*\n\n**Rumus mana yang TEPAT dipakai?**`,
      hint: "Tanyakan: kalau jumlah pekerja makin BANYAK, apakah harinya makin BANYAK atau makin SEDIKIT?",
      correct: {
        canonical: "inverse",
        label: "Berbalik Nilai: $P_1 \\times t_1 = P_2 \\times t_2$",
        trapFeedback: "Tepat!",
      },
      wrongs: [
        {
          canonical: "direct",
          label: "Senilai (Kali Silang): $\\dfrac{P_1}{t_1} = \\dfrac{P_2}{t_2}$",
          trapFeedback: "Kalau pakai kali silang (senilai), makin banyak pekerja malah makin lama harinya! Itu terbalik dari logika proyek.",
        },
        {
          canonical: "sub",
          label: "Pengurangan biasa: $t_2 = t_1 - (P_2 - P_1)$",
          trapFeedback: "Jumlah pekerja dan hari bekerja lewat perkalian beban kerja, bukan selisih kurang langsung.",
        },
        {
          canonical: "avg",
          label: "Rata-rata pekerja: $t_2 = \\dfrac{P_1 + P_2}{2}$",
          trapFeedback: "Merata-ratakan jumlah pekerja tidak menghasilkan lama hari selesai.",
        },
      ],
      steps: [
        `Analisis arah: Pekerja bertambah -> waktu selesai BERKURANG = **Perbandingan Berbalik Nilai**.`,
        `Kalikan sejajar beban awal $=$ beban baru: $${p1} \\times ${t1} = ${p2} \\times t_2$.`,
      ],
    },
    {
      prompt: `*"Harga tas didiskon $${disc1}\\%$ lalu mendapat diskon tambahan $${disc2}\\%$. Berapa harga bayar akhirnya?"*\n\n**Cara hitung mana yang BENAR?**`,
      hint: "Diskon kedua dihitung dari harga yang SUDAH terpotong diskon pertama.",
      correct: {
        canonical: "mult",
        label: `Kalikan beruntun: $\\text{Harga} \\times (1 - 0{,}${disc1}) \\times (1 - 0{,}${disc2})$`,
        trapFeedback: "Tepat!",
      },
      wrongs: [
        {
          canonical: "sum_disc",
          label: `Langsung jumlahkan diskon: $\\text{Harga} \\times (1 - 0{,}${disc1 + disc2})$`,
          trapFeedback: `Jebakan klasik! Diskon beruntun $${disc1}\\% + ${disc2}\\%$ TIDAK sama dengan diskon langsung $${disc1 + disc2}\\%$.`,
        },
        {
          canonical: "add_pct",
          label: `Kalikan dengan faktor tambah: $(1 + 0{,}${disc1}) \\times (1 + 0{,}${disc2})$`,
          trapFeedback: "Diskon artinya harga TURUN (dikurangi dari 1), bukan bertambah.",
        },
        {
          canonical: "subtract_raw",
          label: `Kurangi langsung angka: $\\text{Harga} - ${disc1} - ${disc2}$`,
          trapFeedback: "Persen harus dikalikan ke harga barang, bukan dikurangkan nominal polos.",
        },
      ],
      steps: [
        `Ubah tiap diskon $p\\%$ menjadi faktor sisa bayar $(1 - p/100)$.`,
        `Kalikan beruntun dari kiri ke kanan: $(1 - 0{,}${disc1})(1 - 0{,}${disc2})$.`,
      ],
    },
    {
      prompt: `*"Tarif parkir menetapkan biaya masuk awal ${formatRupiah(fixedCost)} ditambah ${formatRupiah(unitCost)} tiap jam untuk $n$ jam."*\n\n**Model persamaan total biaya $B(n)$ yang BENAR adalah:**`,
      hint: "Mana biaya yang dibayar 1 kali saja, dan mana yang dikalikan $n$?",
      correct: {
        canonical: "linear",
        label: `$B(n) = ${fixedCost} + ${unitCost}n$`,
        trapFeedback: "Tepat!",
      },
      wrongs: [
        {
          canonical: "both_mult",
          label: `$B(n) = (${fixedCost} + ${unitCost})n$`,
          trapFeedback: "Biaya masuk awal cukup dibayar 1 kali saja, tidak ikut dikalikan jumlah jam $n$!",
        },
        {
          canonical: "no_var",
          label: `$B(n) = ${fixedCost}n + ${unitCost}$`,
          trapFeedback: "Terbalik! Biaya tetapnya bukan dikalikan $n$, melainkan tarif per jamnya yang dikalikan $n$.",
        },
        {
          canonical: "quad",
          label: `$B(n) = ${fixedCost} + ${unitCost}n^2$`,
          trapFeedback: "Tarif per jam naik secara linear ($\\times n$), bukan kuadrat ($n^2$).",
        },
      ],
      steps: [
        `Biaya awal $${fixedCost}$ berdiri sendiri (dibayar 1 kali).`,
        `Tarif per jam $${unitCost}$ dikalikan $n$ jam -> $${fixedCost} + ${unitCost}n$.`,
      ],
    },
    {
      prompt: `*"Rata-rata nilai 4 siswa adalah 75. Setelah 1 siswa baru bergabung, rata-ratanya menjadi 78. Berapa nilai siswa baru tersebut?"*\n\n**Langkah pertama paling tepat adalah:**`,
      hint: "Rata-rata tidak boleh dikurang atau dijumlah langsung; ubah dulu menjadi apa?",
      correct: {
        canonical: "total",
        label: "Hitung Total Nilai lama ($4 \\times 75$) dan Total Nilai baru ($5 \\times 78$)",
        trapFeedback: "Tepat!",
      },
      wrongs: [
        {
          canonical: "avg_diff",
          label: "Langsung tambah rata-rata dengan selisihnya: $78 + (78 - 75)$",
          trapFeedback: "Nilai siswa baru harus ikut mengangkat nilai 4 siswa lama juga, bukan cuma selisihnya!",
        },
        {
          canonical: "avg_mid",
          label: "Cari rata-rata antara 75 dan 78: $\\dfrac{75 + 78}{2}$",
          trapFeedback: "Rata-rata dari dua rata-rata salah karena bobot jumlah siswanya berbeda ($4$ vs $1$).",
        },
        {
          canonical: "div_5",
          label: "Bagi langsung $78$ dengan $5$ siswa",
          trapFeedback: "Membagi rata-rata dengan jumlah siswa justru mengecilkan angka menjadi bukan total nilai.",
        },
      ],
      steps: [
        `Selalu ubah rata-rata menjadi TOTAL NILAI: $\\text{Total} = \\text{Rata-rata} \\times \\text{Banyak Data}$.`,
        `Nilai siswa baru = Total nilai $5$ anak dikurangi Total nilai $4$ anak.`,
      ],
    },
    {
      prompt: `*"Sebuah sepeda melaju $30$ km/jam selama $40$ menit. Berapa jarak tempuhnya dalam km?"*\n\n**Apa langkah WAJIB sebelum mengalikan kecepatan × waktu?**`,
      hint: "Cek satuan kecepatan (km/JAM) vs satuan waktu (MENIT).",
      correct: {
        canonical: "convert",
        label: "Ubah $40$ menit menjadi jam dengan membagi $60$ ($\\dfrac{40}{60}$ jam)",
        trapFeedback: "Tepat!",
      },
      wrongs: [
        {
          canonical: "direct_mult",
          label: "Langsung kalikan $30 \\times 40$ tanpa mengubah satuan",
          trapFeedback: "Satuan 'jam' dan 'menit' tidak sejenis! Mengalikan langsung membuat jawabannya $1.200$ km yang mustahil.",
        },
        {
          canonical: "mult60",
          label: "Kalikan $40$ menit dengan $60$ agar sama",
          trapFeedback: "Dari menit ke jam harus DIBAGI $60$, bukan dikali $60$ (dikali 60 itu dari jam ke menit).",
        },
        {
          canonical: "div_speed",
          label: "Bagi kecepatan $30$ dengan $40$ untuk mencari jarak",
          trapFeedback: "Rumus jarak adalah $s = v \\times t$ (kecepatan DIKALI waktu), bukan dibagi.",
        },
      ],
      steps: [
        `Samakan satuan waktu dengan kecepatan (km/jam): $40\\text{ menit} = \\dfrac{40}{60}\\text{ jam}$.`,
        `Setelah satuannya sama, baru kalikan $v \\times t$.`,
      ],
    },
    {
      prompt: `*"Dari 8 kandidat, akan dipilih Ketua OSIS dan Wakil Ketua OSIS (jabatan berbeda)."*\n\n**Konsep mana yang TEPAT digunakan?**`,
      hint: "Coba tukar posisi 2 orang: (Andi Ketua, Budi Wakil) vs (Budi Ketua, Andi Wakil). Apakah dianggap hasil yang BEDA?",
      correct: {
        canonical: "perm",
        label: "Permutasi / Pengisian Slot ($8 \\times 7$) karena urutan jabatan BEDA",
        trapFeedback: "Tepat!",
      },
      wrongs: [
        {
          canonical: "comb",
          label: "Kombinasi $C(8, 2)$ karena hanya memilih 2 orang",
          trapFeedback: "Kombinasi dipakai jika posisi SAMA rata (misal anggota tim). Di sini Ketua ≠ Wakil, jadi urutannya PENTING!",
        },
        {
          canonical: "sum",
          label: "Aturan penjumlahan ($8 + 7$) karena hanya 2 jabatan",
          trapFeedback: "Ketua DAN Wakil dipilih bersamaan membentuk pasangan, jadi harus DIKALI, bukan ditambah.",
        },
        {
          canonical: "power",
          label: "Pangkat berulang ($8 \\times 8$) karena bisa dipilih lagi",
          trapFeedback: "Orang yang sudah terpilih jadi Ketua tidak bisa merangkap jadi Wakil.",
        },
      ],
      steps: [
        `Andi-Ketua + Budi-Wakil BERBEDA dengan Budi-Ketua + Andi-Wakil -> urutan PENTING.`,
        `Pakai Permutasi / Slot: $8 \\text{ pilihan Ketua} \\times 7 \\text{ sisa pilihan Wakil} = 56$ susunan.`,
      ],
    },
    {
      prompt: `*"Dalam suatu kelas berisi $30$ siswa, $18$ suka Matematika, $15$ suka Bahasa Inggris, dan $5$ siswa tidak suka keduanya."*\n\n**Persamaan himpunan mana yang benar untuk mencari jumlah yang suka KEDUANYA ($x$)?**`,
      hint: "Siswa yang suka keduanya ($x$) terhitung dua kali jika kita langsung menjumlah $18 + 15$, sehingga harus dikurangi $x$.",
      correct: {
        canonical: "venn",
        label: "$18 + 15 - x + 5 = 30$",
        trapFeedback: "Tepat!",
      },
      wrongs: [
        {
          canonical: "venn_plus",
          label: "$18 + 15 + x + 5 = 30$",
          trapFeedback: "Irisan $x$ terhitung ganda di 18 dan di 15, jadi $x$ harus DIKURANGI, bukan ditambah!",
        },
        {
          canonical: "no_outside",
          label: "$18 + 15 - x = 30 + 5$",
          trapFeedback: "Yang tidak suka keduanya ($5$) tetap bagian dari total $30$ siswa di sisi kiri bersama yang lain.",
        },
        {
          canonical: "diff_only",
          label: "$18 - 15 + 5 = x$",
          trapFeedback: "Selisih dua himpunan tidak langsung menghasilkan jumlah irisannya.",
        },
      ],
      steps: [
        `Gunakan rumus Total Kelas: $n(\\text{Total}) = n(A) + n(B) - n(A \\cap B) + n(\\text{Luar})$.`,
        `Substitusi angkanya: $30 = 18 + 15 - x + 5$.`,
      ],
    },
    {
      prompt: `*"Pedagang membeli barang seharga ${formatRupiah(50000)} lalu menjualnya seharga ${formatRupiah(60000)}. Berapa persen keuntungannya?"*\n\n**Pembagi (penyebut) mana yang benar dalam rumus persentase untung?**`,
      hint: "Persentase untung/rugi selalu diukur terhadap modal awal yang dikeluarkan pedagang.",
      correct: {
        canonical: "cost_base",
        label: "$\\dfrac{\\text{Untung}}{\\text{Harga Beli (50.000)}} \\times 100\\%$",
        trapFeedback: "Tepat!",
      },
      wrongs: [
        {
          canonical: "sell_base",
          label: "$\\dfrac{\\text{Untung}}{\\text{Harga Jual (60.000)}} \\times 100\\%$",
          trapFeedback: "Persentase keuntungan selalu dibagi Harga BELI (modal awal), bukan Harga Jual!",
        },
        {
          canonical: "raw_ratio",
          label: "$\\dfrac{\\text{Harga Jual}}{\\text{Harga Beli}} \\times 100\\%$",
          trapFeedback: "Pembilangnya harus besar UNTUNG ($\\text{Jual} - \\text{Beli}$), bukan seluruh Harga Jual.",
        },
        {
          canonical: "flat_diff",
          label: "Selisih harga dibagi $1.000$ langsung jadi persen",
          trapFeedback: "Persen harus dibandingkan terhadap harga modalnya.",
        },
      ],
      steps: [
        `Cari nominal untung $= \\text{Jual} - \\text{Beli}$.`,
        `Bandingkan selalu dengan Harga BELI (modal): $\\dfrac{\\text{Untung}}{\\text{Harga Beli}} \\times 100\\%$.`,
      ],
    },
  ];

  const maxIdx = difficulty === "dasar" ? 4 : difficulty === "standar" ? 6 : pool.length - 1;
  const spec = pool[randInt(rand, 0, maxIdx)] ?? pool[0];

  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    spec.correct,
    spec.wrongs,
    (k) => ({
      canonical: `fb_${k}`,
      label: `Rumus alternatif ${k}`,
      trapFeedback: "Cek hubungan sebab-akibat antar besaran di soal cerita.",
    }),
  );

  return {
    id,
    category: "formula_selector",
    categoryLabel: CATEGORY_LABEL_MAP.formula_selector,
    difficulty,
    promptMarkdown: spec.prompt,
    hintText: spec.hint,
    options,
    correctKey,
    stepByStep: spec.steps,
  };
}

export function generateSingleMathGymQuestion(
  cat: MathGymCoreCategory,
  difficulty: MathGymDifficulty,
  seed: number,
  idPrefix = "gym",
): MathGymQuestion {
  const rand = mulberry32(seed);
  const id = `${idPrefix}-${cat}-${difficulty}-${seed}`;
  switch (cat) {
    case "negative_order":
      return genNegativeOrder(rand, id, difficulty);
    case "fractions":
      return genFractions(rand, id, difficulty);
    case "powers_roots":
      return genPowersRoots(rand, id, difficulty);
    case "algebra_shift":
      return genAlgebraShift(rand, id, difficulty);
    case "percent_ratio":
      return genPercentRatio(rand, id, difficulty);
    case "geometry_basics":
      return genGeometryBasics(rand, id, difficulty);
    case "stat_prob_basics":
      return genStatProbBasics(rand, id, difficulty);
    case "word_translate":
      return genWordTranslate(rand, id, difficulty);
    case "formula_selector":
      return genFormulaSelector(rand, id, difficulty);
  }
}

export function generateMathGymSession(
  category: MathGymCategory,
  count = 10,
  seed = Date.now(),
  difficulty: MathGymDifficulty = "standar",
): MathGymQuestion[] {
  const safeCount = Math.max(1, Math.min(30, count));

  const mixedCycle: MathGymCoreCategory[] = [
    "negative_order",
    "fractions",
    "word_translate",
    "algebra_shift",
    "formula_selector",
    "percent_ratio",
    "geometry_basics",
    "powers_roots",
    "stat_prob_basics",
    "formula_selector",
  ];

  const questions: MathGymQuestion[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    const cat: MathGymCoreCategory =
      category === "mixed" ? mixedCycle[i % mixedCycle.length] : category;
    const itemSeed = (seed + i * 7919) >>> 0;
    questions.push(generateSingleMathGymQuestion(cat, difficulty, itemSeed, `gym-${seed}-${i + 1}`));
  }
  return questions;
}
