import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";
import {
  addUserMemoryNoteAsync,
  deleteUserMemoryNoteAsync,
  getUserMemoryBundleAsync,
  updateUserMemoryNoteAsync,
  updateUserPersonaAsync,
} from "@/infrastructure/memory/user-memory-store";

const SubtestEnum = z.enum(["PU", "PPU", "PBM", "PK", "LBI", "LBE", "PM"]);

const PersonaSchema = z.object({
  nickname: z.string().min(1).max(60),
  startingLevel: z.enum(["nol_total", "dasar", "menengah"]),
  studyPace: z.enum(["santuy_dalam", "seimbang", "kejar_cepat"]).optional(),
  explanationStyle: z.enum(["analogi_sehari_hari", "step_by_step_pelan", "ringkas_langsung"]),
  targetGoal: z.string().max(140),
  weakSubtests: z.array(SubtestEnum).max(7),
  personalContext: z.string().max(1200),
});

const CreateNoteSchema = z.object({
  kind: z.enum(["memory", "note"]),
  title: z.string().min(2).max(120),
  content: z.string().min(2).max(2000),
  subtest: SubtestEnum.nullable().optional(),
  pinnedForAi: z.boolean().optional(),
});

const UpdateNoteSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["memory", "note"]).optional(),
  title: z.string().min(2).max(120).optional(),
  content: z.string().min(2).max(2000).optional(),
  subtest: SubtestEnum.nullable().optional(),
  pinnedForAi: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const bundle = await getUserMemoryBundleAsync(user.id, user.displayName);
    const includeContext = req.nextUrl.searchParams.get("includeContext") === "1";

    if (!includeContext) {
      return NextResponse.json(bundle);
    }

    const [nodes, chunks, fractures] = await Promise.all([
      repo.listSkillNodes(),
      repo.listVaultChunks(user.id),
      repo.listMistakeFractures(user.id),
    ]);

    const activeFractures = fractures.filter((f) => f.status !== "healed").slice(0, 12);

    return NextResponse.json({
      ...bundle,
      tagCatalog: {
        skillNodes: nodes.map((n) => ({
          id: n.id,
          subtest: n.subtest,
          title: n.titleId,
        })),
        vaultChunks: chunks.slice(0, 16).map((c) => ({
          id: c.id,
          subtest: c.subtest,
          title: c.methodLabel || c.chunkType,
        })),
        mistakes: activeFractures.map((f) => ({
          id: f.id,
          subtest: nodes.find((n) => n.id === f.skillNodeId)?.subtest ?? null,
          title: f.diagnosticSummary.slice(0, 70),
        })),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat memori belajar." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = PersonaSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const bundle = await updateUserPersonaAsync(user.id, body, user.displayName);
    return NextResponse.json(bundle);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan persona belajar." },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = CreateNoteSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const result = await addUserMemoryNoteAsync(user.id, body, user.displayName);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menambah memori atau catatan." },
      { status: 400 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = UpdateNoteSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const { id, ...patch } = body;
    const bundle = await updateUserMemoryNoteAsync(user.id, id, patch);
    return NextResponse.json(bundle);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memperbarui catatan." },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Parameter id wajib diisi." }, { status: 400 });
    }
    const repo = getRepository();
    const user = await resolveActiveUser(repo);
    const bundle = await deleteUserMemoryNoteAsync(user.id, id);
    return NextResponse.json(bundle);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menghapus catatan." },
      { status: 400 },
    );
  }
}
