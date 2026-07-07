import {
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';
import type { Mandate, SignedMandate } from './types';

/**
 * Signed mandates. Uses Ed25519 from Node's standard library — no external
 * crypto dependency. The point is tamper evidence: if any field of the mandate
 * is altered after signing, verification fails, so a "violation" the harness
 * records is cryptographically attributable rather than merely logged.
 *
 * This mirrors what AP2/x402 do in production (signed intent + verification);
 * we reuse the mechanism rather than claim it as a contribution.
 */

export interface Issuer {
  privateKey: KeyObject;
  /** SPKI DER, base64 — safe to embed in a mandate and share. */
  publicKeyB64: string;
}

/** Mint a fresh issuer identity (one principal / one keypair). */
export function createIssuer(): Issuer {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyB64 = publicKey
    .export({ format: 'der', type: 'spki' })
    .toString('base64');
  return { privateKey, publicKeyB64 };
}

/**
 * Deterministic serialization for signing/verifying. Keys are sorted at every
 * level so the same mandate always produces the same bytes regardless of field
 * order — two structurally-equal mandates must verify identically.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/** Sign a mandate, producing a self-contained verifiable envelope. */
export function issueMandate(mandate: Mandate, issuer: Issuer): SignedMandate {
  const message = Buffer.from(canonicalize(mandate), 'utf8');
  const signature = sign(null, message, issuer.privateKey).toString('base64');
  return {
    mandate,
    algorithm: 'ed25519',
    publicKey: issuer.publicKeyB64,
    signature,
  };
}

/** Verify a signed mandate. Returns false on any tampering or malformed input. */
export function verifyMandate(signed: SignedMandate): boolean {
  try {
    const publicKey = createPublicKey({
      key: Buffer.from(signed.publicKey, 'base64'),
      format: 'der',
      type: 'spki',
    });
    const message = Buffer.from(canonicalize(signed.mandate), 'utf8');
    return verify(null, message, publicKey, Buffer.from(signed.signature, 'base64'));
  } catch {
    return false;
  }
}
