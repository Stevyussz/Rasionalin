"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckIcon,
  CloseIcon,
  UploadIcon,
  VaultIcon,
  VerifyIcon,
} from "@/components/icons/ArchitecturalIcons";
import { AppShell } from "@/components/layout/AppShell";
import { MathText } from "@/components/math/MathText";
import { CurriculumLibrarySection } from "@/components/vault/CurriculumLibrarySection";
import { PersonalNotesSection } from "@/components/vault/PersonalNotesSection";
import { SNBT_KNOWLEDGE_BASE } from "@/domain/snbt-knowledge-base";
import type {
  BrainVaultChunk,
  BrainVaultDocument,
  ExtractedVisionItem,
  SnbtSubtest,
  VaultDocumentType,
} from "@/domain/types";

interface QcQueueItem {
  item: ExtractedVisionItem;
  pageId: string;
  pageNumber: number;
  pageImageUrl: string;
  extractionConfidence: number | null;
  ocrWarnings: string[];
  batchApproveEligible: boolean;
}

interface SearchResult {
  chunk: BrainVaultChunk;
  cosineSimilarity: number;
  rrfScore: number;
}

async function sha256File(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function rasterizePdfToPngBlobs(
  file: File,
  onProgress: (msg: string) => void,
): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  if (doc.numPages > 80) {
    throw new Error(`PDF memiliki ${doc.numPages} halaman; batas maksimal adalah 80 halaman.`);
  }

  const blobs: Blob[] = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    onProgress(`Memproses halaman ${p} dari ${doc.numPages} pada resolusi tajam 200 DPI...`);
    const page = await doc.getPage(p);
    const baseVp = page.getViewport({ scale: 1 });
    const targetScale = 200 / 72;
    const maxEdge = Math.max(baseVp.width, baseVp.height) * targetScale;
    const clampedScale = maxEdge > 2048 ? 2048 / Math.max(baseVp.width, baseVp.height) : targetScale;
    const vp = page.getViewport({ scale: clampedScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Kanvas browser tidak tersedia.");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal ekspor PNG."))), "image/png");
    });
    blobs.push(blob);
  }
  return blobs;
}

export function BrainVaultWorkspace() {
  const [activeTab, setActiveTab] = useState<"library" | "personal">("library");
  const [documents, setDocuments] = useState<BrainVaultDocument[]>([]);
  const [chunks, setChunks] = useState<BrainVaultChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<VaultDocumentType>("rumus_cepat");
  const [subtestHint, setSubtestHint] = useState<SnbtSubtest>("PK");
  const [uploadingStatus, setUploadingStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [qcQueue, setQcQueue] = useState<QcQueueItem[]>([]);
  const [qcIndex, setQcIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draftStem, setDraftStem] = useState("");
  const [draftMethod, setDraftMethod] = useState("");
  const [draftValidity, setDraftValidity] = useState("");
  const [qcActionBusy, setQcActionBusy] = useState(false);
  const [qcMessage, setQcMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Training Question & Solution Importer
  const [importJson, setImportJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const loadVault = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vault/documents");
      if (!res.ok) throw new Error("Gagal memuat catatan pribadi.");
      const json = (await res.json()) as {
        documents: BrainVaultDocument[];
        chunks: BrainVaultChunk[];
      };
      setDocuments(json.documents);
      setChunks(json.chunks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVault();
  }, [loadVault]);

  const loadQcQueue = useCallback(async (docId: string) => {
    setActiveDocId(docId);
    setQcMessage(null);
    setEditing(false);
    const res = await fetch(`/api/vault/documents/${docId}/qc-queue`);
    if (!res.ok) return;
    const json = (await res.json()) as { items: QcQueueItem[] };
    setQcQueue(json.items);
    setQcIndex(0);
    if (json.items[0]) {
      setDraftStem(json.items[0].item.stemMarkdown);
      setDraftMethod(json.items[0].item.methodLabel ?? "");
      setDraftValidity(json.items[0].item.validityConditions ?? "");
    }
  }, []);

  const currentQc = qcQueue[qcIndex] ?? null;

  useEffect(() => {
    if (!currentQc) return;
    setDraftStem(currentQc.item.stemMarkdown);
    setDraftMethod(currentQc.item.methodLabel ?? "");
    setDraftValidity(currentQc.item.validityConditions ?? "");
  }, [currentQc]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingStatus("Memeriksa berkas...");

    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const allowedMime = isPdf
        ? "application/pdf"
        : (file.type as "image/png" | "image/jpeg" | "image/webp");
      if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(allowedMime)) {
        throw new Error("Format berkas harus PDF, PNG, JPEG, atau WebP.");
      }

      const sha = await sha256File(file);
      const pageBlobs: Blob[] = isPdf
        ? await rasterizePdfToPngBlobs(file, setUploadingStatus)
        : [file];

      setUploadingStatus("Mendaftarkan catatan ke Brain Vault...");
      const initRes = await fetch("/api/vault/documents/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
          docType,
          originalFilename: file.name,
          mimeType: allowedMime,
          fileSizeBytes: file.size,
          sha256Hash: sha,
          pageCount: pageBlobs.length,
          subtestHint,
        }),
      });
      const initJson = (await initRes.json()) as {
        deduplicated?: boolean;
        document?: BrainVaultDocument;
        error?: string;
      };
      if (!initRes.ok || !initJson.document) {
        throw new Error(initJson.error ?? "Inisialisasi unggahan gagal.");
      }

      const doc = initJson.document;
      if (initJson.deduplicated) {
        setUploadingStatus(null);
        await loadVault();
        await loadQcQueue(doc.id);
        return;
      }

      for (let i = 0; i < pageBlobs.length; i += 1) {
        setUploadingStatus(`Mengunggah halaman ${i + 1} dari ${pageBlobs.length}...`);
        const fd = new FormData();
        fd.append("pageNumber", String(i + 1));
        fd.append(
          "file",
          pageBlobs[i],
          `page_${i + 1}.${isPdf ? "png" : file.name.split(".").pop() || "png"}`,
        );
        const upRes = await fetch(`/api/vault/documents/${doc.id}/upload-page`, {
          method: "POST",
          body: fd,
        });
        if (!upRes.ok) throw new Error(`Gagal mengunggah halaman ${i + 1}.`);
      }

      for (let start = 1; start <= pageBlobs.length; start += 3) {
        const batch = [start, start + 1, start + 2].filter((n) => n <= pageBlobs.length);
        setUploadingStatus(`Membaca rumus & teks halaman ${batch.join(", ")}...`);
        const extRes = await fetch(`/api/vault/documents/${doc.id}/extract-batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNumbers: batch }),
        });
        if (!extRes.ok) throw new Error(`Gagal mengekstrak halaman ${batch.join(", ")}.`);
      }

      setUploadingStatus(null);
      setTitle("");
      await loadVault();
      await loadQcQueue(doc.id);
    } catch (err) {
      setUploadingStatus(null);
      setUploadError(err instanceof Error ? err.message : "Proses unggah gagal.");
    }
  }

  const handleReviewItem = useCallback(
    async (action: "approved" | "rejected") => {
      if (!currentQc || qcActionBusy || !activeDocId) return;
      setQcActionBusy(true);
      setQcMessage(null);
      try {
        const res = await fetch(`/api/vault/qc-items/${currentQc.item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            patch: editing
              ? {
                  stemMarkdown: draftStem,
                  methodLabel: draftMethod || null,
                  validityConditions: draftValidity || null,
                }
              : undefined,
          }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Gagal memproses pemeriksaan.");

        setEditing(false);
        await loadVault();
        await loadQcQueue(activeDocId);
      } catch (err) {
        setQcMessage(err instanceof Error ? err.message : "Gagal menyimpan review.");
      } finally {
        setQcActionBusy(false);
      }
    },
    [
      currentQc,
      qcActionBusy,
      activeDocId,
      editing,
      draftStem,
      draftMethod,
      draftValidity,
      loadVault,
      loadQcQueue,
    ],
  );

  async function handleBatchApprove() {
    if (!activeDocId || qcActionBusy) return;
    setQcActionBusy(true);
    try {
      const res = await fetch(`/api/vault/documents/${activeDocId}/batch-approve`, {
        method: "POST",
      });
      const json = (await res.json()) as { approvedCount: number };
      setQcMessage(`${json.approvedCount} catatan dengan keyakinan tinggi otomatis disetujui.`);
      await loadVault();
      await loadQcQueue(activeDocId);
    } finally {
      setQcActionBusy(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!currentQc) return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
      if (isTyping) return;

      if (e.key === "Enter" || e.key.toLowerCase() === "a") {
        e.preventDefault();
        void handleReviewItem("approved");
      } else if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        setEditing((v) => !v);
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        void handleReviewItem("rejected");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentQc, handleReviewItem]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/vault/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const json = (await res.json()) as { results: SearchResult[] };
      setSearchResults(json.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function handleImportTrainingQuestions(e: React.FormEvent) {
    e.preventDefault();
    if (!importJson.trim() || importing) return;
    setImporting(true);
    setImportFeedback(null);
    try {
      const parsed = JSON.parse(importJson) as unknown;
      const payload = Array.isArray(parsed) ? { items: parsed } : parsed;
      const res = await fetch("/api/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        importedCount?: number;
        rejected?: Array<{ index: number; reason: string }>;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Impor soal gagal.");
      setImportFeedback(
        `Berhasil menambahkan ${json.importedCount ?? 0} soal & pembahasan ke bank latihan!` +
          (json.rejected?.length ? ` (${json.rejected.length} ditolak karena format/KaTeX.)` : ""),
      );
      setImportJson("");
    } catch (err) {
      setImportFeedback(
        err instanceof Error ? err.message : "Format JSON tidak valid. Periksa kembali tanda kutip.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Clean Editorial Header */}
        <header className="pb-4 border-b border-[var(--border-structural)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--olive-ink)]">
              <VaultIcon size={18} />
              <span>Brain Vault Pribadi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Catatan & Rumus Cepatmu</h1>
            <p className="text-sm font-semibold text-[var(--ink-secondary)] max-w-2xl">
              Unggah catatan bimbel atau bank soal PDF. Tutor AI akan memprioritaskan metode pribadimu setiap kali kamu bertanya.
            </p>
          </div>
          <div className="text-sm font-extrabold text-[var(--accent-text-on-secondary)] shrink-0">
            <span className="font-num text-xl mr-1">{SNBT_KNOWLEDGE_BASE.length}</span>
            topik UTBK · <span className="font-num">{chunks.length}</span> catatanmu
          </div>
        </header>

        {/* 2-Tab Switcher: Pustaka Materi UTBK vs Catatan & Upload Pribadi */}
        <div
          role="tablist"
          aria-label="Mode tampilan Brain Vault"
          className="inline-flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-structural)]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "library"}
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === "library"
                ? "bg-[var(--surface-elevated)] text-[var(--ink-primary)] shadow-sm border border-[var(--border-structural)]"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Pustaka Materi UTBK ({SNBT_KNOWLEDGE_BASE.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "personal"}
            onClick={() => setActiveTab("personal")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === "personal"
                ? "bg-[var(--surface-elevated)] text-[var(--ink-primary)] shadow-sm border border-[var(--border-structural)]"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Catatan &amp; Upload Pribadi ({chunks.length})
          </button>
        </div>

        {activeTab === "library" ? (
          <CurriculumLibrarySection />
        ) : (
          <div className="space-y-6">
        {/* Quick Personal Study Notes & AI Memory (Synced with /study & /tutor) */}
        <PersonalNotesSection />

        {/* Clean 3-Step Line (Zero Box Soup) */}
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-1 text-xs">
          {[
            { step: "1", title: "Unggah PDF / Foto", desc: "Foto catatan tulis tangan atau bank soal PDF." },
            { step: "2", title: "Cek Cepat 5 Detik", desc: "Pastikan rumus terbaca tepat sebelum disimpan." },
            { step: "3", title: "Diprioritaskan Tutor AI", desc: "Muncul otomatis saat kamu tanya atau minta petunjuk." },
          ].map((s) => (
            <li key={s.step} className="flex items-start gap-2.5">
              <span className="font-num font-bold text-base text-[var(--accent-primary)] leading-none mt-0.5">
                0{s.step}
              </span>
              <div>
                <div className="font-extrabold text-[var(--ink-primary)]">{s.title}</div>
                <div className="font-semibold text-[var(--ink-secondary)] mt-0.5">{s.desc}</div>
              </div>
            </li>
          ))}
        </ol>

        {/* Upload Zone */}
        <section className="card-tactile p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-base">Tambah Catatan atau Bank Soal Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="vault-title" className="text-xs font-extrabold block mb-1.5">
                Judul Catatan
              </label>
              <input
                id="vault-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Rumus Cepat Fungsi Kuadrat"
                className="input-tactile text-sm"
              />
            </div>

            <div>
              <label htmlFor="vault-doctype" className="text-xs font-extrabold block mb-1.5">
                Jenis Dokumen
              </label>
              <select
                id="vault-doctype"
                value={docType}
                onChange={(e) => setDocType(e.target.value as VaultDocumentType)}
                className="input-tactile text-sm"
              >
                <option value="rumus_cepat">Rumus Cepat</option>
                <option value="bank_soal_pdf">Bank Soal PDF</option>
                <option value="cheat_sheet">Ringkasan Konsep</option>
                <option value="tryout_archive">Arsip Tryout</option>
                <option value="screenshot">Foto / Tangkapan Layar</option>
              </select>
            </div>

            <div>
              <label htmlFor="vault-subtest" className="text-xs font-extrabold block mb-1.5">
                Subtes Utama
              </label>
              <select
                id="vault-subtest"
                value={subtestHint}
                onChange={(e) => setSubtestHint(e.target.value as SnbtSubtest)}
                className="input-tactile text-sm"
              >
                {["PK", "PU", "PM", "LBI", "LBE", "PBM", "PPU"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-structural)]">
            <p className="text-xs font-semibold text-[var(--ink-secondary)]">
              Mendukung PDF (maks 25 MB / 80 halaman) serta gambar PNG, JPG, atau WebP.
            </p>
            <label className="btn-primary cursor-pointer">
              <UploadIcon size={18} />
              <span>Pilih File PDF / Gambar</span>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>
          </div>

          {uploadingStatus && (
            <div className="p-3 rounded-xl border border-[var(--olive-border)] bg-[var(--olive-tint)] text-xs font-extrabold text-[var(--olive-ink)]">
              {uploadingStatus}
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl border border-[var(--coral-border)] bg-[var(--coral-tint)] text-xs font-bold text-[var(--coral-ink)]">
              {uploadError}
            </div>
          )}
        </section>

        {/* 5-Second Human QC Gate Panel */}
        {currentQc && (
          <section
            aria-label="Gerbang pemeriksaan cepat 5 detik"
            className="card-tactile border-[var(--accent-primary)] p-5 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-structural)] pb-3">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent-text-on-secondary)]">
                  Cek Cepat 5 Detik · Halaman <span className="font-num">{currentQc.pageNumber}</span>
                </div>
                <p className="text-xs font-semibold text-[var(--ink-secondary)] mt-0.5">
                  Keyakinan: <strong className="font-num">{Math.round((currentQc.extractionConfidence ?? 0) * 100)}%</strong> ·{" "}
                  Format Rumus: {currentQc.item.katexValid ? "Valid" : "Perlu Sunting"}
                </p>
              </div>
              <button
                type="button"
                disabled={!qcQueue.some((q) => q.batchApproveEligible) || qcActionBusy}
                onClick={handleBatchApprove}
                className="btn-secondary text-xs"
              >
                Setujui Massal (&ge; 92% Aman)
              </button>
            </div>

            {currentQc.ocrWarnings.length > 0 && (
              <div className="p-3 rounded-xl border border-[var(--ochre-border)] bg-[var(--ochre-tint)] text-xs font-bold text-[var(--ochre-ink)]">
                Catatan pemeriksaan: {currentQc.ocrWarnings.join(" ")}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <div className="rounded-xl border border-[var(--border-structural)] bg-[var(--surface-canvas)] p-2">
                <img
                  src={currentQc.pageImageUrl}
                  alt={`Pindaian halaman ${currentQc.pageNumber}`}
                  className="w-full max-h-[420px] object-contain"
                />
              </div>

              <div className="space-y-3">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-extrabold block mb-1">Nama Metode / Rumus</label>
                      <input
                        type="text"
                        value={draftMethod}
                        onChange={(e) => setDraftMethod(e.target.value)}
                        className="input-tactile text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold block mb-1">Isi Catatan & LaTeX</label>
                      <textarea
                        rows={5}
                        value={draftStem}
                        onChange={(e) => setDraftStem(e.target.value)}
                        className="input-tactile font-mono-telemetry text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold block mb-1">Syarat Berlaku Rumus</label>
                      <input
                        type="text"
                        value={draftValidity}
                        onChange={(e) => setDraftValidity(e.target.value)}
                        className="input-tactile text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border-l-4 border-[var(--accent-primary)] pl-4 py-1 space-y-2">
                    <div className="text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                      {currentQc.item.subtestGuess} {draftMethod ? `· ${draftMethod}` : ""}
                    </div>
                    <div className="text-sm font-semibold leading-relaxed">
                      <MathText text={draftStem} />
                    </div>
                    {draftValidity && (
                      <p className="text-xs font-bold text-[var(--ochre-ink)] pt-2 border-t border-[var(--border-structural)]">
                        Syarat berlaku: {draftValidity}
                      </p>
                    )}
                  </div>
                )}

                {qcMessage && (
                  <p className="text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                    {qcMessage}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={qcActionBusy}
                    onClick={() => handleReviewItem("approved")}
                    className="btn-primary flex-1"
                  >
                    <CheckIcon size={16} />
                    <span>Simpan Catatan [Enter]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing((v) => !v)}
                    className="btn-secondary"
                  >
                    {editing ? "Pratinjau" : "Sunting [E]"}
                  </button>
                  <button
                    type="button"
                    disabled={qcActionBusy}
                    onClick={() => handleReviewItem("rejected")}
                    className="btn-secondary"
                  >
                    <CloseIcon size={15} />
                    <span>Tolak [R]</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Search & Notes Library */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-5 card-tactile p-5 space-y-3">
            <h2 className="font-bold text-base">Dokumen Unggahan</h2>
            {loading ? (
              <div className="h-32 rounded-xl bg-[var(--surface-secondary)]" />
            ) : error ? (
              <div className="text-xs font-bold text-[var(--coral-ink)]">{error}</div>
            ) : documents.length === 0 ? (
              <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                Belum ada file PDF atau foto yang diunggah.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-structural)]">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold truncate">{doc.title}</p>
                      <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                        <span className="font-num">{doc.pageCount}</span> halaman ·{" "}
                        {doc.status === "awaiting_qc"
                          ? "Menunggu cek cepat"
                          : doc.status === "indexed"
                            ? "Siap dipakai"
                            : doc.status}
                      </p>
                    </div>
                    {doc.status === "awaiting_qc" && (
                      <button
                        type="button"
                        onClick={() => loadQcQueue(doc.id)}
                        className="btn-olive text-xs min-h-[38px] shrink-0"
                      >
                        Cek Sekarang
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-7 card-tactile p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-base inline-flex items-center gap-2">
                <VaultIcon size={20} className="text-[var(--olive-ink)]" />
                <span>Cari Rumus & Catatan</span>
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                <VerifyIcon size={16} />
                Prioritas Pribadi
              </span>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari rumus cepat, pekerja berbalik nilai, atau kuantor..."
                className="input-tactile flex-1 text-sm"
              />
              <button type="submit" disabled={searching} className="btn-primary shrink-0">
                {searching ? "Mencari..." : "Cari"}
              </button>
            </form>

            <div className="divide-y divide-[var(--border-structural)]">
              {(searchResults
                ? searchResults.map((r) => ({ chunk: r.chunk, score: r.rrfScore }))
                : chunks.map((c) => ({ chunk: c, score: null }))
              ).map(({ chunk, score }) => (
                <article key={chunk.id} className="py-4 first:pt-1 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
                    <span className="text-[var(--accent-text-on-secondary)]">
                      {chunk.subtest ?? "UMUM"}
                      {chunk.methodLabel ? ` · ${chunk.methodLabel}` : ""}
                    </span>
                    {score !== null && (
                      <span className="font-num text-[var(--ink-muted)]">
                        Skor {score.toFixed(3)}
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-semibold leading-relaxed">
                    <MathText text={chunk.contentMarkdown} />
                  </div>

                  {chunk.validityConditions && (
                    <p className="text-xs font-bold text-[var(--ochre-ink)]">
                      Syarat berlaku: {chunk.validityConditions}
                    </p>
                  )}
                </article>
              ))}

              {searchResults && searchResults.length === 0 && (
                <p className="py-4 text-sm font-semibold text-[var(--ink-secondary)]">
                  Tidak ada catatan yang cocok dengan kata kunci tersebut.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Direct Training Question & Solution Importer (Ready for User's Custom Question Bank) */}
        <section className="card-tactile p-5 sm:p-6 space-y-3">
          <details>
            <summary className="font-display font-bold text-base cursor-pointer">
              Impor Bank Soal & Pembahasan Latih (JSON)
            </summary>
            <form onSubmit={handleImportTrainingQuestions} className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                Tempel array JSON berisi soal, 5 opsi A-E, kunci jawaban, dan pembahasan untuk langsung melatih bank soal Rasionalin (otomatis divalidasi KaTeX).
              </p>
              <textarea
                rows={4}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{"subtest":"PK","tier":"tier_1_core","stemMarkdown":"...","options":[{"key":"A","textMarkdown":"..."},...],"correctAnswerKey":"A","officialSolutionMarkdown":"..."}]'
                className="input-tactile font-mono-telemetry text-xs"
              />
              {importFeedback && (
                <div className="p-3 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] text-xs font-bold text-[var(--accent-text-on-secondary)]">
                  {importFeedback}
                </div>
              )}
              <button type="submit" disabled={importing || !importJson.trim()} className="btn-olive text-xs">
                {importing ? "Memvalidasi & Mengimpor..." : "Impor ke Bank Soal"}
              </button>
            </form>
          </details>
        </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
