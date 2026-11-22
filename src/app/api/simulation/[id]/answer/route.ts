import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SimulationService } from "@/application/simulation-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const SimAnswerSchema = z.object({
  blockId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedAnswerKey: z.enum(["A", "B", "C", "D", "E"]).nullable(),
  timeToSolveMs: z.number().int().min(0),
  triageDecisionMs: z.number().int().min(0).nullable(),
  triageAction: z.enum(["solved_directly", "flagged_and_solved", "skipped_smart", "timed_out"]),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = SimAnswerSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const sim = new SimulationService(repo);
    const res = await sim.submitBlockAnswer({
      userId: user.id,
      sessionId: id,
      ...body,
    });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan jawaban simulasi." },
      { status: 400 },
    );
  }
}
