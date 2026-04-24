import React from 'react';
import { Finding } from '../store/useStore';

interface FindingsTableProps {
  findings: Finding[];
  onRowClick: (finding: Finding) => void;
}

export default function FindingsTable({ findings, onRowClick }: FindingsTableProps) {
  const getSeverityBadge = (sev: string) => {
    let color = 'var(--low-blue)';
    if (sev === 'CRITICAL') color = 'var(--critical-red)';
    if (sev === 'HIGH') color = 'var(--high-orange)';
    if (sev === 'MEDIUM') color = 'var(--medium-yellow)';
    
    return (
      <span style={{
        background: color,
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {sev}
      </span>
    );
  };

  const getStatusPill = (status: string) => {
    let bg = 'rgba(255,255,255,0.1)';
    let color = 'var(--text-muted)';
    if (status === 'fixed') {
      bg = 'rgba(34, 197, 94, 0.2)';
      color = 'var(--success-green)';
    }
    if (status === 'accepted') {
      bg = 'rgba(168, 85, 247, 0.2)';
      color = '#a855f7';
    }
    
    return (
      <span style={{
        background: bg,
        color: color,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            <th style={{ padding: '12px 8px' }}>Severity</th>
            <th style={{ padding: '12px 8px' }}>Rule ID</th>
            <th style={{ padding: '12px 8px' }}>File</th>
            <th style={{ padding: '12px 8px' }}>Line</th>
            <th style={{ padding: '12px 8px' }}>Framework</th>
            <th style={{ padding: '12px 8px' }}>Repo</th>
            <th style={{ padding: '12px 8px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {findings.map(f => (
            <tr 
              key={f.id} 
              onClick={() => onRowClick(f)}
              style={{ 
                borderBottom: '1px solid var(--border-color)', 
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 8px' }}>{getSeverityBadge(f.severity)}</td>
              <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{f.rule_id}</td>
              <td style={{ padding: '12px 8px' }} title={f.file_path}>
                {f.file_path.length > 30 ? '...' + f.file_path.substring(f.file_path.length - 27) : f.file_path}
              </td>
              <td style={{ padding: '12px 8px' }}>{f.line_number}</td>
              <td style={{ padding: '12px 8px', fontSize: '12px' }}>{f.framework}</td>
              <td style={{ padding: '12px 8px' }}>{f.repo}</td>
              <td style={{ padding: '12px 8px' }}>{getStatusPill(f.status)}</td>
            </tr>
          ))}
          {findings.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No findings match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
