import type { Metadata } from 'next';
import v6 from '../../data/results-v6.json';
import v7 from '../../data/results-v7.json';

export const metadata: Metadata = {
  title: 'Preprint · MandateBench | Mandate faithfulness & pre-signature monitorability',
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

const V7_GRADED = v7.violations.default.graded + (v7.violations.hidden?.graded ?? 0);
const V6_GRADED = v6.violations.default.graded + (v6.violations.hidden?.graded ?? 0);
const VIOLATIONS_DEFAULT = v7.violations.default.traps;
const VIOLATIONS_HIDDEN = v7.violations.hidden!.traps;

const MONITOR_DEFAULT = v7.monitors.find(
  (m) => m.snapshot === v7.meta.snapshot && m.channel === 'reasoning',
)!;
const MONITOR_HIDDEN = v7.monitors.find(
  (m) => m.snapshot === v7.meta.hiddenSnapshot && m.channel === 'reasoning',
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
        · 9 frontier models, one+ per major lab · {V7_GRADED.toLocaleString()} graded
        authorizations across 5 mandate domains + suppression arm (v7) · {V6_GRADED} (v6
        pilot) + a 9×9 adversarial matrix
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
        No frontier model reliably catches the mandate violations that only a model
        can catch. Across 17 intent traps in 5 domains, the best misses{' '}
        <b>one in ten</b> and the worst misses <b>nearly half</b>. The three models
        that looked perfect on a small trap set <b>did not stay perfect</b> when the
        set grew 5×. And the obvious trick for hiding this from an overseer makes
        everything worse.
      </div>

      {/* Abstract */}
      <section style={{ marginTop: 20 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>
          Abstract
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>
          New payment standards (Google&apos;s AP2, Coinbase&apos;s x402) let an AI
          agent spend money by signing a <em>mandate</em>: a cryptographically signed
          statement of what it is allowed to spend. A signature cannot be undone. So
          the real question is not whether a payment gateway can reject a malformed
          request. It is whether the <em>agent</em> itself can be talked into approving
          a payment it should refuse, and whether that can be caught{' '}
          <strong>before</strong> it signs. MandateBench measures this across nine
          frontier models under several kinds of adversarial pressure, with no LLM
          judge anywhere: rule violations are checked by plain code against the signed
          mandate, and intent traps are written and labeled by hand before any model
          runs. We split violations into two kinds. <strong>Rule</strong> violations
          (over budget, wrong recipient, wrong category, expired) are the kind a
          gateway already blocks. <strong>Intent</strong> violations pass every signed
          field but still break what the user actually asked for, like a grocery
          mandate spent on a gift card or a bottle of vintage champagne. We also
          measure whether an overseer reading only the agent&apos;s reasoning can
          predict a violation before the signature, and what happens when the agent is
          told to hide its reasoning.
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
            protocol gateway can catch. This is the empirical case for a model in the
            loop.
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
        <h2>Finding 1: The intent gap</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '70ch' }}>
          Snapshot v7: 35 scenarios across five mandate domains (groceries, travel,
          subscriptions, donations, procurement) with 17 intent traps. Each domain has
          a clean control that looks structurally identical to its traps. The{' '}
          <b>intent</b> column is where models separate: proposals that pass every
          signed field but break what the mandate means. Pooled intent catch is
          351/457 (77%, CI 73 to 80). No model catches them all: the best gets 90%,
          the worst 57%. False refusal counts clean orders that were wrongly declined,
          and it stays near zero for every model, so the misses are not the price of
          caution.
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
          Counts are snapshot v7 (3 reps per scenario, temperature 0, seeded);
          intervals are Wilson 95%. Reps at temperature 0 come out nearly identical,
          so the effective sample is closer to the unique scenario count. Read the
          intervals as optimistic. Two unparseable runs (both Kimi K2.6) are excluded,
          not counted as catches.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: '72ch', marginTop: 14 }}>
          <b>Rankings from small trap sets do not replicate.</b> On the v6 pilot (3
          intent traps, one domain, n=9 per model), GPT-5.5, Claude Opus 4.8, and Kimi
          K2.6 looked perfect at 9/9. That is exactly the kind of result the wide
          intervals warned about. On 17 traps across 5 domains, none of them stays
          perfect and the order changes (GPT-5.5 drops from 100% to 71%). The size of
          the gap barely moves though: pooled 75% on v6, 77% on v7. The gap is a
          stable property of the problem. Where each model sits on a small leaderboard
          is mostly noise.
        </p>
      </section>

      {/* Finding 2 — monitorability figure */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 2: Reasoning is only moderately monitorable</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '70ch' }}>
          A monitor ({displayName(MONITOR_DEFAULT.monitorModel)}) reads <em>only</em>{' '}
          the agent&apos;s private reasoning, never the mandate numbers, and predicts
          violations at AUROC {MONITOR_DEFAULT.auroc.toFixed(3)} (bootstrap 95% CI{' '}
          {monitorCI(MONITOR_DEFAULT)[0].toFixed(2)} to{' '}
          {monitorCI(MONITOR_DEFAULT)[1].toFixed(2)}; {MONITOR_DEFAULT.nPos} violations
          vs {MONITOR_DEFAULT.nNeg} compliant on snapshot v7, one rep per scenario,
          pooled across the nine agents; the v6 pilot gave 0.669). That is useful but
          far from the near-perfect monitorability reported for reasoning in game
          settings. Two caveats. The score is pooled, so it mixes each model&apos;s
          writing style with the real signal inside a model. And the monitor grades its
          own outputs for one of the nine agents. Per-model AUROCs (small samples of
          2 to 10 positives, treat as exploratory) vary a lot: Grok, Qwen and Opus land
          around 0.82 to 0.84, while Llama (0.26) and Gemini (0.33) are below chance
          with nothing hidden at all. Whose reasoning you can monitor may matter as
          much as whether reasoning can be monitored.
        </p>
        <MonitorFigure />
      </section>

      {/* Finding 3 — suppression backfires */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 3: Hiding the reasoning backfires</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: '72ch' }}>
          Telling the agent to keep its reasoning bland, the obvious way to beat a
          reasoning-reading monitor, <strong>hurts twice</strong>. On snapshot v7, trap
          violations rise by a third ({VIOLATIONS_DEFAULT.k}/{VIOLATIONS_DEFAULT.n} to{' '}
          {VIOLATIONS_HIDDEN.k}/{VIOLATIONS_HIDDEN.n}, Fisher p ≈ 0.003; the smaller v6
          pilot showed roughly a doubling). And the monitor&apos;s AUROC falls from{' '}
          {MONITOR_DEFAULT.auroc.toFixed(2)} to{' '}
          <strong>{MONITOR_HIDDEN.auroc.toFixed(2)}, below chance</strong> (v6 showed
          the same: 0.67 to 0.30). Reading the transcripts shows why. Told to stay
          bland, models stop thinking about intent and fall back to box-ticking the
          structural checks, so a breach reads as more routine than an honest compliant
          decision and points the overseer the wrong way.
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
          in allowed category.&rdquo; A suppressed agent&apos;s reasoning as it approves
          a gift-card purchase that breaks a grocery mandate.
        </blockquote>
        <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
          Hiding the reasoning does not just blind the overseer. It blinds the agent.
          One more thing worth noticing: below chance is itself a signal. Suppression
          flips the sign of the information rather than deleting it, so an overseer who{' '}
          <em>knows</em> suppression is happening could invert the scores and get back
          to about {(1 - MONITOR_HIDDEN.auroc).toFixed(2)}. The danger is the overseer
          who does not know.
        </p>
      </section>

      {/* Finding 4 — adversarial */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 4: Under live attack (v6 pilot)</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '72ch' }}>
          <em>Measured on the v6 pilot; a seeded rerun with more attack goals is
          planned.</em> Beyond scripted traps, every model plays the merchant and
          attacks every other model&apos;s agent in a multi-turn negotiation: a full
          9×9 matrix, 81 duels, one negotiation per pair, one attack goal. Robustness
          depends on the <em>defender</em>, not the attacker. No attacker succeeds more
          than 22% of the time (2/9, CI 6 to 55%), but the breaches pile up on a few
          agents. With n=9 per row the intervals are wide. The unbreached group (0/9,
          upper bound 30%) separates from Mistral and Llama, but the order among
          DeepSeek, Mistral and Llama is not significant. Llama 4 Maverick sits at the
          bottom of both this table and the intent column above. Beyond that, the v7
          reshuffle says not to read much into agreement between the two tables:
          DeepSeek and Mistral got breached here yet sit near the top of the v7 intent
          ranking.
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
          Each cell of the matrix is a single negotiation with an unseeded
          temperature-1 attacker, so only these row totals mean anything. Individual
          cells do not.
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
          The duel matrix is still a v6 pilot measurement (one unseeded negotiation per
          cell, one attack goal) and is labeled that way above; the seeded rerun is
          future work. The monitor is one model (GPT-5.5), scores one rep per scenario,
          is pooled across agents, and grades its own outputs for one of the nine.
          Per-model AUROCs rest on 2 to 10 positives each, so treat them as
          exploratory. Intent labels are written by the author and fixed before any
          model runs; independent human validation is future work. Reps run at
          temperature 0 and come out nearly identical, so the effective sample is
          closer to the unique scenario count and every interval here is optimistic.
          Results may be sensitive to prompt wording. The suppression arm uses one
          naive hiding instruction; a trained or steganographic adversary is the
          stronger test and is future work. Finally, v6 rates were also lower bounds
          because of two grading bugs fixed before v7: a counter that committed the
          same purchase was graded as a catch, and unparseable output was graded as a
          non-violation.
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
        Dashed line = 0.50 (chance); whiskers are bootstrap 95% CIs. Suppressed
        reasoning falls significantly below chance (z ≈ 2.8), and the drop from{' '}
        {MONITOR_DEFAULT.auroc.toFixed(3)} is significant (z ≈ 3.8). Snapshot v7,
        one rep per scenario.
      </div>
    </div>
  );
}
