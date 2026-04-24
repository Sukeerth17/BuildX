import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Finding } from '../store/useStore';
import { getFindings } from '../api/client';
import FindingsTable from '../components/FindingsTable';
import FindingSidePanel from '../components/FindingSidePanel';

export default function Findings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { findings, setFindings } = useStore();
  
  const initialFramework = searchParams.get('framework') || '';
  const initialRepo = searchParams.get('repo') || '';
  const initialCommit = searchParams.get('commit') || '';

  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [repoFilter, setRepoFilter] = useState(initialRepo);
  const [frameworkFilter, setFrameworkFilter] = useState(initialFramework);
  const [commitFilter, setCommitFilter] = useState(initialCommit);
  
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  useEffect(() => {
    async function loadFindings() {
      try {
        const filters: any = {};
        if (severityFilter) filters.severity = severityFilter;
        if (statusFilter) filters.status = statusFilter;
        if (repoFilter) filters.repo = repoFilter;
        if (frameworkFilter) filters.framework = frameworkFilter;
        
        const data = await getFindings(filters);
        
        // The API might not filter by commit, so we filter it client-side if needed, 
        // but the backend findings endpoint doesn't accept commit filter in the spec.
        let filteredData = data;
        if (commitFilter) {
          filteredData = data.filter((f: Finding) => f.commit_sha.startsWith(commitFilter));
        }

        setFindings(filteredData);
      } catch (e) {
        console.error("Failed to load findings", e);
      }
    }
    loadFindings();
  }, [severityFilter, statusFilter, repoFilter, frameworkFilter, commitFilter, setFindings]);

  // Commit Scan History - group by commit_sha
  const commitMap: Record<string, { date: string, count: number }> = {};
  findings.forEach(f => {
    if (!commitMap[f.commit_sha]) {
      commitMap[f.commit_sha] = { date: f.created_at, count: 0 };
    }
    commitMap[f.commit_sha].count += 1;
  });

  const timeline = Object.entries(commitMap)
    .sort((a, b) => new Date(b[1].date).getTime() - new Date(a[1].date).getTime())
    .slice(0, 10);

  // Derive unique repos for the dropdown filter (could use all findings, but we just use current list or hardcoded if we don't have an API)
  const repos = Array.from(new Set(findings.map(f => f.repo)));

  return (
    <div className="slide-in" style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Findings</h2>
        
        <div className="card glass" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Severity</label>
            <select 
              value={severityFilter} 
              onChange={e => setSeverityFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)' }}
            >
              <option value="">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)' }}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="fixed">Fixed</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Repository</label>
            <select 
              value={repoFilter} 
              onChange={e => {
                setRepoFilter(e.target.value);
                setSearchParams(prev => { prev.set('repo', e.target.value); return prev; });
              }}
              style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)' }}
            >
              <option value="">All</option>
              {repos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Framework</label>
            <input 
              type="text" 
              placeholder="e.g. soc2" 
              value={frameworkFilter} 
              onChange={e => {
                setFrameworkFilter(e.target.value);
                setSearchParams(prev => { prev.set('framework', e.target.value); return prev; });
              }}
              style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)' }}
            />
          </div>
          {commitFilter && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={() => setCommitFilter('')}
                style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--critical-red)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                Clear Commit Filter
              </button>
            </div>
          )}
        </div>

        <div className="card glass">
          <FindingsTable findings={findings} onRowClick={(f) => setSelectedFinding(f)} />
        </div>
      </div>

      <div style={{ width: '300px' }}>
        <div className="card glass" style={{ position: 'sticky', top: '88px' }}>
          <h3 style={{ marginTop: 0 }}>Commit Scan History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {timeline.map(([sha, data]) => (
              <div 
                key={sha}
                onClick={() => setCommitFilter(sha)}
                style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  background: commitFilter === sha ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-dark)',
                  border: commitFilter === sha ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <code style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{sha.substring(0, 7)}</code>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(data.date).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '14px' }}>
                  Introduced {data.count} finding(s)
                </div>
              </div>
            ))}
            {timeline.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No commits found.</div>
            )}
          </div>
        </div>
      </div>

      <FindingSidePanel finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
    </div>
  );
}
