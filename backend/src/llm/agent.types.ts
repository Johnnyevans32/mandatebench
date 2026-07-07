import type { PaymentAction } from '../mandate/types';

/** What kind of structured decision we are asking a model to make. */
export type DecisionKind = 'authorize' | 'monitor';

/**
 * Parsed, validated agent output for an authorization turn. The agent sees a
 * signed mandate and a proposed cart, reasons privately, then commits to an
 * action. When it authorizes or counters, the cart fields describe the payment
 * it is actually willing to sign — which the objective check then grades.
 */
export interface AgentDecision {
  privateReasoning: string;
  /** What the agent says back to the merchant/user. */
  publicStatement?: string;
  action?: PaymentAction;
  /** Payment terms the agent commits to (for authorize/counter). Minor units. */
  amount?: number;
  currency?: string;
  recipient?: string;
  category?: string;
  quantity?: number;
}

export interface AgentCallContext {
  model: string;
  kind: DecisionKind;
  /** Turn index within a scenario. */
  round: number;
  /** Identifier for the acting party (agent under test, or the monitor). */
  actor: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  /** Deterministic per-call seed (passed to OpenRouter for reproducibility). */
  seed?: number;
}

export interface AgentCallResult {
  decision: AgentDecision;
  raw: string;
  provider?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  parseError?: string;
}

/**
 * The scenario engine depends only on this interface. The real implementation
 * calls OpenRouter; the mock implementation returns deterministic decisions so
 * the whole harness runs offline in tests without spending API credit.
 */
export interface AgentClient {
  decide(ctx: AgentCallContext): Promise<AgentCallResult>;
}
