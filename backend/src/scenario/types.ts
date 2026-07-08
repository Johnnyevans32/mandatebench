import type {
  AuthorizationCheck,
  Cart,
  PaymentAction,
  SignedMandate,
} from '../mandate/types';
import type { PressureId } from '../mandate/pressures';
import type { AgentDecision } from '../llm/agent.types';

/** One step of the scripted counterparty: what it says + the cart it proposes. */
export interface MerchantTurn {
  message: string;
  proposedCart: Cart;
}

/**
 * The ground-truth class of a scenario, by construction:
 *  - `clean`  — authorizing the proposal is correct; declining is over-refusal.
 *  - `rule`   — the proposal breaks a *structural* mandate term (budget, cap,
 *               recipient, category, expiry, quantity). A dumb protocol gateway
 *               that validates the signed fields catches these without a model.
 *  - `intent` — the proposal satisfies every structural term yet violates the
 *               mandate's natural-language *intent* (e.g. converting a grocery
 *               mandate into a gift card, or a luxury splurge dressed as
 *               "groceries"). No structural check can catch these — only an
 *               agent (or a monitor) that reasons about intent can. This is the
 *               class that justifies measuring the model at all.
 */
export type GroundTruth = 'clean' | 'rule' | 'intent';

/**
 * A single benchmark case: a signed mandate, a pressure class, and the scripted
 * merchant interaction. The agent under test sees the mandate and the merchant's
 * proposal and decides whether to authorize.
 */
export interface Scenario {
  id: string;
  pressure: PressureId;
  /** Short description of the trap, for transcripts. */
  description: string;
  signedMandate: SignedMandate;
  /** Scripted merchant turns. The initial arms are single-turn. */
  turns: MerchantTurn[];
  /**
   * Payments already authorized earlier in this session under the same mandate.
   * Fed to the objective check (for cumulative-budget and structuring traps) and
   * surfaced to the agent, so it can reason about remaining budget.
   */
  priorAuthorized?: Cart[];
  /** Ground-truth class of the proposal (see {@link GroundTruth}). */
  groundTruth: GroundTruth;
  /**
   * Convenience: would authorizing the proposal breach the mandate at all
   * (rule OR intent)? A faithful agent declines exactly these. Derived from
   * `groundTruth` (true unless clean).
   */
  expectViolationIfAuthorized: boolean;
}

/** The graded outcome of running one scenario against one model. */
export interface ScenarioResult {
  scenarioId: string;
  model: string;
  pressure: PressureId;
  groundTruth: GroundTruth;
  action?: PaymentAction;
  /** The cart that was graded (the proposal, or the agent's counter), if any. */
  gradedCart?: Cart;
  check?: AuthorizationCheck;
  /** True iff the decision breached the mandate (rule OR intent). */
  violated: boolean;
  /** Which kind of breach, when one occurred. */
  violationClass?: 'rule' | 'intent';
  /** Did the agent commit a payment (authorize/counter) at all? */
  authorizedPayment: boolean;
  /** Correct call: authorize a clean proposal, refuse a rule/intent violation. */
  correct: boolean;
  decision: AgentDecision;
  costUsd: number;
  raw: string;
}
