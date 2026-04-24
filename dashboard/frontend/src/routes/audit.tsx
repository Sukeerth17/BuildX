import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { generateAuditReport, getSnapshots } from "../api/client";
import AppShell from "../components/AppShell";

export const Route = createFileRoute("/audit")({
  component: AuditPage,
});

function AuditPage() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<{ start: string; end: string; generatedAt: string }[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }
    const stored = typeof window !== "undefined" ? localStorage.getItem("complianceai_recent_reports") : null;
    if (stored) setRecent(JSON.parse(stored));
    getSnapshots().then(setSnapshots).catch(console.error);
    const d = new Date();
    setEndDate(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() - 14);
    setStartDate(d.toISOString().split("T")[0]);
  }, [token, navigate]);

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const blob = await generateAuditReport(startDate, endDate);
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_report_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      const newReport = { start: startDate, end: endDate, generatedAt: new Date().toISOString() };
      const updated = [newReport, ...recent].slice(0, 3);
      setRecent(updated);
      localStorage.setItem("complianceai_recent_reports", JSON.stringify(updated));
    } finally {
      setLoading(false);
    }
  };

  const cellColor = (v: number) => (v >= 85 ? "var(--success)" : "var(--sev-critical)");

  return (
    <AppShell>
      <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 20px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
            Generate Audit Report
          </h2>

          <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
            <p style={{ color: "var(--color-muted-foreground)", marginTop: 0, marginBottom: 22, fontSize: 14, lineHeight: 1.5 }}>
              Generate a comprehensive PDF audit report including an AI-generated narrative,
              severity breakdown and framework compliance percentages.
            </p>

            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <DateField label="Start Date" value={startDate} onChange={setStartDate} />
              <DateField label="End Date" value={endDate} onChange={setEndDate} />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !startDate || !endDate}
              className="glass-button"
              style={{ width: "100%", padding: 16, fontSize: 15 }}
            >
              {loading ? "✦ Writing your audit narrative…" : "Generate Report (PDF)"}
            </button>
          </div>

          {recent.length > 0 && (
            <div className="glass" style={{ padding: 22 }}>
              <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
                Recent Reports
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recent.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      background: "oklch(1 0 0 / 0.04)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--color-accent)", marginBottom: 4, fontSize: 13 }}>
                      {r.start} → {r.end}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                      Generated: {new Date(r.generatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 style={{ margin: "0 0 20px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
            Nightly Snapshot Log
          </h2>
          <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--glass-border)" }}>
              <p style={{ margin: 0, color: "var(--color-muted-foreground)", fontSize: 13, lineHeight: 1.5 }}>
                Timestamped history proving compliance posture. Auditors rely on these daily
                snapshots as continuous-compliance evidence.
              </p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      background: "oklch(1 0 0 / 0.04)",
                      color: "var(--color-muted-foreground)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <th style={{ padding: 12, fontWeight: 600 }}>Date</th>
                    <th style={{ padding: 12, fontWeight: 600 }}>SOC 2</th>
                    <th style={{ padding: 12, fontWeight: 600 }}>GDPR</th>
                    <th style={{ padding: 12, fontWeight: 600 }}>HIPAA</th>
                    <th style={{ padding: 12, fontWeight: 600 }}>PCI-DSS</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.id} style={{ borderTop: "1px solid oklch(1 0 0 / 0.06)" }}>
                      <td style={{ padding: 12 }}>{s.snapshot_date}</td>
                      <td style={{ padding: 12, color: cellColor(s.soc2), fontWeight: 600 }}>{s.soc2.toFixed(1)}%</td>
                      <td style={{ padding: 12, color: cellColor(s.gdpr), fontWeight: 600 }}>{s.gdpr.toFixed(1)}%</td>
                      <td style={{ padding: 12, color: cellColor(s.hipaa), fontWeight: 600 }}>{s.hipaa.toFixed(1)}%</td>
                      <td style={{ padding: 12, color: cellColor(s.pcidss), fontWeight: 600 }}>{s.pcidss.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {snapshots.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 28, textAlign: "center", color: "var(--color-muted-foreground)" }}>
                        No snapshots recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: "block", marginBottom: 6, fontSize: 11, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input"
        style={{ width: "100%", colorScheme: "dark" }}
      />
    </div>
  );
}