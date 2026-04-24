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

const SAMPLE_REPOS = ["payments-api", "auth-service", "web-frontend"];
const SAMPLE_FILES = ["src/handlers/checkout.ts", "internal/auth/middleware.go", "lib/db/queries.ts"];
const SAMPLE_SEV = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function LiveFeedToast() {
  const addFinding = useStore((s) => s.addFinding);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Simulated live feed (no backend WebSocket available in preview).
    const interval = setInterval(() => {
      const sev = SAMPLE_SEV[Math.floor(Math.random() * SAMPLE_SEV.length)];
      const finding: Finding = {
        id: Date.now(),
        repo: SAMPLE_REPOS[Math.floor(Math.random() * SAMPLE_REPOS.length)],
        file_path: SAMPLE_FILES[Math.floor(Math.random() * SAMPLE_FILES.length)],
        line_number: Math.floor(Math.random() * 200) + 1,
        rule_id: "SEC-" + Math.floor(Math.random() * 999).toString().padStart(3, "0"),
        severity: sev,
        message: "New finding detected by live scanner",
        fix_suggestion: "// Apply secure pattern",
        framework: "soc2",
        commit_sha: "abcd123",
        status: "open",
        created_at: new Date().toISOString(),
      };
      addFinding(finding);
      const toast: Toast = { id: finding.id, finding };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 4500);
    }, 18000);

    return () => clearInterval(interval);
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