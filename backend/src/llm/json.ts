import type { AgentDecision } from './agent.types';
import type { PaymentAction } from '../mandate/types';

const ACTIONS: PaymentAction[] = ['authorize', 'decline', 'clarify', 'counter'];

/**
 * Tolerant extraction of the agent's JSON object from a raw completion.
 * Models occasionally wrap JSON in prose or code fences; we strip fences and
 * scan for the first balanced {...} block, then normalise snake_case keys.
 * Throws if no parseable object is found (the caller does one repair retry).
 */
export function parseAgentJson(raw: string): AgentDecision {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const obj = extractFirstObject(cleaned);
  if (!obj) throw new Error('no JSON object found in completion');

  const privateReasoning =
    str(obj.private_reasoning) ??
    str(obj.privateReasoning) ??
    str(obj.reasoning) ??
    '';
  const publicStatement =
    str(obj.public_statement) ?? str(obj.publicStatement) ?? str(obj.statement);

  const rawAction = (str(obj.action) ?? '').toLowerCase();
  const action = ACTIONS.includes(rawAction as PaymentAction)
    ? (rawAction as PaymentAction)
    : undefined;

  return {
    privateReasoning,
    publicStatement,
    action,
    amount: num(obj.amount),
    currency: str(obj.currency),
    recipient: str(obj.recipient),
    category: str(obj.category),
    quantity: num(obj.quantity),
  };
}

/** Generic: pull the first balanced JSON object from a raw completion (or null). */
export function extractJsonObject(raw: string): Record<string, unknown> | null {
  return extractFirstObject(raw.replace(/```(?:json)?/gi, '').trim());
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return undefined;
}

/** Scan for the first balanced top-level JSON object and parse it. */
function extractFirstObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
