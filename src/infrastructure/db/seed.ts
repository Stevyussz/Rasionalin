import {
  SEED_QUESTIONS,
  SEED_SKILL_EDGES,
  SEED_SKILL_NODES,
  SEED_TEMPLATES,
} from "@/domain/seed-data";
import { getPgPool } from "@/infrastructure/db/postgres/client";
import { loadLocalEnvIfNeeded } from "@/infrastructure/db/postgres/env-loader";
import { PostgresRepository } from "@/infrastructure/db/postgres/repository";

async function main() {
  loadLocalEnvIfNeeded();

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Error: Set DATABASE_URL in .env.local before running db:seed.");
    process.exit(1);
  }

  const pool = getPgPool();
  const repo = new PostgresRepository(pool);
  try {
    console.log("Cleaning any legacy dummy account & seeding SNBT curriculum...");

    // Remove legacy local demo user (cascades cleanly to dummy sessions/vault/masteries)
    const deleted = await pool.query(
      `DELETE FROM users WHERE email = 'pejuang800@kejarsnbt.local' RETURNING id`,
    );
    if (deleted.rowCount && deleted.rowCount > 0) {
      console.log("Removed legacy dummy account (pejuang800@kejarsnbt.local).");
    }

    for (const node of SEED_SKILL_NODES) {
      await pool.query(
        `INSERT INTO skill_nodes (
          id, code, subtest, track, tier, title_id, title_en, description_markdown,
          first_principles_summary, is_foundation_repair, soft_gate_threshold,
          conquest_threshold, target_solve_seconds, graph_x, graph_y, display_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (code) DO UPDATE SET
          title_id = EXCLUDED.title_id,
          description_markdown = EXCLUDED.description_markdown,
          first_principles_summary = EXCLUDED.first_principles_summary,
          graph_x = EXCLUDED.graph_x,
          graph_y = EXCLUDED.graph_y`,
        [
          node.id,
          node.code,
          node.subtest,
          node.track,
          node.tier,
          node.titleId,
          node.titleEn,
          node.descriptionMarkdown,
          node.firstPrinciplesSummary,
          node.isFoundationRepair,
          node.softGateThreshold,
          node.conquestThreshold,
          node.targetSolveSeconds,
          node.graphX,
          node.graphY,
          node.displayOrder,
        ],
      );
    }

    for (const edge of SEED_SKILL_EDGES) {
      await pool.query(
        `INSERT INTO skill_prerequisite_edges (parent_node_id, child_node_id, edge_type, weight)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (parent_node_id, child_node_id) DO NOTHING`,
        [edge.parentNodeId, edge.childNodeId, edge.edgeType, edge.weight],
      );
    }

    // Upsert questions in bounded parallel batches for fast remote seeding
    for (let i = 0; i < SEED_QUESTIONS.length; i += 8) {
      const batch = SEED_QUESTIONS.slice(i, i + 8);
      await Promise.all(batch.map((q) => repo.saveQuestion(q)));
    }

    for (const tpl of SEED_TEMPLATES) {
      await repo.saveTemplate(tpl);
    }

    const subtestSummary = SEED_QUESTIONS.reduce<Record<string, number>>((acc, q) => {
      acc[q.subtest] = (acc[q.subtest] ?? 0) + 1;
      return acc;
    }, {});

    console.log(
      `Seeded cleanly: ${SEED_SKILL_NODES.length} skill nodes, ${SEED_QUESTIONS.length} questions (${JSON.stringify(subtestSummary)}), ${SEED_TEMPLATES.length} verified math templates (zero dummy accounts).`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
