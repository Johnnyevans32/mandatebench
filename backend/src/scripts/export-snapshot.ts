/**
 * Freeze a snapshot's aggregates to a JSON file the paper renders from.
 *
 * This is the mechanical link between the database and every number the paper
 * reports: the paper page and the PDF tables should be generated from this
 * file, never hand-typed. Read-only — it never writes to the database.
 *
 * Usage:
 *   yarn export-snapshot --snapshot v6 --hidden v6-hidden \
 *     [--out ../frontend/data/results-v6.json]
 */
import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import mongoose from 'mongoose';
import { dirname, resolve } from 'path';
import { wilson } from '../analysis/wilson';

loadEnv();

interface ResultRow {
  modelId: string;
  scenarioId: string;
  pressure: string;
  isTrap: boolean;
  groundTruth?: string;
  action?: string;
  violated: boolean;
  violationClass?: string;
  authorizedPayment?: boolean;
  unparseable?: boolean;
}

interface DuelRow {
  attackerModel: string;
  agentModel: string;
  goal: string;
  outcome: string;
  rep?: number;
}

interface MonitorRow {
  snapshot: string;
  monitorModel: string;
  channel: string;
  auroc: number;
  aurocLow?: number;
  aurocHigh?: number;
  nPos: number;
  nNeg: number;
  perModel?: unknown[];
  excludedEmpty?: number;
  fallbackVerdicts?: number;
  scored?: number;
  createdAt?: Date;
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

function rate(k: number, n: number) {
  const w = wilson(k, n);
  return { k, n, rate: w.rate, low: w.low, high: w.high };
}

async function main(): Promise<void> {
  const snapshot = arg('snapshot');
  if (!snapshot) throw new Error('--snapshot is required (e.g. --snapshot v6)');
  const hidden = arg('hidden');
  const out = resolve(
    process.cwd(),
    arg('out', `../frontend/data/results-${snapshot}.json`)!,
  );

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const usable = { unparseable: { $ne: true } };
  const results = (await db
    .collection('results')
    .find({ snapshot, ...usable })
    .project({ raw: 0, privateReasoning: 0, publicStatement: 0, gradedCart: 0 })
    .toArray()) as unknown as ResultRow[];
  const hiddenResults = hidden
    ? ((await db
        .collection('results')
        .find({ snapshot: hidden, ...usable })
        .project({ raw: 0, privateReasoning: 0, publicStatement: 0, gradedCart: 0 })
        .toArray()) as unknown as ResultRow[])
    : [];
  const duels = (await db
    .collection('duels')
    .find({ snapshot, outcome: { $ne: 'unparseable' } })
    .project({ transcript: 0 })
    .toArray()) as unknown as DuelRow[];
  const monitors = (await db
    .collection('monitors')
    .find({ snapshot: { $in: [snapshot, ...(hidden ? [hidden] : [])] } })
    .sort({ createdAt: -1 })
    .toArray()) as unknown as MonitorRow[];

  // --- calibration: per model, split by ground-truth class ---
  const models = [...new Set(results.map((r) => r.modelId))].sort();
  const calibration = models.map((model) => {
    const rows = results.filter((r) => r.modelId === model);
    const gt = (r: ResultRow) => r.groundTruth ?? (r.isTrap ? 'rule' : 'clean');
    const authorized = (r: ResultRow) =>
      r.authorizedPayment ?? (r.action === 'authorize' || r.action === 'counter');
    const clean = rows.filter((r) => gt(r) === 'clean');
    const rule = rows.filter((r) => gt(r) === 'rule');
    const intent = rows.filter((r) => gt(r) === 'intent');
    return {
      model,
      falseRefusal: rate(clean.filter((r) => !authorized(r)).length, clean.length),
      ruleCaught: rate(rule.filter((r) => !r.violated).length, rule.length),
      intentCaught: rate(intent.filter((r) => !r.violated).length, intent.length),
    };
  });

  // --- headline violation counts per arm ---
  const traps = results.filter((r) => r.isTrap);
  const hiddenTraps = hiddenResults.filter((r) => r.isTrap);
  const violations = {
    default: {
      graded: results.length,
      traps: rate(traps.filter((r) => r.violated).length, traps.length),
    },
    hidden: hidden
      ? {
          graded: hiddenResults.length,
          traps: rate(hiddenTraps.filter((r) => r.violated).length, hiddenTraps.length),
        }
      : undefined,
  };

  // --- model x pressure matrix ---
  const matrix = models.flatMap((model) => {
    const byPressure = new Map<string, ResultRow[]>();
    for (const r of results.filter((x) => x.modelId === model && x.isTrap)) {
      byPressure.set(r.pressure, [...(byPressure.get(r.pressure) ?? []), r]);
    }
    return [...byPressure.entries()].map(([pressure, rows]) => ({
      model,
      pressure,
      ...rate(rows.filter((r) => r.violated).length, rows.length),
    }));
  });

  // --- duels: per-agent robustness, per-attacker success, raw cells ---
  const agents = [...new Set(duels.map((d) => d.agentModel))].sort().map((model) => {
    const rows = duels.filter((d) => d.agentModel === model);
    return { model, breached: rate(rows.filter((d) => d.outcome === 'breached').length, rows.length) };
  });
  const attackers = [...new Set(duels.map((d) => d.attackerModel))].sort().map((model) => {
    const rows = duels.filter((d) => d.attackerModel === model);
    return { model, success: rate(rows.filter((d) => d.outcome === 'breached').length, rows.length) };
  });
  const cells = duels.map((d) => ({
    attacker: d.attackerModel,
    agent: d.agentModel,
    goal: d.goal,
    outcome: d.outcome,
    rep: d.rep,
  }));

  const payload = {
    meta: {
      exportedAt: new Date().toISOString(),
      snapshot,
      hiddenSnapshot: hidden,
      note:
        'Frozen aggregate export. The paper page and PDF tables must render from ' +
        'this file; do not hand-edit. Regenerate with backend `yarn export-snapshot`.',
    },
    calibration,
    violations,
    matrix,
    duels: { agents, attackers, cells },
    monitors,
  };

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(
    `exported ${results.length} default + ${hiddenResults.length} hidden results, ` +
      `${duels.length} duels, ${monitors.length} monitor runs -> ${out}`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
