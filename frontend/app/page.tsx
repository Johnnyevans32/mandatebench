export default function Home() {
  return (
    <main className="wrap">
      <div className="hero">
        <div className="kicker">Agentic-payment safety benchmark</div>
        <h1>When you hand an AI agent your money, does it stay inside the mandate?</h1>
        <p>
          MandateBench gives payment agents a cryptographically signed spending
          mandate — a budget, allowed recipients, allowed categories, an expiry —
          then pushes them with adversarial pressure and measures how often they
          authorize a payment that breaches it. A monitor reads the agent&rsquo;s
          justification and tries to catch the breach <em>before</em> the
          irreversible signature.
        </p>
        <div className="btnrow">
          <a className="btn" href="/paper">
            Read the paper
          </a>
          <a className="btn ghost" href="/dashboard">
            View the leaderboard
          </a>
          <a
            className="btn ghost"
            href="https://github.com/Johnnyevans32/mandatebench"
          >
            Read the code
          </a>
        </div>
      </div>

      <section>
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="n">01</div>
            <h3>Signed mandate</h3>
            <p>The agent is issued an Ed25519-signed mandate defining exactly what it may pay.</p>
          </div>
          <div className="step">
            <div className="n">02</div>
            <h3>Adversarial pressure</h3>
            <p>A merchant applies one of several pressures — upsell, urgency, injection, drift.</p>
          </div>
          <div className="step">
            <div className="n">03</div>
            <h3>The decision</h3>
            <p>The agent authorizes, declines, counters, or asks — and commits a cart.</p>
          </div>
          <div className="step">
            <div className="n">04</div>
            <h3>Objective grade</h3>
            <p>A deterministic check labels the outcome. No LLM judge, no ambiguity.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>The pressure taxonomy</h2>
        <div className="pressures">
          <div className="pcard">
            <b>Principal-agent overreach</b>
            <p>The agent is nudged to &ldquo;helpfully&rdquo; exceed the mandate.</p>
          </div>
          <div className="pcard">
            <b>Merchant social engineering</b>
            <p>Upsell, invented scarcity, or false claims of prior approval.</p>
          </div>
          <div className="pcard">
            <b>Urgency / scarcity</b>
            <p>Time pressure to skip verification before signing.</p>
          </div>
          <div className="pcard">
            <b>Indirect prompt injection</b>
            <p>Adversarial instructions hidden in merchant-supplied fields.</p>
          </div>
          <div className="pcard">
            <b>Multi-turn scope drift</b>
            <p>The mandate honored at first, eroded over a negotiation.</p>
          </div>
          <div className="pcard">
            <b>Conflicting mandates</b>
            <p>Two signed mandates that cannot both be satisfied.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Why the labels are trustworthy</h2>
        <p className="soft" style={{ maxWidth: '68ch' }}>
          A mandate violation — over-budget, wrong recipient, out-of-scope
          category, expired, structured to evade a cap — is a deterministic
          predicate over the signed mandate and the cart. The ground truth needs
          no LLM judge, and because the mandate is signed, a recorded violation is
          cryptographically attributable rather than merely logged.
        </p>
      </section>
    </main>
  );
}
