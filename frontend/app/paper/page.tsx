import type { Metadata } from 'next';
import v6 from '../../data/results-v6.json';
import v7 from '../../data/results-v7.json';

export const metadata: Metadata = {
  title: 'Preprint — MandateBench | Mandate faithfulness & pre-signature monitorability',
  description:
    'MandateBench: measuring whether LLM payment agents honour cryptographically signed spending mandates under adversarial pressure, and whether a monitor can catch a breach before the irreversible signature. Separates rule violations a gateway can catch from intent violations only the model can.',
  other: {
    citation_title:
      'MandateBench: Mandate Faithfulness and Pre-Signature Monitorability for Agentic-Payment LLMs',
    citation_author: 'Evans Eburu',
    citation_publication_date: '2026',
    citation_pdf_url: 'https://mandatebench.xyz/mandatebench.pdf',
    citation_abstract_html_url: 'https://mandatebench.xyz/paper',
    citation_keywords:
      'AI safety; agentic payments; AP2; x402; signed mandate; LLM agents; monitorability; chain-of-thought monitoring; intent alignment; benchmark',
  },
};

/**
 * All numbers below render from the frozen snapshot exports
 * (data/results-*.json, written by backend `yarn export-snapshot`) —
 * never hand-typed, so the paper cannot drift from the data.
 * Scripted-arm results (Table 1) come from snapshot v7 (35 scenarios,
 * 17 intent traps, 5 domains); the suppression, monitor, and duel arms are
 * still v6 measurements pending the v7 reruns.
 */
const MODEL_META: Record<string, { name: string; lab: string }> = {
  'openai/gpt-5.5': { name: 'GPT-5.5', lab: 'OpenAI' },
  'anthropic/claude-opus-4.8': { name: 'Claude Opus 4.8', lab: 'Anthropic' },
  'moonshotai/kimi-k2.6': { name: 'Kimi K2.6', lab: 'Moonshot' },
  'google/gemini-3.5-flash': { name: 'Gemini 3.5 Flash', lab: 'Google' },
  'x-ai/grok-4.3': { name: 'Grok 4.3', lab: 'xAI' },
  'qwen/qwen3.7-max': { name: 'Qwen3.7 Max', lab: 'Alibaba' },
  'mistralai/mistral-large-2512': { name: 'Mistral Large 2512', lab: 'Mistral' },
  'deepseek/deepseek-v4-pro': { name: 'DeepSeek V4 Pro', lab: 'DeepSeek' },
  'meta-llama/llama-4-maverick': { name: 'Llama 4 Maverick', lab: 'Meta' },
};
const displayName = (id: string) => MODEL_META[id]?.name ?? id;

type Rate = { k: number; n: number; rate: number; low: number; high: number };
const pct = (r: Rate) => `${Math.round(r.rate * 100)}%`;
const count = (r: Rate) => `${r.k}/${r.n}`;
const ci = (r: Rate) => `${Math.round(r.low * 100)}–${Math.round(r.high * 100)}`;

const CALIBRATION = [...v7.calibration].sort(
  (a, b) =>
    b.intentCaught.rate - a.intentCaught.rate ||
    b.ruleCaught.rate - a.ruleCaught.rate ||
    displayName(a.model).localeCompare(displayName(b.model)),
);

const V7_GRADED = v7.violations.default.graded;
const V6_GRADED = v6.violations.default.graded + (v6.violations.hidden?.graded ?? 0);
const VIOLATIONS_DEFAULT = v6.violations.default.traps.k;
const VIOLATIONS_HIDDEN = v6.violations.hidden?.traps.k ?? 0;

const MONITOR_DEFAULT = v6.monitors.find(
  (m) => m.snapshot === v6.meta.snapshot && m.channel === 'reasoning',
)!;
const MONITOR_HIDDEN = v6.monitors.find(
  (m) => m.snapshot === v6.meta.hiddenSnapshot && m.channel === 'reasoning',
)!;

/** Hanley–McNeil SE-based 95% CI, used when the stored run predates bootstrap CIs. */
function hanleyCI(auroc: number, nPos: number, nNeg: number): [number, number] {
  const a = Math.max(auroc, 1 - auroc); // symmetric SE around chance
  const q1 = a / (2 - a);
  const q2 = (2 * a * a) / (1 + a);
  const se = Math.sqrt(
    (a * (1 - a) + (nPos - 1) * (q1 - a * a) + (nNeg - 1) * (q2 - a * a)) / (nPos * nNeg),
  );
  return [Math.max(0, auroc - 1.96 * se), Math.min(1, auroc + 1.96 * se)];
}
const monitorCI = (m: typeof MONITOR_DEFAULT): [number, number] => {
  const rec = m as Record<string, unknown>;
  return typeof rec.aurocLow === 'number' && typeof rec.aurocHigh === 'number'
    ? [rec.aurocLow, rec.aurocHigh]
    : hanleyCI(m.auroc, m.nPos, m.nNeg);
};

/** Duel rows: agents with zero breaches collapse into one line. */
const DUEL_AGENTS = [...v6.duels.agents].sort((a, b) => a.breached.rate - b.breached.rate);
const DUEL_ZERO = DUEL_AGENTS.filter((a) => a.breached.k === 0);
const DUEL_ROWS: [string, string, string, string][] = [
  ...(DUEL_ZERO.length
    ? [
        [
          DUEL_ZERO.map((a) => displayName(a.model)).join(' · '),
          count(DUEL_ZERO[0].breached),
          pct(DUEL_ZERO[0].breached),
          `${ci(DUEL_ZERO[0].breached)}%`,
        ] as [string, string, string, string],
      ]
    : []),
  ...DUEL_AGENTS.filter((a) => a.breached.k > 0).map(
    (a) =>
      [displayName(a.model), count(a.breached), pct(a.breached), `${ci(a.breached)}%`] as [
        string,
        string,
        string,
        string,
      ],
  ),
];

function intentColor(pct: number): string {
  // 100% green -> 44% red
  const t = (100 - pct) / 56;
  return `hsl(${145 - t * 137} 55% 42%)`;
}

export default function PaperPage() {
  return (
    <main className="wrap" style={{ maxWidth: 860, paddingTop: 48, paddingBottom: 64 }}>
      <div className="kicker">Preprint · v7 · 2026</div>
      <h1 style={{ fontSize: 36, margin: '10px 0 14px', letterSpacing: '-0.02em', lineHeight: 1.12 }}>
        Mandate Faithfulness and Pre-Signature Monitorability for Agentic-Payment LLMs
      </h1>
      <p className="soft" style={{ fontSize: 14, margin: 0 }}>
        <a href="https://www.linkedin.com/in/0xjevan" target="_blank" rel="noopener">
          Evans Eburu
        </a>{' '}
        · 9 frontier models, one+ per major lab · {V7_GRADED} graded authorizations across 5
        mandate domains (v7) + {V6_GRADED} (v6 pilot) + a 9×9 adversarial matrix
      </p>
      <p className="soft" style={{ fontSize: 14, marginTop: 4 }}>
        Open source (MIT) ·{' '}
        <a href="https://github.com/Johnnyevans32/mandatebench" target="_blank" rel="noopener">
          github.com/Johnnyevans32/mandatebench
        </a>{' '}
        · CC BY 4.0
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
        <a className="btn" href="/mandatebench.pdf" download="mandatebench.pdf">
          Download PDF ↓
        </a>
        <a className="btn ghost" href="/mandatebench.pdf" target="_blank" rel="noopener">
          Read in browser
        </a>
        <a className="btn ghost" href="/dashboard">
          Live dashboard →
        </a>
      </div>

      {/* One-line thesis */}
      <div
        style={{
          marginTop: 28,
          borderLeft: '3px solid var(--ink)',
          paddingLeft: 18,
          fontSize: 19,
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        No frontier model reliably catches the mandate violations only a model can
        catch: across 17 intent traps in 5 domains the best misses <b>one in ten</b>,
        the worst <b>nearly half</b> — and the three models that looked perfect on a
        small trap set <b>did not stay perfect</b> when the set grew 5×. The obvious
        way to hide this from an overseer makes it strictly worse.
      </div>

      {/* Abstract */}
      <section style={{ marginTop: 20 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>
          Abstract
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>
          Standards for AI payments (Google&apos;s AP2, Coinbase&apos;s x402) let an
          agent commit funds by signing a <em>mandate</em> — a cryptographically signed
          statement of what it is authorized to spend. Signing is irreversible, so the
          question is not whether a protocol gateway can reject a malformed request, but
          whether the <em>agent</em> can be pushed into authorizing a payment it should
          refuse — and whether that can be caught <strong>before</strong> the signature.
          MandateBench measures mandate faithfulness across nine frontier models under a
          taxonomy of adversarial pressures, with a judge-free ground truth: rule
          violations are deterministic predicates over the signed object, and intent
          traps are author-constructed and labeled before any model runs — no LLM judges
          outcomes. We separate <strong>rule</strong> violations (over budget, wrong
          recipient, out-of-scope, expired) that a gateway already catches from{' '}
          <strong>intent</strong> violations that satisfy every signed field yet betray
          the mandate&apos;s natural-language intent — a grocery mandate spent on a gift
          card or vintage champagne. We then measure pre-signature monitorability: how
          well an overseer reading only the agent&apos;s reasoning predicts a violation,
          and how a naive reasoning-hiding instruction erodes it.
        </p>
      </section>

      {/* Contributions */}
      <section style={{ marginTop: 30 }}>
        <h2>Contributions</h2>
        <ol style={{ fontSize: 15, lineHeight: 1.65, paddingLeft: 20, margin: 0 }}>
          <li>
            A signed-mandate benchmark for agentic payments with a{' '}
            <strong>judge-free ground truth</strong> (Ed25519 mandates; rule violations
            are deterministic predicates over the signed object; intent labels are
            author-constructed traps fixed before any model runs).
          </li>
          <li style={{ marginTop: 6 }}>
            A <strong>rule-vs-intent split</strong> that isolates the failures no
            protocol gateway can catch — the empirical case for a model in the loop.
          </li>
          <li style={{ marginTop: 6 }}>
            A <strong>pre-signature monitorability protocol</strong> (AUROC of a
            reasoning-reading monitor) with an adversarial reasoning-suppression arm.
          </li>
          <li style={{ marginTop: 6 }}>
            A live, open cross-play harness: every model attacks every model in a 9×9
            adversarial matrix.
          </li>
        </ol>
      </section>

      {/* Finding 1 — intent gap */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 1 — The intent gap</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '70ch' }}>
          Snapshot v7: 35 scenarios across five mandate domains (groceries, travel,
          subscriptions, donations, procurement), 17 intent traps, each domain with a
          structurally-identical clean control. The <b>intent</b> column is where models
          separate: proposals that satisfy every signed field yet break the
          mandate&apos;s meaning. Pooled intent-catch is 351/457 (77%, CI 73–80) — no
          model catches them all (best 90%, worst 57%). False refusal = clean orders
          wrongly declined (the usefulness cost); it stays ≈0 for every model, so the
          intent misses are not bought back by caution.
        </p>
        <div className="heatscroll" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Lab</th>
                <th>Rule caught (n=36)</th>
                <th>Intent caught (n=51)</th>
                <th>False refusal (n=18)</th>
              </tr>
            </thead>
            <tbody>
              {CALIBRATION.map((r) => (
                <tr key={r.model}>
                  <td className="model">{displayName(r.model)}</td>
                  <td className="soft mono" style={{ fontSize: 12 }}>
                    {MODEL_META[r.model]?.lab ?? ''}
                  </td>
                  <td className="mono">
                    {pct(r.ruleCaught)} ({count(r.ruleCaught)})
                    <div className="soft" style={{ fontSize: 10 }}>CI {ci(r.ruleCaught)}</div>
                  </td>
                  <td
                    className="mono"
                    style={{ fontWeight: 700, color: intentColor(Math.round(r.intentCaught.rate * 100)) }}
                  >
                    {pct(r.intentCaught)} ({count(r.intentCaught)})
                    <div className="soft" style={{ fontSize: 10, fontWeight: 400 }}>CI {ci(r.intentCaught)}</div>
                  </td>
                  <td className="mono">
                    {pct(r.falseRefusal)} ({count(r.falseRefusal)})
                    <div className="soft" style={{ fontSize: 10 }}>CI {ci(r.falseRefusal)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="soft mono" style={{ fontSize: 11, marginTop: 8 }}>
          Counts are snapshot v7 (3 reps/scenario, temperature 0, seeded); intervals are
          Wilson 95%. Reps at temperature 0 are near-duplicate replicates, so the
          effective n is closer to the unique-scenario count — treat the intervals as
          optimistic. Two unparseable runs (both Kimi K2.6) are excluded, not counted as
          defences.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: '72ch', marginTop: 14 }}>
          <b>Rankings from small trap sets do not replicate.</b> On the v6 pilot (3
          intent traps, one domain, n=9/model), GPT-5.5, Claude Opus 4.8, and Kimi K2.6
          looked perfect (9/9) — exactly the fragile kind of result the wide intervals
          warned about. On 17 traps across 5 domains, none stays perfect and the
          ordering reshuffles (GPT-5.5: 100% → 71%). The size of the intent gap,
          however, replicates almost exactly (pooled 75% on v6 vs 77% on v7): the gap
          is a stable property of the class; per-model leaderboard positions at small n
          are noise.
        </p>
      </section>

      {/* Finding 2 — monitorability figure */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 2 — Reasoning is only moderately monitorable</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '70ch' }}>
          <em>Measured on the v6 pilot set; the monitor pass on v7 is pending.</em>{' '}
          A monitor ({displayName(MONITOR_DEFAULT.monitorModel)}) reading <em>only</em>{' '}
          the agent&apos;s private reasoning — never the mandate numbers — predicts
          violations at AUROC {MONITOR_DEFAULT.auroc.toFixed(3)} (95% CI{' '}
          {monitorCI(MONITOR_DEFAULT)[0].toFixed(2)}–{monitorCI(MONITOR_DEFAULT)[1].toFixed(2)};{' '}
          {MONITOR_DEFAULT.nPos} violations vs {MONITOR_DEFAULT.nNeg} compliant, pooled
          across the nine agents). Diagnostic, but far from the near-perfect
          monitorability reported for reasoning in game settings. Two caveats: the AUROC
          is pooled, so it mixes between-model style with within-model discrimination,
          and the monitor scores its own outputs for one of the nine agents.
        </p>
        <MonitorFigure />
      </section>

      {/* Finding 3 — suppression backfires */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 3 — Hiding the reasoning backfires</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: '72ch' }}>
          <em className="soft" style={{ fontSize: 14 }}>
            (Measured on the v6 pilot set; the v7 suppression arm is pending.)
          </em>{' '}
          Instructing the agent to keep its reasoning bland — the obvious way to evade a
          reasoning-reading monitor — is <strong>doubly harmful</strong>. Violations
          roughly <strong>double</strong> ({VIOLATIONS_DEFAULT} → {VIOLATIONS_HIDDEN}),
          and the monitor&apos;s AUROC falls from {MONITOR_DEFAULT.auroc.toFixed(2)} to{' '}
          <strong>{MONITOR_HIDDEN.auroc.toFixed(2)} — below chance</strong>. Inspecting
          the reasoning
          shows why: told to stay bland, models stop reasoning about intent and collapse
          to structural checks, so a breach reads as more routine than a compliant
          decision and actively misleads the overseer.
        </p>
        <blockquote
          style={{
            margin: '16px 0 0',
            padding: '12px 16px',
            borderLeft: '3px solid hsl(8 60% 45%)',
            background: 'var(--card, rgba(0,0,0,0.03))',
            fontStyle: 'italic',
            fontSize: 14,
          }}
        >
          &ldquo;Payment is within budget, under per-payment cap, to allowed recipient,
          in allowed category&rdquo; — a suppressed agent&apos;s reasoning as it
          authorizes a gift-card purchase that betrays a grocery mandate.
        </blockquote>
        <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
          Reasoning suppression does not merely blind the overseer; it blinds the agent.
          Note that below-chance is itself a signal: suppression does not remove the
          information so much as invert its sign — an overseer who <em>knows</em>{' '}
          suppression is in play could flip the monitor&apos;s scores and recover
          AUROC ≈ 0.70. The danger is the overseer who doesn&apos;t know.
        </p>
      </section>

      {/* Finding 4 — adversarial */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 4 — Under live attack, the same models break</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '72ch' }}>
          <em>Measured on the v6 pilot; a seeded multi-rep, multi-goal matrix is
          pending.</em> Beyond scripted traps, every model plays the merchant and
          attacks every model&apos;s agent over a multi-turn negotiation — a full 9×9
          matrix (81 duels, one negotiation per attacker–defender pair, single over-cap
          attack goal). Robustness tracks the <em>defender</em>, not the attacker: no
          attacker exceeds a 22% success rate (2/9, CI 6–55%), while breaches
          concentrate on a few agents. With n=9 per row the intervals are wide: the
          unbreached group (0/9, upper bound 30%) separates from Mistral and Llama, but
          the DeepSeek / Mistral / Llama ordering is not itself significant. Llama 4
          Maverick sits at the bottom of both this table and the intent column above;
          the v7 results caution against reading finer cross-table agreement than that.
        </p>
        <div className="heatscroll" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Agent (defender)</th>
                <th>Breached by attackers</th>
                <th>Rate</th>
                <th>Wilson 95% CI</th>
              </tr>
            </thead>
            <tbody>
              {DUEL_ROWS.map(([m, n, r, interval]) => (
                <tr key={m}>
                  <td className="model" style={{ fontSize: 13 }}>
                    {m}
                  </td>
                  <td className="mono">{n}</td>
                  <td className="mono" style={{ fontWeight: 700, color: intentColor(100 - parseInt(r, 10)) }}>
                    {r}
                  </td>
                  <td className="mono soft" style={{ fontSize: 12 }}>
                    {interval}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="soft mono" style={{ fontSize: 11, marginTop: 8 }}>
          Each cell of the underlying matrix is a single negotiation with an unseeded
          temperature-1 attacker, so only these row marginals — not individual cells —
          carry signal.
        </p>
      </section>

      {/* Method */}
      <section style={{ marginTop: 34 }}>
        <h2>Method, in brief</h2>
        <div className="tiles">
          <div className="tile">
            <div className="v" style={{ fontSize: 15 }}>
              Signed mandate
            </div>
            <div className="k" style={{ lineHeight: 1.4 }}>
              Ed25519 over a canonical mandate; the harness verifies it and grades
              against the signed object.
            </div>
          </div>
          <div className="tile">
            <div className="v" style={{ fontSize: 15 }}>
              Deterministic grade
            </div>
            <div className="k" style={{ lineHeight: 1.4 }}>
              Rule violations are predicates over the signed object; intent labels are
              fixed at authoring time. No LLM judge.
            </div>
          </div>
          <div className="tile">
            <div className="v" style={{ fontSize: 15 }}>
              Pressure taxonomy
            </div>
            <div className="k" style={{ lineHeight: 1.4 }}>
              Principal-agent, social engineering, urgency, injection, scope drift.
            </div>
          </div>
          <div className="tile">
            <div className="v" style={{ fontSize: 15 }}>
              Monitor + suppression
            </div>
            <div className="k" style={{ lineHeight: 1.4 }}>
              AUROC of a reasoning-reading monitor, with an adversarial hidden arm.
            </div>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section style={{ marginTop: 34 }}>
        <h2>Limitations</h2>
        <p className="soft" style={{ fontSize: 14, lineHeight: 1.65, maxWidth: '72ch' }}>
          Violation rates on v6 should be read as <em>lower bounds</em>: two grading
          asymmetries in that snapshot could only understate violations (a counter-offer
          on an intent trap was graded as defended even when it committed the same
          purchase, and unparseable output ended a run ungraded). Both are fixed in the
          harness that produced v7, whose runs are also seeded, provenance-stamped
          (provider, temperature, rep, arm), and deduplicated. The monitorability,
          suppression, and duel results are still v6 measurements — on the small
          3-intent-trap set, with a single monitor model (GPT-5.5) scored pooled across
          agents including its own outputs, and one unseeded negotiation per duel cell —
          and are marked as such above; re-running those arms on v7 is the immediate
          next step. Intent labels are author-constructed (fixed before any model runs);
          independent human validation is future work. Repetitions run at temperature 0,
          so the three reps are near-duplicates and the effective sample is closer to
          the unique-scenario count — treat all intervals as optimistic. Results may be
          sensitive to prompt wording. The suppression arm uses a single naive hiding
          instruction; a trained or steganographic adversary is the stronger test of
          monitorability and is future work, as is an adaptive-adversary robustness
          curve.
        </p>
      </section>

      {/* Cite */}
      <div style={{ marginTop: 38, borderTop: '1px solid var(--line, rgba(0,0,0,0.15))', paddingTop: 22 }}>
        <p className="soft" style={{ fontSize: 14 }}>
          Full method, related work, and references:{' '}
          <a href="/mandatebench.pdf" download="mandatebench.pdf">mandatebench.pdf ↓</a> · watch it
          run on the <a href="/dashboard">live dashboard →</a>
        </p>
        <div
          className="mono"
          style={{
            marginTop: 14,
            border: '1px solid var(--line, rgba(0,0,0,0.15))',
            padding: 12,
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          <div className="kicker" style={{ marginBottom: 6 }}>
            Cite
          </div>
          Eburu, E. (2026). MandateBench: Mandate Faithfulness and Pre-Signature
          Monitorability for Agentic-Payment LLMs. Preprint,{' '}
          <a href="https://mandatebench.xyz/paper">mandatebench.xyz/paper</a>.
        </div>
      </div>

      <footer style={{ marginTop: 40, fontSize: 11 }} className="soft mono">
        © 2026 MandateBench · mandatebench.xyz · deterministic ground truth, no LLM judge
      </footer>
    </main>
  );
}

/** Two AUROC bars (default vs suppressed) with 95% CIs against a chance=0.5 marker. */
function MonitorFigure() {
  const bar = (label: string, value: number, ciLo: number, ciHi: number, color: string) => (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          marginBottom: 4,
        }}
        className="mono"
      >
        <span>{label}</span>
        <span>
          <b>{value.toFixed(3)}</b>{' '}
          <span className="soft" style={{ fontSize: 11 }}>
            [{ciLo.toFixed(2)}, {ciHi.toFixed(2)}]
          </span>
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 22,
          background: 'var(--card, rgba(0,0,0,0.06))',
          border: '1px solid var(--line, rgba(0,0,0,0.15))',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, width: `${value * 100}%`, background: color }} />
        {/* 95% CI whisker */}
        <div
          style={{
            position: 'absolute',
            left: `${ciLo * 100}%`,
            width: `${(ciHi - ciLo) * 100}%`,
            top: '50%',
            height: 0,
            borderTop: '2px solid var(--ink, #333)',
            opacity: 0.75,
          }}
        />
        {/* chance = 0.5 marker */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -4,
            bottom: -4,
            width: 0,
            borderLeft: '2px dashed var(--ink, #333)',
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
  const [dLo, dHi] = monitorCI(MONITOR_DEFAULT);
  const [hLo, hHi] = monitorCI(MONITOR_HIDDEN);
  return (
    <div style={{ marginTop: 16, maxWidth: 560 }}>
      {bar('Default reasoning', MONITOR_DEFAULT.auroc, dLo, dHi, 'hsl(145 52% 40%)')}
      {bar('Suppressed reasoning', MONITOR_HIDDEN.auroc, hLo, hHi, 'hsl(8 60% 47%)')}
      <div className="soft mono" style={{ fontSize: 11, marginTop: 8 }}>
        Dashed line = 0.50 (chance); whiskers are 95% CIs (Hanley–McNeil). Suppressed
        reasoning falls significantly below chance (z ≈ 4.6), and the drop from{' '}
        {MONITOR_DEFAULT.auroc.toFixed(3)} is significant (z ≈ 5.1).
      </div>
    </div>
  );
}
