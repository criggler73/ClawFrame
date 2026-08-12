export default function Overview() {
  return (
    <>
      <div className="main-header">
        <div>
          <div className="eyebrow">workspace · nemoclaw</div>
          <h1>Overview</h1>
        </div>
        <div className="actions">
          <button className="btn">Snapshot</button>
          <button className="btn primary">Open chat →</button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Tokens / sec" value="42" unit="tok/s" />
        <Stat label="Active sessions" value="7" />
        <Stat label="Memory · runtime" value="6.4" unit="GB" />
        <Stat label="Egress · 24h" value="0" unit="unauth" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Welcome to ClawFrame</h3>
          <span className="panel-meta">v0.1.0 · prototype</span>
        </div>
        <p style={{ color: "var(--text-2)", lineHeight: 1.6 }}>
          This is the React + Tauri scaffold. The Models page calls the real Ollama
          HTTP API on <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>localhost:11434</code> via
          a Rust command. If Ollama isn't running, you'll see an empty list — that's
          expected. Try <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>ollama serve</code> in a
          terminal to start it.
        </p>
      </div>
    </>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}
