/**
 * Core domain types for MandateBench.
 *
 * A *mandate* is the signed authorization a principal (user) hands to a payment
 * agent: how much it may spend, with whom, on what, and for how long. It mirrors
 * the "Intent Mandate" of AP2 and the signed-authorization model of x402 — a
 * tamper-evident contract the agent must not exceed.
 *
 * A *cart* is a concrete payment the agent is about to authorize (typically
 * proposed by a merchant). The whole benchmark turns on one question: does the
 * agent's authorization stay inside the mandate?
 *
 * Amounts are integers in the currency's minor unit (e.g. cents) to avoid float
 * rounding — money comparisons must be exact.
 */

export interface Money {
  /** Integer amount in the minor unit (cents, satoshi-equivalent, etc.). */
  amount: number;
  /** ISO-4217 code or an asset symbol (e.g. "USD", "USDC"). */
  currency: string;
}

export type PaymentCategory = string;

/** The signed instruction. Everything the agent is (and isn't) allowed to do. */
export interface Mandate {
  id: string;
  /** Unix seconds when the mandate was issued. */
  issuedAtSec: number;
  /** Validity window in seconds; the mandate expires at issuedAtSec + ttlSec. */
  ttlSec: number;
  /** Human-readable statement of intent ("groceries for this week"). */
  intent: string;
  /** Total spend ceiling across all payments made under this mandate. */
  budget: Money;
  /** Optional cap on any single payment (same currency as budget). */
  perPaymentMax?: number;
  /** Recipients the agent may pay. Empty means "none" — not "any". */
  allowedRecipients: string[];
  /** Categories the agent may spend on. Empty means "none". */
  allowedCategories: PaymentCategory[];
  /** Optional cap on quantity in a single cart. */
  maxQuantity?: number;
  /** Random nonce; makes each mandate's signature unique and replay-detectable. */
  nonce: string;
}

/** A mandate plus a detached signature over its canonical serialization. */
export interface SignedMandate {
  mandate: Mandate;
  algorithm: 'ed25519';
  /** Issuer public key, SPKI DER, base64. */
  publicKey: string;
  /** Signature over canonicalize(mandate), base64. */
  signature: string;
}

/** A concrete payment the agent is deciding whether to authorize. */
export interface Cart {
  recipient: string;
  /** Integer minor-unit amount. */
  amount: number;
  currency: string;
  category: PaymentCategory;
  quantity: number;
  description?: string;
}

/** What the agent can do when handed a cart. */
export type PaymentAction = 'authorize' | 'decline' | 'clarify' | 'counter';

/**
 * The ways an authorization can breach its mandate. Each is a deterministic,
 * ground-truthable predicate — the reason MandateBench needs no LLM judge to
 * label an outcome, unlike deception benchmarks that grade free text.
 */
export type ViolationType =
  | 'over_budget' // cumulative spend would exceed the total budget
  | 'over_per_payment_cap' // single payment exceeds perPaymentMax
  | 'unauthorized_recipient' // recipient not on the allow-list
  | 'out_of_scope_category' // category not on the allow-list
  | 'expired_ttl' // mandate has expired
  | 'quantity_creep' // quantity exceeds maxQuantity
  | 'currency_mismatch' // cart currency != budget currency
  | 'structuring'; // splitting payments to slip under a per-payment cap

export interface AuthorizationCheck {
  /** True iff there are zero violations. */
  authorized: boolean;
  violations: ViolationType[];
  /** One human-readable line per violation, for transcripts and audit logs. */
  detail: string[];
}
