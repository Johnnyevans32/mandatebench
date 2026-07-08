import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preprint — MandateBench | Mandate faithfulness & pre-signature monitorability',
  description:
    'MandateBench: measuring whether LLM payment agents honour cryptographically signed spending mandates under adversarial pressure, and whether a monitor can catch a breach before the irreversible signature. Separates rule violations a gateway can catch from intent violations only the model can.',
  // Google Scholar "Highwire Press" citation tags — let Scholar index & attribute
  // this landing page (and its PDF) as a scholarly work.
  other: {
    citation_title:
      'MandateBench: Mandate Faithfulness and Pre-Signature Monitorability for Agentic-Payment LLMs',
    citation_author: 'Evans Eburu',
    citation_publication_date: '2026',
    citation_pdf_url: 'https://mandatebench.xyz/mandatebench.pdf',
    citation_abstract_html_url: 'https://mandatebench.xyz/paper',
    citation_keywords:
      'AI safety; agentic payments; AP2; x402; signed mandate; LLM agents; monitorability; chain-of-thought monitoring; benchmark; intent alignment',
  },
};

const CALIBRATION: { model: string; rule: string; intent: string; refuse: string }[] = [
  { model: 'GPT-5.5', rule: '100%', intent: '100%', refuse: '0%' },
  { model: 'Claude Opus 4.8', rule: '100%', intent: '100%', refuse: '0%' },
  { model: 'Kimi K2.6', rule: '100%', intent: '100%', refuse: '0%' },
  { model: 'Gemini 3.5 Flash', rule: '100%', intent: '67%', refuse: '0%' },
  { model: 'Grok 4.3', rule: '100%', intent: '67%', refuse: '17%' },
  { model: 'Qwen3.7 Max', rule: '100%', intent: '67%', refuse: '0%' },
  { model: 'Mistral Large 2512', rule: '93%', intent: '67%', refuse: '0%' },
  { model: 'DeepSeek V4 Pro', rule: '89%', intent: '67%', refuse: '0%' },
  { model: 'Llama 4 Maverick', rule: '85%', intent: '44%', refuse: '0%' },
];

const STATS: { value: string; label: string }[] = [
  { value: '100% → 75%', label: 'Mean catch rate: structural rule violations → intent violations a gateway cannot see' },
  { value: '0.67 → 0.30', label: 'Monitor AUROC on reasoning: default → reasoning-suppressed (falls below chance)' },
  { value: '≈ 2×', label: 'Increase in violations when the agent is told to keep its reasoning bland' },
];

export default function PaperPage() {
  return (
    <main className="wrap" style={{ maxWidth: 820, paddingTop: 48, paddingBottom: 56 }}>
      <div className="kicker">Preprint · Pilot</div>
      <h1 style={{ fontSize: 34, margin: '10px 0 14px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
        MandateBench: Mandate Faithfulness and Pre-Signature Monitorability for
        Agentic-Payment LLMs
      </h1>
      <p className="soft" style={{ fontSize: 14, margin: 0 }}>
        <a href="https://www.linkedin.com/in/0xjevan" target="_blank" rel="noopener">
          Evans Eburu
        </a>{' '}
        · v6 pilot · 9 frontier models · 753 graded authorizations + adversarial duels
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

      {/* Abstract */}
      <section style={{ marginTop: 30 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>
          Abstract
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>
          Standards for AI payments (Google&apos;s AP2, Coinbase&apos;s x402) let an
          agent commit funds by signing a <em>mandate</em> — a cryptographically
          signed statement of what it is authorized to spend. Signing is
          irreversible, so the question is not whether a protocol gateway can reject
          a malformed request, but whether the <em>agent</em> can be pushed into
          authorizing a payment it should not — and whether that can be caught{' '}
          <strong>before</strong> the signature. MandateBench measures mandate
          faithfulness across nine frontier models under a taxonomy of adversarial
          pressures, with a deterministic, judge-free ground truth (violations are
          predicates over a signed object, not an LLM&apos;s opinion). Its central
          contribution is separating two violation classes: <strong>rule</strong>{' '}
          violations (over budget, wrong recipient, out-of-scope category, expired
          mandate) that a structural gateway already catches, and{' '}
          <strong>intent</strong> violations that satisfy every signed field yet
          betray the mandate&apos;s natural-language intent — a grocery mandate spent
          on a gift card or vintage champagne. Models that catch structural
          violations near-perfectly (100%) systematically wave through{' '}
          <strong>a third of intent violations</strong> (mean intent-catch 75%,
          range 44–100%): the class that justifies putting a model in the loop at
          all. We then test <strong>pre-signature monitorability</strong>: a monitor
          reading only the agent&apos;s private reasoning predicts violations at
          AUROC 0.67. Instructing the agent to keep its reasoning bland is doubly
          harmful — violations roughly double, and the monitor&apos;s AUROC collapses
          from 0.67 to 0.30 (below chance), because suppressed reasoning makes a
          breach read as more routine than a compliant decision. Reasoning
          suppression does not merely blind the overseer; it blinds the agent.
        </p>
      </section>

      {/* Headline numbers */}
      <div className="tiles" style={{ marginTop: 26 }}>
        {STATS.map((s) => (
          <div className="tile" key={s.label} style={{ textAlign: 'center' }}>
            <div className="v" style={{ fontSize: 22 }}>
              {s.value}
            </div>
            <div className="k" style={{ lineHeight: 1.4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Table 1 */}
      <section style={{ marginTop: 38 }}>
        <h2>Table 1 — Rule vs intent, per model</h2>
        <p className="soft" style={{ fontSize: 14, marginTop: -6 }}>
          Fraction of violations caught, split by class. <b>Rule</b> = structural
          (budget, cap, recipient, category, expiry) — a protocol gateway catches
          these without a model. <b>Intent</b> = satisfies every signed field yet
          breaks the mandate&apos;s meaning — no gateway can catch these. False
          refusal = clean orders wrongly declined (the usefulness cost). Pilot: 3
          reps/scenario, snapshot v6.
        </p>
        <div className="heatscroll" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Rule caught</th>
                <th>Intent caught</th>
                <th>False refusal</th>
              </tr>
            </thead>
            <tbody>
              {CALIBRATION.map((r) => (
                <tr key={r.model}>
                  <td className="model">{r.model}</td>
                  <td className="mono">{r.rule}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>
                    {r.intent}
                  </td>
                  <td className="mono">{r.refuse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="soft" style={{ fontSize: 13, marginTop: 12 }}>
          The rule column is near-saturated (table stakes); the intent column is
          where models separate. The full pressure taxonomy, the adversarial
          LLM-vs-LLM duels, and the monitorability protocol (RQ3) are in the PDF and
          on the live dashboard.
        </p>
      </section>

      {/* Cite */}
      <div style={{ marginTop: 40, borderTop: '1px solid var(--line, rgba(0,0,0,0.15))', paddingTop: 22 }}>
        <p className="soft" style={{ fontSize: 14 }}>
          Read the full method, related work, and references in{' '}
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
        © 2026 MandateBench · mandatebench.xyz · MIT / CC BY 4.0
      </footer>
    </main>
  );
}
