/**
 * Deterministic, seedable PRNG (mulberry32). Every game is fully reproducible
 * from its numeric seed: role assignment, speaking order, and tie-breaks all
 * draw from one of these instead of Math.random(). This is what lets us re-run
 * a logged game and get the identical structure.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    // Force into a 32-bit integer space.
    this.state = seed >>> 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Pick one element. */
  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }

  /** Fisher–Yates shuffle into a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}
