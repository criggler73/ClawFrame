import { useEffect, useState } from "react";
import { api, SystemInfo } from "../lib/api";
import { toast } from "../components/ToastHost";

interface Props {
  onComplete: () => void;
}

export default function Wizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);

  // On step 1 (System Scan), call the real Rust command
  useEffect(() => {
    if (step === 1 && !sysInfo) {
      api
        .getSystemInfo()
        .then(setSysInfo)
        .catch((e) => toast(`System scan failed: ${e}`, "error"));
    }
  }, [step, sysInfo]);

  const next = () => {
    if (step >= 9) onComplete();
    else setStep(step + 1);
  };
  const prev = () => setStep(Math.max(0, step - 1));

  return (
    <div style={{ padding: "64px 80px", maxWidth: 720, margin: "0 auto", overflowY: "auto", flex: 1 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
        Step {step + 1} of 10
      </div>

      {step === 0 && <StepWelcome />}
      {step === 1 && <StepSystemScan info={sysInfo} />}
      {step >= 2 && <StepPlaceholder n={step + 1} />}

      <div style={{ marginTop: 48, display: "flex", gap: 12, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
        {step > 0 && (
          <button className="btn" onClick={prev}>
            ← Back
          </button>
        )}
        <button className="btn primary" onClick={next}>
          {step === 9 ? "Open Console →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function StepWelcome() {
  return (
    <>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 48, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: 20 }}>
        Install OpenClaw without the headache.
      </h1>
      <p style={{ fontSize: 16, color: "var(--text-1)", lineHeight: 1.6, marginBottom: 40 }}>
        ClawFrame is a managed installer and control console for OpenClaw and NemoClaw.
        Every dependency is signed, every change is reversible, and nothing leaves your
        machine unless you say so.
      </p>
    </>
  );
}

function StepSystemScan({ info }: { info: SystemInfo | null }) {
  return (
    <>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.035em", marginBottom: 16 }}>
        System scan
      </h1>
      {!info ? (
        <p style={{ color: "var(--text-2)" }}>Scanning…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card label="OS" value={`${info.os} ${info.os_version}`} />
          <Card label="Architecture" value={info.arch} />
          <Card label="CPU" value={`${info.cpu_brand} · ${info.cpu_cores} cores`} />
          <Card label="Memory" value={`${info.available_memory_gb.toFixed(0)} / ${info.total_memory_gb.toFixed(0)} GB`} />
          <Card label="Disk" value={`${info.free_disk_gb.toFixed(0)} / ${info.total_disk_gb.toFixed(0)} GB free`} />
        </div>
      )}
    </>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--bg-1)", borderRadius: 6, padding: 16 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function StepPlaceholder({ n }: { n: number }) {
  return (
    <>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.035em", marginBottom: 16 }}>
        Step {n}
      </h1>
      <p style={{ color: "var(--text-2)" }}>
        Placeholder — port the UI from <code style={{ color: "var(--accent)" }}>clawframe.html</code> here.
      </p>
    </>
  );
}
