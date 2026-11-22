import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NeuroSymbolicService } from "@/application/neuro-symbolic-service";
import { StudyService } from "@/application/study-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const SubmitAttemptSchema = z.object({
  questionId: z.string().uuid(),
  attemptMode: z.enum(["diagnostic", "skill_drill", "fsrs_revival", "simulation", "faded_practice"]),
  fractureId: z.string().uuid().nullable().optional(),
  selectedAnswerKey: z.enum(["A", "B", "C", "D", "E"]).nullable(),
  timeToSolveMs: z.number().int().min(0).max(3600000),
  firstInteractionMs: z.number().int().min(0).nullable().optional(),
  triageDecisionMs: z.number().int().min(0).nullable().optional(),
  triageAction: z.enum(["solved_directly", "flagged_and_solved", "skipped_smart", "timed_out"]).optional(),
  highlightedSentenceIds: z.array(z.string()).optional(),
  sbiSchemaSelected: z.string().nullable().optional(),
  sbiVariablesTagged: z.record(z.string(), z.string()).optional(),
  hintsUsedCount: z.number().int().min(0).max(4).optional(),
  maxHintLevel: z
    .enum([
      "L1_vault_nudge",
      "L2_translation_prompt",
      "L3_guided_first_step",
      "L4_first_principles_analogy",
    ])
    .nullable()
    .optional(),
  usedScratchpad: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = SubmitAttemptSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const study = new StudyService(repo);
    const result = await study.submitAttempt({
      userId: user.id,
      ...body,
    });

    // Asynchronously replenish verified isomorphic pool without blocking response
    after(async () => {
      try {
        const ns = new NeuroSymbolicService(repo);
        await ns.ensurePreWarmedPool(result.mastery.skillNodeId, user.id);
      } catch {
        // Non-fatal background pool refill
      }
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan jawaban." },
      { status: 400 },
    );
  }
}
