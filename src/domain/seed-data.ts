import rawIngestedSnbtBank from "./ingested-snbt-bank.json";
import type {
  BrainVaultChunk,
  QuestionEntity,
  QuestionTemplateEntity,
  SkillNode,
  SkillPrerequisiteEdge,
} from "./types";

// Deterministic UUID constants (RFC 4122 compliant for PostgreSQL uuid columns)
export const NODE_IDS = {
  // PK (Pengetahuan Kuantitatif)
  PK_T0_FRAC: "10000000-0000-4000-8000-000000000001",
  PK_T0_ALG: "10000000-0000-4000-8000-000000000002",
  PK_T1_LIN: "10000000-0000-4000-8000-000000000003",
  PK_T2_RATE: "10000000-0000-4000-8000-000000000004",
  PK_T2_QUAD: "10000000-0000-4000-8000-000000000005",
  PK_T3_INEQ: "10000000-0000-4000-8000-000000000006",
  // PU (Penalaran Umum)
  PU_T0_LOG: "10000000-0000-4000-8000-000000000007",
  PU_T1_SYL: "10000000-0000-4000-8000-000000000008",
  PU_T2_ARG: "10000000-0000-4000-8000-000000000009",
  PU_T3_PAT: "10000000-0000-4000-8000-000000000010",
  // PM (Penalaran Matematika)
  PM_T0_UNIT: "10000000-0000-4000-8000-000000000011",
  PM_T1_PCT: "10000000-0000-4000-8000-000000000012",
  PM_T2_LIN: "10000000-0000-4000-8000-000000000013",
  PM_T3_PROB: "10000000-0000-4000-8000-000000000014",
  // LBI (Literasi Bahasa Indonesia)
  LBI_T0_IDEA: "10000000-0000-4000-8000-000000000015",
  LBI_T1_CLAIM: "10000000-0000-4000-8000-000000000016",
  LBI_T2_INF: "10000000-0000-4000-8000-000000000017",
  // LBE (Literasi Bahasa Inggris)
  LBE_T0_REF: "10000000-0000-4000-8000-000000000018",
  LBE_T1_PURP: "10000000-0000-4000-8000-000000000019",
  LBE_T3_EVAL: "10000000-0000-4000-8000-000000000020",
  // PBM (Pemahaman Bacaan dan Menulis)
  PBM_T0_EJA: "10000000-0000-4000-8000-000000000021",
  PBM_T1_EFF: "10000000-0000-4000-8000-000000000022",
  // PPU (Pengetahuan dan Pemahaman Umum)
  PPU_T1_SEM: "10000000-0000-4000-8000-000000000023",
  PPU_T2_ASSOC: "10000000-0000-4000-8000-000000000024",
} as const;

export const SEED_SKILL_NODES: SkillNode[] = [
  // PK
  {
    id: NODE_IDS.PK_T0_FRAC,
    code: "PK-T0-FRAC",
    subtest: "PK",
    track: "quantitative",
    tier: "tier_0_foundation",
    titleId: "Operasi Pecahan, Rasio & Tanda Negatif",
    titleEn: "Fractions, Ratios & Signed Arithmetic",
    descriptionMarkdown: "Fondasi mutlak menyamakan penyebut, menyederhanakan pecahan aljabar sederhana, dan menghindari selip tanda negatif.",
    firstPrinciplesSummary: "Pecahan menyatakan bagian dari keseluruhan yang setara; penjumlahan hanya sah ketika penyebut bernilai sama.",
    isFoundationRepair: true,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 50,
    graphX: 80,
    graphY: 90,
    displayOrder: 1,
  },
  {
    id: NODE_IDS.PK_T0_ALG,
    code: "PK-T0-ALG",
    subtest: "PK",
    track: "quantitative",
    tier: "tier_0_foundation",
    titleId: "Manipulasi Aljabar & Pindah Ruas",
    titleEn: "Algebraic Manipulation & Balancing",
    descriptionMarkdown: "Menjaga keseimbangan dua ruas persamaan saat memindahkan suku, mengisolasi variabel, dan memfaktorkan bentuk dasar.",
    firstPrinciplesSummary: "Persamaan adalah timbangan seimbang: operasi apa pun di ruas kiri wajib diterapkan persis sama di ruas kanan.",
    isFoundationRepair: true,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 55,
    graphX: 250,
    graphY: 90,
    displayOrder: 2,
  },
  {
    id: NODE_IDS.PK_T1_LIN,
    code: "PK-T1-LIN",
    subtest: "PK",
    track: "quantitative",
    tier: "tier_1_core",
    titleId: "Persamaan Garis, Gradien & SPLDV",
    titleEn: "Linear Equations & Systems",
    descriptionMarkdown: "Menentukan gradien, titik potong dua garis, dan menyelesaikan sistem persamaan linear dua variabel secara cepat.",
    firstPrinciplesSummary: "Gradien mengukur laju perubahan vertikal terhadap perubahan horizontal antara dua titik berbeda.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 70,
    graphX: 430,
    graphY: 60,
    displayOrder: 3,
  },
  {
    id: NODE_IDS.PK_T2_RATE,
    code: "PK-T2-RATE",
    subtest: "PK",
    track: "quantitative",
    tier: "tier_2_standard",
    titleId: "Perbandingan Senilai, Berbalik Nilai & Laju",
    titleEn: "Direct & Inverse Proportion",
    descriptionMarkdown: "Membedakan hubungan hasil kali konstan (berbalik nilai) dengan rasio konstan (senilai) dalam masalah kerja dan kecepatan.",
    firstPrinciplesSummary: "Pada pekerjaan tetap, total beban kerja (pekerja x hari) adalah konstanta yang tidak berubah.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 75,
    graphX: 430,
    graphY: 160,
    displayOrder: 4,
  },
  {
    id: NODE_IDS.PK_T2_QUAD,
    code: "PK-T2-QUAD",
    subtest: "PK",
    track: "quantitative",
    tier: "tier_2_standard",
    titleId: "Fungsi Kuadrat, Akar & Diskriminan",
    titleEn: "Quadratic Functions & Vieta",
    descriptionMarkdown: "Menghubungkan jumlah/hasil kali akar (Vieta), sumbu simetri, serta sifat diskriminan tanpa selalu mencari akar eksplisit.",
    firstPrinciplesSummary: "Koefisien kuadrat menyimpan informasi jumlah dan hasil kali akar secara langsung lewat bentuk faktorisasi.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 85,
    graphX: 620,
    graphY: 90,
    displayOrder: 5,
  },
  {
    id: NODE_IDS.PK_T3_INEQ,
    code: "PK-T3-INEQ",
    subtest: "PK",
    track: "quantitative",
    tier: "tier_3_hots_800",
    titleId: "Pertidaksamaan Rasional & Analisis Kecukupan (P/Q)",
    titleEn: "HOTS Inequalities & Data Sufficiency",
    descriptionMarkdown: "Menangani soal kecukupan data (1) dan (2) khas UTBK serta menjaga tanda pertidaksamaan saat menguji titik kritis.",
    firstPrinciplesSummary: "Jangan pernah mengalikan silang variabel bertanda tak pasti pada pertidaksamaan; pindahkan ke satu ruas dan uji titik nol.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 95,
    graphX: 800,
    graphY: 110,
    displayOrder: 6,
  },
  // PU
  {
    id: NODE_IDS.PU_T0_LOG,
    code: "PU-T0-LOG",
    subtest: "PU",
    track: "quantitative",
    tier: "tier_0_foundation",
    titleId: "Fondasi Implikasi, Negasi & Kuantor",
    titleEn: "Implication, Negation & Quantifiers",
    descriptionMarkdown: "Memahami perbedaan mutlak antara implikasi, negasi kuantor (Semua vs Ada), serta syarat perlu vs syarat cukup.",
    firstPrinciplesSummary: "Implikasi P -> Q hanya bernilai salah jika sebab P terjadi namun akibat Q gagal terjadi.",
    isFoundationRepair: true,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 50,
    graphX: 80,
    graphY: 270,
    displayOrder: 7,
  },
  {
    id: NODE_IDS.PU_T1_SYL,
    code: "PU-T1-SYL",
    subtest: "PU",
    track: "quantitative",
    tier: "tier_1_core",
    titleId: "Silogisme, Modus Tollens & Ekuivalensi",
    titleEn: "Syllogism & Contrapositive",
    descriptionMarkdown: "Menarik kesimpulan sah melalui rantai silogisme dan kontraposisi sambil menghindari jebakan membalik implikasi.",
    firstPrinciplesSummary: "Pernyataan P -> Q selalu ekuivalen dengan kontraposisinya (~Q -> ~P), bukan dengan konversnya (Q -> P).",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 65,
    graphX: 280,
    graphY: 270,
    displayOrder: 8,
  },
  {
    id: NODE_IDS.PU_T2_ARG,
    code: "PU-T2-ARG",
    subtest: "PU",
    track: "quantitative",
    tier: "tier_2_standard",
    titleId: "Penalaran Analitik & Memperlemah Klaim",
    titleEn: "Analytical & Argument Evaluation",
    descriptionMarkdown: "Mengevaluasi pernyataan yang pasti benar, pasti salah, memperkuat, atau memperlemah kualitas kesimpulan.",
    firstPrinciplesSummary: "Bukti yang memperlemah argumen menyerang jembatan asumsi antara premis dan kesimpulan, bukan sekadar menambah fakta lain.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 75,
    graphX: 480,
    graphY: 270,
    displayOrder: 9,
  },
  {
    id: NODE_IDS.PU_T3_PAT,
    code: "PU-T3-PAT",
    subtest: "PU",
    track: "quantitative",
    tier: "tier_3_hots_800",
    titleId: "Pola Bilangan Bertingkat & Kombinatorial Deduktif",
    titleEn: "Multi-Layer Sequence & Logic",
    descriptionMarkdown: "Mendeteksi pola selisih bertingkat, pola selang-seling dua sub-barisan, serta syarat pembatas posisi.",
    firstPrinciplesSummary: "Uji selisih antar suku berurutan terlebih dahulu; jika tidak konstan, periksa pola loncat indeks ganjil dan genap.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 80,
    graphX: 680,
    graphY: 270,
    displayOrder: 10,
  },
  // PM
  {
    id: NODE_IDS.PM_T0_UNIT,
    code: "PM-T0-UNIT",
    subtest: "PM",
    track: "quantitative",
    tier: "tier_0_foundation",
    titleId: "Konversi Satuan & Translasi Soal Cerita",
    titleEn: "Unit Conversion & Word Translation",
    descriptionMarkdown: "Mengubah kalimat naratif menjadi variabel terdefinisi dan menyamakan satuan waktu, jarak, serta mata uang.",
    firstPrinciplesSummary: "Satu angka dalam soal cerita tidak bermakna sebelum satuan dan pemilik nilainya ditulis eksplisit.",
    isFoundationRepair: true,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 60,
    graphX: 80,
    graphY: 420,
    displayOrder: 11,
  },
  {
    id: NODE_IDS.PM_T1_PCT,
    code: "PM-T1-PCT",
    subtest: "PM",
    track: "quantitative",
    tier: "tier_1_core",
    titleId: "Persentase Bertingkat, Diskon & Bunga",
    titleEn: "Compound Percentages & Discounts",
    descriptionMarkdown: "Menghitung diskon ganda, pajak, dan pertumbuhan bertingkat dengan faktor pengali (1 + r) tanpa salah basis.",
    firstPrinciplesSummary: "Diskon beruntun 20% lalu 10% dikalikan secara berantai (0,8 x 0,9 = 0,72), bukan dijumlahkan menjadi 30%.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 70,
    graphX: 280,
    graphY: 420,
    displayOrder: 12,
  },
  {
    id: NODE_IDS.PM_T2_LIN,
    code: "PM-T2-LIN",
    subtest: "PM",
    track: "quantitative",
    tier: "tier_2_standard",
    titleId: "Optimasi Biaya Linear & Titik Impas",
    titleEn: "Linear Cost & Break-Even Modeling",
    descriptionMarkdown: "Memodelkan biaya tetap, biaya variabel, margin per unit, dan target laba bersih pada konteks ekonomi nyata.",
    firstPrinciplesSummary: "Keuntungan total sama dengan (margin kontribusi per unit x jumlah unit) dikurangi biaya tetap.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 85,
    graphX: 480,
    graphY: 420,
    displayOrder: 13,
  },
  {
    id: NODE_IDS.PM_T3_PROB,
    code: "PM-T3-PROB",
    subtest: "PM",
    track: "quantitative",
    tier: "tier_3_hots_800",
    titleId: "Peluang Bersyarat & Pemodelan Geometri",
    titleEn: "Conditional Probability & Applied Geometry",
    descriptionMarkdown: "Memodelkan ruang sampel tereduksi serta luas/volume irisan pada skenario kontekstual panjang.",
    firstPrinciplesSummary: "Peluang bersyarat menyusutkan penyebut ruang sampel hanya pada kejadian yang sudah diketahui terjadi.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 95,
    graphX: 680,
    graphY: 420,
    displayOrder: 14,
  },
  // LBI
  {
    id: NODE_IDS.LBI_T0_IDEA,
    code: "LBI-T0-IDEA",
    subtest: "LBI",
    track: "literacy",
    tier: "tier_0_foundation",
    titleId: "Identifikasi Ide Pokok & Kalimat Rujukan",
    titleEn: "Main Idea & Reference Tracking",
    descriptionMarkdown: "Menemukan kalimat utama yang memayungi seluruh detail pendukung paragraf tanpa terjebak contoh spesifik.",
    firstPrinciplesSummary: "Kalimat utama memuat klaim payung yang dijelaskan oleh kalimat-kalimat lain, bukan detail angka sempit.",
    isFoundationRepair: true,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 65,
    graphX: 80,
    graphY: 560,
    displayOrder: 15,
  },
  {
    id: NODE_IDS.LBI_T1_CLAIM,
    code: "LBI-T1-CLAIM",
    subtest: "LBI",
    track: "literacy",
    tier: "tier_1_core",
    titleId: "Verifikasi Klaim Eksplisit & Jebakan Cakupan",
    titleEn: "Explicit Claim & Scope Boundaries",
    descriptionMarkdown: "Menguji kesesuaian pernyataan dengan batas kuantor teks (sebagian vs semua, korelasi vs sebab-akibat).",
    firstPrinciplesSummary: "Kata mutlak seperti 'selalu', 'semua', atau 'satu-satunya' di opsi jawaban hampir selalu merupakan overgeneralisasi.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 75,
    graphX: 290,
    graphY: 560,
    displayOrder: 16,
  },
  {
    id: NODE_IDS.LBI_T2_INF,
    code: "LBI-T2-INF",
    subtest: "LBI",
    track: "literacy",
    tier: "tier_2_standard",
    titleId: "Inferensi Sahih & Sikap Penulis",
    titleEn: "Supported Inference & Author Tone",
    descriptionMarkdown: "Menarik simpulan implisit yang tetap berada di dalam pagar bukti teks tanpa spekulasi eksternal.",
    firstPrinciplesSummary: "Inferensi yang sah hanya melangkah satu jengkal dari premis tertulis, tidak menambahkan asumsi luar.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 85,
    graphX: 500,
    graphY: 560,
    displayOrder: 17,
  },
  // LBE
  {
    id: NODE_IDS.LBE_T0_REF,
    code: "LBE-T0-REF",
    subtest: "LBE",
    track: "literacy",
    tier: "tier_0_foundation",
    titleId: "Pronoun Reference & Lexical Meaning",
    titleEn: "Pronoun Reference & Context Clues",
    descriptionMarkdown: "Menghubungkan kata ganti (they, which, such) dan kosakata akademik ke anteseden persis sebelum titik rujukan.",
    firstPrinciplesSummary: "Match grammatical number and semantic role directly to the nearest valid antecedent clause.",
    isFoundationRepair: true,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 65,
    graphX: 80,
    graphY: 690,
    displayOrder: 18,
  },
  {
    id: NODE_IDS.LBE_T1_PURP,
    code: "LBE-T1-PURP",
    subtest: "LBE",
    track: "literacy",
    tier: "tier_1_core",
    titleId: "Author Purpose, Tone & Paragraph Function",
    titleEn: "Author Purpose & Rhetorical Function",
    descriptionMarkdown: "Mengidentifikasi fungsi retoris paragraf (menyangkal mitos, membandingkan solusi, memaparkan batasan studi).",
    firstPrinciplesSummary: "Inspect transition markers (however, conversely, consequently) to locate the writer's true argumentative pivot.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 75,
    graphX: 290,
    graphY: 690,
    displayOrder: 19,
  },
  {
    id: NODE_IDS.LBE_T3_EVAL,
    code: "LBE-T3-EVAL",
    subtest: "LBE",
    track: "literacy",
    tier: "tier_3_hots_800",
    titleId: "Multi-Text Synthesis & Assumption Critique",
    titleEn: "Paired-Text Synthesis & Critique",
    descriptionMarkdown: "Membandingkan kesepakatan, kontradiksi, dan celah bukti antara dua teks atau pendapat peneliti berbeda.",
    firstPrinciplesSummary: "Pinpoint the exact variable where Text A and Text B diverge before checking cross-text synthesis options.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 90,
    graphX: 500,
    graphY: 690,
    displayOrder: 20,
  },
  // PBM
  {
    id: NODE_IDS.PBM_T0_EJA,
    code: "PBM-T0-EJA",
    subtest: "PBM",
    track: "literacy",
    tier: "tier_0_foundation",
    titleId: "EYD V: Imbuhan di-/ke-, Huruf Kapital & Koma",
    titleEn: "Indonesian Orthography & Punctuation",
    descriptionMarkdown: "Membedakan preposisi di/ke (spasi) dengan prefiks di-/ke- (serangkai) serta penggunaan tanda koma sebelum konjungsi.",
    firstPrinciplesSummary: "Jika bisa diubah menjadi bentuk aktif me-, maka 'di-' adalah imbuhan yang wajib ditulis serangkai.",
    isFoundationRepair: true,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 50,
    graphX: 80,
    graphY: 820,
    displayOrder: 21,
  },
  {
    id: NODE_IDS.PBM_T1_EFF,
    code: "PBM-T1-EFF",
    subtest: "PBM",
    track: "literacy",
    tier: "tier_1_core",
    titleId: "Kalimat Efektif, Subjek-Predikat & Kepaduan",
    titleEn: "Effective Sentences & Cohesion",
    descriptionMarkdown: "Mendeteksi kalimat tanpa subjek akibat preposisi awal serta menghilangkan pleonasme dan keambiguan.",
    firstPrinciplesSummary: "Kalimat yang diawali kata depan ('Bagi...', 'Dalam...', 'Untuk...') tidak memiliki subjek inti jika tidak ditutup subjek baru setelah koma.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 65,
    graphX: 290,
    graphY: 820,
    displayOrder: 22,
  },
  // PPU
  {
    id: NODE_IDS.PPU_T1_SEM,
    code: "PPU-T1-SEM",
    subtest: "PPU",
    track: "literacy",
    tier: "tier_1_core",
    titleId: "Makna Kata, Imbuhan & Pergeseran Semantik",
    titleEn: "Semantic Nuance & Affixation",
    descriptionMarkdown: "Menentukan makna kontekstual kata berimbuhan, makna konotatif, serta relasi sinonim/antonim fungsional.",
    firstPrinciplesSummary: "Uji makna kata dengan mensubstitusi ke dalam kalimat sumber tanpa mengubah hubungan antar klausa.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 60,
    graphX: 500,
    graphY: 820,
    displayOrder: 23,
  },
  {
    id: NODE_IDS.PPU_T2_ASSOC,
    code: "PPU-T2-ASSOC",
    subtest: "PPU",
    track: "literacy",
    tier: "tier_2_standard",
    titleId: "Asosiasi Paragraf, Frasa Inti & Analogi Bahasa",
    titleEn: "Phrase Structure & Analogy",
    descriptionMarkdown: "Mengenali pola paralel frasa nominal/verbal dan hubungan logis antarparagraf dalam wacana umum.",
    firstPrinciplesSummary: "Pola frasa setara menuntut kelas kata inti (D-M) yang sejajar antara frasa acuan dan frasa target.",
    isFoundationRepair: false,
    softGateThreshold: 0.75,
    conquestThreshold: 0.85,
    targetSolveSeconds: 70,
    graphX: 700,
    graphY: 820,
    displayOrder: 24,
  },
];

export const SEED_SKILL_EDGES: SkillPrerequisiteEdge[] = [
  // PK DAG
  { parentNodeId: NODE_IDS.PK_T0_FRAC, childNodeId: NODE_IDS.PK_T0_ALG, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PK_T0_ALG, childNodeId: NODE_IDS.PK_T1_LIN, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PK_T0_FRAC, childNodeId: NODE_IDS.PK_T2_RATE, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PK_T0_ALG, childNodeId: NODE_IDS.PK_T2_QUAD, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PK_T1_LIN, childNodeId: NODE_IDS.PK_T2_QUAD, edgeType: "soft_prereq", weight: 0.7 },
  { parentNodeId: NODE_IDS.PK_T2_QUAD, childNodeId: NODE_IDS.PK_T3_INEQ, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PK_T1_LIN, childNodeId: NODE_IDS.PK_T0_ALG, edgeType: "remedial_bridge", weight: 0.9 },
  // PU DAG
  { parentNodeId: NODE_IDS.PU_T0_LOG, childNodeId: NODE_IDS.PU_T1_SYL, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PU_T1_SYL, childNodeId: NODE_IDS.PU_T2_ARG, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PU_T2_ARG, childNodeId: NODE_IDS.PU_T3_PAT, edgeType: "soft_prereq", weight: 0.8 },
  // PM DAG
  { parentNodeId: NODE_IDS.PM_T0_UNIT, childNodeId: NODE_IDS.PM_T1_PCT, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PK_T0_FRAC, childNodeId: NODE_IDS.PM_T1_PCT, edgeType: "soft_prereq", weight: 0.8 },
  { parentNodeId: NODE_IDS.PM_T1_PCT, childNodeId: NODE_IDS.PM_T2_LIN, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PK_T1_LIN, childNodeId: NODE_IDS.PM_T2_LIN, edgeType: "soft_prereq", weight: 0.8 },
  { parentNodeId: NODE_IDS.PM_T2_LIN, childNodeId: NODE_IDS.PM_T3_PROB, edgeType: "hard_prereq", weight: 1.0 },
  // LBI DAG
  { parentNodeId: NODE_IDS.LBI_T0_IDEA, childNodeId: NODE_IDS.LBI_T1_CLAIM, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.LBI_T1_CLAIM, childNodeId: NODE_IDS.LBI_T2_INF, edgeType: "hard_prereq", weight: 1.0 },
  // LBE DAG
  { parentNodeId: NODE_IDS.LBE_T0_REF, childNodeId: NODE_IDS.LBE_T1_PURP, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.LBE_T1_PURP, childNodeId: NODE_IDS.LBE_T3_EVAL, edgeType: "hard_prereq", weight: 1.0 },
  // PBM & PPU DAG
  { parentNodeId: NODE_IDS.PBM_T0_EJA, childNodeId: NODE_IDS.PBM_T1_EFF, edgeType: "hard_prereq", weight: 1.0 },
  { parentNodeId: NODE_IDS.PBM_T1_EFF, childNodeId: NODE_IDS.PPU_T1_SEM, edgeType: "soft_prereq", weight: 0.7 },
  { parentNodeId: NODE_IDS.PPU_T1_SEM, childNodeId: NODE_IDS.PPU_T2_ASSOC, edgeType: "hard_prereq", weight: 1.0 },
];

export const CURATED_CORE_QUESTIONS: QuestionEntity[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PK_T0_FRAC,
    subtest: "PK",
    track: "quantitative",
    tier: "tier_0_foundation",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Hitung nilai bentuk pecahan berikut secara tepat: $\\dfrac{3}{4} - \\dfrac{5}{6} + \\dfrac{1}{2} = \\dots$",
    stemLatex: "\\frac{3}{4} - \\frac{5}{6} + \\frac{1}{2}",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "$\\dfrac{5}{12}$", latex: "\\frac{5}{12}", trapType: "none", distractorRationale: "Benar: samakan penyebut menjadi $12$, sehingga $\\dfrac{9 - 10 + 6}{12} = \\dfrac{5}{12}$." },
      { key: "B", textMarkdown: "$-\\dfrac{1}{12}$", latex: "-\\frac{1}{12}", trapType: "sign_error", distractorRationale: "Salah mengabaikan suku $+\\dfrac{1}{2}$ atau keliru tanda saat menghitung $-1 + 6$." },
      { key: "C", textMarkdown: "$\\dfrac{1}{4}$", latex: "\\frac{1}{4}", trapType: "arithmetic_slip", distractorRationale: "Salah mengurangi pembilang dan penyebut secara langsung tanpa menyamakan KPK." },
      { key: "D", textMarkdown: "$\\dfrac{7}{12}$", latex: "\\frac{7}{12}", trapType: "sign_error", distractorRationale: "Keliru menulis $\\dfrac{3}{4}$ sebagai $\\dfrac{11}{12}$ atau salah hitung $9 - 10 = +1$." },
      { key: "E", textMarkdown: "$\\dfrac{11}{12}$", latex: "\\frac{11}{12}", trapType: "arithmetic_slip", distractorRationale: "Keliru menyamakan $\\dfrac{1}{2}$ menjadi $\\dfrac{12}{12}$, seharusnya $\\dfrac{6}{12}$." },
    ],
    correctAnswerKey: "A",
    officialSolutionMarkdown: "KPK dari 4, 6, dan 2 adalah 12. Ubah setiap pecahan menjadi penyebut 12: $\\frac{9}{12} - \\frac{10}{12} + \\frac{6}{12} = \\frac{5}{12}$.",
    solutionSteps: [
      { stage: "deconstruct", title: "Samakan Penyebut (KPK)", instructionMarkdown: "Cari kelipatan persekutuan terkecil dari 4, 6, dan 2, yaitu 12.", formulaLatex: "\\text{KPK}(4,6,2) = 12" },
      { stage: "setup", title: "Konversi Pembilang Setara", instructionMarkdown: "Kalikan pembilang dan penyebut masing-masing pecahan agar penyebut bernilai 12.", formulaLatex: "\\frac{9}{12} - \\frac{10}{12} + \\frac{6}{12}" },
      { stage: "solve", title: "Operasikan Pembilang Berurutan", instructionMarkdown: "Hitung dari kiri ke kanan dengan memperhatikan tanda negatif pada -10.", formulaLatex: "\\frac{9 - 10 + 6}{12} = \\frac{-1 + 6}{12} = \\frac{5}{12}" },
    ],
    sbiDeconstruction: {
      schemaType: "fraction_lcd_combine",
      schemaLabelId: "Penjumlahan & Pengurangan Pecahan (KPK Penyebut)",
      knownVariables: [
        { symbol: "a", label: "Suku pertama", valueText: "3/4" },
        { symbol: "b", label: "Suku kedua", valueText: "-5/6" },
        { symbol: "c", label: "Suku ketiga", valueText: "+1/2" },
      ],
      targetUnknown: "Hasil tunggal pecahan sederhana",
      baseRelationLatex: "\\frac{p}{q} + \\frac{r}{s} = \\frac{ps + rq}{qs}",
    },
    irtDifficultyB: -1.6,
    irtDiscriminationA: 1.15,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 45,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PK_T0_ALG,
    subtest: "PK",
    track: "quantitative",
    tier: "tier_0_foundation",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Diketahui persamaan linear $3(2x - 5) = 4x - 7$. Nilai dari $x + 2$ adalah $\\dots$",
    stemLatex: "3(2x - 5) = 4x - 7",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "$4$", latex: "4", trapType: "formula_misapplication", distractorRationale: "Menjawab nilai $x = 4$, lupa bahwa pertanyaan meminta $x + 2$." },
      { key: "B", textMarkdown: "$6$", latex: "6", trapType: "none", distractorRationale: "Benar: $6x - 15 = 4x - 7$ menghasilkan $2x = 8$, sehingga $x = 4$ dan $x + 2 = 6$." },
      { key: "C", textMarkdown: "$-2$", latex: "-2", trapType: "sign_error", distractorRationale: "Salah tanda saat memindahkan $-15$ ke ruas kanan menjadi $-7 - 15$." },
      { key: "D", textMarkdown: "$3$", latex: "3", trapType: "arithmetic_slip", distractorRationale: "Keliru mendistribusikan $3(2x - 5)$ menjadi $6x - 5$, seharusnya $6x - 15$." },
      { key: "E", textMarkdown: "$10$", latex: "10", trapType: "sign_error", distractorRationale: "Salah menjumlahkan $6x + 4x$ menjadi $10x$, seharusnya $6x - 4x = 2x$." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Jabarkan ruas kiri: $6x - 15 = 4x - 7$. Kurangkan $4x$ dan tambahkan $15$ pada kedua ruas: $2x = 8 \\implies x = 4$. Maka $x + 2 = 6$.",
    solutionSteps: [
      { stage: "deconstruct", title: "Distribusi Suku dalam Kurung", instructionMarkdown: "Kalikan angka 3 ke setiap suku di dalam tanda kurung.", formulaLatex: "6x - 15 = 4x - 7" },
      { stage: "setup", title: "Kelompokkan Variabel & Konstanta", instructionMarkdown: "Kurangkan 4x pada kedua ruas dan tambahkan 15 pada kedua ruas.", formulaLatex: "6x - 4x = 15 - 7 \\implies 2x = 8" },
      { stage: "solve", title: "Hitung Nilai Target (x + 2)", instructionMarkdown: "Setelah mendapat x = 4, substitusi ke bentuk yang ditanyakan soal.", formulaLatex: "x = 4 \\implies x + 2 = 6" },
    ],
    sbiDeconstruction: {
      schemaType: "linear_single_variable",
      schemaLabelId: "Persamaan Linear Satu Variabel + Target Substitusi",
      knownVariables: [{ symbol: "eq", label: "Persamaan", valueText: "3(2x - 5) = 4x - 7" }],
      targetUnknown: "x + 2",
      baseRelationLatex: "ax + b = cx + d \\implies x = \\frac{d - b}{a - c}",
    },
    irtDifficultyB: -1.1,
    irtDiscriminationA: 1.25,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 50,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PK_T1_LIN,
    subtest: "PK",
    track: "quantitative",
    tier: "tier_1_core",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Garis $g$ melalui titik $(2, -3)$ dan tegak lurus terhadap garis $2x - 4y + 5 = 0$. Persamaan garis $g$ adalah $\\dots$",
    stemLatex: "2x - 4y + 5 = 0",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "$2x + y - 1 = 0$", latex: "2x + y - 1 = 0", trapType: "none", distractorRationale: "Benar: $m_1 = \\dfrac{1}{2}$ sehingga $m_2 = -2$. Persamaan $y + 3 = -2(x - 2)$ menghasilkan $2x + y - 1 = 0$." },
      { key: "B", textMarkdown: "$x - 2y - 8 = 0$", latex: "x - 2y - 8 = 0", trapType: "formula_misapplication", distractorRationale: "Menggunakan gradien sejajar $m_2 = \\dfrac{1}{2}$, bukan tegak lurus ($m_2 = -2$)." },
      { key: "C", textMarkdown: "$2x + y + 1 = 0$", latex: "2x + y + 1 = 0", trapType: "sign_error", distractorRationale: "Salah tanda saat memindahkan konstanta $-2(-2) - 3$." },
      { key: "D", textMarkdown: "$2x - y - 7 = 0$", latex: "2x - y - 7 = 0", trapType: "sign_error", distractorRationale: "Mengambil $m_2 = +2$ tanpa mengalikan tanda negatif." },
      { key: "E", textMarkdown: "$x + 2y + 4 = 0$", latex: "x + 2y + 4 = 0", trapType: "formula_misapplication", distractorRationale: "Mengambil $m_2 = -\\dfrac{1}{2}$ (hanya menukar tanda tanpa membalik pecahan)." },
    ],
    correctAnswerKey: "A",
    officialSolutionMarkdown: "Gradien garis acuan $2x - 4y + 5 = 0$ adalah $m_1 = \\frac{-2}{-4} = \\frac{1}{2}$. Karena tegak lurus, $m_2 = -\\frac{1}{m_1} = -2$. Persamaan garis: $y - (-3) = -2(x - 2) \\implies 2x + y - 1 = 0$.",
    solutionSteps: [
      { stage: "deconstruct", title: "Temukan Gradien Acuan (m1)", instructionMarkdown: "Ubah 2x - 4y + 5 = 0 ke bentuk y = mx + c.", formulaLatex: "y = \\frac{1}{2}x + \\frac{5}{4} \\implies m_1 = \\frac{1}{2}" },
      { stage: "setup", title: "Terapkan Syarat Tegak Lurus", instructionMarkdown: "Hasil kali dua gradien tegak lurus adalah -1.", formulaLatex: "m_1 \\cdot m_2 = -1 \\implies m_2 = -2" },
      { stage: "solve", title: "Susun Persamaan Garis", instructionMarkdown: "Substitusi titik (2, -3) dan gradien m2 = -2.", formulaLatex: "y + 3 = -2(x - 2) \\implies 2x + y - 1 = 0" },
    ],
    sbiDeconstruction: {
      schemaType: "perpendicular_line",
      schemaLabelId: "Persamaan Garis Tegak Lurus",
      knownVariables: [
        { symbol: "P", label: "Titik lalui", valueText: "(2, -3)" },
        { symbol: "L_1", label: "Garis acuan", valueText: "2x - 4y + 5 = 0" },
      ],
      targetUnknown: "Persamaan garis g",
      baseRelationLatex: "m_1 \\cdot m_2 = -1,\\quad y - y_1 = m_2(x - x_1)",
    },
    irtDifficultyB: -0.2,
    irtDiscriminationA: 1.3,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 70,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PK_T2_RATE,
    subtest: "PK",
    track: "quantitative",
    tier: "tier_2_standard",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Suatu pekerjaan pembangunan taman kota direncanakan selesai dalam $24$ hari oleh $12$ pekerja. Jika pengelola menambah $4$ pekerja sejak hari pertama dengan kecepatan kerja yang sama, waktu penyelesaian pekerjaan tersebut menjadi $\\dots$",
    stemLatex: "12 \\times 24 = (12 + 4) \\times t",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "$32$ hari", latex: "32", trapType: "formula_misapplication", distractorRationale: "Menggunakan perbandingan senilai $\\dfrac{16}{12} \\times 24 = 32$ hari." },
      { key: "B", textMarkdown: "$20$ hari", latex: "20", trapType: "arithmetic_slip", distractorRationale: "Sekadar mengurangkan $24 - 4 = 20$ hari tanpa menghitung beban kerja." },
      { key: "C", textMarkdown: "$18$ hari", latex: "18", trapType: "none", distractorRationale: "Benar: $12 \\times 24 = 16 \\times t$, sehingga $t = \\dfrac{288}{16} = 18$ hari." },
      { key: "D", textMarkdown: "$16$ hari", latex: "16", trapType: "arithmetic_slip", distractorRationale: "Tertukar antara total pekerja baru ($16$) dan waktu baru." },
      { key: "E", textMarkdown: "$8$ hari", latex: "8", trapType: "arithmetic_slip", distractorRationale: "Menghitung selisih hari atau membagi $\\dfrac{24}{3} = 8$." },
    ],
    correctAnswerKey: "C",
    officialSolutionMarkdown: "Semakin banyak pekerja, waktu semakin singkat (perbandingan berbalik nilai). Total beban kerja = $12 \\times 24 = 288$ orang-hari. Dengan $12 + 4 = 16$ pekerja, waktu = $\\frac{288}{16} = 18$ hari.",
    solutionSteps: [
      { stage: "deconstruct", title: "Identifikasi Skema Berbalik Nilai", instructionMarkdown: "Pekerja bertambah berarti waktu turun dengan total kerja konstan.", formulaLatex: "W_{\\text{total}} = P_1 \\times t_1" },
      { stage: "setup", title: "Hitung Total Pekerja Baru", instructionMarkdown: "Jumlah pekerja baru P2 adalah 12 + 4 = 16 orang.", formulaLatex: "12 \\times 24 = 16 \\times t_2" },
      { stage: "solve", title: "Selesaikan t2", instructionMarkdown: "Bagi total beban kerja dengan 16.", formulaLatex: "t_2 = \\frac{288}{16} = 18\\text{ hari}" },
    ],
    sbiDeconstruction: {
      schemaType: "inverse_proportion_work",
      schemaLabelId: "Perbandingan Berbalik Nilai (Beban Kerja Tetap)",
      knownVariables: [
        { symbol: "P_1", label: "Pekerja awal", valueText: "12 orang" },
        { symbol: "t_1", label: "Waktu awal", valueText: "24 hari" },
        { symbol: "\\Delta P", label: "Tambahan pekerja", valueText: "4 orang" },
      ],
      targetUnknown: "Waktu selesai baru (t_2)",
      baseRelationLatex: "P_1 \\cdot t_1 = P_2 \\cdot t_2",
    },
    irtDifficultyB: 0.15,
    irtDiscriminationA: 1.35,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 65,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PK_T2_QUAD,
    subtest: "PK",
    track: "quantitative",
    tier: "tier_2_standard",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Jika $\\alpha$ dan $\\beta$ merupakan akar-akar persamaan kuadrat $x^2 - 6x + 4 = 0$, maka nilai $\\alpha^2 + \\beta^2$ adalah $\\dots$",
    stemLatex: "x^2 - 6x + 4 = 0",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "$28$", latex: "28", trapType: "none", distractorRationale: "Benar: $(\\alpha + \\beta)^2 - 2\\alpha\\beta = 6^2 - 2(4) = 36 - 8 = 28$." },
      { key: "B", textMarkdown: "$36$", latex: "36", trapType: "formula_misapplication", distractorRationale: "Mengira $\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 = 36$ tanpa dikurangi $2\\alpha\\beta$." },
      { key: "C", textMarkdown: "$44$", latex: "44", trapType: "sign_error", distractorRationale: "Salah tanda dengan menjumlahkan $+2\\alpha\\beta$ menjadi $36 + 8 = 44$." },
      { key: "D", textMarkdown: "$20$", latex: "20", trapType: "arithmetic_slip", distractorRationale: "Keliru mengurangkan $4\\alpha\\beta$ menjadi $36 - 16 = 20$." },
      { key: "E", textMarkdown: "$32$", latex: "32", trapType: "arithmetic_slip", distractorRationale: "Keliru hanya mengurangi $\\alpha\\beta$ satu kali ($36 - 4 = 32$)." },
    ],
    correctAnswerKey: "A",
    officialSolutionMarkdown: "Gunakan identitas Vieta: $\\alpha + \\beta = 6$ dan $\\alpha\\beta = 4$. Maka $\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta = 36 - 8 = 28$.",
    solutionSteps: [
      { stage: "deconstruct", title: "Baca Koefisien Vieta", instructionMarkdown: "Untuk ax^2 + bx + c = 0, tentukan jumlah dan hasil kali akar.", formulaLatex: "\\alpha + \\beta = 6,\\quad \\alpha\\beta = 4" },
      { stage: "setup", title: "Ubah ke Identitas Kuadrat Sempurna", instructionMarkdown: "Hindari mencari akar irasional; gunakan penjabaran kuadrat jumlah.", formulaLatex: "\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta" },
      { stage: "solve", title: "Substitusi Nilai", instructionMarkdown: "Hitung nilai akhir.", formulaLatex: "6^2 - 2(4) = 36 - 8 = 28" },
    ],
    sbiDeconstruction: {
      schemaType: "vieta_symmetric_identity",
      schemaLabelId: "Identitas Simetris Akar Kuadrat (Vieta)",
      knownVariables: [
        { symbol: "\\alpha+\\beta", label: "Jumlah akar (-b/a)", valueText: "6" },
        { symbol: "\\alpha\\beta", label: "Kali akar (c/a)", valueText: "4" },
      ],
      targetUnknown: "\\alpha^2 + \\beta^2",
      baseRelationLatex: "\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta",
    },
    irtDifficultyB: 0.35,
    irtDiscriminationA: 1.4,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 70,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PK_T3_INEQ,
    subtest: "PK",
    track: "quantitative",
    tier: "tier_3_hots_800",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Apakah $x > 0$? Putuskan apakah pernyataan (1) dan (2) berikut cukup untuk menjawab pertanyaan tersebut.\n\n(1) $x^2 - 4x = 0$\n(2) $x + 1 > 2$",
    stemLatex: "(1)\\; x^2 - 4x = 0 \\quad (2)\\; x + 1 > 2",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Pernyataan (1) SAJA cukup untuk menjawab pertanyaan, tetapi pernyataan (2) SAJA tidak cukup.", trapType: "formula_misapplication", latex: null, distractorRationale: "Dari (1), nilai $x$ bisa $0$ atau $4$ sehingga $x > 0$ belum pasti." },
      { key: "B", textMarkdown: "Pernyataan (2) SAJA cukup untuk menjawab pertanyaan, tetapi pernyataan (1) SAJA tidak cukup.", trapType: "none", latex: null, distractorRationale: "Benar: (2) menghasilkan $x > 1$ yang otomatis menjamin $x > 0$, sedangkan (1) memberi $x = 0$ atau $x = 4$." },
      { key: "C", textMarkdown: "DUA pernyataan BERSAMA-SAMA cukup untuk menjawab pertanyaan, tetapi SATU pernyataan SAJA tidak cukup.", trapType: "formula_misapplication", latex: null, distractorRationale: "Tidak perlu menggabungkan (1) karena (2) saja sudah pasti menjamin $x > 0$." },
      { key: "D", textMarkdown: "Pernyataan (1) SAJA cukup untuk menjawab pertanyaan dan pernyataan (2) SAJA cukup.", trapType: "formula_misapplication", latex: null, distractorRationale: "Terjebak menganggap $x = 0$ pada (1) memenuhi $x > 0$." },
      { key: "E", textMarkdown: "Pernyataan (1) dan pernyataan (2) tidak cukup untuk menjawab pertanyaan.", trapType: "formula_misapplication", latex: null, distractorRationale: "Mengabaikan fakta bahwa $x > 1$ selalu lebih besar dari $0$." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Uji (1): $x(x - 4) = 0 \\implies x = 0$ atau $x = 4$. Untuk $x = 0$, jawaban TIDAK ($0 > 0$ salah); untuk $x = 4$, YA. Jadi (1) tidak cukup. Uji (2): $x + 1 > 2 \\implies x > 1$, maka pasti $x > 0$ (selalu YA). Jadi (2) SAJA cukup.",
    solutionSteps: [
      { stage: "deconstruct", title: "Uji Pernyataan (1) Secara Terpisah", instructionMarkdown: "Faktorkan x^2 - 4x = 0 dan cek kedua nilai akar terhadap syarat x > 0.", formulaLatex: "x(x - 4) = 0 \\implies x \\in \\{0, 4\\}" },
      { stage: "setup", title: "Uji Pernyataan (2) Secara Terpisah", instructionMarkdown: "Selesaikan pertidaksamaan tanpa mencampur informasi dari (1).", formulaLatex: "x + 1 > 2 \\implies x > 1 > 0" },
      { stage: "solve", title: "Simpulkan Kecukupan Data", instructionMarkdown: "Hanya (2) yang memberi jawaban tunggal konsisten (YA).", formulaLatex: "\\text{Cukup: (2) SAJA}" },
    ],
    sbiDeconstruction: {
      schemaType: "data_sufficiency_polarity",
      schemaLabelId: "Uji Kecukupan Data Tunggal vs Gabungan",
      knownVariables: [
        { symbol: "S_1", label: "Pernyataan 1", valueText: "x(x-4)=0" },
        { symbol: "S_2", label: "Pernyataan 2", valueText: "x+1>2" },
      ],
      targetUnknown: "Kepastian apakah x > 0",
      baseRelationLatex: "x > 1 \\implies x > 0",
    },
    irtDifficultyB: 0.9,
    irtDiscriminationA: 1.5,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 75,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  // PU
  {
    id: "20000000-0000-4000-8000-000000000007",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PU_T0_LOG,
    subtest: "PU",
    track: "quantitative",
    tier: "tier_0_foundation",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Ingkaran (negasi) yang tepat dari pernyataan: *\"Semua peserta kelas intensif membaca modul dan mengerjakan latihan\"* adalah $\\dots$",
    stemLatex: "\\neg(\\forall x,\\; P(x) \\land Q(x)) \\equiv \\exists x,\\; \\neg P(x) \\lor \\neg Q(x)",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Semua peserta kelas intensif tidak membaca modul dan tidak mengerjakan latihan.", latex: null, trapType: "overgeneralization", distractorRationale: "Menegasikan kuantor 'semua' bukan menjadi 'semua tidak', melainkan 'ada/beberapa'." },
      { key: "B", textMarkdown: "Ada peserta kelas intensif yang tidak membaca modul atau tidak mengerjakan latihan.", latex: null, trapType: "none", distractorRationale: "Benar: negasi kuantor universal menjadi eksistensial, dan konjungsi (dan) berubah menjadi disjungsi (atau)." },
      { key: "C", textMarkdown: "Ada peserta kelas intensif yang tidak membaca modul dan tidak mengerjakan latihan.", latex: null, trapType: "formula_misapplication", distractorRationale: "Lupa mengubah kata hubung 'dan' menjadi 'atau' sesuai hukum De Morgan." },
      { key: "D", textMarkdown: "Beberapa peserta kelas intensif membaca modul atau tidak mengerjakan latihan.", latex: null, trapType: "sign_error", distractorRationale: "Hanya menegasikan klausa kedua, membiarkan klausa pertama positif." },
      { key: "E", textMarkdown: "Tidak ada peserta kelas intensif yang membaca modul maupun mengerjakan latihan.", latex: null, trapType: "overgeneralization", distractorRationale: "Mengubah pernyataan menjadi penyangkalan total tanpa alasan logis." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Negasi dari kuantor universal ($\\forall$) adalah kuantor eksistensial (*ada/beberapa*). Menurut hukum De Morgan, $\\neg(P \\land Q) \\equiv \\neg P \\lor \\neg Q$ (menggunakan **atau**).",
    solutionSteps: [
      { stage: "deconstruct", title: "Negasi Kuantor Universal", instructionMarkdown: "Ganti 'Semua' dengan 'Ada' atau 'Beberapa'.", formulaLatex: "\\neg(\\forall x) \\equiv \\exists x" },
      { stage: "solve", title: "Terapkan Hukum De Morgan", instructionMarkdown: "Negasi dari 'P dan Q' adalah 'tidak P atau tidak Q'.", formulaLatex: "\\neg(P \\land Q) \\equiv \\neg P \\lor \\neg Q" },
    ],
    sbiDeconstruction: {
      schemaType: "quantifier_demorgan",
      schemaLabelId: "Negasi Kuantor & Hukum De Morgan",
      knownVariables: [{ symbol: "\\phi", label: "Pernyataan", valueText: "Semua: (P dan Q)" }],
      targetUnknown: "Negasi logis sah",
      baseRelationLatex: "\\neg(\\forall x, P \\land Q) \\equiv \\exists x, (\\neg P \\lor \\neg Q)",
    },
    irtDifficultyB: -1.0,
    irtDiscriminationA: 1.25,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 45,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000008",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PU_T1_SYL,
    subtest: "PU",
    track: "quantitative",
    tier: "tier_1_core",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Diketahui dua premis berikut:\n1. Jika siswa menguasai konsep pecahan, maka ia dapat menyelesaikan soal perbandingan.\n2. Siswa tidak dapat menyelesaikan soal perbandingan atau ia memperoleh skor PK di atas 750.\n3. Ternyata Raka tidak memperoleh skor PK di atas 750.\n\nSimpulan yang paling tepat adalah $\\dots$",
    stemLatex: "(P \\to Q) \\land (\\neg Q \\lor R) \\land \\neg R \\implies \\neg P",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Raka menguasai konsep pecahan.", latex: null, trapType: "sign_error", distractorRationale: "Bertentangan langsung dengan hasil Modus Tollens." },
      { key: "B", textMarkdown: "Raka tidak menguasai konsep pecahan.", latex: null, trapType: "none", distractorRationale: "Benar: $(\\neg Q \\lor R)$ bersama $\\neg R$ memaksa $\\neg Q$; lalu $(P \\Rightarrow Q)$ dengan $\\neg Q$ memaksa $\\neg P$." },
      { key: "C", textMarkdown: "Raka dapat menyelesaikan soal perbandingan.", latex: null, trapType: "formula_misapplication", distractorRationale: "Gagal menerapkan silogisme disjungtif pada $(\\neg Q \\lor R)$." },
      { key: "D", textMarkdown: "Raka mungkin menguasai konsep pecahan meskipun skor PK di bawah 750.", latex: null, trapType: "unsupported_inference", distractorRationale: "Membuat ketidakpastian padahal kesimpulan $\\neg P$ bersifat deduktif pasti." },
      { key: "E", textMarkdown: "Jika Raka tidak menguasai konsep pecahan, maka skor PK di atas 750.", latex: null, trapType: "causal_reversal", distractorRationale: "Menyimpulkan invers palsu $(\\neg P \\Rightarrow \\neg Q)$." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Premis 2 setara dengan $Q \\to R$. Bersama premis 1 ($P \\to Q$), terbentuk rantai $P \\to Q \\to R$. Karena faktanya $\\neg R$ (Premis 3), dengan Modus Tollens disimpulkan $\\neg P$: Raka tidak menguasai konsep pecahan.",
    solutionSteps: [
      { stage: "deconstruct", title: "Ubah Disjungsi ke Implikasi", instructionMarkdown: "Bentuk (~Q atau R) ekuivalen dengan (jika Q maka R).", formulaLatex: "\\neg Q \\lor R \\equiv (Q \\to R)" },
      { stage: "setup", title: "Rangkai Silogisme Hipotesis", instructionMarkdown: "Gabungkan P -> Q dan Q -> R.", formulaLatex: "P \\to Q \\to R \\implies (P \\to R)" },
      { stage: "solve", title: "Terapkan Modus Tollens", instructionMarkdown: "Fakta ~R menarik simpulan pasti ~P.", formulaLatex: "(P \\to R) \\land \\neg R \\vdash \\neg P" },
    ],
    sbiDeconstruction: {
      schemaType: "syllogism_modus_tollens",
      schemaLabelId: "Rantai Silogisme & Modus Tollens",
      knownVariables: [
        { symbol: "P_1", label: "Premis 1", valueText: "P -> Q" },
        { symbol: "P_2", label: "Premis 2", valueText: "~Q v R (Q -> R)" },
        { symbol: "P_3", label: "Fakta", valueText: "~R" },
      ],
      targetUnknown: "Simpulan sah atas P",
      baseRelationLatex: "(P \\to R) \\land \\neg R \\vdash \\neg P",
    },
    irtDifficultyB: 0.1,
    irtDiscriminationA: 1.35,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 60,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000009",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PU_T2_ARG,
    subtest: "PU",
    track: "quantitative",
    tier: "tier_2_standard",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Peneliti pendidikan menyatakan: *\"Siswa yang rutin mengerjakan bank soal dengan jeda pengulangan terstruktur memperoleh kenaikan skor tryout lebih tinggi daripada siswa yang membaca ringkasan materi berulang-ulang.\"*\n\nManakah pernyataan berikut yang paling **memperkuat** argumen peneliti tersebut?",
    stemLatex: null,
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Harga buku bank soal cetak di toko buku semakin mahal tahun ini.", latex: null, trapType: "scope_shift", distractorRationale: "Tidak relevan terhadap mekanisme belajar maupun kenaikan skor." },
      { key: "B", textMarkdown: "Uji terkontrol selama 8 minggu menunjukkan kelompok latihan aktif mengingat kembali 38% lebih banyak rumus dibanding kelompok baca ulang pada durasi belajar yang sama.", latex: null, trapType: "none", distractorRationale: "Benar: mengendalikan variabel durasi belajar dan memberi data kausal pendukung mekanisme retrieval." },
      { key: "C", textMarkdown: "Banyak siswa merasa lebih nyaman membaca ringkasan materi sambil mendengarkan musik.", latex: null, trapType: "scope_shift", distractorRationale: "Membahas kenyamanan subjektif, bukan efektivitas peningkatan skor." },
      { key: "D", textMarkdown: "Sebagian siswa berprestasi sudah memiliki skor tinggi sebelum mengikuti tryout.", latex: null, trapType: "causal_reversal", distractorRationale: "Justru memperlemah klaim peneliti karena menyinggung bias seleksi awal." },
      { key: "E", textMarkdown: "Semua aplikasi belajar daring menyediakan fitur ringkasan materi singkat.", latex: null, trapType: "overgeneralization", distractorRationale: "Klaim umum tentang fitur aplikasi yang tidak menguji perbandingan dua metode." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Argumen peneliti membandingkan efektivitas latihan terjadwal dibanding baca ulang. Bukti eksperimen terkontrol dengan durasi setara yang menunjukkan keunggulan daya ingat aktif (+38%) langsung memperkuat jembatan kausal argumen.",
    solutionSteps: [
      { stage: "deconstruct", title: "Identifikasi Klaim Kausal", instructionMarkdown: "Klaim membandingkan metode A (latihan terjadwal) vs metode B (baca ulang) terhadap skor.", formulaLatex: "\\text{Metode A} > \\text{Metode B}" },
      { stage: "solve", title: "Pilih Bukti Terkontrol", instructionMarkdown: "Cari opsi yang menyamakan perancu (durasi belajar) dan mendukung efek metode A.", formulaLatex: "\\text{Kontrol Durasi} + \\text{Keunggulan Retrieval}" },
    ],
    sbiDeconstruction: null,
    irtDifficultyB: 0.45,
    irtDiscriminationA: 1.25,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 65,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  // PM
  {
    id: "20000000-0000-4000-8000-000000000010",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PM_T0_UNIT,
    subtest: "PM",
    track: "quantitative",
    tier: "tier_0_foundation",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Sebuah pompa air mengisi bak penampungan dengan debit konstan $15\\text{ liter/menit}$. Jika kapasitas kosong bak adalah $0{,}9\\text{ m}^3$ (ingat $1\\text{ m}^3 = 1.000\\text{ liter}$), berapa **jam** waktu yang dibutuhkan hingga bak penuh?",
    stemLatex: "V = 0{,}9\\text{ m}^3 = 900\\text{ liter},\\quad Q = 15\\text{ liter/menit}",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "$1$ jam", latex: "1", trapType: "none", distractorRationale: "Benar: $0{,}9\\,\\text{m}^3 = 900\\text{ liter}$, lalu $\\dfrac{900}{15} = 60\\text{ menit} = 1\\text{ jam}$." },
      { key: "B", textMarkdown: "$60$ jam", latex: "60", trapType: "unit_mismatch", distractorRationale: "Lupa mengonversi hasil $60\\text{ menit}$ menjadi satuan jam." },
      { key: "C", textMarkdown: "$0{,}6$ jam", latex: "0{,}6", trapType: "unit_mismatch", distractorRationale: "Membagi $\\dfrac{900}{15} = 60$ lalu keliru membaginya dengan $100$." },
      { key: "D", textMarkdown: "$6$ jam", latex: "6", trapType: "unit_mismatch", distractorRationale: "Salah mengonversi $0{,}9\\,\\text{m}^3$ menjadi $9.000\\text{ liter}$." },
      { key: "E", textMarkdown: "$1{,}5$ jam", latex: "1{,}5", trapType: "arithmetic_slip", distractorRationale: "Salah menghitung $\\dfrac{900}{15}$ sebagai $90\\text{ menit}$." },
    ],
    correctAnswerKey: "A",
    officialSolutionMarkdown: "Konversi volume ke liter: $0{,}9\\text{ m}^3 = 0{,}9 \\times 1.000 = 900\\text{ liter}$. Waktu dalam menit $= \\frac{900}{15} = 60\\text{ menit} = 1\\text{ jam}$.",
    solutionSteps: [
      { stage: "deconstruct", title: "Samakan Satuan Volume ke Liter", instructionMarkdown: "Kalikan m^3 dengan 1.000 agar cocok dengan satuan debit liter/menit.", formulaLatex: "0{,}9 \\times 1.000 = 900\\text{ liter}" },
      { stage: "setup", title: "Hitung Waktu dalam Menit", instructionMarkdown: "Bagi volume total dengan debit per menit.", formulaLatex: "t = \\frac{900}{15} = 60\\text{ menit}" },
      { stage: "solve", title: "Konversi Menit ke Jam", instructionMarkdown: "Perhatikan pertanyaan meminta satuan jam.", formulaLatex: "60\\text{ menit} = 1\\text{ jam}" },
    ],
    sbiDeconstruction: {
      schemaType: "rate_unit_conversion",
      schemaLabelId: "Konversi Satuan Volume & Debit Aliran",
      knownVariables: [
        { symbol: "V", label: "Volume", valueText: "0,9 m^3" },
        { symbol: "Q", label: "Debit", valueText: "15 liter/menit" },
      ],
      targetUnknown: "Waktu dalam jam",
      baseRelationLatex: "t = \\frac{V}{Q}",
    },
    irtDifficultyB: -1.3,
    irtDiscriminationA: 1.2,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 50,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000011",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PM_T1_PCT,
    subtest: "PM",
    track: "quantitative",
    tier: "tier_1_core",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Sebuah toko buku memberikan diskon bertingkat $20\\%$ lalu diskon tambahan $25\\%$ dari harga setelah diskon pertama. Jika harga awal sebuah paket buku adalah $\\text{Rp}200.000$, harga akhir yang harus dibayar adalah $\\dots$",
    stemLatex: "200.000 \\times (1 - 0{,}20) \\times (1 - 0{,}25)",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "$\\text{Rp}110.000$", latex: "110.000", trapType: "formula_misapplication", distractorRationale: "Menjumlahkan diskon $20\\% + 25\\% = 45\\%$ secara langsung ($200.000 \\times 55\\% = \\text{Rp}110.000$)." },
      { key: "B", textMarkdown: "$\\text{Rp}120.000$", latex: "120.000", trapType: "none", distractorRationale: "Benar: $200.000 \\times 0{,}80 = 160.000$, lalu $160.000 \\times 0{,}75 = \\text{Rp}120.000$." },
      { key: "C", textMarkdown: "$\\text{Rp}150.000$", latex: "150.000", trapType: "arithmetic_slip", distractorRationale: "Hanya menghitung diskon kedua $25\\%$ tanpa diskon pertama $20\\%$." },
      { key: "D", textMarkdown: "$\\text{Rp}160.000$", latex: "160.000", trapType: "arithmetic_slip", distractorRationale: "Berhenti pada diskon tahap pertama ($200.000 \\times 0{,}80 = \\text{Rp}160.000$)." },
      { key: "E", textMarkdown: "$\\text{Rp}125.000$", latex: "125.000", trapType: "arithmetic_slip", distractorRationale: "Keliru menghitung $25\\%$ dari $160.000$ sebagai $35.000$, seharusnya $40.000$." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Setelah diskon $20\\%$, harga menjadi $80\\% \\times 200.000 = \\text{Rp}160.000$. Setelah diskon tambahan $25\\%$, harga akhir $= 75\\% \\times 160.000 = \\text{Rp}120.000$.",
    solutionSteps: [
      { stage: "deconstruct", title: "Terapkan Pengali Diskon Pertama", instructionMarkdown: "Diskon 20% berarti membayar 80% (0,8) dari harga awal.", formulaLatex: "200.000 \\times 0{,}8 = 160.000" },
      { stage: "solve", title: "Terapkan Pengali Diskon Kedua pada Basis Baru", instructionMarkdown: "Kalikan hasil tahap pertama dengan 75% (0,75).", formulaLatex: "160.000 \\times 0{,}75 = 120.000" },
    ],
    sbiDeconstruction: {
      schemaType: "chained_discount_multiplier",
      schemaLabelId: "Persentase Bertingkat Berantai",
      knownVariables: [
        { symbol: "H_0", label: "Harga awal", valueText: "200.000" },
        { symbol: "d_1", label: "Diskon 1", valueText: "20%" },
        { symbol: "d_2", label: "Diskon 2", valueText: "25%" },
      ],
      targetUnknown: "Harga akhir",
      baseRelationLatex: "H_2 = H_0 (1 - d_1)(1 - d_2)",
    },
    irtDifficultyB: -0.4,
    irtDiscriminationA: 1.3,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 55,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000012",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PM_T2_LIN,
    subtest: "PM",
    track: "quantitative",
    tier: "tier_2_standard",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Sebuah usaha percetakan memiliki biaya tetap harian $\\text{Rp}180.000$ dan biaya cetak variabel $\\text{Rp}12.000$ per buku. Jika setiap buku dijual $\\text{Rp}20.000$, minimal berapa buku harus terjual setiap hari agar usaha memperoleh keuntungan bersih minimal $\\text{Rp}140.000$?",
    stemLatex: "(20.000 - 12.000)n \\ge 180.000 + 140.000",
    passageText: null,
    passageSentences: null,
    evidenceSentenceIds: [],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "$40$ buku", latex: "40", trapType: "none", distractorRationale: "Benar: margin per buku $= \\text{Rp}8.000$. Target total $= \\text{Rp}320.000$, maka $n = \\dfrac{320.000}{8.000} = 40$ buku." },
      { key: "B", textMarkdown: "$23$ buku", latex: "23", trapType: "formula_misapplication", distractorRationale: "Hanya menutup biaya tetap $\\dfrac{180.000}{8.000} = 22{,}5$ (titik impas) tanpa target laba $\\text{Rp}140.000$." },
      { key: "C", textMarkdown: "$16$ buku", latex: "16", trapType: "formula_misapplication", distractorRationale: "Membagi target total $320.000$ dengan harga jual $20.000$, melupakan biaya variabel." },
      { key: "D", textMarkdown: "$27$ buku", latex: "27", trapType: "formula_misapplication", distractorRationale: "Keliru membagi $320.000$ dengan biaya variabel $12.000$." },
      { key: "E", textMarkdown: "$5$ buku", latex: "5", trapType: "sign_error", distractorRationale: "Salah mengurangi $180.000 - 140.000 = 40.000$ lalu dibagi $8.000$." },
    ],
    correctAnswerKey: "A",
    officialSolutionMarkdown: "Margin kontribusi per buku $= 20.000 - 12.000 = \\text{Rp}8.000$. Agar untung bersih minimal $\\text{Rp}140.000$, margin total harus menutup biaya tetap plus laba: $8.000n \\ge 180.000 + 140.000 = 320.000 \\implies n \\ge 40$ buku.",
    solutionSteps: [
      { stage: "deconstruct", title: "Hitung Margin Bersih per Unit", instructionMarkdown: "Kurangkan harga jual dengan biaya variabel per buku.", formulaLatex: "m = 20.000 - 12.000 = 8.000" },
      { stage: "setup", title: "Susun Pertidaksamaan Target Laba", instructionMarkdown: "Margin total minimal sama dengan biaya tetap ditambah laba.", formulaLatex: "8.000n \\ge 180.000 + 140.000" },
      { stage: "solve", title: "Selesaikan Nilai n", instructionMarkdown: "Bagi 320.000 dengan 8.000.", formulaLatex: "n \\ge \\frac{320.000}{8.000} = 40" },
    ],
    sbiDeconstruction: {
      schemaType: "linear_profit_breakeven",
      schemaLabelId: "Optimasi Margin Kontribusi & Biaya Tetap",
      knownVariables: [
        { symbol: "F", label: "Biaya tetap", valueText: "180.000" },
        { symbol: "v", label: "Biaya variabel", valueText: "12.000/unit" },
        { symbol: "p", label: "Harga jual", valueText: "20.000/unit" },
        { symbol: "\\Pi", label: "Target laba", valueText: "140.000" },
      ],
      targetUnknown: "Minimal unit terjual (n)",
      baseRelationLatex: "(p - v)n \\ge F + \\Pi",
    },
    irtDifficultyB: 0.4,
    irtDiscriminationA: 1.4,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 75,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  // LBI (Literacy Track with Evidence-First Sentences)
  {
    id: "20000000-0000-4000-8000-000000000013",
    ownerUserId: null,
    skillNodeId: NODE_IDS.LBI_T0_IDEA,
    subtest: "LBI",
    track: "literacy",
    tier: "tier_0_foundation",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Berdasarkan paragraf tersebut, manakah pernyataan yang paling tepat merangkum **ide pokok** teks?",
    stemLatex: null,
    passageText:
      "Kebijakan subsidi transportasi publik perkotaan kerap diukur keberhasilannya semata dari jumlah penumpang harian. Padahal, laporan evaluasi di tiga kota besar menunjukkan bahwa tanpa penataan rute pengumpan dari kawasan permukiman, tarif murah saja gagal mengalihkan pengguna kendaraan pribadi secara berkelanjutan. Selain itu, waktu tunggu bus yang tidak pasti membuat pekerja kantoran tetap memilih sepeda motor meski biaya bensin lebih tinggi. Oleh sebab itu, efektivitas transportasi publik lebih ditentukan oleh keandalan integrasi rute dan kepastian jadwal daripada sekadar pemangkasan tarif.",
    passageSentences: [
      { id: "S1", paragraph: 1, text: "Kebijakan subsidi transportasi publik perkotaan kerap diukur keberhasilannya semata dari jumlah penumpang harian." },
      { id: "S2", paragraph: 1, text: "Padahal, laporan evaluasi di tiga kota besar menunjukkan bahwa tanpa penataan rute pengumpan dari kawasan permukiman, tarif murah saja gagal mengalihkan pengguna kendaraan pribadi secara berkelanjutan." },
      { id: "S3", paragraph: 1, text: "Selain itu, waktu tunggu bus yang tidak pasti membuat pekerja kantoran tetap memilih sepeda motor meski biaya bensin lebih tinggi." },
      { id: "S4", paragraph: 1, text: "Oleh sebab itu, efektivitas transportasi publik lebih ditentukan oleh keandalan integrasi rute dan kepastian jadwal daripada sekadar pemangkasan tarif." },
    ],
    evidenceSentenceIds: ["S4"],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Keberhasilan transportasi publik lebih bergantung pada integrasi rute dan kepastian jadwal dibanding sekadar tarif murah.", latex: null, trapType: "none", distractorRationale: "Benar: selaras langsung dengan simpulan utama penulis di kalimat S4." },
      { key: "B", textMarkdown: "Semua pekerja kantoran di tiga kota besar lebih menyukai sepeda motor karena harganya terjangkau.", latex: null, trapType: "overgeneralization", distractorRationale: "Mengubah contoh pekerja di S3 menjadi klaim 'semua' dan menggeser alasan ke harga motor." },
      { key: "C", textMarkdown: "Subsidi tarif transportasi publik harus dihapus seluruhnya karena selalu gagal menarik penumpang.", latex: null, trapType: "overgeneralization", distractorRationale: "Menyimpulkan penghapusan total subsidi dan memakai kata mutlak 'selalu'." },
      { key: "D", textMarkdown: "Jumlah penumpang harian merupakan satu-satunya indikator resmi untuk menilai kebijakan transportasi.", latex: null, trapType: "causal_reversal", distractorRationale: "Justru ide S1 yang disanggah oleh kalimat S2 sampai S4." },
      { key: "E", textMarkdown: "Kenaikan harga bensin akan otomatis memaksa pengendara motor berpindah ke bus kota.", latex: null, trapType: "unsupported_inference", distractorRationale: "Bertentangan dengan bukti S3 bahwa pekerja tetap memilih motor meski bensin mahal." },
    ],
    correctAnswerKey: "A",
    officialSolutionMarkdown: "Kalimat S1 memaparkan anggapan umum, S2 dan S3 memberi bukti empiris kelemahan tarif murah tanpa keandalan, lalu kalimat konklusif S4 merumuskan tesis inti penulis.",
    solutionSteps: [
      { stage: "deconstruct", title: "Temukan Penanda Simpulan", instructionMarkdown: "Perhatikan konjungsi 'Oleh sebab itu' pada kalimat keempat (S4).", formulaLatex: null },
      { stage: "solve", title: "Eliminasi Detail Spesifik & Jebakan Mutlak", instructionMarkdown: "Cocokkan klaim payung S4 dengan opsi yang mempertahankan syarat integrasi rute + jadwal.", formulaLatex: null },
    ],
    sbiDeconstruction: null,
    irtDifficultyB: -0.9,
    irtDiscriminationA: 1.25,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 65,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000014",
    ownerUserId: null,
    skillNodeId: NODE_IDS.LBI_T1_CLAIM,
    subtest: "LBI",
    track: "literacy",
    tier: "tier_1_core",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Manakah pernyataan yang **didukung langsung** oleh teks tanpa melebihi batas klaim penulis?",
    stemLatex: null,
    passageText:
      "Studi nutrisi selama enam bulan di dua kabupaten pesisir menemukan korelasi positif antara konsumsi ikan kembung lokal tiga kali sepekan dengan kestabilan kadar vitamin D pada anak usia sekolah. Meski demikian, peneliti menegaskan bahwa paparan sinar matahari pagi di lingkungan sekolah tetap berperan sebagai faktor utama sintesis vitamin D tubuh. Oleh karena itu, peningkatan konsumsi ikan lokal disarankan sebagai pelengkap program gizi sekolah, bukan pengganti aktivitas luar ruang.",
    passageSentences: [
      { id: "S1", paragraph: 1, text: "Studi nutrisi selama enam bulan di dua kabupaten pesisir menemukan korelasi positif antara konsumsi ikan kembung lokal tiga kali sepekan dengan kestabilan kadar vitamin D pada anak usia sekolah." },
      { id: "S2", paragraph: 1, text: "Meski demikian, peneliti menegaskan bahwa paparan sinar matahari pagi di lingkungan sekolah tetap berperan sebagai faktor utama sintesis vitamin D tubuh." },
      { id: "S3", paragraph: 1, text: "Oleh karena itu, peningkatan konsumsi ikan lokal disarankan sebagai pelengkap program gizi sekolah, bukan pengganti aktivitas luar ruang." },
    ],
    evidenceSentenceIds: ["S2", "S3"],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Konsumsi ikan kembung secara tunggal sudah cukup menggantikan paparan sinar matahari pagi.", latex: null, trapType: "causal_reversal", distractorRationale: "Bertentangan langsung dengan kalimat S3 ('bukan pengganti')." },
      { key: "B", textMarkdown: "Ikan kembung lokal direkomendasikan sebagai pendukung asupan gizi sementara sinar matahari pagi tetap menjadi faktor utama vitamin D.", latex: null, trapType: "none", distractorRationale: "Benar: merangkum tepat S2 dan S3 tanpa melebih-lebihkan klaim." },
      { key: "C", textMarkdown: "Seluruh siswa di Indonesia mengalami kekurangan vitamin D jika tidak makan ikan tiga kali sepekan.", latex: null, trapType: "overgeneralization", distractorRationale: "Menggeneralisasi sampel dua kabupaten pesisir menjadi 'seluruh siswa di Indonesia'." },
      { key: "D", textMarkdown: "Makan ikan kembung terbukti secara kausal menyembuhkan gangguan pertumbuhan tulang pada orang dewasa.", latex: null, trapType: "scope_shift", distractorRationale: "Subjek studi adalah anak usia sekolah (S1) dan sifatnya korelasi positif, bukan uji penyembuhan orang dewasa." },
      { key: "E", textMarkdown: "Program gizi sekolah wajib meniadakan aktivitas luar ruang agar siswa fokus makan siang.", latex: null, trapType: "unsupported_inference", distractorRationale: "Kontradiksi dengan penekanan aktivitas luar ruang di S3." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Kalimat S2 menyebut sinar matahari pagi sebagai faktor utama, dan S3 menyarankan ikan lokal sebagai pelengkap. Opsi B menjaga kedua batas cakupan tersebut secara persis.",
    solutionSteps: [
      { stage: "deconstruct", title: "Sorot Kata Pembatas Peneliti", instructionMarkdown: "Perhatikan frasa 'tetap berperan sebagai faktor utama' (S2) dan 'pelengkap, bukan pengganti' (S3).", formulaLatex: null },
      { stage: "solve", title: "Cocokkan Cakupan Subjek & Klaim", instructionMarkdown: "Singkirkan opsi yang mengubah 'korelasi' menjadi penyembuhan mutlak atau memperluas subjek ke seluruh Indonesia.", formulaLatex: null },
    ],
    sbiDeconstruction: null,
    irtDifficultyB: 0.0,
    irtDiscriminationA: 1.35,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 70,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  // LBE (Authentic English Literacy)
  {
    id: "20000000-0000-4000-8000-000000000015",
    ownerUserId: null,
    skillNodeId: NODE_IDS.LBE_T0_REF,
    subtest: "LBE",
    track: "literacy",
    tier: "tier_0_foundation",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "In the third sentence, what does the pronoun **\"they\"** refer to?",
    stemLatex: null,
    passageText:
      "Urban shade canopies rely heavily on mature street trees to reduce surface pavement temperatures during peak summer afternoons. However, young saplings planted along narrow sidewalks frequently fail within three years because compacted concrete soil restricts root expansion. Unless municipal planners replace solid paving slabs with permeable tree pits, they will continue to suffer high mortality rates before providing meaningful cooling.",
    passageSentences: [
      { id: "S1", paragraph: 1, text: "Urban shade canopies rely heavily on mature street trees to reduce surface pavement temperatures during peak summer afternoons." },
      { id: "S2", paragraph: 1, text: "However, young saplings planted along narrow sidewalks frequently fail within three years because compacted concrete soil restricts root expansion." },
      { id: "S3", paragraph: 1, text: "Unless municipal planners replace solid paving slabs with permeable tree pits, they will continue to suffer high mortality rates before providing meaningful cooling." },
    ],
    evidenceSentenceIds: ["S2"],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Municipal planners", latex: null, trapType: "scope_shift", distractorRationale: "Planners install pits; they do not suffer tree mortality before providing cooling." },
      { key: "B", textMarkdown: "Young saplings", latex: null, trapType: "none", distractorRationale: "Correct: matches S2 ('young saplings... frequently fail') and the clause 'suffer high mortality rates before providing cooling'." },
      { key: "C", textMarkdown: "Solid paving slabs", latex: null, trapType: "unsupported_inference", distractorRationale: "Inanimate paving slabs cannot experience biological mortality rates." },
      { key: "D", textMarkdown: "Mature street trees", latex: null, trapType: "scope_shift", distractorRationale: "Mature trees already provide shade; saplings have not yet reached maturity." },
      { key: "E", textMarkdown: "Permeable tree pits", latex: null, trapType: "unsupported_inference", distractorRationale: "Tree pits are the proposed engineering intervention, not the organisms failing." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Sentence S3 describes a subject suffering 'high mortality rates before providing meaningful cooling'. In S2, 'young saplings' are the exact plural subject that fail within three years before maturing.",
    solutionSteps: [
      { stage: "deconstruct", title: "Inspect Predicate Compatibility", instructionMarkdown: "Ask what noun can logically 'suffer high mortality rates' and eventually 'provide cooling'.", formulaLatex: null },
      { stage: "solve", title: "Verify Antecedent in S2", instructionMarkdown: "'Young saplings' is plural and matches 'fail within three years'.", formulaLatex: null },
    ],
    sbiDeconstruction: null,
    irtDifficultyB: -0.8,
    irtDiscriminationA: 1.25,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 55,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000016",
    ownerUserId: null,
    skillNodeId: NODE_IDS.LBE_T1_PURP,
    subtest: "LBE",
    track: "literacy",
    tier: "tier_1_core",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "What is the primary **rhetorical purpose** of the author in this passage?",
    stemLatex: null,
    passageText:
      "For decades, open-plan offices were championed as engines of spontaneous collaboration and flat workplace hierarchy. Yet longitudinal sensor studies tracking employees before and after wall removal revealed that face-to-face conversation actually dropped by roughly 70 percent, replaced by instant messaging and noise-canceling headphones. Rather than dismantling private booths, contemporary workplace designers are now reintroducing acoustic zoning to balance focused solo work with deliberate team zones.",
    passageSentences: [
      { id: "S1", paragraph: 1, text: "For decades, open-plan offices were championed as engines of spontaneous collaboration and flat workplace hierarchy." },
      { id: "S2", paragraph: 1, text: "Yet longitudinal sensor studies tracking employees before and after wall removal revealed that face-to-face conversation actually dropped by roughly 70 percent, replaced by instant messaging and noise-canceling headphones." },
      { id: "S3", paragraph: 1, text: "Rather than dismantling private booths, contemporary workplace designers are now reintroducing acoustic zoning to balance focused solo work with deliberate team zones." },
    ],
    evidenceSentenceIds: ["S2", "S3"],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "To prove that remote work eliminates the need for any physical office space.", latex: null, trapType: "scope_shift", distractorRationale: "Remote work is never discussed; the text focuses on physical acoustic zoning." },
      { key: "B", textMarkdown: "To argue that instant messaging software lowers employee productivity across all industries.", latex: null, trapType: "overgeneralization", distractorRationale: "Messaging is cited as a reaction to noise in open offices, not universally condemned." },
      { key: "C", textMarkdown: "To contrast a popular office assumption with empirical findings and explain the shift toward acoustic zoning.", latex: null, trapType: "none", distractorRationale: "Correct: captures the S1 assumption, S2 empirical counter-evidence ('Yet'), and S3 design shift." },
      { key: "D", textMarkdown: "To recommend banning headphones in collaborative creative studios.", latex: null, trapType: "unsupported_inference", distractorRationale: "Headphones are a symptom observed in the sensor study, not a target for prohibition." },
      { key: "E", textMarkdown: "To celebrate open-plan offices as the most cost-effective layout ever invented.", latex: null, trapType: "causal_reversal", distractorRationale: "Directly contradicts the empirical critique presented in S2." },
    ],
    correctAnswerKey: "C",
    officialSolutionMarkdown: "Sentence S1 states the traditional premise, S2 pivots with 'Yet' to cite contradicting empirical data, and S3 describes how modern designers responded with acoustic zoning.",
    solutionSteps: [
      { stage: "deconstruct", title: "Trace Argumentative Pivots", instructionMarkdown: "Locate the contrast marker 'Yet' in S2 and the resolution 'Rather than...' in S3.", formulaLatex: null },
      { stage: "solve", title: "Match Whole-Passage Arc", instructionMarkdown: "Select the option describing assumption -> counter-evidence -> design adaptation.", formulaLatex: null },
    ],
    sbiDeconstruction: null,
    irtDifficultyB: 0.2,
    irtDiscriminationA: 1.35,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 65,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  // PBM
  {
    id: "20000000-0000-4000-8000-000000000017",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PBM_T0_EJA,
    subtest: "PBM",
    track: "literacy",
    tier: "tier_0_foundation",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Manakah kalimat yang penulisan preposisi **di** dan imbuhan **di-** nya **sepenuhnya baku** sesuai kaidah EYD V?",
    stemLatex: null,
    passageText:
      "(1) Buku panduan belajar mandiri itu diletakkan di atas meja belajar sejak pagi. (2) Sebelum ujian dimulai, seluruh catatan ringkas harus di simpan ke dalam tas tertutup. (3) Para peserta diarahkan menuju ruang verifikasi disamping aula utama.",
    passageSentences: [
      { id: "S1", paragraph: 1, text: "(1) Buku panduan belajar mandiri itu diletakkan di atas meja belajar sejak pagi." },
      { id: "S2", paragraph: 1, text: "(2) Sebelum ujian dimulai, seluruh catatan ringkas harus di simpan ke dalam tas tertutup." },
      { id: "S3", paragraph: 1, text: "(3) Para peserta diarahkan menuju ruang verifikasi disamping aula utama." },
    ],
    evidenceSentenceIds: ["S1"],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Kalimat (1) saja", latex: null, trapType: "none", distractorRationale: "Benar: 'diletakkan' (imbuhan pasif, serangkai) dan 'di atas' (kata depan tempat, dipisah)." },
      { key: "B", textMarkdown: "Kalimat (2) saja", latex: null, trapType: "formula_misapplication", distractorRationale: "'di simpan' salah dipisah karena bisa diubah ke aktif 'menyimpan'." },
      { key: "C", textMarkdown: "Kalimat (3) saja", latex: null, trapType: "formula_misapplication", distractorRationale: "'disamping' salah dirangkai; seharusnya dipisah 'di samping' karena penanda lokasi." },
      { key: "D", textMarkdown: "Kalimat (1) dan (2)", latex: null, trapType: "scope_shift", distractorRationale: "Kalimat (2) mengandung kesalahan penulisan 'di simpan'." },
      { key: "E", textMarkdown: "Kalimat (1) dan (3)", latex: null, trapType: "scope_shift", distractorRationale: "Kalimat (3) mengandung kesalahan penulisan 'disamping'." },
    ],
    correctAnswerKey: "A",
    officialSolutionMarkdown: "Pada kalimat (1), 'diletakkan' adalah verba pasif (serangkai) dan 'di atas' menunjukkan tempat (dipisah). Kalimat (2) keliru pada 'di simpan' (seharusnya 'disimpan'), dan kalimat (3) keliru pada 'disamping' (seharusnya 'di samping').",
    solutionSteps: [
      { stage: "deconstruct", title: "Uji Bentuk Aktif me-", instructionMarkdown: "Kata kerja pasif berawalan di- dapat diubah menjadi me- (meletakkan, menyimpan), sehingga wajib serangkai.", formulaLatex: null },
      { stage: "solve", title: "Uji Kata Depan Lokasi", instructionMarkdown: "Kata penanda ruang/posisi ('di atas', 'di samping') wajib ditulis terpisah.", formulaLatex: null },
    ],
    sbiDeconstruction: null,
    irtDifficultyB: -1.1,
    irtDiscriminationA: 1.2,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 45,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  // PPU
  {
    id: "20000000-0000-4000-8000-000000000018",
    ownerUserId: null,
    skillNodeId: NODE_IDS.PPU_T1_SEM,
    subtest: "PPU",
    track: "literacy",
    tier: "tier_1_core",
    sourceType: "curated_seed",
    sourceDocumentId: null,
    sourcePageId: null,
    parentQuestionId: null,
    templateId: null,
    verificationRunId: null,
    format: "mcq_single",
    qcStatus: "approved",
    stemMarkdown: "Makna kata **\"kalibrasi\"** pada kalimat ketiga teks tersebut paling dekat maknanya dengan $\\dots$",
    stemLatex: null,
    passageText:
      "Alat ukur optik di laboratorium sekolah perlu diperiksa setiap awal semester sebelum dipakai praktikum. Kesalahan pembacaan skala sekecil satu milimeter dapat membuat hasil percobaan pembiasan cahaya meleset jauh dari teori. Oleh karena itu, teknisi melakukan kalibrasi instrumen terhadap standar acuan baku agar ketepatan pengukuran terjaga.",
    passageSentences: [
      { id: "S1", paragraph: 1, text: "Alat ukur optik di laboratorium sekolah perlu diperiksa setiap awal semester sebelum dipakai praktikum." },
      { id: "S2", paragraph: 1, text: "Kesalahan pembacaan skala sekecil satu milimeter dapat membuat hasil percobaan pembiasan cahaya meleset jauh dari teori." },
      { id: "S3", paragraph: 1, text: "Oleh karena itu, teknisi melakukan kalibrasi instrumen terhadap standar acuan baku agar ketepatan pengukuran terjaga." },
    ],
    evidenceSentenceIds: ["S3"],
    diagramAssetUrl: null,
    diagramAltText: null,
    options: [
      { key: "A", textMarkdown: "Penghancuran total komponen lama", latex: null, trapType: "unsupported_inference", distractorRationale: "Berlawanan dengan tujuan menjaga ketepatan alat." },
      { key: "B", textMarkdown: "Peneraan ulang ketepatan skala terhadap standar baku", latex: null, trapType: "none", distractorRationale: "Benar: sesuai KBBI dan konteks S3 ('terhadap standar acuan baku agar ketepatan terjaga')." },
      { key: "C", textMarkdown: "Pengemasan ulang alat untuk pengiriman jarak jauh", latex: null, trapType: "scope_shift", distractorRationale: "Mengubah konteks teknis pengukuran menjadi logistik." },
      { key: "D", textMarkdown: "Pengurangan jumlah praktikum di laboratorium", latex: null, trapType: "scope_shift", distractorRationale: "Tidak berkaitan dengan penyetelan alat ukur." },
      { key: "E", textMarkdown: "Pemberian nama kode baru pada instrumen", latex: null, trapType: "unsupported_inference", distractorRationale: "Pelabelan administratif tidak menjamin ketepatan skala." },
    ],
    correctAnswerKey: "B",
    officialSolutionMarkdown: "Konteks kalimat S3 menghubungkan 'kalibrasi instrumen' dengan 'terhadap standar acuan baku agar ketepatan pengukuran terjaga', yang persis berarti peneraan/penyesuaian ulang skala alat.",
    solutionSteps: [
      { stage: "deconstruct", title: "Baca Frasa Kontekstual di Sekitar Kata", instructionMarkdown: "Perhatikan objek ('instrumen') dan tujuan ('agar ketepatan pengukuran terjaga') pada S3.", formulaLatex: null },
      { stage: "solve", title: "Substitusi Makna yang Setara", instructionMarkdown: "Peneraan ulang ketepatan skala terhadap standar baku menjaga keutuhan logika kalimat.", formulaLatex: null },
    ],
    sbiDeconstruction: null,
    irtDifficultyB: -0.5,
    irtDiscriminationA: 1.25,
    irtGuessingC: 0.2,
    expectedSolveSeconds: 50,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const INGESTED_SNBT_QUESTIONS: QuestionEntity[] =
  rawIngestedSnbtBank as QuestionEntity[];

export const SEED_QUESTIONS: QuestionEntity[] = [
  ...CURATED_CORE_QUESTIONS,
  ...INGESTED_SNBT_QUESTIONS,
];

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
];

export const SEED_VAULT_CHUNKS: BrainVaultChunk[] = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000001",
    documentId: "50000000-0000-4000-8000-000000000001",
    pageId: null,
    skillNodeId: NODE_IDS.PK_T2_RATE,
    subtest: "PK",
    chunkType: "rumus_cepat",
    contentMarkdown:
      "Rumus Cepat Pekerja & Hari (Beban Konstan): Kalikan langsung jumlah pekerja awal dengan hari awal ($P_1 \\times t_1$), lalu bagi dengan total pekerja baru ($P_2 = P_1 + \\Delta P$). Jika sebagian pekerja berhenti di tengah jalan, kurangi dulu beban kerja yang sudah selesai.",
    contentLatex: "t_2 = \\frac{P_1 \\cdot t_1}{P_1 + \\Delta P}",
    methodLabel: "Catatan Rumus Cepat: Perbandingan Berbalik Nilai",
    validityConditions:
      "Hanya berlaku jika kecepatan tiap pekerja dianggap seragam dan tidak ada hari libur/berhenti mendadak di tengah proyek.",
    diagramAssetUrl: null,
    qcStatus: "approved",
    isUserPriority: true,
    embedding: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    userId: "00000000-0000-4000-8000-000000000001",
    documentId: "50000000-0000-4000-8000-000000000001",
    pageId: null,
    skillNodeId: NODE_IDS.LBI_T1_CLAIM,
    subtest: "LBI",
    chunkType: "trap_pattern",
    contentMarkdown:
      "Checklist Anti-Jebakan LBI & LBE: Tandai kata mutlak di opsi jawaban (semua, selalu, pasti, satu-satunya). Jika teks sumber hanya menyebut 'sebagian', 'cenderung', atau 'berkorelasi positif', opsi berkekuatan mutlak hampir pasti salah (overgeneralization / pergeseran kausalitas).",
    contentLatex: null,
    methodLabel: "Catatan Pribadi: Detektor Kuantor & Cakupan Teks",
    validityConditions:
      "Periksa apakah kata mutlak memang tertulis persis pada kalimat rujukan sebelum mencoret opsi.",
    diagramAssetUrl: null,
    qcStatus: "approved",
    isUserPriority: true,
    embedding: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];
