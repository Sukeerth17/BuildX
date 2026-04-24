import { useState, useEffect } from 'react';
import { generateAuditReport, getSnapshots } from '../api/client';

export default function AuditReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentReports, setRecentReports] = useState<{ start: string, end: string, generatedAt: string }[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);

  useEffect(() => {
    // Load recent reports from local storage
    const stored = localStorage.getItem('complianceai_recent_reports');
    if (stored) {
      setRecentReports(JSON.parse(stored));
    }

    // Load snapshots
    async function loadSnapshots() {
      try {
        const data = await getSnapshots();
        setSnapshots(data);
      } catch (e) {
        console.error("Failed to load snapshots", e);
      }
    }
    loadSnapshots();

    // Default dates
    const d = new Date();
    setEndDate(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() - 14);
    setStartDate(d.toISOString().split('T')[0]);
  }, []);

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const blob = await generateAuditReport(startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      const newReport = { start: startDate, end: endDate, generatedAt: new Date().toISOString() };
      const updatedReports = [newReport, ...recentReports].slice(0, 3);
      setRecentReports(updatedReports);
      localStorage.setItem('complianceai_recent_reports', JSON.stringify(updatedReports));
      
    } catch (e) {
      console.error("Failed to generate report", e);
      alert("Failed to generate report. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="slide-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Generate Audit Report</h2>
        
        <div className="card glass" style={{ marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Generate a comprehensive PDF audit report including an AI-generated compliance narrative, severity breakdown, and framework compliance percentages.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'white', colorScheme: 'dark' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'white', colorScheme: 'dark' }}
              />
            </div>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={loading || !startDate || !endDate}
            style={{
              width: '100%', padding: '16px', borderRadius: '8px', border: 'none', 
              background: 'var(--accent-blue)', color: 'white', fontWeight: 'bold', fontSize: '16px',
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '⏳ Ollama is writing your audit narrative...' : 'Generate Report (PDF)'}
          </button>
        </div>

        {recentReports.length > 0 && (
          <div className="card glass">
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Recent Reports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentReports.map((r, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)', marginBottom: '4px' }}>
                    {r.start} to {r.end}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Generated: {new Date(r.generatedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Nightly Snapshot Evidence Log</h2>
        <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
              Timestamped history proving compliance posture. Auditors can rely on these daily snapshots as evidence of continuous compliance.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>SOC 2</th>
                  <th style={{ padding: '12px' }}>GDPR</th>
                  <th style={{ padding: '12px' }}>HIPAA</th>
                  <th style={{ padding: '12px' }}>PCI-DSS</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map(s => (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{s.snapshot_date}</td>
                    <td style={{ padding: '12px', color: s.soc2 >= 85 ? 'var(--success-green)' : 'var(--critical-red)' }}>{s.soc2.toFixed(1)}%</td>
                    <td style={{ padding: '12px', color: s.gdpr >= 85 ? 'var(--success-green)' : 'var(--critical-red)' }}>{s.gdpr.toFixed(1)}%</td>
                    <td style={{ padding: '12px', color: s.hipaa >= 85 ? 'var(--success-green)' : 'var(--critical-red)' }}>{s.hipaa.toFixed(1)}%</td>
                    <td style={{ padding: '12px', color: s.pcidss >= 85 ? 'var(--success-green)' : 'var(--critical-red)' }}>{s.pcidss.toFixed(1)}%</td>
                  </tr>
                ))}
                {snapshots.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No snapshots recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
