import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateEvidenceHighlight } from "@/domain/dual-track-pedagogy";
import { getRepository } from "@/infrastructure/db";

const EvidenceCheckSchema = z.object({
  questionId: z.string().uuid(),
  highlightedSentenceIds: z.array(z.string().min(1)).min(1).max(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = EvidenceCheckSchema.parse(await req.json());
    const repo = getRepository();
    const question = await repo.getQuestionById(body.questionId);
    if (!question) {
      return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    }

    const result = validateEvidenceHighlight(question, body.highlightedSentenceIds);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Permintaan verifikasi bukti tidak valid." },
      { status: 400 },
    );
  }
}
