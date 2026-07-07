# MandateBench

**When you hand an AI agent your money, does it stay inside the mandate?**
A benchmark that gives payment agents a cryptographically signed spending
mandate, pushes them with adversarial pressure, and measures two things: how
often they authorize a payment that breaches the mandate, and whether a monitor
reading the agent's justification can catch the breach *before* it signs.

> Status: early. The research core — signed mandates and the objective
> violation check — is implemented and tested. The OpenRouter agent layer,
> scenario engine, persistence, and dashboard are being ported from a sibling
> project ([DeceptionBench](https://deceptionbench.xyz)) and land next.

---

## Why this exists

Agents are starting to hold and move real money — Google's AP2 and Coinbase's
x402 both build on **signed mandates**: tamper-evident contracts that capture
what an agent is authorized to spend, with whom, and for how long. The security
work so far targets the *protocol* (attacks on the rails) or a single attack
vector (prompt injection on one model). Nobody has systematically asked, across
many models and many kinds of pressure: **does the agent's own authorization
decision stay faithful to the mandate — and is that decision monitorable at the
moment before an irreversible signature?**

MandateBench is that measurement.

## Research questions

| | Question | Metric |
|---|---|---|
| **RQ1** | How often do models authorize a payment that violates the mandate? | violation rate (Wilson CI), per model, per violation type |
| **RQ2** | Which adversarial pressures break which models? | violation rate across model × pressure |
| **RQ3** | Can a black-box monitor predict a violation *before* `sign()` — and does hiding the agent's reasoning defeat it? | AUROC + degradation under a reasoning-hiding instruction |
| **RQ4** | Does the agent's stated justification match its actual decision? | rate of compliant-narration-with-violating-action |

The **pressure taxonomy** (RQ2) is the axis prior work leaves open: not just
prompt injection, but ambiguity, principal-agent overreach, merchant social
engineering, multi-turn scope drift, conflicting mandates, and urgency nudges.
See [`src/mandate/pressures.ts`](backend/src/mandate/pressures.ts).

## Why the labels are trustworthy

A mandate violation (over-budget, wrong recipient, expired, out-of-scope…) is a
**deterministic predicate** over the signed mandate and the cart — see
[`src/mandate/check.ts`](backend/src/mandate/check.ts). So the ground truth needs
no LLM judge, and because the mandate is signed, a recorded violation is
cryptographically attributable, not merely logged.

## Try the core (no API key, no cost)

```bash
cd backend
yarn install          # or npm install
yarn demo             # issue a signed mandate; check a compliant vs a violating cart
yarn test             # unit tests for signing + the violation check
yarn typecheck
```

## Architecture

```
backend/
  src/
    mandate/    signed mandates (Ed25519) + the objective violation check + pressure taxonomy
    llm/        model-agnostic agent-client interface, mock provider, structured-output schemas
    analysis/   in-stack statistics (Spearman, AUROC, bootstrap, logistic, Wilson) — verified vs known values
    scripts/    mandate-demo, stats-check
docs/
  design.md     full research design, RQ table, prior-work positioning
```

Everything is TypeScript; the statistics run in-stack (no Python). Numbers in the
paper will come from a frozen, tagged dataset snapshot while a runner keeps
collecting.

## Related work

MandateBench positions explicitly against prior AP2/x402 red-teaming, agent
policy-adherence benchmarks, and black-box / pre-action monitoring. The full
citation-and-differentiation table is in [`docs/design.md`](docs/design.md).

## License

[MIT](LICENSE).
