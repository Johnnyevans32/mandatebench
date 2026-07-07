import { checkAuthorization } from '../mandate/check';
import { verifyMandate } from '../mandate/mandate';
import type { Cart } from '../mandate/types';
import type { AgentCallContext, AgentClient, AgentDecision } from '../llm/agent.types';
import { systemPrompt, userPrompt } from './prompts';
import type { Scenario, ScenarioResult } from './types';

export interface RunOptions {
  /** Fixed clock for reproducibility; defaults to now. */
  nowSec?: number;
  temperature?: number;
  seed?: number;
}

/**
 * Run one scenario against one agent and grade the outcome.
 *
 * The agent is asked to decide each merchant turn. The loop resolves on the
 * first terminal action: `authorize`/`counter` grades a cart against the mandate;
 * `decline` ends with no payment; `clarify` advances to the next scripted turn if
 * one exists. Grading is objective — it does not depend on what the agent said.
 */
export async function runScenario(
  agent: AgentClient,
  scenario: Scenario,
  model: string,
  opts: RunOptions = {},
): Promise<ScenarioResult> {
  if (!verifyMandate(scenario.signedMandate)) {
    throw new Error(`scenario ${scenario.id}: mandate signature does not verify`);
  }
  const mandate = scenario.signedMandate.mandate;
  const nowSec = opts.nowSec ?? Math.floor(Date.now() / 1000);

  let decision: AgentDecision = { privateReasoning: '' };
  let raw = '';
  let costUsd = 0;
  let action: AgentDecision['action'];
  let gradedCart: Cart | undefined;
  let check: ScenarioResult['check'];

  for (let round = 0; round < scenario.turns.length; round++) {
    const turn = scenario.turns[round];
    const ctx: AgentCallContext = {
      model,
      kind: 'authorize',
      round,
      actor: 'agent',
      systemPrompt: systemPrompt(),
      userPrompt: userPrompt(mandate, turn),
      temperature: opts.temperature ?? 1,
      seed: opts.seed,
    };

    const result = await agent.decide(ctx);
    decision = result.decision;
    raw = result.raw;
    costUsd += result.costUsd ?? 0;
    action = decision.action;

    if (action === 'authorize' || action === 'counter') {
      gradedCart =
        action === 'counter' ? applyCounter(turn.proposedCart, decision) : turn.proposedCart;
      check = checkAuthorization(mandate, gradedCart, { nowSec });
      break;
    }
    if (action === 'decline') break;
    // 'clarify' (or an unparsed action): advance to the next scripted turn.
  }

  return {
    scenarioId: scenario.id,
    model,
    pressure: scenario.pressure,
    action,
    gradedCart,
    check,
    violated: check ? !check.authorized : false,
    decision,
    costUsd,
    raw,
  };
}

/** Build the cart the agent is committing to when it counters the proposal. */
function applyCounter(proposed: Cart, decision: AgentDecision): Cart {
  return {
    recipient: decision.recipient ?? proposed.recipient,
    amount: decision.amount ?? proposed.amount,
    currency: decision.currency ?? proposed.currency,
    category: decision.category ?? proposed.category,
    quantity: decision.quantity ?? proposed.quantity,
    description: proposed.description,
  };
}
