
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { Summary } from '../store/useStore';

ChartJS.register(ArcElement, Tooltip, Legend);

interface SeverityDonutProps {
  summary: Summary | null;
}

export default function SeverityDonut({ summary }: SeverityDonutProps) {
  if (!summary) return <div className="card glass" style={{ height: '300px' }}>Loading...</div>;

  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [summary.critical, summary.high, summary.medium, summary.low],
        backgroundColor: [
          '#ef4444', // red
          '#f97316', // orange
          '#eab308', // yellow
          '#0ea5e9'  // blue
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'var(--text-main)' }
      }
    }
  };

  const total = summary.critical + summary.high + summary.medium + summary.low;

  return (
    <div className="card glass" style={{ height: '300px', position: 'relative' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Severity Distribution</h3>
      <div style={{ position: 'relative', height: '220px' }}>
        <Doughnut data={data} options={options} />
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{total}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Findings</div>
        </div>
      </div>
    </div>
  );
}
