import { checkAuthorization } from './check';
import type { Cart, Mandate } from './types';

const NOW = 1_000_000;

function mandate(overrides: Partial<Mandate> = {}): Mandate {
  return {
    id: 'm-1',
    issuedAtSec: NOW,
    ttlSec: 3600,
    intent: 'weekly groceries',
    budget: { amount: 5000, currency: 'USD' },
    perPaymentMax: 3000,
    allowedRecipients: ['merchant:freshmart'],
    allowedCategories: ['groceries'],
    maxQuantity: 20,
    nonce: 'abc123',
    ...overrides,
  };
}

function cart(overrides: Partial<Cart> = {}): Cart {
  return {
    recipient: 'merchant:freshmart',
    amount: 2000,
    currency: 'USD',
    category: 'groceries',
    quantity: 3,
    description: 'produce',
    ...overrides,
  };
}

describe('checkAuthorization', () => {
  it('authorizes a fully compliant cart', () => {
    const result = checkAuthorization(mandate(), cart(), { nowSec: NOW });
    expect(result.authorized).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('flags an over-budget single payment', () => {
    const result = checkAuthorization(mandate(), cart({ amount: 6000 }), {
      nowSec: NOW,
    });
    // 6000 breaches both the per-payment cap (3000) and the budget (5000).
    expect(result.violations).toContain('over_per_payment_cap');
    expect(result.violations).toContain('over_budget');
    expect(result.authorized).toBe(false);
  });

  it('flags an unauthorized recipient', () => {
    const result = checkAuthorization(
      mandate(),
      cart({ recipient: 'merchant:unknown' }),
      { nowSec: NOW },
    );
    expect(result.violations).toEqual(['unauthorized_recipient']);
  });

  it('flags an out-of-scope category', () => {
    const result = checkAuthorization(
      mandate(),
      cart({ category: 'electronics' }),
      { nowSec: NOW },
    );
    expect(result.violations).toEqual(['out_of_scope_category']);
  });

  it('flags an expired mandate', () => {
    const result = checkAuthorization(mandate(), cart(), {
      nowSec: NOW + 3601,
    });
    expect(result.violations).toEqual(['expired_ttl']);
  });

  it('flags quantity creep', () => {
    const result = checkAuthorization(mandate(), cart({ quantity: 21 }), {
      nowSec: NOW,
    });
    expect(result.violations).toEqual(['quantity_creep']);
  });

  it('flags a currency mismatch', () => {
    const result = checkAuthorization(
      mandate(),
      cart({ currency: 'EUR' }),
      { nowSec: NOW },
    );
    expect(result.violations).toContain('currency_mismatch');
  });

  it('allows spend up to but not over the budget ceiling', () => {
    // 2500 prior + 2500 now = 5000, exactly the budget — permitted.
    const result = checkAuthorization(mandate(), cart({ amount: 2500 }), {
      nowSec: NOW,
      priorAuthorized: [cart({ amount: 2500 })],
    });
    expect(result.authorized).toBe(true);
  });

  it('flags cumulative over-budget even when each payment is in-cap', () => {
    // No per-payment cap here, so we isolate the pure cumulative-budget breach:
    // 3000 prior + 3000 now = 6000 > 5000 budget.
    const m = mandate({ perPaymentMax: undefined });
    const result = checkAuthorization(m, cart({ amount: 3000 }), {
      nowSec: NOW,
      priorAuthorized: [cart({ amount: 3000 })],
    });
    expect(result.violations).toEqual(['over_budget']);
    expect(result.authorized).toBe(false);
  });

  it('detects cap-evasion structuring within budget via a shared orderRef', () => {
    // One $48 order split into two $24 slices: each under the $30 cap, total
    // within the $50 budget — but the slices share an orderRef and together
    // exceed the cap, which is exactly what the cap was meant to prevent.
    const result = checkAuthorization(
      mandate(),
      cart({ amount: 2400, orderRef: 'order-77' }),
      {
        nowSec: NOW,
        priorAuthorized: [cart({ amount: 2400, orderRef: 'order-77' })],
      },
    );
    expect(result.violations).toEqual(['structuring']);
    expect(result.authorized).toBe(false);
  });

  it('does not flag separate orders that merely repeat under the cap', () => {
    // Two independent sub-cap orders (different orderRefs, within budget) are
    // ordinary repeat shopping, not structuring.
    const result = checkAuthorization(
      mandate(),
      cart({ amount: 2400, orderRef: 'order-2' }),
      {
        nowSec: NOW,
        priorAuthorized: [cart({ amount: 2400, orderRef: 'order-1' })],
      },
    );
    expect(result.authorized).toBe(true);
  });

  it('detects structuring: sub-cap payments that breach the budget together', () => {
    // Each payment (2500) is under the per-payment cap (3000) but three of them
    // total 7500, over the 5000 budget — the agent is slicing to evade the cap.
    const prior = [cart({ amount: 2500 }), cart({ amount: 2500 })];
    const result = checkAuthorization(mandate(), cart({ amount: 2500 }), {
      nowSec: NOW,
      priorAuthorized: prior,
    });
    expect(result.violations).toContain('over_budget');
    expect(result.violations).toContain('structuring');
    expect(result.authorized).toBe(false);
  });
});
