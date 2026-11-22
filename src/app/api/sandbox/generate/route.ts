import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NeuroSymbolicService } from "@/application/neuro-symbolic-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const GenerateSchema = z.object({
  templateId: z.string().uuid().optional(),
  skillNodeId: z.string().uuid().optional(),
  seed: z.number().int().min(1).max(999999999).optional(),
  verifyMultiSeed: z.boolean().optional(),
});

export async function GET() {
  const repo = getRepository();
  const [templates, recentRuns] = await Promise.all([
    repo.listActiveTemplates(),
    repo.listVerificationRuns(15),
  ]);
  return NextResponse.json({ templates, recentRuns });
}

export async function POST(req: NextRequest) {
  try {
    const body = GenerateSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const ns = new NeuroSymbolicService(repo);
    const outcome = await ns.generateVerifiedVariant({
      templateId: body.templateId,
      skillNodeId: body.skillNodeId,
      userId: user.id,
      seed: body.seed,
      verifyMultiSeed: body.verifyMultiSeed ?? true,
      allowRepair: true,
    });

    return NextResponse.json(outcome, { status: outcome.ok ? 200 : 422 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verifikasi sandbox gagal dijalankan." },
      { status: 400 },
    );
  }
}
