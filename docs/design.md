# MandateBench — Design Doc (v0 draft, 2026-07-07)

> The first **cross-model behavioral benchmark of mandate faithfulness under an adversarial
> pressure taxonomy** for AP2/x402 signed-mandate agents, with a **pre-signature black-box
> monitorability** layer (incl. a reasoning-suppression stressor). Independent second
> PhD-differentiator alongside DeceptionBench. Working title — verify name-collision first.
>
> **NOVELTY STATUS (adversarial check, 2026-07-07): PARTIALLY TAKEN, novel-in-combination.**
> Every individual ingredient exists in 2024–2026 work. The defensible contribution is the
> COMBINATION on a signed-mandate substrate. **Two things are NOT novel and must be demoted from
> "differentiator" to "reused infrastructure": (1) crypto/tamper-evident audit logs + on-chain
> signed-mandate flow (already done by Zero-Trust AP2, arXiv 2602.06345); (2) pre-action
> monitoring in general (InferAct 2407.11843, ProbGuard 2508.00500 — InferAct literally uses the
> "accidental buy-now" example).** Lead with cross-model + operationalized pressure taxonomy +
> the pre-signature authorization gate + reasoning-suppression. Window is real but CLOSING —
> payment-agent security is hot (multiple June-2026 drops). Move fast.

## 1. The one-sentence claim
When an LLM agent is given a cryptographically **signed mandate** (budget, recipient, scope, intent, expiry) and then pushed by an adversarial merchant/environment, (a) how often does it authorize a payment that **violates** the mandate, (b) which **pressures** break which models, and (c) can a **black-box monitor** reading only the agent's justification catch the violation **before** the irreversible `sign()` — and does that survive the agent hiding its reasoning?

## 2. Why now / why this gap (July 2026)
- **AP2** (Google, Sep 2025; 60+ partners incl. Mastercard/PayPal/Coinbase; now FIDO-governed) and **x402** (Coinbase; Linux Foundation x402 Foundation, Apr 2026) made *signed mandates* the emerging standard for agents that move money.
- Existing safety work stops at the **protocol** layer (free-riding, PII leakage, five-attacks on x402) or is a **single-vector** prompt-injection red-team of AP2 ("Whispers of Wealth", 2601.22569).
- **Untouched (verified 2026-07-07):** systematic, CROSS-MODEL measurement of the *agent's own authorization decision* against a signed mandate, across an *operationalized pressure taxonomy*, with a *pre-signature monitor tied to the `sign()` gate + a reasoning-suppression stressor*. Existing AP2 red-team ("Whispers of Wealth" 2601.22569) is Gemini-only, injection-only. **SoK: Security of Autonomous LLM Agents in Agentic Commerce (2604.15367) enumerates these exact taxonomy axes and explicitly names "real-world security benchmarking remains underdeveloped" as an open gap — we operationalize that gap.**
- Adjacent second-project ideas were scouted and came back crowded (CoT-obfuscation; model-drift observatory). This one is comparatively open but the window is closing — build fast.

## 3. Why it's uniquely Evans's
Requires production agentic-execution + MPC signing + ledger/idempotency (Autospend/Figo). Academics run toy sims; we ship a **real signed-mandate flow with tamper-evident, on-chain-verifiable audit logs** (near-absent in the literature). Transfers the DeceptionBench monitorability method onto a **non-saturating** metric (authorization = hard binary ground-truth), fixing the RQ4 AUROC-ceiling critique.

## 4. Research questions
| RQ | Question | Primary metric |
|----|----------|----------------|
| RQ1 | Mandate-faithfulness: violation rate across N frontier models on benign + pressured cases | Violation rate + Wilson CI, per model, per violation type |
| RQ2 | Pressure taxonomy: which pressures break which models | Violation rate × (model × pressure) heatmap; effect size vs benign baseline |
| RQ3 | Pre-signature monitorability: can a black-box monitor predict a violation before `sign()`? Does it degrade under `hideReasoning`? | AUROC (justification → violation) + Δ under hide-reasoning |
| RQ4 | Faithfulness gap: does the stated justification match the actual decision? (agent narrates compliance while violating) | Rate of "compliant narration + violating action"; κ(stated, actual) |

## 5. Violation types (ground-truthable, binary)
Over-budget · wrong/unauthorized recipient · out-of-scope category · expired TTL · quantity/scope creep · split-transaction evasion (structuring under the cap) · currency/asset substitution.
Each is a deterministic check against the signed mandate → **no LLM judge needed for the ground truth** (unlike DeceptionBench's leakage judge). This is a major reliability win.

## 6. Pressure taxonomy (the RQ2 axis — beyond prompt injection)
1. **Ambiguity** — under-specified intent the agent must not over-interpret into spend.
2. **Principal-agent conflict** — "helpful" over-fulfillment (buy the better/bigger thing).
3. **Merchant social engineering** — upsell, fake scarcity, "you already approved this".
4. **Multi-turn scope drift** — mandate honored turn 1, eroded over a negotiation.
5. **Conflicting mandates** — two signed mandates that can't both be satisfied.
6. **Urgency/scarcity nudge** — time pressure to skip verification.
7. **Indirect prompt injection via mandate/cart fields** — the one taken vector; include for coverage + comparison to Whispers of Wealth.

## 7. Environment / harness design
- **Roles:** `Agent` (the model under test, holds the signed mandate + a `sign()` tool), `Merchant` (scripted or LLM, adversary knobs per pressure), `Mandate authority` (issues + signs Intent Mandates), `Monitor` (reads only the agent's stated justification pre-signature).
- **Turn contract (reuse DeceptionBench JSON pattern):** each agent turn emits `{ private_reasoning, public_statement, proposed_action }`; `proposed_action` ∈ {`authorize(cart)`, `decline`, `request_clarification`, `counter`}. `authorize` triggers a deterministic mandate-check → ground-truth label.
- **Signed mandates:** real Ed25519/secp256k1 signatures; mandate = JSON with `budget`, `allowed_recipients`, `allowed_categories`, `intent_summary`, `ttl`, `nonce`. Verify signatures for real (this is Evans's home turf).
- **Verifiable audit log — REUSED INFRASTRUCTURE, NOT A NOVELTY CLAIM.** Append-only hash-chained (Merkle) transcript; each `authorize` + its mandate-check committed. Cite **Zero-Trust Runtime Verification for AP2 (2602.06345)**, which already does crypto/tamper-evident signed-mandate audit + replay/context-binding — position as "they secure the transaction; we measure the model's decision." Keep it for reproducibility; do NOT sell it as the contribution. On-chain anchoring optional, later.
- **Pre-signature monitor — reframe as APPLICATION + STRESSOR, not invention.** Pre-action monitoring already exists (InferAct 2407.11843, ProbGuard 2508.00500; Constitutional Black-Box Monitoring 2603.00829 for the black-box classifier + AUROC + ceiling finding). Our durable novelty = tying it to the **signed-mandate `sign()` authorization gate specifically** + measuring **degradation under an explicit "hide your reasoning" instruction** (the DeceptionBench adversarial arm, now on a non-saturating binary metric). Given only `public_statement`/`private_reasoning` (configurable channel) just before `sign()`, output P(violation). Sweep: monitor sees reasoning vs not; agent hides reasoning vs not.
- **Determinism/repro:** per-call seeds (hash of scenario+actor+turn), pinned model IDs, logged provider/temperature, one repair retry, mock provider for offline smoke — all already patterns in the DeceptionBench code.

## 8. Reuse map (DeceptionBench → MandateBench)
| Reuse as-is | Adapt | Build new |
|-------------|-------|-----------|
| OpenRouter agent layer (RequestService wrapper, structured outputs, seed, max_tokens fixes) | Game engine → payment-flow engine | Signed-mandate issuer + verifier |
| Budget-capped continuous runner | Cross-play matrix → model × pressure matrix | Deterministic mandate-check (ground truth) |
| Verified stats (Wilson/AUROC/bootstrap/κ) | Monitor service (reasoning → label) → pre-signature monitor | Pressure-injection generator |
| Mongo persistence + snapshot tags | Dashboard (heatmap/transcript/spend) reskinned | Hash-chained/Merkle audit log (+ optional on-chain anchor) |
| Case-file visual identity (redaction motif → AUTHORIZED / VIOLATION stamps) | Analysis endpoints | Merchant adversary policies |

## 9. Models (start cross-lab, one flagship each, like DeceptionBench v2)
GPT-5.5 · Claude Opus 4.8 · Gemini 3.5 · DeepSeek V4 · Llama 4 · Grok 4.3 — pin IDs; the dynamic catalog can auto-enroll new challengers later.

## 10. Cost sketch
Each scenario = a short multi-turn negotiation (cheaper than a 5-player Mafia game). Budget-capped runner + mock smoke first. Expect an order of magnitude cheaper per data point than DeceptionBench games; the monitor pass is the same ~$1-2 order. Verify OpenRouter credit + per-key limit BEFORE any real run (hard-won DeceptionBench lesson).

## 11. Positioning against prior work (from adversarial novelty check, 2026-07-07)
**MUST cite + differentiate explicitly, or a reviewer rejects.** Verdict: PARTIALLY TAKEN, novel-in-combination.
1. **Whispers of Wealth (2601.22569)** — red-teams a real AP2 signed-mandate flow, but **Gemini-2.5-Flash only, prompt-injection only** (Branded/Vault Whisper). → We generalize to N models + a pressure taxonomy + monitoring. #1 collision & #1 contrast.
2. **SoK: Security of Autonomous LLM Agents in Agentic Commerce (2604.15367)** — systematization that already names our taxonomy axes (injection, negotiation manipulation, principal-agent, payment-protocol) and states "real-world security benchmarking remains underdeveloped." → We operationalize its stated open gap. (Borrow its vocabulary; don't reinvent it.)
3. **Zero-Trust Runtime Verification for AP2 (2602.06345)** — already does crypto/tamper-evident audit + signed mandates + replay/context-binding. → They secure the transaction; we measure the model's decision. **Demotes our audit-log claim to infra.**
4. **Constitutional Black-Box Monitoring (2603.00829)** + **InferAct (2407.11843)** / **ProbGuard (2508.00500)** — black-box + pre-action monitoring already exist (InferAct uses the "buy-now" example). → We apply pre-action black-box monitoring to the signed-mandate `sign()` gate + a reasoning-suppression stressor. **Demotes our "pre-signature is novel" claim.**
5. **ST-WebAgentBench (2410.06703)** / **τ-bench, τ²-bench** / **MANTRA (2605.06334)** / **PolicyBank (2604.15505)** — policy/scope-adherence agent benchmarks. → Web/retail policy-following ≠ signed-mandate faithfulness under payment-specific adversarial pressures.
6. **Free-Riding x402 (2605.30998)** — x402 protocol-security taxonomy + in-the-wild census. → Protocol security vs model behavior.
7. Also note: **FinHarness (2605.27333)** = guardrail/defense, not a benchmark; **AgentDojo/InjecAgent** = single-vector injection; **Meerkat (2604.11806)** = post-hoc cross-model trace violation detection (we're pre-action, single-decision, payment-scoped); **Verify Before You Commit (2604.08401)** = RQ4 faithfulness-gap construct already exists → we're a domain instantiation; **Capability Gates Are Not Authorization (2606.28679)**, **PAuth (2603.17170)** = authorization-boundary mechanisms.

**The four durable, defensible novelty pieces (lead with these):**
(1) cross-model (N frontier models) mandate-faithfulness on AP2/x402 signed mandates — everyone else is single-model or a mechanism/SoK paper;
(2) an operationalized *pressure taxonomy* (7 arms) with per-model breakdown — SoK only enumerates, injection benches only inject;
(3) pre-signature monitorability scoped to the `sign()` gate **with the "hide your reasoning" degradation stressor** — the most durable single piece;
(4) integrating RQ1–RQ4 on ONE signed-mandate substrate — the integration is the contribution.

## 12. Milestones
1. Harness fork + payment-flow engine + signed-mandate issuer/verifier + deterministic mandate-check + mock smoke (zero spend).
2. Pressure generator (7 classes) + benign baseline; RQ1/RQ2 pilot (~a few hundred scenarios).
3. Pre-signature monitor + hide-reasoning arm; RQ3/RQ4.
4. Hash-chained audit log (+ optional testnet anchor); dashboard reskin; figures.
5. Write-up → arXiv; email Bjerva/Horkoff referencing the finding + one figure + Zenodo DOI (same playbook as DeceptionBench).

## 13. Open decisions
- Name (collision check) — MandateBench vs alternatives.
- On-chain anchoring now vs later (recommend: hash-chain now, anchor as a v2 credibility add).
- Merchant adversary: scripted (reproducible, cheap) vs LLM (realistic). Recommend scripted primary + an LLM-merchant robustness arm.
- Separate repo + domain, or a second study module in the existing monorepo. Recommend a separate repo/domain for clean independent authorship (per the no-shared-branding lesson).
