import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  color: string;
}

export default function KPICard({ label, value, color }: KPICardProps) {
  return (
    <div className="card glass" style={{ borderLeft: `4px solid ${color}`, flex: 1 }}>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}
