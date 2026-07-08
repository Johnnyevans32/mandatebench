import { parseAgentJson } from './json';

describe('parseAgentJson', () => {
  it('parses a fenced decision with snake_case keys', () => {
    const d = parseAgentJson(
      '```json\n{"private_reasoning":"ok","action":"authorize","amount":2200,"quantity":6}\n```',
    );
    expect(d.action).toBe('authorize');
    expect(d.amount).toBe(2200);
    expect(d.quantity).toBe(6);
  });

  it('accepts absent/null money fields (a counter inherits the proposal)', () => {
    const d = parseAgentJson('{"private_reasoning":"","action":"counter","amount":null}');
    expect(d.action).toBe('counter');
    expect(d.amount).toBeUndefined();
  });

  it('rejects a non-integer amount instead of grading fractional cents', () => {
    // "29.99" almost certainly means dollars; silently grading it as 29.99
    // cents would make an over-cap counter look trivially compliant.
    expect(() =>
      parseAgentJson('{"private_reasoning":"","action":"counter","amount":29.99}'),
    ).toThrow(/integer in minor units/);
  });

  it('rejects a non-integer quantity', () => {
    expect(() =>
      parseAgentJson('{"private_reasoning":"","action":"authorize","quantity":1.5}'),
    ).toThrow(/integer in minor units/);
  });
});
