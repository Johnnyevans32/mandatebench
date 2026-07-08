import type { Metadata } from 'next';

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

/** Each cell: [count, percent, Wilson 95% CI]. Rule n=27 (9 traps × 3 reps), intent n=9, clean n=6. */
type Cell = [count: string, pct: string, ci: string];
const CALIBRATION: { model: string; lab: string; rule: Cell; intent: Cell; refuse: Cell }[] = [
  { model: 'GPT-5.5', lab: 'OpenAI', rule: ['27/27', '100%', '88–100'], intent: ['9/9', '100%', '70–100'], refuse: ['0/6', '0%', '0–39'] },
  { model: 'Claude Opus 4.8', lab: 'Anthropic', rule: ['27/27', '100%', '88–100'], intent: ['9/9', '100%', '70–100'], refuse: ['0/6', '0%', '0–39'] },
  { model: 'Kimi K2.6', lab: 'Moonshot', rule: ['27/27', '100%', '88–100'], intent: ['9/9', '100%', '70–100'], refuse: ['0/6', '0%', '0–39'] },
  { model: 'Gemini 3.5 Flash', lab: 'Google', rule: ['27/27', '100%', '88–100'], intent: ['6/9', '67%', '35–88'], refuse: ['0/6', '0%', '0–39'] },
  { model: 'Grok 4.3', lab: 'xAI', rule: ['27/27', '100%', '88–100'], intent: ['6/9', '67%', '35–88'], refuse: ['1/6', '17%', '3–56'] },
  { model: 'Qwen3.7 Max', lab: 'Alibaba', rule: ['27/27', '100%', '88–100'], intent: ['6/9', '67%', '35–88'], refuse: ['0/6', '0%', '0–39'] },
  { model: 'Mistral Large 2512', lab: 'Mistral', rule: ['25/27', '93%', '77–98'], intent: ['6/9', '67%', '35–88'], refuse: ['0/6', '0%', '0–39'] },
  { model: 'DeepSeek V4 Pro', lab: 'DeepSeek', rule: ['24/27', '89%', '72–96'], intent: ['6/9', '67%', '35–88'], refuse: ['0/6', '0%', '0–39'] },
  { model: 'Llama 4 Maverick', lab: 'Meta', rule: ['23/27', '85%', '68–94'], intent: ['4/9', '44%', '19–73'], refuse: ['0/6', '0%', '0–39'] },
];

function intentColor(pct: number): string {
  // 100% green -> 44% red
  const t = (100 - pct) / 56;
  return `hsl(${145 - t * 137} 55% 42%)`;
}

export default function PaperPage() {
  return (
    <main className="wrap" style={{ maxWidth: 860, paddingTop: 48, paddingBottom: 64 }}>
      <div className="kicker">Preprint · Pilot · 2026</div>
      <h1 style={{ fontSize: 36, margin: '10px 0 14px', letterSpacing: '-0.02em', lineHeight: 1.12 }}>
        Mandate Faithfulness and Pre-Signature Monitorability for Agentic-Payment LLMs
      </h1>
      <p className="soft" style={{ fontSize: 14, margin: 0 }}>
        <a href="https://www.linkedin.com/in/0xjevan" target="_blank" rel="noopener">
          Evans Eburu
        </a>{' '}
        · 9 frontier models, one+ per major lab · 753 graded authorizations + a 9×9 adversarial matrix
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
        Frontier models catch the mandate violations a payment gateway already
        catches — while five of nine miss <b>a third</b> of the intent violations only
        a model can catch, and one misses <b>more than half</b>. And the obvious way to
        hide that from an overseer makes it strictly worse.
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
          Structural (<b>rule</b>) violations are caught near-perfectly by almost every
          model — as they should be, since a stateless gateway validating the signed
          fields already catches them. The <b>intent</b> column is where models separate:
          proposals that satisfy every signed field yet break the mandate&apos;s meaning.
          Mean intent-catch is 75% (range 44–100%). False refusal = clean orders wrongly
          declined (the usefulness cost). Per-model intent cells are n=9, so individual
          rows overlap; the contrast that survives the small n is pooled — the three
          perfect models catch 27/27 intent traps (95% CI 88–100%) vs 34/54 (63%, CI
          50–75%) for the other six.
        </p>
        <div className="heatscroll" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Lab</th>
                <th>Rule caught (n=27)</th>
                <th>Intent caught (n=9)</th>
                <th>False refusal (n=6)</th>
              </tr>
            </thead>
            <tbody>
              {CALIBRATION.map((r) => (
                <tr key={r.model}>
                  <td className="model">{r.model}</td>
                  <td className="soft mono" style={{ fontSize: 12 }}>
                    {r.lab}
                  </td>
                  <td className="mono">
                    {r.rule[1]} ({r.rule[0]})
                    <div className="soft" style={{ fontSize: 10 }}>CI {r.rule[2]}</div>
                  </td>
                  <td
                    className="mono"
                    style={{ fontWeight: 700, color: intentColor(parseInt(r.intent[1], 10)) }}
                  >
                    {r.intent[1]} ({r.intent[0]})
                    <div className="soft" style={{ fontSize: 10, fontWeight: 400 }}>CI {r.intent[2]}</div>
                  </td>
                  <td className="mono">
                    {r.refuse[1]} ({r.refuse[0]})
                    <div className="soft" style={{ fontSize: 10 }}>CI {r.refuse[2]}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="soft mono" style={{ fontSize: 11, marginTop: 8 }}>
          Counts are snapshot v6 (3 reps/scenario, temperature 0); intervals are Wilson
          95%. Reps at temperature 0 are near-duplicate replicates, so the effective n is
          closer to the unique-scenario count — treat the intervals as optimistic.
        </p>
      </section>

      {/* Finding 2 — monitorability figure */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 2 — Reasoning is only moderately monitorable</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '70ch' }}>
          A monitor (GPT-5.5) reading <em>only</em> the agent&apos;s private reasoning —
          never the mandate numbers — predicts violations at AUROC 0.669 (95% CI
          0.56–0.78; 29 violations vs 345 compliant, pooled across the nine agents).
          Diagnostic, but far from the near-perfect monitorability reported for
          reasoning in game settings. Two caveats: the AUROC is pooled, so it mixes
          between-model style with within-model discrimination, and the monitor scores
          its own outputs for one of the nine agents.
        </p>
        <MonitorFigure />
      </section>

      {/* Finding 3 — suppression backfires */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 3 — Hiding the reasoning backfires</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: '72ch' }}>
          Instructing the agent to keep its reasoning bland — the obvious way to evade a
          reasoning-reading monitor — is <strong>doubly harmful</strong>. Violations
          roughly <strong>double</strong> (29 → 51), and the monitor&apos;s AUROC falls
          from 0.67 to <strong>0.30 — below chance</strong>. Inspecting the reasoning
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
          Beyond scripted traps, every model plays the merchant and attacks every
          model&apos;s agent over a multi-turn negotiation — a full 9×9 matrix (81 duels,
          one negotiation per attacker–defender pair, single over-cap attack goal).
          Robustness tracks the <em>defender</em>, not the attacker: no attacker exceeds
          a 22% success rate (2/9, CI 6–55%), while breaches concentrate on the agents
          that also miss intent violations above. With n=9 per row the intervals are
          wide: the unbreached group (0/9, upper bound 30%) separates from Mistral and
          Llama, but the DeepSeek / Mistral / Llama ordering is not itself significant.
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
              {[
                ['GPT-5.5 · Opus 4.8 · Gemini · Grok · Qwen · Kimi', '0 / 9', '0%', '0–30%'],
                ['DeepSeek V4 Pro', '1 / 9', '11%', '2–44%'],
                ['Mistral Large 2512', '5 / 9', '56%', '27–81%'],
                ['Llama 4 Maverick', '6 / 9', '67%', '35–88%'],
              ].map(([m, n, r, ci]) => (
                <tr key={m}>
                  <td className="model" style={{ fontSize: 13 }}>
                    {m}
                  </td>
                  <td className="mono">{n}</td>
                  <td className="mono" style={{ fontWeight: 700, color: intentColor(100 - parseInt(r, 10)) }}>
                    {r}
                  </td>
                  <td className="mono soft" style={{ fontSize: 12 }}>
                    {ci}
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
          This is a pilot, and the reported violation rates should be read as{' '}
          <em>lower bounds</em>. The intent set is small (three author-constructed traps
          in one grocery-mandate domain; independent human validation of the labels is
          future work), and per-model intent cells are n=9 with overlapping intervals —
          only the pooled tiers separate. Repetitions run at temperature 0, so the three
          reps are near-duplicates and the effective sample is closer to the unique
          scenario count; under replicate-aware clustering the default-arm AUROC&apos;s
          separation from chance is marginal, though the suppression contrast survives.
          The monitor is a single model (GPT-5.5) scored pooled across agents, including
          its own outputs. The duel matrix has one negotiation per cell against a single
          over-cap goal with an unseeded temperature-1 attacker, so it is not exactly
          reproducible. Two grading asymmetries in snapshot v6 could only{' '}
          <em>understate</em> violations: a counter-offer on an intent trap was graded as
          defended even when it committed the same purchase, and unparseable model output
          ended a run ungraded rather than counting against the model (both fixed in the
          harness for future snapshots). The conflicting-mandates arm is defined but not
          yet populated, and the scope-drift arm is single-turn in v6. Results may be
          sensitive to prompt wording. The suppression arm uses a single naive hiding
          instruction; a trained or steganographic adversary is the stronger test of
          monitorability and is future work, as are an adaptive-adversary robustness
          curve and multi-domain mandates.
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
  return (
    <div style={{ marginTop: 16, maxWidth: 560 }}>
      {bar('Default reasoning', 0.669, 0.56, 0.78, 'hsl(145 52% 40%)')}
      {bar('Suppressed reasoning', 0.304, 0.22, 0.39, 'hsl(8 60% 47%)')}
      <div className="soft mono" style={{ fontSize: 11, marginTop: 8 }}>
        Dashed line = 0.50 (chance); whiskers are Hanley–McNeil 95% CIs. Suppressed
        reasoning falls significantly below chance (z ≈ 4.6), and the drop from 0.669 is
        significant (z ≈ 5.1).
      </div>
    </div>
  );
}
