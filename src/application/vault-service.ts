import crypto from "node:crypto";
import {
  getTrackForSubtest,
  type BrainVaultChunk,
  type BrainVaultDocument,
  type BrainVaultPage,
  type ExtractedVisionItem,
  type QcStatus,
  type QuestionEntity,
  type SnbtSubtest,
  type VaultDocumentType,
} from "@/domain/types";
import { NineRouterClient } from "@/infrastructure/ai/nine-router-client";
import { VisionExtractionPageSchema } from "@/infrastructure/ai/schemas";
import type { AppRepository } from "@/infrastructure/db/repository-port";
import { validateMarkdownWithKatex } from "@/infrastructure/sandbox/outer-verifier";
import {
  cropDiagramFromPagePng,
  getObjectStorage,
  validateFileMagicBytes,
  type SupportedMimeType,
} from "@/infrastructure/storage/object-storage";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PDF_PAGES = 80;
const BATCH_APPROVE_MIN_CONFIDENCE = 0.92;

export class VaultService {
  constructor(private readonly repo: AppRepository) {}

  async initUpload(params: {
    userId: string;
    title: string;
    docType: VaultDocumentType;
    originalFilename: string;
    mimeType: SupportedMimeType;
    fileSizeBytes: number;
    sha256Hash: string;
    pageCount: number;
    subtestHint: SnbtSubtest | null;
  }): Promise<{ deduplicated: boolean; document: BrainVaultDocument }> {
    const isPdf = params.mimeType === "application/pdf";
    const sizeCap = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (params.fileSizeBytes <= 0 || params.fileSizeBytes > sizeCap) {
      throw new Error(`Ukuran berkas melebihi batas (${Math.round(sizeCap / (1024 * 1024))} MB).`);
    }
    if (params.pageCount < 1 || params.pageCount > MAX_PDF_PAGES) {
      throw new Error(`Jumlah halaman harus antara 1 dan ${MAX_PDF_PAGES}.`);
    }

    const existing = await this.repo.findVaultDocumentByHash(params.userId, params.sha256Hash);
    if (existing && (existing.status === "indexed" || existing.status === "awaiting_qc")) {
      return { deduplicated: true, document: existing };
    }

    const docId = crypto.randomUUID();
    const now = new Date().toISOString();
    const doc: BrainVaultDocument = {
      id: docId,
      userId: params.userId,
      title: params.title.trim() || params.originalFilename,
      docType: params.docType,
      originalFilename: params.originalFilename,
      mimeType: params.mimeType,
      fileSizeBytes: params.fileSizeBytes,
      sha256Hash: params.sha256Hash,
      storageKey: `vault/${params.userId}/${docId}/source`,
      pageCount: params.pageCount,
      pagesProcessed: 0,
      status: "rasterizing",
      subtestHint: params.subtestHint,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.upsertVaultDocument(doc);
    return { deduplicated: false, document: doc };
  }

  async storePagePng(params: {
    userId: string;
    documentId: string;
    pageNumber: number;
    buffer: Buffer;
    declaredMime: SupportedMimeType;
  }): Promise<BrainVaultPage> {
    const doc = await this.repo.getVaultDocumentById(params.userId, params.documentId);
    if (!doc) throw new Error("Document not found.");

    if (!validateFileMagicBytes(params.buffer, params.declaredMime)) {
      throw new Error("Magic bytes berkas halaman tidak valid.");
    }

    const storage = getObjectStorage();
    const imageKey = `vault/${params.userId}/${params.documentId}/pages/page_${String(params.pageNumber).padStart(3, "0")}.png`;
    await storage.putObject(imageKey, params.buffer, params.declaredMime);

    const existing = await this.repo.getVaultPageByNumber(params.documentId, params.pageNumber);
    const now = new Date().toISOString();
    const page: BrainVaultPage = existing ?? {
      id: crypto.randomUUID(),
      documentId: params.documentId,
      pageNumber: params.pageNumber,
      imageStorageKey: imageKey,
      visionModelUsed: null,
      extractionConfidence: null,
      ocrWarnings: [],
      katexValid: false,
      qcStatus: "pending_review",
      items: [],
      retryCount: 0,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };
    page.imageStorageKey = imageKey;
    page.updatedAt = now;
    await this.repo.upsertVaultPage(page);

    return page;
  }

  async extractBatch(params: {
    userId: string;
    documentId: string;
    pageNumbers: number[];
  }): Promise<{ document: BrainVaultDocument; pages: BrainVaultPage[] }> {
    if (params.pageNumbers.length === 0 || params.pageNumbers.length > 3) {
      throw new Error("Batch ekstraksi dibatasi 1 hingga 3 halaman per panggilan.");
    }

    const doc = await this.repo.getVaultDocumentById(params.userId, params.documentId);
    if (!doc) throw new Error("Document not found.");

    doc.status = "extracting";
    doc.updatedAt = new Date().toISOString();
    await this.repo.upsertVaultDocument(doc);

    const storage = getObjectStorage();
    const routerClient = new NineRouterClient(this.repo);
    const processedPages: BrainVaultPage[] = [];

    for (const pageNum of params.pageNumbers) {
      const page = await this.repo.getVaultPageByNumber(doc.id, pageNum);
      if (!page) {
        throw new Error(`Halaman ${pageNum} belum diunggah.`);
      }

      const pagePngBuffer = await storage.getObjectBuffer(page.imageStorageKey);
      const base64DataUrl = `data:image/png;base64,${pagePngBuffer.toString("base64")}`;

      const aiRes = await routerClient.invokeStructuredJson({
        taskId: "vision_pdf_extract",
        userId: params.userId,
        schema: VisionExtractionPageSchema,
        schemaName: "vision_extraction_page",
        jsonSchema: { type: "object" },
        messages: [
          {
            role: "system",
            content:
              "Ekstrak soal UTBK-SNBT, rumus cepat, atau catatan belajar dari gambar halaman ini menjadi JSON terstruktur dengan LaTeX valid ($...$ / $$...$$), bounding box diagram 0..1000, serta validity_conditions bila ada rumus cepat.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Dokumen: ${doc.title} (${doc.docType}), petunjuk subtes: ${doc.subtestHint ?? "otomatis"}, halaman ${pageNum}.`,
              },
              {
                type: "image_url",
                image_url: { url: base64DataUrl, detail: "high" },
              },
            ],
          },
        ],
      });

      const nowIso = new Date().toISOString();

      if (aiRes.ok && aiRes.data) {
        const items: ExtractedVisionItem[] = [];
        let pageKatexValid = true;

        for (let idx = 0; idx < aiRes.data.items.length; idx += 1) {
          const rawItem = aiRes.data.items[idx];
          let diagramUrl: string | null = null;
          let diagramAlt: string | null = null;

          if (rawItem.diagrams.length > 0) {
            const firstDiag = rawItem.diagrams[0];
            const croppedBuf = await cropDiagramFromPagePng(pagePngBuffer, firstDiag.box_2d, 12);
            if (croppedBuf) {
              const cropKey = `vault/${params.userId}/${doc.id}/crops/p${pageNum}_i${idx}.png`;
              await storage.putObject(cropKey, croppedBuf, "image/png");
              diagramUrl = await storage.getAccessUrl(cropKey);
              diagramAlt = firstDiag.alt_text_id;
            }
          }

          const combinedTex = [
            rawItem.stem_markdown,
            rawItem.stem_latex ? `$$${rawItem.stem_latex}$$` : "",
            ...rawItem.options.map((o) => o.text_markdown),
          ].join("\n");
          const katexRes = validateMarkdownWithKatex(combinedTex);
          if (!katexRes.valid) pageKatexValid = false;

          items.push({
            id: crypto.randomUUID(),
            itemType: rawItem.item_type,
            subtestGuess: rawItem.subtest_guess,
            tierGuess: rawItem.tier_guess,
            conceptTag: rawItem.concept_tag,
            methodLabel: rawItem.method_label,
            validityConditions: rawItem.validity_conditions,
            stemMarkdown: rawItem.stem_markdown,
            stemLatex: rawItem.stem_latex,
            passageText: rawItem.passage_text,
            options: rawItem.options.map((o) => ({
              key: o.key,
              textMarkdown: o.text_markdown,
              latex: o.latex,
            })),
            correctAnswerKey: rawItem.correct_answer_key,
            officialSolutionMarkdown: rawItem.official_solution_markdown,
            diagramAssetUrl: diagramUrl,
            diagramAltText: diagramAlt,
            katexValid: katexRes.valid,
            katexError: katexRes.error ?? null,
            qcStatus: "pending_review",
          });
        }

        page.visionModelUsed = aiRes.modelUsed;
        page.extractionConfidence = aiRes.data.extraction_confidence;
        page.ocrWarnings = aiRes.data.ocr_warnings;
        page.katexValid = pageKatexValid;
        page.items = items;
        page.qcStatus = "pending_review";
        page.updatedAt = nowIso;
      } else {
        // Honest manual-QC queue fallback when 9router Vision is offline
        page.visionModelUsed = "manual-qc-fallback";
        page.extractionConfidence = 0.5;
        page.ocrWarnings = [
          "Gateway 9router Vision belum terhubung: sunting atau isi konten halaman ini secara manual di QC Gate.",
        ];
        page.katexValid = true;
        page.qcStatus = "pending_review";
        page.items = [
          {
            id: crypto.randomUUID(),
            itemType: doc.docType === "rumus_cepat" ? "rumus_cepat" : "concept_note",
            subtestGuess: doc.subtestHint ?? "PK",
            tierGuess: "tier_1_core",
            conceptTag: doc.title,
            methodLabel: `${doc.title} (Halaman ${pageNum})`,
            validityConditions:
              doc.docType === "rumus_cepat"
                ? "Verifikasi syarat berlaku rumus cepat sebelum menyetujui."
                : null,
            stemMarkdown: `Catatan dari ${doc.title} halaman ${pageNum}. Sunting teks atau rumus LaTeX ($...$) sesuai gambar sumber di sisi kiri.`,
            stemLatex: null,
            passageText: null,
            options: [],
            correctAnswerKey: null,
            officialSolutionMarkdown: null,
            diagramAssetUrl: await storage.getAccessUrl(page.imageStorageKey),
            diagramAltText: `Halaman ${pageNum} dari ${doc.title}`,
            katexValid: true,
            katexError: null,
            qcStatus: "pending_review",
          },
        ];
        page.updatedAt = nowIso;
      }

      await this.repo.upsertVaultPage(page);
      processedPages.push(page);
    }

    const allPages = await this.repo.listVaultPages(doc.id);
    doc.pagesProcessed = allPages.filter((p) => p.items.length > 0 || p.visionModelUsed !== null).length;
    doc.status = "awaiting_qc";
    doc.updatedAt = new Date().toISOString();
    await this.repo.upsertVaultDocument(doc);

    return { document: doc, pages: processedPages };
  }

  async getQcQueue(userId: string, documentId: string): Promise<{
    document: BrainVaultDocument;
    items: Array<{
      item: ExtractedVisionItem;
      pageId: string;
      pageNumber: number;
      pageImageUrl: string;
      extractionConfidence: number | null;
      ocrWarnings: string[];
      batchApproveEligible: boolean;
    }>;
  }> {
    const doc = await this.repo.getVaultDocumentById(userId, documentId);
    if (!doc) throw new Error("Document not found.");
    const pages = await this.repo.listVaultPages(documentId);
    const storage = getObjectStorage();

    const items: Array<{
      item: ExtractedVisionItem;
      pageId: string;
      pageNumber: number;
      pageImageUrl: string;
      extractionConfidence: number | null;
      ocrWarnings: string[];
      batchApproveEligible: boolean;
    }> = [];

    for (const page of pages) {
      const pageImageUrl = await storage.getAccessUrl(page.imageStorageKey);
      for (const item of page.items) {
        if (item.qcStatus !== "pending_review") continue;
        const batchApproveEligible =
          (page.extractionConfidence ?? 0) >= BATCH_APPROVE_MIN_CONFIDENCE &&
          item.katexValid &&
          page.ocrWarnings.length === 0;
        items.push({
          item,
          pageId: page.id,
          pageNumber: page.pageNumber,
          pageImageUrl,
          extractionConfidence: page.extractionConfidence,
          ocrWarnings: page.ocrWarnings,
          batchApproveEligible,
        });
      }
    }

    return { document: doc, items };
  }

  async reviewQcItem(params: {
    userId: string;
    itemId: string;
    action: "approved" | "rejected";
    patch?: Partial<{
      stemMarkdown: string;
      stemLatex: string | null;
      methodLabel: string | null;
      validityConditions: string | null;
      subtestGuess: SnbtSubtest;
      correctAnswerKey: "A" | "B" | "C" | "D" | "E" | null;
    }>;
  }): Promise<{ item: ExtractedVisionItem; documentStatus: BrainVaultDocument["status"] }> {
    const found = await this.repo.findExtractedItemInDocument(params.userId, params.itemId);
    if (!found) throw new Error("QC item not found.");

    const { doc, page, item } = found;
    const updatedItem: ExtractedVisionItem = {
      ...item,
      ...(params.patch ?? {}),
      qcStatus: params.action as QcStatus,
    };

    const katexCheck = validateMarkdownWithKatex(
      `${updatedItem.stemMarkdown}\n${updatedItem.stemLatex ? `$$${updatedItem.stemLatex}$$` : ""}`,
    );
    if (params.action === "approved" && !katexCheck.valid) {
      throw new Error(`Perbaiki sintaks KaTeX sebelum menyetujui: ${katexCheck.error}`);
    }
    updatedItem.katexValid = katexCheck.valid;
    updatedItem.katexError = katexCheck.error ?? null;

    page.items = page.items.map((it) => (it.id === item.id ? updatedItem : it));
    const stillPendingInPage = page.items.some((it) => it.qcStatus === "pending_review");
    page.qcStatus = stillPendingInPage ? "pending_review" : "approved";
    page.updatedAt = new Date().toISOString();
    await this.repo.upsertVaultPage(page);

    if (params.action === "approved") {
      await this.commitApprovedItem(params.userId, doc, page, updatedItem);
    }

    const allPages = await this.repo.listVaultPages(doc.id);
    const anyPending = allPages.some((p) => p.items.some((it) => it.qcStatus === "pending_review"));
    doc.status = anyPending ? "awaiting_qc" : "indexed";
    doc.updatedAt = new Date().toISOString();
    await this.repo.upsertVaultDocument(doc);

    return { item: updatedItem, documentStatus: doc.status };
  }

  async batchApproveEligible(userId: string, documentId: string): Promise<{ approvedCount: number }> {
    const { items } = await this.getQcQueue(userId, documentId);
    const eligible = items.filter((entry) => entry.batchApproveEligible);
    for (const entry of eligible) {
      await this.reviewQcItem({
        userId,
        itemId: entry.item.id,
        action: "approved",
      });
    }
    return { approvedCount: eligible.length };
  }

  private async commitApprovedItem(
    userId: string,
    doc: BrainVaultDocument,
    page: BrainVaultPage,
    item: ExtractedVisionItem,
  ): Promise<void> {
    const nodes = await this.repo.listSkillNodes();
    const matchedNode =
      nodes.find((n) => n.subtest === item.subtestGuess && n.tier === item.tierGuess) ??
      nodes.find((n) => n.subtest === item.subtestGuess) ??
      nodes[0];

    const routerClient = new NineRouterClient(this.repo);
    const textForEmbedding = `${item.methodLabel ?? ""} ${item.conceptTag} ${item.stemMarkdown} ${item.stemLatex ?? ""}`;
    const embedding = await routerClient.embedText(userId, textForEmbedding);

    const chunk: BrainVaultChunk = {
      id: crypto.randomUUID(),
      userId,
      documentId: doc.id,
      pageId: page.id,
      skillNodeId: matchedNode.id,
      subtest: item.subtestGuess,
      chunkType:
        item.itemType === "rumus_cepat"
          ? "rumus_cepat"
          : item.itemType === "worked_solution"
            ? "worked_solution"
            : item.itemType === "question"
              ? "question_stem"
              : "concept_note",
      contentMarkdown: item.stemMarkdown,
      contentLatex: item.stemLatex,
      methodLabel: item.methodLabel ?? item.conceptTag,
      validityConditions: item.validityConditions,
      diagramAssetUrl: item.diagramAssetUrl,
      qcStatus: "approved",
      isUserPriority: true,
      embedding,
      createdAt: new Date().toISOString(),
    };
    await this.repo.upsertVaultChunk(chunk);

    if (item.itemType === "question" && item.options.length >= 2 && item.correctAnswerKey) {
      const q: QuestionEntity = {
        id: crypto.randomUUID(),
        ownerUserId: userId,
        skillNodeId: matchedNode.id,
        subtest: item.subtestGuess,
        track: getTrackForSubtest(item.subtestGuess),
        tier: item.tierGuess,
        sourceType: "brain_vault_extracted",
        sourceDocumentId: doc.id,
        sourcePageId: page.id,
        parentQuestionId: null,
        templateId: null,
        verificationRunId: null,
        format: "mcq_single",
        qcStatus: "approved",
        stemMarkdown: item.stemMarkdown,
        stemLatex: item.stemLatex,
        passageText: item.passageText,
        passageSentences: item.passageText
          ? item.passageText
              .split(/(?<=[.!?])\s+/)
              .filter(Boolean)
              .map((t, idx) => ({ id: `S${idx + 1}`, paragraph: 1, text: t }))
          : null,
        evidenceSentenceIds: item.passageText ? ["S1"] : [],
        diagramAssetUrl: item.diagramAssetUrl,
        diagramAltText: item.diagramAltText,
        options: item.options.map((o) => ({
          key: o.key,
          textMarkdown: o.textMarkdown,
          latex: o.latex,
          trapType: "none",
          distractorRationale:
            o.key === item.correctAnswerKey ? "Kunci sesuai hasil verifikasi QC." : "Opsi pengecoh.",
        })),
        correctAnswerKey: item.correctAnswerKey,
        officialSolutionMarkdown:
          item.officialSolutionMarkdown ?? "Pembahasan terverifikasi dari unggahan Brain Vault.",
        solutionSteps: [],
        sbiDeconstruction: null,
        irtDifficultyB: 0,
        irtDiscriminationA: 1.2,
        irtGuessingC: 0.2,
        expectedSolveSeconds: 75,
        createdAt: new Date().toISOString(),
      };
      await this.repo.saveQuestion(q);
    }
  }
}
