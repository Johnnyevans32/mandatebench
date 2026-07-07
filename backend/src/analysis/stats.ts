import { Rng } from './rng';

/**
 * Pure statistics for the study, implemented in-stack so the whole project is
 * one hostable TypeScript codebase (no Python/scipy dependency). Every function
 * here is exercised against known reference values in scripts/stats-check.ts.
 */

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/** Average ranks, with ties sharing the mean of the positions they span. */
export function ranks(xs: number[]): number[] {
  const order = xs
    .map((x, i) => ({ x, i }))
    .sort((a, b) => a.x - b.x);
  const r = new Array<number>(xs.length);
  let k = 0;
  while (k < order.length) {
    let j = k;
    while (j + 1 < order.length && order[j + 1].x === order[k].x) j++;
    const avg = (k + j) / 2 + 1; // 1-based average rank
    for (let m = k; m <= j; m++) r[order[m].i] = avg;
    k = j + 1;
  }
  return r;
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0 || n !== ys.length) return NaN;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

/** Spearman rank correlation = Pearson on the rank vectors. */
export function spearman(xs: number[], ys: number[]): number {
  return pearson(ranks(xs), ranks(ys));
}

/** Percentile bootstrap CI for an arbitrary statistic over a sample. */
export function bootstrapCI<T>(
  sample: T[],
  stat: (resampled: T[]) => number,
  opts: { iters?: number; alpha?: number; seed?: number } = {},
): { estimate: number; low: number; high: number } {
  const { iters = 2000, alpha = 0.05, seed = 42 } = opts;
  const estimate = stat(sample);
  if (sample.length === 0) return { estimate, low: NaN, high: NaN };
  const rng = new Rng(seed);
  const stats: number[] = [];
  for (let b = 0; b < iters; b++) {
    const resampled = new Array<T>(sample.length);
    for (let i = 0; i < sample.length; i++) {
      resampled[i] = sample[rng.int(sample.length)];
    }
    const s = stat(resampled);
    if (!Number.isNaN(s)) stats.push(s);
  }
  stats.sort((a, b) => a - b);
  const lo = stats[Math.floor((alpha / 2) * stats.length)] ?? NaN;
  const hi = stats[Math.ceil((1 - alpha / 2) * stats.length) - 1] ?? NaN;
  return { estimate, low: lo, high: hi };
}

/** Cohen's κ for two raters over paired categorical labels. */
export function cohenKappa(a: (string | number)[], b: (string | number)[]): number {
  const n = a.length;
  if (n === 0 || n !== b.length) return NaN;
  let agree = 0;
  const margA = new Map<string, number>();
  const margB = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    const ka = String(a[i]);
    const kb = String(b[i]);
    margA.set(ka, (margA.get(ka) ?? 0) + 1);
    margB.set(kb, (margB.get(kb) ?? 0) + 1);
  }
  const po = agree / n;
  let pe = 0;
  for (const [k, va] of margA) {
    const vb = margB.get(k) ?? 0;
    pe += (va / n) * (vb / n);
  }
  if (pe === 1) return 1;
  return (po - pe) / (1 - pe);
}

/**
 * AUROC via the Mann–Whitney U relationship (rank-based, handles ties).
 * `scores` higher = more likely positive; `labels` true = positive class.
 */
export function auc(scores: number[], labels: boolean[]): number {
  const n = scores.length;
  if (n === 0 || n !== labels.length) return NaN;
  const pos = labels.filter(Boolean).length;
  const neg = n - pos;
  if (pos === 0 || neg === 0) return NaN;
  const r = ranks(scores);
  let rankSumPos = 0;
  for (let i = 0; i < n; i++) if (labels[i]) rankSumPos += r[i];
  return (rankSumPos - (pos * (pos + 1)) / 2) / (pos * neg);
}

/**
 * Single-feature logistic regression via batch gradient descent. Returns
 * intercept b0 and slope b1 for P(y=1) = sigmoid(b0 + b1*x). Features are
 * standardised internally for stable convergence, then coefficients are mapped
 * back to the original scale.
 */
export function logisticFit(
  x: number[],
  y: (0 | 1 | boolean)[],
  opts: { lr?: number; iters?: number } = {},
): { b0: number; b1: number } {
  const { lr = 0.1, iters = 5000 } = opts;
  const n = x.length;
  const yy = y.map((v) => (v ? 1 : 0));
  const mx = mean(x);
  const sd =
    Math.sqrt(mean(x.map((v) => (v - mx) * (v - mx)))) || 1;
  const z = x.map((v) => (v - mx) / sd);
  let w0 = 0;
  let w1 = 0;
  const sigmoid = (t: number) => 1 / (1 + Math.exp(-t));
  for (let it = 0; it < iters; it++) {
    let g0 = 0;
    let g1 = 0;
    for (let i = 0; i < n; i++) {
      const p = sigmoid(w0 + w1 * z[i]);
      const err = p - yy[i];
      g0 += err;
      g1 += err * z[i];
    }
    w0 -= (lr * g0) / n;
    w1 -= (lr * g1) / n;
  }
  // Map standardised coefficients back to raw x scale.
  const b1 = w1 / sd;
  const b0 = w0 - (w1 * mx) / sd;
  return { b0, b1 };
}
