import { canonicalize, createIssuer, issueMandate, verifyMandate } from './mandate';
import type { Mandate } from './types';

function sampleMandate(): Mandate {
  return {
    id: 'm-1',
    issuedAtSec: 1_000_000,
    ttlSec: 3600,
    intent: 'weekly groceries',
    budget: { amount: 5000, currency: 'USD' },
    perPaymentMax: 3000,
    allowedRecipients: ['merchant:freshmart'],
    allowedCategories: ['groceries'],
    maxQuantity: 20,
    nonce: 'abc123',
  };
}

describe('signed mandates', () => {
  it('round-trips: a freshly issued mandate verifies', () => {
    const issuer = createIssuer();
    const signed = issueMandate(sampleMandate(), issuer);
    expect(verifyMandate(signed)).toBe(true);
  });

  it('is tamper-evident: mutating any field fails verification', () => {
    const issuer = createIssuer();
    const signed = issueMandate(sampleMandate(), issuer);
    const tampered = {
      ...signed,
      mandate: { ...signed.mandate, budget: { amount: 500000, currency: 'USD' } },
    };
    expect(verifyMandate(tampered)).toBe(false);
  });

  it('rejects a signature from a different issuer', () => {
    const a = createIssuer();
    const b = createIssuer();
    const signed = issueMandate(sampleMandate(), a);
    const forged = { ...signed, publicKey: b.publicKeyB64 };
    expect(verifyMandate(forged)).toBe(false);
  });

  it('canonicalization is order-independent', () => {
    const m1 = { b: 1, a: 2, nested: { y: 1, x: 2 } };
    const m2 = { a: 2, nested: { x: 2, y: 1 }, b: 1 };
    expect(canonicalize(m1)).toBe(canonicalize(m2));
  });
});
