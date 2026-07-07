import { loadSnapshot, PRESSURES, PRESSURE_LABELS } from '../../lib/api';

export const dynamic = 'force-dynamic';

function heatColor(rate: number): string {
  // green (faithful) -> red (violating)
  const hue = 145 - rate * (145 - 8);
  return `hsl(${hue} 52% 40%)`;
}

function shortModel(id: string): string {
  return id.includes('/') ? id.split('/')[1] : id;
}

export default async function Dashboard() {
  const snap = await loadSnapshot();
  const models = snap.leaderboard.map((r) => r.model);
  const cell = new Map(snap.matrix.map((c) => [`${c.model}|${c.pressure}`, c]));

  return (
    <main className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div className="kicker">Live results</div>
      <h1 style={{ fontSize: 34, margin: '10px 0 20px', letterSpacing: '-0.02em' }}>
        Mandate faithfulness leaderboard
      </h1>

      {!snap.live && (
        <div className="banner">
          Showing sample data — the results API returned nothing yet. Start a run
          on the backend to populate this board.
        </div>
      )}

      <div className="tiles" style={{ marginBottom: 32 }}>
        <div className="tile">
          <div className="v">{models.length}</div>
          <div className="k">models</div>
        </div>
        <div className="tile">
          <div className="v">{snap.spend.runs}</div>
          <div className="k">graded runs</div>
        </div>
        <div className="tile">
          <div className="v">${snap.spend.totalUsd.toFixed(2)}</div>
          <div className="k">spend</div>
        </div>
      </div>

      <section style={{ borderTop: 'none', paddingTop: 0 }}>
        <h2>Violation rate on trap scenarios</h2>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Violations</th>
              <th style={{ width: 180 }}>Rate (95% Wilson)</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {snap.leaderboard.map((r) => (
              <tr key={r.model}>
                <td className="model">{shortModel(r.model)}</td>
                <td className="mono">
                  {r.violations}/{r.traps}
                </td>
                <td>
                  <div className="cibar" title={`${(r.low * 100).toFixed(0)}%–${(r.high * 100).toFixed(0)}%`}>
                    <span
                      style={{
                        left: `${r.low * 100}%`,
                        width: `${Math.max(1, (r.high - r.low) * 100)}%`,
                      }}
                    />
                  </div>
                </td>
                <td className="rate">{(r.violationRate * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Model × pressure</h2>
        <div className="heatscroll">
          <table className="heat">
            <thead>
              <tr>
                <th></th>
                {PRESSURES.map((p) => (
                  <th key={p}>{PRESSURE_LABELS[p] ?? p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m}>
                  <td className="rowlabel mono">{shortModel(m)}</td>
                  {PRESSURES.map((p) => {
                    const c = cell.get(`${m}|${p}`);
                    if (!c) {
                      return (
                        <td key={p} className="cell empty">
                          –
                        </td>
                      );
                    }
                    return (
                      <td
                        key={p}
                        className="cell"
                        style={{ background: heatColor(c.rate) }}
                        title={`${c.violations}/${c.n} violated`}
                      >
                        {(c.rate * 100).toFixed(0)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="soft" style={{ fontSize: 14, marginTop: 12 }}>
          Green = faithful, red = authorized a payment that breached the mandate.
        </p>
      </section>
    </main>
  );
}
