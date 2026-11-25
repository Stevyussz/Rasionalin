import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NeuroSymbolicService } from "@/application/neuro-symbolic-service";
import { SocraticTutorService } from "@/application/tutor-service";
import { resolveActiveUser } from "@/infrastructure/auth/session";
import { getRepository } from "@/infrastructure/db";

const VariantRequestSchema = z.object({
  questionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = VariantRequestSchema.parse(await req.json());
    const repo = getRepository();
    const user = await resolveActiveUser(repo);

    const sourceQuestion = await repo.getQuestionById(body.questionId);
    if (!sourceQuestion) {
      return NextResponse.json(
        { error: "Soal asal tidak ditemukan." },
        { status: 404 },
      );
    }

    const skillNode = await repo.getSkillNodeById(sourceQuestion.skillNodeId);
    if (!skillNode) {
      return NextResponse.json(
        { error: "Materi soal tidak ditemukan." },
        { status: 404 },
      );
    }

    // Tier 1: Verified QuickJS-WASM template (0 AI latency, 100% math-checked)
    if (sourceQuestion.track === "quantitative") {
      const templates = await repo.listActiveTemplates({
        skillNodeId: sourceQuestion.skillNodeId,
      });
      if (templates.length > 0) {
        const alternate = templates.find((t) => t.id !== sourceQuestion.templateId);
        const chosenTemplate = alternate ?? templates[0];
        const ns = new NeuroSymbolicService(repo);
        const outcome = await ns.generateVerifiedVariant({
          templateId: chosenTemplate.id,
          skillNodeId: sourceQuestion.skillNodeId,
          userId: user.id,
          parentQuestionId: sourceQuestion.id,
          verifyMultiSeed: false,
          allowRepair: false,
        });
        if (outcome.ok && outcome.question) {
          return NextResponse.json({
            ok: true,
            questionId: outcome.question.id,
            sourceMode: "wasm_verified",
            badgeLabel: "Variasi Terverifikasi (Angka Baru)",
          });
        }
      }
    }

    // Tier 2: AI Isomorphic Twin Problem (new numbers + new story context)
    if (process.env.VITEST !== "true") {
      const tutor = new SocraticTutorService(repo);
      const twin = await tutor.generateIsomorphicTwinQuestion({
        userId: user.id,
        sourceQuestion,
        skillNode,
      });
      if (twin) {
        return NextResponse.json({
          ok: true,
          questionId: twin.id,
          sourceMode: "ai_twin",
          badgeLabel: "Soal Kembar AI (Cerita & Angka Baru)",
        });
      }
    }

    // Tier 3: Instant same-node sibling question fallback (guaranteed 0 failures)
    const nodeQuestions = await repo.listQuestions({
      userId: user.id,
      skillNodeId: sourceQuestion.skillNodeId,
      qcStatus: "approved",
    });
    const siblings = nodeQuestions.filter((q) => q.id !== sourceQuestion.id);
    if (siblings.length > 0) {
      const picked = siblings[Math.floor(Math.random() * siblings.length)] ?? siblings[0];
      return NextResponse.json({
        ok: true,
        questionId: picked.id,
        sourceMode: "same_node_sibling",
        badgeLabel: "Soal Sejenis Satu Pola (Bank Soal)",
      });
    }

    return NextResponse.json(
      { error: "Belum ada soal variasi lain pada topik ini." },
      { status: 404 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat variasi soal serupa." },
      { status: 400 },
    );
  }
}
