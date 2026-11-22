export interface RrfCandidate {
  id: string;
  denseRank: number | null;
  sparseRank: number | null;
  cosineSimilarity: number;
  isUserPriority: boolean;
}

export interface RrfScoredCandidate extends RrfCandidate {
  rrfScore: number;
  passesCitationGate: boolean;
}

export const RRF_K = 60;
export const DENSE_WEIGHT = 0.6;
export const SPARSE_WEIGHT = 0.4;
export const USER_VAULT_PRIORITY_MULTIPLIER = 1.35;
export const MIN_RRF_CITATION_SCORE = 0.012;
export const MIN_COSINE_CITATION_SCORE = 0.72;

export function scoreHybridRrf(candidates: RrfCandidate[]): RrfScoredCandidate[] {
  return candidates
    .map((c) => {
      const denseTerm = c.denseRank !== null ? DENSE_WEIGHT / (RRF_K + c.denseRank) : 0;
      const sparseTerm = c.sparseRank !== null ? SPARSE_WEIGHT / (RRF_K + c.sparseRank) : 0;
      const multiplier = c.isUserPriority ? USER_VAULT_PRIORITY_MULTIPLIER : 1.0;
      const rrfScore = Number(((denseTerm + sparseTerm) * multiplier).toFixed(6));
      const passesCitationGate =
        rrfScore >= MIN_RRF_CITATION_SCORE || c.cosineSimilarity >= MIN_COSINE_CITATION_SCORE;

      return {
        ...c,
        rrfScore,
        passesCitationGate,
      };
    })
    .sort((a, b) => b.rrfScore - a.rrfScore || b.cosineSimilarity - a.cosineSimilarity);
}

export function deterministicTextOverlapScore(queryText: string, docText: string): number {
  const tokenize = (s: string): Set<string> =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\\]+/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 2),
    );

  const qTokens = tokenize(queryText);
  const dTokens = tokenize(docText);
  if (qTokens.size === 0 || dTokens.size === 0) return 0;

  let overlap = 0;
  for (const tok of qTokens) {
    if (dTokens.has(tok)) overlap += 1;
  }
  return overlap / Math.sqrt(qTokens.size * dTokens.size);
}
