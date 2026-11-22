import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SimulationService } from "@/application/simulation-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const LockBlockSchema = z.object({
  blockId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = LockBlockSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const sim = new SimulationService(repo);
    const res = await sim.lockBlockAndAdvance({
      userId: user.id,
      sessionId: id,
      blockId: body.blockId,
    });

    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengunci blok subtes." },
      { status: 400 },
    );
  }
}
