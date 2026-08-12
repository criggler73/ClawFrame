import { View } from "../App";

interface Props {
  view: View;
  onRestartWizard: () => void;
}

export default function TopBar({ view, onRestartWizard }: Props) {
  return (
    <div className="topbar">
      <div className="logo">
        <div className="logo-mark" />
        <div className="logo-name">
          Claw<span>Frame</span>
        </div>
      </div>
      <div className="breadcrumb">
        <span>~</span> / <b>{view === "wizard" ? "Setup" : "Console"}</b>
      </div>
      <div className="spacer" />
      {view === "console" && (
        <span className="pill">
          <span className="dot" /> runtime: nemoclaw · v0.4.2
        </span>
      )}
      <button className="topbar-btn" onClick={onRestartWizard}>
        ↻ restart wizard
      </button>
      <button className="topbar-btn">docs</button>
      <button className="topbar-btn">⌘K</button>
    </div>
  );
}
