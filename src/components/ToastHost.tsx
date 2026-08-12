import { useEffect, useState } from "react";

type Toast = { id: number; msg: string; kind: "ok" | "warn" | "error" };

let nextId = 1;
const listeners = new Set<(t: Toast) => void>();

export function toast(msg: string, kind: Toast["kind"] = "ok") {
  const t = { id: nextId++, msg, kind };
  listeners.forEach((fn) => fn(t));
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((cur) => [...cur, t]);
      setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== t.id));
      }, 3200);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
