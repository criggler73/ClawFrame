import { useState } from "react";
import Overview from "./console/Overview";
import Models from "./console/Models";

type Page = "overview" | "components" | "models" | "config" | "logs" | "snapshots";

const NAV: { id: Page; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "components", label: "Components" },
  { id: "models", label: "Models" },
  { id: "config", label: "Configuration" },
  { id: "logs", label: "Logs & audit" },
  { id: "snapshots", label: "Snapshots" },
];

export default function Console() {
  const [page, setPage] = useState<Page>("overview");

  return (
    <div className="console">
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="label">Workspace</div>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => setPage(n.id)}
            >
              {n.label}
            </button>
          ))}
        </div>
      </aside>
      <main className="main">
        {page === "overview" && <Overview />}
        {page === "models" && <Models />}
        {page !== "overview" && page !== "models" && <Placeholder name={page} />}
      </main>
    </div>
  );
}

function Placeholder({ name }: { name: string }) {
  return (
    <>
      <div className="main-header">
        <div>
          <div className="eyebrow">section</div>
          <h1 style={{ textTransform: "capitalize" }}>{name}</h1>
        </div>
      </div>
      <div className="empty-page">
        <h4 style={{ textTransform: "capitalize" }}>{name}</h4>
        <p>Page scaffolded — implementation comes next.</p>
        <code>// port from clawframe.html prototype</code>
      </div>
    </>
  );
}
