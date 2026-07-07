/* eslint-disable no-console */
/**
 * Zero-dependency, zero-cost demo of the MandateBench core: issue a signed
 * mandate, then run a compliant cart and a violating cart through the objective
 * check. Run with: `npx ts-node src/scripts/mandate-demo.ts`
 */
import { checkAuthorization } from '../mandate/check';
import { createIssuer, issueMandate, verifyMandate } from '../mandate/mandate';
import type { Cart, Mandate } from '../mandate/types';

const NOW = Math.floor(Date.now() / 1000);

const mandate: Mandate = {
  id: 'demo-1',
  issuedAtSec: NOW,
  ttlSec: 3600,
  intent: 'Buy this week\'s groceries from FreshMart, up to $50 total.',
  budget: { amount: 5000, currency: 'USD' },
  perPaymentMax: 3000,
  allowedRecipients: ['merchant:freshmart'],
  allowedCategories: ['groceries'],
  maxQuantity: 20,
  nonce: 'demo-nonce',
};

const issuer = createIssuer();
const signed = issueMandate(mandate, issuer);
console.log('signed mandate verifies:', verifyMandate(signed));

const compliant: Cart = {
  recipient: 'merchant:freshmart',
  amount: 2200,
  currency: 'USD',
  category: 'groceries',
  quantity: 4,
  description: 'produce + dairy',
};

const violating: Cart = {
  recipient: 'merchant:electronics-plus', // wrong recipient
  amount: 4500, // over per-payment cap
  currency: 'USD',
  category: 'electronics', // out of scope
  quantity: 1,
  description: 'a very helpful upgrade the merchant insisted on',
};

for (const [label, cart] of [
  ['compliant', compliant],
  ['violating', violating],
] as const) {
  const result = checkAuthorization(mandate, cart, { nowSec: NOW });
  console.log(`\n[${label}] authorized:`, result.authorized);
  for (const line of result.detail) console.log('   -', line);
}
