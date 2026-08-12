import { useEffect, useState } from "react";
import { api, OllamaModel } from "../../lib/api";
import { toast } from "../../components/ToastHost";

export default function Models() {
  const [models, setModels] = useState<OllamaModel[] | null>(null);
  const [ollamaUp, setOllamaUp] = useState<boolean | null>(null);
  const [pulling, setPulling] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const up = await api.pingOllama();
      setOllamaUp(up);
      if (up) {
        const list = await api.listOllamaModels();
        setModels(list);
      } else {
        setModels([]);
      }
    } catch (e) {
      toast(`Failed to talk to Ollama: ${e}`, "error");
      setOllamaUp(false);
      setModels([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const pull = async (name: string) => {
    setPulling(name);
    toast(`Pulling ${name}…`);
    try {
      await api.pullOllamaModel(name);
      toast(`${name} installed`);
      refresh();
    } catch (e) {
      toast(`Pull failed: ${e}`, "error");
    } finally {
      setPulling(null);
    }
  };

  return (
    <>
      <div className="main-header">
        <div>
          <div className="eyebrow">workspace · models</div>
          <h1>Models</h1>
        </div>
        <div className="actions">
          <button className="btn" onClick={refresh}>Refresh</button>
          <button
            className="btn primary"
            onClick={() => pull("llama3.2:3b")}
            disabled={!ollamaUp || pulling !== null}
          >
            {pulling ? `Pulling ${pulling}…` : "Pull llama3.2:3b →"}
          </button>
        </div>
      </div>

      {ollamaUp === false && (
        <div
          className="panel"
          style={{ borderColor: "rgba(255,184,77,0.3)", borderLeft: "3px solid var(--warn)" }}
        >
          <strong>Ollama isn't running.</strong>
          <p style={{ color: "var(--text-2)", marginTop: 8, lineHeight: 1.6 }}>
            Start it with <code style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>ollama serve</code> (or
            install Ollama from <a href="https://ollama.com" style={{ color: "var(--accent)" }}>ollama.com</a>) and
            click Refresh.
          </p>
        </div>
      )}

      {models === null && <p style={{ color: "var(--text-2)" }}>Loading…</p>}

      {models && models.length === 0 && ollamaUp && (
        <div className="empty-page">
          <h4>No models installed</h4>
          <p>Click "Pull llama3.2:3b" above to download a small starter model.</p>
        </div>
      )}

      {models && models.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3>Installed models</h3>
            <span className="panel-meta">{models.length} models · live from Ollama</span>
          </div>
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                <th style={{ padding: "0 12px 12px", borderBottom: "1px solid var(--line)" }}>Name</th>
                <th style={{ padding: "0 12px 12px", borderBottom: "1px solid var(--line)" }}>Size</th>
                <th style={{ padding: "0 12px 12px", borderBottom: "1px solid var(--line)" }}>Modified</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name}>
                  <td style={{ padding: 12, borderBottom: "1px solid var(--line)", fontWeight: 500 }}>
                    {m.name}
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)", color: "var(--text-2)" }}>
                    {(m.size / 1_000_000_000).toFixed(2)} GB
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)", color: "var(--text-3)" }}>
                    {new Date(m.modified_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
