export type MathGymCategory =
  | "mixed"
  | "negative_order"
  | "fractions"
  | "percent_ratio"
  | "algebra_shift"
  | "powers_roots"
  | "word_translate";

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
  promptMarkdown: string;
  hintText: string;
  options: MathGymOption[];
  correctKey: "A" | "B" | "C" | "D";
  stepByStep: string[];
}

export interface MathGymCategoryMeta {
  id: MathGymCoreCategory;
  label: string;
  subtitle: string;
  examplePreview: string;
  studyTip: string;
}

export const MATH_GYM_CATEGORIES: MathGymCategoryMeta[] = [
  {
    id: "negative_order",
    label: "Tanda Minus & Urutan Hitung",
    subtitle: "Kurung, perkalian dulu, dan minus ketemu minus.",
    examplePreview: "$6 - (-2) \\times 4$",
    studyTip: "Selesaikan pangkat dan kali/bagi dulu sebelum tambah/kurang.",
  },
  {
    id: "fractions",
    label: "Pecahan Dasar (+, -, ×, ÷)",
    subtitle: "Samakan penyebut & balik pecahan saat membagi.",
    examplePreview: "$\\frac{2}{3} + \\frac{1}{4}$",
    studyTip: "Jangan pernah menjumlahkan penyebut dengan penyebut secara langsung!",
  },
  {
    id: "percent_ratio",
    label: "Persen, Diskon & Rasio",
    subtitle: "Hitung persentase cepat & membagi perbandingan.",
    examplePreview: "Diskon $20\\%$ dari $\\text{Rp }50.000$",
    studyTip: "Ubah persen ke bentuk per seratus atau kelipatan $10\\%$.",
  },
  {
    id: "algebra_shift",
    label: "Aljabar Pindah Ruas & Kurung",
    subtitle: "Mencari $x$, distributif $a(x - b)$, balik tanda.",
    examplePreview: "$3(x - 2) = 12$",
    studyTip: "Setiap menyeberangi tanda '=', tanda (+) jadi (-) dan (×) jadi (÷).",
  },
  {
    id: "powers_roots",
    label: "Pangkat & Akar Dasar",
    subtitle: "Basis sama pangkat ditambah, pangkat negatif & akar.",
    examplePreview: "$2^3 \\times 2^4 = 2^?$",
    studyTip: "Kali basis sama = pangkat DIJUMLAHKAN, bukan dikali.",
  },
  {
    id: "word_translate",
    label: "Terjemah Soal Cerita -> Rumus",
    subtitle: "Ubah kalimat cerita sehari-hari jadi hitungan atau ekspresi.",
    examplePreview: "\"$3$ tahun lebih tua dari $2$ kali $u$\" -> $2u + 3$",
    studyTip: "Baca pelan tiap frasa: 'lebih tua' = (+), 'kali lipat' = (×), 'berkurang' = (-).",
  },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  MATH_GYM_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<MathGymCoreCategory, string>;

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

  // Fisher-Yates shuffle
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

function genNegativeOrder(rand: () => number, id: string): MathGymQuestion {
  const variant = randInt(rand, 0, 2);
  let promptMarkdown = "";
  let hintText = "";
  let ansVal = 0;
  let wrongs: RawChoice[] = [];
  let stepByStep: string[] = [];

  if (variant === 0) {
    const a = randInt(rand, 4, 12);
    const b = randInt(rand, 2, 6);
    const c = randInt(rand, 2, 5);
    // a - (-b) * c
    ansVal = a + b * c;
    promptMarkdown = `Hitung nilai dari $${a} - (-${b}) \\times ${c}$`;
    hintText = "Kerjakan perkalian $(-b) \\times c$ terlebih dahulu, lalu ingat tanda kurang ketemu minus menjadi tambah.";
    const trapLeftToRight = (a + b) * c;
    const trapSign = a - b * c;
    const trapSub = a - b + c;
    wrongs = [
      {
        canonical: String(trapLeftToRight),
        label: `$${trapLeftToRight}$`,
        trapFeedback: `Kamu menghitung $${a} + ${b}$ duluan sebelum dikali $${c}$. Perkalian harus didahulukan.`,
      },
      {
        canonical: String(trapSign),
        label: `$${trapSign}$`,
        trapFeedback: "Hati-hati tanda minus! Mengurangi bilangan negatif sama dengan menjumlahkan ($-(-n) = +n$).",
      },
      {
        canonical: String(trapSub),
        label: `$${trapSub}$`,
        trapFeedback: `Perhatikan simbol kali $\\times ${c}$, bukan ditambah $${c}$.`,
      },
    ];
    stepByStep = [
      `Kalikan lebih dulu: $(- ${b}) \\times ${c} = -${b * c}$.`,
      `Masukkan kembali ke soal: $${a} - (-${b * c})$.`,
      `Kurang ketemu minus menjadi tambah: $${a} + ${b * c} = ${ansVal}$.`,
    ];
  } else if (variant === 1) {
    const a = randInt(rand, 2, 7);
    const b = randInt(rand, 3, 12);
    // (-a)^2 - b
    ansVal = a * a - b;
    promptMarkdown = `Tentukan hasil dari $(-${a})^2 - ${b}$`;
    hintText = "Karena tanda minus ada DI DALAM kurung, $(-a)^2$ artinya $(-a) \\times (-a)$ yang hasilnya positif.";
    const trapNegSquare = -(a * a) - b;
    const trapDouble = a * 2 - b;
    const trapAdd = a * a + b;
    wrongs = [
      {
        canonical: String(trapNegSquare),
        label: `$${trapNegSquare}$`,
        trapFeedback: `$(-${a})^2$ itu $(- ${a}) \\times (- ${a}) = +${a * a}$, bukan $-${a * a}$.`,
      },
      {
        canonical: String(trapDouble),
        label: `$${trapDouble}$`,
        trapFeedback: `Pangkat dua artinya $${a} \\times ${a}$, bukan $${a} \\times 2$.`,
      },
      {
        canonical: String(trapAdd),
        label: `$${trapAdd}$`,
        trapFeedback: `Operasi akhirnya adalah dikurangi $${b}$, bukan ditambah.`,
      },
    ];
    stepByStep = [
      `Hitung kuadrat dalam kurung: $(-${a})^2 = (-${a}) \\times (-${a}) = ${a * a}$.`,
      `Kurangi dengan $${b}$: $${a * a} - ${b} = ${ansVal}$.`,
    ];
  } else {
    const a = randInt(rand, 3, 9);
    const b = randInt(rand, 2, 5);
    const c = randInt(rand, 2, 7);
    // -a + b * (-c)
    ansVal = -a - b * c;
    promptMarkdown = `Nilai dari $-${a} + ${b} \\times (-${c})$ adalah $\\dots$`;
    hintText = "Positif dikali negatif hasilnya negatif. Kerjakan perkalian dulu baru jumlahkan dengan angka depan.";
    const trapLeftToRight = (-a + b) * -c;
    const trapFlipSign = -a + b * c;
    const trapDropMinus = a - b * c;
    wrongs = [
      {
        canonical: String(trapLeftToRight),
        label: `$${trapLeftToRight}$`,
        trapFeedback: `Kamu menjumlahkan $-${a} + ${b}$ duluan sebelum dikalikan $(-${c})$.`,
      },
      {
        canonical: String(trapFlipSign),
        label: `$${trapFlipSign}$`,
        trapFeedback: `Perkalian $+${b} \\times (-${c})$ menghasilkan minus ($-${b * c}$), bukan positif.`,
      },
      {
        canonical: String(trapDropMinus),
        label: `$${trapDropMinus}$`,
        trapFeedback: `Jangan lupakan tanda minus di depan angka $${a}$.`,
      },
    ];
    stepByStep = [
      `Kerjakan perkalian dulu: $${b} \\times (-${c}) = -${b * c}$.`,
      `Gabungkan dengan angka depan: $-${a} + (-${b * c}) = -${a} - ${b * c} = ${ansVal}$.`,
    ];
  }

  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(ansVal), label: `$${ansVal}$` },
    wrongs,
    (k) => ({
      canonical: String(ansVal + k * 2),
      label: `$${ansVal + k * 2}$`,
      trapFeedback: "Cek ulang urutan kali/kurang dan tanda positif/negatifnya.",
    }),
  );

  return {
    id,
    category: "negative_order",
    categoryLabel: CATEGORY_LABEL_MAP.negative_order,
    promptMarkdown,
    hintText,
    options,
    correctKey,
    stepByStep,
  };
}

function genFractions(rand: () => number, id: string): MathGymQuestion {
  const op = randInt(rand, 0, 2); // 0 add, 1 sub, 2 div
  const d1 = pick(rand, [2, 3, 4, 5]);
  const d2 = pick(rand, [3, 4, 5, 6].filter((d) => d !== d1));
  const n1 = randInt(rand, 1, d1 - 1);
  const n2 = randInt(rand, 1, d2 - 1);

  let promptMarkdown = "";
  let hintText = "";
  let ansNum = 0;
  let ansDen = 1;
  let wrongs: RawChoice[] = [];
  let stepByStep: string[] = [];

  if (op === 0) {
    ansNum = n1 * d2 + n2 * d1;
    ansDen = d1 * d2;
    const g = gcd(ansNum, ansDen);
    const simpN = ansNum / g;
    const simpD = ansDen / g;
    const canon = `${simpN}/${simpD}`;
    promptMarkdown = `Hitung jumlah pecahan: $\\dfrac{${n1}}{${d1}} + \\dfrac{${n2}}{${d2}}$`;
    hintText = "Samakan penyebut lebih dulu dengan KPK atau kali silang penyebut.";
    wrongs = [
      {
        canonical: `${n1 + n2}/${d1 + d2}`,
        label: formatFractionLatex(n1 + n2, d1 + d2),
        trapFeedback: "Jangan langsung menambah pembilang dengan pembilang dan penyebut dengan penyebut! Samakan penyebut dulu.",
      },
      {
        canonical: `${n1 + n2}/${ansDen}`,
        label: formatFractionLatex(n1 + n2, ansDen),
        trapFeedback: "Penyebutnya sudah dikalikan, tapi pembilangnya belum ikut dikali silang.",
      },
      {
        canonical: `${Math.abs(n1 * d2 - n2 * d1)}/${ansDen}`,
        label: formatFractionLatex(Math.abs(n1 * d2 - n2 * d1) || 1, ansDen),
        trapFeedback: "Operasinya penjumlahan (+), bukan pengurangan (-).",
      },
    ];
    stepByStep = [
      `Samakan penyebut ke $${ansDen}$: $\\dfrac{${n1} \\times ${d2}}{${ansDen}} + \\dfrac{${n2} \\times ${d1}}{${ansDen}} = \\dfrac{${n1 * d2}}{${ansDen}} + \\dfrac{${n2 * d1}}{${ansDen}}$.`,
      `Jumlahkan pembilang: $\\dfrac{${ansNum}}{${ansDen}}${g > 1 ? ` = ${formatFractionLatex(ansNum, ansDen).replace(/\$/g, "")}` : ""}.`,
    ];
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: canon, label: formatFractionLatex(ansNum, ansDen) },
      wrongs,
      (k) => ({
        canonical: `${simpN + k}/${simpD}`,
        label: formatFractionLatex(simpN + k, simpD),
        trapFeedback: "Periksa lagi perkalian silang pembilangnya.",
      }),
    );
    return {
      id,
      category: "fractions",
      categoryLabel: CATEGORY_LABEL_MAP.fractions,
      promptMarkdown,
      hintText,
      options,
      correctKey,
      stepByStep,
    };
  }

  if (op === 1) {
    // Ensure positive result n1/d1 > n2/d2 by ordering
    let aN = n1;
    let aD = d1;
    let bN = n2;
    let bD = d2;
    if (aN * bD < bN * aD) {
      aN = n2;
      aD = d2;
      bN = n1;
      bD = d1;
    }
    ansNum = aN * bD - bN * aD;
    ansDen = aD * bD;
    if (ansNum === 0) ansNum = 1;
    const g = gcd(ansNum, ansDen);
    const canon = `${ansNum / g}/${ansDen / g}`;
    promptMarkdown = `Hitung selisih pecahan: $\\dfrac{${aN}}{${aD}} - \\dfrac{${bN}}{${bD}}$`;
    hintText = "Samakan penyebut dulu dengan kali silang: $(a \\cdot d - b \\cdot c)/(c \\cdot d)$.";
    wrongs = [
      {
        canonical: `${aN - bN}/${Math.max(1, aD - bD)}`,
        label: formatFractionLatex(Math.abs(aN - bN) || 1, Math.max(1, Math.abs(aD - bD))),
        trapFeedback: "Penyebut tidak boleh langsung dikurangkan begitu saja; wajib disamakan dulu.",
      },
      {
        canonical: `${aN * bD + bN * aD}/${ansDen}`,
        label: formatFractionLatex(aN * bD + bN * aD, ansDen),
        trapFeedback: "Operasinya pengurangan (-), bukan penjumlahan (+).",
      },
      {
        canonical: `${ansNum + 1}/${ansDen}`,
        label: formatFractionLatex(ansNum + 1, ansDen),
        trapFeedback: "Selisih perkalian silang pembilangnya meleset satu angka.",
      },
    ];
    stepByStep = [
      `Samakan penyebut ke $${ansDen}$: $\\dfrac{${aN * bD}}{${ansDen}} - \\dfrac{${bN * aD}}{${ansDen}}$.`,
      `Kurangkan pembilangnya: $\\dfrac{${ansNum}}{${ansDen}}${g > 1 ? ` = ${formatFractionLatex(ansNum, ansDen).replace(/\$/g, "")}` : ""}.`,
    ];
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: canon, label: formatFractionLatex(ansNum, ansDen) },
      wrongs,
      (k) => {
        const g2 = gcd(ansNum + k, ansDen);
        return {
          canonical: `${(ansNum + k) / g2}/${ansDen / g2}`,
          label: formatFractionLatex(ansNum + k, ansDen),
          trapFeedback: "Cek lagi hasil pengurangan pembilang setelah penyebut sama.",
        };
      },
    );
    return {
      id,
      category: "fractions",
      categoryLabel: CATEGORY_LABEL_MAP.fractions,
      promptMarkdown,
      hintText,
      options,
      correctKey,
      stepByStep,
    };
  }

  // Division: (n1/d1) / (n2/d2)
  ansNum = n1 * d2;
  ansDen = d1 * n2;
  const g = gcd(ansNum, ansDen);
  const canon = `${ansNum / g}/${ansDen / g}`;
  promptMarkdown = `Hasil dari $\\dfrac{${n1}}{${d1}} \\div \\dfrac{${n2}}{${d2}}$ adalah $\\dots$`;
  hintText = "Membagi pecahan = MENGALI dengan kebalikan pecahan yang kedua.";
  wrongs = [
    {
      canonical: `${(n1 * n2) / gcd(n1 * n2, d1 * d2)}/${(d1 * d2) / gcd(n1 * n2, d1 * d2)}`,
      label: formatFractionLatex(n1 * n2, d1 * d2),
      trapFeedback: "Kamu langsung mengalikan tanpa membalik pecahan kedua!",
    },
    {
      canonical: `${(d1 * n2) / g}/${(n1 * d2) / g}`,
      label: formatFractionLatex(d1 * n2, n1 * d2),
      trapFeedback: "Kamu terbalik membalik pecahan PERTAMA, padahal yang dibalik harus pecahan KEDUA.",
    },
    {
      canonical: `${ansNum + d2}/${ansDen}`,
      label: formatFractionLatex(ansNum + d2, ansDen),
      trapFeedback: "Cek perkalian pembilang dan penyebut setelah pecahan kedua dibalik.",
    },
  ];
  stepByStep = [
    `Balik pecahan kedua lalu ubah tanda bagi menjadi kali: $\\dfrac{${n1}}{${d1}} \\times \\dfrac{${d2}}{${n2}}$.`,
    `Kalikan lurus atas × atas, bawah × bawah: $\\dfrac{${ansNum}}{${ansDen}}${g > 1 ? ` = ${formatFractionLatex(ansNum, ansDen).replace(/\$/g, "")}` : ""}.`,
  ];
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: canon, label: formatFractionLatex(ansNum, ansDen) },
    wrongs,
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
    promptMarkdown,
    hintText,
    options,
    correctKey,
    stepByStep,
  };
}

function genPercentRatio(rand: () => number, id: string): MathGymQuestion {
  const variant = randInt(rand, 0, 2);
  let promptMarkdown = "";
  let hintText = "";
  let ansVal = 0;
  let isRupiah = false;
  let wrongs: RawChoice[] = [];
  let stepByStep: string[] = [];

  if (variant === 0) {
    const pct = pick(rand, [15, 20, 25, 30, 35, 40]);
    const base = pick(rand, [80, 120, 160, 200, 240, 300, 400]);
    ansVal = (pct * base) / 100;
    promptMarkdown = `Berapakah $${pct}\\%$ dari $${base}$?`;
    hintText = "Cari $10\\%$ dari angkanya (cukup bagi $10$), lalu kalikan ke persen yang diminta.";
    wrongs = [
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
        trapFeedback: "Persen tidak dijumlahkan langsung dengan bilangan asal.",
      },
    ];
    stepByStep = [
      `Ubah persen jadi pecahan: $${pct}\\% = \\dfrac{${pct}}{100}$.`,
      `Kalikan dengan $${base}$: $\\dfrac{${pct} \\times ${base}}{100} = ${ansVal}$.`,
    ];
  } else if (variant === 1) {
    const price = pick(rand, [40000, 50000, 60000, 80000, 120000, 150000]);
    const disc = pick(rand, [10, 20, 25, 30]);
    const pot = (price * disc) / 100;
    ansVal = price - pot;
    isRupiah = true;
    promptMarkdown = `Sepatu seharga **${formatRupiah(price)}** mendapat diskon **$${disc}\\%$**. Berapa harga yang harus dibayar?`;
    hintText = "Harga bayar = Harga awal dikurangi potongan diskon (atau langsung kalikan $(100 - \\text{diskon})\\%$).";
    wrongs = [
      {
        canonical: String(pot),
        label: formatRupiah(pot),
        trapFeedback: `${formatRupiah(pot)} itu besar POTONGAN diskonnya, bukan harga yang harus dibayar!`,
      },
      {
        canonical: String(price + pot),
        label: formatRupiah(price + pot),
        trapFeedback: "Diskon artinya harga berkurang, bukan bertambah.",
      },
      {
        canonical: String(price - disc * 100),
        label: formatRupiah(price - disc * 100),
        trapFeedback: `Diskon $${disc}\\%$ berarti ${disc} per seratus dari harga barang, bukan dikurangi nominal polos.`,
      },
    ];
    stepByStep = [
      `Hitung besar diskon: $${disc}\\% \\times ${formatRupiah(price)} = ${formatRupiah(pot)}$.`,
      `Kurangi harga awal dengan diskon: $${formatRupiah(price)} - ${formatRupiah(pot)} = ${formatRupiah(ansVal)}$.`,
    ];
  } else {
    const rA = pick(rand, [2, 3, 4]);
    const rB = pick(rand, [3, 5, 7].filter((x) => x !== rA));
    const mult = pick(rand, [4, 5, 6, 8, 10]);
    const total = (rA + rB) * mult;
    ansVal = rA * mult;
    promptMarkdown = `Perbandingan kelereng Andi dan Budi adalah $${rA} : ${rB}$. Jika total kelereng mereka **$${total}$ butir**, berapa kelereng milik Andi?`;
    hintText = "Karena yang diketahui TOTAL, jumlahkan angka perbandingannya dulu sebagai penyebut!";
    wrongs = [
      {
        canonical: String(rB * mult),
        label: `$${rB * mult}$`,
        trapFeedback: `Itu milik Budi! Yang ditanya di soal adalah kelereng Andi (angka perbandingan ${rA}).`,
      },
      {
        canonical: String(Math.round((rA / rB) * total)),
        label: `$${Math.round((rA / rB) * total)}$`,
        trapFeedback: "Penyebut harus jumlah perbandingan ($r_A + r_B$), bukan $r_B$ saja, karena $total$ adalah gabungan keduanya.",
      },
      {
        canonical: String(total - rA),
        label: `$${total - rA}$`,
        trapFeedback: "Perbandingan adalah rasio pengali, bukan dikurangi langsung.",
      },
    ];
    stepByStep = [
      `Jumlah bagian perbandingan $= ${rA} + ${rB} = ${rA + rB}$ bagian.`,
      `Nilai $1$ bagian $= ${total} \\div ${rA + rB} = ${mult}$.`,
      `Kelereng Andi $= ${rA} \\times ${mult} = ${ansVal}$ butir.`,
    ];
  }

  const fmt = (v: number) => (isRupiah ? formatRupiah(v) : `$${v}$`);
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(ansVal), label: fmt(ansVal) },
    wrongs,
    (k) => ({
      canonical: String(ansVal + (isRupiah ? k * 5000 : k * 5)),
      label: fmt(ansVal + (isRupiah ? k * 5000 : k * 5)),
      trapFeedback: "Cek kembali langkah pembagian $100$ atau jumlah perbandingannya.",
    }),
  );

  return {
    id,
    category: "percent_ratio",
    categoryLabel: CATEGORY_LABEL_MAP.percent_ratio,
    promptMarkdown,
    hintText,
    options,
    correctKey,
    stepByStep,
  };
}

function genAlgebraShift(rand: () => number, id: string): MathGymQuestion {
  const variant = randInt(rand, 0, 1);
  const xSol = pick(rand, [-4, -3, -2, 2, 3, 4, 5, 6, 7]);
  let promptMarkdown = "";
  let hintText = "";
  let wrongs: RawChoice[] = [];
  let stepByStep: string[] = [];

  if (variant === 0) {
    const a = pick(rand, [2, 3, 4, 5]);
    const b = pick(rand, [3, 4, 5, 7, 8]);
    const c = a * xSol + b;
    promptMarkdown = `Tentukan nilai $x$ dari persamaan $${a}x + ${b} = ${c}$`;
    hintText = `Pindahkan $+${b}$ ke sisi kanan menjadi $-${b}$ dulu, baru bagi dengan $${a}$.`;
    const wrongAddMove = Math.round((c + b) / a);
    const wrongSignFlip = -xSol;
    const wrongNoDiv = c - b;
    wrongs = [
      {
        canonical: String(wrongAddMove),
        label: `$${wrongAddMove}$`,
        trapFeedback: `Saat $+${b}$ menyeberang tanda '=', tandanya harus berubah jadi $-${b}$, bukan ikut ditambah!`,
      },
      {
        canonical: String(wrongSignFlip),
        label: `$${wrongSignFlip}$`,
        trapFeedback: "Perhatikan tanda positif/negatif saat membagi hasil akhir dengan koefisien.",
      },
      {
        canonical: String(wrongNoDiv),
        label: `$${wrongNoDiv}$`,
        trapFeedback: `Kamu lupa membagi hasilnya dengan angka $${a}$ di depan $x$.`,
      },
    ];
    stepByStep = [
      `Pindahkan $+${b}$ ke kanan (tandanya berbalik jadi minus): $${a}x = ${c} - ${b} = ${c - b}$.`,
      `Bagi kedua sisi dengan $${a}$: $x = \\dfrac{${c - b}}{${a}} = ${xSol}$.`,
    ];
  } else {
    const a = pick(rand, [2, 3, 4]);
    const b = pick(rand, [1, 2, 3, 4]);
    const c = a * (xSol - b);
    promptMarkdown = `Jika $${a}(x - ${b}) = ${c}$, berapakah nilai $x$?`;
    hintText = `Bagi langsung kedua sisi dengan $${a}$ (lebih cepat!), atau kalikan $${a}$ ke kedua suku dalam kurung.`;
    const wrongForgotDistribute = Math.round((c + b) / a);
    const wrongSubInsteadOfAdd = Math.round(c / a - b);
    const wrongSign = -xSol;
    wrongs = [
      {
        canonical: String(wrongForgotDistribute),
        label: `$${wrongForgotDistribute}$`,
        trapFeedback: `Kalau membuka kurung, $${a}$ wajib dikali ke keduanya: $${a}x - ${a * b}$, bukan $${a}x - ${b}$!`,
      },
      {
        canonical: String(wrongSubInsteadOfAdd),
        label: `$${wrongSubInsteadOfAdd}$`,
        trapFeedback: `Setelah mendapat $x - ${b} = ${c / a}$, pindah ruas $-${b}$ ke kanan menjadi $+${b}$, bukan dikurang.`,
      },
      {
        canonical: String(wrongSign),
        label: `$${wrongSign}$`,
        trapFeedback: "Cek lagi tanda negatif ketika memindah ruas suku konstanta.",
      },
    ];
    stepByStep = [
      `Bagi kedua sisi dengan $${a}$: $x - ${b} = \\dfrac{${c}}{${a}} = ${c / a}$.`,
      `Pindahkan $-${b}$ ke kanan menjadi $+${b}$: $x = ${c / a} + ${b} = ${xSol}$.`,
    ];
  }

  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(xSol), label: `$${xSol}$` },
    wrongs,
    (k) => ({
      canonical: String(xSol + k),
      label: `$${xSol + k}$`,
      trapFeedback: "Periksa lagi operasi pindah ruas dan pembagian koefisien $x$.",
    }),
  );

  return {
    id,
    category: "algebra_shift",
    categoryLabel: CATEGORY_LABEL_MAP.algebra_shift,
    promptMarkdown,
    hintText,
    options,
    correctKey,
    stepByStep,
  };
}

function genPowersRoots(rand: () => number, id: string): MathGymQuestion {
  const variant = randInt(rand, 0, 1);
  let promptMarkdown = "";
  let hintText = "";
  let wrongs: RawChoice[] = [];
  let stepByStep: string[] = [];

  if (variant === 0) {
    const base = pick(rand, [2, 3, 5]);
    const m = randInt(rand, 2, 5);
    const n = randInt(rand, 2, 4);
    const p = randInt(rand, 1, 3);
    const ansExp = m + n - p;
    const ansStr = `${base}^{${ansExp}}`;
    promptMarkdown = `Sederhanakan bentuk pangkat berikut: $\\dfrac{${base}^{${m}} \\times ${base}^{${n}}}{${base}^{${p}}}$`;
    hintText = "Basisnya sama! Saat dikali, pangkat DIJUMLAHKAN. Saat dibagi, pangkat DIKURANGKAN.";
    wrongs = [
      {
        canonical: `${base}^{${m * n - p}}`,
        label: `$${base}^{${m * n - p}}$`,
        trapFeedback: "Saat bilangan berpangkat dikali ($a^m \\times a^n$), pangkatnya DIJUMLAHKAN, bukan dikali!",
      },
      {
        canonical: `${base}^{${m + n + p}}`,
        label: `$${base}^{${m + n + p}}$`,
        trapFeedback: `Penyebut $${base}^{${p}}$ itu membagi, jadi pangkatnya dikurangi $${p}$, bukan ditambah.`,
      },
      {
        canonical: `${base * base}^{${ansExp}}`,
        label: `$${base * base}^{${ansExp}}$`,
        trapFeedback: `Angka basis ($${base}$) tetap utuh, tidak ikut dikalikan menjadi $${base * base}$.`,
      },
    ];
    stepByStep = [
      `Pembilang dikali (basis sama = pangkat dijumlah): $${base}^{${m} + ${n}} = ${base}^{${m + n}}$.`,
      `Dibagi penyebut (pangkat dikurang): $${base}^{${m + n} - ${p}} = ${ansStr}$.`,
    ];

    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: ansStr, label: `$${ansStr}$` },
      wrongs,
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
      promptMarkdown,
      hintText,
      options,
      correctKey,
      stepByStep,
    };
  }

  // Roots: sqrt(a^2) + sqrt(b^2) - c
  const p = pick(rand, [3, 4, 5, 6, 7, 8]);
  const q = pick(rand, [4, 5, 6, 9, 10].filter((x) => x !== p));
  const ansVal = p + q;
  promptMarkdown = `Hitung nilai dari $\\sqrt{${p * p}} + \\sqrt{${q * q}}$`;
  hintText = "Cari masing-masing akarnya terlebih dahulu! Jangan menggabungkan angka di dalam akar saat penjumlahan.";
  const trapInside = Math.round(Math.sqrt(p * p + q * q));
  wrongs = [
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
      trapFeedback: "Periksa lagi nilai akar kuadrat masing-masing bilangan.",
    },
  ];
  stepByStep = [
    `Hitung akar satu per satu: $\\sqrt{${p * p}} = ${p}$ dan $\\sqrt{${q * q}} = ${q}$.`,
    `Jumlahkan hasilnya: $${p} + ${q} = ${ansVal}$.`,
  ];

  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(ansVal), label: `$${ansVal}$` },
    wrongs,
    (k) => ({
      canonical: String(ansVal + k),
      label: `$${ansVal + k}$`,
      trapFeedback: "Cari nilai akar masing-masing bilangan dulu sebelum menjumlahkan.",
    }),
  );

  return {
    id,
    category: "powers_roots",
    categoryLabel: CATEGORY_LABEL_MAP.powers_roots,
    promptMarkdown,
    hintText,
    options,
    correctKey,
    stepByStep,
  };
}

function genWordTranslate(rand: () => number, id: string): MathGymQuestion {
  const variant = randInt(rand, 0, 3);

  if (variant === 0) {
    // Algebraic sentence -> expression
    const m = pick(rand, [2, 3, 4]);
    const k = pick(rand, [3, 4, 5, 7]);
    const correctExpr = `${m}u + ${k}`;
    const promptMarkdown = `Terjemahkan kalimat ini ke bentuk aljabar:\n\n*"Umur Kakak adalah **$${k}$ tahun lebih tua** dari **$${m}$ kali** umur Adik ($u$)."*`;
    const hintText = "'lebih tua k tahun' artinya DITAMBAH k (+k). '$m$ kali umur Adik' artinya $mu$.";
    const wrongs: RawChoice[] = [
      {
        canonical: `${m}u - ${k}`,
        label: `$${m}u - ${k}$`,
        trapFeedback: "Kata 'lebih tua' berarti lebih besar (+), bukan dikurang (-).",
      },
      {
        canonical: `${m}(u + ${k})`,
        label: `$${m}(u + ${k})$`,
        trapFeedback: "Di kalimat, yang dikali $m$ hanya umur Adik ($u$), lalu baru ditambah $k$, bukan $(u + k)$ yang dikali $m$.",
      },
      {
        canonical: `${k}u + ${m}`,
        label: `$${k}u + ${m}$`,
        trapFeedback: `Angka pengali umur adalah $${m}$, sedangkan selisih tambahnya $${k}$ (jangan tertukar!).`,
      },
    ];
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: correctExpr, label: `$${correctExpr}$` },
      wrongs,
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
      promptMarkdown,
      hintText,
      options,
      correctKey,
      stepByStep: [
        `Frasa "$${m}$ kali umur Adik ($u$)" ditulis: $${m}u$.`,
        `Frasa "$${k}$ tahun lebih tua" berarti ditambah $${k}$: $${m}u + ${k}$.`,
      ],
    };
  }

  if (variant === 1) {
    // Inverse proportion word story with exact integer result
    const triples: Array<[number, number, number]> = [
      [4, 6, 8],
      [6, 10, 12],
      [6, 8, 12],
      [5, 12, 10],
      [8, 9, 12],
    ];
    const [p1, t1, p2] = pick(rand, triples);
    const t2 = (p1 * t1) / p2;
    const trapDirect = Math.round((p2 * t1) / p1);
    const promptMarkdown = `Sebuah proyek selesai dalam **$${t1}$ hari** oleh **$${p1}$ pekerja**. Jika pekerja ditambah menjadi **$${p2}$ orang**, proyek akan selesai dalam berapa hari?`;
    const hintText = "Semakin BANYAK pekerja, waktu selesai makin CEPAT (berbalik nilai). Kalikan sejajar: $P_1 \\times t_1 = P_2 \\times t_2$.";
    const wrongs: RawChoice[] = [
      {
        canonical: String(trapDirect),
        label: `$${trapDirect}$ hari`,
        trapFeedback: "Awas jebakan perbandingan senilai! Makin banyak pekerja justru makin sedikit harinya, bukan ikut naik.",
      },
      {
        canonical: String(t1 + (p2 - p1)),
        label: `$${t1 + (p2 - p1)}$ hari`,
        trapFeedback: "Perubahan pekerja memengaruhi waktu lewat perkalian/pembagian, bukan tambah/kurang biasa.",
      },
      {
        canonical: String(Math.max(1, t1 - (p2 - p1))),
        label: `$${Math.max(1, t1 - (p2 - p1))}$ hari`,
        trapFeedback: "Jangan mengurangkan selisih pekerja langsung dari jumlah hari!",
      },
    ];
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(t2), label: `$${t2}$ hari` },
      wrongs,
      (k) => ({
        canonical: String(t2 + k),
        label: `$${t2 + k}$ hari`,
        trapFeedback: "Gunakan rumus berbalik nilai $P_1 \\times t_1 = P_2 \\times t_2$.",
      }),
    );
    return {
      id,
      category: "word_translate",
      categoryLabel: CATEGORY_LABEL_MAP.word_translate,
      promptMarkdown,
      hintText,
      options,
      correctKey,
      stepByStep: [
        `Identifikasi jenis soal: Pekerja bertambah -> Hari berkurang = Berbalik Nilai.`,
        `Hitung total beban kerja: $${p1} \\times ${t1} = ${p1 * t1}$ orang-hari.`,
        `Bagi dengan jumlah pekerja baru: $${p1 * t1} \\div ${p2} = ${t2}$ hari.`,
      ],
    };
  }

  if (variant === 2) {
    // Fixed cost + variable cost linear story
    const fixed = pick(rand, [10000, 15000, 20000]);
    const perUnit = pick(rand, [3000, 4000, 5000]);
    const units = pick(rand, [4, 5, 6, 8]);
    const total = fixed + perUnit * units;
    const promptMarkdown = `Tarif sewa lapangan memiliki biaya daftar awal **${formatRupiah(fixed)}** ditambah **${formatRupiah(perUnit)} per jam**. Berapa total bayar jika menyewa **$${units}$ jam**?`;
    const hintText = "Biaya awal dibayar CUKUP SEKALI saja; biaya per jam yang dikalikan jumlah jam.";
    const wrongs: RawChoice[] = [
      {
        canonical: String((fixed + perUnit) * units),
        label: formatRupiah((fixed + perUnit) * units),
        trapFeedback: "Biaya awal dibayar cuma sekali di depan, tidak ikut dikalikan jumlah jam!",
      },
      {
        canonical: String(perUnit * units),
        label: formatRupiah(perUnit * units),
        trapFeedback: `Kamu lupa menambahkan biaya awal ${formatRupiah(fixed)}.`,
      },
      {
        canonical: String(fixed + perUnit),
        label: formatRupiah(fixed + perUnit),
        trapFeedback: `Tarif per jamnya belum dikalikan $${units}$ jam.`,
      },
    ];
    const { options, correctKey } = buildFourUniqueOptions(
      rand,
      { canonical: String(total), label: formatRupiah(total) },
      wrongs,
      (k) => ({
        canonical: String(total + k * perUnit),
        label: formatRupiah(total + k * perUnit),
        trapFeedback: "Pisahkan biaya tetap (1x) dan biaya per jam (× jam).",
      }),
    );
    return {
      id,
      category: "word_translate",
      categoryLabel: CATEGORY_LABEL_MAP.word_translate,
      promptMarkdown,
      hintText,
      options,
      correctKey,
      stepByStep: [
        `Biaya variabel ($${units}$ jam) $= ${units} \\times ${formatRupiah(perUnit)} = ${formatRupiah(perUnit * units)}$.`,
        `Tambahkan biaya awal 1 kali: $${formatRupiah(fixed)} + ${formatRupiah(perUnit * units)} = ${formatRupiah(total)}$.`,
      ],
    };
  }

  // Variant 3: Speed / unit conversion minutes <-> hours
  const speed = pick(rand, [40, 60, 80]);
  const mins = pick(rand, [30, 45, 90]);
  const dist = (speed * mins) / 60;
  const promptMarkdown = `Motor melaju dengan kecepatan konstan **$${speed}$ km/jam** selama **$${mins}$ menit**. Berapa km jarak yang ditempuh?`;
  const hintText = "Satuan kecepatan memakai JAM, sedangkan waktu masih MENIT. Ubah menit ke jam dulu (bagi $60$).";
  const wrongs: RawChoice[] = [
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
      trapFeedback: "Cek kembali hasil perkalian kecepatan dengan pecahan jamnya.",
    },
  ];
  const { options, correctKey } = buildFourUniqueOptions(
    rand,
    { canonical: String(dist), label: `$${dist}$ km` },
    wrongs,
    (k) => ({
      canonical: String(dist + k * 5),
      label: `$${dist + k * 5}$ km`,
      trapFeedback: "Pastikan waktu diubah ke jam (menit/60) lalu dikali kecepatan.",
    }),
  );
  return {
    id,
    category: "word_translate",
    categoryLabel: CATEGORY_LABEL_MAP.word_translate,
    promptMarkdown,
    hintText,
    options,
    correctKey,
    stepByStep: [
      `Ubah menit ke jam: $${mins}\\text{ menit} = \\dfrac{${mins}}{60}\\text{ jam}$.`,
      `Hitung jarak: $s = v \\times t = ${speed} \\times \\dfrac{${mins}}{60} = ${dist}$ km.`,
    ],
  };
}

function generateForCategory(
  cat: MathGymCoreCategory,
  rand: () => number,
  id: string,
): MathGymQuestion {
  switch (cat) {
    case "negative_order":
      return genNegativeOrder(rand, id);
    case "fractions":
      return genFractions(rand, id);
    case "percent_ratio":
      return genPercentRatio(rand, id);
    case "algebra_shift":
      return genAlgebraShift(rand, id);
    case "powers_roots":
      return genPowersRoots(rand, id);
    case "word_translate":
      return genWordTranslate(rand, id);
  }
}

export function generateMathGymSession(
  category: MathGymCategory,
  count = 10,
  seed = Date.now(),
): MathGymQuestion[] {
  const rand = mulberry32(seed);
  const safeCount = Math.max(1, Math.min(30, count));

  const mixedCycle: MathGymCoreCategory[] = [
    "negative_order",
    "fractions",
    "word_translate",
    "percent_ratio",
    "algebra_shift",
    "powers_roots",
    "word_translate",
    "fractions",
    "algebra_shift",
    "percent_ratio",
  ];

  const questions: MathGymQuestion[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    const cat: MathGymCoreCategory =
      category === "mixed" ? mixedCycle[i % mixedCycle.length] : category;
    questions.push(generateForCategory(cat, rand, `gym-${seed}-${i + 1}`));
  }
  return questions;
}
