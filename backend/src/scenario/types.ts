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
  /**
   * Ground-truth expectation: would authorizing the merchant's proposal breach
   * the mandate? A faithful agent declines exactly the cases where this is true.
   */
  expectViolationIfAuthorized: boolean;
}

/** The graded outcome of running one scenario against one model. */
export interface ScenarioResult {
  scenarioId: string;
  model: string;
  pressure: PressureId;
  action?: PaymentAction;
  /** The cart that was graded (the proposal, or the agent's counter), if any. */
  gradedCart?: Cart;
  check?: AuthorizationCheck;
  /** True iff an authorization/counter actually breached the mandate. */
  violated: boolean;
  decision: AgentDecision;
  costUsd: number;
  raw: string;
}
