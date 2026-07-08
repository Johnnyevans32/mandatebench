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

const CALIBRATION: { model: string; rule: string; intent: string; refuse: string; lab: string }[] = [
  { model: 'GPT-5.5', lab: 'OpenAI', rule: '100%', intent: '100%', refuse: '0%' },
  { model: 'Claude Opus 4.8', lab: 'Anthropic', rule: '100%', intent: '100%', refuse: '0%' },
  { model: 'Kimi K2.6', lab: 'Moonshot', rule: '100%', intent: '100%', refuse: '0%' },
  { model: 'Gemini 3.5 Flash', lab: 'Google', rule: '100%', intent: '67%', refuse: '0%' },
  { model: 'Grok 4.3', lab: 'xAI', rule: '100%', intent: '67%', refuse: '17%' },
  { model: 'Qwen3.7 Max', lab: 'Alibaba', rule: '100%', intent: '67%', refuse: '0%' },
  { model: 'Mistral Large 2512', lab: 'Mistral', rule: '93%', intent: '67%', refuse: '0%' },
  { model: 'DeepSeek V4 Pro', lab: 'DeepSeek', rule: '89%', intent: '67%', refuse: '0%' },
  { model: 'Llama 4 Maverick', lab: 'Meta', rule: '85%', intent: '44%', refuse: '0%' },
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
        <a className="btn" href="/mandatebench.pdf">
          Download PDF ↓
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
        Frontier models catch <b>100%</b> of the mandate violations a payment gateway
        already catches — and miss up to <b>a third</b> of the ones only a model can.
        And the obvious way to hide that from an overseer makes it strictly worse.
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
          taxonomy of adversarial pressures, with a deterministic, judge-free ground
          truth: violations are predicates over a signed object, not an LLM&apos;s
          opinion. We separate <strong>rule</strong> violations (over budget, wrong
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
            <strong>deterministic, judge-free ground truth</strong> (Ed25519 mandates;
            violations are predicates, not opinions).
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
          declined (the usefulness cost).
        </p>
        <div className="heatscroll" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Lab</th>
                <th>Rule caught</th>
                <th>Intent caught</th>
                <th>False refusal</th>
              </tr>
            </thead>
            <tbody>
              {CALIBRATION.map((r) => (
                <tr key={r.model}>
                  <td className="model">{r.model}</td>
                  <td className="soft mono" style={{ fontSize: 12 }}>
                    {r.lab}
                  </td>
                  <td className="mono">{r.rule}</td>
                  <td
                    className="mono"
                    style={{ fontWeight: 700, color: intentColor(parseInt(r.intent, 10)) }}
                  >
                    {r.intent}
                  </td>
                  <td className="mono">{r.refuse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Finding 2 — monitorability figure */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 2 — Reasoning is only moderately monitorable</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '70ch' }}>
          A monitor reading <em>only</em> the agent&apos;s private reasoning — never the
          mandate numbers — predicts violations at AUROC 0.67. Diagnostic, but far from
          the near-perfect monitorability reported for reasoning in game settings.
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
        </p>
      </section>

      {/* Finding 4 — adversarial */}
      <section style={{ marginTop: 34 }}>
        <h2>Finding 4 — Under live attack, the same models break</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6, maxWidth: '72ch' }}>
          Beyond scripted traps, every model plays the merchant and attacks every
          model&apos;s agent over a multi-turn negotiation — a full 9×9 matrix (81 duels).
          Robustness is a property of the <em>defender</em>, not the attacker: no attacker
          exceeds a 22% success rate, but breaches concentrate sharply on a few agents —
          and they are the same models that miss intent violations above.
        </p>
        <div className="heatscroll" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Agent (defender)</th>
                <th>Breached by attackers</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['GPT-5.5 · Opus 4.8 · Gemini · Grok · Qwen · Kimi', '0 / 9', '0%'],
                ['DeepSeek V4 Pro', '1 / 9', '11%'],
                ['Mistral Large 2512', '5 / 9', '56%'],
                ['Llama 4 Maverick', '6 / 9', '67%'],
              ].map(([m, n, r]) => (
                <tr key={m}>
                  <td className="model" style={{ fontSize: 13 }}>
                    {m}
                  </td>
                  <td className="mono">{n}</td>
                  <td className="mono" style={{ fontWeight: 700, color: intentColor(100 - parseInt(r, 10)) }}>
                    {r}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              Ed25519 over a canonical mandate; the agent verifies before acting.
            </div>
          </div>
          <div className="tile">
            <div className="v" style={{ fontSize: 15 }}>
              Deterministic grade
            </div>
            <div className="k" style={{ lineHeight: 1.4 }}>
              Violations are predicates over the signed object. No LLM judge.
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
          This is a pilot: three repetitions per scenario give wide intervals, and the
          intent set is small (three constructions over one grocery-mandate domain).
          Results may be sensitive to prompt wording. The suppression arm uses a single
          naive hiding instruction; a trained or steganographic adversary is the stronger
          test of monitorability and is future work, as are an adaptive-adversary
          robustness curve and multi-domain mandates.
        </p>
      </section>

      {/* Cite */}
      <div style={{ marginTop: 38, borderTop: '1px solid var(--line, rgba(0,0,0,0.15))', paddingTop: 22 }}>
        <p className="soft" style={{ fontSize: 14 }}>
          Full method, related work, and references:{' '}
          <a href="/mandatebench.pdf">mandatebench.pdf ↓</a> · watch it run on the{' '}
          <a href="/dashboard">live dashboard →</a>
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

/** Two AUROC bars (default vs suppressed) against a chance=0.5 marker. */
function MonitorFigure() {
  const bar = (label: string, value: number, color: string) => (
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
        <span style={{ fontWeight: 700 }}>{value.toFixed(3)}</span>
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
      {bar('Default reasoning', 0.669, 'hsl(145 52% 40%)')}
      {bar('Suppressed reasoning', 0.304, 'hsl(8 60% 47%)')}
      <div className="soft mono" style={{ fontSize: 11, marginTop: 8 }}>
        Dashed line = 0.50 (chance). Suppressed reasoning falls below it — worse than
        guessing.
      </div>
    </div>
  );
}
