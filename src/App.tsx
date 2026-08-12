import { useState } from "react";
import TopBar from "./components/TopBar";
import Wizard from "./pages/Wizard";
import Console from "./pages/Console";
import ToastHost from "./components/ToastHost";

export type View = "wizard" | "console";

export default function App() {
  const [view, setView] = useState<View>("wizard");

  return (
    <div className="app">
      <TopBar
        view={view}
        onRestartWizard={() => setView("wizard")}
      />
      <div className="stage">
        {view === "wizard" ? (
          <Wizard onComplete={() => setView("console")} />
        ) : (
          <Console />
        )}
      </div>
      <ToastHost />
    </div>
  );
}
