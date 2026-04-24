import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { Summary } from "../store/useStore";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  summary: Summary | null;
}

export default function SeverityDonut({ summary }: Props) {
  if (!summary)
    return (
      <div className="glass" style={{ height: 320, padding: 20 }}>
        Loading…
      </div>
    );

  const data = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [
      {
        data: [summary.critical, summary.high, summary.medium, summary.low],
        backgroundColor: [
          "oklch(0.7 0.21 25)",
          "oklch(0.78 0.18 55)",
          "oklch(0.85 0.16 95)",
          "oklch(0.82 0.12 180)",
        ],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "oklch(0.97 0.01 90)", padding: 14, font: { size: 12 } },
      },
    },
  };

  const total = summary.critical + summary.high + summary.medium + summary.low;

  return (
    <div className="glass" style={{ height: 320, padding: 20, position: "relative" }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 15, fontWeight: 600 }}>
        Severity Distribution
      </h3>
      <div style={{ position: "relative", height: 230 }}>
        <Doughnut data={data} options={options} />
        <div
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700 }}>{total}</div>
          <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Findings
          </div>
        </div>
      </div>
    </div>
  );
}