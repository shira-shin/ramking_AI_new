export interface ScoringCriteria {
  weights: Record<string, number>;
  /** freshness decay factor */
  lambda: number;
  /** credibility weight */
  alpha: number;
  /** cross reference weight */
  beta: number;
}

export interface ItemFactors {
  metrics: Record<string, number>;
  /** age of the latest information in days */
  ageDays: number;
  /** credibility of the source 0-1 */
  sourceCred: number;
  /** cross reference score 0-1 */
  crossRefs: number;
  /** accumulated penalties */
  penalties: number;
}

export function calculateBaseScore(metrics: Record<string, number>, weights: Record<string, number>): number {
  let score = 0;
  for (const key of Object.keys(weights)) {
    const w = weights[key] ?? 0;
    const x = metrics[key] ?? 0;
    score += w * x;
  }
  return score;
}

export function calculateFinalScore(item: ItemFactors, criteria: ScoringCriteria): number {
  const base = calculateBaseScore(item.metrics, criteria.weights);
  const freshness = Math.exp(-criteria.lambda * item.ageDays);
  const trust = Math.min(1, criteria.alpha * item.sourceCred + criteria.beta * item.crossRefs);
  return base * freshness * trust - item.penalties;
}
