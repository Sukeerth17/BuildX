import type { Finding } from "../store/useStore";

interface Props {
  findings: Finding[];
  onRowClick: (f: Finding) => void;
}

const sevColor = (s: string) => {
  if (s === "CRITICAL") return "var(--sev-critical)";
  if (s === "HIGH") return "var(--sev-high)";
  if (s === "MEDIUM") return "var(--sev-medium)";
  return "var(--sev-low)";
};

function SeverityBadge({ sev }: { sev: string }) {
  const c = sevColor(sev);
  return (
    <span
      style={{
        background: `color-mix(in oklab, ${c} 25%, transparent)`,
        color: c,
        border: `1px solid color-mix(in oklab, ${c} 50%, transparent)`,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
    >
      {sev}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  let c = "oklch(0.82 0.03 90)";
  if (status === "fixed") c = "var(--success)";
  if (status === "accepted") c = "var(--color-accent)";
  return (
    <span
      style={{
        background: `color-mix(in oklab, ${c} 18%, transparent)`,
        color: c,
        border: `1px solid color-mix(in oklab, ${c} 40%, transparent)`,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        textTransform: "capitalize",
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

export default function FindingsTable({ findings, onRowClick }: Props) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--glass-border)",
              color: "var(--color-muted-foreground)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Severity</th>
            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Rule</th>
            <th style={{ padding: "12px 8px", fontWeight: 600 }}>File</th>
            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Line</th>
            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Category</th>
            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Regulations</th>
            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Repo</th>
            <th style={{ padding: "12px 8px", fontWeight: 600 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr
              key={f.id}
              onClick={() => onRowClick(f)}
              style={{
                borderBottom: "1px solid oklch(1 0 0 / 0.06)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(1 0 0 / 0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "12px 8px" }}>
                <SeverityBadge sev={f.severity} />
              </td>
              <td style={{ padding: "12px 8px", fontWeight: 600, fontFamily: "monospace" }}>
                {f.rule_id}
              </td>
              <td style={{ padding: "12px 8px", fontFamily: "monospace", fontSize: 12 }} title={f.file_path}>
                {f.file_path.length > 30 ? "…" + f.file_path.slice(-27) : f.file_path}
              </td>
              <td style={{ padding: "12px 8px", color: "var(--color-muted-foreground)" }}>{f.line_number}</td>
              <td style={{ padding: "12px 8px", fontSize: 12, fontWeight: 600 }}>{f.category}</td>
              <td style={{ padding: "12px 8px", fontSize: 12, color: "var(--color-muted-foreground)" }}>
                {f.mapped_frameworks.length > 0 ? f.mapped_frameworks.join(", ") : "Unmapped"}
              </td>
              <td style={{ padding: "12px 8px" }}>{f.repo}</td>
              <td style={{ padding: "12px 8px" }}>
                <StatusPill status={f.status} />
              </td>
            </tr>
          ))}
          {findings.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--color-muted-foreground)" }}>
                No findings match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
