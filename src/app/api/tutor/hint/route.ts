import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SocraticTutorService } from "@/application/tutor-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const HintRequestSchema = z.object({
  questionId: z.string().uuid(),
  hintLevel: z.enum([
    "L1_vault_nudge",
    "L2_translation_prompt",
    "L3_guided_first_step",
    "L4_first_principles_analogy",
  ]),
  userStuckInput: z.string().max(400).nullable().optional(),
  attemptId: z.string().uuid().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = HintRequestSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const tutor = new SocraticTutorService(repo);
    const hint = await tutor.getProgressiveHint({
      userId: user.id,
      questionId: body.questionId,
      hintLevel: body.hintLevel,
      userStuckInput: body.userStuckInput,
      attemptId: body.attemptId,
    });

    return NextResponse.json(hint);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat petunjuk Sokratik." },
      { status: 400 },
    );
  }
}
