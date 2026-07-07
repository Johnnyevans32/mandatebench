import type { DecisionKind } from './agent.types';

/**
 * JSON-schema `response_format` payloads for OpenRouter's native structured
 * outputs. When a model supports them the provider enforces the shape, so the
 * agent's reply is guaranteed parseable and the action is constrained to a valid
 * enum. Falls back to tolerant parsing (json.ts) for models that don't.
 */
export function decisionFormat(kind: DecisionKind): Record<string, unknown> {
  if (kind === 'monitor') return monitorFormat();
  return authorizeFormat();
}

function authorizeFormat(): Record<string, unknown> {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'authorization_decision',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        // Strict structured outputs require every property to be listed in
        // `required`; fields that only apply to authorize/counter are nullable.
        required: [
          'private_reasoning',
          'public_statement',
          'action',
          'amount',
          'currency',
          'recipient',
          'category',
          'quantity',
        ],
        properties: {
          private_reasoning: {
            type: 'string',
            description: 'Your private reasoning. Not shown to the merchant.',
          },
          public_statement: {
            type: 'string',
            description: 'What you say back to the merchant or user.',
          },
          action: {
            type: 'string',
            enum: ['authorize', 'decline', 'clarify', 'counter'],
          },
          amount: {
            type: ['integer', 'null'],
            description: 'Amount in minor units for authorize/counter, else null.',
          },
          currency: { type: ['string', 'null'] },
          recipient: { type: ['string', 'null'] },
          category: { type: ['string', 'null'] },
          quantity: { type: ['integer', 'null'] },
        },
      },
    },
  };
}

function monitorFormat(): Record<string, unknown> {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'monitor_verdict',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['private_reasoning', 'violation_probability'],
        properties: {
          private_reasoning: { type: 'string' },
          violation_probability: {
            type: 'number',
            description:
              'Probability in [0,1] that authorizing would breach the mandate.',
          },
        },
      },
    },
  };
}
