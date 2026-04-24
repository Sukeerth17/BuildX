import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Navbar() {
  const location = useLocation();
  const logout = useStore((state) => state.logout);

  const navItems = [
    { path: '/', label: 'Overview' },
    { path: '/findings', label: 'Findings' },
    { path: '/frameworks', label: 'Frameworks' },
    { path: '/chat', label: 'AI Chat' },
    { path: '/audit', label: 'Audit Report' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'var(--bg-panel)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      zIndex: 1000,
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', color: 'white', fontWeight: 'bold' }}>
          <span style={{ color: 'var(--accent-blue)' }}>Compliance</span>AI
        </h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                color: location.pathname === item.path ? 'white' : 'var(--text-muted)',
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                padding: '8px 12px',
                borderRadius: '6px',
                background: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
