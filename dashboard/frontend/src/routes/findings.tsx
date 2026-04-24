import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import type { Finding } from "../store/useStore";
import { getFindings } from "../api/client";
import FindingsTable from "../components/FindingsTable";
import FindingSidePanel from "../components/FindingSidePanel";
import AppShell from "../components/AppShell";

interface SearchParams {
  framework?: string;
  repo?: string;
  commit?: string;
}

export const Route = createFileRoute("/findings")({
  component: FindingsPage,
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    framework: typeof s.framework === "string" ? s.framework : undefined,
    repo: typeof s.repo === "string" ? s.repo : undefined,
    commit: typeof s.commit === "string" ? s.commit : undefined,
  }),
});

function FindingsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/findings" });
  const token = useStore((s) => s.token);
  const { findings, setFindings } = useStore();

  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [repoFilter, setRepoFilter] = useState(search.repo || "");
  const [frameworkFilter, setFrameworkFilter] = useState(search.framework || "");
  const [commitFilter, setCommitFilter] = useState(search.commit || "");
  const [selected, setSelected] = useState<Finding | null>(null);

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [token, navigate]);

  useEffect(() => {
    (async () => {
      const filters: any = {};
      if (severityFilter) filters.severity = severityFilter;
      if (statusFilter) filters.status = statusFilter;
      if (repoFilter) filters.repo = repoFilter;
      if (frameworkFilter) filters.framework = frameworkFilter;
      let data = await getFindings(filters);
      if (commitFilter) data = data.filter((f) => f.commit_sha.startsWith(commitFilter));
      setFindings(data);
    })();
  }, [severityFilter, statusFilter, repoFilter, frameworkFilter, commitFilter, setFindings]);

  const commitMap: Record<string, { date: string; count: number }> = {};
  findings.forEach((f) => {
    if (!commitMap[f.commit_sha]) commitMap[f.commit_sha] = { date: f.created_at, count: 0 };
    commitMap[f.commit_sha].count += 1;
  });
  const timeline = Object.entries(commitMap)
    .sort((a, b) => new Date(b[1].date).getTime() - new Date(a[1].date).getTime())
    .slice(0, 8);

  const repos = Array.from(new Set(findings.map((f) => f.repo)));

  return (
    <AppShell>
      <div className="fade-up" style={{ display: "flex", gap: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
            Findings
          </h2>

          <div className="glass" style={{ padding: 18, marginBottom: 18, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <FilterField label="Severity">
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="glass-input">
                <option value="">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </FilterField>
            <FilterField label="Status">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="glass-input">
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="fixed">Fixed</option>
                <option value="accepted">Accepted</option>
              </select>
            </FilterField>
            <FilterField label="Repository">
              <select
                value={repoFilter}
                onChange={(e) => {
                  setRepoFilter(e.target.value);
                  navigate({ to: "/findings", search: { ...search, repo: e.target.value || undefined } });
                }}
                className="glass-input"
              >
                <option value="">All</option>
                {repos.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Framework">
              <input
                type="text"
                placeholder="e.g. soc2"
                value={frameworkFilter}
                onChange={(e) => {
                  setFrameworkFilter(e.target.value);
                  navigate({ to: "/findings", search: { ...search, framework: e.target.value || undefined } });
                }}
                className="glass-input"
              />
            </FilterField>
            {commitFilter && (
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button onClick={() => setCommitFilter("")} className="glass-button-ghost" style={{ color: "var(--sev-critical)", borderColor: "var(--sev-critical)" }}>
                  Clear Commit Filter
                </button>
              </div>
            )}
          </div>

          <div className="glass" style={{ padding: 18 }}>
            <FindingsTable findings={findings} onRowClick={(f) => setSelected(f)} />
          </div>
        </div>

        <div style={{ width: 290, flexShrink: 0 }}>
          <div className="glass" style={{ padding: 18, position: "sticky", top: 96 }}>
            <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
              Commit Scan History
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {timeline.map(([sha, d]) => {
                const active = commitFilter === sha;
                return (
                  <div
                    key={sha}
                    onClick={() => setCommitFilter(sha)}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: active ? "color-mix(in oklab, var(--color-accent) 15%, transparent)" : "oklch(1 0 0 / 0.04)",
                      border: `1px solid ${active ? "var(--color-accent)" : "var(--glass-border)"}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <code style={{ fontWeight: 700, color: "var(--color-accent)", fontSize: 12 }}>
                        {sha.substring(0, 7)}
                      </code>
                      <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
                        {new Date(d.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12 }}>Introduced {d.count} finding(s)</div>
                  </div>
                );
              })}
              {timeline.length === 0 && (
                <div style={{ color: "var(--color-muted-foreground)", fontSize: 13 }}>
                  No commits found.
                </div>
              )}
            </div>
          </div>
        </div>

        <FindingSidePanel finding={selected} onClose={() => setSelected(null)} />
      </div>
    </AppShell>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}