import { NODE_IDS } from "./node-ids";
import type { QuestionTemplateEntity } from "./types";

export const SEED_TEMPLATES: QuestionTemplateEntity[] = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    skillNodeId: NODE_IDS.PK_T2_RATE,
    subtest: "PK",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000004",
    templateTitle: "PK Perbandingan Berbalik Nilai (Pekerja vs Hari)",
    stemTemplateLatex:
      "Sebuah tim yang terdiri atas {{w1}} orang teknisi dapat merampungkan instalasi jaringan dalam waktu {{d1}} hari. Jika pengelola menambah {{extra}} orang teknisi baru dengan kecepatan kerja setara sejak hari pertama, waktu penyelesaian proyek tersebut menjadi $\\dots$",
    sbiSchemaType: "inverse_proportion_work",
    polyaVariablesSchema: [
      { symbol: "w1", role: "known", labelId: "Jumlah teknisi awal" },
      { symbol: "d1", role: "known", labelId: "Durasi awal (hari)" },
      { symbol: "extra", role: "known", labelId: "Tambahan teknisi" },
      { symbol: "d2", role: "unknown", labelId: "Durasi selesai baru (hari)" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Kenali bahwa total beban kerja bersifat konstan (perbandingan berbalik nilai).",
        formulaTemplateLatex: "W = {{w1}} \\times {{d1}}",
      },
      {
        stage: "setup",
        instructionTemplate: "Hitung jumlah pekerja baru w2 = {{w1}} + {{extra}} = {{w2}} orang.",
        formulaTemplateLatex: "{{w1}} \\cdot {{d1}} = {{w2}} \\cdot d_2",
      },
      {
        stage: "solve",
        instructionTemplate: "Bagi total beban kerja dengan jumlah pekerja baru.",
        formulaTemplateLatex: "d_2 = \\frac{{{w1}} \\times {{d1}}}{{{w2}}}",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var w1 = r.pick([8, 10, 12, 15, 18]);
  var extra = r.pick([2, 3, 4, 5, 6]);
  var m = r.pick([2, 3]);
  var w2 = w1 + extra;
  var d1 = w2 * m;

  var totalWork = new Fraction(w1 * d1);
  var d2 = totalWork.div(w2);

  // Mathematically ordered distinct distractors:
  // trapInverted (w1 / m) < trapSlip (d2 - 1) < d2 < trapAdditive (d1 - extra) < trapDirect
  var trapDirect = new Fraction(d1 * w2, w1);
  var trapAdditive = new Fraction(d1 - extra);
  var trapInverted = new Fraction(w1 * w2, d1);
  var trapSlip = d2.sub(1);

  function fmt(f) {
    return f.d === 1 ? String(f.n) : "\\\\frac{" + f.n + "}{" + f.d + "}";
  }

  return {
    params: { w1: String(w1), d1: String(d1), extra: String(extra), w2: String(w2) },
    correct: { canonical: d2.toFraction(false), display_latex: fmt(d2) + " \\\\text{ hari}" },
    distractors: [
      { canonical: trapDirect.toFraction(false), display_latex: fmt(trapDirect) + " \\\\text{ hari}", trap_type: "formula_misapplication", rationale: "Keliru memakai perbandingan senilai." },
      { canonical: trapAdditive.toFraction(false), display_latex: fmt(trapAdditive) + " \\\\text{ hari}", trap_type: "translation_error", rationale: "Mengurangi hari secara linear (d1 - extra)." },
      { canonical: trapInverted.toFraction(false), display_latex: fmt(trapInverted) + " \\\\text{ hari}", trap_type: "arithmetic_slip", rationale: "Terbalik mengalikan pekerja awal dengan pekerja baru." },
      { canonical: trapSlip.toFraction(false), display_latex: fmt(trapSlip) + " \\\\text{ hari}", trap_type: "arithmetic_slip", rationale: "Selip hitung pengurangan satu satuan pada langkah akhir." }
    ],
    feasibility_assertions: [
      w1 > 0 && d1 > 0 && w2 > w1,
      d2.valueOf() > 0 && d2.valueOf() < d1,
      trapInverted.valueOf() < trapSlip.valueOf() && trapSlip.valueOf() < d2.valueOf(),
      d2.valueOf() < trapAdditive.valueOf() && trapAdditive.valueOf() < trapDirect.valueOf()
    ]
  };
}`,
    parameterBoundsJson: { w1: [6, 15], d1: [10, 32], extra: [3, 8] },
    codeSha256: "seed_template_pk_rate_v1_000000000000000000000000000000000000001",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    skillNodeId: NODE_IDS.PM_T2_LIN,
    subtest: "PM",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000012",
    templateTitle: "PM Optimasi Margin Kontribusi & Target Laba",
    stemTemplateLatex:
      "Sebuah unit usaha kampus memproduksi paket modul belajar dengan biaya tetap harian $\\text{Rp}{{fixed_k}}.000$ dan biaya variabel $\\text{Rp}{{var_k}}.000$ per paket. Jika setiap paket dijual seharga $\\text{Rp}{{price_k}}.000$, jumlah minimal paket yang wajib terjual agar usaha mencatat keuntungan bersih minimal $\\text{Rp}{{profit_k}}.000$ adalah $\\dots$",
    sbiSchemaType: "linear_profit_breakeven",
    polyaVariablesSchema: [
      { symbol: "fixed_k", role: "known", labelId: "Biaya tetap (ribu Rp)" },
      { symbol: "var_k", role: "known", labelId: "Biaya variabel per unit (ribu Rp)" },
      { symbol: "price_k", role: "known", labelId: "Harga jual per unit (ribu Rp)" },
      { symbol: "profit_k", role: "constraint", labelId: "Target keuntungan bersih (ribu Rp)" },
      { symbol: "n", role: "unknown", labelId: "Jumlah minimal paket" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Hitung margin kontribusi bersih per paket: harga jual {{price_k}}.000 dikurangi biaya variabel {{var_k}}.000.",
        formulaTemplateLatex: "m = ({{price_k}} - {{var_k}}) \\times 1.000",
      },
      {
        stage: "setup",
        instructionTemplate: "Jumlahkan biaya tetap {{fixed_k}}.000 dan target laba {{profit_k}}.000.",
        formulaTemplateLatex: "m \\cdot n \\ge ({{fixed_k}} + {{profit_k}}) \\times 1.000",
      },
      {
        stage: "solve",
        instructionTemplate: "Bagi total target kontribusi dengan margin per paket.",
        formulaTemplateLatex: "n = \\frac{{{fixed_k}} + {{profit_k}}}{{{price_k}} - {{var_k}}}",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var margin = r.pick([6, 8, 10, 12]);
  var var_k = r.pick([11, 13, 15, 17]);
  var price_k = var_k + margin;
  var n = r.int(24, 48);
  var totalNeed = margin * n;
  var fixedRatio = r.pick([5, 6]);
  var fixed_k = Math.floor((totalNeed * fixedRatio) / 10);
  fixed_k = fixed_k - (fixed_k % 2);
  var profit_k = totalNeed - fixed_k;

  var trapBreakeven = new Fraction(Math.ceil(fixed_k / margin));
  var trapGrossPrice = new Fraction(totalNeed, price_k);
  var trapVarDiv = new Fraction(totalNeed, var_k);
  var trapSignDiff = new Fraction(Math.abs(fixed_k - profit_k) + margin, margin);

  function fmt(f) {
    return f.d === 1 ? String(f.n) : "\\\\frac{" + f.n + "}{" + f.d + "}";
  }

  return {
    params: {
      fixed_k: String(fixed_k),
      var_k: String(var_k),
      price_k: String(price_k),
      profit_k: String(profit_k)
    },
    correct: { canonical: String(n), display_latex: String(n) + " \\\\text{ paket}" },
    distractors: [
      { canonical: trapBreakeven.toFraction(false), display_latex: fmt(trapBreakeven) + " \\\\text{ paket}", trap_type: "formula_misapplication", rationale: "Hanya menghitung titik impas tanpa memasukkan target laba." },
      { canonical: trapGrossPrice.toFraction(false), display_latex: fmt(trapGrossPrice) + " \\\\text{ paket}", trap_type: "formula_misapplication", rationale: "Membagi target total dengan harga jual kotor, lupa biaya variabel." },
      { canonical: trapVarDiv.toFraction(false), display_latex: fmt(trapVarDiv) + " \\\\text{ paket}", trap_type: "formula_misapplication", rationale: "Membagi dengan biaya variabel alih-alih margin kontribusi." },
      { canonical: trapSignDiff.toFraction(false), display_latex: fmt(trapSignDiff) + " \\\\text{ paket}", trap_type: "sign_error", rationale: "Mengurangkan target laba dari biaya tetap." }
    ],
    feasibility_assertions: [
      margin > 0 && fixed_k > 0 && profit_k > 0,
      fixed_k + profit_k === margin * n,
      n >= 20
    ]
  };
}`,
    parameterBoundsJson: { margin: [6, 12], n: [24, 48] },
    codeSha256: "seed_template_pm_lin_v1_0000000000000000000000000000000000000002",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    skillNodeId: NODE_IDS.PU_T1_SYL,
    subtest: "PU",
    tier: "tier_1_core",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000008",
    templateTitle: "PU Silogisme Kontraposisi & Modus Tollens (SAT-Verified)",
    stemTemplateLatex:
      "Diketahui premis berikut berlaku benar:\n1. Jika {{p_stmt}}, maka {{q_stmt}}.\n2. {{q_neg_stmt}} atau {{r_stmt}}.\n3. Fakta menunjukkan {{r_neg_stmt}}.\n\nSimpulan deduktif yang pasti sah adalah $\\dots$",
    sbiSchemaType: "syllogism_modus_tollens",
    polyaVariablesSchema: [
      { symbol: "P", role: "known", labelId: "Proposisi P" },
      { symbol: "Q", role: "known", labelId: "Proposisi Q" },
      { symbol: "R", role: "known", labelId: "Proposisi R" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Konversi premis kedua (~Q v R) menjadi bentuk implikasi Q -> R.",
        formulaTemplateLatex: "\\neg Q \\lor R \\equiv (Q \\to R)",
      },
      {
        stage: "setup",
        instructionTemplate: "Gabungkan rantai silogisme P -> Q dan Q -> R menjadi P -> R.",
        formulaTemplateLatex: "(P \\to Q) \\land (Q \\to R) \\implies (P \\to R)",
      },
      {
        stage: "solve",
        instructionTemplate: "Dengan fakta ~R, terapkan Modus Tollens untuk menarik kesimpulan pasti ~P.",
        formulaTemplateLatex: "(P \\to R) \\land \\neg R \\vdash \\neg P",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var scenarios = [
    {
      p_pos: "siswa menguasai operasi pecahan dasar",
      p_neg: "Siswa tidak menguasai operasi pecahan dasar.",
      q_pos: "ia menyelesaikan soal perbandingan dengan tepat",
      q_neg: "Ia tidak menyelesaikan soal perbandingan dengan tepat",
      r_pos: "skor PK meningkat di atas 750",
      r_neg: "skor PK tidak meningkat di atas 750",
      r_neg_cap: "Skor PK tidak meningkat di atas 750."
    },
    {
      p_pos: "tim riset menstandarkan kalibrasi sensor",
      p_neg: "Tim riset tidak menstandarkan kalibrasi sensor.",
      q_pos: "data lapangan terbaca konsisten",
      q_neg: "Data lapangan tidak terbaca konsisten",
      r_pos: "laporan evaluasi disetujui komite",
      r_neg: "laporan evaluasi tidak disetujui komite",
      r_neg_cap: "Laporan evaluasi tidak disetujui komite."
    },
    {
      p_pos: "jalur pengumpan bus terintegrasi dengan perumahan",
      p_neg: "Jalur pengumpan bus tidak terintegrasi dengan perumahan.",
      q_pos: "pekerja beralih ke angkutan umum secara rutin",
      q_neg: "Pekerja tidak beralih ke angkutan umum secara rutin",
      r_pos: "kemacetan jam sibuk berkurang signifikan",
      r_neg: "kemacetan jam sibuk tidak berkurang signifikan",
      r_neg_cap: "Kemacetan jam sibuk tidak berkurang signifikan."
    }
  ];
  var sc = r.pick(scenarios);
  // Propositional variables: 1 = P, 2 = Q, 3 = R
  // Premises CNF: (-1 v 2) [P->Q], (-2 v 3) [~Q v R], (-3) [~R]
  var premisesCnf = [[-1, 2], [-2, 3], [-3]];
  var models = satSolve(3, premisesCnf);
  var allNotP = models.length > 0 && models.every(function (m) { return m[1] === false && m[2] === false; });

  return {
    params: {
      p_stmt: sc.p_pos,
      q_stmt: sc.q_pos,
      q_neg_stmt: sc.q_neg,
      r_stmt: sc.r_pos,
      r_neg_stmt: sc.r_neg
    },
    logic_check: {
      num_vars: 3,
      premises_cnf: premisesCnf,
      entailed_literal: -1
    },
    correct: {
      canonical: "logic:var_-1",
      display_latex: "\\\\text{" + sc.p_neg + "}"
    },
    distractors: [
      { canonical: "logic:var_1", display_latex: "\\\\text{" + sc.p_pos.charAt(0).toUpperCase() + sc.p_pos.slice(1) + ".}", trap_type: "sign_error", rationale: "Bertentangan langsung dengan hasil Modus Tollens." },
      { canonical: "logic:var_2", display_latex: "\\\\text{" + sc.q_pos.charAt(0).toUpperCase() + sc.q_pos.slice(1) + ".}", trap_type: "formula_misapplication", rationale: "Gagal menarik ~Q dari premis disjungsi dan ~R." },
      { canonical: "logic:var_3", display_latex: "\\\\text{" + sc.r_pos.charAt(0).toUpperCase() + sc.r_pos.slice(1) + ".}", trap_type: "sign_error", rationale: "Berlawanan dengan fakta premis ketiga." },
      { canonical: "logic:indeterminate", display_latex: "\\\\text{Tidak dapat ditarik simpulan deduktif apa pun.}", trap_type: "unsupported_inference", rationale: "Mengabaikan rantai silogisme kontraposisi yang sahih." }
    ],
    feasibility_assertions: [allNotP === true]
  };
}`,
    parameterBoundsJson: { scenario_count: 3 },
    codeSha256: "seed_template_pu_syl_v1_0000000000000000000000000000000000000003",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000004",
    skillNodeId: NODE_IDS.PK_T0_FRAC,
    subtest: "PK",
    tier: "tier_0_foundation",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000001",
    templateTitle: "PK Tier 0 Operasi Pecahan & Tanda Negatif",
    stemTemplateLatex:
      "Hitung hasil paling sederhana dari operasi pecahan berikut: $\\dfrac{{{a}}}{{{b}}} - \\dfrac{{{c}}}{{{d}}} + \\dfrac{{{e}}}{{{f}}} = \\dots$",
    sbiSchemaType: "fraction_signed_arithmetic",
    polyaVariablesSchema: [
      { symbol: "a", role: "known", labelId: "Pembilang pertama" },
      { symbol: "b", role: "known", labelId: "Penyebut pertama" },
      { symbol: "c", role: "known", labelId: "Pembilang kedua" },
      { symbol: "d", role: "known", labelId: "Penyebut kedua" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Samakan penyebut ketiga pecahan ke KPK dari {{b}}, {{d}}, dan {{f}}.",
        formulaTemplateLatex: "\\dfrac{{{a}}}{{{b}}} - \\dfrac{{{c}}}{{{d}}} + \\dfrac{{{e}}}{{{f}}}",
      },
      {
        stage: "solve",
        instructionTemplate: "Operasikan pembilang dari kiri ke kanan dengan teliti pada tanda minus, lalu sederhanakan.",
        formulaTemplateLatex: "\\dfrac{{{a}}}{{{b}}} - \\dfrac{{{c}}}{{{d}}} + \\dfrac{{{e}}}{{{f}}}",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var sets = [
    { a: 3, b: 4, c: 5, d: 6, e: 1, f: 2 },
    { a: 5, b: 6, c: 3, d: 4, e: 1, f: 3 },
    { a: 2, b: 3, c: 3, d: 4, e: 5, f: 6 },
    { a: 4, b: 5, c: 1, d: 2, e: 3, f: 10 },
    { a: 7, b: 8, c: 3, d: 4, e: 1, f: 2 }
  ];
  var s = r.pick(sets);
  var f1 = new Fraction(s.a, s.b);
  var f2 = new Fraction(s.c, s.d);
  var f3 = new Fraction(s.e, s.f);
  var ans = f1.sub(f2).add(f3);

  var trapAddAll = f1.add(f2).add(f3);
  var trapSubAll = f1.sub(f2).sub(f3);
  var trapNeg = new Fraction(0).sub(ans);
  var trapPlusHalf = ans.add(new Fraction(1, 4));

  function fmt(fr) {
    var sign = fr.valueOf() < 0 ? "-" : "";
    var num = Math.abs(fr.n);
    if (fr.d === 1) return sign + String(num);
    return sign + "\\\\dfrac{" + num + "}{" + fr.d + "}";
  }

  return {
    params: { a: String(s.a), b: String(s.b), c: String(s.c), d: String(s.d), e: String(s.e), f: String(s.f) },
    correct: { canonical: ans.toFraction(false), display_latex: fmt(ans) },
    distractors: [
      { canonical: trapAddAll.toFraction(false), display_latex: fmt(trapAddAll), trap_type: "sign_error", rationale: "Keliru menjumlahkan seluruh suku tanpa mengurangkan pecahan tengah." },
      { canonical: trapSubAll.toFraction(false), display_latex: fmt(trapSubAll), trap_type: "sign_error", rationale: "Keliru mengurangkan pecahan terakhir yang seharusnya ditambah." },
      { canonical: trapNeg.toFraction(false), display_latex: fmt(trapNeg), trap_type: "sign_error", rationale: "Terbalik tanda positif/negatif pada hasil akhir." },
      { canonical: trapPlusHalf.toFraction(false), display_latex: fmt(trapPlusHalf), trap_type: "arithmetic_slip", rationale: "Selip hitung saat menyamakan penyebut pecahan." }
    ],
    feasibility_assertions: [
      ans.valueOf() > 0,
      ans.valueOf() !== trapAddAll.valueOf(),
      ans.valueOf() !== trapSubAll.valueOf()
    ]
  };
}`,
    parameterBoundsJson: { sets: 5 },
    codeSha256: "seed_template_pk_frac_v1_000000000000000000000000000000000000004",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000005",
    skillNodeId: NODE_IDS.PK_T0_ALG,
    subtest: "PK",
    tier: "tier_0_foundation",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000002",
    templateTitle: "PK Tier 0 Persamaan Linear & Distribusi Kurung",
    stemTemplateLatex:
      "Diketahui persamaan linear ${{k}}({{a}}x - {{b}}) = {{c}}x + {{rhs}}$. Nilai dari $x + {{shift}}$ adalah $\\dots$",
    sbiSchemaType: "linear_single_variable",
    polyaVariablesSchema: [
      { symbol: "x", role: "unknown", labelId: "Nilai variabel x" },
      { symbol: "shift", role: "known", labelId: "Konstanta tambahan target" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Kalikan {{k}} ke seluruh suku di dalam tanda kurung.",
        formulaTemplateLatex: "{{ka}}x - {{kb}} = {{c}}x + {{rhs}}",
      },
      {
        stage: "solve",
        instructionTemplate: "Kumpulkan suku x di kiri dan konstanta di kanan, lalu tambahkan {{shift}} pada x.",
        formulaTemplateLatex: "x + {{shift}}",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var k = r.pick([2, 3, 4]);
  var a = r.pick([2, 3]);
  var c = k * a - r.pick([2, 3]);
  var x = r.int(3, 9);
  var b = r.int(2, 6);
  var rhs = k * (a * x - b) - c * x;
  var shift = r.pick([2, 3, 4]);
  var target = x + shift;

  var trapOnlyX = x;
  var trapSubShift = x - shift;
  var trapDouble = target + 2;
  var trapOffOne = target + 1;

  return {
    params: {
      k: String(k),
      a: String(a),
      b: String(b),
      c: String(c),
      rhs: String(rhs),
      ka: String(k * a),
      kb: String(k * b),
      shift: String(shift)
    },
    correct: { canonical: String(target), display_latex: String(target) },
    distractors: [
      { canonical: String(trapOnlyX), display_latex: String(trapOnlyX), trap_type: "formula_misapplication", rationale: "Berhenti di nilai x, lupa soal menanyakan x + " + shift + "." },
      { canonical: String(trapSubShift), display_latex: String(trapSubShift), trap_type: "sign_error", rationale: "Keliru mengurangkan shift alih-alih menambahkan." },
      { canonical: String(trapOffOne), display_latex: String(trapOffOne), trap_type: "arithmetic_slip", rationale: "Selip hitung satu satuan saat membagi koefisien x." },
      { canonical: String(trapDouble), display_latex: String(trapDouble), trap_type: "arithmetic_slip", rationale: "Selip hitung dua satuan pada penjumlahan konstanta." }
    ],
    feasibility_assertions: [
      k * (a * x - b) === c * x + rhs,
      trapSubShift < trapOnlyX && trapOnlyX < target && target < trapOffOne && trapOffOne < trapDouble
    ]
  };
}`,
    parameterBoundsJson: { x: [3, 9] },
    codeSha256: "seed_template_pk_alg_v1_0000000000000000000000000000000000000005",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000006",
    skillNodeId: NODE_IDS.PM_T1_PCT,
    subtest: "PM",
    tier: "tier_1_core",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000011",
    templateTitle: "PM Diskon Bertingkat (Faktor Pengali Berantai)",
    stemTemplateLatex:
      "Sebuah toko buku menjual paket persiapan SNBT seharga $\\text{Rp}{{price_k}}.000$. Pada pekan promo, toko memberi diskon ${{d1}}\\%$ lalu memberikan diskon tambahan ${{d2}}\\%$ khusus bagi pembeli yang membayar non-tunai. Harga akhir yang harus dibayar adalah $\\dots$",
    sbiSchemaType: "chained_discount_multiplier",
    polyaVariablesSchema: [
      { symbol: "price_k", role: "known", labelId: "Harga awal (ribu Rp)" },
      { symbol: "d1", role: "known", labelId: "Diskon pertama (%)" },
      { symbol: "d2", role: "known", labelId: "Diskon tambahan (%)" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Ubah diskon {{d1}}% dan {{d2}}% menjadi porsi bayarnya lalu kalikan berantai.",
        formulaTemplateLatex: "\\text{Harga Akhir} = {{price_k}}.000 \\times (1 - 0{,}{{d1}}) \\times (1 - 0{,}{{d2}})",
      },
      {
        stage: "solve",
        instructionTemplate: "Kalikan hasil tahap pertama dengan pengali diskon kedua.",
        formulaTemplateLatex: "\\text{Harga Akhir}",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var price_k = r.pick([200, 300, 400, 500]);
  var pairs = [
    { d1: 20, d2: 25 },
    { d1: 20, d2: 10 },
    { d1: 30, d2: 20 },
    { d1: 10, d2: 20 }
  ];
  var pair = r.pick(pairs);
  var d1 = pair.d1;
  var d2 = pair.d2;

  var after1 = (price_k * (100 - d1)) / 100;
  var final_k = (after1 * (100 - d2)) / 100;
  var trapAdditive = (price_k * (100 - (d1 + d2))) / 100;
  var trapOnlyFirst = after1;
  var trapOnlySecond = (price_k * (100 - d2)) / 100;
  var trapSlip = final_k + 5;

  function fmtRp(kVal) {
    return "\\\\text{Rp}" + String(kVal) + ".000";
  }

  return {
    params: { price_k: String(price_k), d1: String(d1), d2: String(d2) },
    correct: { canonical: String(final_k), display_latex: fmtRp(final_k) },
    distractors: [
      { canonical: String(trapAdditive), display_latex: fmtRp(trapAdditive), trap_type: "formula_misapplication", rationale: "Salah menjumlahkan diskon " + d1 + "% + " + d2 + "% langsung." },
      { canonical: String(trapOnlyFirst), display_latex: fmtRp(trapOnlyFirst), trap_type: "arithmetic_slip", rationale: "Berhenti setelah diskon tahap pertama saja." },
      { canonical: String(trapOnlySecond), display_latex: fmtRp(trapOnlySecond), trap_type: "arithmetic_slip", rationale: "Hanya menerapkan diskon kedua tanpa diskon pertama." },
      { canonical: String(trapSlip), display_latex: fmtRp(trapSlip), trap_type: "arithmetic_slip", rationale: "Selip hitung persentase diskon tahap kedua." }
    ],
    feasibility_assertions: [
      Number.isInteger(final_k),
      trapAdditive < final_k,
      final_k < trapOnlyFirst,
      final_k < trapOnlySecond
    ]
  };
}`,
    parameterBoundsJson: { price_k: [200, 500] },
    codeSha256: "seed_template_pm_pct_v1_0000000000000000000000000000000000000006",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000007",
    skillNodeId: NODE_IDS.PK_T1_LIN,
    subtest: "PK",
    tier: "tier_1_core",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000003",
    templateTitle: "PK Barisan Aritmetika (Selisih Dua Suku ke Suku ke-n)",
    stemTemplateLatex:
      "Diketahui sebuah barisan aritmetika memiliki suku ke-${{p}}$ bernilai ${{up}}$ dan suku ke-${{q}}$ bernilai ${{uq}}$. Nilai suku ke-${{n}}$ barisan tersebut adalah $\\dots$",
    sbiSchemaType: "arithmetic_sequence_two_terms",
    polyaVariablesSchema: [
      { symbol: "up", role: "known", labelId: "Nilai suku ke-p" },
      { symbol: "uq", role: "known", labelId: "Nilai suku ke-q" },
      { symbol: "n", role: "unknown", labelId: "Indeks target suku ke-n" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Hitung beda konstan b melalui selisih nilai dan selisih indeks {{q}} - {{p}}.",
        formulaTemplateLatex: "b = \\dfrac{{{uq}} - {{up}}}{{{q}} - {{p}}}",
      },
      {
        stage: "solve",
        instructionTemplate: "Lompat dari suku ke-{{q}} sejauh ({{n}} - {{q}}) langkah beda b.",
        formulaTemplateLatex: "U_{{{n}}} = {{uq}} + ({{n}} - {{q}})b",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var b = r.int(3, 7);
  var a = r.int(2, 11);
  var p = r.pick([2, 3]);
  var q = p + r.pick([3, 4]);
  var n = q + r.pick([3, 5, 6]);
  var up = a + (p - 1) * b;
  var uq = a + (q - 1) * b;
  var un = a + (n - 1) * b;

  var trapPlusB = un + b;
  var trapMinusB = un - b;
  var trapDoubleB = un + 2 * b;
  var trapSumTerms = up + uq;

  return {
    params: { p: String(p), q: String(q), n: String(n), up: String(up), uq: String(uq) },
    correct: { canonical: String(un), display_latex: String(un) },
    distractors: [
      { canonical: String(trapPlusB), display_latex: String(trapPlusB), trap_type: "formula_misapplication", rationale: "Keliru memakai rumus a + n*b tanpa mengurangkan 1 pada indeks." },
      { canonical: String(trapMinusB), display_latex: String(trapMinusB), trap_type: "arithmetic_slip", rationale: "Kurang satu langkah penjumlahan beda dari suku ke-q." },
      { canonical: String(trapDoubleB), display_latex: String(trapDoubleB), trap_type: "arithmetic_slip", rationale: "Kelebihan dua langkah beda saat melompat ke suku target." },
      { canonical: String(trapSumTerms), display_latex: String(trapSumTerms), trap_type: "formula_misapplication", rationale: "Langsung menjumlahkan nilai kedua suku yang diketahui." }
    ],
    feasibility_assertions: [
      b >= 3,
      uq - up === (q - p) * b,
      un !== trapSumTerms && trapMinusB < un && un < trapPlusB && trapPlusB < trapDoubleB
    ]
  };
}`,
    parameterBoundsJson: { b: [3, 7] },
    codeSha256: "seed_template_pk_seq_v1_0000000000000000000000000000000000000007",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000008",
    skillNodeId: NODE_IDS.PK_T2_QUAD,
    subtest: "PK",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000005",
    templateTitle: "PK Identitas Vieta Jumlah Kuadrat Akar",
    stemTemplateLatex:
      "Jika $\\alpha$ dan $\\beta$ adalah akar-akar real persamaan kuadrat $x^2 - {{s}}x + {{p}} = 0$, maka nilai dari $\\alpha^2 + \\beta^2$ adalah $\\dots$",
    sbiSchemaType: "vieta_symmetric_sum_squares",
    polyaVariablesSchema: [
      { symbol: "s", role: "known", labelId: "Jumlah akar (alpha + beta)" },
      { symbol: "p", role: "known", labelId: "Hasil kali akar (alpha * beta)" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Baca jumlah dan hasil kali akar langsung dari koefisien Vieta.",
        formulaTemplateLatex: "\\alpha + \\beta = {{s}}, \\quad \\alpha\\beta = {{p}}",
      },
      {
        stage: "solve",
        instructionTemplate: "Terapkan identitas kuadrat jumlah dikurangi 2 kali hasil kali akar.",
        formulaTemplateLatex: "\\alpha^2 + \\beta^2 = ({{s}})^2 - 2({{p}})",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var s = r.pick([5, 6, 7, 8, 9]);
  var p = r.pick([2, 3, 4, 5]);
  var disc = s * s - 4 * p;
  var ans = s * s - 2 * p;

  var trapOnlySquare = s * s;
  var trapPlusTwoP = s * s + 2 * p;
  var trapMinusOneP = s * s - p;
  var trapDisc = disc;

  return {
    params: { s: String(s), p: String(p) },
    correct: { canonical: String(ans), display_latex: String(ans) },
    distractors: [
      { canonical: String(trapOnlySquare), display_latex: String(trapOnlySquare), trap_type: "formula_misapplication", rationale: "Mengira jumlah kuadrat akar sama dengan kuadrat jumlah akar tanpa dikurangi 2 kali hasil kali akar." },
      { canonical: String(trapPlusTwoP), display_latex: String(trapPlusTwoP), trap_type: "sign_error", rationale: "Keliru menukar tanda pengurang menjadi tambah 2*alpha*beta." },
      { canonical: String(trapMinusOneP), display_latex: String(trapMinusOneP), trap_type: "arithmetic_slip", rationale: "Lupa mengalikan faktor 2 pada suku hasil kali akar." },
      { canonical: String(trapDisc), display_latex: String(trapDisc), trap_type: "formula_misapplication", rationale: "Tertukar rumus identitas akar dengan rumus diskriminan b^2 - 4ac." }
    ],
    feasibility_assertions: [
      disc > 0,
      trapDisc < ans && ans < trapMinusOneP && trapMinusOneP < trapOnlySquare && trapOnlySquare < trapPlusTwoP
    ]
  };
}`,
    parameterBoundsJson: { s: [5, 9], p: [2, 5] },
    codeSha256: "seed_template_pk_vta_v1_0000000000000000000000000000000000000008",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000009",
    skillNodeId: NODE_IDS.PM_T2_LIN,
    subtest: "PM",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000012",
    templateTitle: "PM Statistika Rata-Rata Gabungan Berbobot",
    stemTemplateLatex:
      "Kelas A berjumlah ${{n1}}$ siswa memiliki rata-rata nilai tryout ${{x1}}$, sedangkan Kelas B berjumlah ${{n2}}$ siswa memiliki rata-rata nilai ${{x2}}$. Rata-rata nilai gabungan kedua kelas tersebut adalah $\\dots$",
    sbiSchemaType: "weighted_combined_mean",
    polyaVariablesSchema: [
      { symbol: "n1", role: "known", labelId: "Banyak siswa kelas A" },
      { symbol: "x1", role: "known", labelId: "Rata-rata kelas A" },
      { symbol: "n2", role: "known", labelId: "Banyak siswa kelas B" },
      { symbol: "x2", role: "known", labelId: "Rata-rata kelas B" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Hitung total skor masing-masing kelas sebelum dibagi jumlah seluruh siswa.",
        formulaTemplateLatex: "\\sum X = ({{n1}} \\times {{x1}}) + ({{n2}} \\times {{x2}})",
      },
      {
        stage: "solve",
        instructionTemplate: "Bagi total skor gabungan dengan ({{n1}} + {{n2}}).",
        formulaTemplateLatex: "\\bar{x}_{\\text{gab}} = \\dfrac{{{n1}}({{x1}}) + {{n2}}({{x2}})}{{{n1}} + {{n2}}}",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var m1 = r.pick([2, 3]);
  var k = r.pick([6, 8, 10]);
  var n1 = m1 * k;
  var n2 = k;
  var t = r.pick([2, 3, 4]);
  var x1 = r.pick([68, 70, 72, 74]);
  var x2 = x1 + 2 * (m1 + 1) * t;
  var ans = (m1 * x1 + x2) / (m1 + 1);
  var trapUnweighted = (x1 + x2) / 2;
  var trapPlusOne = ans + 1;
  var trapMinusTwo = ans - 2;
  var trapCloserRight = x2 - t;

  return {
    params: { n1: String(n1), n2: String(n2), x1: String(x1), x2: String(x2) },
    correct: { canonical: String(ans), display_latex: String(ans) },
    distractors: [
      { canonical: String(trapUnweighted), display_latex: String(trapUnweighted), trap_type: "formula_misapplication", rationale: "Langsung merata-ratakan dua nilai kelas tanpa memperhitungkan bobot jumlah siswanya." },
      { canonical: String(trapPlusOne), display_latex: String(trapPlusOne), trap_type: "arithmetic_slip", rationale: "Selip hitung satu satuan saat membagi total nilai gabungan." },
      { canonical: String(trapMinusTwo), display_latex: String(trapMinusTwo), trap_type: "arithmetic_slip", rationale: "Selip hitung pengurangan saat menaksir bobot selisih." },
      { canonical: String(trapCloserRight), display_latex: String(trapCloserRight), trap_type: "sign_error", rationale: "Keliru membobotkan rata-rata gabungan lebih dekat ke kelas yang siswanya lebih sedikit." }
    ],
    feasibility_assertions: [
      Number.isInteger(ans),
      Number.isInteger(trapUnweighted),
      trapMinusTwo < ans && ans < trapPlusOne && trapPlusOne < trapUnweighted && trapUnweighted < trapCloserRight
    ]
  };
}`,
    parameterBoundsJson: { m1: [2, 3], k: [6, 10] },
    codeSha256: "seed_template_pm_avg_v1_0000000000000000000000000000000000000009",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000010",
    skillNodeId: NODE_IDS.PM_T3_PROB,
    subtest: "PM",
    tier: "tier_3_hots_800",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: "20000000-0000-4000-8000-000000000013",
    templateTitle: "PM Peluang Pengambilan Berurutan Tanpa Pengembalian",
    stemTemplateLatex:
      "Sebuah kotak berisi ${{red}}$ bola merah dan ${{blue}}$ bola biru. Jika diambil $2$ bola satu per satu **tanpa pengembalian**, peluang terambilnya kedua bola berwarna **merah** adalah $\\dots$",
    sbiSchemaType: "probability_without_replacement",
    polyaVariablesSchema: [
      { symbol: "red", role: "known", labelId: "Jumlah bola merah" },
      { symbol: "blue", role: "known", labelId: "Jumlah bola biru" },
    ],
    solutionStepTemplates: [
      {
        stage: "deconstruct",
        instructionTemplate: "Hitung total ruang sampel awal ({{red}} + {{blue}}) dan kurangi 1 pada pengambilan kedua.",
        formulaTemplateLatex: "P(M_1) = \\dfrac{{{red}}}{{{total}}}, \\quad P(M_2 \\mid M_1) = \\dfrac{{{red_minus_1}}}{{{total_minus_1}}}",
      },
      {
        stage: "solve",
        instructionTemplate: "Kalikan kedua peluang bersyarat lalu sederhanakan pecahannya.",
        formulaTemplateLatex: "\\dfrac{{{red}}}{{{total}}} \\times \\dfrac{{{red_minus_1}}}{{{total_minus_1}}}",
      },
    ],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var red = r.pick([4, 5, 6]);
  var blue = r.pick([3, 4, 5]);
  var total = red + blue;

  var p1 = new Fraction(red, total);
  var p2 = new Fraction(red - 1, total - 1);
  var ans = p1.mul(p2);

  var trapWithReplacement = p1.mul(p1);
  var trapOnlyDenom = new Fraction(red * red, total * (total - 1));
  var trapComplement = new Fraction(1).sub(ans);
  var trapOneBall = p1;

  function fmt(f) {
    return f.d === 1 ? String(f.n) : "\\\\dfrac{" + f.n + "}{" + f.d + "}";
  }

  return {
    params: {
      red: String(red),
      blue: String(blue),
      total: String(total),
      red_minus_1: String(red - 1),
      total_minus_1: String(total - 1)
    },
    correct: { canonical: ans.toFraction(false), display_latex: fmt(ans) },
    distractors: [
      { canonical: trapWithReplacement.toFraction(false), display_latex: fmt(trapWithReplacement), trap_type: "formula_misapplication", rationale: "Menggunakan model dengan pengembalian sehingga ruang sampel tidak berkurang 1." },
      { canonical: trapOnlyDenom.toFraction(false), display_latex: fmt(trapOnlyDenom), trap_type: "arithmetic_slip", rationale: "Hanya mengurangi total bola penyebut, lupa mengurangi pembilang bola merah tersisa." },
      { canonical: trapComplement.toFraction(false), display_latex: fmt(trapComplement), trap_type: "sign_error", rationale: "Tertukar menghitung peluang komplemen (tidak keduanya merah)." },
      { canonical: trapOneBall.toFraction(false), display_latex: fmt(trapOneBall), trap_type: "formula_misapplication", rationale: "Hanya menghitung peluang pengambilan bola pertama." }
    ],
    feasibility_assertions: [
      ans.valueOf() > 0 && ans.valueOf() < trapWithReplacement.valueOf(),
      trapWithReplacement.valueOf() < trapOnlyDenom.valueOf(),
      trapOnlyDenom.valueOf() < trapOneBall.valueOf(),
      ans.valueOf() < trapComplement.valueOf()
    ]
  };
}`,
    parameterBoundsJson: { red: [4, 6], blue: [3, 5] },
    codeSha256: "seed_template_pm_prb_v1_0000000000000000000000000000000000000010",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000011",
    skillNodeId: NODE_IDS.PK_T1_EXP,
    subtest: "PK",
    tier: "tier_1_core",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PK Persamaan Eksponen Beda Basis (4^{x+p} = 2^{x+q})",
    stemTemplateLatex: "Nilai bilangan real $x$ yang memenuhi persamaan eksponen $4^{x + {{p}}} = 2^{x + {{q}}}$ adalah $\\dots$",
    sbiSchemaType: "exponential_same_base_reduction",
    polyaVariablesSchema: [{"symbol":"p","role":"known","labelId":"Konstanta pangkat basis 4"},{"symbol":"q","role":"known","labelId":"Konstanta pangkat basis 2"},{"symbol":"x","role":"unknown","labelId":"Solusi variabel x"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Ubah basis 4 menjadi 2^2 dan kalikan eksponennya.","formulaTemplateLatex":"2^{2(x + {{p}})} = 2^{x + {{q}}}"},{"stage":"setup","instructionTemplate":"Karena basis sudah sama, samakan kedua pangkat.","formulaTemplateLatex":"2x + {{two_p}} = x + {{q}}"},{"stage":"solve","instructionTemplate":"Selesaikan persamaan linear untuk x.","formulaTemplateLatex":"x = {{q}} - {{two_p}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var p = r.pick([1, 2, 3]);
  var x0 = r.pick([4, 5, 6, 7]);
  var q = x0 + 2 * p;

  var ans = new Fraction(x0);
  var trapNeg = new Fraction(-x0);
  var trapSubP = new Fraction(x0 - p);
  var trapAddP = new Fraction(x0 + p);
  var trapFourP = new Fraction(x0 + 4 * p);

  return {
    params: { p: String(p), q: String(q), two_p: String(2 * p), ans: String(x0) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapAddP.toFraction(false), display_latex: trapAddP.toFraction(false), trap_type: "formula_misapplication", rationale: "Lupa mengalikan konstanta p dengan eksponen 2 saat mengubah basis 4 menjadi 2^2." },
      { canonical: trapFourP.toFraction(false), display_latex: trapFourP.toFraction(false), trap_type: "sign_error", rationale: "Salah tanda saat memindahkan suku 2p ke ruas kanan." },
      { canonical: trapSubP.toFraction(false), display_latex: trapSubP.toFraction(false), trap_type: "arithmetic_slip", rationale: "Keliru mengurangkan p sekali tambahan." },
      { canonical: trapNeg.toFraction(false), display_latex: trapNeg.toFraction(false), trap_type: "sign_error", rationale: "Terbalik tanda akhir hasil penyelesaian linear." }
    ],
    feasibility_assertions: [
      trapNeg.valueOf() < trapSubP.valueOf(),
      trapSubP.valueOf() < ans.valueOf(),
      ans.valueOf() < trapAddP.valueOf(),
      trapAddP.valueOf() < trapFourP.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"p":[1,3],"x0":[4,7]},
    codeSha256: "ac99d888d29f21e25c4c277dd6487536eefc4f41f4f2038f73328250337856da",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000012",
    skillNodeId: NODE_IDS.PK_T1_EXP,
    subtest: "PK",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PK Sifat Penjumlahan & Pengurangan Logaritma Basis Sama",
    stemTemplateLatex: "Nilai dari ${}^{{{b}}}\\log {{A}} + {}^{{{b}}}\\log {{B}} - {}^{{{b}}}\\log {{C}}$ adalah $\\dots$",
    sbiSchemaType: "logarithm_combine_rules",
    polyaVariablesSchema: [{"symbol":"b","role":"known","labelId":"Basis logaritma"},{"symbol":"A","role":"known","labelId":"Numerus suku pertama"},{"symbol":"B","role":"known","labelId":"Numerus suku kedua"},{"symbol":"C","role":"known","labelId":"Numerus pengurang"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Nyatakan setiap numerus sebagai perpangkatan dari basis {{b}}.","formulaTemplateLatex":"{{A}}={{b}}^{{{p}}},\\; {{B}}={{b}}^{{{q}}},\\; {{C}}={{b}}^{{{s}}}"},{"stage":"solve","instructionTemplate":"Gabungkan pangkat eksponen penjumlahan dan pengurangan.","formulaTemplateLatex":"({{p}} + {{q}}) - {{s}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var b = r.pick([2, 3, 5]);
  var p = r.pick([2, 3, 4]);
  var q = r.pick([3, 4, 5]);
  var s = r.pick([1, 2]);
  var A = Math.pow(b, p);
  var B = Math.pow(b, q);
  var C = Math.pow(b, s);

  var val = p + q - s;
  var ans = new Fraction(val);
  var trapNeg = new Fraction(-val);
  var trapRecip = new Fraction(1, val);
  var trapPlusOne = new Fraction(val + 1);
  var trapAllAdd = new Fraction(p + q + s);

  return {
    params: { b: String(b), A: String(A), B: String(B), C: String(C), p: String(p), q: String(q), s: String(s), ans: String(val) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapAllAdd.toFraction(false), display_latex: trapAllAdd.toFraction(false), trap_type: "sign_error", rationale: "Menjumlahkan suku pengurang alih-alih membaginya ke dalam argumen logaritma." },
      { canonical: trapPlusOne.toFraction(false), display_latex: trapPlusOne.toFraction(false), trap_type: "arithmetic_slip", rationale: "Kesalahan berhitung pangkat salah satu suku numerus sebesar +1." },
      { canonical: trapRecip.toFraction(false), display_latex: "\\dfrac{1}{" + val + "}", trap_type: "formula_misapplication", rationale: "Membalik posisi basis dan numerus seperti pada logaritma terbalik." },
      { canonical: trapNeg.toFraction(false), display_latex: trapNeg.toFraction(false), trap_type: "sign_error", rationale: "Terbalik tanda hasil akhir logaritma." }
    ],
    feasibility_assertions: [
      trapNeg.valueOf() < 0,
      trapRecip.valueOf() > 0 && trapRecip.valueOf() < 1,
      ans.valueOf() >= 3 && ans.valueOf() < trapPlusOne.valueOf(),
      trapPlusOne.valueOf() < trapAllAdd.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"b":[2,5],"p":[2,4],"q":[3,5],"s":[1,2]},
    codeSha256: "0770b4213ea364d28972dd2d51fa18f121fe9379d0117504be805bccfbc4c9c6",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000013",
    skillNodeId: NODE_IDS.PK_T2_FUNC,
    subtest: "PK",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PK Komposisi Fungsi Linear (f o g)(k)",
    stemTemplateLatex: "Diketahui fungsi $f(x) = {{a}}x + {{b}}$ dan $g(x) = {{c}}x - {{d}}$. Nilai dari $(f \\circ g)({{k}})$ adalah $\\dots$",
    sbiSchemaType: "function_composition_eval",
    polyaVariablesSchema: [{"symbol":"a","role":"known","labelId":"Gradien fungsi f"},{"symbol":"b","role":"known","labelId":"Konstanta fungsi f"},{"symbol":"c","role":"known","labelId":"Gradien fungsi g"},{"symbol":"d","role":"known","labelId":"Pengurang fungsi g"},{"symbol":"k","role":"known","labelId":"Titik evaluasi"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Evaluasi fungsi dalam g({{k}}) terlebih dahulu.","formulaTemplateLatex":"g({{k}}) = {{c}}({{k}}) - {{d}} = {{gk}}"},{"stage":"solve","instructionTemplate":"Substitusi nilai {{gk}} ke dalam fungsi luar f(x).","formulaTemplateLatex":"f({{gk}}) = {{a}}({{gk}}) + {{b}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var a = r.pick([2, 3, 4]);
  var b = r.pick([1, 2, 3, 5]);
  var c = r.pick([2, 3]);
  var d = r.pick([1, 2]);
  var k = r.pick([2, 3, 4, 5]);

  var gk = c * k - d;
  var fk = a * k + b;
  var fog = a * gk + b;
  var gof = c * fk - d;

  var ans = new Fraction(fog);
  var trapLow = new Fraction(fog - a - 1);
  var trapPlusOne = new Fraction(fog + 1);
  var trapGof = new Fraction(gof);
  var trapHigh = new Fraction(gof + b);

  return {
    params: { a: String(a), b: String(b), c: String(c), d: String(d), k: String(k), gk: String(gk), ans: String(fog) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapGof.toFraction(false), display_latex: trapGof.toFraction(false), trap_type: "causal_reversal", rationale: "Terbalik mengevaluasi (g o f)(k) alih-alih (f o g)(k)." },
      { canonical: trapPlusOne.toFraction(false), display_latex: trapPlusOne.toFraction(false), trap_type: "arithmetic_slip", rationale: "Kesalahan penjumlahan konstanta akhir." },
      { canonical: trapLow.toFraction(false), display_latex: trapLow.toFraction(false), trap_type: "arithmetic_slip", rationale: "Keliru menghitung nilai antara g(k)." },
      { canonical: trapHigh.toFraction(false), display_latex: trapHigh.toFraction(false), trap_type: "formula_misapplication", rationale: "Terbalik urutan komposisi sekaligus salah menggeser konstanta b." }
    ],
    feasibility_assertions: [
      trapLow.valueOf() < ans.valueOf(),
      ans.valueOf() < trapPlusOne.valueOf(),
      trapPlusOne.valueOf() < trapGof.valueOf(),
      trapGof.valueOf() < trapHigh.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"a":[2,4],"c":[2,3],"k":[2,5]},
    codeSha256: "6e7e241c996b97635311e1ee8e3a39d275d4586622a901a9e427ee61a0b8ec65",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000014",
    skillNodeId: NODE_IDS.PK_T2_FUNC,
    subtest: "PK",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PK Determinan Matriks 2x2 Linear",
    stemTemplateLatex: "Diketahui determinan matriks $\\begin{pmatrix} x + {{a}} & {{b}} \\\\ {{c}} & {{d}} \\end{pmatrix}$ adalah ${{k}}$. Nilai $x$ yang memenuhi adalah $\\dots$",
    sbiSchemaType: "matrix_2x2_determinant",
    polyaVariablesSchema: [{"symbol":"a","role":"known","labelId":"Konstanta elemen baris 1 kolom 1"},{"symbol":"b","role":"known","labelId":"Elemen baris 1 kolom 2"},{"symbol":"c","role":"known","labelId":"Elemen baris 2 kolom 1"},{"symbol":"d","role":"known","labelId":"Elemen baris 2 kolom 2"},{"symbol":"k","role":"known","labelId":"Nilai determinan"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Gunakan rumus ad - bc = {{k}}.","formulaTemplateLatex":"{{d}}(x + {{a}}) - {{bc}} = {{k}}"},{"stage":"solve","instructionTemplate":"Pindahkan {{bc}}, bagi dengan {{d}}, lalu kurangi {{a}}.","formulaTemplateLatex":"x = \\dfrac{{{k}} + {{bc}}}{{{d}}} - {{a}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var x0 = r.pick([3, 4, 5, 6]);
  var a = r.pick([2, 3, 4]);
  var d = r.pick([2, 3, 4]);
  var b = r.pick([2, 3, 5]);
  var c = r.pick([1, 2, 4]);
  var bc = b * c;
  var k = (x0 + a) * d - bc;

  var ans = new Fraction(x0);
  var trapNeg = new Fraction(-x0);
  var trapSub1 = new Fraction(x0 - 1);
  var trapAdd1 = new Fraction(x0 + 1);
  var trapForgetA = new Fraction(x0 + a);

  return {
    params: { a: String(a), b: String(b), c: String(c), d: String(d), bc: String(bc), k: String(k), ans: String(x0) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapForgetA.toFraction(false), display_latex: trapForgetA.toFraction(false), trap_type: "formula_misapplication", rationale: "Lupa mengurangkan a setelah mencari nilai (x + a)." },
      { canonical: trapAdd1.toFraction(false), display_latex: trapAdd1.toFraction(false), trap_type: "arithmetic_slip", rationale: "Salah penjumlahan saat memindahkan suku bc." },
      { canonical: trapSub1.toFraction(false), display_latex: trapSub1.toFraction(false), trap_type: "arithmetic_slip", rationale: "Kesalahan pembagian koefisien d sebesar -1." },
      { canonical: trapNeg.toFraction(false), display_latex: trapNeg.toFraction(false), trap_type: "sign_error", rationale: "Tertukar tanda negatif saat mengurangkan diagonal sekunder." }
    ],
    feasibility_assertions: [
      trapNeg.valueOf() < trapSub1.valueOf(),
      trapSub1.valueOf() < ans.valueOf(),
      ans.valueOf() < trapAdd1.valueOf(),
      trapAdd1.valueOf() < trapForgetA.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"x0":[3,6],"a":[2,4],"d":[2,4]},
    codeSha256: "26139240ad1896338d3a966f38267227a519f96c42ca4284c0d3254408a2ecd4",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000015",
    skillNodeId: NODE_IDS.PK_T2_GEO,
    subtest: "PK",
    tier: "tier_1_core",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PK Sudut Aljabar dalam Segitiga",
    stemTemplateLatex: "Besar ketiga sudut pada sebuah segitiga $ABC$ adalah $\\angle A = {{p}}x^\\circ$, $\\angle B = {{q}}x^\\circ$, dan $\\angle C = {{c}}^\\circ$. Besar sudut $\\angle B$ (dalam derajat) adalah $\\dots$",
    sbiSchemaType: "triangle_angle_sum_algebraic",
    polyaVariablesSchema: [{"symbol":"p","role":"known","labelId":"Koefisien sudut A"},{"symbol":"q","role":"known","labelId":"Koefisien sudut B"},{"symbol":"c","role":"known","labelId":"Konstanta sudut C"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Jumlah ketiga sudut segitiga selalu 180 derajat.","formulaTemplateLatex":"{{p}}x + {{q}}x + {{c}} = 180"},{"stage":"setup","instructionTemplate":"Cari nilai x terlebih dahulu.","formulaTemplateLatex":"{{pq}}x = {{rem}} \\implies x = {{x0}}"},{"stage":"solve","instructionTemplate":"Kalikan x dengan koefisien q untuk sudut B.","formulaTemplateLatex":"\\angle B = {{q}} \\times {{x0}} = {{ans}}^\\circ"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var p = r.pick([2, 3]);
  var q = p + 1;
  var x0 = r.pick([10, 12, 15, 18]);
  var rem = (p + q) * x0;
  var c = 180 - rem;

  var angB = q * x0;
  var ans = new Fraction(angB);
  var trapXOnly = new Fraction(x0);
  var trapAngA = new Fraction(p * x0);
  var trapPlusX = new Fraction((q + 1) * x0);
  var trapSupp = new Fraction(180 - angB);

  return {
    params: { p: String(p), q: String(q), pq: String(p + q), c: String(c), rem: String(rem), x0: String(x0), ans: String(angB) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) + "^\\circ" },
    distractors: [
      { canonical: trapXOnly.toFraction(false), display_latex: trapXOnly.toFraction(false) + "^\\circ", trap_type: "formula_misapplication", rationale: "Hanya mencari nilai x, lupa mengalikannya dengan koefisien q." },
      { canonical: trapAngA.toFraction(false), display_latex: trapAngA.toFraction(false) + "^\\circ", trap_type: "scope_shift", rationale: "Menjawab besar sudut A bukan sudut B." },
      { canonical: trapPlusX.toFraction(false), display_latex: trapPlusX.toFraction(false) + "^\\circ", trap_type: "arithmetic_slip", rationale: "Keliru mengalikan x dengan (q+1)." },
      { canonical: trapSupp.toFraction(false), display_latex: trapSupp.toFraction(false) + "^\\circ", trap_type: "scope_shift", rationale: "Menghitung sudut pelurus (180 - B) bukan sudut B." }
    ],
    feasibility_assertions: [
      trapXOnly.valueOf() < trapAngA.valueOf(),
      trapAngA.valueOf() < ans.valueOf(),
      ans.valueOf() < trapPlusX.valueOf(),
      trapPlusX.valueOf() < trapSupp.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"p":[2,3],"x0":[10,18]},
    codeSha256: "8b33ed611668ba348b44bc6ee675382d193e253a53897f7e5597dcc41bf09eaa",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000016",
    skillNodeId: NODE_IDS.PK_T2_GEO,
    subtest: "PK",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PK Luas Persegi Panjang dari Keliling & Selisih Sisi",
    stemTemplateLatex: "Keliling sebuah persegi panjang adalah ${{K}}\\text{ cm}$ dan panjangnya lebih panjang ${{d}}\\text{ cm}$ daripada lebarnya. Luas persegi panjang tersebut (dalam $\\text{cm}^2$) adalah $\\dots$",
    sbiSchemaType: "rectangle_perimeter_diff_area",
    polyaVariablesSchema: [{"symbol":"K","role":"known","labelId":"Keliling persegi panjang"},{"symbol":"d","role":"known","labelId":"Selisih panjang dan lebar"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Bagi keliling dengan 2 untuk memperoleh jumlah panjang + lebar.","formulaTemplateLatex":"p + l = \\dfrac{{{K}}}{2} = {{half_k}}"},{"stage":"setup","instructionTemplate":"Eliminasi dengan p - l = {{d}}.","formulaTemplateLatex":"p = {{len_p}},\\; l = {{w}}"},{"stage":"solve","instructionTemplate":"Kalikan panjang dan lebar.","formulaTemplateLatex":"L = {{len_p}} \\times {{w}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var w = r.pick([5, 6, 8, 9, 11]);
  var d = r.pick([3, 4, 5, 6]);
  var lenP = w + d;
  var halfK = lenP + w;
  var K = 2 * halfK;
  var area = lenP * w;

  var ans = new Fraction(area);
  var trapHalfK = new Fraction(halfK);
  var trapMinusW = new Fraction(area - w);
  var trapPlusW = new Fraction(area + w);
  var trapDouble = new Fraction(2 * area);

  return {
    params: { K: String(K), d: String(d), half_k: String(halfK), len_p: String(lenP), w: String(w), ans: String(area) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapDouble.toFraction(false), display_latex: trapDouble.toFraction(false), trap_type: "formula_misapplication", rationale: "Lupa membagi dua keliling pada tahap awal sehingga dimensi tergandakan." },
      { canonical: trapPlusW.toFraction(false), display_latex: trapPlusW.toFraction(false), trap_type: "arithmetic_slip", rationale: "Keliru menambah satu lebar ekstra pada perkalian." },
      { canonical: trapMinusW.toFraction(false), display_latex: trapMinusW.toFraction(false), trap_type: "arithmetic_slip", rationale: "Keliru mengurangi panjang sebesar 1 satuan." },
      { canonical: trapHalfK.toFraction(false), display_latex: trapHalfK.toFraction(false), trap_type: "scope_shift", rationale: "Berhenti setelah menemukan jumlah panjang dan lebar (K/2)." }
    ],
    feasibility_assertions: [
      trapHalfK.valueOf() < trapMinusW.valueOf(),
      trapMinusW.valueOf() < ans.valueOf(),
      ans.valueOf() < trapPlusW.valueOf(),
      trapPlusW.valueOf() < trapDouble.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"w":[5,11],"d":[3,6]},
    codeSha256: "941e1efd716c8720e77ec43b0e95a3ea9e7c09021be1b270791fcc01848aa8a8",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000017",
    skillNodeId: NODE_IDS.PM_T3_GEOM,
    subtest: "PM",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PM Kapasitas Balok dari Rasio Dimensi & Jumlah Rusuk",
    stemTemplateLatex: "Sebuah akuarium berbentuk balok dibuat dengan perbandingan ukuran $p : l : t = {{rp}} : {{rl}} : 1$. Jika total panjang seluruh $12$ kerangka rusuknya adalah ${{Rtot}}\\text{ dm}$, kapasitas maksimum air yang dapat ditampung akuarium (dalam liter) adalah $\\dots$",
    sbiSchemaType: "cuboid_ratio_edge_volume",
    polyaVariablesSchema: [{"symbol":"rp","role":"known","labelId":"Pembanding panjang"},{"symbol":"rl","role":"known","labelId":"Pembanding lebar"},{"symbol":"Rtot","role":"known","labelId":"Total panjang 12 rusuk (dm)"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Balok memiliki masing-masing 4 rusuk panjang, 4 lebar, dan 4 tinggi.","formulaTemplateLatex":"4({{rp}}k + {{rl}}k + k) = {{Rtot}}"},{"stage":"setup","instructionTemplate":"Tentukan faktor skala k lalu dimensi nyatanya dalam dm.","formulaTemplateLatex":"k = {{k}} \\implies p={{p}},\\; l={{l}},\\; t={{t}}"},{"stage":"solve","instructionTemplate":"Hitung volume balok dalam dm^3 (1 dm^3 = 1 liter).","formulaTemplateLatex":"V = {{p}} \\times {{l}} \\times {{t}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var rp = r.pick([4, 5]);
  var rl = r.pick([2, 3]);
  var k = r.pick([2, 3, 4]);
  var Rtot = 4 * k * (rp + rl + 1);
  var p = rp * k;
  var l = rl * k;
  var t = k;
  var vol = p * l * t;

  var ans = new Fraction(vol);
  var trapNoK3 = new Fraction(rp * rl * k);
  var trapArea = new Fraction(p * l);
  var trapSlip = new Fraction(vol + k * k);
  var trapEightX = new Fraction(8 * vol);

  return {
    params: { rp: String(rp), rl: String(rl), Rtot: String(Rtot), k: String(k), p: String(p), l: String(l), t: String(t), ans: String(vol) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) + "\\text{ liter}" },
    distractors: [
      { canonical: trapEightX.toFraction(false), display_latex: trapEightX.toFraction(false) + "\\text{ liter}", trap_type: "formula_misapplication", rationale: "Membagi total rusuk dengan 2 alih-alih 4 sehingga setiap sisi berlipat 2 dan volume menjadi 8 kali lipat." },
      { canonical: trapSlip.toFraction(false), display_latex: trapSlip.toFraction(false) + "\\text{ liter}", trap_type: "arithmetic_slip", rationale: "Kesalahan perkalian p x l x t." },
      { canonical: trapArea.toFraction(false), display_latex: trapArea.toFraction(false) + "\\text{ liter}", trap_type: "formula_misapplication", rationale: "Hanya menghitung luas alas p x l tanpa mengalikan tinggi t." },
      { canonical: trapNoK3.toFraction(false), display_latex: trapNoK3.toFraction(false) + "\\text{ liter}", trap_type: "formula_misapplication", rationale: "Hanya mengalikan angka perbandingan rasio dengan k satu kali, bukan k^3." }
    ],
    feasibility_assertions: [
      trapNoK3.valueOf() < trapArea.valueOf(),
      trapArea.valueOf() < ans.valueOf(),
      ans.valueOf() < trapSlip.valueOf(),
      trapSlip.valueOf() < trapEightX.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"rp":[4,5],"rl":[2,3],"k":[2,4]},
    codeSha256: "7e96394d93d787503c31dffb3ac3c92fab97fa4cabb74574d5d3e66fafbb9a88",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000018",
    skillNodeId: NODE_IDS.PM_T3_PROB,
    subtest: "PM",
    tier: "tier_1_core",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PM Diagram Venn 2 Himpunan (Irisan Komunitas)",
    stemTemplateLatex: "Dari ${{N}}$ mahasiswa di sebuah asrama, ${{A}}$ orang mengikuti klub catur, ${{B}}$ orang mengikuti klub debat, dan ${{neither}}$ orang tidak mengikuti keduanya. Banyaknya mahasiswa yang mengikuti **kedua klub sekaligus** adalah $\\dots$",
    sbiSchemaType: "venn_two_sets_intersection",
    polyaVariablesSchema: [{"symbol":"N","role":"known","labelId":"Total mahasiswa"},{"symbol":"A","role":"known","labelId":"Peserta klub catur"},{"symbol":"B","role":"known","labelId":"Peserta klub debat"},{"symbol":"neither","role":"known","labelId":"Tidak ikut keduanya"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Keluarkan mahasiswa yang tidak ikut keduanya dari total N.","formulaTemplateLatex":"|A \\cup B| = {{N}} - {{neither}} = {{union_ab}}"},{"stage":"solve","instructionTemplate":"Pakai prinsip inklusi-eksklusi untuk mencari irisan.","formulaTemplateLatex":"|A \\cap B| = {{A}} + {{B}} - {{union_ab}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var onlyA = r.pick([10, 12, 15, 18]);
  var onlyB = r.pick([8, 11, 14, 16]);
  var both = r.pick([8, 10, 12, 14]);
  var neither = r.pick([3, 4, 5]);
  var A = onlyA + both;
  var B = onlyB + both;
  var unionAB = onlyA + both + onlyB;
  var N = unionAB + neither;

  var ans = new Fraction(both);
  var trapForgetNeither = new Fraction(both - neither);
  var trapAddNeither = new Fraction(both + neither);
  var trapAddTwice = new Fraction(both + 2 * neither);
  var trapUnion = new Fraction(unionAB);

  return {
    params: { N: String(N), A: String(A), B: String(B), neither: String(neither), union_ab: String(unionAB), ans: String(both) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapForgetNeither.toFraction(false), display_latex: trapForgetNeither.toFraction(false), trap_type: "formula_misapplication", rationale: "Langsung menghitung A + B - N tanpa mengeluarkan kelompok yang tidak ikut keduanya." },
      { canonical: trapAddNeither.toFraction(false), display_latex: trapAddNeither.toFraction(false), trap_type: "sign_error", rationale: "Keliru menukar tanda pengurangan menjadi penjumlahan saat mengeluarkan 'neither'." },
      { canonical: trapAddTwice.toFraction(false), display_latex: trapAddTwice.toFraction(false), trap_type: "arithmetic_slip", rationale: "Menghitung selisih dua kali dengan nilai neither." },
      { canonical: trapUnion.toFraction(false), display_latex: trapUnion.toFraction(false), trap_type: "scope_shift", rationale: "Menjawab gabungan total peserta minimal satu klub, bukan irisannya." }
    ],
    feasibility_assertions: [
      trapForgetNeither.valueOf() > 0 && trapForgetNeither.valueOf() < ans.valueOf(),
      ans.valueOf() < trapAddNeither.valueOf(),
      trapAddNeither.valueOf() < trapAddTwice.valueOf(),
      trapAddTwice.valueOf() < trapUnion.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"both":[8,14],"neither":[3,5]},
    codeSha256: "eaaf16f723004a6821145a01b2abdcd19d37eafd91809b5344d6c61a3d6727b4",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000019",
    skillNodeId: NODE_IDS.PM_T2_ARIT,
    subtest: "PM",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PM Barisan Rekursif Linear (U_{n+1} = p U_n + q)",
    stemTemplateLatex: "Populasi bibit tanaman pada minggu ke-$n$ mengikuti aturan rekursif $U_{n+1} = {{p}} U_n + {{q}}$ dengan jumlah awal $U_1 = {{u1}}$. Nilai $U_4$ adalah $\\dots$",
    sbiSchemaType: "linear_recursive_sequence",
    polyaVariablesSchema: [{"symbol":"u1","role":"known","labelId":"Suku awal U_1"},{"symbol":"p","role":"known","labelId":"Faktor pengali"},{"symbol":"q","role":"known","labelId":"Konstanta penambah"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Iterasikan secara bertahap dari U_1 menuju U_2 dan U_3.","formulaTemplateLatex":"U_2 = {{u2}},\\quad U_3 = {{u3}}"},{"stage":"solve","instructionTemplate":"Hitung langkah terakhir U_4 = {{p}} * U_3 + {{q}}.","formulaTemplateLatex":"U_4 = {{p}}({{u3}}) + {{q}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var u1 = r.pick([2, 3, 4, 5]);
  var p = r.pick([2, 3]);
  var q = r.pick([1, 2, 3]);
  var u2 = p * u1 + q;
  var u3 = p * u2 + q;
  var u4 = p * u3 + q;
  var u5 = p * u4 + q;

  var ans = new Fraction(u4);
  var trapU3 = new Fraction(u3);
  var trapNoQ = new Fraction(p * u3);
  var trapPlusQ = new Fraction(u4 + q);
  var trapU5 = new Fraction(u5);

  return {
    params: { u1: String(u1), p: String(p), q: String(q), u2: String(u2), u3: String(u3), ans: String(u4) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapU3.toFraction(false), display_latex: trapU3.toFraction(false), trap_type: "scope_shift", rationale: "Berhenti iterasi lebih cepat pada suku ke-3, bukan suku ke-4." },
      { canonical: trapNoQ.toFraction(false), display_latex: trapNoQ.toFraction(false), trap_type: "formula_misapplication", rationale: "Lupa menambahkan konstanta +q pada langkah U_4." },
      { canonical: trapPlusQ.toFraction(false), display_latex: trapPlusQ.toFraction(false), trap_type: "arithmetic_slip", rationale: "Menambahkan konstanta q dua kali pada langkah akhir." },
      { canonical: trapU5.toFraction(false), display_latex: trapU5.toFraction(false), trap_type: "scope_shift", rationale: "Terlalu jauh menghitung hingga suku ke-5." }
    ],
    feasibility_assertions: [
      trapU3.valueOf() < trapNoQ.valueOf(),
      trapNoQ.valueOf() < ans.valueOf(),
      ans.valueOf() < trapPlusQ.valueOf(),
      trapPlusQ.valueOf() < trapU5.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"u1":[2,5],"p":[2,3],"q":[1,3]},
    codeSha256: "fcd85645e2f1cb6c42332cadfeca0666070480c0288a3d071e9881d9fb98a053",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000020",
    skillNodeId: NODE_IDS.PM_T1_PCT,
    subtest: "PM",
    tier: "tier_1_core",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PM Harga Beli Awal dari Harga Jual Bermargin Untung",
    stemTemplateLatex: "Sebuah toko elektronik menjual produk seharga Rp${{jual}}$ ribu dengan margin keuntungan tepat ${{pct}}\\%$ dari harga belinya. Harga beli awal produk tersebut (dalam ribu rupiah) adalah $\\dots$",
    sbiSchemaType: "reverse_markup_cost_basis",
    polyaVariablesSchema: [{"symbol":"jual","role":"known","labelId":"Harga jual (ribu Rp)"},{"symbol":"pct","role":"known","labelId":"Persentase untung"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Harga jual sama dengan (100% + {{pct}}%) dari harga beli B.","formulaTemplateLatex":"{{factor_pct}}\\% \\times B = {{jual}}"},{"stage":"solve","instructionTemplate":"Bagi harga jual dengan faktor persentase untung.","formulaTemplateLatex":"B = \\dfrac{{{jual}} \\times 100}{{{factor_pct}}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var beli = r.pick([400, 800, 1200, 1600]);
  var pct = r.pick([10, 20, 25]);
  var factorPct = 100 + pct;
  var jual = (beli * factorPct) / 100;

  var ans = new Fraction(beli);
  var trapFromSell = new Fraction((jual * (100 - pct)) / 100);
  var trapMinusTwo = new Fraction(beli - 2);
  var trapPlusTen = new Fraction(beli + 10);
  var trapJual = new Fraction(jual);

  return {
    params: { jual: String(jual), pct: String(pct), factor_pct: String(factorPct), ans: String(beli) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapFromSell.toFraction(false), display_latex: trapFromSell.toFraction(false), trap_type: "formula_misapplication", rationale: "Jebakan klasik: langsung mengurangi persentase dari harga jual, padahal basis untung adalah harga beli." },
      { canonical: trapMinusTwo.toFraction(false), display_latex: trapMinusTwo.toFraction(false), trap_type: "arithmetic_slip", rationale: "Kesalahan pembulatan saat membagi pecahan." },
      { canonical: trapPlusTen.toFraction(false), display_latex: trapPlusTen.toFraction(false), trap_type: "arithmetic_slip", rationale: "Salah menaksir porsi keuntungan nominal." },
      { canonical: trapJual.toFraction(false), display_latex: trapJual.toFraction(false), trap_type: "scope_shift", rationale: "Mengulang angka harga jual sebagai jawaban." }
    ],
    feasibility_assertions: [
      trapFromSell.valueOf() < trapMinusTwo.valueOf(),
      trapMinusTwo.valueOf() < ans.valueOf(),
      ans.valueOf() < trapPlusTen.valueOf(),
      trapPlusTen.valueOf() < trapJual.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"beli":[400,1600],"pct":[10,25]},
    codeSha256: "caa976f56e70b54df512a765555a0053771efd2c8c26bd59dc20a41f24b12727",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000021",
    skillNodeId: NODE_IDS.PM_T1_PCT,
    subtest: "PM",
    tier: "tier_1_core",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PM Bunga Tunggal Tabungan Bank Selama m Bulan",
    stemTemplateLatex: "Nadia menyimpan modal sebesar Rp${{m0}}$ juta dengan suku bunga tunggal ${{p}}\\%$ per tahun. Besar **bunga** yang diperolehnya setelah menabung selama ${{m}}$ bulan (dalam ribuan rupiah) adalah $\\dots$",
    sbiSchemaType: "simple_interest_months",
    polyaVariablesSchema: [{"symbol":"m0","role":"known","labelId":"Modal awal (juta Rp)"},{"symbol":"p","role":"known","labelId":"Bunga tahunan (%)"},{"symbol":"m","role":"known","labelId":"Durasi menabung (bulan)"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Konversi m bulan menjadi m/12 tahun sebelum dikalikan p%.","formulaTemplateLatex":"I = M_0 \\times \\dfrac{{{m}}}{12} \\times {{p}}\\%"},{"stage":"solve","instructionTemplate":"Hitung nominal bunga dalam ribuan rupiah.","formulaTemplateLatex":"I = {{m0_ribu}} \\times {{rate_tot}}\\% = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var m0 = r.pick([6, 9, 12, 15]);
  var pair = r.pick([[6, 8], [8, 9], [12, 5], [9, 8]]);
  var p = pair[0];
  var m = pair[1];
  var m0Ribu = m0 * 1000;
  var rateTot = (p * m) / 12;
  var bunga = (m0Ribu * rateTot) / 100;

  var ans = new Fraction(bunga);
  var trapHalf = new Fraction(bunga, 2);
  var trapFullYear = new Fraction((m0Ribu * p) / 100);
  var trapHighRate = new Fraction((m0Ribu * (p + 2)) / 100);
  var trapTotalSaldo = new Fraction(m0Ribu + bunga);

  return {
    params: { m0: String(m0), m0_ribu: String(m0Ribu), p: String(p), m: String(m), rate_tot: String(rateTot), ans: String(bunga) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapFullYear.toFraction(false), display_latex: trapFullYear.toFraction(false), trap_type: "formula_misapplication", rationale: "Menghitung bunga satu tahun penuh tanpa mengalikan faktor waktu m/12." },
      { canonical: trapTotalSaldo.toFraction(false), display_latex: trapTotalSaldo.toFraction(false), trap_type: "scope_shift", rationale: "Menjawab total saldo akhir (modal + bunga), padahal yang ditanyakan hanya bunganya." },
      { canonical: trapHalf.toFraction(false), display_latex: trapHalf.toFraction(false), trap_type: "arithmetic_slip", rationale: "Kesalahan pembagian waktu atau pembilang bunga." },
      { canonical: trapHighRate.toFraction(false), display_latex: trapHighRate.toFraction(false), trap_type: "arithmetic_slip", rationale: "Salah membaca suku bunga tahunan sekaligus lupa faktor bulanan." }
    ],
    feasibility_assertions: [
      trapHalf.valueOf() < ans.valueOf(),
      ans.valueOf() < trapFullYear.valueOf(),
      trapFullYear.valueOf() < trapHighRate.valueOf(),
      trapHighRate.valueOf() < trapTotalSaldo.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"m0":[6,15]},
    codeSha256: "e1e19b3ca1f07af1540714a284e24abe3543d6b6ec3636be226368b76f23dfee",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000022",
    skillNodeId: NODE_IDS.PK_T3_STAT,
    subtest: "PK",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PK Nilai Siswa Susulan dari Perubahan Rata-Rata Kelas",
    stemTemplateLatex: "Rata-rata nilai ujian ${{n}}$ siswa adalah ${{avg1}}$. Ketika seorang siswa susulan bergabung, rata-rata kelas meningkat menjadi ${{avg2}}$. Nilai siswa susulan tersebut adalah $\\dots$",
    sbiSchemaType: "mean_single_entry_shift",
    polyaVariablesSchema: [{"symbol":"n","role":"known","labelId":"Jumlah siswa awal"},{"symbol":"avg1","role":"known","labelId":"Rata-rata awal"},{"symbol":"avg2","role":"known","labelId":"Rata-rata setelah bergabung"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Gunakan rumus cepat x_baru = rata-rata baru + n_lama * selisih rata-rata.","formulaTemplateLatex":"x = {{avg2}} + {{n}}({{avg2}} - {{avg1}})"},{"stage":"solve","instructionTemplate":"Sederhanakan nilai siswa susulan.","formulaTemplateLatex":"x = {{avg2}} + {{boost}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var n = r.pick([7, 9, 11]);
  var avg1 = r.pick([70, 72, 74]);
  var delta = r.pick([1, 2]);
  var avg2 = avg1 + delta;
  var boost = n * delta;
  var xNew = avg2 + boost;

  var ans = new Fraction(xNew);
  var trapAvg1 = new Fraction(avg1);
  var trapAvg2 = new Fraction(avg2);
  var trapOffOne = new Fraction(xNew - delta);
  var trapPlus = new Fraction(xNew + delta);

  return {
    params: { n: String(n), avg1: String(avg1), avg2: String(avg2), boost: String(boost), ans: String(xNew) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapOffOne.toFraction(false), display_latex: trapOffOne.toFraction(false), trap_type: "arithmetic_slip", rationale: "Menggunakan basis rata-rata lama avg1 alih-alih rata-rata baru avg2 saat menambah n*delta." },
      { canonical: trapAvg2.toFraction(false), display_latex: trapAvg2.toFraction(false), trap_type: "formula_misapplication", rationale: "Mengira nilai siswa susulan sama dengan rata-rata baru." },
      { canonical: trapAvg1.toFraction(false), display_latex: trapAvg1.toFraction(false), trap_type: "scope_shift", rationale: "Menjawab rata-rata awal sebelum penambahan." },
      { canonical: trapPlus.toFraction(false), display_latex: trapPlus.toFraction(false), trap_type: "arithmetic_slip", rationale: "Kelebihan satu delta pada penjumlahan total nilai." }
    ],
    feasibility_assertions: [
      trapAvg1.valueOf() < trapAvg2.valueOf(),
      trapAvg2.valueOf() < trapOffOne.valueOf(),
      trapOffOne.valueOf() < ans.valueOf(),
      ans.valueOf() < trapPlus.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"n":[7,11],"avg1":[70,74],"delta":[1,2]},
    codeSha256: "2774357bfd6769b17ba768d20fb8f5e70e70fad9c24cde8365653106eb32a10a",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000023",
    skillNodeId: NODE_IDS.PM_T3_PROB,
    subtest: "PM",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PM Kombinatorika Pembentukan Tim Kerja C(n1, 2) x C(n2, 2)",
    stemTemplateLatex: "Sebuah panitia beranggotakan $4$ orang dipilih dari ${{n1}}$ siswa putra dan ${{n2}}$ siswa putri. Jika tim diwajibkan terdiri atas tepat $2$ putra dan $2$ putri, banyaknya susunan tim berbeda adalah $\\dots$",
    sbiSchemaType: "committee_product_combinations",
    polyaVariablesSchema: [{"symbol":"n1","role":"known","labelId":"Kandidat putra"},{"symbol":"n2","role":"known","labelId":"Kandidat putri"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Hitung kombinasi masing-masing kelompok secara terpisah.","formulaTemplateLatex":"C({{n1}}, 2) = {{c1}},\\quad C({{n2}}, 2) = {{c2}}"},{"stage":"solve","instructionTemplate":"Kalikan kedua hasil karena pemilihan terjadi bersamaan.","formulaTemplateLatex":"{{c1}} \\times {{c2}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var n1 = r.pick([4, 5, 6]);
  var n2 = r.pick([3, 4, 5]);
  var c1 = (n1 * (n1 - 1)) / 2;
  var c2 = (n2 * (n2 - 1)) / 2;
  var total = c1 * c2;

  var ans = new Fraction(total);
  var trapSum = new Fraction(c1 + c2);
  var trapMinusTwo = new Fraction(total - 2);
  var trapPermHalf = new Fraction(2 * total);
  var trapPermFull = new Fraction(4 * total);

  return {
    params: { n1: String(n1), n2: String(n2), c1: String(c1), c2: String(c2), ans: String(total) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapSum.toFraction(false), display_latex: trapSum.toFraction(false), trap_type: "formula_misapplication", rationale: "Menjumlahkan C(n1,2) + C(n2,2) alih-alih memakai aturan perkalian." },
      { canonical: trapPermHalf.toFraction(false), display_latex: trapPermHalf.toFraction(false), trap_type: "formula_misapplication", rationale: "Menggunakan permutasi pada salah satu kelompok (lupa membagi 2!)." },
      { canonical: trapPermFull.toFraction(false), display_latex: trapPermFull.toFraction(false), trap_type: "formula_misapplication", rationale: "Menggunakan permutasi untuk kedua kelompok padahal jabatan tidak dibedakan." },
      { canonical: trapMinusTwo.toFraction(false), display_latex: trapMinusTwo.toFraction(false), trap_type: "arithmetic_slip", rationale: "Kesalahan perkalian c1 dengan c2." }
    ],
    feasibility_assertions: [
      trapSum.valueOf() < trapMinusTwo.valueOf(),
      trapMinusTwo.valueOf() < ans.valueOf(),
      ans.valueOf() < trapPermHalf.valueOf(),
      trapPermHalf.valueOf() < trapPermFull.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"n1":[4,6],"n2":[3,5]},
    codeSha256: "a5013c93843a816f50c453e7e6f8acfa76f11d1b00fdee2c3807d30a5c518f84",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000024",
    skillNodeId: NODE_IDS.PU_T3_PAT,
    subtest: "PU",
    tier: "tier_2_standard",
    sandboxRuntime: "quickjs_wasm",
    sourceQuestionId: null,
    templateTitle: "PU Pola Barisan Aritmetika Tingkat-2 (Cari Suku ke-7)",
    stemTemplateLatex: "Perhatikan barisan bilangan tingkat dua berikut: ${{u1}},\\; {{u2}},\\; {{u3}},\\; {{u4}},\\; {{u5}},\\; {{u6}},\\; \\dots$. Suku ke-$7$ untuk melengkapi barisan tersebut adalah $\\dots$",
    sbiSchemaType: "second_order_arithmetic_sequence",
    polyaVariablesSchema: [{"symbol":"u1","role":"known","labelId":"Suku ke-1"},{"symbol":"u6","role":"known","labelId":"Suku ke-6"}],
    solutionStepTemplates: [{"stage":"deconstruct","instructionTemplate":"Hitung selisih berurutan (tingkat 1) lalu amati kenaikannya yang konstan +2 tiap langkah.","formulaTemplateLatex":"u_n = n^2 + {{k}}n + {{c}}"},{"stage":"solve","instructionTemplate":"Tambahkan selisih ke-6 (13 + k) pada u_6.","formulaTemplateLatex":"u_7 = {{u6}} + {{step6}} = {{ans}}"}],
    generatorCode: `function generate(seed) {
  var r = rng(seed);
  var k = r.pick([1, 2, 3, 4]);
  var c = r.pick([1, 2, 3, 5]);
  function term(n) {
    return n * n + k * n + c;
  }
  var u1 = term(1);
  var u2 = term(2);
  var u3 = term(3);
  var u4 = term(4);
  var u5 = term(5);
  var u6 = term(6);
  var u7 = term(7);
  var u8 = term(8);

  var ans = new Fraction(u7);
  var trapU6 = new Fraction(u6);
  var trapLinear = new Fraction(u7 - 4);
  var trapSlip = new Fraction(u7 - 2);
  var trapU8 = new Fraction(u8);

  return {
    params: { u1: String(u1), u2: String(u2), u3: String(u3), u4: String(u4), u5: String(u5), u6: String(u6), k: String(k), c: String(c), step6: String(13 + k), ans: String(u7) },
    correct: { canonical: ans.toFraction(false), display_latex: ans.toFraction(false) },
    distractors: [
      { canonical: trapLinear.toFraction(false), display_latex: trapLinear.toFraction(false), trap_type: "formula_misapplication", rationale: "Menganggap selisih tingkat satu bernilai konstan tanpa menambah +2 pada beda berikutnya." },
      { canonical: trapSlip.toFraction(false), display_latex: trapSlip.toFraction(false), trap_type: "arithmetic_slip", rationale: "Keliru menghitung beda antara suku ke-6 dan ke-7." },
      { canonical: trapU6.toFraction(false), display_latex: trapU6.toFraction(false), trap_type: "scope_shift", rationale: "Mengulang suku ke-6 sebagai suku berikutnya." },
      { canonical: trapU8.toFraction(false), display_latex: trapU8.toFraction(false), trap_type: "scope_shift", rationale: "Melompat satu langkah terlalu jauh ke suku ke-8." }
    ],
    feasibility_assertions: [
      trapU6.valueOf() < trapLinear.valueOf(),
      trapLinear.valueOf() < trapSlip.valueOf(),
      trapSlip.valueOf() < ans.valueOf(),
      ans.valueOf() < trapU8.valueOf()
    ]
  };
}`,
    parameterBoundsJson: {"k":[1,4],"c":[1,5]},
    codeSha256: "d1bb3fa07a777229a27c04d97a8badf83271a1a49adc949f25df176a7c945690",
    isActive: true,
    createdByModel: "curated-verified-template",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
];
