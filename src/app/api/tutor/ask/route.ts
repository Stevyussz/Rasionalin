import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SocraticTutorService } from "@/application/tutor-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export const maxDuration = 60;

const ImageAttachmentSchema = z.object({
  kind: z.literal("image"),
  name: z.string().min(1).max(160),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  dataUrl: z.string().min(20).max(6_500_000),
});

const FileAttachmentSchema = z.object({
  kind: z.literal("file"),
  name: z.string().min(1).max(160),
  mimeType: z.string().min(1).max(120),
  textContent: z.string().min(1).max(15_000),
});

const ContextTagSchema = z.object({
  type: z.enum(["skill_node", "subtest", "memory_note", "vault_chunk", "mistake"]),
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
});

const CustomQuestionSchema = z.object({
  subject: z.string().min(1).max(100),
  chapter: z.string().min(1).max(160),
  triggerTag: z.string().max(120).optional(),
  promptMarkdown: z.string().min(1).max(3000),
  options: z.array(z.string().max(500)).max(6).optional(),
  formulaHint: z.string().max(1200).optional(),
  stepByStep: z.array(z.string().max(1200)).max(8).optional(),
  studentAnswered: z.boolean().optional(),
  studentSelectedKey: z.string().max(8).optional(),
});

const AskSchema = z
  .object({
    message: z.string().max(2500).default(""),
    questionId: z.string().uuid().nullable().optional(),
    subtest: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]).nullable().optional(),
    customQuestion: CustomQuestionSchema.nullable().optional(),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1).max(2500),
        }),
      )
      .max(10)
      .optional(),
    attachments: z.array(z.union([ImageAttachmentSchema, FileAttachmentSchema])).max(4).optional(),
    contextTags: z.array(ContextTagSchema).max(8).optional(),
  })
  .refine(
    (data) => data.message.trim().length > 0 || (data.attachments && data.attachments.length > 0),
    { message: "Tulis pertanyaan atau lampirkan gambar/file terlebih dahulu." },
  );

export async function POST(req: NextRequest) {
  try {
    const body = AskSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const service = new SocraticTutorService(repo);

    const answer = await service.askInteractiveTutor({
      userId: user.id,
      userDisplayName: user.displayName,
      message: body.message.trim() || "Tolong analisis lampiran ini dan jelaskan dari nol pakai prinsip Why Before How.",
      questionId: body.questionId ?? null,
      subtest: body.subtest ?? null,
      customQuestion: body.customQuestion ?? null,
      history: body.history ?? [],
      attachments: body.attachments ?? [],
      contextTags: body.contextTags ?? [],
    });

    return NextResponse.json(answer);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses pertanyaan ke Tutor AI." },
      { status: 400 },
    );
  }
}
