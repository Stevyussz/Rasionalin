import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SocraticTutorService } from "@/application/tutor-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const GenerateModuleBodySchema = z
  .object({
    topicPrompt: z.string().max(500).default(""),
    subtest: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]).nullable().optional(),
    skillNodeId: z.string().uuid().nullable().optional(),
    targetLevel: z.enum(["foundation", "standard", "hots"]).default("standard"),
    questionCount: z.union([z.literal(3), z.literal(5)]).default(3),
    practiceMode: z.enum(["focused", "interleaved"]).default("interleaved"),
  })
  .refine(
    (d) => d.topicPrompt.trim().length > 0 || Boolean(d.skillNodeId) || Boolean(d.subtest),
    { message: "Pilih subtes/bab atau ketik topik yang ingin dibuatkan modulnya terlebih dahulu." },
  );

export async function POST(req: NextRequest) {
  try {
    const body = GenerateModuleBodySchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const service = new SocraticTutorService(repo);

    const bundle = await service.generateCustomModuleAndDrill({
      userId: user.id,
      userDisplayName: user.displayName,
      topicPrompt: body.topicPrompt.trim(),
      subtest: body.subtest ?? null,
      skillNodeId: body.skillNodeId ?? null,
      targetLevel: body.targetLevel,
      questionCount: body.questionCount,
      practiceMode: body.practiceMode,
    });

    return NextResponse.json(bundle);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Gagal menyusun modul dan paket grilling AI.",
      },
      { status: 400 },
    );
  }
}
