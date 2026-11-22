import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SimulationService } from "@/application/simulation-service";
import { resolveActiveUser, UnauthorizedError } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const StartSimSchema = z.object({
  mode: z.enum(["diagnostic_placement", "full_tryout_utbk", "subtest_drill", "triage_sprint"]),
  subtest: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]).optional(),
});

export async function GET() {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const simulations = await repo.listSimulations(user.id);
    return NextResponse.json({ simulations });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat daftar simulasi." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = StartSimSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const sim = new SimulationService(repo);
    const result = await sim.startSimulation(user.id, body.mode, body.subtest ?? null);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memulai simulasi." },
      { status: 400 },
    );
  }
}
