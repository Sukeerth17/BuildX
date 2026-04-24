import { useState } from "react";
import { useStore } from "../store/useStore";
import type { Finding } from "../store/useStore";
import { updateFindingStatus } from "../api/client";

interface Props {
  finding: Finding | null;
  onClose: () => void;
}

const sevColor = (s: string) => {
  if (s === "CRITICAL") return "var(--sev-critical)";
  if (s === "HIGH") return "var(--sev-high)";
  if (s === "MEDIUM") return "var(--sev-medium)";
  return "var(--sev-low)";
};

export default function FindingSidePanel({ finding, onClose }: Props) {
  const updateOptimistically = useStore((s) => s.updateFindingOptimistically);
  const [loading, setLoading] = useState(false);

  if (!finding) return null;

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateFindingStatus(finding.id, newStatus);
      updateOptimistically(finding.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const c = sevColor(finding.severity);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "oklch(0.1 0.05 320 / 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 1001,
        }}
      />
      <div
        className="glass-strong slide-in"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          bottom: 16,
          width: 460,
          zIndex: 1002,
          padding: 28,
          overflowY: "auto",
          borderRadius: 18,
          borderLeft: `3px solid ${c}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
            {finding.rule_id}
          </h2>
          <button
            onClick={onClose}
            className="glass-button-ghost"
            style={{ padding: "4px 12px", fontSize: 18, lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <span
            style={{
              background: `color-mix(in oklab, ${c} 25%, transparent)`,
              color: c,
              border: `1px solid color-mix(in oklab, ${c} 50%, transparent)`,
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {finding.severity}
          </span>
          <span
            style={{
              background: "oklch(1 0 0 / 0.08)",
              border: "1px solid var(--glass-border)",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 11,
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--color-accent)",
            }}
          >
            {finding.framework}
          </span>
          <span
            style={{
              background: `oklch(from var(--sev-critical) calc(l + (1 - ${finding.risk_score/100}) * 0.3) c h / 0.2)`,
              border: `1px solid oklch(from var(--sev-critical) l c h / 0.4)`,
              color: "white",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            RISK: {finding.risk_score}/100
          </span>
        </div>

        <div style={{ marginBottom: 18, color: "var(--color-muted-foreground)", fontSize: 13 }}>
          <strong style={{ color: "var(--color-foreground)" }}>Location:</strong>{" "}
          <span style={{ fontFamily: "monospace" }}>
            {finding.repo}/{finding.file_path}:{finding.line_number}
          </span>
        </div>

        <div className="glass" style={{ padding: 16, marginBottom: 18, borderLeft: "4px solid var(--color-accent)" }}>
          <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent)" }}>
            Compliance Violation Details
          </strong>
          <p style={{ margin: "8px 0 0 0", fontSize: 14, lineHeight: 1.5 }}>{finding.message}</p>
        </div>

        {finding.plain_english && (
          <div className="glass" style={{ padding: 16, marginBottom: 18, borderLeft: "4px solid var(--success)" }}>
            <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--success)" }}>
              Plain English Explanation
            </strong>
            <p style={{ margin: "8px 0 0 0", fontSize: 14, lineHeight: 1.5 }}>{finding.plain_english}</p>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent)" }}>
            Mapped Regulatory Controls
          </strong>
          {finding.compliance_mappings?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {finding.compliance_mappings.map((m, idx) => (
                <div key={`${m.framework}-${m.control.clause}-${idx}`} className="glass" style={{ padding: 12, borderLeft: "3px solid var(--color-accent)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    {m.framework} · {m.control.clause}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.45 }}>{m.control.excerpt}</div>
                  <div style={{ fontSize: 11, marginTop: 6, color: "var(--color-muted-foreground)" }}>
                    Confidence {Math.round((m.confidence || 0) * 100)}% · {m.control.rationale}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "var(--color-muted-foreground)" }}>
              No explicit control mapping data available for this finding.
            </p>
          )}
        </div>

        {finding.risk_justification && (
          <div style={{ marginBottom: 18, fontSize: 13, padding: "0 4px" }}>
            <strong style={{ color: "var(--color-muted-foreground)", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em" }}>Risk Analysis</strong>
            <p style={{ margin: "6px 0 0 0", fontStyle: "italic", color: "oklch(0.9 0.02 240)" }}>
              "{finding.risk_justification}"
            </p>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <strong style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-muted-foreground)" }}>
            AI Fix Suggestion
          </strong>
          <pre
            style={{
              background: "oklch(0.12 0.04 320 / 0.6)",
              padding: 14,
              borderRadius: 12,
              overflowX: "auto",
              color: "oklch(0.85 0.16 155)",
              marginTop: 8,
              fontFamily: "monospace",
              fontSize: 12,
              border: "1px solid var(--glass-border)",
            }}
          >
            {finding.fix_suggestion || "No fix suggestion available."}
          </pre>
        </div>

        <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: 20, marginTop: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Status
          </label>
          <select
            value={finding.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={loading}
            className="glass-input"
            style={{ width: "100%", marginBottom: 14 }}
          >
            <option value="open">Open</option>
            <option value="fixed">Fixed</option>
            <option value="accepted">Accepted (Risk)</option>
          </select>
        </div>
      </div>
    </>
  );
}