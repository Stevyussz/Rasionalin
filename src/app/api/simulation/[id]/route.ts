import { NextRequest, NextResponse } from "next/server";
import { SimulationService } from "@/application/simulation-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const sim = new SimulationService(repo);
    const state = await sim.getSimulationState(user.id, id);
    return NextResponse.json(state);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sesi simulasi tidak ditemukan." },
      { status: 404 },
    );
  }
}
