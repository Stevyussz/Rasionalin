import { NODE_IDS } from "./seed-data";
import type { SnbtSubtest } from "./types";

export interface SnbtKnowledgeEntry {
  id: string;
  subtest: SnbtSubtest;
  skillNodeId: string;
  topicTitle: string;
  priorityLevel: number;
  priorityBadge: "Wajib Prioritas" | "Sering Muncul" | "Penguat Skor 800";
  sourceLabel: string;
  whyBeforeHow: string;
  keyFormulasLatex: string[];
  shortcutWithBoundary: {
    methodLabel: string;
    shortcutMarkdown: string;
    validityConditions: string;
  } | null;
  utbkTraps: string[];
  keywords: string[];
}

export const SNBT_KNOWLEDGE_BASE: SnbtKnowledgeEntry[] = [
  // === PK (Pengetahuan Kuantitatif) ===
  {
    id: "kb-pk-frac-01",
    subtest: "PK",
    skillNodeId: NODE_IDS.PK_T0_FRAC,
    topicTitle: "Operasi Bilangan, Pecahan, Persentase & Perbandingan Nilai",
    priorityLevel: 8,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Bilangan & Operasi)",
    whyBeforeHow:
      "Penyebut pecahan menyatakan ukuran potongan, sedangkan pembilang adalah banyaknya potongan. Dua pecahan hanya sah dijumlahkan atau dibandingkan bila ukuran potongannya (penyebut/basis) disamakan dulu, atau diubah ke bentuk desimal bertingkat yang mudah dibandingkan.",
    keyFormulasLatex: [
      "\\dfrac{a}{b} \\pm \\dfrac{c}{d} = \\dfrac{ad \\pm bc}{bd}",
      "\\dfrac{1}{a} \\div \\dfrac{1}{b} = \\dfrac{b}{a}",
      "0,\\overline{ab} = \\dfrac{ab}{99}",
    ],
    shortcutWithBoundary: {
      methodLabel: "Uji Silang Bandingkan Pecahan & Desimal Berulang",
      shortcutMarkdown:
        "Untuk membandingkan $\\dfrac{a}{b}$ dengan $\\dfrac{c}{d}$, bandingkan $a \\cdot d$ terhadap $c \\cdot b$. Untuk desimal berulang $0,abab\\dots$, ubah langsung menjadi $\\dfrac{ab}{99}$.",
      validityConditions:
        "Perkalian silang hanya mempertahankan arah tanda jika kedua penyebut bernilai positif ($b > 0$ dan $d > 0$).",
    },
    utbkTraps: [
      "Menjumlahkan pembilang dengan pembilang sekaligus penyebut dengan penyebut saat penyebut berbeda.",
      "Lupa tanda negatif di antara dua suku pecahan, misalnya mengabaikan minus pada suku tengah.",
      "Salah membaca urutan bilangan negatif desimal (mengira $-0,9$ lebih besar dari $-0,09$).",
    ],
    keywords: [
      "pecahan",
      "penyebut",
      "kpk",
      "desimal",
      "berulang",
      "negatif",
      "eksponen",
      "pangkat",
      "akar",
      "bilangan",
    ],
  },
  {
    id: "kb-pk-alg-01",
    subtest: "PK",
    skillNodeId: NODE_IDS.PK_T0_ALG,
    topicTitle: "Manipulasi Aljabar, Pindah Ruas & Fungsi Komposisi-Invers",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Aljabar & Fungsi)",
    whyBeforeHow:
      "Persamaan ibarat timbangan seimbang: setiap suku yang dipindah sebenarnya merupakan operasi kebalikan pada kedua ruas. Pada fungsi komposisi $(g \\circ f)(x) = g(f(x))$, keluaran mesin $f$ langsung menjadi masukan bagi mesin $g$, dan inversnya membalik arah pemetaan dari hasil kembali ke asal.",
    keyFormulasLatex: [
      "a(b - c) = ab - ac",
      "(f \\circ g)(x) = f(g(x))",
      "(g \\circ f)^{-1}(x) = (f^{-1} \\circ g^{-1})(x)",
    ],
    shortcutWithBoundary: {
      methodLabel: "Sifat Tukar Invers Tanpa Mencari Rumus Invers",
      shortcutMarkdown:
        "Jika diketahui $h(k) = m$, maka langsung berlaku $h^{-1}(m) = k$. Untuk $(g \\circ f)^{-1}(a) = b$, cukup uji $(g \\circ f)(b) = a$.",
      validityConditions:
        "Berlaku pada fungsi bijektif di daerah asal yang terdefinisi (penyebut pecahan tidak boleh bernilai nol).",
    },
    utbkTraps: [
      "Berhenti setelah menemukan nilai $x$, padahal kalimat terakhir menanyakan $x + 2$ atau $2x - 1$.",
      "Lupa mengalikan faktor di luar kurung ke suku kedua (menulis $3(2x - 5) = 6x - 5$).",
      "Menukar urutan $(f \\circ g)^{-1}$ menjadi $(f^{-1} \\circ g^{-1})$ padahal urutannya harus dibalik.",
    ],
    keywords: [
      "aljabar",
      "pindah ruas",
      "persamaan",
      "komposisi",
      "invers",
      "fungsi",
      "substitusi",
      "operasi simbol",
    ],
  },
  {
    id: "kb-pk-lin-01",
    subtest: "PK",
    skillNodeId: NODE_IDS.PK_T1_LIN,
    topicTitle: "Dimensi 0-1-2, Gradien Garis, SPLDV & Barisan Aritmetika",
    priorityLevel: 10,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 PK)",
    whyBeforeHow:
      "Gradien mengukur rasio kenaikan vertikal ($\\Delta y$) per satu langkah horizontal ($\\Delta x$). Dua garis sejajar memiliki kemiringan identik, sedangkan garis tegak lurus membalik arah kemiringan menjadi berlawanan dan berkebalikan. Prinsip beda konstan ini identik dengan gradien pada barisan aritmetika.",
    keyFormulasLatex: [
      "m = \\dfrac{y_2 - y_1}{x_2 - x_1}, \\quad ax + by + c = 0 \\implies m = -\\dfrac{a}{b}",
      "m_1 \\cdot m_2 = -1 \\quad (\\text{tegak lurus})",
      "U_n = a + (n - 1)b, \\quad S_n = \\dfrac{n}{2}(a + U_n)",
    ],
    shortcutWithBoundary: {
      methodLabel: "Trik Selisih Indeks Barisan & Eliminasi Cepat SPL",
      shortcutMarkdown:
        "Pada barisan aritmetika, beda $b = \\dfrac{U_p - U_q}{p - q}$ tanpa harus mencari $U_1$ dulu. Jumlah suku simetris: $U_1 + U_n = U_2 + U_{n-1}$.",
      validityConditions:
        "Rumus $b = \\dfrac{U_p - U_q}{p - q}$ khusus untuk barisan aritmetika (beda penjumlahan konstan), bukan geometri.",
    },
    utbkTraps: [
      "Mengira syarat tegak lurus cukup membalik tanda ($m_2 = -m_1$) atau membalik pecahan saja ($m_2 = \\dfrac{1}{m_1}$).",
      "Salah membaca gradien bentuk $2x - 4y + 5 = 0$ menjadi $m = 2$, lupa membagi dengan $-4$.",
      "Tertukar koefisien $x$ dan $y$ saat menyusun persamaan dari titik potong sumbu.",
    ],
    keywords: [
      "garis",
      "gradien",
      "tegak lurus",
      "sejajar",
      "spldv",
      "spltv",
      "barisan",
      "aritmetika",
      "deret",
      "dimensi",
      "koordinat",
    ],
  },
  {
    id: "kb-pk-rate-01",
    subtest: "PK",
    skillNodeId: NODE_IDS.PK_T2_RATE,
    topicTitle: "Perbandingan Senilai, Berbalik Nilai, Laju Kerja & Bangun Ruang",
    priorityLevel: 8,
    priorityBadge: "Sering Muncul",
    sourceLabel: "Kurikulum Prioritas SNBT (Laju & Geometri)",
    whyBeforeHow:
      "Sebelum memasang rumus, uji logika sebab-akibat dua besaran: jika besaran pertama naik membuat besaran kedua ikut naik (misal jarak dan waktu pada kecepatan tetap), maka rasionya tetap (senilai). Jika satu naik membuat yang lain turun (jumlah pekerja dan durasi proyek), maka hasil kalinya tetap (berbalik nilai).",
    keyFormulasLatex: [
      "\\dfrac{x_1}{y_1} = \\dfrac{x_2}{y_2} \\quad (\\text{senilai})",
      "P_1 \\cdot t_1 = P_2 \\cdot t_2 \\quad (\\text{berbalik nilai})",
      "V_{\\text{balok}} = p \\cdot l \\cdot t, \\quad L_p = 2(pl + pt + lt)",
    ],
    shortcutWithBoundary: {
      methodLabel: "Pemisalan Rasio dengan Variabel Faktor $k$",
      shortcutMarkdown:
        "Jika rasio dimensi $p:l:t = 3:2:1$, langsung tulis $p = 3k, l = 2k, t = k$ lalu masukkan ke persamaan luas/volume sebelum menghitung hasil akhir.",
      validityConditions:
        "Pada soal pekerja-hari, pastikan tidak ada hari terhenti atau penambahan pekerja di tengah proyek; jika berhenti di tengah jalan, hitung sisa beban kerja dulu.",
    },
    utbkTraps: [
      "Memakai perbandingan senilai pada soal pekerja dan hari sehingga menambah pekerja malah memperpanjang waktu.",
      "Keliru membaca kalimat 'ditambah $4$ pekerja' ($P_2 = P_1 + 4$) sebagai 'menjadi $4$ pekerja'.",
      "Lupa menguadratkan atau mengubikkan faktor $k$ saat mencari luas atau volume dari perbandingan sisi.",
    ],
    keywords: [
      "perbandingan",
      "senilai",
      "berbalik nilai",
      "pekerja",
      "kecepatan",
      "laju",
      "debit",
      "balok",
      "volume",
      "luas permukaan",
    ],
  },
  {
    id: "kb-pk-quad-01",
    subtest: "PK",
    skillNodeId: NODE_IDS.PK_T2_QUAD,
    topicTitle: "Fungsi Kuadrat, Parabola, Diskriminan & Identitas Vieta",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.9 PK)",
    whyBeforeHow:
      "Bentuk umum $ax^2 + bx + c = 0$ menyimpan jumlah dan hasil kali akar secara langsung di koefisiennya tanpa perlu memfaktorkan akar satu per satu. Sementara itu, grafik parabola memiliki titik puncak tepat di tengah kedua akarnya pada sumbu simetri $x_p = -\\dfrac{b}{2a}$.",
    keyFormulasLatex: [
      "\\alpha + \\beta = -\\dfrac{b}{a}, \\quad \\alpha\\beta = \\dfrac{c}{a}",
      "\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta",
      "x_p = -\\dfrac{b}{2a}, \\quad y_p = f(x_p) = -\\dfrac{D}{4a}",
    ],
    shortcutWithBoundary: {
      methodLabel: "Identitas Simetris Akar & Posisi Parabola",
      shortcutMarkdown:
        "Untuk kuadrat jumlah akar, pakai $(\\alpha + \\beta)^2 - 2\\alpha\\beta$. Untuk menyinggung garis/sumbu-$x$, uji $D = b^2 - 4ac = 0$.",
      validityConditions:
        "Nilai $\\alpha^2 + \\beta^2$ tetap dapat dihitung secara aljabar meski akar kompleks, namun di UTBK umumnya disyaratkan dua akar real ($D \\ge 0$).",
    },
    utbkTraps: [
      "Lupa tanda negatif pada $\\alpha + \\beta = -\\dfrac{b}{a}$ sehingga koefisien $-6x$ terbaca $\\alpha + \\beta = -6$.",
      "Mengira $\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2$ tanpa dikurangi $2\\alpha\\beta$.",
      "Keliru menentukan nilai maksimum/minimum fungsi hanya dari $x_p$, padahal nilai optimumnya adalah $y_p$.",
    ],
    keywords: [
      "kuadrat",
      "parabola",
      "akar",
      "vieta",
      "diskriminan",
      "titik puncak",
      "sumbu simetri",
      "alfa",
      "beta",
    ],
  },
  {
    id: "kb-pk-ineq-01",
    subtest: "PK",
    skillNodeId: NODE_IDS.PK_T3_INEQ,
    topicTitle: "Pertidaksamaan, Analisis Kecukupan Data (1)&(2) dan P vs Q",
    priorityLevel: 9,
    priorityBadge: "Penguat Skor 800",
    sourceLabel: "Kurikulum Prioritas SNBT (Tipe Soal P/Q & Kecukupan)",
    whyBeforeHow:
      "Soal kecukupan data tidak selalu meminta angka tunggal, melainkan menanyakan apakah informasi yang ada memaksa satu jawaban pasti (selalu YA atau selalu TIDAK). Karena tanda variabel belum tentu positif, perkalian silang pada pertidaksamaan sangat berbahaya sebab tanda ketidaksamaan berbalik jika pengalinya negatif.",
    keyFormulasLatex: [
      "\\dfrac{A}{B} \\ge 0 \\iff A \\cdot B \\ge 0 \\; \\land \\; B \\neq 0",
      "x^2 = k \\; (k > 0) \\implies x = \\pm\\sqrt{k}",
    ],
    shortcutWithBoundary: {
      methodLabel: "Uji Pernyataan (1) Terpisah Total dari (2)",
      shortcutMarkdown:
        "Langkah wajib soal kecukupan data: tutup pernyataan (2), uji apakah (1) memberi jawaban tunggal (selalu YA atau selalu TIDAK). Setelah itu tutup (1), uji (2) sendirian. Baru gabungkan jika keduanya masing-masing ambigu.",
      validityConditions:
        "Jika sebuah pernyataan menghasilkan 2 kasus berlawanan (satu menjawab YA, satu menjawab TIDAK), pernyataan itu TIDAK CUKUP.",
    },
    utbkTraps: [
      "Membawa informasi pernyataan (1) masuk saat sedang menguji pernyataan (2) sendirian.",
      "Mengalikan silang pertidaksamaan $\\dfrac{x+1}{x-2} > 0$ dengan $(x-2)$ tanpa memecah kasus positif/negatif.",
      "Menganggap jawaban 'TIDAK' (misal pasti $x < 0$) sebagai tidak cukup, padahal jawaban pasti 'TIDAK' juga berarti CUKUP.",
    ],
    keywords: [
      "kecukupan",
      "cukup",
      "pernyataan (1)",
      "pernyataan (2)",
      "hubungan p dan q",
      "kuantitas",
      "pertidaksamaan",
      "rasional",
      "nilai mutlak",
    ],
  },

  // === PU (Penalaran Umum) ===
  {
    id: "kb-pu-log-01",
    subtest: "PU",
    skillNodeId: NODE_IDS.PU_T0_LOG,
    topicTitle: "Logika Matematika: Negasi Kuantor & Hukum De Morgan",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Penalaran Deduktif)",
    whyBeforeHow:
      "Untuk membantah klaim universal ('Semua peserta membaca modul dan mengerjakan latihan'), kita tidak perlu membuktikan semuanya gagal. Cukup tunjukkan SATU orang contoh penyangkal ('Ada peserta yang tidak membaca modul ATAU tidak mengerjakan latihan'). Itulah alasan negasi kuantor semua berubah menjadi ada/beberapa dan 'dan' berubah menjadi 'atau'.",
    keyFormulasLatex: [
      "\\neg(\\forall x,\\; P(x) \\land Q(x)) \\equiv \\exists x,\\; (\\neg P(x) \\lor \\neg Q(x))",
      "\\neg(P \\to Q) \\equiv P \\land \\neg Q",
      "(P \\to Q) \\equiv (\\neg Q \\to \\neg P) \\equiv (\\neg P \\lor Q)",
    ],
    shortcutWithBoundary: {
      methodLabel: "Konversi Cepat Implikasi ke Disjungsi & Negasinya",
      shortcutMarkdown:
        "Ingat pola $\\neg(P \\land Q) = \\neg P \\lor \\neg Q$ dan $\\neg(P \\lor Q) = \\neg P \\land \\neg Q$. Negasi dari implikasi 'Jika $P$ maka $Q$' bukanlah implikasi lagi, melainkan '$P$ dan tidak $Q$'.",
      validityConditions:
        "Berlaku pada penalaran deduktif ketat; perhatikan kata hubung majemuk 'dan' vs 'atau' pada kalimat soal.",
    },
    utbkTraps: [
      "Menegasikan 'Semua A adalah B' menjadi 'Semua A bukan B' (kesalahan kuantor).",
      "Lupa menukar kata 'dan' menjadi 'atau' saat menerapkan negasi De Morgan.",
      "Menyimpulkan implikasi ekuivalen dengan inversnya ($\\neg P \\to \\neg Q$).",
    ],
    keywords: [
      "negasi",
      "ingkaran",
      "kuantor",
      "semua",
      "sebagian",
      "beberapa",
      "de morgan",
      "ekuivalen",
      "implikasi",
    ],
  },
  {
    id: "kb-pu-syl-01",
    subtest: "PU",
    skillNodeId: NODE_IDS.PU_T1_SYL,
    topicTitle: "Silogisme, Modus Ponens, Modus Tollens & Kontraposisi",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Deduktif PU)",
    whyBeforeHow:
      "Implikasi 'Jika $P$ maka $Q$' bersifat satu arah seperti jalan tol satu jurusan: mengetahui $P$ terjadi menjamin $Q$ terjadi (Modus Ponens), dan mengetahui $Q$ gagal memaksa $P$ pasti tidak terjadi (Modus Tollens). Namun melihat $Q$ terjadi tidak pernah menjamin $P$ adalah satu-satunya penyebab.",
    keyFormulasLatex: [
      "(P \\to Q) \\land P \\vdash Q \\quad (\\text{Ponens})",
      "(P \\to Q) \\land \\neg Q \\vdash \\neg P \\quad (\\text{Tollens})",
      "(P \\to Q) \\land (Q \\to R) \\vdash (P \\to R) \\quad (\\text{Silogisme})",
    ],
    shortcutWithBoundary: {
      methodLabel: "Ubah 'Tidak Q atau R' menjadi Implikasi Q -> R",
      shortcutMarkdown:
        "Saat bertemu bentuk '$\\neg Q$ atau $R$' atau '$A$ jika hanya jika $B$', ubah dulu menjadi panah satu arah ($Q \\to R$) agar rantai silogisme terlihat langsung.",
      validityConditions:
        "Hanya sah jika kedua premis terhubung berurutan ($Q$ sebagai akibat di premis 1 dan sebab di premis 2) atau lewat kontraposisi.",
    },
    utbkTraps: [
      "Menarik kesimpulan dari premis $(P \\to Q)$ dan fakta $Q$ menjadi $P$ (sesat pikir afirmasi konsekuen).",
      "Menarik kesimpulan dari $(P \\to Q)$ dan $\\neg P$ menjadi $\\neg Q$ (sesat pikir negasi anteseden).",
      "Mengubah simpulan pasti deduktif menjadi kata lemah 'mungkin'.",
    ],
    keywords: [
      "silogisme",
      "modus ponens",
      "modus tollens",
      "kontraposisi",
      "premis",
      "simpulan",
      "deduktif",
      "jika maka",
    ],
  },
  {
    id: "kb-pu-arg-01",
    subtest: "PU",
    skillNodeId: NODE_IDS.PU_T2_ARG,
    topicTitle: "Kesesuaian Pernyataan, Memperkuat & Memperlemah Argumen",
    priorityLevel: 10,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 Induktif PU)",
    whyBeforeHow:
      "Soal Kesesuaian Pernyataan (level prioritas tertinggi PU) menguji disiplin membaca tanpa menambahkan asumsi pribadi. Pernyataan PASTI BENAR harus didukung fakta eksplisit teks. Pernyataan yang MEMPERKUAT memberi bukti tambahan atau menyingkirkan faktor lain yang mendukung klaim peneliti, sedangkan yang MEMPERLEMAH memutus jembatan sebab-akibat atau menunjukkan bukti tandingan.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Matriks 3 Label Uji Pernyataan: Sesuai / Netral / Bertentangan",
      shortcutMarkdown:
        "Saat membaca tiap opsi: beri label (1) Didukung penuh teks, (2) Tidak dibahas / spekulasi luar teks, (3) Bertentangan langsung dengan teks. Opsi 'TIDAK MEMPERLEMAH' mencakup opsi yang mendukung maupun opsi yang netral.",
      validityConditions:
        "Jangan pernah memakai pengetahuan luar jika teks secara eksplisit membatasi cakupan atau tahun datanya.",
    },
    utbkTraps: [
      "Tertipu kalimat yang mirip fakta umum di luar bacaan padahal tidak pernah disinggung dalam teks.",
      "Mengira pernyataan yang netral/tidak relevan otomatis 'memperlemah' argumen.",
      "Membalik arah hubungan sebab-akibat ($X$ menurunkan $Y$ dibaca menjadi $Y$ menurunkan $X$).",
    ],
    keywords: [
      "kesesuaian",
      "memperkuat",
      "memperlemah",
      "pasti benar",
      "pasti salah",
      "mungkin benar",
      "alasan perbedaan",
      "argumen",
      "kualitas simpulan",
    ],
  },
  {
    id: "kb-pu-pat-01",
    subtest: "PU",
    skillNodeId: NODE_IDS.PU_T3_PAT,
    topicTitle: "Pola Bilangan Bertingkat, Analisis Data & Pemodelan PU",
    priorityLevel: 8,
    priorityBadge: "Sering Muncul",
    sourceLabel: "Kurikulum Prioritas SNBT (Kuantitatif PU)",
    whyBeforeHow:
      "Pola bilangan tidak pernah acak; selisih atau rasio antar elemen mengikuti aturan operasi berulang. Jika selisih langsung antar suku berurutan tampak naik-turun, besar kemungkinan barisan tersebut terdiri dari dua pola selang-seling (indeks ganjil dan genap) atau aturan bertingkat dua.",
    keyFormulasLatex: [
      "a_1, b_1, a_2, b_2, \\dots \\implies \\text{cek selisih } (a_{k+1} - a_k) \\text{ dan } (b_{k+1} - b_k)",
      "\\text{Persentase selisih} = \\dfrac{\\text{Akhir} - \\text{Awal}}{\\text{Awal}} \\times 100\\%",
    ],
    shortcutWithBoundary: {
      methodLabel: "Uji 3 Pola Utama dalam 15 Detik",
      shortcutMarkdown:
        "1) Cek selisih tingkat 1; 2) Jika selisih beruba-ubah teratur, cek selisih tingkat 2 atau rasio kali-bagi; 3) Jika arah naik-turun bergantian, pisahkan suku indeks ganjil dan indeks genap.",
      validityConditions:
        "Pada prediksi data tabel/grafik tahun berikutnya, cek apakah laju kenaikan berupa selisih absolut (linear) atau persentase (eksponensial).",
    },
    utbkTraps: [
      "Salah menghitung penyebut saat mencari persentase kenaikan (memakai angka tahun akhir, bukan tahun dasar awal).",
      "Mencampur suku ganjil dan genap pada barisan selang-seling.",
      "Keliru membandingkan laju pertumbuhan relatif (%) dengan kenaikan nilai absolut.",
    ],
    keywords: [
      "pola bilangan",
      "barisan",
      "deret",
      "larik",
      "analisis data",
      "tabel",
      "grafik",
      "prediksi",
      "persentase kenaikan",
    ],
  },

  // === PM (Penalaran Matematika) ===
  {
    id: "kb-pm-unit-01",
    subtest: "PM",
    skillNodeId: NODE_IDS.PM_T0_UNIT,
    topicTitle: "Konversi Satuan, FPB/KPK Kontekstual & Translasi Narasi",
    priorityLevel: 8,
    priorityBadge: "Sering Muncul",
    sourceLabel: "Kurikulum Prioritas SNBT (Bilangan & Pemodelan PM)",
    whyBeforeHow:
      "Soal Penalaran Matematika sengaja memakai narasi panjang kehidupan nyata agar siswa menerjemahkan cerita menjadi model matematika yang terukur. Langkah pertama sebelum menghitung selalu menyamakan satuan (menit vs jam, liter vs mL, gram vs kg) dan menerjemahkan jadwal berulang dengan KPK atau pembagian sama rata dengan FPB.",
    keyFormulasLatex: [
      "\\text{KPK}(a, b) \\times \\text{FPB}(a, b) = a \\cdot b",
      "1 \\text{ jam} = 60 \\text{ menit}, \\quad 1 \\text{ liter} = 1\\text{ dm}^3 = 1.000 \\text{ cm}^3",
    ],
    shortcutWithBoundary: {
      methodLabel: "Tulis Variabel + Satuan Eksplisit Sebelum Hitung",
      shortcutMarkdown:
        "Ubah seluruh kuantitas waktu/volume/berat ke satuan terkecil yang seragam sebelum menyusun perbandingan, lalu cek apakah kejadian bersama memakai KPK atau pembagian merata memakai FPB.",
      validityConditions:
        "KPK berlaku untuk jadwal siklus berkala (tiap X hari sekali); cek apakah hitungan mulai dari hari H0 atau hari ke-1.",
    },
    utbkTraps: [
      "Langsung mengalikan kecepatan dalam km/jam dengan waktu dalam menit tanpa membagi 60.",
      "Tertukar kapan memakai FPB (membagi banyak barang ke paket maksimal) dengan KPK (kejadian bertemu lagi).",
      "Melewatkan syarat pembulatan ke atas/bawah pada barang utuh (misal minimal dus atau bus yang dibutuhkan).",
    ],
    keywords: [
      "satuan",
      "konversi",
      "kpk",
      "fpb",
      "jadwal",
      "bersama",
      "liter",
      "jam",
      "menit",
      "kecepatan",
      "waktu tempuh",
    ],
  },
  {
    id: "kb-pm-pct-01",
    subtest: "PM",
    skillNodeId: NODE_IDS.PM_T1_PCT,
    topicTitle: "Aritmatika Sosial, Diskon Bertingkat, Bunga & Pajak",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Aritmatika Sosial PM)",
    whyBeforeHow:
      "Persentase selalu menempel pada nilai dasarnya (basis). Diskon 20% lalu tambahan 25% diterapkan ke harga yang SUDAH terpotong, bukan ke harga awal lagi. Itulah mengapa faktor pengali berantai $(1 - 0,20)(1 - 0,25) = 0,60$ menghasilkan bayar 60% (diskon efektif 40%), bukan diskon 45%.",
    keyFormulasLatex: [
      "H_{\\text{akhir}} = H_{\\text{awal}} \\cdot (1 - d_1) \\cdot (1 - d_2)",
      "H_{\\text{awal}} = \\dfrac{H_{\\text{akhir}}}{1 - d}, \\quad U\\% = \\dfrac{\\text{Untung}}{\\text{Harga Beli}} \\times 100\\%",
    ],
    shortcutWithBoundary: {
      methodLabel: "Faktor Pengali Berantai (1 + r) dan Basis Asli",
      shortcutMarkdown:
        "Naik $p\\%$ kalikan $\\left(1 + \\dfrac{p}{100}\\right)$, turun $d\\%$ kalikan $\\left(1 - \\dfrac{d}{100}\\right)$. Untuk mencari harga sebelum diskon dari harga setelah diskon, BAGI dengan $(1 - d)$, bukan ditambah $d\\%$.",
      validityConditions:
        "Cek teks soal apakah pajak/biaya layanan dihitung dari harga awal atau harga setelah diskon.",
    },
    utbkTraps: [
      "Menjumlahkan diskon beruntun $d_1 + d_2$ secara langsung tanpa mengalikannya secara berantai.",
      "Menghitung harga sebelum diskon dengan menambahkan $20\\%$ dari harga diskon (salah basis!).",
      "Tertukar persen keuntungan terhadap harga jual dengan harga beli.",
    ],
    keywords: [
      "diskon",
      "bertingkat",
      "bunga",
      "pajak",
      "persentase",
      "untung",
      "rugi",
      "aritmatika sosial",
      "harga jual",
      "harga beli",
    ],
  },
  {
    id: "kb-pm-lin-01",
    subtest: "PM",
    skillNodeId: NODE_IDS.PM_T2_LIN,
    topicTitle: "Pemodelan SPL, Statistika Data & Bangun Datar-Ruang",
    priorityLevel: 10,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 PM)",
    whyBeforeHow:
      "Sebagian besar soal PM menggabungkan beberapa topik sekaligus: membaca data tabel/barisan untuk mencari total, menyusun persamaan biaya atau rata-rata gabungan, hingga mengaitkan bangun ruang (tabung, kerucut, balok) dengan tarif atau kapasitas. Prinsip kekekalan jumlah adalah kuncinya: total nilai kelompok gabungan sama persis dengan jumlah total masing-masing sub-kelompok.",
    keyFormulasLatex: [
      "\\bar{x}_{\\text{gab}} = \\dfrac{n_1 \\bar{x}_1 + n_2 \\bar{x}_2}{n_1 + n_2}",
      "\\text{Laba} = (P - B_{\\text{var}}) \\cdot x - B_{\\text{tetap}}",
      "V_{\\text{tabung}} = \\pi r^2 t, \\quad V_{\\text{kerucut}} = \\dfrac{1}{3}\\pi r^2 t",
    ],
    shortcutWithBoundary: {
      methodLabel: "Metode Jungkat-Jungkit Rata-Rata Gabungan",
      shortcutMarkdown:
        "Selisih jarak ke rata-rata gabungan berbanding terbalik dengan banyaknya data: $\\dfrac{n_1}{n_2} = \\dfrac{|\\bar{x}_2 - \\bar{x}_{\\text{gab}}|}{|\\bar{x}_{\\text{gab}} - \\bar{x}_1|}$. Sangat cepat tanpa mengalikan angka besar!",
      validityConditions:
        "Hanya berlaku untuk rata-rata hitung (mean), bukan median maupun modus.",
    },
    utbkTraps: [
      "Mengambil rata-rata gabungan sebagai $(\\bar{x}_1 + \\bar{x}_2) / 2$ saat ukuran kedua kelompok tidak sama.",
      "Mengalikan biaya tetap dengan jumlah unit $x$, padahal biaya tetap bersifat konstan.",
      "Tertukar jari-jari ($r$) dengan diameter ($d = 2r$) pada soal tabung atau lingkaran.",
    ],
    keywords: [
      "rata-rata",
      "mean",
      "median",
      "statistika",
      "gabungan",
      "keuntungan",
      "biaya",
      "impas",
      "tabung",
      "kerucut",
      "geometri",
      "trigonometri",
    ],
  },
  {
    id: "kb-pm-prob-01",
    subtest: "PM",
    skillNodeId: NODE_IDS.PM_T3_PROB,
    topicTitle: "Kaidah Pencacahan, Kombinasi, Peluang & Peluang Bersyarat",
    priorityLevel: 9,
    priorityBadge: "Penguat Skor 800",
    sourceLabel: "Kurikulum Prioritas SNBT (Data & Ketidakpastian PM)",
    whyBeforeHow:
      "Sebelum memakai permutasi atau kombinasi, tanyakan satu hal: apakah urutan memengaruhi hasil? Jika urutan posisi (ketua-sekretaris, angka sandi) berbeda artinya, gunakan Permutasi ($P$) atau aturan pengisian slot; jika urutan kelompok (tim beranggotakan 3 orang, mengambil 2 bola sekaligus) dianggap sama, gunakan Kombinasi ($C$). Pada pengambilan tanpa pengembalian atau peluang bersyarat, jumlah ruang sampel otomatis berkurang pada pengambilan kedua.",
    keyFormulasLatex: [
      "P(A) = \\dfrac{n(A)}{n(S)}, \\quad P(A^c) = 1 - P(A)",
      "C(n, r) = \\dfrac{n!}{r!(n - r)!}, \\quad P(n, r) = \\dfrac{n!}{(n - r)!}",
      "P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)}",
    ],
    shortcutWithBoundary: {
      methodLabel: "Gunakan Komplemen untuk Syarat 'Paling Sedikit Satu'",
      shortcutMarkdown:
        "Jika soal menanyakan peluang 'paling sedikit 1 merah' atau 'minimal 1 lolos', jauh lebih cepat menghitung $1 - P(\\text{semua bukan merah})$ daripada menjumlahkan banyak kasus satu per satu.",
      validityConditions:
        "Pada kejadian berurutan tanpa pengembalian, kurangi pembilang (jika terambil sama) dan selalu kurangi penyebut sebesar 1 di langkah kedua.",
    },
    utbkTraps: [
      "Tidak mengurangi penyebut $n(S)$ pada pengambilan kedua ketika soal menyebut 'tanpa pengembalian' atau 'sekaligus'.",
      "Menggunakan Permutasi padahal anggota komite tidak memiliki jabatan berbeda (urutan tidak penting).",
      "Lupa syarat pembatasan digit (misal angka pertama kode tidak boleh 0 atau angka tidak boleh berulang).",
    ],
    keywords: [
      "peluang",
      "probabilitas",
      "kombinasi",
      "permutasi",
      "tanpa pengembalian",
      "kejadian",
      "dadu",
      "kartu",
      "kombinatorika",
      "bersyarat",
    ],
  },

  // === LBI (Literasi dalam Bahasa Indonesia) ===
  {
    id: "kb-lbi-idea-01",
    subtest: "LBI",
    skillNodeId: NODE_IDS.LBI_T0_IDEA,
    topicTitle: "Inti Bacaan, Gagasan Pokok & Kalimat Utama",
    priorityLevel: 10,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 LBI + Modul HOTS Literasi)",
    whyBeforeHow:
      "Gagasan pokok adalah payung besar yang memayungi seluruh isi paragraf atau teks, bukan satu rincian contoh atau angka spesifik di tengah paragraf. Cara cepat mengeceknya: jika satu kalimat dihilangkan dan kalimat lain kehilangan arah pembahasannya, itulah kalimat utama.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Uji Payung Cakupan (Tidak Terlalu Sempit, Tidak Terlalu Luas)",
      shortcutMarkdown:
        "Baca kalimat pertama dan terakhir setiap paragraf, lalu pastikan opsi gagasan pokok mencakup kata kunci utama dari awal hingga paragraf penutup.",
      validityConditions:
        "Hati-hati pada teks eksplanatif atau berita yang menaruh kesimpulan inti di kalimat terakhir paragraf.",
    },
    utbkTraps: [
      "Memilih opsi yang sebenarnya hanya kalimat penjelas atau contoh khusus dari satu paragraf.",
      "Memilih judul/gagasan yang cakupannya melampaui batas wilayah, waktu, atau objek dalam bacaan.",
      "Terjebak istilah teknis mencolok padahal hanya muncul sekali sebagai ilustrasi.",
    ],
    keywords: [
      "gagasan pokok",
      "ide pokok",
      "inti bacaan",
      "kalimat utama",
      "topik",
      "judul",
      "ringkasan",
      "tema",
    ],
  },
  {
    id: "kb-lbi-claim-01",
    subtest: "LBI",
    skillNodeId: NODE_IDS.LBI_T1_CLAIM,
    topicTitle: "Kesesuaian Pernyataan, Fakta vs Opini & Evaluasi Teks",
    priorityLevel: 10,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 LBI + Modul HOTS Literasi)",
    whyBeforeHow:
      "Dalam teks ilmiah dan opini UTBK, pembuat soal sering menukar tingkat kepastian kata (mengubah 'berpotensi' menjadi 'pasti', 'sebagian besar' menjadi 'seluruh'). Fakta harus dapat diverifikasi datanya di dunia nyata, sedangkan opini memuat penilaian subjektif, saran ('sebaiknya'), atau kata sifat evaluatif.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Pemindai Kata Mutlak & Pembeda Fakta-Opini",
      shortcutMarkdown:
        "Garis bawahi kata pembatas kuantor (*semua, selalu, pasti, hanya, satu-satunya*) di opsi. Jika teks menulis 'sebagian' atau 'cenderung', coret opsi berkekuatan mutlak itu seketika.",
      validityConditions:
        "Tetap verifikasi kalimat rujukan kata demi kata; ada kalanya teks memang menyatakan syarat mutlak dengan 'hanya'.",
    },
    utbkTraps: [
      "Opsi meminjam kata-kata persis dari teks, tetapi diam-diam menyisipkan kata 'tidak' atau membalik sebab dan akibat.",
      "Menganggap pernyataan tokoh di dalam teks sastra/opini sebagai fakta objektif seluruh bacaan.",
      "Tidak membedakan korelasi ('terjadi bersamaan') dengan kausalitas ('secara langsung menyebabkan').",
    ],
    keywords: [
      "pernyataan benar",
      "pernyataan salah",
      "sesuai teks",
      "fakta",
      "opini",
      "overgeneralisasi",
      "sebab akibat",
      "kelemahan teks",
    ],
  },
  {
    id: "kb-lbi-inf-01",
    subtest: "LBI",
    skillNodeId: NODE_IDS.LBI_T2_INF,
    topicTitle: "Inferensi Teks, Implikasi Sebab-Akibat & Makna Kontekstual",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Inferensi & Sastra LBI)",
    whyBeforeHow:
      "Inferensi bukanlah menebak bebas, melainkan menarik kesimpulan yang paling dekat dan logis dari gabungan dua petunjuk yang sudah tertulis di teks. Pada teks sastra atau biografi, sikap/nilai tokoh tercermin dari tindakan dan pilihan katanya saat merespons konflik.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Aturan Satu Langkah dari Bukti Tertulis",
      shortcutMarkdown:
        "Cocokkan setiap opsi inferensi dengan pertanyaan: 'Apakah ada minimal dua petunjuk teks yang langsung mengarah ke sini tanpa asumsi luar?' Pilih opsi yang paling terikat pada bukti bacaan.",
      validityConditions:
        "Jangan samakan informasi tersurat (tertulis mentah) dengan inferensi bila soal menanyakan kesimpulan tersirat.",
    },
    utbkTraps: [
      "Memilih asumsi tambahan yang mungkin benar di kehidupan nyata tetapi tidak berdasar di bacaan.",
      "Salah menangkap sikap penulis (netral/kritis/skeptis) karena mengira penulis setuju dengan pihak yang hanya dikutipnya.",
      "Mengartikan kata kontekstual secara kamus baku semata tanpa melihat kalimat pengapitnya.",
    ],
    keywords: [
      "inferensi",
      "simpulan",
      "tersirat",
      "sikap penulis",
      "makna kontekstual",
      "nilai",
      "amanat",
      "sastra",
      "implikasi",
    ],
  },

  // === LBE (Literasi dalam Bahasa Inggris) ===
  {
    id: "kb-lbe-ref-01",
    subtest: "LBE",
    skillNodeId: NODE_IDS.LBE_T0_REF,
    topicTitle: "Vocabulary in Context, Synonym, Pronoun Reference & Cloze",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (LBE Reference & Context)",
    whyBeforeHow:
      "Satu kata bahasa Inggris sering memiliki banyak arti. Konteks kalimat sebelum dan sesudahnyalah yang menentukan makna tepatnya. Untuk pronoun reference (it, they, these, such, which), pastikan jumlah gramatikal (tunggal vs jamak) dan peran logisnya cocok dengan frasa benda tepat sebelum kata rujukan.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Substitusi Langsung & Pencocokan Tunggal/Jamak",
      shortcutMarkdown:
        "Untuk soal sinonim atau rumpang (cloze), masukkan kandidat opsi ke kalimat dan baca ulang alur logika (kontras vs searah). Untuk pronoun 'they/these/those', langsung coret semua kandidat benda tunggal.",
      validityConditions:
        "Pada struktur 'X of Y, which...', periksa makna kata kerja setelah 'which' untuk memastikan ia merujuk ke X atau Y.",
    },
    utbkTraps: [
      "Memilih arti kata yang paling umum kita hafal padahal kalimat memakainya dalam makna akademik khusus (misal 'address' = menangani, bukan alamat).",
      "Memilih kata benda yang muncul paling dekat padahal jumlahnya tidak cocok (tunggal vs jamak).",
      "Mengabaikan konjungsi kontras ('however', 'whereas', 'despite') saat mengisi bagian rumpang.",
    ],
    keywords: [
      "synonym",
      "meaning",
      "closest in meaning",
      "refers to",
      "pronoun",
      "vocabulary",
      "cloze",
      "word",
      "phrase",
    ],
  },
  {
    id: "kb-lbe-purp-01",
    subtest: "LBE",
    skillNodeId: NODE_IDS.LBE_T1_PURP,
    topicTitle: "Main Idea, Author Purpose, Tone/Attitude & Organization",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (LBE Rhetorical Skills)",
    whyBeforeHow:
      "Soal Purpose dan Tone bertanya mengapa penulis menulis paragraf ini dengan cara tersebut, bukan sekadar apa isinya. Kata kerja awal pada opsi Purpose sangat menentukan: 'to warn', 'to compare', 'to refute' (membantah), atau 'to advocate' (menganjurkan). Sikap penulis (Tone) dapat dibaca dari kata sifat evaluatif yang dipakainya.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Pindai Kata Kerja Tujuan & Kata Sifat Emosional",
      shortcutMarkdown:
        "Cek kata transisi antarparagraf (*yet, however, surprisingly, in contrast*). Jika penulis banyak memakai angka riset tanpa memihak, tone-nya *objective/informative*, bukan *persuasive/sarcastic*.",
      validityConditions:
        "Bedakan pertanyaan 'purpose of the passage' (keseluruhan teks) dari 'purpose of paragraph 2' (khusus fungsi paragraf 2).",
    },
    utbkTraps: [
      "Memilih kata kerja tujuan yang terlalu ekstrem (misal 'to condemn/criticize harshly') padahal penulis hanya bersikap hati-hati atau 'concerned/cautious'.",
      "Menganggap tujuan seluruh teks sama dengan contoh kecil di paragraf pembuka.",
      "Salah membedakan 'neutral/informative' dengan 'supportive/advocating'.",
    ],
    keywords: [
      "purpose",
      "main idea",
      "tone",
      "attitude",
      "organization",
      "paragraph",
      "author",
      "writer",
      "primarily",
    ],
  },
  {
    id: "kb-lbe-eval-01",
    subtest: "LBE",
    skillNodeId: NODE_IDS.LBE_T3_EVAL,
    topicTitle: "Two-Text Synthesis, Inference & Paraphrase/Restatement",
    priorityLevel: 10,
    priorityBadge: "Penguat Skor 800",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 LBE Multi-Text)",
    whyBeforeHow:
      "Soal UTBK LBE modern sering membandingkan dua penulis atau forum diskusi (Text 1 vs Text 2 / Thread). Kuncinya bukan membaca ulang semuanya berkali-kali, melainkan memetakan satu tabel mental: topik yang sama, apakah Text 2 setuju, membantah, atau menambahkan sudut pandang praktis atas Text 1?",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Peta Hubungan Dua Teks + Uji Restatement Tanpa Distorsi",
      shortcutMarkdown:
        "Ringkas klaim utama Text 1 (A) dan Text 2 (B) masing-masing dalam 1 frasa sebelum cek opsi. Untuk restatement, pastikan makna pengandaian, negasi, atau syarat waktu tidak berubah meski kosakatanya diparafrasa.",
      validityConditions:
        "Pada soal 'both texts agree/mention', informasi tersebut wajib ada di KEDUA teks sekaligus.",
    },
    utbkTraps: [
      "Memilih pernyataan yang benar menurut Text 1 saja pada pertanyaan perbandingan kedua teks.",
      "Tertipu restatement yang menukar klausa sebab dan akibat atau menghilangkan kata pembatas ('only if', 'unless').",
      "Menggeneralisasi satu komentar forum yang spesifik menjadi kesimpulan seluruh penulis.",
    ],
    keywords: [
      "text 1",
      "text 2",
      "both texts",
      "compare",
      "relationship",
      "inference",
      "inferred",
      "restatement",
      "paraphrase",
      "assume",
    ],
  },

  // === PBM (Pemahaman Bacaan dan Menulis) ===
  {
    id: "kb-pbm-eja-01",
    subtest: "PBM",
    skillNodeId: NODE_IDS.PBM_T0_EJA,
    topicTitle: "EYD V: Penulisan Kata Baku, Imbuhan, Huruf Kapital & Tanda Baca",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (EYD V PBM)",
    whyBeforeHow:
      "Aturan EYD V bekerja secara konsisten dan logis. 'di-' ditulis serangkai bila membentuk kata kerja pasif (bisa diubah menjadi 'me-': ditulis -> menulis), sedangkan 'di' ditulis terpisah bila menunjukkan tempat atau arah (di rumah). Koma wajib memisahkan anak kalimat di awal kalimat, konjungsi antarkalimat (oleh karena itu, namun), serta perincian minimal 3 unsur sebelum kata 'dan'.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Checklist 4 Kesalahan Ejaan Tersering UTBK",
      shortcutMarkdown:
        "1) Uji 'di-' dengan diubah ke 'me-'; 2) Huruf kapital hanya untuk nama geografi yang diikuti nama tempat (*Sungai Musi*, bukan *di sungai*); 3) Konjungsi antarkalimat (*Namun, Oleh karena itu, Jadi*) wajib diikuti koma; 4) Hafalkan kata baku jebakan (*apotek, analisis, sistem, risiko, teknik, kualitas, antre, jadwal, praktik, ijazah*).",
      validityConditions:
        "Konjungsi intrakalimat seperti *sehingga, karena, sedangkan* tidak diikuti koma di belakangnya; khusus *sedangkan, melainkan* memakai koma di DEPANnya.",
    },
    utbkTraps: [
      "Menulis huruf kapital pada nama jabatan atau istilah geografi tanpa nama diri ('gubernur meresmikan jalan').",
      "Memakai tanda koma sebelum kata 'bahwa' atau 'karena' di tengah kalimat majemuk bertingkat.",
      "Terkecoh kata tidak baku populer seperti *analisa, resiko, tehnik, kwitansi, sekedar, merubah* (seharusnya *mengubah*).",
    ],
    keywords: [
      "ejaan",
      "eyd",
      "puebi",
      "tanda baca",
      "koma",
      "kapital",
      "miring",
      "kata baku",
      "tidak baku",
      "imbuhan",
      "penulisan kata",
    ],
  },
  {
    id: "kb-pbm-eff-01",
    subtest: "PBM",
    skillNodeId: NODE_IDS.PBM_T1_EFF,
    topicTitle: "Kalimat Efektif, Subjek-Predikat, Konjungsi & Kepaduan Paragraf",
    priorityLevel: 10,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 Kalimat Efektif PBM)",
    whyBeforeHow:
      "Kalimat efektif bahasa Indonesia wajib minimal memiliki Subjek (S) yang jelas dan Predikat (P) yang aktif/pasif tanpa kata depan di depan subjek. Jika kalimat diawali preposisi seperti 'Bagi seluruh siswa...', 'Dalam rapat itu...', atau 'Untuk meningkatkan kualitas...', bagian awal itu hanyalah Keterangan, bukan Subjek.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Detektor Subjek Hilang & Kata Mubazir (Pleonasme)",
      shortcutMarkdown:
        "Hapus semua preposisi di awal subjek (*bagi, untuk, dalam, kepada, menurut*), buang kata kerja ganda tidak sejajar, dan coret frasa bermakna sama (*sangat ... sekali, para siswa-siswa, agar supaya, adalah merupakan, sejak dari*).",
      validityConditions:
        "Kalimat inversi berpola P-S tetap sahih selama predikat dan subjeknya jelas dan tidak didahului kata depan pada subjeknya.",
    },
    utbkTraps: [
      "Menganggap kalimat panjang penuh istilah keren sebagai efektif padahal tidak punya Predikat (hanya perluasan 'yang...').",
      "Memakai konjungsi ganda yang mubazir dalam satu kalimat ('Meskipun hujan deras, namun ia tetap berangkat').",
      "Kalimat sumbang di tengah paragraf yang subjek pembahasannya melenceng dari kalimat sebelum dan sesudahnya.",
    ],
    keywords: [
      "kalimat efektif",
      "tidak efektif",
      "subjek",
      "predikat",
      "inti kalimat",
      "konjungsi",
      "penyuntingan",
      "kepaduan",
      "sumbang",
      "perbaikan kalimat",
    ],
  },

  // === PPU (Pengetahuan dan Pemahaman Umum) ===
  {
    id: "kb-ppu-sem-01",
    subtest: "PPU",
    skillNodeId: NODE_IDS.PPU_T1_SEM,
    topicTitle: "Semantik, Imbuhan, Reduplikasi (Kata Ulang) & Pergeseran Makna",
    priorityLevel: 9,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Semantik & Morfologi PPU)",
    whyBeforeHow:
      "Makna kata dan imbuhan di PPU diuji lewat fungsinya di dalam kalimat, bukan sekadar definisi lepas. Pada kata ulang (reduplikasi), bedakan kata ulang sejati (dapat dikembalikan ke kata dasar seperti *rumah-rumah*) dari kata ulang semu (*kupu-kupu*, *laba-laba* yang tidak bermakna tanpa pengulangan), serta kenali apakah pengulangan bermakna jamak, saling (resiprokal: *salam-salaman*), atau intensitas (*berkeping-keping*).",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Uji Subtitusi Kontekstual & Jenis Pergeseran Makna",
      shortcutMarkdown:
        "Untuk mencari padanan/makna kata: substitusi langsung ke kalimat dan uji kelas katanya (kata benda diganti kata benda, kata kerja diganti kata kerja). Kenali pergeseran makna: *ameliorasi* (makin halus), *peyorasi* (makin kasar), *generalisasi* (meluas), *spesialisasi* (menyempit), *sinestesia* (pertukaran indra).",
      validityConditions:
        "Imbuhan yang sama bisa bermakna beda pada kata dasar berbeda (misal 'ke-an' bermakna tempat vs terlalu/mengalami).",
    },
    utbkTraps: [
      "Mengira 'kura-kura' atau 'cumicumi' sebagai kata ulang utuh bermakna jamak padahal itu kata ulang semu.",
      "Memilih sinonim yang benar secara arti umum tetapi beda kelas kata sehingga merusak struktur kalimat.",
      "Terkecoh makna konotatif atau ungkapan idiomatik dengan mengartikannya secara harfiah.",
    ],
    keywords: [
      "makna kata",
      "imbuhan",
      "reduplikasi",
      "kata ulang",
      "semu",
      "sinonim",
      "antonim",
      "semantik",
      "pergeseran makna",
      "konotasi",
    ],
  },
  {
    id: "kb-ppu-assoc-01",
    subtest: "PPU",
    skillNodeId: NODE_IDS.PPU_T2_ASSOC,
    topicTitle: "Makna Asosiatif, Pola Frasa (D-M), Analogi Kata & Bahasa Panda",
    priorityLevel: 10,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 Asosiasi & Bahasa Panda PPU)",
    whyBeforeHow:
      "Pola frasa bahasa Indonesia mengikuti hukum D-M (Diterangkan-Menerangkan): kata pertama adalah inti, kata kedua menerangkan sifat/peran atau pasangannya. Dalam soal Bahasa Panda (bahasa sandi), jangan menebak arti kata satu per satu secara acak; cari kata yang muncul di DUA kalimat contoh berbeda dan lihat posisi urutan S-P-O-nya.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Algoritma Irisan Kata untuk Bahasa Panda & Pola Frasa",
      shortcutMarkdown:
        "Bahasa Panda: (1) Cari kata Indonesia yang muncul di kalimat 1 dan 2, lalu cari kata sandi yang muncul di kedua kalimat sandi untuk mengunci padanan pasti; (2) Amati apakah posisi kata dibalik (misal D-M menjadi M-D atau SPO menjadi OSP). Pola frasa: samakan jenis hubungan kelas katanya (misal Nomina + Adjektiva sejajar dengan Nomina + Adjektiva).",
      validityConditions:
        "Jika ada imbuhan pada kata sandi (misal awalan penanda lampau/jamak atau pasif/aktif), pisahkan akar kata sandinya terlebih dahulu.",
    },
    utbkTraps: [
      "Menerjemahkan Bahasa Panda hanya dengan urutan kiri-ke-kanan tanpa mengecek pembalikan susunan SPO atau pola frasa.",
      "Pada soal analogi kata ('X dan Y sama hubungannya dengan A dan B'), membalik urutan pelaku dengan objek.",
      "Menganggap frasa berimbuhan atau berpreposisi memiliki pola sama dengan frasa dasar dua kata.",
    ],
    keywords: [
      "asosiatif",
      "frasa",
      "pola kalimat",
      "inti kalimat",
      "hubungan kata",
      "analogi",
      "bahasa panda",
      "sandi",
      "hubungan antarparagraf",
      "rujukan",
    ],
  },
  // === TOP-UP FOCUSED CURRICULUM ENTRIES (EKSPO/LOG, BARISAN, PEMODELAN PU, GEOMETRI, MAKNA KONTEKSTUAL LBI, PANDA PPU) ===
  {
    id: "kb-pk-exp-02",
    subtest: "PK",
    skillNodeId: NODE_IDS.PK_T0_FRAC,
    topicTitle: "Sifat Eksponen, Bentuk Akar & Rasionalisasi Penyebut",
    priorityLevel: 8,
    priorityBadge: "Sering Muncul",
    sourceLabel: "Kurikulum Prioritas SNBT (Pangkat & Akar PK)",
    whyBeforeHow:
      "Pangkat menyatakan perkalian berulang dengan basis yang sama. Jadi ketika dua bilangan berpangkat ber-basis SAMA dikalikan, banyaknya perkalian cukup dijumlahkan; ketika dibagi, pangkatnya dikurangkan. Untuk pecahan berpenyebut kompleks, faktorkan seluruh basis ke bilangan prima terkecil ($2, 3, 5, 7$) agar pangkatnya bisa saling mencoret.",
    keyFormulasLatex: [
      "a^m \\cdot a^n = a^{m+n}, \\quad \\dfrac{a^m}{a^n} = a^{m-n}, \\quad (a^m)^n = a^{mn}",
      "a^{-n} = \\dfrac{1}{a^n}, \\quad a^{p/q} = \\sqrt[q]{a^p}",
    ],
    shortcutWithBoundary: {
      methodLabel: "Urai ke Faktor Prima Sebelum Menghitung",
      shortcutMarkdown:
        "Ubah basis besar menjadi faktor prima dulu (misal $12^3 = (2^2 \\cdot 3)^3 = 2^6 \\cdot 3^3$ dan $18^2 = (2 \\cdot 3^2)^2 = 2^2 \\cdot 3^4$) sebelum menyederhanakan pembilang dan penyebut.",
      validityConditions:
        "Sifat $a^m \\cdot a^n = a^{m+n}$ hanya berlaku jika basis $a$ sama persis; jangan pernah menjumlahkan pangkat dari basis berbeda ($2^3 \\cdot 3^2 \\neq 6^5$).",
    },
    utbkTraps: [
      "Menjumlahkan pangkat pada operasi penjumlahan suku ($2^3 + 2^3$ bukan $2^6$, melainkan $2 \\cdot 2^3 = 2^4$).",
      "Lupa memangkatkan koefisien di dalam kurung saat memangkatkan perkalian ($(2 \\cdot 3^2)^2 = 2^2 \\cdot 3^4$, bukan $2 \\cdot 3^4$).",
      "Mengira $a^0 = 0$, padahal untuk setiap $a \\neq 0$ nilainya selalu $1$.",
    ],
    keywords: [
      "eksponen",
      "pangkat",
      "akar",
      "logaritma",
      "faktor prima",
      "basis",
      "rasionalisasi",
    ],
  },
  {
    id: "kb-pk-seq-02",
    subtest: "PK",
    skillNodeId: NODE_IDS.PK_T1_LIN,
    topicTitle: "Barisan Aritmetika, Geometri & Deret Tak Hingga",
    priorityLevel: 8,
    priorityBadge: "Sering Muncul",
    sourceLabel: "Kurikulum Prioritas SNBT (Barisan & Deret PK)",
    whyBeforeHow:
      "Barisan aritmetika naik atau turun dengan langkah PENJUMLAHAN konstan ($+b$), persis seperti tangga linear. Sebaliknya, barisan geometri berubah dengan faktor PENGALI konstan ($\\times r$). Deret geometri tak hingga hanya konvergen (jumlahnya tidak meledak tak terbatas) ketika pengalinya menyusutkan suku ($|r| < 1$).",
    keyFormulasLatex: [
      "U_n = a + (n-1)b, \\quad S_n = \\dfrac{n}{2}(2a + (n-1)b)",
      "U_n = a r^{n-1}, \\quad S_\\infty = \\dfrac{a}{1 - r} \\; (|r| < 1)",
    ],
    shortcutWithBoundary: {
      methodLabel: "Sifat Suku Tengah & Rasio Indeks",
      shortcutMarkdown:
        "Tiga suku berurutan aritmetika $(x, y, z)$ memenuhi $2y = x + z$. Jumlah 5 suku berurutan sama dengan $5 \\times U_{\\text{tengah}}$. Pada geometri, $r^{p-q} = \\dfrac{U_p}{U_q}$.",
      validityConditions:
        "Rumus deret tak hingga $S_\\infty = \\dfrac{a}{1-r}$ hanya sah jika $-1 < r < 1$.",
    },
    utbkTraps: [
      "Lupa $(n - 1)$ dan malah menghitung $a + nb$ untuk suku ke-$n$.",
      "Tertukar $U_n$ (nilai suku ke-$n$) dengan $S_n$ (jumlah seluruh $n$ suku pertama).",
      "Memakai rumus $S_\\infty$ saat rasio $|r| \\ge 1$.",
    ],
    keywords: [
      "aritmetika",
      "geometri",
      "suku ke-n",
      "beda",
      "rasio",
      "deret tak hingga",
      "suku tengah",
    ],
  },
  {
    id: "kb-pu-model-02",
    subtest: "PU",
    skillNodeId: NODE_IDS.PU_T3_PAT,
    topicTitle: "Pemodelan Matematika & Analisis Data Grafik/Tabel PU",
    priorityLevel: 8,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Penalaran Kuantitatif PU)",
    whyBeforeHow:
      "Soal data PU menguji apakah kamu bisa mengekstrak tren dari narasi atau tabel lalu memproyeksikan dengan cepat tanpa terpancing angka absolut semu. Persentase perubahan selalu diukur terhadap nilai AWAL periode acuan, bukan nilai akhir.",
    keyFormulasLatex: [
      "\\text{Rata-rata baru} = \\text{Rata-rata lama} + \\dfrac{\\text{Selisih total}}{n}",
      "r\\% = \\dfrac{X_{\\text{baru}} - X_{\\text{lama}}}{X_{\\text{lama}}} \\times 100\\%",
    ],
    shortcutWithBoundary: {
      methodLabel: "Cek Proporsi Maksimum/Minimum Tanpa Pembagian Panjang",
      shortcutMarkdown:
        "Untuk mencari rasio $\\dfrac{A}{B}$ terbesar dari beberapa kategori tabel, cukup aproksimasi kasar terlebih dulu (misal $> 50\\%$ vs $< 40\\%$) sebelum menghitung digit desimal.",
      validityConditions:
        "Selalu periksa satuan kepala tabel (ribuan, jutaan, persen) agar tidak selisih faktor $10^k$.",
    },
    utbkTraps: [
      "Membaca grafik persentase pertumbuhan yang masih positif namun menurun (misal dari $+8\\%$ ke $+3\\%$) seolah-olah jumlahnya ikut turun, padahal jumlah total tetap naik lebih lambat.",
      "Salah membandingkan rata-rata gabungan dua kategori berjumlah data berbeda.",
    ],
    keywords: [
      "grafik",
      "tabel",
      "persentase",
      "rata-rata",
      "tren",
      "pemodelan",
      "rasio",
      "prediksi",
    ],
  },
  {
    id: "kb-pm-geom-02",
    subtest: "PM",
    skillNodeId: NODE_IDS.PM_T2_LIN,
    topicTitle: "Geometri Terapan, Trigonometri Dasar & Bangun Ruang Kontekstual",
    priorityLevel: 10,
    priorityBadge: "Wajib Prioritas",
    sourceLabel: "Kurikulum Prioritas SNBT (Lv.10 Geometri PM)",
    whyBeforeHow:
      "Di PM, bangun datar dan bangun ruang hadir dalam bungkus masalah nyata seperti bak penampungan air, atap tenda, atau sudut elevasi tangga/tiang. Hubungkan komponen tiga dimensi (volume, luas permukaan) dengan segitiga siku-siku (Pythagoras dan trigonometri sudut istimewa) untuk mencari tinggi atau jari-jari yang belum diketahui.",
    keyFormulasLatex: [
      "\\sin \\theta = \\dfrac{\\text{depan}}{\\text{miring}}, \\quad \\cos \\theta = \\dfrac{\\text{samping}}{\\text{miring}}, \\quad \\tan \\theta = \\dfrac{\\text{depan}}{\\text{samping}}",
      "L_{\\Delta} = \\dfrac{1}{2}ab\\sin C, \\quad V_{\\text{prisma}} = L_{\\text{alas}} \\cdot t",
    ],
    shortcutWithBoundary: {
      methodLabel: "Tripel Pythagoras Wajib & Sudut Istimewa",
      shortcutMarkdown:
        "Hafalkan keluarga tripel $(3,4,5)$, $(5,12,13)$, $(8,15,17)$, $(7,24,25)$ beserta kelipatannya, serta $\\sin 30^\\circ = \\dfrac{1}{2}, \\sin 45^\\circ = \\dfrac{\\sqrt{2}}{2}, \\sin 60^\\circ = \\dfrac{\\sqrt{3}}{2}$.",
      validityConditions:
        "Trigonometri $\\sin/\\cos/\\tan$ dasar hanya berlaku pada segitiga siku-siku; untuk segitiga sembarang pakai aturan sinus atau kosinus.",
    },
    utbkTraps: [
      "Menghitung luas permukaan bak terbuka atau tabung tanpa tutup memakai rumus tabung tertutup penuh ($2\\pi r^2 + 2\\pi rt$).",
      "Lupa mengonversi liter/cm ke meter sebelum menghitung kapasitas total.",
    ],
    keywords: [
      "segitiga",
      "pythagoras",
      "trigonometri",
      "sudut",
      "sin",
      "cos",
      "tan",
      "lingkaran",
      "luas",
      "volume",
      "kerucut",
      "bola",
    ],
  },
  {
    id: "kb-lbi-eval-02",
    subtest: "LBI",
    skillNodeId: NODE_IDS.LBI_T2_INF,
    topicTitle: "Teks Sastra, Tema Nilai & Evaluasi Kelebihan/Kekurangan Bacaan",
    priorityLevel: 8,
    priorityBadge: "Sering Muncul",
    sourceLabel: "Modul HOTS Literasi Bahasa Indonesia",
    whyBeforeHow:
      "Pada kutipan sastra (cerpen/novel/hikayat), nilai moral dan sikap tokoh terbaca dari konflik dan pilihannya menghadapi masalah, bukan dari satu kata sifat terpisah. Sementara itu, kelebihan/kekurangan bacaan dinilai dari kelengkapan data bukti, kejelasan hubungan kausalitas, dan netralitas sumber.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Identifikasi Konflik Inti + Sumber Bukti Teks",
      shortcutMarkdown:
        "Untuk teks sastra, cari kalimat titik balik konflik antar tokoh. Untuk teks eksplanatif/ilmiah, cek apakah klaim didukung hasil riset konkret atau hanya opini umum penulis.",
      validityConditions:
        "Nilai atau pesan moral wajib berakar pada kejadian nyata tokoh di kutipan, bukan stereotip dari luar cerita.",
    },
    utbkTraps: [
      "Menilai teks 'tidak logis' hanya karena tidak setuju secara pribadi, padahal argumen di teks sudah disertai data.",
      "Tertukar antara watak tokoh protagonis dengan ucapan tokoh antagonis di dalam dialog.",
    ],
    keywords: [
      "sastra",
      "amanat",
      "nilai moral",
      "konflik",
      "watak",
      "tokoh",
      "kelebihan",
      "kekurangan",
      "eksplanatif",
    ],
  },
  {
    id: "kb-lbe-sum-02",
    subtest: "LBE",
    skillNodeId: NODE_IDS.LBE_T3_EVAL,
    topicTitle: "Preceding/Following Paragraph, Summary & Text Organization",
    priorityLevel: 7,
    priorityBadge: "Sering Muncul",
    sourceLabel: "Kurikulum Prioritas SNBT (LBE Structural Flow)",
    whyBeforeHow:
      "Pertanyaan Preceding Paragraph menanyakan ide yang secara logis mengantarkan kalimat PERTAMA paragraf 1. Sebaliknya, Following Paragraph menanyakan kelanjutan logis dari kalimat TERAKHIR teks. Keduanya diikat oleh jembatan transisi topik dari ujung teks ke paragraf tetangganya.",
    keyFormulasLatex: [],
    shortcutWithBoundary: {
      methodLabel: "Teknik Jembatan Ujung-ke-Ujung",
      shortcutMarkdown:
        "Preceding = baca 2 kalimat pertama teks -> cari ide pengantar sebelumnya. Following = baca 2 kalimat terakhir teks -> cari lanjutan topik spesifik tersebut (jangan mengulang hal yang sudah dibahas di tengah teks!).",
      validityConditions:
        "Jika kalimat pertama memakai kata ganti rujukan (*such problems, this phenomenon*), paragraf sebelumnya pasti memperkenalkan fenomena tersebut.",
    },
    utbkTraps: [
      "Memilih topik untuk Following Paragraph padahal ide tersebut sudah dibahas lengkap di paragraf 1 atau 2.",
      "Memilih Summary yang terlalu fokus ke satu detail angka di paragraf penjelas.",
    ],
    keywords: [
      "preceding",
      "following",
      "summary",
      "organization",
      "next paragraph",
      "before",
      "conclude",
    ],
  },
];

export function getPrimaryKnowledgeForNode(skillNodeId: string): SnbtKnowledgeEntry | null {
  return SNBT_KNOWLEDGE_BASE.find((entry) => entry.skillNodeId === skillNodeId) ?? null;
}

export function searchSnbtKnowledgeBase(params: {
  queryText: string;
  subtest?: SnbtSubtest | null;
  skillNodeId?: string | null;
  limit?: number;
}): SnbtKnowledgeEntry[] {
  const tokens = params.queryText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  const scored = SNBT_KNOWLEDGE_BASE.map((entry) => {
    let score = 0;

    if (params.skillNodeId && entry.skillNodeId === params.skillNodeId) {
      score += 120;
    }
    if (params.subtest && entry.subtest === params.subtest) {
      score += 45;
    }

    const haystack = [
      entry.topicTitle,
      entry.whyBeforeHow,
      entry.shortcutWithBoundary?.methodLabel ?? "",
      entry.shortcutWithBoundary?.shortcutMarkdown ?? "",
      entry.utbkTraps.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (params.queryText.toLowerCase().includes(kwLower)) {
        score += 24;
      }
      for (const tok of tokens) {
        if (kwLower.includes(tok)) {
          score += 10;
        }
      }
    }

    for (const tok of tokens) {
      if (haystack.includes(tok)) {
        score += 4;
      }
    }

    score += entry.priorityLevel * 0.5;
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const limit = params.limit ?? 3;
  return scored
    .filter((s) => s.score > 10 || !params.queryText.trim())
    .slice(0, limit)
    .map((s) => s.entry);
}

export function formatKnowledgeBasePromptBlock(entries: SnbtKnowledgeEntry[]): string {
  if (entries.length === 0) return "Tidak ada entri kurikulum spesifik.";
  return entries
    .map((e) => {
      const formulas =
        e.keyFormulasLatex.length > 0 ? `Rumus: ${e.keyFormulasLatex.join(" | ")}` : "Fokus aturan penalaran/kebahasaan.";
      const shortcut = e.shortcutWithBoundary
        ? `Strategi Cepat (${e.shortcutWithBoundary.methodLabel}): ${e.shortcutWithBoundary.shortcutMarkdown} [Syarat batas wajib: ${e.shortcutWithBoundary.validityConditions}]`
        : "";
      return `[${e.subtest} · Prioritas Lv.${e.priorityLevel}/10 · ${e.topicTitle}]\nInti Why Before How: ${e.whyBeforeHow}\n${formulas}\n${shortcut}\nJebakan UTBK: ${e.utbkTraps.join(" ; ")}`;
    })
    .join("\n\n");
}
