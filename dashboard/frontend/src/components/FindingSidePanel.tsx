import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Finding } from '../store/useStore';
import { updateFindingStatus } from '../api/client';

interface FindingSidePanelProps {
  finding: Finding | null;
  onClose: () => void;
}

export default function FindingSidePanel({ finding, onClose }: FindingSidePanelProps) {
  const updateOptimistically = useStore(state => state.updateFindingOptimistically);
  const [loading, setLoading] = useState(false);

  if (!finding) return null;

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateFindingStatus(finding.id, newStatus);
      updateOptimistically(finding.id, newStatus);
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'CRITICAL') return 'var(--critical-red)';
    if (sev === 'HIGH') return 'var(--high-orange)';
    if (sev === 'MEDIUM') return 'var(--medium-yellow)';
    return 'var(--low-blue)';
  };

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1001
        }}
      />
      <div 
        className="glass slide-in"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px',
          zIndex: 1002, borderLeft: `4px solid ${getSeverityColor(finding.severity)}`,
          borderTopRightRadius: 0, borderBottomRightRadius: 0,
          padding: '24px', overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>{finding.rule_id}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ background: getSeverityColor(finding.severity), padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{finding.severity}</span>
          <span style={{ marginLeft: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>{finding.framework}</span>
        </div>

        <div style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
          <strong>Location:</strong> {finding.repo}/{finding.file_path}:{finding.line_number}
        </div>

        <div style={{ marginBottom: '24px', background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px' }}>
          <strong>Description:</strong>
          <p style={{ margin: '8px 0 0 0' }}>{finding.message}</p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <strong>AI Fix Suggestion:</strong>
          <pre style={{ 
            background: '#000', padding: '16px', borderRadius: '8px', 
            overflowX: 'auto', color: 'var(--success-green)', marginTop: '8px',
            fontFamily: 'monospace'
          }}>
            {finding.fix_suggestion || "No fix suggestion available."}
          </pre>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <strong>Commit SHA:</strong>
          <code style={{ background: 'var(--bg-dark)', padding: '4px 8px', borderRadius: '4px', marginLeft: '8px' }}>
            {finding.commit_sha}
          </code>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Status</label>
            <select 
              value={finding.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)'
              }}
            >
              <option value="open">Open</option>
              <option value="fixed">Fixed</option>
              <option value="accepted">Accepted (Risk)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => handleStatusChange('fixed')}
              disabled={loading || finding.status === 'fixed'}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--success-green)', color: 'white', border: 'none', cursor: 'pointer', opacity: finding.status === 'fixed' ? 0.5 : 1 }}
            >
              Mark as Fixed
            </button>
            <button 
              onClick={() => handleStatusChange('accepted')}
              disabled={loading || finding.status === 'accepted'}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid #a855f7', color: '#a855f7', cursor: 'pointer', opacity: finding.status === 'accepted' ? 0.5 : 1 }}
            >
              Accept Risk
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
