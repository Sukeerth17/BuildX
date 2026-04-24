import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartProps {
  data: { date: string; pass_rate: number }[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const chartData = {
    labels: data.map(d => d.date.substring(5)), // MM-DD
    datasets: [
      {
        label: 'Pass Rate %',
        data: data.map(d => d.pass_rate),
        borderColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'var(--accent-blue)';
          
          // Color based on value? The prompt says: "Color the line green when above 85%, red when below"
          // We can just use an array of colors for the segments, but simpler is returning one color if the latest is above 85.
          // Let's do segment coloring.
          return 'var(--accent-blue)';
        },
        segment: {
          borderColor: (ctx: any) => ctx.p1DataIndex !== undefined && data[ctx.p1DataIndex]?.pass_rate >= 85 ? 'var(--success-green)' : 'var(--critical-red)'
        },
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: 'var(--bg-card)'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'var(--border-color)' },
        ticks: { color: 'var(--text-muted)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)' }
      }
    }
  };

  return (
    <div className="card glass" style={{ height: '300px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>14-Day Pass Rate Trend</h3>
      <Line data={chartData} options={options} />
    </div>
  );
}
