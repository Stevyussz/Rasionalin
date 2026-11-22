import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NineRouterClient } from "@/infrastructure/ai/nine-router-client";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const SearchSchema = z.object({
  query: z.string().min(1).max(300),
  formula: z.string().max(200).optional(),
  subtest: z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = SearchSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const routerClient = new NineRouterClient(repo);
    const queryEmbedding = await routerClient.embedText(user.id, body.query);

    const results = await repo.searchHybridVaultChunks({
      userId: user.id,
      queryText: body.query,
      formulaQuery: body.formula ?? "",
      queryEmbedding,
      subtest: body.subtest ?? null,
      limit: 6,
    });

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pencarian Brain Vault gagal." },
      { status: 400 },
    );
  }
}
