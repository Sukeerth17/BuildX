import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import type { Finding } from "../store/useStore";

interface Toast {
  id: number;
  finding: Finding;
}

const sevColor = (s: string) => {
  if (s === "CRITICAL") return "var(--sev-critical)";
  if (s === "HIGH") return "var(--sev-high)";
  if (s === "MEDIUM") return "var(--sev-medium)";
  return "var(--sev-low)";
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function getWsUrl() {
  const url = new URL(API_BASE);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/live";
  url.search = "";
  return url.toString();
}

export default function LiveFeedToast() {
  const addFinding = useStore((s) => s.addFinding);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const ws = new WebSocket(getWsUrl());

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.event !== "new_finding" || !payload?.data) return;
        const finding = payload.data as Finding;
        addFinding(finding);
        const toast: Toast = { id: finding.id, finding };
        setToasts((prev) => [...prev, toast]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 4500);
      } catch {
        // Ignore malformed ws payloads.
      }
    };

    return () => {
      ws.close();
    };
  }, [addFinding]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 96,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass-strong slide-in"
          style={{
            padding: 14,
            width: 320,
            borderLeft: `3px solid ${sevColor(t.finding.severity)}`,
            borderRadius: 14,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
            New {t.finding.severity} finding
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
            {t.finding.repo} · <span style={{ fontFamily: "monospace" }}>{t.finding.file_path}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
