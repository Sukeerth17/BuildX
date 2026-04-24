import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Props {
  data: { date: string; pass_rate: number }[];
}

export default function TrendChart({ data }: Props) {
  const chartData = {
    labels: data.map((d) => d.date.substring(5)),
    datasets: [
      {
        label: "Pass Rate %",
        data: data.map((d) => d.pass_rate),
        borderColor: "oklch(0.85 0.14 330)",
        segment: {
          borderColor: (ctx: any) =>
            ctx.p1DataIndex !== undefined && data[ctx.p1DataIndex]?.pass_rate >= 85
              ? "oklch(0.78 0.16 155)"
              : "oklch(0.78 0.18 25)",
        },
        tension: 0.4,
        fill: true,
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "oklch(0.85 0.14 330 / 0.15)";
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "oklch(0.85 0.14 330 / 0.35)");
          g.addColorStop(1, "oklch(0.85 0.14 330 / 0)");
          return g;
        },
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: "oklch(0.97 0.01 90)",
        pointBorderColor: "oklch(0.78 0.16 330)",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: "oklch(1 0 0 / 0.06)" },
        ticks: { color: "oklch(0.82 0.03 90)", font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "oklch(0.82 0.03 90)", font: { size: 11 } },
      },
    },
  };

  return (
    <div className="glass" style={{ height: 320, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 15, fontWeight: 600 }}>
        14-Day Pass Rate Trend
      </h3>
      <div style={{ height: 240 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}