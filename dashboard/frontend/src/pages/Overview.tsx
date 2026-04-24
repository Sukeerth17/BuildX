import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getSummary, getTrend, getFindings } from '../api/client';
import KPICard from '../components/KPICard';
import TrendChart from '../components/TrendChart';
import SeverityDonut from '../components/SeverityDonut';

export default function Overview() {
  const { summary, trend, findings, setSummary, setTrend, setFindings } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [sumData, trData, findsData] = await Promise.all([
          getSummary(),
          getTrend(),
          getFindings()
        ]);
        setSummary(sumData);
        setTrend(trData);
        setFindings(findsData);
      } catch (e) {
        console.error("Failed to load overview data", e);
      }
    }
    loadData();
  }, [setSummary, setTrend, setFindings]);

  const auditHoursSaved = (summary?.critical || 0) + (summary?.high || 0) + (summary?.medium || 0) + (summary?.low || 0);

  // Repo Risk Scoreboard
  const repoMap: Record<string, { total: number, critical: number, passed: number }> = {};
  findings.forEach(f => {
    if (!repoMap[f.repo]) repoMap[f.repo] = { total: 0, critical: 0, passed: 0 };
    repoMap[f.repo].total += 1;
    if (f.severity === 'CRITICAL') repoMap[f.repo].critical += 1;
    if (f.status === 'fixed' || f.status === 'accepted') repoMap[f.repo].passed += 1;
  });

  const topRepos = Object.entries(repoMap)
    .map(([repo, stats]) => ({ repo, ...stats }))
    .sort((a, b) => b.critical - a.critical)
    .slice(0, 5);

  // Top Violated Rules
  const ruleMap: Record<string, { count: number, desc: string }> = {};
  findings.forEach(f => {
    if (!ruleMap[f.rule_id]) ruleMap[f.rule_id] = { count: 0, desc: f.message };
    ruleMap[f.rule_id].count += 1;
  });

  const topRules = Object.entries(ruleMap)
    .map(([rule_id, val]) => ({ rule_id, ...val }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="slide-in">
      <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Dashboard Overview</h2>
      
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <KPICard label="Critical Findings" value={summary?.critical || 0} color="var(--critical-red)" />
        <KPICard label="High Findings" value={summary?.high || 0} color="var(--high-orange)" />
        <KPICard label="Pass Rate" value={`${summary?.pass_rate || 0}%`} color="var(--success-green)" />
        <KPICard label="Audit Hrs Saved" value={auditHoursSaved * 0.5} color="var(--accent-blue)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <TrendChart data={trend} />
        <SeverityDonut summary={summary} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card glass">
          <h3 style={{ marginTop: 0 }}>Repository Risk Scoreboard</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 0' }}>Repository</th>
                <th style={{ padding: '8px 0' }}>Total</th>
                <th style={{ padding: '8px 0', color: 'var(--critical-red)' }}>Critical</th>
                <th style={{ padding: '8px 0' }}>Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              {topRepos.map(r => (
                <tr key={r.repo} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 0' }}>
                    <span 
                      onClick={() => navigate(`/findings?repo=${r.repo}`)}
                      style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {r.repo}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0' }}>{r.total}</td>
                  <td style={{ padding: '12px 0', color: r.critical > 0 ? 'var(--critical-red)' : 'inherit' }}>{r.critical}</td>
                  <td style={{ padding: '12px 0' }}>{((r.passed / r.total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card glass">
          <h3 style={{ marginTop: 0 }}>Top Violated Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topRules.map(r => {
              const maxCount = topRules[0]?.count || 1;
              const width = `${(r.count / maxCount) * 100}%`;
              return (
                <div key={r.rule_id} title={r.desc}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>{r.rule_id}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{r.count} occurrences</span>
                  </div>
                  <div style={{ width: '100%', background: 'var(--bg-dark)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width, background: 'var(--high-orange)', height: '100%', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
