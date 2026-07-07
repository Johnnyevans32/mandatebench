/* eslint-disable no-console */
/**
 * Run the seed scenario set against real models via OpenRouter and report each
 * model's mandate-violation rate. Costs a small amount of credit.
 *
 *   npx ts-node src/scripts/smoke-live.ts                       # default 2 models
 *   npx ts-node src/scripts/smoke-live.ts openai/gpt-5.5 x-ai/grok-4.3
 *
 * Requires OPENROUTER_API_KEY in backend/.env.
 */
import { loadConfig } from '../llm/config';
import { OpenRouterClient } from '../llm/openrouter';
import { runScenario } from '../scenario/engine';
import { createScenarioSet } from '../scenario/scenarios';
import type { ScenarioResult } from '../scenario/types';

async function main() {
  const cfg = loadConfig();
  if (!cfg.apiKey) {
    console.error('No OPENROUTER_API_KEY — set it in backend/.env.');
    process.exit(1);
  }
  const client = new OpenRouterClient(cfg);
  const models =
    process.argv.slice(2).length > 0
      ? process.argv.slice(2)
      : ['google/gemini-3.5-flash', 'meta-llama/llama-4-maverick'];

  // Fixed clock so expiry is identical across models and runs.
  const nowSec = 1_700_000_000;
  let grandSpend = 0;

  for (const model of models) {
    console.log(`\n=== ${model} ===`);
    const scenarios = createScenarioSet(nowSec);
    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      try {
        const r = await runScenario(client, scenario, model, {
          nowSec,
          temperature: 0,
        });
        results.push(r);
        grandSpend += r.costUsd;
        const verdict = r.violated ? 'VIOLATION' : 'ok';
        console.log(
          `  ${scenario.id.padEnd(22)} ${(r.action ?? '-').padEnd(9)} ${verdict}`,
        );
        if (r.violated && r.check) {
          for (const line of r.check.detail) console.log(`      - ${line}`);
        }
      } catch (err) {
        console.log(`  ${scenario.id.padEnd(22)} ERROR  ${(err as Error).message}`);
      }
    }

    const traps = results.filter(
      (r) => createScenarioSet(nowSec).find((s) => s.id === r.scenarioId)!
        .expectViolationIfAuthorized,
    );
    const violationsOnTraps = traps.filter((r) => r.violated).length;
    const baseline = results.find((r) => r.scenarioId === 'baseline-1');
    console.log(
      `  → mandate violations on traps: ${violationsOnTraps}/${traps.length}` +
        `; baseline: ${baseline ? (baseline.violated ? 'MISHANDLED' : baseline.action) : 'n/a'}`,
    );
  }

  console.log(`\ntotal spend this run: $${grandSpend.toFixed(4)}`);
}

void main();
