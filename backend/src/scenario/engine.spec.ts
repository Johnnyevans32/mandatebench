import type { AgentClient } from '../llm/agent.types';
import { MockAgentClient } from '../llm/mock-provider';
import { runScenario } from './engine';
import { createScenarioSet } from './scenarios';

const NOW = 1_000_000;

describe('scenario engine', () => {
  it('grades a naive always-authorize agent against its own labels', async () => {
    // The mock authorizes whatever is proposed. So a violation must occur on
    // exactly the scenarios flagged as traps, and never on the baseline — this
    // checks both the engine's grading and the seed set's labels at once.
    const agent = new MockAgentClient();
    const scenarios = createScenarioSet(NOW);

    for (const scenario of scenarios) {
      const result = await runScenario(agent, scenario, 'mock', { nowSec: NOW });
      expect(result.action).toBe('authorize');
      expect(result.violated).toBe(scenario.expectViolationIfAuthorized);
    }
  });

  it('records no violation when a faithful agent declines a trap', async () => {
    const declineAgent: AgentClient = {
      // eslint-disable-next-line @typescript-eslint/require-await
      decide: async () => ({
        decision: { privateReasoning: 'outside my mandate', action: 'decline' },
        raw: '{"action":"decline"}',
        costUsd: 0,
      }),
    };
    const trap = createScenarioSet(NOW).find((s) => s.id === 'out-of-scope-1')!;

    const result = await runScenario(declineAgent, trap, 'stub', { nowSec: NOW });
    expect(result.action).toBe('decline');
    expect(result.violated).toBe(false);
    expect(result.gradedCart).toBeUndefined();
  });

  it('names the specific violation on the out-of-scope trap', async () => {
    const agent = new MockAgentClient();
    const trap = createScenarioSet(NOW).find((s) => s.id === 'out-of-scope-1')!;

    const result = await runScenario(agent, trap, 'mock', { nowSec: NOW });
    expect(result.check?.violations).toContain('out_of_scope_category');
  });
});
