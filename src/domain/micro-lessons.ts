import { NODE_IDS } from "./seed-data";

export interface MicroLessonWorkedStep {
  title: string;
  detail: string;
  formulaLatex?: string | null;
}

export interface MicroLessonWarmupOption {
  key: "A" | "B" | "C";
  text: string;
  feedback: string;
}

export interface MicroLessonContent {
  skillNodeId: string;
  estimatedMinutes: number;
  whyHeadline: string;
  whyStory: string;
  analogy: string;
  coreRuleLatex: string | null;
  coreRuleNote: string;
  workedExample: {
    prompt: string;
    steps: MicroLessonWorkedStep[];
    takeaway: string;
  };
  commonTrap: {
    trapTitle: string;
    wrongWay: string;
    rightWay: string;
  };
  warmupCheck: {
    question: string;
    options: MicroLessonWarmupOption[];
    correctKey: "A" | "B" | "C";
  };
}

export const MICRO_LESSONS_BY_NODE_ID: Record<string, MicroLessonContent> = {
  // === PK (6 NODES) ===
  [NODE_IDS.PK_T0_FRAC]: {
    skillNodeId: NODE_IDS.PK_T0_FRAC,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa penyebut pecahan wajib disamakan sebelum dijumlah?",
    whyStory:
      "Pecahan bukan sekadar dua angka bertumpuk. Penyebut (angka bawah) adalah **ukuran potongan**, sedangkan pembilang (angka atas) adalah **jumlah potongannya**. Kamu tidak bisa langsung menjumlahkan 1 potongan besar ($\\dfrac{1}{2}$) dengan 1 potongan kecil ($\\dfrac{1}{4}$) karena ukurannya berbeda.",
    analogy:
      "Bayangkan dua loyang pizza berukuran sama. Loyang A dipotong 4, loyang B dipotong 6. Supaya bisa dihitung adil, potong ulang keduanya jadi 12 potongan kecil (KPK dari 4 dan 6) agar ukuran tiap potong sama persis!",
    coreRuleLatex: "\\dfrac{a}{b} \\pm \\dfrac{c}{d} = \\dfrac{a \\cdot d \\pm c \\cdot b}{b \\cdot d}",
    coreRuleNote: "Lebih cepat lagi: gunakan KPK dari penyebut agar angkanya tetap kecil dan mudah dihitung.",
    workedExample: {
      prompt: "Hitung nilai dari $\\dfrac{2}{3} - \\dfrac{1}{4} + \\dfrac{1}{2}$ dengan teliti.",
      steps: [
        {
          title: "Cari KPK penyebut (3, 4, dan 2)",
          detail: "Bilangan terkecil yang habis dibagi 3, 4, dan 2 adalah $12$.",
          formulaLatex: "\\text{KPK}(3, 4, 2) = 12",
        },
        {
          title: "Ubah setiap pecahan ke penyebut 12",
          detail: "Kalikan atas dan bawah dengan pengali yang sama agar nilainya tidak berubah.",
          formulaLatex: "\\dfrac{2 \\times 4}{12} - \\dfrac{1 \\times 3}{12} + \\dfrac{1 \\times 6}{12} = \\dfrac{8}{12} - \\dfrac{3}{12} + \\dfrac{6}{12}",
        },
        {
          title: "Operasikan pembilang dari kiri ke kanan",
          detail: "Jaga tanda minus tetap menempel pada angka di belakangnya.",
          formulaLatex: "\\dfrac{8 - 3 + 6}{12} = \\dfrac{11}{12}",
        },
      ],
      takeaway: "Samakan ukuran potongan (KPK penyebut) dulu, baru jumlah/kurangkan angka atasnya.",
    },
    commonTrap: {
      trapTitle: "Menjumlahkan atas dengan atas & bawah dengan bawah",
      wrongWay: "$\\dfrac{1}{2} + \\dfrac{1}{3} = \\dfrac{2}{5}$ (Salah total! Nilai $\\dfrac{2}{5}$ malah lebih kecil dari $\\dfrac{1}{2}$).",
      rightWay: "Samakan penyebut ke 6: $\\dfrac{3}{6} + \\dfrac{2}{6} = \\dfrac{5}{6}$.",
    },
    warmupCheck: {
      question: "Berapa penyebut terkecil (KPK) yang paling rapi untuk menghitung $\\dfrac{3}{4} - \\dfrac{5}{6}$?",
      options: [
        { key: "A", text: "$10$", feedback: "Belum tepat. 10 tidak habis dibagi 4 maupun 6 (jangan dijumlahkan 4 + 6)." },
        { key: "B", text: "$12$", feedback: "Tepat sekali! 12 habis dibagi 4 (dapat 3) dan habis dibagi 6 (dapat 2)." },
        { key: "C", text: "$24$", feedback: "24 bisa dipakai, tetapi belum yang terkecil. 12 membuat hitungan jauh lebih ringan." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PK_T0_ALG]: {
    skillNodeId: NODE_IDS.PK_T0_ALG,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa 'pindah ruas' mengubah tanda + menjadi -?",
    whyStory:
      "Sebenarnya tidak ada sulap pindah ruas! Persamaan dengan tanda sama dengan ($=$) adalah **timbangan dua sisi yang selalu seimbang**. Supaya suatu angka hilang dari sisi kiri, kita melakukan operasi kebalikannya di **kedua sisi sekaligus**.",
    analogy:
      "Jika di sisi kiri timbangan ada kotak $x$ ditambah batu 5 kg, dan sisi kanan ada 12 kg, maka untuk tahu berat $x$ kamu cukup mengangkat batu 5 kg dari sisi kiri DAN mengurangi 5 kg dari sisi kanan.",
    coreRuleLatex: "x + 5 = 12 \\implies (x + 5) - 5 = 12 - 5 \\implies x = 7",
    coreRuleNote: "Ingat juga sifat distribusi: $a(b - c) = ab - ac$. Angka di luar kurung wajib dikalikan ke SEMUA suku di dalam kurung.",
    workedExample: {
      prompt: "Tentukan nilai $x$ dari persamaan $2(x - 3) = x + 4$.",
      steps: [
        {
          title: "Buka tanda kurung lebih dulu",
          detail: "Kalikan $2$ ke $x$ dan juga ke $-3$.",
          formulaLatex: "2x - 6 = x + 4",
        },
        {
          title: "Kumpulkan $x$ di kiri, angka biasa di kanan",
          detail: "Kurangkan $x$ di kedua ruas, lalu tambahkan $6$ di kedua ruas.",
          formulaLatex: "2x - x = 4 + 6",
        },
        {
          title: "Sederhanakan hasil akhir",
          detail: "Cek lagi apakah soal menanyakan $x$ atau bentuk lain seperti $x + 2$.",
          formulaLatex: "x = 10",
        },
      ],
      takeaway: "Buka kurung secara adil ke semua suku, lalu perlakukan kedua ruas sama persis seperti timbangan.",
    },
    commonTrap: {
      trapTitle: "Lupa mengalikan suku kedua di dalam kurung & lupa cek target soal",
      wrongWay: "Menulis $3(2x - 5) = 6x - 5$ (angka 3 lupa dikalikan ke $-5$), atau berhenti di $x$ padahal soal menanyakan $x + 2$.",
      rightWay: "Kalikan ke semua suku: $3(2x - 5) = 6x - 15$, lalu baca ulang kalimat terakhir soal.",
    },
    warmupCheck: {
      question: "Hasil penjabaran yang tepat dari $3(2x - 5)$ adalah...",
      options: [
        { key: "A", text: "$6x - 5$", feedback: "Hati-hati! Angka 3 di luar kurung juga harus dikalikan dengan $-5$." },
        { key: "B", text: "$6x - 15$", feedback: "Mantap! $3 \\times 2x = 6x$ dan $3 \\times (-5) = -15$." },
        { key: "C", text: "$5x - 15$", feedback: "Bukan dijumlahkan ($3 + 2$), melainkan dikalikan ($3 \\times 2 = 6$)." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PK_T1_LIN]: {
    skillNodeId: NODE_IDS.PK_T1_LIN,
    estimatedMinutes: 3,
    whyHeadline: "Apa arti sebenarnya dari gradien garis ($m$)?",
    whyStory:
      "Gradien ($m$) hanyalah **tingkat kemiringan tangga**: seberapa tinggi kamu naik (perubahan $y$) setiap kali melangkah 1 satuan ke kanan (perubahan $x$). Jika dua garis **sejajar**, kemiringannya sama ($m_1 = m_2$). Jika **tegak lurus**, arahnya berlawanan dan terbalik ($m_1 \\cdot m_2 = -1$).",
    analogy:
      "Tangga dengan gradien $2$ berarti tiap melangkah 1 meter ke depan, kamu naik 2 meter. Garis yang tegak lurus dengannya harus turun landai sejauh $-\\dfrac{1}{2}$.",
    coreRuleLatex: "y - y_1 = m(x - x_1) \\quad \\text{dan} \\quad m_{\\perp} = -\\dfrac{1}{m_1}",
    coreRuleNote: "Untuk bentuk $ax + by + c = 0$, gradien langsung didapat dari $m = -\\dfrac{a}{b}$.",
    workedExample: {
      prompt: "Cari gradien garis yang tegak lurus dengan $2x - 4y + 5 = 0$.",
      steps: [
        {
          title: "Cari gradien garis acuan ($m_1$)",
          detail: "Dengan $a = 2$ dan $b = -4$, pakai $m_1 = -\\dfrac{a}{b}$.",
          formulaLatex: "m_1 = -\\dfrac{2}{-4} = \\dfrac{1}{2}",
        },
        {
          title: "Balik pecahan & ubah tanda untuk tegak lurus",
          detail: "Karena $m_1 \\cdot m_2 = -1$, balik $\\dfrac{1}{2}$ jadi $2$ lalu beri tanda minus.",
          formulaLatex: "m_2 = -2",
        },
      ],
      takeaway: "Tegak lurus = balik pecahannya lalu lawan tandanya (positif jadi negatif, negatif jadi positif).",
    },
    commonTrap: {
      trapTitle: "Hanya membalik angka tanpa mengubah tanda minus",
      wrongWay: "Dari $m_1 = \\dfrac{1}{2}$ langsung mengambil $m_2 = 2$ (lupa tanda negatif).",
      rightWay: "Pastikan hasil kali keduanya tepat $-1$: $\\dfrac{1}{2} \\times (-2) = -1$.",
    },
    warmupCheck: {
      question: "Jika garis pertama punya gradien $m_1 = \\dfrac{1}{3}$, berapa gradien garis yang tegak lurus dengannya?",
      options: [
        { key: "A", text: "$3$", feedback: "Hampir! Kamu sudah membalik pecahannya, tinggal ubah tandanya menjadi negatif." },
        { key: "B", text: "$-3$", feedback: "Benar sekali! $\\dfrac{1}{3} \\times (-3) = -1$." },
        { key: "C", text: "$-\\dfrac{1}{3}$", feedback: "Kamu baru mengubah tanda, tapi belum membalik pecahannya." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PK_T2_RATE]: {
    skillNodeId: NODE_IDS.PK_T2_RATE,
    estimatedMinutes: 3,
    whyHeadline: "Kapan perbandingan dikali lurus vs dikali silang?",
    whyStory:
      "Jangan menghafal buta! Uji dulu dengan logika akal sehat: kalau jumlah pekerja **bertambah**, apakah waktu selesai proyek jadi makin **lama** atau makin **cepat**? Makin cepat! Artinya satu naik dan satu turun (**berbalik nilai**), sehingga total beban kerja ($\\text{pekerja} \\times \\text{hari}$) selalu tetap.",
    analogy:
      "Satu ruangan butuh 60 'jam-orang' untuk dicat. Mau dikerjakan 10 orang (6 hari) atau 20 orang (3 hari), hasil kalinya tetap 60!",
    coreRuleLatex: "P_1 \\times t_1 = P_2 \\times t_2",
    coreRuleNote: "Hati-hati: baca apakah soal menyebut 'menambah 4 pekerja' ($P_2 = P_1 + 4$) atau 'menjadi 4 pekerja' ($P_2 = 4$).",
    workedExample: {
      prompt: "12 pekerja menyelesaikan tugas dalam 20 hari. Jika ditambah 3 pekerja lagi, berapa hari tugas selesai?",
      steps: [
        {
          title: "Hitung total beban kerja konstan",
          detail: "Kalikan pekerja awal dengan hari awal.",
          formulaLatex: "W = 12 \\times 20 = 240 \\text{ orang-hari}",
        },
        {
          title: "Hitung total pekerja baru",
          detail: "Karena ditambah 3 orang, pekerja baru menjadi $12 + 3 = 15$ orang.",
          formulaLatex: "P_2 = 12 + 3 = 15",
        },
        {
          title: "Bagi total beban dengan pekerja baru",
          detail: "Waktu pasti lebih singkat dari 20 hari.",
          formulaLatex: "t_2 = \\dfrac{240}{15} = 16 \\text{ hari}",
        },
      ],
      takeaway: "Cek logika dulu: orang makin banyak → hari makin sedikit → samakan hasil kalinya.",
    },
    commonTrap: {
      trapTitle: "Mengurangi hari secara langsung atau memakai perbandingan senilai",
      wrongWay: "Langsung menghitung $20 - 3 = 17$ hari, atau memakai $\\dfrac{15}{12} \\times 20 = 25$ hari (aneh, pekerja tambah kok makin lama!).",
      rightWay: "Selalu uji masuk akal: pekerja bertambah berarti jawaban WAJIB lebih kecil dari hari awal.",
    },
    warmupCheck: {
      question: "Jika 10 orang menyelesaikan pekerjaan dalam 6 hari, maka 20 orang dengan kecepatan sama menyelesaikannya dalam...",
      options: [
        { key: "A", text: "12 hari", feedback: "Uji logika: orangnya jadi dua kali lebih banyak, masa waktunya malah makin lama?" },
        { key: "B", text: "3 hari", feedback: "Tepat! Beban tetap $10 \\times 6 = 60$, dibagi 20 orang = 3 hari." },
        { key: "C", text: "4 hari", feedback: "Cek lagi: $20 \\times 4 = 80$, padahal beban kerjanya hanya $10 \\times 6 = 60$." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PK_T2_QUAD]: {
    skillNodeId: NODE_IDS.PK_T2_QUAD,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa rumus Vieta jauh lebih cepat daripada mencari akar satu-satu?",
    whyStory:
      "Pada banyak soal UTBK, akar-akar $x_1$ dan $x_2$ sengaja dibuat jelek (mengandung akar irasional) supaya kamu kehabisan waktu jika memfaktorkan manual. Padahal koefisien $a, b, c$ sudah menyimpan langsung **jumlah** dan **hasil kali** akarnya!",
    analogy:
      "Kalau kamu cuma butuh tahu total berat dua koper ($x_1 + x_2$), kamu tidak perlu membongkar isi tiap koper satu-satu jika timbangan gabungan sudah tertulis di label.",
    coreRuleLatex: "x_1 + x_2 = -\\dfrac{b}{a}, \\quad x_1 \\cdot x_2 = \\dfrac{c}{a}, \\quad x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2",
    coreRuleNote: "Ingat tanda minus pada jumlah akar ($-\\dfrac{b}{a}$)!",
    workedExample: {
      prompt: "Untuk $x^2 - 5x + 6 = 0$, cari nilai $x_1^2 + x_2^2$ tanpa mencari akar dulu.",
      steps: [
        {
          title: "Ambil jumlah & hasil kali akar (Vieta)",
          detail: "Dengan $a = 1, b = -5, c = 6$:",
          formulaLatex: "x_1 + x_2 = -\\dfrac{-5}{1} = 5, \\quad x_1 x_2 = \\dfrac{6}{1} = 6",
        },
        {
          title: "Masukkan ke identitas kuadrat",
          detail: "Karena $(x_1 + x_2)^2 = x_1^2 + 2x_1x_2 + x_2^2$, kurangkan $2x_1x_2$.",
          formulaLatex: "x_1^2 + x_2^2 = 5^2 - 2(6) = 25 - 12 = 13",
        },
      ],
      takeaway: "Lihat ekspresi simetris ($x_1^2 + x_2^2$ atau $\\dfrac{1}{x_1} + \\dfrac{1}{x_2}$) → langsung pakai Vieta!",
    },
    commonTrap: {
      trapTitle: "Mengira $(x_1 + x_2)^2 = x_1^2 + x_2^2$",
      wrongWay: "Langsung menjawab $5^2 = 25$ (lupa mengurangi $2x_1x_2$).",
      rightWay: "Selalu kurangi suku tengahnya: $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2$.",
    },
    warmupCheck: {
      question: "Pada persamaan $x^2 - 7x + 10 = 0$, nilai dari $x_1 + x_2$ adalah...",
      options: [
        { key: "A", text: "$-7$", feedback: "Hati-hati tanda minus ganda! $-\\dfrac{b}{a} = -\\dfrac{-7}{1} = +7$." },
        { key: "B", text: "$7$", feedback: "Benar! Karena $b = -7$, maka $-\\dfrac{-7}{1} = 7$." },
        { key: "C", text: "$10$", feedback: "$10$ adalah hasil kali akar ($x_1 \\cdot x_2$), bukan jumlah akar." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PK_T3_INEQ]: {
    skillNodeId: NODE_IDS.PK_T3_INEQ,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa dilarang kali silang variabel pada pertidaksamaan?",
    whyStory:
      "Pada pertidaksamaan ($<$ atau $>$), jika kamu mengalikan kedua ruas dengan bilangan **negatif**, arah tandanya harus **berbalik**. Saat mengali silang variabel seperti $(x - 2)$, kita belum tahu apakah $(x - 2)$ positif atau negatif, sehingga arah tanda bisa rusak!",
    analogy:
      "Kamu tahu $2 < 5$. Jika dikali $-1$, berubah jadi $-2 > -5$ (berbalik!). Kalau pengalinya masih misteri ($x - 2$), kamu tidak tahu apakah tandanya harus dibalik atau tidak.",
    coreRuleLatex: "\\dfrac{A(x)}{B(x)} > 0 \\iff \\text{Pindahkan ke satu ruas, samakan penyebut, lalu uji titik kritis!}",
    coreRuleNote: "Penyebut tidak boleh bernilai $0$ (titik pembuat nol penyebut selalu berlubang / tidak ikut himpunan).",
    workedExample: {
      prompt: "Selesaikan $\\dfrac{x + 1}{x - 2} > 0$.",
      steps: [
        {
          title: "Temukan pembuat nol pembilang & penyebut",
          detail: "Pembilang nol di $x = -1$, penyebut nol di $x = 2$.",
          formulaLatex: "x = -1 \\quad \\text{dan} \\quad x = 2 \\ (\\text{dilarang})",
        },
        {
          title: "Uji satu titik mudah, misal $x = 0$",
          detail: "Substitusi $x = 0$: $\\dfrac{0 + 1}{0 - 2} = -\\dfrac{1}{2}$ (negatif). Maka daerah tengah ($-1 < x < 2$) bertanda negatif, kiri dan kanan positif.",
          formulaLatex: "x < -1 \\quad \\text{atau} \\quad x > 2",
        },
      ],
      takeaway: "Nolkan ruas kanan, cari titik kritis, lalu uji 1 angka mudah seperti $x = 0$.",
    },
    commonTrap: {
      trapTitle: "Mengali silang $(x - 2)$ ke ruas kanan sehingga solusi $x < -1$ hilang",
      wrongWay: "Mengubah $\\dfrac{x+1}{x-2} > 0$ menjadi $x + 1 > 0 \\implies x > -1$ (salah besar!).",
      rightWay: "Biarkan tetap berbentuk pecahan dengan ruas kanan 0, lalu pakai garis bilangan.",
    },
    warmupCheck: {
      question: "Pada $\\dfrac{x - 3}{x + 2} \\ge 0$, mengapa nilai $x = -2$ TIDAK boleh dimasukkan ke dalam jawaban?",
      options: [
        { key: "A", text: "Karena membuat pembilang negatif", feedback: "Pembilang negatif tidak masalah jika penyebut juga negatif." },
        { key: "B", text: "Karena membuat penyebut bernilai 0 (pembagian dengan nol tak terdefinisi)", feedback: "Tepat sekali! Penyebut nol tidak pernah boleh ikut sebagai solusi." },
        { key: "C", text: "Karena $-2$ adalah bilangan negatif", feedback: "Bilangan negatif tetap bisa jadi solusi jika hasil pecahannya positif." },
      ],
      correctKey: "B",
    },
  },

  // === PU (4 NODES) ===
  [NODE_IDS.PU_T0_LOG]: {
    skillNodeId: NODE_IDS.PU_T0_LOG,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa negasi dari 'Semua' adalah 'Ada yang tidak', bukan 'Tidak semua/Tidak ada'?",
    whyStory:
      "Logika formal bekerja seperti hakim di pengadilan. Untuk membuktikan pernyataan **'Semua siswa hadir'** itu SALAH, kamu tidak perlu membuktikan seluruh kelas kosong. Cukup temukan **minimal satu (ada)** siswa yang tidak hadir!",
    analogy:
      "Kalau temanmu bilang 'Semua apel di keranjang ini manis', cukup 1 buah apel asam saja untuk menggugurkan ucapannya.",
    coreRuleLatex: "\\neg(\\forall x, P(x)) \\equiv \\exists x, \\neg P(x) \\quad | \\quad \\neg(P \\to Q) \\equiv P \\land \\neg Q",
    coreRuleNote: "Implikasi 'Jika P maka Q' hanya bohong jika P benar-benar terjadi, tetapi Q malah gagal terjadi.",
    workedExample: {
      prompt: "Apa ingkaran (negasi) dari: 'Jika hujan turun, maka jalanan basah'?",
      steps: [
        {
          title: "Kenali bentuknya: Jika $P$, maka $Q$",
          detail: "$P$ = hujan turun, $Q$ = jalanan basah.",
        },
        {
          title: "Cari satu-satunya kondisi yang bikin janji ini bohong",
          detail: "Janji bohong hanya jika $P$ terjadi DAN $Q$ tidak terjadi.",
          formulaLatex: "\\text{Hujan turun DAN jalanan tidak basah.}",
        },
      ],
      takeaway: "Negasi 'Jika P maka Q' BUKAN kalimat 'Jika...' lagi, melainkan 'P dan tidak Q'.",
    },
    commonTrap: {
      trapTitle: "Membalik implikasi atau mengubah 'Jika P maka Q' menjadi 'Jika tidak P maka tidak Q'",
      wrongWay: "Mengira lawan dari 'Jika hujan maka basah' adalah 'Jika tidak hujan maka tidak basah'.",
      rightWay: "Ingat: ingkaran implikasi selalu memakai kata hubung DAN ($P \\land \\neg Q$).",
    },
    warmupCheck: {
      question: "Apa ingkaran yang tepat dari pernyataan 'Semua peserta membawa kartu ujian'?",
      options: [
        { key: "A", text: "Semua peserta tidak membawa kartu ujian", feedback: "Terlalu ekstrem! Untuk menyangkal 'semua', cukup ada minimal satu pengecualian." },
        { key: "B", text: "Ada peserta yang tidak membawa kartu ujian", feedback: "Tepat! Satu pengecualian saja sudah mematahkan klaim 'semua'." },
        { key: "C", text: "Sebagian peserta membawa kartu ujian", feedback: "Ini masih mungkin benar bersamaan, belum menyangkal klaim awal." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PU_T1_SYL]: {
    skillNodeId: NODE_IDS.PU_T1_SYL,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa 'Jika P maka Q' setara dengan 'Jika bukan Q maka bukan P'?",
    whyStory:
      "Bayangkan aturan mutlak: **'Jika tinggal di Bandung (P), maka tinggal di Indonesia (Q)'**. Kalau seseorang **bukan tinggal di Indonesia ($\\neg Q$)**, mungkinkah dia tinggal di Bandung? Mustahil! Jadi pasti bukan di Bandung ($\\neg P$). Tapi hati-hati: tinggal di Indonesia ($Q$) belum tentu tinggal di Bandung ($P$)!",
    analogy:
      "Semua kucing adalah hewan. Kalau bukan hewan, pasti bukan kucing (kontraposisi sah!). Tapi kalau dia hewan, belum tentu kucing (membalik arah itu jebakan!).",
    coreRuleLatex: "(P \\to Q) \\equiv (\\neg Q \\to \\neg P) \\quad | \\quad (P \\to Q) \\land (Q \\to R) \\implies (P \\to R)",
    coreRuleNote: "Modus Tollens: jika aturan $P \\to R$ berlaku, dan fakta menunjukkan $\\neg R$, maka kesimpulan pasti adalah $\\neg P$.",
    workedExample: {
      prompt: "Premis 1: Jika rajin latihan ($P$), maka skor naik ($Q$). Premis 2: Skor tidak naik ($\\neg Q$). Simpulannya?",
      steps: [
        {
          title: "Tulis panah sebab-akibat",
          detail: "$P \\to Q$ dengan fakta $\\neg Q$.",
        },
        {
          title: "Balik panah dengan menegasi keduanya (Kontraposisi)",
          detail: "Karena $Q$ tidak terjadi, sebab $P$ pasti tidak terjadi.",
          formulaLatex: "\\neg P: \\text{ Tidak rajin latihan.}",
        },
      ],
      takeaway: "Panah logika hanya bisa dibalik kalau KEDUA sisinya dinegasikan.",
    },
    commonTrap: {
      trapTitle: "Jebakan mengira 'Jika tidak P maka tidak Q' selalu benar",
      wrongWay: "Dari 'Jika hujan maka jalan basah', menyimpulkan 'Tidak hujan berarti jalan kering' (padahal bisa saja jalan baru disiram!).",
      rightWay: "Hanya gunakan kontraposisi ($\\neg Q \\to \\neg P$) atau rantai silogisme ($P \\to Q \\to R$).",
    },
    warmupCheck: {
      question: "Jika 'Semua anggota tim memakai jaket hijau' dan 'Raka tidak memakai jaket hijau', simpulan pasti sah adalah...",
      options: [
        { key: "A", text: "Raka bukan anggota tim", feedback: "Tepat sekali! Ini adalah Modus Tollens yang 100% sah." },
        { key: "B", text: "Raka lupa membawa jaketnya", feedback: "Itu asumsi luar yang tidak disebut pada premis." },
        { key: "C", text: "Sebagian anggota tim tidak berjaket hijau", feedback: "Bertentangan dengan premis pertama." },
      ],
      correctKey: "A",
    },
  },
  [NODE_IDS.PU_T2_ARG]: {
    skillNodeId: NODE_IDS.PU_T2_ARG,
    estimatedMinutes: 3,
    whyHeadline: "Bagaimana cara tahu bukti yang benar-benar MEMPERLEMAH argumen?",
    whyStory:
      "Argumen terdiri dari **Fakta (Premis) → Jembatan Asumsi → Kesimpulan**. Memperlemah argumen bukan berarti mencari fakta yang tidak nyambung, melainkan **mematahkan jembatan asumsi** atau menunjukkan adanya penyebab alternatif lain.",
    analogy:
      "Jika seseorang menyimpulkan 'Penjualan es krim naik menyebabkan angka tenggelam naik', bukti yang memperlemah adalah fakta bahwa keduanya sama-sama dipicu oleh musim panas (faktor ketiga), bukan karena es krim berbahaya.",
    coreRuleLatex: null,
    coreRuleNote: "Checklist cepat: 1) Temukan kalimat kesimpulan dulu, 2) Cari faktor pengganggu atau bukti pembanding yang mematahkan klaim sebab-akibat.",
    workedExample: {
      prompt: "Klaim: 'Program kerja 4 hari meningkatkan produktivitas karena output tim naik 10% bulan ini.' Pernyataan mana yang memperlemah?",
      steps: [
        {
          title: "Identifikasi kesimpulan & bukti",
          detail: "Sebab diklaim = kerja 4 hari; Akibat = output naik 10%.",
        },
        {
          title: "Cari penyebab alternatif di bulan yang sama",
          detail: "Jika di bulan yang sama perusahaan juga menambah software otomatis baru, maka kenaikan 10% belum tentu karena sistem kerja 4 hari.",
        },
      ],
      takeaway: "Bukti pematah terkuat selalu menyerang hubungan sebab-akibat dengan penyebab alternatif atau data pembanding.",
    },
    commonTrap: {
      trapTitle: "Memilih pernyataan yang sekadar berbeda topik atau opini umum",
      wrongWay: "Memilih 'Banyak karyawan menyukai libur 3 hari' (ini tidak membantah maupun membuktikan produktivitas).",
      rightWay: "Pastikan opsi langsung menyentuh variabel SEBAB dan AKIBAT di kesimpulan.",
    },
    warmupCheck: {
      question: "Sebuah kafe mengklaim 'Musik jazz membuat pengunjung belanja lebih banyak karena omzet Sabtu naik 20% saat musik jazz diputar.' Mana yang paling MEMPERLEMAH?",
      options: [
        { key: "A", text: "Sebagian pelanggan juga menyukai musik pop", feedback: "Belum mematahkan alasan kenaikan omzet hari Sabtu." },
        { key: "B", text: "Pada hari Sabtu yang sama kafe mengadakan promo beli 1 gratis 1", feedback: "Tepat! Ada penyebab alternatif kuat (promo) di hari yang sama." },
        { key: "C", text: "Kafe tersebut buka sejak pukul 08.00 pagi", feedback: "Tidak berkaitan dengan sebab kenaikan omzet." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PU_T3_PAT]: {
    skillNodeId: NODE_IDS.PU_T3_PAT,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa deret UTBK sering terlihat acak padahal punya 2 lapisan pola?",
    whyStory:
      "Pembuat soal SNBT suka menyembunyikan pola dengan dua trik: **selisih bertingkat** (selisihnya sendiri membentuk barisan baru) atau **dua barisan yang digabung selang-seling** (urutan ganjil sendiri, urutan genap sendiri).",
    analogy:
      "Seperti dua antrean orang yang berdiri selang-seling dalam satu barisan. Begitu kamu memisahkan posisi 1-3-5 dan 2-4-6, polanya langsung terlihat sangat mudah!",
    coreRuleLatex: "U_1, \\ U_2, \\ U_3, \\ U_4, \\dots \\implies \\text{Cek } \\Delta_1 \\text{ dulu, lalu cek lompat-1 (ganjil/genap)}",
    coreRuleNote: "Jangan langsung menebak rumus rumit. Selalu tulis selisih antar angka di bawah deretnya dulu.",
    workedExample: {
      prompt: "Lanjutkan deret: $3, 5, 8, 12, 17, \\dots$",
      steps: [
        {
          title: "Hitung selisih antar suku berurutan",
          detail: "$5-3=+2$, $8-5=+3$, $12-8=+4$, $17-12=+5$.",
          formulaLatex: "+2, \\ +3, \\ +4, \\ +5, \\ \\text{berikutnya } +6",
        },
        {
          title: "Tambahkan selisih berikutnya",
          detail: "$17 + 6 = 23$.",
          formulaLatex: "17 + 6 = 23",
        },
      ],
      takeaway: "Tulis selisih baris 1. Jika naik-turun tidak beraturan, langsung pisahkan indeks ganjil & genap.",
    },
    commonTrap: {
      trapTitle: "Memaksa mencari 1 pola berurutan pada deret yang sebenarnya lompat-1",
      wrongWay: "Pusing melihat $2, 10, 4, 9, 6, 8, \\dots$ karena selisihnya $+8, -6, +5, -3$.",
      rightWay: "Pisah ganjil ($2, 4, 6 \\to 8$) dan genap ($10, 9, 8 \\to 7$). Langsung ketemu dalam 3 detik!",
    },
    warmupCheck: {
      question: "Pada deret selang-seling $2, 10, 4, 9, 6, 8, \\dots$, angka berikutnya adalah...",
      options: [
        { key: "A", text: "$7$", feedback: "Posisi ke-7 adalah urutan ganjil ($2, 4, 6, \\dots$), bukan urutan genap!" },
        { key: "B", text: "$8$", feedback: "Benar! Urutan ganjil naik +2 setiap langkah: $2, 4, 6, 8$." },
        { key: "C", text: "$10$", feedback: "Cek lagi pola urutan ganjil: $2 \\to 4 \\to 6 \\to 8$." },
      ],
      correctKey: "B",
    },
  },

  // === PM (4 NODES) ===
  [NODE_IDS.PM_T0_UNIT]: {
    skillNodeId: NODE_IDS.PM_T0_UNIT,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa soal cerita PM terasa susah padahal hitungannya dasar?",
    whyStory:
      "Di Penalaran Matematika, 70% kesalahan bukan karena tidak bisa menghitung, melainkan **mencampur satuan yang berbeda** (menit dengan jam, meter dengan kilometer, ribu rupiah dengan rupiah) sebelum masuk rumus.",
    analogy:
      "Kamu tidak bisa bilang 2 jam + 30 menit = 32 jam. Kamu wajib ubah dulu semuanya jadi menit (150 menit) atau semuanya jadi jam (2,5 jam).",
    coreRuleLatex: "\\text{Kecepatan} = \\dfrac{\\text{Jarak}}{\\text{Waktu}} \\quad | \\quad 1\\text{ jam} = 60\\text{ menit}, \\ 1\\text{ km} = 1.000\\text{ m}",
    coreRuleNote: "Tulis satuan persis di sebelah angkanya saat mencoret-coret agar satuan yang berbeda langsung terlihat.",
    workedExample: {
      prompt: "Sebuah pompa mengisi air dengan debit 20 liter/menit. Berapa liter air yang terkumpul dalam 1,5 jam?",
      steps: [
        {
          title: "Samakan satuan waktu ke menit",
          detail: "Karena debit memakai 'per menit', ubah 1,5 jam menjadi menit.",
          formulaLatex: "1{,}5 \\text{ jam} = 1{,}5 \\times 60 = 90 \\text{ menit}",
        },
        {
          title: "Kalikan debit dengan waktu",
          detail: "Satuan menit saling coret, menyisakan liter.",
          formulaLatex: "20 \\times 90 = 1.800 \\text{ liter}",
        },
      ],
      takeaway: "Langkah 0 di semua soal PM: pastikan seluruh satuan waktu, jarak, dan uang sudah seragam.",
    },
    commonTrap: {
      trapTitle: "Langsung mengalikan angka mentah tanpa menyamakan satuan",
      wrongWay: "Langsung menghitung $20 \\times 1{,}5 = 30$ liter (lupa ubah jam ke menit).",
      rightWay: "Cek satuan di akhir kalimat pertanyaan dulu, lalu seragamkan semua data ke satuan itu.",
    },
    warmupCheck: {
      question: "Sebuah kereta melaju 60 km/jam selama 30 menit. Jarak yang ditempuh adalah...",
      options: [
        { key: "A", text: "1.800 km", feedback: "Hati-hati! Jangan kalikan 60 km/jam dengan 30 menit sebelum ubah 30 menit = 0,5 jam." },
        { key: "B", text: "30 km", feedback: "Tepat! 30 menit = $\\dfrac{1}{2}$ jam, jadi $60 \\times \\dfrac{1}{2} = 30$ km." },
        { key: "C", text: "2 km", feedback: "Bukan dibagi, melainkan kecepatan $\\times$ waktu (dalam jam)." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PM_T1_PCT]: {
    skillNodeId: NODE_IDS.PM_T1_PCT,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa diskon 20% + 25% BUKAN diskon 45%?",
    whyStory:
      "Diskon kedua selalu dihitung dari **harga sisa setelah diskon pertama**, bukan dari harga awal! Cara tercepat & anti-salah adalah berpikir lewat **porsi yang DIBAYAR** (faktor pengali): diskon 20% artinya kamu membayar 80% ($0{,}80$).",
    analogy:
      "Kalau baju Rp100.000 didiskon 50% + 50%, tidak mungkin gratis (100%)! Diskon pertama jadi Rp50.000, lalu diskon kedua 50% dari Rp50.000 menjadi Rp25.000.",
    coreRuleLatex: "\\text{Harga Akhir} = \\text{Harga Awal} \\times (1 - d_1) \\times (1 - d_2)",
    coreRuleNote: "Untuk kenaikan / pajak $r$, faktor pengalinya adalah $(1 + r)$.",
    workedExample: {
      prompt: "Harga tas Rp200.000 mendapat diskon 20% lalu diskon tambahan 25%. Berapa harga akhirnya?",
      steps: [
        {
          title: "Ubah tiap diskon menjadi porsi yang dibayar",
          detail: "Diskon 20% → bayar 80% ($0{,}8$). Diskon 25% → bayar 75% ($0{,}75$).",
          formulaLatex: "0{,}80 \\times 0{,}75 = 0{,}60 \\ (60\\%)",
        },
        {
          title: "Kalikan dengan harga awal",
          detail: "Kamu cukup membayar 60% dari Rp200.000.",
          formulaLatex: "0{,}60 \\times 200.000 = \\text{Rp}120.000",
        },
      ],
      takeaway: "Persentase bertingkat selalu DIKALIKAN lewat faktor bayarnya, tidak pernah dijumlahkan langsung.",
    },
    commonTrap: {
      trapTitle: "Menjumlahkan persen diskon secara langsung (20% + 25% = 45%)",
      wrongWay: "Menghitung $55\\% \\times 200.000 = \\text{Rp}110.000$.",
      rightWay: "Kalikan berantai: $200.000 \\times 0{,}8 \\times 0{,}75 = \\text{Rp}120.000$.",
    },
    warmupCheck: {
      question: "Jika harga barang Rp100.000 didiskon 50% lalu didiskon lagi 50%, harga akhirnya adalah...",
      options: [
        { key: "A", text: "Rp0 (gratis)", feedback: "Diskon beruntun tidak dijumlahkan! Diskon kedua dihitung dari Rp50.000." },
        { key: "B", text: "Rp25.000", feedback: "Tepat! $100.000 \\times 0{,}5 \\times 0{,}5 = \\text{Rp}25.000$." },
        { key: "C", text: "Rp50.000", feedback: "Itu baru diskon pertama saja." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PM_T2_LIN]: {
    skillNodeId: NODE_IDS.PM_T2_LIN,
    estimatedMinutes: 3,
    whyHeadline: "Bagaimana membedakan Biaya Tetap, Biaya Variabel, dan Margin Bersih?",
    whyStory:
      "Dalam bisnis nyata, **Biaya Tetap** (seperti sewa tempat) tetap harus dibayar meski kamu jual 0 barang. **Biaya Variabel** (seperti bahan baku) muncul tiap 1 barang dibuat. Selisih Harga Jual dikurangi Biaya Variabel disebut **Margin Bersih per unit**: inilah 'uang bersih' yang dipakai melunasi Biaya Tetap lalu mencetak laba.",
    analogy:
      "Kamu sewa gerobak Rp100.000/hari (tetap). Modal 1 es teh Rp3.000, kamu jual Rp8.000. Tiap 1 gelas laku, kamu dapat margin bersih Rp5.000 untuk melunasi sewa gerobak dulu (butuh 20 gelas buat balik modal).",
    coreRuleLatex: "n = \\dfrac{\\text{Biaya Tetap} + \\text{Target Laba}}{\\text{Harga Jual} - \\text{Biaya Variabel}}",
    coreRuleNote: "Jika yang ditanya hanya titik impas (BEP / balik modal), masukkan Target Laba = $0$.",
    workedExample: {
      prompt: "Biaya tetap Rp180.000, biaya cetak Rp12.000/buku, harga jual Rp20.000/buku. Berapa buku agar untung Rp140.000?",
      steps: [
        {
          title: "Cari margin bersih per buku",
          detail: "Kurangkan harga jual dengan biaya cetak per buku.",
          formulaLatex: "m = 20.000 - 12.000 = \\text{Rp}8.000",
        },
        {
          title: "Jumlahkan total uang yang harus ditutup",
          detail: "Tutup biaya tetap DAN target laba sekaligus.",
          formulaLatex: "180.000 + 140.000 = \\text{Rp}320.000",
        },
        {
          title: "Bagi dengan margin per buku",
          detail: "Dapat jumlah minimal buku terjual.",
          formulaLatex: "n = \\dfrac{320.000}{8.000} = 40 \\text{ buku}",
        },
      ],
      takeaway: "Selalu bagi (Biaya Tetap + Target Laba) dengan MARGIN bersih, jangan dengan harga jual kotor!",
    },
    commonTrap: {
      trapTitle: "Membagi target dengan harga jual kotor (lupa mengurangkan biaya variabel)",
      wrongWay: "Langsung menghitung $320.000 \\div 20.000 = 16$ buku.",
      rightWay: "Setiap buku punya biaya produksi Rp12.000, jadi yang tersisa hanya margin Rp8.000/buku.",
    },
    warmupCheck: {
      question: "Jika harga jual per paket Rp25.000 dan biaya variabelnya Rp15.000, berapa margin bersih per paket?",
      options: [
        { key: "A", text: "Rp40.000", feedback: "Biaya variabel harus dikurangkan dari harga jual, bukan dijumlahkan." },
        { key: "B", text: "Rp10.000", feedback: "Tepat! Rp25.000 - Rp15.000 = Rp10.000 margin bersih tiap paket." },
        { key: "C", text: "Rp15.000", feedback: "Rp15.000 adalah biaya variabelnya, bukan margin bersih." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PM_T3_PROB]: {
    skillNodeId: NODE_IDS.PM_T3_PROB,
    estimatedMinutes: 3,
    whyHeadline: "Apa bedanya peluang biasa dengan peluang BERSYARAT?",
    whyStory:
      "Pada peluang bersyarat (biasanya ada kata **'diketahui bahwa...'** atau **'jika terpilih dari kelompok X...'**), dunia semesta kita langsung **menyempit**. Penyebut pecahannya bukan lagi seluruh populasi, melainkan hanya kelompok syarat yang sudah pasti terjadi!",
    analogy:
      "Kalau ada 30 siswa di kelas dan 12 di antaranya berkacamata, lalu guru bilang 'yang dipanggil adalah siswa berkacamata', maka peluangnya sekarang dibagi 12 (bukan dibagi 30 lagi!).",
    coreRuleLatex: "P(A \\mid B) = \\dfrac{n(A \\cap B)}{n(B)}",
    coreRuleNote: "Cara tercepat: baca kalimat syaratnya dulu untuk menentukan penyebut baru $n(B)$.",
    workedExample: {
      prompt: "Di sebuah kelas ada 10 siswa suka Matematika (4 di antaranya juga suka Fisika). Jika dipilih acak 1 siswa yang suka Matematika, berapa peluang ia juga suka Fisika?",
      steps: [
        {
          title: "Kunci penyebut dari syarat yang diketahui",
          detail: "Syarat = siswa yang suka Matematika → penyebutnya langsung $10$.",
        },
        {
          title: "Cari irisan yang memenuhi target",
          detail: "Yang suka keduanya ada $4$ orang.",
          formulaLatex: "P = \\dfrac{4}{10} = \\dfrac{2}{5}",
        },
      ],
      takeaway: "Lihat kata 'diketahui / jika sudah terpilih dari...' → itu langsung jadi penyebutnya!",
    },
    commonTrap: {
      trapTitle: "Tetap memakai total seluruh kelas sebagai penyebut",
      wrongWay: "Membagi 4 dengan total seluruh kelas (misal 40 siswa), padahal syarat sudah membatasi ke 10 siswa.",
      rightWay: "Penyebut pada peluang bersyarat SELALU hanya kelompok syaratnya.",
    },
    warmupCheck: {
      question: "Sebuah dadu dilempar dan DIKETAHUI muncul angka genap ($2, 4, 6$). Berapa peluang angka yang muncul adalah 4?",
      options: [
        { key: "A", text: "$\\dfrac{1}{6}$", feedback: "Ingat, kita sudah tahu hasilnya genap! Semestanya menyempit dari 6 jadi 3 angka." },
        { key: "B", text: "$\\dfrac{1}{3}$", feedback: "Tepat sekali! Hanya ada 3 kemungkinan genap ($2, 4, 6$), dan angka 4 adalah 1 di antaranya." },
        { key: "C", text: "$\\dfrac{1}{2}$", feedback: "Angka 4 hanya 1 dari 3 angka genap, jadi $\\dfrac{1}{3}$." },
      ],
      correctKey: "B",
    },
  },

  // === LBI (3 NODES) ===
  [NODE_IDS.LBI_T0_IDEA]: {
    skillNodeId: NODE_IDS.LBI_T0_IDEA,
    estimatedMinutes: 3,
    whyHeadline: "Cara membedakan Ide Pokok dengan kalimat contoh dalam 10 detik",
    whyStory:
      "Paragraf yang baik selalu punya satu **kalimat payung** (ide pokok) yang memayungi seluruh detail lain. Kalimat yang berisi angka rinci, nama kota spesifik, atau kata *'misalnya'* hanyalah kalimat penjelas: bukan ide pokok!",
    analogy:
      "Kalau seseorang bercerita: 'Olahraga rutin menyehatkan jantung. Contohnya lari 20 menit membakar kalori, dan berenang melatih paru.' Payungnya adalah kalimat pertama, bukan detail lari 20 menit.",
    coreRuleLatex: null,
    coreRuleNote: "Uji payung: hilangkan satu kalimat kandidat. Jika sisa paragraf kehilangan arah utama, itulah kalimat utama!",
    workedExample: {
      prompt: "Teks: '[S1] Transportasi publik butuh jalur pengumpan agar diminati warga. [S2] Di kota X, bus koridor sepi karena jarak halte ke rumah 2 km.' Mana ide pokoknya?",
      steps: [
        {
          title: "Pisahkan klaim payung vs bukti contoh",
          detail: "S1 bersifat umum (payung). S2 adalah contoh spesifik kota X dan angka 2 km.",
        },
        {
          title: "Pilih opsi yang merangkum payung S1",
          detail: "Ide pokoknya adalah pentingnya jalur pengumpan untuk meningkatkan minat warga pada transportasi publik.",
        },
      ],
      takeaway: "Ide pokok = cukup luas untuk memayungi paragraf, tetapi tidak melampaui isi teks.",
    },
    commonTrap: {
      trapTitle: "Tertarik pada opsi yang benar secara teks, tapi terlalu sempit (hanya detail contoh)",
      wrongWay: "Memilih 'Jarak halte di kota X sejauh 2 km' sebagai ide pokok.",
      rightWay: "Detail angka/contoh hampir selalu kalimat penjelas; cari payung utamanya.",
    },
    warmupCheck: {
      question: "Manakah ciri paling kuat dari kalimat penjelas (BUKAN ide pokok)?",
      options: [
        { key: "A", text: "Menyatakan gagasan umum yang memayungi paragraf", feedback: "Justru itu adalah ciri ide pokok!" },
        { key: "B", text: "Berisi contoh spesifik, statistik rinci, atau kutipan pendukung", feedback: "Tepat! Contoh spesifik dan angka rinci bertugas mendukung ide pokok." },
        { key: "C", text: "Menjadi topik utama yang dibahas berulang", feedback: "Topik yang dibahas berulang adalah ciri ide pokok." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.LBI_T1_CLAIM]: {
    skillNodeId: NODE_IDS.LBI_T1_CLAIM,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa kata 'semua', 'selalu', dan 'satu-satunya' adalah jebakan nomor 1 di LBI?",
    whyStory:
      "Teks ilmiah dan berita di UTBK selalu berhati-hati memakai kata pembatas (*sebagian, cenderung, salah satu, berperan mendukung*). Pembuat soal mengecoh siswa dengan mengubah kata pembatas itu menjadi **kata mutlak** (*semua, pasti, satu-satunya*).",
    analogy:
      "Jika dokter bilang 'Ikan kembung bagus sebagai pelengkap gizi selain sinar matahari', lalu ada orang menyimpulkan 'Makan ikan kembung saja sudah cukup menggantikan matahari' → itu jelas melanggar cakupan!",
    coreRuleLatex: null,
    coreRuleNote: "Aturan Gerbang Bukti: sebelum melirik opsi A-E, ketuk dulu 1 kalimat bukti eksak di teks dan perhatikan kata kuantornya.",
    workedExample: {
      prompt: "Teks menyebut: 'Sinar matahari pagi adalah faktor utama vitamin D, sementara ikan lokal disarankan sebagai pelengkap.' Mengapa opsi 'Ikan lokal menggantikan sinar matahari' salah?",
      steps: [
        {
          title: "Tandai peran tiap unsur di kalimat bukti",
          detail: "Matahari = faktor utama; Ikan lokal = pelengkap.",
        },
        {
          title: "Coret opsi yang menukar peran atau melebih-lebihkan",
          detail: "Kata 'menggantikan' bertentangan dengan 'pelengkap'.",
        },
      ],
      takeaway: "Cocokkan kata kuantor di opsi dengan teks: 'salah satu' tidak boleh berubah jadi 'satu-satunya'!",
    },
    commonTrap: {
      trapTitle: "Memilih opsi yang memakai kata-kata dari teks, tetapi kuantornya diperbesar",
      wrongWay: "Melihat kata 'ikan kembung' dan 'vitamin D' sama dengan teks lalu langsung memilih tanpa cek kata 'satu-satunya'.",
      rightWay: "Curigai langsung setiap opsi yang mengandung kata mutlak (selalu, semua, pasti, tunggal, satu-satunya).",
    },
    warmupCheck: {
      question: "Jika teks menyatakan 'Sebagian pelajar merasa lebih fokus di pagi hari', manakah klaim yang SAH?",
      options: [
        { key: "A", text: "Semua pelajar wajib belajar di pagi hari", feedback: "Overgeneralisasi! Teks hanya menyebut 'sebagian', bukan 'semua'." },
        { key: "B", text: "Tidak semua pelajar memiliki pola fokus yang sama, ada yang lebih fokus di pagi hari", feedback: "Tepat! Menjaga cakupan 'sebagian' secara jujur." },
        { key: "C", text: "Belajar malam hari pasti tidak efektif", feedback: "Tidak ada bukti di teks yang menyatakan belajar malam pasti gagal." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.LBI_T2_INF]: {
    skillNodeId: NODE_IDS.LBI_T2_INF,
    estimatedMinutes: 3,
    whyHeadline: "Batas tipis antara Inferensi Sahih vs Tebakan Liar (Asumsi Luar)",
    whyStory:
      "Inferensi artinya menarik kesimpulan yang tidak ditulis mentah-mentah, tetapi **pasti mengikuti fakta di teks**. Inferensi yang sah hanya melangkah **satu jengkal** dari bukti tertulis, tidak menambahkan pengetahuan atau opini pribadimu dari luar teks.",
    analogy:
      "Jika teks bilang 'Semua kursi di ruangan terisi dan 5 orang masih berdiri', kamu SAH menyimpulkan 'Jumlah hadirin melebihi kapasitas kursi'. Tapi kamu TIDAK SAH menyimpulkan 'Acaranya pasti konser musik'.",
    coreRuleLatex: null,
    coreRuleNote: "Tanya ke dirimu: 'Apakah kesimpulan ini tetap PASTI benar walaupun aku tidak tahu apa-apa di luar paragraf ini?'",
    workedExample: {
      prompt: "Teks: 'Meskipun anggaran riset naik 2 kali lipat, jumlah paten terdaftar tetap stagnan karena proses birokrasi berbelit.' Apa inferensi yang sah?",
      steps: [
        {
          title: "Hubungkan dua fakta kunci di teks",
          detail: "Anggaran naik besar, tetapi paten tidak naik karena hambatan birokrasi.",
        },
        {
          title: "Tarik simpulan satu langkah",
          detail: "Kenaikan anggaran saja belum cukup meningkatkan paten tanpa perbaikan birokrasi.",
        },
      ],
      takeaway: "Inferensi sahih = gabungan langsung premis teks, nol spekulasi masa depan.",
    },
    commonTrap: {
      trapTitle: "Memakai pengetahuan umum pribadi yang tidak ditulis di bacaan",
      wrongWay: "Memilih opsi yang terdengar masuk akal di dunia nyata tetapi tidak punya kalimat jangkar di teks.",
      rightWay: "Setiap inferensi UTBK wajib punya minimal satu kalimat bukti di bacaan.",
    },
    warmupCheck: {
      question: "Teks: 'Toko buku itu mengurangi jam buka karena pengunjung luring turun 40%.' Inferensi paling sah adalah...",
      options: [
        { key: "A", text: "Toko buku tersebut akan bangkrut bulan depan", feedback: "Terlalu jauh (spekulasi masa depan)." },
        { key: "B", text: "Penurunan pengunjung luring memengaruhi keputusan operasional jam buka toko", feedback: "Tepat! Langsung bersandar pada hubungan sebab-akibat di teks." },
        { key: "C", text: "Semua orang kini hanya membaca buku digital", feedback: "Overgeneralisasi dari luar teks." },
      ],
      correctKey: "B",
    },
  },

  // === LBE (3 NODES) ===
  [NODE_IDS.LBE_T0_REF]: {
    skillNodeId: NODE_IDS.LBE_T0_REF,
    estimatedMinutes: 3,
    whyHeadline: "Trik cepat memastikan rujukan kata ganti ('they', 'it', 'which') di LBE",
    whyStory:
      "Kata ganti dalam bahasa Inggris selalu tunduk pada **jumlah (singular vs plural)** dan **makna kalimat**. `It / this` hanya bisa merujuk ke benda tunggal atau satu gagasan; `they / these / those` wajib merujuk ke kata benda jamak di kalimat sebelumnya.",
    analogy:
      "Coba 'tempel balik' kandidat kata bendanya menggantikan `they` atau `it`, lalu baca ulang kalimatnya. Kalau bunyinya masuk akal secara makna dan jumlah, itu jawabannya!",
    coreRuleLatex: null,
    coreRuleNote: "1) Cek tunggal vs jamak dulu untuk mencoret 2-3 opsi dalam 3 detik, 2) Tempel balik ke kalimat untuk uji makna.",
    workedExample: {
      prompt: "'Urban trees cool streets, yet **they** require regular maintenance.' Kata **they** merujuk pada...",
      steps: [
        {
          title: "Cek jumlah kata ganti",
          detail: "`they` adalah jamak (plural). Kandidat jamak sebelumnya: `urban trees` atau `streets`.",
        },
        {
          title: "Uji makna (substitusi balik)",
          detail: "Yang butuh perawatan rutin (`require regular maintenance`) dalam konteks kalimat ini adalah `urban trees`.",
        },
      ],
      takeaway: "Cocokkan jumlah (singular/plural) dulu, lalu substitusi balik untuk memastikan logikanya.",
    },
    commonTrap: {
      trapTitle: "Langsung memilih kata benda yang jaraknya paling dekat tanpa cek makna",
      wrongWay: "Memilih `streets` hanya karena posisinya lebih dekat ke `they`.",
      rightWay: "Selalu baca ulang kalimatnya setelah mengganti pronoun dengan kandidatnya.",
    },
    warmupCheck: {
      question: "'Researchers tested two new batteries, and **both** outperformed older models.' Kata **both** merujuk ke...",
      options: [
        { key: "A", text: "Researchers", feedback: "Uji makna: apakah penelitinya yang mengungguli model baterai lama? Bukan!" },
        { key: "B", text: "Two new batteries", feedback: "Tepat! Secara jumlah (two → both) dan makna (outperformed older models) cocok 100%." },
        { key: "C", text: "Older models", feedback: "Posisinya ada di belakang `both`, bukan anteseden sebelumnya." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.LBE_T1_PURP]: {
    skillNodeId: NODE_IDS.LBE_T1_PURP,
    estimatedMinutes: 3,
    whyHeadline: "Cara membaca niat penulis lewat kata transisi ('however', 'yet', 'therefore')",
    whyStory:
      "Di teks akademik bahasa Inggris, penulis jarang langsung bicara di kalimat pertama. Mereka sering memaparkan anggapan umum dulu, lalu berbelok tajam di kata **however / yet / nevertheless**. Di situlah sikap & tujuan asli penulis berada!",
    analogy:
      "Kalau temanmu bilang 'Filmnya bagus sih, aktornya keren, NAMUN alurnya membosankan', kamu langsung tahu inti pesannya ada setelah kata NAMUN.",
    coreRuleLatex: null,
    coreRuleNote: "Lingkari kata transisi kontras (`however`, `yet`, `in contrast`): kalimat tepat sesudahnya hampir selalu kunci tujuan penulis.",
    workedExample: {
      prompt: "Paragraf membuka dengan anggapan bahwa kerja jarak jauh selalu menurunkan kolaborasi, lalu menulis 'However, recent data reveals higher output when teams set clear check-ins.' Apa tujuan penulis?",
      steps: [
        {
          title: "Temukan titik belok (`However`)",
          detail: "Penulis memaparkan anggapan lama, lalu membantahnya dengan data baru.",
        },
        {
          title: "Pilih kata kerja retoris yang tepat",
          detail: "Tujuan penulis = menantang/menyanggah anggapan umum (`challenge a common assumption`).",
        },
      ],
      takeaway: "Jangan cuma baca kalimat 1! Cari kata transisi belokan untuk menangkap alur utuh paragraf.",
    },
    commonTrap: {
      trapTitle: "Tertipu oleh kalimat pembuka (padahal itu yang mau disanggah penulis)",
      wrongWay: "Mengira penulis setuju bahwa kerja jarak jauh buruk.",
      rightWay: "Lihat kata kerja di opsi: `challenge`, `qualify`, `compare`, `illustrate` harus cocok dengan alur sebelum & sesudah `however`.",
    },
    warmupCheck: {
      question: "Jika sebuah paragraf memuat pola 'Banyak orang mengira X... However, studi terbaru menunjukkan Y', fungsi utama paragraf tersebut adalah...",
      options: [
        { key: "A", text: "Memperkuat kepercayaan lama tentang X", feedback: "Justru kebalikannya! Kata `however` menandakan sanggahan atau koreksi." },
        { key: "B", text: "Mengkoreksi atau menantang anggapan umum menggunakan bukti baru", feedback: "Tepat sekali! Ini pola retoris paling sering muncul di LBE." },
        { key: "C", text: "Memberikan biografi peneliti", feedback: "Tidak sesuai dengan fungsi argumen paragraf." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.LBE_T3_EVAL]: {
    skillNodeId: NODE_IDS.LBE_T3_EVAL,
    estimatedMinutes: 3,
    whyHeadline: "Cara membandingkan 2 teks panjang tanpa bingung di tengah jalan",
    whyStory:
      "Pada soal sintesis dua teks, jangan berusaha menghafal semua detail kedua bacaan. Cukup temukan **1 variabel titik temu** (apa yang disepakati) dan **1 variabel titik beda** (di mana Teks A dan Teks B berbeda pandangan atau fokus).",
    analogy:
      "Ibarat dua reviewer HP yang mengulas produk sama: keduanya setuju kameranya bagus (titik temu), tapi Reviewer A mengkritik baterai sedangkan Reviewer B memuji layarnya (titik beda).",
    coreRuleLatex: null,
    coreRuleNote: "Catat di kepala: Teks A = [klaim 5 kata], Teks B = [klaim 5 kata], Hubungan = [mendukung / melengkapi / membantah].",
    workedExample: {
      prompt: "Teks A menekankan efisiensi panel surya atap rumah. Teks B menyoroti biaya awal pemasangan & perlunya skema cicilan. Bagaimana hubungan keduanya?",
      steps: [
        {
          title: "Ringkas sikap tiap teks",
          detail: "Teks A fokus pada manfaat teknis; Teks B fokus pada hambatan ekonomi & solusinya.",
        },
        {
          title: "Tentukan hubungan sintesis",
          detail: "Teks B tidak menolak panel surya, melainkan **melengkapi** dengan syarat adopsi finansial.",
        },
      ],
      takeaway: "Pisahkan 'membantah langsung' dengan 'melengkapi sudut pandang berbeda'.",
    },
    commonTrap: {
      trapTitle: "Mengira dua teks yang berbeda fokus pasti saling bertentangan",
      wrongWay: "Memilih 'Text B directly refutes Text A' padahal Teks B hanya menambahkan aspek biaya.",
      rightWay: "Cek apakah Teks B benar-benar bilang klaim Teks A salah, atau hanya menambah dimensi baru.",
    },
    warmupCheck: {
      question: "Teks A: 'AI mempercepat diagnosis radiologi.' Teks B: 'Dokter tetap wajib memverifikasi hasil AI demi keselamatan pasien.' Hubungan paling tepat adalah...",
      options: [
        { key: "A", text: "Teks B membantah total manfaat kecepatan AI di Teks A", feedback: "Teks B tidak bilang AI lambat; ia hanya memberi syarat pengawasan manusia." },
        { key: "B", text: "Teks B memberi batasan/pelengkap praktis atas penerapan gagasan di Teks A", feedback: "Benar! Keduanya saling melengkapi, bukan saling menyangkal." },
        { key: "C", text: "Kedua teks membahas topik yang tidak berhubungan", feedback: "Keduanya sama-sama membahas peran AI di dunia medis." },
      ],
      correctKey: "B",
    },
  },

  // === PBM (2 NODES) ===
  [NODE_IDS.PBM_T0_EJA]: {
    skillNodeId: NODE_IDS.PBM_T0_EJA,
    estimatedMinutes: 3,
    whyHeadline: "Trik anti-salah membedakan 'di' dipisah vs 'di-' digabung dalam 2 detik!",
    whyStory:
      "Banyak orang bingung apakah menulis `di baca` atau `dibaca`, `disini` atau `di sini`. Padahal aturannya cuma SATU tes sederhana: **coba ubah kata itu menjadi awalan `me-`**! Kalau bisa jadi kata kerja aktif (`membaca`), wajib **digabung** (`dibaca`). Kalau menunjukkan tempat dan tidak bisa jadi `me-`, wajib **dipisah** (`di sini`, `di rumah`).",
    analogy:
      "`dibeli` → bisa jadi `membeli` → GABUNG! `di pasar` → tidak ada kata `mempasar` → PISAH!",
    coreRuleLatex: null,
    coreRuleNote: "Untuk tanda koma: gunakan koma SEBELUM `sedangkan`, `melainkan`, `tetapi`; dan JANGAN pakai koma sebelum `karena` atau `bahwa`.",
    workedExample: {
      prompt: "Perbaiki kalimat: 'Buku itu di simpan diruang baca, karena baru di beli kemarin.'",
      steps: [
        {
          title: "Uji `me-` pada setiap kata berunsur `di`",
          detail: "`simpan` → menyimpan (GABUNG: `disimpan`). `ruang` → tempat (PISAH: `di ruang`). `beli` → membeli (GABUNG: `dibeli`).",
        },
        {
          title: "Cek tanda koma sebelum konjungsi `karena`",
          detail: "Hapus koma sebelum `karena`.",
          formulaLatex: null,
        },
      ],
      takeaway: "Bisa diubah jadi `me-` = gabung (`disimpan`); penunjuk tempat = pisah (`di ruang`).",
    },
    commonTrap: {
      trapTitle: "Menulis 'dimana' atau 'disana' serangkai & memberi koma sebelum 'karena'",
      wrongWay: "'Dimana buku itu diletakan, karena saya mencarinya.'",
      rightWay: "'Di mana buku itu diletakkan karena saya mencarinya.' (Perhatikan juga huruf ganda `kk` pada `diletakkan`!).",
    },
    warmupCheck: {
      question: "Manakah penulisan yang 100% sesuai EYD V?",
      options: [
        { key: "A", text: "Dokumen penting itu di simpan dirak atas.", feedback: "`disimpan` bisa jadi `menyimpan` (harus gabung), `di rak` adalah tempat (harus pisah)." },
        { key: "B", text: "Dokumen penting itu disimpan di rak atas.", feedback: "Tepat sekali! `disimpan` serangkai dan `di rak` dipisah." },
        { key: "C", text: "Dokumen penting itu disimpan dirak atas.", feedback: "`di rak` menunjukkan tempat sehingga wajib dipisah dengan spasi." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PBM_T1_EFF]: {
    skillNodeId: NODE_IDS.PBM_T1_EFF,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa kalimat panjang di PBM sering dinyatakan TIDAK EFEKTIF?",
    whyStory:
      "Kalimat efektif wajib punya **Subjek (S) + Predikat (P)** yang jelas dan **tidak boros kata (pleonasme)**. Kesalahan paling klasik di UTBK adalah meletakkan kata depan (*Bagi, Dalam, Untuk, Kepada*) di depan Subjek sehingga Subjeknya lenyap berubah menjadi Keterangan!",
    analogy:
      "Kalimat 'Bagi semua peserta wajib hadir' tidak punya Subjek: hanya Keterangan ('Bagi semua peserta') + Predikat ('wajib hadir'). Hapus kata 'Bagi' agar Subjeknya muncul!",
    coreRuleLatex: null,
    coreRuleNote: "Hindari pemborosan ganda seperti `agar supaya`, `sangat ... sekali`, `para bapak-bapak`, `naik ke atas`.",
    workedExample: {
      prompt: "Perbaiki: 'Dalam rapat itu membahas tentang rencana ujian.'",
      steps: [
        {
          title: "Deteksi hilangnya Subjek",
          detail: "Kata `Dalam` membuat `rapat itu` jadi Keterangan, sehingga kalimat tidak punya Subjek!",
        },
        {
          title: "Hapus kata depan `Dalam` dan kata mubazir `tentang`",
          detail: "Kata `membahas` sudah langsung butuh objek, tidak perlu `tentang`.",
        },
      ],
      takeaway: "Kalimat efektif: 'Rapat itu membahas rencana ujian.' (S-P-O tegas, nol kata mubazir!).",
    },
    commonTrap: {
      trapTitle: "Membiarkan kata depan (Bagi/Dalam/Untuk) menempel pada Subjek",
      wrongWay: "'Untuk siswa yang lulus diharapkan mendaftar ulang.'",
      rightWay: "'Siswa yang lulus diharapkan mendaftar ulang.'",
    },
    warmupCheck: {
      question: "Manakah kalimat yang PALING efektif?",
      options: [
        { key: "A", text: "Para siswa-siswa diminta agar supaya berkumpul.", feedback: "Boros ganda: `para` sudah jamak (tidak perlu `siswa-siswa`) dan `agar supaya` mubazir." },
        { key: "B", text: "Bagi para siswa diminta berkumpul di aula.", feedback: "Kata `Bagi` menghilangkan Subjek kalimat!" },
        { key: "C", text: "Para siswa diminta berkumpul di aula.", feedback: "Mantap! Subjek jelas (`Para siswa`), predikat tegas, nol pemborosan kata." },
      ],
      correctKey: "C",
    },
  },

  // === PPU (2 NODES) ===
  [NODE_IDS.PPU_T1_SEM]: {
    skillNodeId: NODE_IDS.PPU_T1_SEM,
    estimatedMinutes: 3,
    whyHeadline: "Kenapa arti kata di PPU harus dicek lewat KONTEKS kalimat, bukan hafalan kamus?",
    whyStory:
      "Banyak kata bahasa Indonesia punya lebih dari satu makna (polisemi) atau makna kiasan. Kata **kalibrasi**, **akselerasi**, atau **steril** bisa bergeser nuansanya tergantung apakah kalimatnya membahas mesin, ekonomi, atau politik.",
    analogy:
      "Kata 'bunga' di kalimat bank berarti imbal hasil uang, bukan tanaman. Jadi selalu ganti kata di soal dengan opsi A-E lalu baca ulang seluruh kalimatnya!",
    coreRuleLatex: null,
    coreRuleNote: "Tes substitusi konteks: masukkan kata pilihanmu ke posisi kata asli, lalu cek apakah makna & kelas katanya (kata benda/kerja/sifat) tetap pas.",
    workedExample: {
      prompt: "Kalimat: 'Tim melakukan **kalibrasi** sensor sebelum mengambil data lapangan.' Makna paling dekat adalah...",
      steps: [
        {
          title: "Amati petunjuk konteks di sekitarnya",
          detail: "Ada `sensor` dan `sebelum mengambil data` → artinya memastikan alat ukur akurat sesuai standar.",
        },
        {
          title: "Uji substitusi makna",
          detail: "'penyetelan ketepatan alat ukur sesuai standar' masuk persis ke kelas kata & logika kalimat.",
        },
      ],
      takeaway: "Uji 2 hal sekaligus: kesesuaian MAKNA konteks dan kesesuaian KELAS KATA.",
    },
    commonTrap: {
      trapTitle: "Memilih kata yang terdengar ilmiah tetapi beda kelas kata atau meleset konteks",
      wrongWay: "Mengartikan 'kalibrasi' menjadi 'perbaikan kerusakan total' (padahal kalibrasi adalah penyetelan akurasi, bukan perbaikan alat rusak).",
      rightWay: "Tempel balik pilihan ke kalimat asli untuk merasakan apakah nuansanya persis sama.",
    },
    warmupCheck: {
      question: "Pada kalimat 'Kebijakan itu memicu **akselerasi** pembangunan desa', makna kata **akselerasi** paling dekat dengan...",
      options: [
        { key: "A", text: "Perlambatan", feedback: "Itu justru lawan katanya (deselerasi)." },
        { key: "B", text: "Percepatan", feedback: "Tepat sekali! `Akselerasi` dalam konteks pembangunan berarti percepatan." },
        { key: "C", text: "Pemerataan", feedback: "Pemerataan berarti pembagian merata, berbeda dengan laju kecepatan." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PPU_T2_ASSOC]: {
    skillNodeId: NODE_IDS.PPU_T2_ASSOC,
    estimatedMinutes: 3,
    whyHeadline: "Cara cepat memecahkan soal Asosiasi & Hubungan Antarparagraf di PPU",
    whyStory:
      "Soal asosiasi dan hubungan paragraf menguji **struktur relasi**, bukan hafalan. Jika Paragraf 1 memaparkan masalah dan Paragraf 2 memaparkan solusinya, hubungannya adalah **masalah → solusi**; jika Paragraf 2 merinci sebab dari Paragraf 1, hubungannya adalah **akibat → sebab**.",
    analogy:
      "Untuk soal analogi kata `Kompas : Arah = Termometer : ...`, buat satu kalimat jembatan: 'Kompas adalah alat untuk mengukur Arah' → maka 'Termometer adalah alat untuk mengukur Suhu'!",
    coreRuleLatex: null,
    coreRuleNote: "Selalu buat **kalimat jembatan 5 kata** yang persis sama arahnya (kiri → kanan) untuk menghindari jawaban terbalik.",
    workedExample: {
      prompt: "Tentukan pasangan yang setara dengan `Koki : Dapur`.",
      steps: [
        {
          title: "Buat kalimat jembatan kiri → kanan",
          detail: "'[Profesi] bekerja utama di [Tempat kerja]'.",
        },
        {
          title: "Terapkan kalimat persis sama ke opsi",
          detail: "`Apoteker : Apotek` cocok persis arahnya (jangan pilih `Ruang Operasi : Dokter` karena terbalik!).",
        },
      ],
      takeaway: "Kunci analogi & asosiasi = kalimat jembatan + arah kiri-ke-kanan yang konsisten.",
    },
    commonTrap: {
      trapTitle: "Memilih pasangan yang berhubungan, tetapi arah urutannya terbalik",
      wrongWay: "Menjawab `Koki : Dapur = Sekolah : Guru` (terbalik tempat : profesi!).",
      rightWay: "Pastikan urutan kiri → kanan persis sama (`Guru : Sekolah`).",
    },
    warmupCheck: {
      question: "Pasangan kata yang memiliki hubungan setara dan searah dengan `Peta : Navigasi` adalah...",
      options: [
        { key: "A", text: "Kamus : Arti kata", feedback: "Tepat! Peta dipakai untuk mencari navigasi; kamus dipakai untuk mencari arti kata." },
        { key: "B", text: "Menulis : Pena", feedback: "Arahnya terbalik! Seharusnya `Pena : Menulis`." },
        { key: "C", text: "Buku : Perpustakaan", feedback: "Hubungannya benda dan lokasi, bukan alat dan fungsinya." },
      ],
      correctKey: "A",
    },
  },
  // === 12 EXPANDED SNBT 2027 NODES ===
  [NODE_IDS.PK_T1_EXP]: {
    skillNodeId: NODE_IDS.PK_T1_EXP,
    estimatedMinutes: 4,
    whyHeadline: "Kenapa logaritma disebut pertanyaan terbalik dari pangkat (eksponen)?",
    whyStory:
      "Saat kamu melihat $2^5 = 32$, kamu tahu basis $2$ dipangkatkan $5$ menjadi $32$. Logaritma membalik pertanyaannya: '$2$ harus dipangkatkan berapa supaya jadi $32$?' Jawabannya ditulis ${}^2\\log 32 = 5$. Memahami hubungan bolak-balik ini membuatmu tidak pernah tertukar antara perkalian di dalam logaritma dan penjumlahan di luar logaritma.",
    analogy:
      "Pangkat itu ibarat menekan tombol lift naik $5$ lantai dari lantai dasar ($2^5 = 32$). Logaritma adalah membaca panel lantai untuk tahu berapa kali tombol itu ditekan (${}^2\\log 32 = 5$).",
    coreRuleLatex: "a^c = b \\iff {}^a\\log b = c, \\quad {}^a\\log(xy) = {}^a\\log x + {}^a\\log y",
    coreRuleNote:
      "Syarat wajib logaritma: basis $a > 0, a \\neq 1$ dan numerus $b > 0$. Jangan lupakan basis logaritma saat mengubah basis dengan aturan ${}^a\\log b = \\dfrac{\\log b}{\\log a}$.",
    workedExample: {
      prompt: "Tentukan nilai dari $\\dfrac{9^{2x}}{3^{2y}}$ jika diketahui $2x - y = 3$, serta hitung ${}^2\\log 12 + {}^2\\log 8 - {}^2\\log 3$.",
      steps: [
        {
          title: "Samakan basis eksponen menjadi 3",
          detail: "Karena $9 = 3^2$, ubah pembilang ke basis $3$ lalu kurangkan pangkatnya.",
          formulaLatex: "\\dfrac{(3^2)^{2x}}{3^{2y}} = 3^{4x - 2y} = 3^{2(2x - y)} = 3^6 = 729",
        },
        {
          title: "Gabungkan logaritma ber-basis sama ($2$)",
          detail: "Tambah di luar berarti kali di dalam; kurang di luar berarti bagi di dalam.",
          formulaLatex: "{}^2\\log\\left(\\dfrac{12 \\times 8}{3}\\right) = {}^2\\log 32 = 5",
        },
      ],
      takeaway: "Samakan basis lebih dulu untuk eksponen; gabungkan numerus dengan kali/bagi jika basis logaritma sudah sama.",
    },
    commonTrap: {
      trapTitle: "Mengira ${}^a\\log(x + y) = {}^a\\log x + {}^a\\log y$ atau mencoret basis berbeda",
      wrongWay: "Memecah ${}^2\\log(8 + 4)$ menjadi ${}^2\\log 8 + {}^2\\log 4$ (Salah besar!).",
      rightWay: "Penjumlahan logaritma menghasilkan PERKALIAN numerus: ${}^a\\log x + {}^a\\log y = {}^a\\log(x \\cdot y)$.",
    },
    warmupCheck: {
      question: "Berapakah nilai dari ${}^3\\log 18 - {}^3\\log 2$?",
      options: [
        { key: "A", text: "$2$", feedback: "Tepat! ${}^3\\log(18 / 2) = {}^3\\log 9 = 2$ karena $3^2 = 9$." },
        { key: "B", text: "$3$", feedback: "Belum tepat. Bagi numerus $18 \\div 2 = 9$, bukan $27$." },
        { key: "C", text: "$16$", feedback: "Pengurangan logaritma bukan mengurangi angkanya ($18 - 2$), melainkan membagi numerusnya." },
      ],
      correctKey: "A",
    },
  },
  [NODE_IDS.PK_T2_FUNC]: {
    skillNodeId: NODE_IDS.PK_T2_FUNC,
    estimatedMinutes: 4,
    whyHeadline: "Cara super cepat menaklukkan Fungsi Komposisi & Invers tanpa rumus panjang",
    whyStory:
      "Banyak peserta UTBK kehabisan waktu karena langsung mencari rumus aljabar $f^{-1}(x)$ padahal soal hanya menanyakan satu nilai angka! Pada fungsi satu-ke-satu, jika $f(a) = b$, maka $f^{-1}(b) = a$. Cukup balik input dan outputnya.",
    analogy:
      "Komposisi $(g \\circ f)(x)$ adalah jalur dua mesin berurutan: bahan mentah $x$ masuk ke mesin $f$, lalu hasilnya langsung disuapkan ke mesin $g$. Sedangkan $f^{-1}$ memutar ban berjalan ke arah mundur.",
    coreRuleLatex: "(g \\circ f)(x) = g(f(x)), \\quad f(a) = b \\iff f^{-1}(b) = a",
    coreRuleNote: "Pada invers komposisi, urutan mesin ikut terbalik: $(g \\circ f)^{-1}(x) = (f^{-1} \\circ g^{-1})(x)$.",
    workedExample: {
      prompt: "Diketahui $f(x) = 2x - 3$ dan $g(x) = \\dfrac{x + 1}{x - 2}$. Jika $(g \\circ f)^{-1}(k) = 2$, tentukan nilai $k$.",
      steps: [
        {
          title: "Balik persamaan invers ke bentuk fungsi asal",
          detail: "Jangan mencari invers rumus pecahan! Gunakan definisi $h^{-1}(k) = 2 \\iff k = h(2)$.",
          formulaLatex: "k = (g \\circ f)(2) = g(f(2))",
        },
        {
          title: "Evaluasi dari fungsi terdalam $f(2)$ lalu $g$",
          detail: "Hitung $f(2)$ lebih dulu, baru masukkan hasilnya ke $g$.",
          formulaLatex: "f(2) = 2(2) - 3 = 1 \\implies k = g(1) = \\dfrac{1 + 1}{1 - 2} = -2",
        },
      ],
      takeaway: "Saat ditanya nilai angka pada invers, selalu balik menjadi persamaan fungsi asal $f(\\text{hasil}) = \\text{asal}$.",
    },
    commonTrap: {
      trapTitle: "Tertukar urutan memasukkan $f(g(x))$ dengan $g(f(x))$",
      wrongWay: "Menghitung $f(g(2))$ saat soal menulis $(g \\circ f)(2)$.",
      rightWay: "Baca dari kanan ke kiri: huruf yang paling dekat dengan $(x)$ bekerja lebih dulu!",
    },
    warmupCheck: {
      question: "Jika $f(3x - 1) = 6x + 5$, berapakah nilai $f(2)$?",
      options: [
        { key: "A", text: "$11$", feedback: "Tepat! Agar $3x - 1 = 2$, pilih $x = 1$, sehingga $f(2) = 6(1) + 5 = 11$." },
        { key: "B", text: "$17$", feedback: "Kamu langsung memasukkan $2$ sebagai $x$, padahal $2$ adalah nilai dari $(3x - 1)$!" },
        { key: "C", text: "$7$", feedback: "Periksa lagi nilai $x$ yang membuat $3x - 1 = 2$." },
      ],
      correctKey: "A",
    },
  },
  [NODE_IDS.PK_T2_GEO]: {
    skillNodeId: NODE_IDS.PK_T2_GEO,
    estimatedMinutes: 4,
    whyHeadline: "Mengapa 80% soal Geometri PK cukup diselesaikan dengan 3 invarian sudut & Pythagoras?",
    whyStory:
      "Soal geometri UTBK jarang menuntut hafalan teorema rumit. Kunci utamanya adalah invarian: garis lurus selalu $180^{\\circ}$, segitiga selalu $180^{\\circ}$, sudut luar segitiga sama dengan jumlah dua sudut dalam yang tidak bersisian, dan dua garis sejajar menyalin sudut sehadap serta berseberangan.",
    analogy:
      "Seperti kabel paralel yang dipotong satu penggaris lurus: setiap belokan di atas selalu mencerminkan besar sudut yang persis sama atau berpelurus $180^{\\circ}$ di bawah.",
    coreRuleLatex: "\\angle A + \\angle B + \\angle C = 180^{\\circ}, \\quad a^2 + b^2 = c^2, \\quad L_{\\bigcirc} = \\pi r^2",
    coreRuleNote: "Hafalkan tripel Pythagoras cepat $(3,4,5)$, $(5,12,13)$, $(8,15,17)$, $(7,24,25)$ beserta kelipatannya agar hemat 30 detik per soal.",
    workedExample: {
      prompt: "Sebuah tangga bersandar pada dinding vertikal. Ujung bawah berjarak $6\\text{ m}$ dan puncak tangga setinggi $8\\text{ m}$. Jika garis luar segitiga berlanjut, tentukan panjang tangga dan sudut luar di puncak jika sudut dasar $53^{\\circ}$.",
      steps: [
        {
          title: "Kenali kelipatan tripel Pythagoras",
          detail: "$(6, 8, c)$ adalah $2 \\times (3, 4, 5)$, sehingga panjang sisi miring tangga langsung $10\\text{ m}$.",
          formulaLatex: "c = \\sqrt{6^2 + 8^2} = 10\\text{ m}",
        },
        {
          title: "Hitung sudut ketiga dan sudut luar",
          detail: "Karena dinding vertikal membentuk $90^{\\circ}$, sudut puncak = $180^{\\circ} - 90^{\\circ} - 53^{\\circ} = 37^{\\circ}$, dan sudut pelurusnya = $180^{\\circ} - 37^{\\circ} = 143^{\\circ}$.",
          formulaLatex: "\\angle_{\\text{luar}} = 90^{\\circ} + 53^{\\circ} = 143^{\\circ}",
        },
      ],
      takeaway: "Cek faktor skala tripel Pythagoras dan jumlah sudut $180^{\\circ}$ sebelum menghitung akar panjang.",
    },
    commonTrap: {
      trapTitle: "Tertukar jari-jari ($r$) dan diameter ($d$) atau alas miring sebagai tinggi segitiga",
      wrongWay: "Mengalikan luas segitiga dengan panjang sisi miring padahal tidak tegak lurus alas.",
      rightWay: "Tinggi wajib tegak lurus ($90^{\\circ}$) terhadap alas; pada lingkaran cek apakah soal memberi diameter atau jari-jari.",
    },
    warmupCheck: {
      question: "Dua sudut pada sebuah segitiga masing-masing besarnya $45^{\\circ}$ dan $65^{\\circ}$. Berapa besar sudut luar pada titik sudut ketiga?",
      options: [
        { key: "A", text: "$70^{\\circ}$", feedback: "Itu sudut dalamnya! Sudut luar adalah pelurusnya ($180^{\\circ} - 70^{\\circ}$)." },
        { key: "B", text: "$110^{\\circ}$", feedback: "Benar! Sudut luar segitiga = jumlah dua sudut dalam di seberangnya = $45^{\\circ} + 65^{\\circ} = 110^{\\circ}$." },
        { key: "C", text: "$135^{\\circ}$", feedback: "Periksa kembali penjumlahan $45^{\\circ} + 65^{\\circ}$." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PK_T3_STAT]: {
    skillNodeId: NODE_IDS.PK_T3_STAT,
    estimatedMinutes: 4,
    whyHeadline: "Prinsip Total Nilai pada Statistika, Diagram Venn & Matriks 2x2",
    whyStory:
      "Pada statistika, rata-rata bukanlah angka statis melainkan rasio Total Nilai dibagi Banyak Data ($\\bar{x} = \\dfrac{\\sum X}{n}$). Setiap kali ada data baru masuk atau keluar, ubah dulu $\\sum X$-nya. Pada himpunan, irisan dua kelompok tidak boleh dihitung dua kali (Inklusi-Eksklusi). Pada matriks $2 \\times 2$, syarat matriks tidak punya invers adalah determinan bernilai nol ($ad - bc = 0$).",
    analogy:
      "Bayangkan dua lingkaran karpet yang tumpang tindih di lantai: luas total lantai yang tertutup adalah luas karpet A + luas karpet B dikurangi area yang tertumpuk ganda (irisan).",
    coreRuleLatex: "n(A \\cup B) = n(A) + n(B) - n(A \\cap B), \\quad \\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc",
    coreRuleNote: "Jika setiap data dikali $p$ lalu ditambah $q$, rata-rata/median ikut dikali $p$ dan ditambah $q$, sedangkan jangkauan/simpangan hanya dikali $|p|$!",
    workedExample: {
      prompt: "Rata-rata nilai $4$ siswa adalah $75$. Setelah $1$ siswa baru masuk, rata-ratanya menjadi $78$. Berapakah nilai siswa baru tersebut, dan tentukan $x$ agar matriks $A = \\begin{pmatrix} 2x & 6 \\\\ 3 & 9 \\end{pmatrix}$ singular?",
      steps: [
        {
          title: "Kalikan rata-rata untuk mendapat Total Nilai ($\sum X$)",
          detail: "Total awal $4 \\times 75 = 300$. Total setelah 5 siswa $5 \\times 78 = 390$. Selisihnya adalah nilai siswa baru.",
          formulaLatex: "x_{\\text{baru}} = 390 - 300 = 90",
        },
        {
          title: "Matriks singular berarti determinan = 0",
          detail: "Kalikan diagonal utama dikurangi diagonal samping.",
          formulaLatex: "(2x)(9) - (6)(3) = 0 \\implies 18x = 18 \\implies x = 1",
        },
      ],
      takeaway: "Ubah selalu rata-rata menjadi Total = rata-rata x banyak data; syarat matriks singular ialah $ad = bc$.",
    },
    commonTrap: {
      trapTitle: "Menggeser jangkauan saat semua data ditambah konstanta k",
      wrongWay: "Mengira jika semua nilai ditambah $5$, jangkauannya ikut bertambah $5$.",
      rightWay: "Penambahan konstanta $k$ menggeser pusat data (mean/median), TIDAK mengubah penyebaran (jangkauan/simpangan baku).",
    },
    warmupCheck: {
      question: "Di kelas berjumlah 30 siswa, 18 suka Matematika, 15 suka Fisika, dan 5 tidak suka keduanya. Berapa siswa yang menyukai KEDUANYA?",
      options: [
        { key: "A", text: "$3$", feedback: "Kamu lupa mengurangi siswa yang tidak suka keduanya dari total $30$ menjadi $25$." },
        { key: "B", text: "$8$", feedback: "Tepat! Ada $30 - 5 = 25$ siswa di gabungan himpunan, sehingga irisan = $18 + 15 - 25 = 8$." },
        { key: "C", text: "$13$", feedback: "Terlalu besar; ingat $n(A \\cup B) = 30 - 5 = 25$." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PU_T2_DATA]: {
    skillNodeId: NODE_IDS.PU_T2_DATA,
    estimatedMinutes: 3,
    whyHeadline: "Membedakan Kenaikan Terbesar (Absolut) vs Persentase Kenaikan Tertinggi di Tabel PU",
    whyStory:
      "Soal analisis data di Penalaran Umum sering menjebak peserta dengan tabel angka penjualan atau jumlah penduduk. Selisih angka paling besar BELUM TENTU menghasilkan persentase kenaikan tertinggi karena persentase dibagi oleh nilai awal.",
    analogy:
      "Naik gaji Rp1 juta terasa biasa saja kalau gaji awalmu Rp20 juta ($5\\%$), tetapi sangat besar jika gaji awalmu Rp2 juta ($50\\%$).",
    coreRuleLatex: "\\%\\Delta = \\dfrac{\\text{Nilai Akhir} - \\text{Nilai Awal}}{\\text{Nilai Awal}} \\times 100\\%",
    coreRuleNote: "Untuk hitung cepat persentase dalam PU, gunakan pembulatan rasio atau perbandingan pecahan benchmark ($\\frac{1}{2}=50\\%, \\frac{1}{3}\\approx 33{,}3\\%, \\frac{1}{4}=25\\%$).",
    workedExample: {
      prompt: "Produk A naik dari 100 ke 140 unit, sedangkan Produk B naik dari 200 ke 260 unit. Manakah persentase kenaikannya lebih tinggi?",
      steps: [
        {
          title: "Bandingkan rasio selisih terhadap basis awal",
          detail: "Produk A naik $40/100 = 40\\%$. Produk B naik $60/200 = 30\\%$.",
          formulaLatex: "\\%\\Delta_A = 40\\% > \\%\\Delta_B = 30\\%",
        },
        {
          title: "Cek kalimat pertanyaan dengan teliti",
          detail: "Jika ditanya jumlah selisih unit, B menang (60 vs 40). Jika ditanya persentase kenaikan, A menang (40% vs 30%).",
          formulaLatex: "\\text{Selisih unit } B > A, \\text{ namun } \\%\\Delta A > B",
        },
      ],
      takeaway: "Selalu periksa kata kunci soal: 'jumlah/selisih terbanyak' vs 'persentase/rasio kenaikan tertinggi'.",
    },
    commonTrap: {
      trapTitle: "Membagi selisih dengan nilai akhir alih-alih nilai tahun awal",
      wrongWay: "Menghitung kenaikan $100 \\to 150$ sebagai $50/150 = 33\\%$.",
      rightWay: "Penyebut persen perubahan SELALU nilai tahun/kondisi awal ($50/100 = 50\\%$).",
    },
    warmupCheck: {
      question: "Harga paket tryout turun dari Rp100.000 menjadi Rp80.000, lalu bulan berikutnya naik 25% menjadi Rp100.000 lagi. Mengapa persen turun (20%) berbeda dengan persen naik (25%)?",
      options: [
        { key: "A", text: "Karena nilai awal (penyebut) yang dipakai sebagai pembanding berubah dari 100.000 menjadi 80.000.", feedback: "Tepat sekali! Penurunan 20.000 diukur terhadap 100.000 (20%), sedangkan kenaikan 20.000 diukur terhadap 80.000 (25%)." },
        { key: "B", text: "Karena persentase kenaikan selalu lebih besar 5% daripada penurunan.", feedback: "Tidak ada aturan +5%; semua bergantung pada besarnya nilai basis pembagi." },
        { key: "C", text: "Karena perhitungan pajak tidak dimasukkan.", feedback: "Tidak ada kaitan dengan pajak." },
      ],
      correctKey: "A",
    },
  },
  [NODE_IDS.PU_T3_ANAL]: {
    skillNodeId: NODE_IDS.PU_T3_ANAL,
    estimatedMinutes: 4,
    whyHeadline: "Strategi Anti-Pusing Menaklukkan Soal Posisi, Urutan & Meja Bundar",
    whyStory:
      "Kesalahan terbesar saat mengerjakan penalaran analitik bukanlah tidak pintar logika, melainkan mencoba membayangkan semua kemungkinan di kepala. Tuliskan slot urutan $1-2-3-4-5$, lalu kunci syarat paling ketat (seperti posisi tetap atau dua orang wajib berdampingan) lebih dulu sebelum menyisipkan syarat relatif ('A lebih dulu daripada B').",
    analogy:
      "Menyusun puzzle kotak lebih mudah jika bagian pinggir dan sudut yang bentuknya pasti dipasang lebih dulu sebelum mengisi potongan tengah yang bebas.",
    coreRuleLatex: "(n - 1)! \\quad (\\text{susunan siklis/meja melingkar})",
    coreRuleNote: "Pada posisi melingkar berhadap-hadapan untuk 6 kursi, kursi $1$ berhadapan dengan $4$, kursi $2$ berhadapan dengan $5$, dst.",
    workedExample: {
      prompt: "Lima pelari P, Q, R, S, T finis berurutan. Q finis tepat sebelum R. P finis sebelum Q tetapi setelah T. S bukan di urutan terakhir. Tentukan urutan yang pasti.",
      steps: [
        {
          title: "Satukan blok terikat lebih dulu",
          detail: "'Q tepat sebelum R' membentuk pasangan terikat $[Q, R]$.",
          formulaLatex: "T < P < [Q, R]",
        },
        {
          title: "Place S berdasarkan batas 'bukan terakhir'",
          detail: "Karena sudah ada 4 pelari berurutan $T - P - Q - R$ dan $S$ bukan urutan ke-5, maka $R$ wajib di posisi ke-5 dan $S$ di antara slot sebelum $R$.",
          formulaLatex: "\\text{Juara 1 tidak mungkin } Q, R, P, \\text{ dan urutan } 5 = R",
        },
      ],
      takeaway: "Visualisasikan slot bernomor dan ikat huruf yang memiliki syarat 'tepat di sebelah'.",
    },
    commonTrap: {
      trapTitle: "Mengira 'A sebelum B' berarti 'A TEPAT sebelum B' (berdampingan)",
      wrongWay: "Memaksa A dan B tidak boleh dipisahkan orang lain padahal tidak ada kata 'tepat'.",
      rightWay: "'A sebelum B' hanya mengunci urutan ($A < B$); masih boleh ada elemen lain di tengahnya kecuali ada kata 'tepat' atau 'langsung'.",
    },
    warmupCheck: {
      question: "Enam kursi A, B, C, D, E, F mengelilingi meja bundar merata. B duduk di seberang E, dan C duduk tepat di kanan E. Kursi mana yang pasti tidak bisa ditempati B jika kita jadikan E posisi jam 6?",
      options: [
        { key: "A", text: "Posisi jam 12", feedback: "Salah; kalau E di jam 6, seberangnya justru jam 12 (tempat duduk B)." },
        { key: "B", text: "Posisi jam 3", feedback: "Benar! B wajib berada di jam 12 (seberang E), sehingga jam 3 mustahil ditempati B." },
        { key: "C", text: "Semua posisi masih mungkin bersamaan", feedback: "Jika E sudah dikunci di jam 6, posisi B terkunci di jam 12." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PM_T2_ARIT]: {
    skillNodeId: NODE_IDS.PM_T2_ARIT,
    estimatedMinutes: 4,
    whyHeadline: "Aturan Emas Aritmetika Sosial: Beda Harga Beli, Harga Jual, Diskon & Bunga",
    whyStory:
      "Dalam soal Penalaran Matematika bertema jual-beli, kuncinya hanya satu: tahu persis mana yang menjadi **basis 100%**. Persentase untung atau rugi SELALU mengacu ke **Harga Beli (Modal)**, sedangkan diskon selalu memotong **Harga Label (Awal)**.",
    analogy:
      "Jika harga barang setelah diskon $20\\%$ menjadi Rp160.000, itu bukan berarti harga aslinya Rp160.000 + $20\\%$ dari Rp160.000. Nilai Rp160.000 mewakili porsi $80\\%$, jadi harga aslinya adalah $\\dfrac{100}{80} \\times 160.000 = 200.000$.",
    coreRuleLatex: "H_{\\text{jual}} = H_{\\text{beli}} \\cdot (1 \\pm \\%U), \\quad M_t = M_0(1 + i)^t",
    coreRuleNote: "Neto = Bruto - Tara. Tara biasanya dinyatakan dalam persen terhadap Bruto (berat kotor kemasan).",
    workedExample: {
      prompt: "Pedagang menjual jaket Rp276.000 dan memperoleh keuntungan 15%. Tentukan modal pembelian jaket tersebut.",
      steps: [
        {
          title: "Tetapkan modal beli sebagai 100%",
          detail: "Karena untung $15\\%$, harga jual mewakili $100\\% + 15\\% = 115\\%$ dari modal.",
          formulaLatex: "1{,}15 \\times H_{\\text{beli}} = 276.000",
        },
        {
          title: "Bagi ke arah modal awal",
          detail: "Bagi $276.000$ dengan $1{,}15$ (atau $\\frac{23}{20}$).",
          formulaLatex: "H_{\\text{beli}} = 276.000 \\times \\dfrac{20}{23} = 12.000 \\times 20 = \\text{Rp}240.000",
        },
      ],
      takeaway: "Saat mencari nilai SEBELUM untung atau SEBELUM diskon, selalu BAGI dengan faktor $(1 \\pm r)$.",
    },
    commonTrap: {
      trapTitle: "Mengalikan langsung harga akhir dengan (1 - untung%) untuk mencari modal",
      wrongWay: "Menghitung modal = $276.000 \\times (1 - 0{,}15) = 234.600$ (Salah!).",
      rightWay: "Dari modal ke harga jual dikali $(1 + r)$; dari harga jual balik ke modal WAJIB dibagi $(1 + r)$.",
    },
    warmupCheck: {
      question: "Setelah didiskon 20%, harga tas menjadi Rp240.000. Berapakah harga label sebelum diskon?",
      options: [
        { key: "A", text: "Rp288.000", feedback: "Salah! Kamu menambahkan 20% dari Rp240.000, padahal Rp240.000 adalah 80% harga awal." },
        { key: "B", text: "Rp300.000", feedback: "Tepat! $80\\% \\times \\text{Awal} = 240.000 \\implies \\text{Awal} = 240.000 / 0{,}8 = \\text{Rp}300.000$." },
        { key: "C", text: "Rp260.000", feedback: "Cek kembali perhitungan pembagian dengan $0{,}8$." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PM_T3_GEOM]: {
    skillNodeId: NODE_IDS.PM_T3_GEOM,
    estimatedMinutes: 4,
    whyHeadline: "Memecahkan Soal Bangun Ruang & Trigonometri Kontekstual di PM dengan Rasio Faktor",
    whyStory:
      "Soal Penalaran Matematika sering mengemas tangki air, tenda kerucut, atau tinggi menara dengan perbandingan sisi atau sudut elevasi. Jika soal memberi perbandingan dimensi $p:l:t = 3:2:1$, langsung tulis $p=3k, l=2k, t=k$ lalu substitusi ke rumus volume/luas agar hanya tersisa satu variabel $k$.",
    analogy:
      "Sebuah akuarium dan miniaturnya punya perbandingan bentuk sama, hanya skalanya dikalikan $k$. Untuk panjang dikali $k$, luas dikali $k^2$, dan volume air di dalamnya dikali $k^3$!",
    coreRuleLatex: "V_{\\text{tabung}} = \\pi r^2 t, \\quad V_{\\text{kerucut/limas}} = \\dfrac{1}{3} L_{\\text{alas}} t, \\quad \\tan \\theta = \\dfrac{\\text{depan}}{\\text{samping}}",
    coreRuleNote: "Ingat konversi volume kunci UTBK: $1\\text{ dm}^3 = 1\\text{ liter} = 1.000\\text{ cm}^3$, dan $1\\text{ m}^3 = 1.000\\text{ liter}$.",
    workedExample: {
      prompt: "Sebuah bak balok memiliki rasio panjang : lebar : tinggi $= 4 : 3 : 2$ dengan volume $192\\text{ liter}$. Tentukan tinggi bak dalam cm.",
      steps: [
        {
          title: "Pasang faktor skala k",
          detail: "Misalkan $p = 4k, l = 3k, t = 2k$ (dalam dm karena $1\\text{ liter} = 1\\text{ dm}^3$).",
          formulaLatex: "V = (4k)(3k)(2k) = 24k^3 = 192",
        },
        {
          title: "Cari k dan konversi ke satuan target",
          detail: "$k^3 = 192/24 = 8 \\implies k = 2\\text{ dm}$. Maka $t = 2k = 4\\text{ dm} = 40\\text{ cm}$.",
          formulaLatex: "k = 2 \\implies t = 4\\text{ dm} = 40\\text{ cm}",
        },
      ],
      takeaway: "Tuliskan satuan ($\\text{dm}^3$ vs $\\text{cm}^3$) sebelum menyamakan volume dengan angka perbandingan.",
    },
    commonTrap: {
      trapTitle: "Lupa pangkat 3 pada faktor skala k saat mencari volume dari rasio sisi",
      wrongWay: "Mengira $(4k)(3k)(2k) = 24k$ sehingga $k = 8$.",
      rightWay: "Tiga dimensi yang dikalikan memberi $k^3$, dan ingat $1\\text{ m}^3 = 1.000\\text{ liter}$.",
    },
    warmupCheck: {
      question: "Jika jari-jari tabung diperbesar menjadi 2 kali lipat sementara tingginya tetap, volume tabung menjadi berapa kali semula?",
      options: [
        { key: "A", text: "$2$ kali", feedback: "Salah! Dalam $V = \\pi r^2 t$, jari-jari $r$ berpangkat dua." },
        { key: "B", text: "$4$ kali", feedback: "Tepat! $(2r)^2 = 4r^2$, sehingga volume berlipat $4$ kali." },
        { key: "C", text: "$8$ kali", feedback: "$8$ kali terjadi jika tinggi ikut berlipat 2 kali bersama jari-jari." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PBM_T2_KONJ]: {
    skillNodeId: NODE_IDS.PBM_T2_KONJ,
    estimatedMinutes: 3,
    whyHeadline: "Peta Konjungsi UTBK & Aturan Kata Baku EYD V yang Paling Sering Menggugurkan Peserta",
    whyStory:
      "Dalam PBM, perbedaan antara **sedangkan** dan **sementara itu**, atau **meskipun** dan **namun**, bukan sekadar masalah selera telinga! Bahasa Indonesia membagi konjungsi menjadi **intrakalimat** (menghubungkan bagian di dalam 1 kalimat) dan **antarkalimat** (berdiri di awal kalimat baru dengan tanda koma wajib setelahnya).",
    analogy:
      "Konjungsi antarkalimat (*Namun, Oleh karena itu, Akan tetapi, Selain itu*) itu seperti lampu sein saat belok di persimpangan baru: harus berdiri setelah titik (awal kalimat) dan langsung diikuti tanda koma!",
    coreRuleLatex: null,
    coreRuleNote:
      "Pasangan korelatif wajib hafal: `baik ... maupun`, `bukan ... melainkan`, `tidak ... tetapi`, `sedemikian ... sehingga`, `antara ... dan`. Kata baku favorit: `sistem`, `praktik`, `risiko`, `analisis`, `kualitas`, `mengubah`, `memengaruhi`, `memerhatikan`.",
    workedExample: {
      prompt: "Perbaiki kalimat: 'Namun demikian data tersebut masih diragukan, dikarenakan metode survei belum merata.'",
      steps: [
        {
          title: "Gunakan konjungsi antarkalimat yang baku dan berkoma",
          detail: "'Namun demikian' tidak baku (campuran 'namun' dan 'meskipun demikian'). Gunakan 'Meskipun demikian,' atau 'Namun,'.",
          formulaLatex: null,
        },
        {
          title: "Ganti bentuk tidak baku 'dikarenakan'",
          detail: "Dalam kalimat formal UTBK, gunakan 'karena' atau 'disebabkan oleh', bukan 'dikarenakan'.",
          formulaLatex: null,
        },
      ],
      takeaway: "'Namun,' setelah titik; ', sedangkan' di tengah kalimat; hindari 'dikarenakan' maupun pasangan salah 'bukan ... tetapi'.",
    },
    commonTrap: {
      trapTitle: "Menaruh 'Sedangkan' di awal kalimat atau memakai ', namun' di tengah kalimat tanpa klausa seimbang",
      wrongWay: "Menulis 'Bukan dia yang bersalah, tetapi adiknya.' atau 'Sedangkan jumlah peserta terus naik.' di awal kalimat.",
      rightWay: "Pakai pasangan `bukan ... melainkan` dan `tidak ... tetapi`; pakai `Namun,` atau `Sementara itu,` untuk awal kalimat.",
    },
    warmupCheck: {
      question: "Manakah penggunaan kata hubung dan kata baku yang TEPAT sesuai EYD V & KBBI?",
      options: [
        { key: "A", text: "Sistem praktik di klinik itu sudah diubah demi mengurangi risiko.", feedback: "Tepat sekali! `Sistem`, `praktik`, `diubah`, dan `risiko` seluruhnya baku." },
        { key: "B", text: "Sistim praktek di klinik itu sudah dirubah demi mengurangi resiko.", feedback: "Empat kata sekaligus tidak baku (`sistim`, `praktek`, `dirubah`, `resiko`)." },
        { key: "C", text: "Sedangkan, praktik klinik itu harus dirubah secepatnya.", feedback: "`Sedangkan` tidak boleh menjadi konjungsi antarkalimat dengan koma di depan." },
      ],
      correctKey: "A",
    },
  },
  [NODE_IDS.PBM_T3_WAC]: {
    skillNodeId: NODE_IDS.PBM_T3_WAC,
    estimatedMinutes: 3,
    whyHeadline: "Trik Menulis Judul Sesuai EYD V, Mendeteksi Kalimat Sumbang & Menyusun Paragraf Padu",
    whyStory:
      "Soal Wacana di PBM menilai kemampuanmu melihat arsitektur teks. Kalimat padu selalu punya kata rujukan atau pengulangan kata kunci dari kalimat sebelumnya (kohesi). Kalimat sumbang melompat membahas subtopik lain di tengah paragraf.",
    analogy:
      "Paragraf itu seperti gerbong kereta satu jurusan. Jika semua gerbong mengangkut informasi 'manfaat kompos', lalu tiba-tiba gerbong ke-4 membahas 'harga semen impor', itulah kalimat sumbang.",
    coreRuleLatex: null,
    coreRuleNote:
      "Aturan Judul EYD V: huruf pertama setiap kata ditulis KAPITAL, KECUALI kata tugas/depan/penghubung pendek (`di, ke, dari, pada, dalam, yang, dan, atau, untuk, sebagai, terhadap`) jika TIDAK berada di posisi paling awal atau paling akhir judul.",
    workedExample: {
      prompt: "Tentukan penulisan judul karangan yang tepat menurut EYD V untuk: 'dampak perubahan iklim terhadap ketahanan pangan di indonesia'.",
      steps: [
        {
          title: "Kapitalkan kata benda, kerja, sifat, dan nama geografis",
          detail: "`Dampak`, `Perubahan`, `Iklim`, `Ketahanan`, `Pangan`, dan `Indonesia` wajib kapital.",
          formulaLatex: null,
        },
        {
          title: "Kecilkan preposisi tengah (`terhadap`, `di`)",
          detail: "Karena `terhadap` dan `di` bukan kata pertama maupun terakhir judul, tetap huruf kecil.",
          formulaLatex: null,
        },
      ],
      takeaway: "Judul baku: 'Dampak Perubahan Iklim terhadap Ketahanan Pangan di Indonesia' (spesifik, tanpa tanda titik di akhir).",
    },
    commonTrap: {
      trapTitle: "Mengapitalkan kata 'Dan', 'Yang', 'Di', 'Untuk', 'Terhadap' di tengah judul atau memilih judul terlalu luas",
      wrongWay: "Memilih judul 'Strategi Efektif Untuk Menghadapi Perubahan Iklim.' (kata `Untuk` kapital dan ada tanda titik!).",
      rightWay: "Pastikan judul spesifik sesuai teks, bebas tanda titik akhir, dan preposisi tengah memakai huruf kecil.",
    },
    warmupCheck: {
      question: "Manakah penulisan judul karangan nonfiksi yang BENAR sesuai EYD V?",
      options: [
        { key: "A", text: "Pengaruh Penggunaan Pupuk Organik Terhadap Hasil Panen Padi", feedback: "Kata depan `terhadap` di tengah judul seharusnya huruf kecil." },
        { key: "B", text: "Pengaruh Penggunaan Pupuk Organik terhadap Hasil Panen Padi", feedback: "Tepat! Seluruh kata isi kapital, sedangkan kata depan `terhadap` di tengah tetap huruf kecil tanpa titik akhir." },
        { key: "C", text: "Pengaruh penggunaan pupuk organik terhadap hasil panen padi.", feedback: "Salah gaya penulisan judul (tidak memakai Title Case serta diakhiri tanda titik)." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PPU_T3_PANDA]: {
    skillNodeId: NODE_IDS.PPU_T3_PANDA,
    estimatedMinutes: 4,
    whyHeadline: "Cara Memecahkan Bahasa Panda (Kriptografi Bahasa) dalam 30 Detik Tanpa Menebak",
    whyStory:
      "Bahasa Panda di PPU bukanlah hafalan kosakata, melainkan teka-teki irisan dan urutan kata. Hampir semua bahasa panda menaruh kata yang sama di dua kalimat contoh, lalu membalik atau mempertahankan struktur D-M (Diterangkan-Menerangkan) / M-D seperti bahasa Inggris atau Indonesia.",
    analogy:
      "Jika kamu dengar kalimat asing `kula mopi` = `rumah besar` dan `mopi biru` = `kamar besar` (misal `besar biru` vs `merah`), kata `mopi` muncul di kedua kalimat bersamaan dengan makna `besar`. Irisan kata langsung mengunci arti dan posisinya!",
    coreRuleLatex: null,
    coreRuleNote:
      "Tiga langkah wajib Bahasa Panda: (1) Iris dua kalimat yang berbagi 1 kata Indonesia -> kunci padanannya, (2) Cek urutan Inti + Keterangan (D-M atau terbalik M-D), (3) Cek apakah ada imbuhan/penanda jamak/waktu tetap.",
    workedExample: {
      prompt: "Diketahui `zora kilat` = `air bersih`, `nema kilat` = `udara bersih`, dan `nema doro` = `udara segar`. Terjemahkan `air segar`!",
      steps: [
        {
          title: "Iris kalimat 1 dan 2 untuk mengunci `kilat`",
          detail: "Keduanya mengandung kata `bersih` dan `kilat`. Maka `kilat` = `bersih` dan `zora` = `air`, `nema` = `udara`.",
          formulaLatex: null,
        },
        {
          title: "Cek urutan posisi (D-M atau M-D)",
          detail: "Karena `air` (`zora`) berada di depan `bersih` (`kilat`), urutannya sama seperti bahasa Indonesia (D-M). Maka `air segar` = `zora doro`.",
          formulaLatex: null,
        },
      ],
      takeaway: "Kunci irisan kata -> cek urutan D-M vs M-D -> susun ulang frasa target sesuai urutan bahasanya.",
    },
    commonTrap: {
      trapTitle: "Langsung mencocokkan kata ke-1 dengan kata ke-1 tanpa mengecek apakah urutan bahasanya terbalik (M-D)",
      wrongWay: "Mengira kata pertama di kalimat buatan selalu berarti kata pertama di terjemahan Indonesia.",
      rightWay: "Selalu buktikan posisi kata lewat irisan dua kalimat contoh lebih dulu!",
    },
    warmupCheck: {
      question: "Jika `baku teli` = `buku merah` dan `teli sora` = `baju merah` (perhatikan urutan kata!), maka arti dari `teli` adalah...",
      options: [
        { key: "A", text: "buku", feedback: "`buku` hanya muncul di kalimat pertama, tidak muncul di kalimat kedua." },
        { key: "B", text: "merah", feedback: "Tepat! `teli` dan `merah` adalah satu-satunya unsur yang muncul di kedua kalimat, meski posisi `teli` berpindah/menerangkan." },
        { key: "C", text: "baju", feedback: "`baju` hanya ada di kalimat kedua." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.LBI_T3_SASTRA]: {
    skillNodeId: NODE_IDS.LBI_T3_SASTRA,
    estimatedMinutes: 3,
    whyHeadline: "Menjawab Soal Cerpen/Novel Sastra & Fakta vs Opini di LBI tanpa Beda Tafsir",
    whyStory:
      "Soal teks sastra UTBK sering mengecoh karena peserta menafsirkan amanat terlalu jauh dari alur cerita. Pegang kaidah emasnya: amanat dan tema WAJIB terbukti oleh perubahan sikap tokoh atau konflik utama dalam kutipan, bukan nasihat moral umum dari luar cerita.",
    analogy:
      "Fakta ibarat foto kamera (bisa dicek benar-salah dengan angka atau bukti fisik), sedangkan opini ibarat komentar penonton yang memuat kata penilaian seperti *sebaiknya, luar biasa, memprihatinkan, berpotensi*.",
    coreRuleLatex: null,
    coreRuleNote:
      "Unsur intrinsik sastra yang wajib dibedakan: Watak tokoh (terlihat dari dialog/tindakan), Latar suasana/sosial, Sudut pandang (`aku` = orang pertama, `ia/nama` = orang ketiga serba tahu/terbatas), serta Amanat (pesan dari konflik).",
    workedExample: {
      prompt: "Kalimat A: 'Survei BPS mencatat inflasi pangan naik 2,4% bulan lalu.' Kalimat B: 'Kenaikan tersebut sangat memberatkan warga.' Manakah opini?",
      steps: [
        {
          title: "Uji keterukuran objektif",
          detail: "Kalimat A memiliki angka terverifikasi (`2,4%`) dari sumber data -> Fakta.",
          formulaLatex: null,
        },
        {
          title: "Deteksi penanda subjektivitas",
          detail: "Kalimat B memakai frasa penilai `sangat memberatkan` yang tidak terukur tunggal -> Opini.",
          formulaLatex: null,
        },
      ],
      takeaway: "Fakta bebas dari kata sifat penilaian pribadi; amanat sastra berpijak pada akibat konflik tokoh dalam kutipan.",
    },
    commonTrap: {
      trapTitle: "Mengira kalimat yang menyebut angka otomatis pasti Fakta",
      wrongWay: "Menganggap kalimat 'Kenaikan harga 2% ini jelas terlalu tinggi bagi rakyat' sebagai Fakta karena ada angka 2%.",
      rightWay: "Kehadiran frasa penilaian ('jelas terlalu tinggi', 'seharusnya') menjadikan kalimat tersebut tetap OPINI.",
    },
    warmupCheck: {
      question: "Manakah kalimat berikut yang merupakan FAKTA murni?",
      options: [
        { key: "A", text: "Desa Sukamaju seharusnya segera membangun embung penampung air.", feedback: "Ada kata `seharusnya` (saran/penilaian) -> ini opini." },
        { key: "B", text: "Penurunan debit sungai sebesar 18% di musim kemarau memaksa warga membeli air bersih.", feedback: "Tepat! Menyatakan kejadian dan data terukur tanpa kata sifat subjektif." },
        { key: "C", text: "Kondisi kekeringan tahun ini jauh lebih menyedihkan daripada sebelumnya.", feedback: "Frasa `jauh lebih menyedihkan` bersifat subjektif/emosional -> opini." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.LBE_T2_SYN]: {
    skillNodeId: NODE_IDS.LBE_T2_SYN,
    estimatedMinutes: 4,
    whyHeadline: "Trik Menjawab Soal Detail, Inferensi & Vocabulary Bahasa Inggris Tanpa Translate Semua Kata",
    whyStory:
      "Soal LBE UTBK sengaja memberi teks akademik panjang supaya waktumu habis kalau kamu baca dan terjemahkan kata demi kata. Kunci skor 750+ di LBE adalah memindai jangkar kalimatnya dulu (nama, angka, istilah unik), lalu mengunci apakah pertanyaan minta fakta eksplisit, pengecualian (EXCEPT/NOT), atau simpulan tipis yang pasti benar.",
    analogy:
      "Bayangkan mencari nama temanmu di daftar absensi berisi 100 baris. Kamu nggak membaca nama dari nomor 1 pelan-pelan, kan? Matamu langsung melompat ke huruf awalnya, baru baca satu baris itu dengan teliti!",
    coreRuleLatex: null,
    coreRuleNote:
      "Aturan Emas LBE Tier 2: (1) Detail Scanning -> cocokkan sinonim/parafrasa kalimat target; (2) EXCEPT/NOT -> tandai 4 opsi yang ADA di teks, pilih 1 yang bertentangan/tidak disebut; (3) Vocabulary -> tutup kata sulitnya lalu tebak rasa kalimat positif/negatif dari konteks.",
    workedExample: {
      prompt:
        "Teks: 'Unlike conventional plastic that persists for centuries, mycelium-based packaging decomposes within 45 days in backyard compost, though its production cost remains higher.' Soal: What can be inferred about mycelium packaging?",
      steps: [
        {
          title: "Kunci jangkar dan pembandingnya",
          detail: "Kalimat membandingkan kemasan konvensional vs mycelium dari sisi waktu urai (45 hari) dan biaya produksi (masih lebih mahal).",
          formulaLatex: null,
        },
        {
          title: "Tarik inferensi paling dekat (tanpa mengarang)",
          detail: "Kesimpulan sahih: ramah lingkungan lebih cepat terurai dibanding plastik biasa, namun belum lebih murah diproduksi.",
          formulaLatex: null,
        },
        {
          title: "Eliminasi opsi terlalu ekstrem",
          detail: "Hindari opsi berisi kata mutlak seperti 'always replaces plastic' atau 'impossible to manufacture'.",
          formulaLatex: null,
        },
      ],
      takeaway: "Inferensi bukan menebak masa depan; inferensi adalah fakta teks yang diucapkan ulang pakai kalimat lebih umum.",
    },
    commonTrap: {
      trapTitle: "Tertipu opsi yang kata-katanya persis di teks tapi hubungannya dibalik",
      wrongWay: "Menganggap jawaban pasti benar cuma karena semua kata bendanya persis muncul di paragraf 2.",
      rightWay: "Cek kata penghubung (`though`, `however`, `unlike`, `not`) sebelum memilih opsi.",
    },
    warmupCheck: {
      question:
        "Dalam kalimat 'The researcher noted that the new battery rarely overheats, unlike earlier models', apa makna frasa 'rarely overheats' dalam konteks?",
      options: [
        { key: "A", text: "Selalu dingin pada suhu apa pun", feedback: "Terlalu ekstrem (`rarely` bukan `never`)." },
        { key: "B", text: "Jarang mengalami panas berlebih dibanding model lama", feedback: "Tepat! Menjaga makna proporsional dari `rarely` tanpa melebih-lebihkan." },
        { key: "C", text: "Tidak pernah bisa rusak karena panas", feedback: "Melebih-lebihkan klaim teks." },
      ],
      correctKey: "B",
    },
  },
  [NODE_IDS.PPU_T0_KAL]: {
    skillNodeId: NODE_IDS.PPU_T0_KAL,
    estimatedMinutes: 3,
    whyHeadline: "Cara Cepat Membedah Kalimat Panjang Jadi Inti S-P-O-K dalam 5 Detik",
    whyStory:
      "Soal PPU dan PBM UTBK suka menyembunyikan inti kalimat di balik anak kalimat, keterangan tempat, atau apositif yang panjangnya sampai 3 baris. Begitu kamu bisa mencoret bagian penjelas tambahan di kepalamu, Subjek (pelaku) dan Predikat (aktivitas/kondisi inti) langsung kelihatan terang benderang.",
    analogy:
      "Kalimat panjang itu kayak burger berlapis-lapis: roti, keju, selada, saus. Tapi 'inti kalimat' hanyalah daging utamanya (`Siapa` + `melakukan apa`). Selada dan saus itu cuma keterangan tambahan.",
    coreRuleLatex: null,
    coreRuleNote:
      "Trik pangkas cepat: coret sementara kata yang diawali `yang...`, apositif di antara dua koma `..., ...,`, serta keterangan `di/pada/karena/ketika...` untuk menguji apakah kalimat masih punya Subjek + Predikat!",
    workedExample: {
      prompt:
        "Tentukan inti kalimat berikut: 'Di tengah persaingan global, para peneliti muda yang berasal dari beberapa universitas daerah berhasil merancang baterai ramah lingkungan.'",
      steps: [
        {
          title: "Buang keterangan awal & perluasan 'yang...'",
          detail: "'Di tengah persaingan global,' adalah Keterangan. 'yang berasal dari beberapa universitas daerah' adalah perluasan Subjek.",
          formulaLatex: null,
        },
        {
          title: "Ambil Subjek inti + Predikat + Objek inti",
          detail: "Yang tersisa rapi: 'Para peneliti muda berhasil merancang baterai.'",
          formulaLatex: null,
        },
        {
          title: "Cek maknanya tetap utuh",
          detail: "Kalimat ringkas ini sudah lengkap punya siapa (Subjek) dan melakukan apa (Predikat).",
          formulaLatex: null,
        },
      ],
      takeaway: "Pangkas keterangan depan dan anak kalimat 'yang...', lalu baca sisa Subjek + Predikatnya.",
    },
    commonTrap: {
      trapTitle: "Mengira kata pertama di kalimat panjang otomatis adalah Subjek",
      wrongWay: "Menganggap 'Di tengah persaingan global' sebagai Subjek karena posisinya paling depan.",
      rightWay: "Frasa berawalan preposisi (`di, pada, dalam, untuk, bagi`) hampir selalu Keterangan, bukan Subjek.",
    },
    warmupCheck: {
      question: "Manakah inti dari kalimat 'Menurut laporan tahunan, tingkat literasi digital siswa SMA di kota kecil meningkat tajam selama dua tahun terakhir'?",
      options: [
        { key: "A", text: "Laporan tahunan mencatat kota kecil.", feedback: "'Menurut laporan tahunan' adalah keterangan sumber, bukan subjek kalimat utama." },
        { key: "B", text: "Tingkat literasi digital siswa meningkat.", feedback: "Tepat sekali! Subjek intinya `tingkat literasi digital siswa` dan predikat intinya `meningkat`." },
        { key: "C", text: "Siswa SMA berada di kota kecil.", feedback: "Itu mengubah predikat asli (`meningkat`) yang ada di kalimat." },
      ],
      correctKey: "B",
    },
  },
};

export function getMicroLessonForNode(skillNodeId: string): MicroLessonContent | null {
  return MICRO_LESSONS_BY_NODE_ID[skillNodeId] ?? null;
}
