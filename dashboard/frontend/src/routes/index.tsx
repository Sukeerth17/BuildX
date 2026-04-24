import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { getSummary, getTrend, getFindings } from "../api/client";
import KPICard from "../components/KPICard";
import TrendChart from "../components/TrendChart";
import SeverityDonut from "../components/SeverityDonut";
import AppShell from "../components/AppShell";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const { summary, trend, findings, setSummary, setTrend, setFindings } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (!token) return;
    (async () => {
      try {
        const [s, t, f] = await Promise.all([getSummary(), getTrend(), getFindings()]);
        setSummary(s);
        setTrend(t);
        setFindings(f);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token, setSummary, setTrend, setFindings]);

  // Avoid SSR/CSR mismatch: render nothing until hydrated, then redirect if no token.
  if (!hydrated) return null;
  if (!token) return <Navigate to="/login" />;
  void navigate;

  const auditHoursSaved =
    (summary?.critical || 0) + (summary?.high || 0) + (summary?.medium || 0) + (summary?.low || 0);

  const repoMap: Record<string, { total: number; critical: number; passed: number }> = {};
  findings.forEach((f) => {
    if (!repoMap[f.repo]) repoMap[f.repo] = { total: 0, critical: 0, passed: 0 };
    repoMap[f.repo].total += 1;
    if (f.severity === "CRITICAL") repoMap[f.repo].critical += 1;
    if (f.status === "fixed" || f.status === "accepted") repoMap[f.repo].passed += 1;
  });
  const topRepos = Object.entries(repoMap)
    .map(([repo, stats]) => ({ repo, ...stats }))
    .sort((a, b) => b.critical - a.critical)
    .slice(0, 5);

  const ruleMap: Record<string, { count: number; desc: string }> = {};
  findings.forEach((f) => {
    if (!ruleMap[f.rule_id]) ruleMap[f.rule_id] = { count: 0, desc: f.message };
    ruleMap[f.rule_id].count += 1;
  });
  const topRules = Object.entries(ruleMap)
    .map(([rule_id, v]) => ({ rule_id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <AppShell>
      <div className="fade-up">
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
            Dashboard Overview
          </h2>
          <p style={{ margin: "6px 0 0 0", color: "var(--color-muted-foreground)", fontSize: 14 }}>
            Real-time compliance posture across all monitored repositories.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 22 }}>
          <KPICard label="Critical" value={summary?.critical ?? "—"} color="var(--sev-critical)" icon="⚠" />
          <KPICard label="High" value={summary?.high ?? "—"} color="var(--sev-high)" icon="◆" />
          <KPICard label="Pass Rate" value={`${summary?.pass_rate ?? 0}%`} color="var(--success)" icon="✓" />
          <KPICard label="Audit Hrs Saved" value={(auditHoursSaved * 0.5).toFixed(1)} color="var(--color-accent)" icon="⏱" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 22 }}>
          <TrendChart data={trend} />
          <SeverityDonut summary={summary} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="glass" style={{ padding: 22 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
              Repository Risk Scoreboard
            </h3>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--color-muted-foreground)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "8px 0", fontWeight: 600 }}>Repository</th>
                  <th style={{ padding: "8px 0", fontWeight: 600 }}>Total</th>
                  <th style={{ padding: "8px 0", fontWeight: 600 }}>Critical</th>
                  <th style={{ padding: "8px 0", fontWeight: 600 }}>Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {topRepos.map((r) => (
                  <tr key={r.repo} style={{ borderTop: "1px solid oklch(1 0 0 / 0.06)" }}>
                    <td style={{ padding: "12px 0" }}>
                      <span
                        onClick={() => navigate({ to: "/findings", search: { repo: r.repo } })}
                        style={{ color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}
                      >
                        {r.repo}
                      </span>
                    </td>
                    <td style={{ padding: "12px 0" }}>{r.total}</td>
                    <td style={{ padding: "12px 0", color: r.critical > 0 ? "var(--sev-critical)" : "inherit", fontWeight: 600 }}>
                      {r.critical}
                    </td>
                    <td style={{ padding: "12px 0", color: "var(--color-muted-foreground)" }}>
                      {((r.passed / r.total) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass" style={{ padding: 22 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
              Top Violated Rules
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {topRules.map((r) => {
                const max = topRules[0]?.count || 1;
                const w = `${(r.count / max) * 100}%`;
                return (
                  <div key={r.rule_id} title={r.desc}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{r.rule_id}</span>
                      <span style={{ color: "var(--color-muted-foreground)", fontSize: 12 }}>
                        {r.count} occurrences
                      </span>
                    </div>
                    <div style={{ width: "100%", background: "oklch(1 0 0 / 0.06)", height: 6, borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: w,
                          background: "linear-gradient(90deg, var(--sev-high), var(--color-accent))",
                          height: "100%",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
