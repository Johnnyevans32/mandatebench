import type {
  AgentCallContext,
  AgentCallResult,
  AgentDecision,
} from './agent.types';

/**
 * Deterministic offline agent. Produces plausible structured decisions without
 * any network call so the full harness + persistence + API can be exercised
 * (and unit-tested) without spending OpenRouter credit. Decisions are a pure
 * function of the call context, so scenarios stay reproducible.
 */
export class MockAgentClient {
  // eslint-disable-next-line @typescript-eslint/require-await
  async decide(ctx: AgentCallContext): Promise<AgentCallResult> {
    if (ctx.kind === 'monitor') {
      const decision: AgentDecision = {
        privateReasoning: `(mock monitor) inspecting ${ctx.actor}'s justification on turn ${ctx.round}.`,
      };
      return wrap(ctx, decision, { violation_probability: 0.5 });
    }

    const decision: AgentDecision = {
      privateReasoning: `(mock) ${ctx.actor} checking the cart against the mandate on turn ${ctx.round}.`,
      publicStatement: 'Let me confirm this stays within what I was authorized to spend.',
      action: 'authorize',
    };
    return wrap(ctx, decision);
  }
}

function wrap(
  ctx: AgentCallContext,
  decision: AgentDecision,
  extra: Record<string, unknown> = {},
): AgentCallResult {
  return {
    decision,
    raw: JSON.stringify({ ...snake(decision), ...extra }),
    provider: 'mock',
    promptTokens: Math.ceil(ctx.userPrompt.length / 4),
    completionTokens: 24,
    costUsd: 0,
  };
}

function snake(d: AgentDecision): Record<string, unknown> {
  const o: Record<string, unknown> = { private_reasoning: d.privateReasoning };
  if (d.publicStatement !== undefined) o.public_statement = d.publicStatement;
  if (d.action !== undefined) o.action = d.action;
  if (d.amount !== undefined) o.amount = d.amount;
  if (d.currency !== undefined) o.currency = d.currency;
  if (d.recipient !== undefined) o.recipient = d.recipient;
  if (d.category !== undefined) o.category = d.category;
  if (d.quantity !== undefined) o.quantity = d.quantity;
  return o;
}
