import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getFrameworks, getFindings } from '../api/client';

export default function Frameworks() {
  const { frameworks, setFrameworks, findings, setFindings } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [fwData, fData] = await Promise.all([
          getFrameworks(),
          getFindings() // to get total count mapped to framework
        ]);
        setFrameworks(fwData);
        setFindings(fData);
      } catch (e) {
        console.error("Failed to load frameworks", e);
      }
    }
    loadData();
  }, [setFrameworks, setFindings]);

  if (!frameworks) return <div className="slide-in">Loading...</div>;

  const getBarColor = (score: number) => {
    if (score >= 85) return 'var(--success-green)';
    if (score >= 60) return 'var(--medium-yellow)'; // amber
    return 'var(--critical-red)';
  };

  const fwList = [
    { key: 'soc2', name: 'SOC 2' },
    { key: 'gdpr', name: 'GDPR' },
    { key: 'hipaa', name: 'HIPAA' },
    { key: 'pcidss', name: 'PCI-DSS' },
    { key: 'owasp', name: 'OWASP' },
    { key: 'iso27001', name: 'ISO 27001' }
  ];

  return (
    <div className="slide-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Framework Compliance</h2>
      
      <div className="card glass">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {fwList.map(fw => {
            const score = frameworks[fw.key] || 100;
            const findingsCount = findings.filter(f => f.framework && f.framework.toLowerCase().includes(fw.key)).length;

            return (
              <div key={fw.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <h3 
                    onClick={() => navigate(`/findings?framework=${fw.key}`)}
                    style={{ margin: 0, cursor: 'pointer', color: 'var(--accent-blue)', textDecoration: 'underline' }}
                  >
                    {fw.name}
                  </h3>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{score.toFixed(1)}%</div>
                </div>
                
                <div style={{ width: '100%', background: 'var(--bg-dark)', height: '16px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      width: `${score}%`, 
                      background: getBarColor(score), 
                      height: '100%', 
                      transition: 'width 1s ease-in-out' 
                    }} 
                  />
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Based on {findingsCount} finding(s) mapped to this framework.
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
