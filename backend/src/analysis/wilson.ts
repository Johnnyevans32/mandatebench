/**
 * Wilson score interval for a binomial proportion — used for cross-play cell
 * win rates and the marginal deception/detection scores. Far better than the
 * normal approximation at the small per-cell sample sizes we expect (~30–50).
 */
export function wilson(
  successes: number,
  n: number,
  z = 1.96,
): { rate: number; low: number; high: number } {
  if (n === 0) return { rate: 0, low: 0, high: 1 };
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return {
    rate: p,
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin),
  };
}
