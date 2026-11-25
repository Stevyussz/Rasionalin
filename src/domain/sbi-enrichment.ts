import { NODE_IDS } from "./node-ids";
import type {
  QuestionEntity,
  SbiDeconstruction,
  SnbtSubtest,
} from "./types";

export interface SbiSchemaOption {
  id: string;
  label: string;
  subtests: SnbtSubtest[];
}

export interface SbiWordGuide {
  whenToUse: string;
  wordClues: Array<{ phrase: string; mathMeaning: string }>;
  firstStepChecklist: string;
}

interface NodeSbiMeta extends SbiWordGuide {
  schemaType: string;
  schemaLabelId: string;
  defaultBaseRelationLatex: string;
}

export const SBI_SCHEMA_CATALOG: SbiSchemaOption[] = [
  { id: "fractions_ratio_ops", label: "Operasi Pecahan, Rasio & Tanda Negatif", subtests: ["PK", "PM"] },
  { id: "linear_single_variable", label: "Persamaan Linear & Pindah Ruas Satu Variabel", subtests: ["PK", "PM"] },
  { id: "perpendicular_line", label: "Gradien Garis, Tegak Lurus & SPLDV", subtests: ["PK"] },
  { id: "inverse_proportion_work", label: "Perbandingan Senilai, Berbalik Nilai & Laju", subtests: ["PK", "PM"] },
  { id: "vieta_symmetric_identity", label: "Persamaan & Fungsi Kuadrat (Akar / Vieta)", subtests: ["PK"] },
  { id: "data_sufficiency_polarity", label: "Analisis Kecukupan Data (Pernyataan 1 & 2) / Pertidaksamaan", subtests: ["PK"] },
  { id: "exponents_roots_log", label: "Sifat Pangkat, Bentuk Akar & Logaritma", subtests: ["PK"] },
  { id: "function_composition_inverse", label: "Fungsi Komposisi & Fungsi Invers", subtests: ["PK"] },
  { id: "geometry_angles_plane", label: "Hubungan Sudut, Segitiga & Bangun Datar", subtests: ["PK", "PM"] },
  { id: "statistics_sets_matrix", label: "Rata-rata Gabungan, Himpunan & Matriks 2x2", subtests: ["PK", "PM"] },
  { id: "logic_implication_negation", label: "Implikasi, Negasi & Ekuivalensi Logika", subtests: ["PU"] },
  { id: "syllogism_modus_tollens", label: "Penarikan Kesimpulan (Silogisme / Modus Tollens)", subtests: ["PU"] },
  { id: "analytical_ordering_argument", label: "Penguatan / Pelemahan Argumen & Syarat Logis", subtests: ["PU"] },
  { id: "table_chart_data_calc", label: "Membaca Selisih, Rasio & Persentase Data Tabel/Grafik", subtests: ["PU", "PM"] },
  { id: "number_pattern_sequence", label: "Pola Barisan Bilangan & Beda Bertingkat", subtests: ["PU"] },
  { id: "analytical_position_combo", label: "Aturan Urutan, Posisi Duduk & Kombinasi Syarat", subtests: ["PU"] },
  { id: "rate_unit_conversion", label: "Konversi Satuan Waktu/Panjang/Volume & Translasi Cerita", subtests: ["PM", "PK"] },
  { id: "chained_discount_multiplier", label: "Persentase Bertingkat, Diskon & Faktor Pengali", subtests: ["PM", "PK"] },
  { id: "linear_profit_breakeven", label: "Biaya Tetap + Variabel, Margin & Titik Impas", subtests: ["PM"] },
  { id: "social_arithmetic_interest", label: "Aritmetika Sosial, Untung-Rugi & Bunga", subtests: ["PM"] },
  { id: "probability_combinatorics", label: "Kaidah Pencacahan, Peluang & Kejadian Bersyarat", subtests: ["PM", "PK"] },
  { id: "geometry_3d_trigonometry", label: "Volume Bangun Ruang, Jarak & Trigonometri Terapan", subtests: ["PM", "PK"] },
];

const NODE_SBI_META: Record<string, NodeSbiMeta> = {
  [NODE_IDS.PK_T0_FRAC]: {
    schemaType: "fractions_ratio_ops",
    schemaLabelId: "Operasi Pecahan, Rasio & Tanda Negatif",
    defaultBaseRelationLatex: "\\frac{a}{b} \\pm \\frac{c}{d} = \\frac{ad \\pm bc}{bd}",
    whenToUse:
      "Dipakai saat soal berisi pecahan biasa/desimal, perbandingan bagian, atau operasi campur bertanda minus dan kurung.",
    wordClues: [
      { phrase: "bagian dari / pecahan dari", mathMeaning: "Operasi kali (×), misal 2/5 dari 30 berarti 2/5 × 30" },
      { phrase: "minus ketemu minus: -(-a)", mathMeaning: "Berubah menjadi +a" },
      { phrase: "bagi pecahan ÷ (a/b)", mathMeaning: "Ubah jadi kali balik × (b/a)" },
      { phrase: "perbandingan A : B", mathMeaning: "Tulis jadi bagian A/(A+B) jika diketahui total" },
    ],
    firstStepChecklist:
      "Samakan dulu semua angka ke satu bentuk nyaman (pecahan biasa atau desimal), lalu kerjakan kurung dan perkalian sebelum tambah/kurang.",
  },
  [NODE_IDS.PK_T0_ALG]: {
    schemaType: "linear_single_variable",
    schemaLabelId: "Persamaan Linear & Pindah Ruas Satu Variabel",
    defaultBaseRelationLatex: "ax + b = c \\implies x = \\frac{c - b}{a}",
    whenToUse:
      "Dipakai saat kamu perlu mencari nilai huruf (x, y, a, p) dari satu kalimat persamaan atau perbandingan silang.",
    wordClues: [
      { phrase: "adalah / sama dengan / menjadi", mathMeaning: "Tanda sama dengan (=)" },
      { phrase: "k lebihnya dari x", mathMeaning: "x + k" },
      { phrase: "k kurangnya dari x", mathMeaning: "x - k (hati-hati, x duluan!)" },
      { phrase: "a(b + c)", mathMeaning: "Kalikan a ke semua isi kurung: ab + ac" },
    ],
    firstStepChecklist:
      "Kumpulkan suku berhuruf di sisi kiri dan angka polos di sisi kanan. Setiap menyeberang tanda '=', tanda + menjadi - dan kali menjadi bagi.",
  },
  [NODE_IDS.PK_T1_LIN]: {
    schemaType: "perpendicular_line",
    schemaLabelId: "Gradien Garis, Tegak Lurus & SPLDV",
    defaultBaseRelationLatex: "y = mx + c,\\quad m_1 \\cdot m_2 = -1",
    whenToUse:
      "Dipakai untuk soal dua titik koordinat, garis sejajar/tegak lurus, atau cerita dua barang dengan dua harga total berbeda.",
    wordClues: [
      { phrase: "sejajar dengan garis", mathMeaning: "Gradiennya sama: m_1 = m_2" },
      { phrase: "tegak lurus dengan garis", mathMeaning: "Gradiennya dibalik & dilawan tanda: m_1 × m_2 = -1" },
      { phrase: "membeli x barang A dan y barang B seharga Rp T", mathMeaning: "Persamaan linear 2 variabel: xA + yB = T" },
      { phrase: "melalui titik (x_1, y_1)", mathMeaning: "Substitusikan x = x_1, y = y_1 ke persamaan" },
    ],
    firstStepChecklist:
      "Jika berbentuk ax + by = c, cari gradien dulu (m = -a/b). Jika cerita 2 benda, beri nama huruf x dan y lalu tulis 2 persamaannya.",
  },
  [NODE_IDS.PK_T2_RATE]: {
    schemaType: "inverse_proportion_work",
    schemaLabelId: "Perbandingan Senilai, Berbalik Nilai & Laju",
    defaultBaseRelationLatex: "P_1 \\cdot t_1 = P_2 \\cdot t_2 \\quad \\text{atau} \\quad \\frac{A_1}{B_1} = \\frac{A_2}{B_2}",
    whenToUse:
      "Dipakai saat ada dua besaran yang saling memengaruhi: makin banyak pekerja makin cepat selesai (berbalik nilai), atau makin banyak barang makin mahal (senilai).",
    wordClues: [
      { phrase: "satu naik, lainnya ikut naik", mathMeaning: "Senilai: kali silang A_1/B_1 = A_2/B_2" },
      { phrase: "pekerja bertambah, hari berkurang", mathMeaning: "Berbalik nilai: kalikan sejajar P_1 × t_1 = P_2 × t_2" },
      { phrase: "kecepatan / laju", mathMeaning: "v = s / t (jarak dibagi waktu)" },
      { phrase: "selesai bersama-sama", mathMeaning: "Jumlahkan laju kerjanya: 1/t_total = 1/t_A + 1/t_B" },
    ],
    firstStepChecklist:
      "Tanyakan ke diri sendiri dulu: 'Kalau A kuperbesar, apakah B ikut besar atau malah mengecil?' Itu yang mengunci rumus senilai vs berbalik nilai.",
  },
  [NODE_IDS.PK_T2_QUAD]: {
    schemaType: "vieta_symmetric_identity",
    schemaLabelId: "Persamaan & Fungsi Kuadrat (Akar / Vieta)",
    defaultBaseRelationLatex: "x_1 + x_2 = -\\frac{b}{a},\\quad x_1 x_2 = \\frac{c}{a}",
    whenToUse:
      "Dipakai saat muncul pangkat dua ($x^2$), jumlah/kali akar ($\\alpha + \\beta$), atau titik puncak parabola maksimum/minimum.",
    wordClues: [
      { phrase: "akar-akar x_1 dan x_2", mathMeaning: "Cari x_1 + x_2 = -b/a dan x_1·x_2 = c/a dulu" },
      { phrase: "nilai maksimum / minimum parabola", mathMeaning: "Sumbu simetri x_p = -b/(2a), lalu masukkan ke fungsi" },
      { phrase: "memiliki 2 akar real berbeda", mathMeaning: "Syarat diskriminan D = b^2 - 4ac > 0" },
      { phrase: "x_1^2 + x_2^2", mathMeaning: "Ubah jadi (x_1 + x_2)^2 - 2 x_1 x_2" },
    ],
    firstStepChecklist:
      "Tentukan nilai koefisien a, b, dan c dari bentuk ax^2 + bx + c = 0. Jangan lupa bawa tanda minus koefisiennya.",
  },
  [NODE_IDS.PK_T3_INEQ]: {
    schemaType: "data_sufficiency_polarity",
    schemaLabelId: "Analisis Kecukupan Data (Pernyataan 1 & 2) / Pertidaksamaan",
    defaultBaseRelationLatex: "\\text{Uji (1) saja} \\to \\text{Uji (2) saja} \\to \\text{Gabung jika perlu}",
    whenToUse:
      "Dipakai untuk soal pertidaksamaan (<, >) dan soal 'Putuskan apakah pernyataan (1) dan (2) cukup...'.",
    wordClues: [
      { phrase: "minimal / paling sedikit / tidak kurang dari", mathMeaning: "Tanda ≥" },
      { phrase: "maksimal / paling banyak / tidak lebih dari", mathMeaning: "Tanda ≤" },
      { phrase: "dikali atau dibagi bilangan negatif", mathMeaning: "Tanda pertidaksamaan (< atau >) WAJIB dibalik" },
      { phrase: "uji kecukupan (1) dan (2)", mathMeaning: "Cek (1) secara terpisah, lupa (1) dulu lalu cek (2)" },
    ],
    firstStepChecklist:
      "Untuk kecukupan data, uji angka positif, nol, dan negatif. Jika menghasilkan jawaban YA sekaligus TIDAK, pernyataan itu belum cukup.",
  },
  [NODE_IDS.PK_T1_EXP]: {
    schemaType: "exponents_roots_log",
    schemaLabelId: "Sifat Pangkat, Bentuk Akar & Logaritma",
    defaultBaseRelationLatex: "a^m \\cdot a^n = a^{m+n},\\quad \\frac{a^m}{a^n} = a^{m-n}",
    whenToUse:
      "Dipakai saat angka punya pangkat kecil, akar $\\sqrt{\\dots}$, atau logaritma dengan basis berulang seperti 2, 3, 5.",
    wordClues: [
      { phrase: "perkalian basis sama a^m × a^n", mathMeaning: "Pangkatnya DIJUMLAHKAN: a^{m+n}" },
      { phrase: "pembagian basis sama a^m / a^n", mathMeaning: "Pangkatnya DIKURANGKAN: a^{m-n}" },
      { phrase: "pangkat negatif a^{-n}", mathMeaning: "Artinya 1 / a^n (turun ke penyebut)" },
      { phrase: "akar pangkat m dari a^n", mathMeaning: "Ubah jadi pangkat pecahan a^{n/m}" },
    ],
    firstStepChecklist:
      "Pecah bilangan besar (seperti 12, 18, 27, 64) ke basis prima kecil 2, 3, atau 5 agar pangkatnya bisa digabung.",
  },
  [NODE_IDS.PK_T2_FUNC]: {
    schemaType: "function_composition_inverse",
    schemaLabelId: "Fungsi Komposisi & Fungsi Invers",
    defaultBaseRelationLatex: "(f \\circ g)(x) = f(g(x)),\\quad f(a) = b \\iff f^{-1}(b) = a",
    whenToUse:
      "Dipakai saat ada notasi f(x), komposisi (f o g)(x), atau pangkat invers f^{-1}(x).",
    wordClues: [
      { phrase: "(f o g)(x)", mathMeaning: "Kerjakan yang kanan dulu: masukkan g(x) menggantikan x di f" },
      { phrase: "nilai f^{-1}(k)", mathMeaning: "Tidak wajib cari rumus invers! Langsung pecahkan f(x) = k" },
      { phrase: "daerah asal akar √u", mathMeaning: "Syarat di dalam akar harus ≥ 0" },
    ],
    firstStepChecklist:
      "Jika ditanya nilai angka seperti f^{-1}(5), cukup samakan f(x) = 5 lalu cari x. Itu jauh lebih hemat waktu.",
  },
  [NODE_IDS.PK_T2_GEO]: {
    schemaType: "geometry_angles_plane",
    schemaLabelId: "Hubungan Sudut, Segitiga & Bangun Datar",
    defaultBaseRelationLatex: "\\Sigma\\angle_{\\triangle} = 180^\\circ,\\quad a^2 + b^2 = c^2",
    whenToUse:
      "Dipakai saat soal membahas sudut garis sejajar, segitiga, persegi panjang, keliling, luas, atau lingkaran.",
    wordClues: [
      { phrase: "garis lurus / berpelurus", mathMeaning: "Jumlah sudutnya 180°" },
      { phrase: "siku-siku", mathMeaning: "Sudut 90° dan berlaku Pythagoras a^2 + b^2 = c^2" },
      { phrase: "keliling bangun", mathMeaning: "Jumlahkan seluruh panjang sisi terluarnya saja" },
      { phrase: "sebanyak dua kali ukuran awal", mathMeaning: "Luas ikut naik kuadratnya (2^2 = 4 kali)" },
    ],
    firstStepChecklist:
      "Gambar sketsa kasar dan tulis semua ukuran serta sudut yang diketahui tepat di sisi gambarnya sebelum menghitung.",
  },
  [NODE_IDS.PK_T3_STAT]: {
    schemaType: "statistics_sets_matrix",
    schemaLabelId: "Rata-rata Gabungan, Himpunan & Matriks 2x2",
    defaultBaseRelationLatex: "\\bar{x} = \\frac{\\Sigma x_i}{n},\\quad n(A \\cup B) = n(A) + n(B) - n(A \\cap B)",
    whenToUse:
      "Dipakai untuk soal rata-rata kelas/kelompok, diagram Venn irisan 2 himpunan, median/jangkauan, atau matriks 2x2.",
    wordClues: [
      { phrase: "rata-rata baru setelah satu orang masuk", mathMeaning: "Cari Total Nilai dulu: Total = Rata-rata × Banyak Data" },
      { phrase: "suka keduanya / irisan", mathMeaning: "Total = Grup A + Grup B - Keduanya + Tidak Keduanya" },
      { phrase: "median (nilai tengah)", mathMeaning: "Urutkan data dari paling kecil ke besar dulu!" },
    ],
    firstStepChecklist:
      "Untuk soal rata-rata, selalu ubah setiap rata-rata menjadi TOTAL NILAI (rata-rata × jumlah orang).",
  },
  [NODE_IDS.PU_T0_LOG]: {
    schemaType: "logic_implication_negation",
    schemaLabelId: "Implikasi, Negasi & Ekuivalensi Logika",
    defaultBaseRelationLatex: "(p \\to q) \\equiv (\\sim q \\to \\sim p) \\equiv (\\sim p \\lor q)",
    whenToUse:
      "Dipakai saat soal menanyakan kesetaraan kalimat 'Jika... maka...', negasi/ingkaran pernyataan, atau kuantor semua/sebagian.",
    wordClues: [
      { phrase: "Jika P maka Q", mathMeaning: "Setara dengan: Jika TIDAK Q maka TIDAK P" },
      { phrase: "ingkaran dari 'Semua A adalah B'", mathMeaning: "'Ada/Sebagian A yang BUKAN B' (bukan 'Semua A bukan B')" },
      { phrase: "ingkaran dari 'Jika P maka Q'", mathMeaning: "P terjadi TETAPI Q tidak terjadi (P ∧ ~Q)" },
    ],
    firstStepChecklist:
      "Beri label P untuk kalimat setelah kata 'Jika' dan Q untuk kalimat setelah kata 'maka', lalu cek ekuivalensi kontraposisinya.",
  },
  [NODE_IDS.PU_T1_SYL]: {
    schemaType: "syllogism_modus_tollens",
    schemaLabelId: "Penarikan Kesimpulan (Silogisme / Modus Tollens)",
    defaultBaseRelationLatex: "(p \\to q) \\land (q \\to r) \\implies (p \\to r)",
    whenToUse:
      "Dipakai saat disediakan 2-3 premis kalimat dan diminta menarik simpulan yang paling sah.",
    wordClues: [
      { phrase: "P → Q lalu ada fakta P terjadi", mathMeaning: "Simpulan sah: Q pasti terjadi (Modus Ponens)" },
      { phrase: "P → Q lalu fakta TIDAK Q", mathMeaning: "Simpulan sah: TIDAK P (Modus Tollens)" },
      { phrase: "P → Q dan fakta TIDAK P", mathMeaning: "HATI-HATI! Tidak bisa langsung menyimpulkan TIDAK Q" },
    ],
    firstStepChecklist:
      "Coret kalimat tengah yang berulang di premis 1 dan 2 (rantai P → Q → R menjadi P → R). Tolak opsi yang menambah fakta baru.",
  },
  [NODE_IDS.PU_T2_ARG]: {
    schemaType: "analytical_ordering_argument",
    schemaLabelId: "Penguatan / Pelemahan Argumen & Syarat Logis",
    defaultBaseRelationLatex: "\\text{Klaim Utama} + \\text{Bukti/Celah Kausal}",
    whenToUse:
      "Dipakai saat ditanya pernyataan mana yang MEMPERKUAT, MEMPERLEMAH, atau PALING MUNGKIN BENAR terhadap argumen bacaan.",
    wordClues: [
      { phrase: "memperlemah argumen", mathMeaning: "Cari sebab lain yang menjelaskan akibat, atau contoh kebalikan" },
      { phrase: "memperkuat argumen", mathMeaning: "Cari data tambahan yang menutup kemungkinan sebab lain" },
      { phrase: "kata mutlak (semua, pasti, selalu)", mathMeaning: "Sering jadi jebakan jika teks cuma bilang sebagian/cenderung" },
    ],
    firstStepChecklist:
      "Garis bawahi kalimat klaim sebab-akibat utamanya dulu, baru cari opsi yang langsung menyambung ke klaim itu.",
  },
  [NODE_IDS.PU_T2_DATA]: {
    schemaType: "table_chart_data_calc",
    schemaLabelId: "Membaca Selisih, Rasio & Persentase Data Tabel/Grafik",
    defaultBaseRelationLatex: "\\%\\text{Perubahan} = \\frac{\\text{Akhir} - \\text{Awal}}{\\text{Awal}} \\times 100\\%",
    whenToUse:
      "Dipakai saat soal menyajikan tabel atau grafik angka lalu menanyakan kenaikan terbesar, selisih, atau prediksi nilai.",
    wordClues: [
      { phrase: "kenaikan persentase tertinggi", mathMeaning: "Bagi selisih dengan nilai AWAL, bukan hanya lihat selisih angka terbesar" },
      { phrase: "rasio A terhadap B", mathMeaning: "A / B (jangan kebalik urutannya!)" },
      { phrase: "rata-rata per tahun", mathMeaning: "Jumlah seluruh data dibagi banyaknya tahun" },
    ],
    firstStepChecklist:
      "Baca judul kolom dan satuan tabel dulu (apakah dalam ribuan, persen, atau ton) sebelum menyalin angka.",
  },
  [NODE_IDS.PU_T3_PAT]: {
    schemaType: "number_pattern_sequence",
    schemaLabelId: "Pola Barisan Bilangan & Beda Bertingkat",
    defaultBaseRelationLatex: "\\Delta u_n = u_{n+1} - u_n",
    whenToUse:
      "Dipakai untuk deret angka berurutan, angka hilang di tengah, atau gambar berpola angka.",
    wordClues: [
      { phrase: "naik-turun selang-seling", mathMeaning: "Coba loncat 1 angka (suku ganjil sendiri, suku genap sendiri)" },
      { phrase: "kenaikan makin besar tidak tetap", mathMeaning: "Tulis selisih baris 1, lalu cari selisih dari selisihnya (tingkat 2)" },
      { phrase: "melompat sangat cepat", mathMeaning: "Cek pola perkalian atau bilangan kuadrat/prima" },
    ],
    firstStepChecklist:
      "Tulis selisih (+ atau -) atau rasio (×) antar angka bersebelahan di atas barisan. Jika belum rata, cek selisih tingkat kedua.",
  },
  [NODE_IDS.PU_T3_ANAL]: {
    schemaType: "analytical_position_combo",
    schemaLabelId: "Aturan Urutan, Posisi Duduk & Kombinasi Syarat",
    defaultBaseRelationLatex: "\\text{Syarat Mutlak} \\to \\text{Slot Posisi} \\to \\text{Uji Cabang}",
    whenToUse:
      "Dipakai untuk teka-teki jadwal, urutan antrean, posisi meja bundar, atau pemilihan tim dengan banyak syarat.",
    wordClues: [
      { phrase: "selalu berdampingan dengan", mathMeaning: "Ikat kedua orang dalam 1 blok [AB] sebelum disusun" },
      { phrase: "tepat di sebelah / antara", mathMeaning: "Posisi langsung nempel (tidak boleh disisipi orang lain)" },
      { phrase: "lebih dulu dari (bukan tepat)", mathMeaning: "Cukup di sebelah kiri, boleh berjarak" },
    ],
    firstStepChecklist:
      "Buat kotak bernomor 1, 2, 3... lalu pasang syarat yang posisinya PALING PASTI dulu sebelum memikirkan syarat yang longgar.",
  },
  [NODE_IDS.PM_T0_UNIT]: {
    schemaType: "rate_unit_conversion",
    schemaLabelId: "Konversi Satuan Waktu/Panjang/Volume & Translasi Cerita",
    defaultBaseRelationLatex: "s = v \\cdot t,\\quad \\text{Volume} = \\text{Debit} \\cdot t",
    whenToUse:
      "Dipakai saat soal cerita mencampur satuan berbeda (menit vs jam, liter vs m^3, cm vs km) atau menceritakan kecepatan dan debit.",
    wordClues: [
      { phrase: "menit menjadi jam", mathMeaning: "Bagi dengan 60 (misal 45 menit = 45/60 = 3/4 jam)" },
      { phrase: "jam menjadi menit", mathMeaning: "Kali dengan 60 (misal 1,5 jam = 90 menit)" },
      { phrase: "beristirahat k menit di jalan", mathMeaning: "Waktu total = waktu jalan + waktu istirahat" },
      { phrase: "sudah terisi V_awal lalu diisi penuh V_maks", mathMeaning: "Sisa volume yang perlu diisi = V_maks - V_awal" },
    ],
    firstStepChecklist:
      "Cek satuan yang diminta di kalimat pertanyaan paling akhir (menit atau jam? cm atau meter?), lalu samakan semua angka ke satuan itu dulu.",
  },
  [NODE_IDS.PM_T1_PCT]: {
    schemaType: "chained_discount_multiplier",
    schemaLabelId: "Persentase Bertingkat, Diskon & Faktor Pengali",
    defaultBaseRelationLatex: "\\text{Akhir} = \\text{Awal} \\cdot (1 \\pm p_1)(1 \\pm p_2)",
    whenToUse:
      "Dipakai untuk soal diskon ganda (misal diskon 20% + 10%), pajak setelah diskon, atau kenaikan/penurunan persen berturut-turut.",
    wordClues: [
      { phrase: "diskon p%", mathMeaning: "Yang dibayar sisanya: kalikan dengan (1 - p/100)" },
      { phrase: "naik p% atau ditambah pajak p%", mathMeaning: "Kalikan dengan (1 + p/100)" },
      { phrase: "diskon 20% lalu diskon tambahan 10%", mathMeaning: "BUKAN 30%! Kalikan 0,8 × 0,9 = 0,72 (diskon efektif 28%)" },
      { phrase: "persentase perubahan", mathMeaning: "Selalu bandingkan ke harga/nilai AWAL sebelum berubah" },
    ],
    firstStepChecklist:
      "Ubah setiap kata 'naik/diskon' menjadi faktor pengali desimal (misal turun 15% = ×0,85), lalu kalikan beruntun dari kiri ke kanan.",
  },
  [NODE_IDS.PM_T2_LIN]: {
    schemaType: "linear_profit_breakeven",
    schemaLabelId: "Biaya Tetap + Variabel, Margin & Titik Impas",
    defaultBaseRelationLatex: "\\text{Total} = \\text{Tetap} + (\\text{Satuan} \\times n)",
    whenToUse:
      "Dipakai saat soal cerita punya tarif awal tetap ditambah tarif per jam/km/unit, atau membandingkan dua paket layanan / titik impas.",
    wordClues: [
      { phrase: "biaya awal / sewa dasar / buka pintu", mathMeaning: "Bilangan konstanta tetap (hanya dibayar 1 kali)" },
      { phrase: "biaya tiap unit / per km / per jam", mathMeaning: "Bilangan koefisien yang dikalikan n (jumlah unit)" },
      { phrase: "titik impas (balik modal)", mathMeaning: "Pemasukan Total = Biaya Total" },
      { phrase: "lebih hemat paket A atau B?", mathMeaning: "Cari titik sama dulu, lalu uji n lebih besar/kecil" },
    ],
    firstStepChecklist:
      "Pisahkan mana angka yang dibayar SEKALI SAJA (tetap) dan mana angka yang diulang PER BARANG/JAM (dikalikan x).",
  },
  [NODE_IDS.PM_T2_ARIT]: {
    schemaType: "social_arithmetic_interest",
    schemaLabelId: "Aritmetika Sosial, Untung-Rugi & Bunga",
    defaultBaseRelationLatex: "\\%\\text{Untung} = \\frac{\\text{Jual} - \\text{Beli}}{\\text{Beli}} \\times 100\\%,\\quad B = M \\cdot i \\cdot t",
    whenToUse:
      "Dipakai untuk soal harga beli-jual, untung/rugi, bruto-tara-neto, atau bunga tabungan tunggal dan majemuk.",
    wordClues: [
      { phrase: "untung p%", mathMeaning: "Harga Jual = (100% + p%) × Harga Beli" },
      { phrase: "rugi p%", mathMeaning: "Harga Jual = (100% - p%) × Harga Beli" },
      { phrase: "bunga tahunan i% selama m bulan", mathMeaning: "Bunga = Modal × (i/100) × (m/12)" },
      { phrase: "neto (berat bersih)", mathMeaning: "Neto = Bruto (berat kotor) - Tara (kemasan)" },
    ],
    firstStepChecklist:
      "Ingat aturan emas: persentase untung/rugi SELALU dihitung dari Harga Beli (Modal awal), kecuali soal bilang sebaliknya.",
  },
  [NODE_IDS.PM_T3_PROB]: {
    schemaType: "probability_combinatorics",
    schemaLabelId: "Kaidah Pencacahan, Peluang & Kejadian Bersyarat",
    defaultBaseRelationLatex: "P(A) = \\frac{n(A)}{n(S)},\\quad C(n,k) = \\frac{n!}{k!(n-k)!}",
    whenToUse:
      "Dipakai saat soal cerita membahas peluang terambilnya bola/kartu, banyak cara memilih tim, atau susunan kode/kursi.",
    wordClues: [
      { phrase: "urutan penting (jabatan ketua/sekretaris, kode)", mathMeaning: "Gunakan pengisian slot atau Permutasi" },
      { phrase: "urutan TIDAK penting (pilih 3 anggota tim)", mathMeaning: "Gunakan Kombinasi C(n, k)" },
      { phrase: "kejadian A DAN B terjadi bersama", mathMeaning: "Kalikan banyak caranya / peluangnya (×)" },
      { phrase: "minimal 1 berhasil", mathMeaning: "Pakai komplemen: 1 - Peluang semuanya gagal" },
    ],
    firstStepChecklist:
      "Tanyakan dulu: 'Kalau dua orang yang kupilih posisinya kutukar, apakah hasilnya dianggap beda?' Kalau sama, pakai Kombinasi.",
  },
  [NODE_IDS.PM_T3_GEOM]: {
    schemaType: "geometry_3d_trigonometry",
    schemaLabelId: "Volume Bangun Ruang, Jarak & Trigonometri Terapan",
    defaultBaseRelationLatex: "V_{\\text{tabung}} = \\pi r^2 t,\\quad \\sin\\theta = \\frac{\\text{depan}}{\\text{miring}}",
    whenToUse:
      "Dipakai saat soal cerita melibatkan bak air/tabung/kubus/kerucut, tinggi bayangan/tangga (trigonometri), atau jarak lintasan.",
    wordClues: [
      { phrase: "jari-jari r vs diameter d", mathMeaning: "Selalu ubah diameter ke jari-jari dulu: r = d/2" },
      { phrase: "sudut elevasi dari tanah", mathMeaning: "Gunakan tan θ = tinggi / jarak mendatar pada segitiga siku-siku" },
      { phrase: "air dituang dari wadah A ke wadah B", mathMeaning: "Volume air tetap sama: V_A = V_B" },
    ],
    firstStepChecklist:
      "Pastikan kamu tidak salah memakai diameter sebagai jari-jari, lalu tulis rumus volume/trigonometri sebelum memasukkan angka.",
  },
};

const FALLBACK_WORD_GUIDE: SbiWordGuide = {
  whenToUse:
    "Gunakan pemetaan ini untuk memisahkan angka yang diketahui, hubungan matematisnya, dan target yang ditanyakan.",
  wordClues: [
    { phrase: "dari / tiap / per", mathMeaning: "Sering mengarah ke perkalian (×) atau pembagian (÷)" },
    { phrase: "selisih / berkurang", mathMeaning: "Operasi pengurangan (-)" },
    { phrase: "total / digabung", mathMeaning: "Operasi penjumlahan (+)" },
  ],
  firstStepChecklist:
    "Baca kalimat pertanyaan terakhir dulu untuk tahu apa yang dicari, lalu tulis angka diketahui satu per satu.",
};

function cleanMathSnippet(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function isUsefulFormula(latex: string | null): boolean {
  if (!latex) return false;
  const trimmed = latex.trim();
  if (trimmed.length < 3 || trimmed.length > 220) return false;
  // Avoid prose-only formulas
  if (/^\\text\{[^=]+\}$/.test(trimmed)) return false;
  return true;
}

function doesFormulaLeakFinalNumber(latex: string): boolean {
  // Heuristic: if solve formula ends with "= <short number>" it might spoil the exact answer
  return /=\s*-?\d+(?:[.,/]\d+)?\s*$/.test(latex.trim());
}

function detectRefinedSchema(
  stem: string,
  nodeMeta: NodeSbiMeta,
): { schemaType: string; schemaLabelId: string } {
  const lower = stem.toLowerCase();
  if ((lower.includes("pekerja") && lower.includes("hari")) || lower.includes("berbalik nilai")) {
    return {
      schemaType: "inverse_proportion_work",
      schemaLabelId: "Perbandingan Senilai, Berbalik Nilai & Laju",
    };
  }
  if (lower.includes("diskon") || (lower.includes("persen") && lower.includes("turun"))) {
    return {
      schemaType: "chained_discount_multiplier",
      schemaLabelId: "Persentase Bertingkat, Diskon & Faktor Pengali",
    };
  }
  if (lower.includes("titik impas") || lower.includes("biaya tetap")) {
    return {
      schemaType: "linear_profit_breakeven",
      schemaLabelId: "Biaya Tetap + Variabel, Margin & Titik Impas",
    };
  }
  if (lower.includes("silogisme") || lower.includes("modus tollens") || (lower.includes("jika") && lower.includes("maka"))) {
    return {
      schemaType: nodeMeta.schemaType.startsWith("logic_") ? "logic_implication_negation" : "syllogism_modus_tollens",
      schemaLabelId: nodeMeta.schemaType.startsWith("logic_")
        ? "Implikasi, Negasi & Ekuivalensi Logika"
        : "Penarikan Kesimpulan (Silogisme / Modus Tollens)",
    };
  }
  return {
    schemaType: nodeMeta.schemaType,
    schemaLabelId: nodeMeta.schemaLabelId,
  };
}

function extractKnownVariablesFromStem(
  stemMarkdown: string,
  skillNodeId: string,
): Array<{ symbol: string; label: string; valueText: string }> {
  const cleaned = stemMarkdown.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  const vars: Array<{ symbol: string; label: string; valueText: string }> = [];
  const seenValues = new Set<string>();

  const pushVar = (symbol: string, label: string, valueText: string) => {
    const valClean = valueText.replace(/\$/g, "").trim();
    if (!valClean || seenValues.has(valClean.toLowerCase())) return;
    seenValues.add(valClean.toLowerCase());
    vars.push({
      symbol,
      label: label.slice(0, 48),
      valueText: valClean.slice(0, 48),
    });
  };

  // 1. Explicit variable equations: x = 64, f(x) = 2x + 3, p = 20%
  const assignRegex = /\b([a-zA-Z](?:_[a-zA-Z0-9]+|\(x\))?)\s*=\s*([0-9]+(?:[.,][0-9]+)?%?|\\dfrac\{[^}]+\}\{[^}]+\}|[^\s,.;$]{1,18})/g;
  let m: RegExpExecArray | null;
  while ((m = assignRegex.exec(cleaned)) !== null && vars.length < 4) {
    pushVar(m[1], `Nilai ${m[1]}`, m[2]);
  }

  // 2. Rupiah amounts
  const rpRegex = /(Rp\s?[0-9][0-9.,]*)/gi;
  let idxRp = 1;
  while ((m = rpRegex.exec(cleaned)) !== null && vars.length < 4) {
    pushVar(`H_${idxRp}`, `Nominal uang ${idxRp}`, m[1]);
    idxRp += 1;
  }

  // 3. Percentages
  const pctRegex = /(\d+(?:[.,]\d+)?\s*%)/g;
  let idxPct = 1;
  while ((m = pctRegex.exec(cleaned)) !== null && vars.length < 4) {
    pushVar(`p_${idxPct}`, `Persentase ${idxPct}`, m[1].replace(/\s+/g, ""));
    idxPct += 1;
  }

  // 4. Number + Indonesian unit
  const unitRegex = /(\d+(?:[.,]\d+)?)\s+(orang|pekerja|hari|jam|menit|detik|km\/jam|m\/s|km|meter|m|cm|liter\/menit|liter|ml|kg|gram|buah|ekor|tahun|bulan|minggu|unit|pasang|siswa|kursi|bola)\b/gi;
  let idxUnit = 1;
  while ((m = unitRegex.exec(cleaned)) !== null && vars.length < 4) {
    const unitLower = m[2].toLowerCase();
    pushVar(`d_${idxUnit}`, `Besaran (${unitLower})`, `${m[1]} ${m[2]}`);
    idxUnit += 1;
  }

  if (vars.length >= 2) {
    return vars.slice(0, 4);
  }

  // 5. Structured non-numeric fallback for logic/algebra/data questions
  const sentences = cleaned
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);

  if (skillNodeId === NODE_IDS.PU_T0_LOG || skillNodeId === NODE_IDS.PU_T1_SYL || skillNodeId === NODE_IDS.PU_T2_ARG) {
    if (vars.length === 0) {
      pushVar("P_1", "Premis / pernyataan 1", sentences[0]?.slice(0, 44) ?? "Kalimat premis pertama");
    }
    if (vars.length < 2) {
      pushVar("P_2", "Premis / syarat 2", sentences[1]?.slice(0, 44) ?? "Syarat atau fakta kedua di soal");
    }
    if (vars.length < 2) {
      pushVar("P_rel", "Penghubung logika", "Hubungkan premis awal menuju kesimpulan sah");
    }
    return vars;
  }

  if (vars.length === 0) {
    pushVar("D_1", "Informasi utama soal", sentences[0]?.slice(0, 44) ?? "Fakta pertama dari soal");
  }
  if (vars.length < 2) {
    pushVar("D_2", "Syarat / relasi soal", sentences[1]?.slice(0, 44) ?? "Aturan penghubung di soal");
  }
  if (vars.length < 2) {
    pushVar("D_target", "Hubungan antar besaran", "Susun persamaan dari informasi soal");
  }
  return vars;
}

function extractTargetUnknownFromStem(stemMarkdown: string): string {
  const normalized = cleanMathSnippet(stemMarkdown).replace(/\$\s*\\dots\s*\$/g, "...");
  const sentences = normalized
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.replace(/[^a-zA-Z0-9]/g, "").length >= 4);

  const interrogative =
    [...sentences]
      .reverse()
      .find((s) =>
        /[?]|berapa|tentukan|nilai|kesimpulan|simpulan|manakah|pernyataan|hasil|jarak|waktu|luas|volume|peluang|banyak|bilangan|suku|pola/i.test(
          s,
        ),
      ) ?? sentences[sentences.length - 1] ?? normalized;

  const cleanTarget = interrogative.replace(/\s*\\dots\s*/g, "...").trim();
  if (cleanTarget.replace(/[^a-zA-Z0-9]/g, "").length < 3) {
    return "Nilai akhir sesuai pertanyaan soal";
  }
  if (cleanTarget.length <= 115) return cleanTarget;
  return `${cleanTarget.slice(0, 112)}...`;
}

export function getSbiGuideForQuestion(
  skillNodeId: string,
  schemaType?: string | null,
): SbiWordGuide {
  const nodeMeta = NODE_SBI_META[skillNodeId];
  if (nodeMeta) {
    return {
      whenToUse: nodeMeta.whenToUse,
      wordClues: nodeMeta.wordClues,
      firstStepChecklist: nodeMeta.firstStepChecklist,
    };
  }
  if (schemaType) {
    const bySchema = Object.values(NODE_SBI_META).find((m) => m.schemaType === schemaType);
    if (bySchema) {
      return {
        whenToUse: bySchema.whenToUse,
        wordClues: bySchema.wordClues,
        firstStepChecklist: bySchema.firstStepChecklist,
      };
    }
  }
  return FALLBACK_WORD_GUIDE;
}

export function buildSbiSchemaChoices(
  deconstruction: SbiDeconstruction | null,
  subtest: SnbtSubtest,
  seedKey: string,
): Array<{ id: string; label: string }> {
  const choices: Array<{ id: string; label: string }> = [];
  const seen = new Set<string>();

  if (deconstruction) {
    seen.add(deconstruction.schemaType);
    choices.push({
      id: deconstruction.schemaType,
      label: deconstruction.schemaLabelId,
    });
  }

  const sameSubtest = SBI_SCHEMA_CATALOG.filter((s) => s.subtests.includes(subtest));
  const others = SBI_SCHEMA_CATALOG.filter((s) => !s.subtests.includes(subtest));

  for (const item of [...sameSubtest, ...others]) {
    if (choices.length >= 6) break;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    choices.push({ id: item.id, label: item.label });
  }

  // Deterministic seeded shuffle so the correct answer is not always first
  let hash = 2166136261;
  for (let i = 0; i < seedKey.length; i += 1) {
    hash ^= seedKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const result = [...choices];
  for (let i = result.length - 1; i > 0; i -= 1) {
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 1274126177);
    const j = (hash >>> 0) % (i + 1);
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

export function deriveSbiDeconstructionForQuestion(
  question: Pick<
    QuestionEntity,
    | "id"
    | "skillNodeId"
    | "subtest"
    | "track"
    | "stemMarkdown"
    | "solutionSteps"
    | "sbiDeconstruction"
  >,
): SbiDeconstruction | null {
  if (question.sbiDeconstruction) {
    return question.sbiDeconstruction;
  }
  if (question.track !== "quantitative") {
    return null;
  }

  const nodeMeta =
    NODE_SBI_META[question.skillNodeId] ?? {
      schemaType: "linear_single_variable",
      schemaLabelId: "Pemodelan Matematika & Pola Soal Cerita",
      defaultBaseRelationLatex:
        "\\text{Diketahui} \\to \\text{Model} \\to \\text{Ditanya}",
      ...FALLBACK_WORD_GUIDE,
    };

  const refined = detectRefinedSchema(question.stemMarkdown, nodeMeta);
  const knownVariables = extractKnownVariablesFromStem(
    question.stemMarkdown,
    question.skillNodeId,
  );
  const targetUnknown = extractTargetUnknownFromStem(question.stemMarkdown);

  // Pick a setup/deconstruct formula that helps the student start WITHOUT spoiling final number
  const setupStep = question.solutionSteps.find(
    (s) =>
      (s.stage === "setup" || s.stage === "deconstruct") &&
      isUsefulFormula(s.formulaLatex) &&
      !doesFormulaLeakFinalNumber(s.formulaLatex ?? ""),
  );

  const baseRelationLatex =
    setupStep?.formulaLatex ??
    nodeMeta.defaultBaseRelationLatex ??
    "\\text{Model Hubungan}";

  return {
    schemaType: refined.schemaType,
    schemaLabelId: refined.schemaLabelId,
    knownVariables,
    targetUnknown,
    baseRelationLatex,
  };
}
