import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { getFrameworks, getFindings } from "../api/client";
import AppShell from "../components/AppShell";

export const Route = createFileRoute("/frameworks")({
  component: FrameworksPage,
});

const FW_LIST = [
  { key: "soc2", name: "SOC 2" },
  { key: "gdpr", name: "GDPR" },
  { key: "hipaa", name: "HIPAA" },
  { key: "pcidss", name: "PCI-DSS" },
  { key: "owasp", name: "OWASP" },
  { key: "iso27001", name: "ISO 27001" },
];

function FrameworksPage() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const { frameworks, setFrameworks, findings, setFindings } = useStore();

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const [fw, f] = await Promise.all([getFrameworks(), getFindings()]);
      setFrameworks(fw);
      setFindings(f);
    })();
  }, [token, navigate, setFrameworks, setFindings]);

  const barColor = (s: number) => {
    if (s >= 85) return "linear-gradient(90deg, var(--success), oklch(0.78 0.13 180))";
    if (s >= 60) return "linear-gradient(90deg, var(--sev-medium), var(--sev-high))";
    return "linear-gradient(90deg, var(--sev-critical), var(--sev-high))";
  };

  return (
    <AppShell>
      <div className="fade-up" style={{ maxWidth: 880, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
          Framework Compliance
        </h2>
        <p style={{ margin: "0 0 24px", color: "var(--color-muted-foreground)", fontSize: 14 }}>
          Aggregate posture across regulatory frameworks.
        </p>

        <div className="glass" style={{ padding: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {FW_LIST.map((fw) => {
              const score = frameworks?.[fw.key] ?? 100;
              const cnt = findings.filter(
                (f) => f.mapped_frameworks.some((mapped) => mapped.toLowerCase().replace(/[-\s]/g, "") === fw.key),
              ).length;
              return (
                <div key={fw.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <h3
                      onClick={() => navigate({ to: "/findings", search: { framework: fw.key } })}
                      style={{ margin: 0, cursor: "pointer", fontSize: 16, fontWeight: 600 }}
                    >
                      {fw.name}
                    </h3>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
                      {score.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      background: "oklch(1 0 0 / 0.06)",
                      height: 12,
                      borderRadius: 6,
                      overflow: "hidden",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: `${score}%`,
                        background: barColor(score),
                        height: "100%",
                        transition: "width 1s ease-in-out",
                        boxShadow: "0 0 16px -2px oklch(1 0 0 / 0.3)",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                    Based on {cnt} finding(s) mapped to this framework.
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
