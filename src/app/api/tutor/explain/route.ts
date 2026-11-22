import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SocraticTutorService } from "@/application/tutor-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const ExplainSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswerKey: z.enum(["A", "B", "C", "D", "E"]).nullable().optional(),
  isCorrect: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = ExplainSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const service = new SocraticTutorService(repo);

    const explanation = await service.generateWhyBeforeHowExplanation({
      userId: user.id,
      questionId: body.questionId,
      selectedAnswerKey: body.selectedAnswerKey ?? null,
      isCorrect: body.isCorrect,
    });

    return NextResponse.json(explanation);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat penjelasan AI." },
      { status: 400 },
    );
  }
}
