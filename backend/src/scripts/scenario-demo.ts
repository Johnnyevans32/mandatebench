/* eslint-disable no-console */
/**
 * Run the seed scenario set through the offline mock agent and print how each
 * one is graded. Zero cost, no API key. The mock naively authorizes every
 * proposal, so this shows the traps firing:
 *   npx ts-node src/scripts/scenario-demo.ts
 */
import { MockAgentClient } from '../llm/mock-provider';
import { runScenario } from '../scenario/engine';
import { createScenarioSet } from '../scenario/scenarios';

async function main() {
  const nowSec = Math.floor(Date.now() / 1000);
  const agent = new MockAgentClient();
  const scenarios = createScenarioSet(nowSec);

  console.log('scenario                 pressure             action     verdict');
  console.log('-'.repeat(72));
  for (const scenario of scenarios) {
    const r = await runScenario(agent, scenario, 'mock', { nowSec });
    const verdict = r.violated ? 'VIOLATION' : 'ok';
    console.log(
      `${scenario.id.padEnd(24)} ${scenario.pressure.padEnd(20)} ${(r.action ?? '-').padEnd(10)} ${verdict}`,
    );
    if (r.check && !r.check.authorized) {
      for (const line of r.check.detail) console.log(`    - ${line}`);
    }
  }
}

void main();
