import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import type { Finding } from '../store/useStore';

interface Toast {
  id: number;
  finding: Finding;
}

export default function LiveFeedToast() {
  const addFinding = useStore((state) => state.addFinding);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: any;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/ws/live');

      ws.onopen = () => {
        console.log('Connected to Live WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'new_finding') {
            const finding: Finding = data.data;
            addFinding(finding);
            
            const newToast: Toast = { id: Date.now(), finding };
            setToasts(prev => [...prev, newToast]);
            
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== newToast.id));
            }, 4000);
          }
        } catch (e) {
          console.error('WebSocket parse error', e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed, attempting to reconnect...');
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [addFinding]);

  const getSeverityColor = (sev: string) => {
    if (sev === 'CRITICAL') return 'var(--critical-red)';
    if (sev === 'HIGH') return 'var(--high-orange)';
    if (sev === 'MEDIUM') return 'var(--medium-yellow)';
    return 'var(--low-blue)';
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="glass slide-in"
          style={{
            padding: '16px',
            width: '320px',
            borderLeft: `4px solid ${getSeverityColor(toast.finding.severity)}`,
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            New {toast.finding.severity} finding
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            in {toast.finding.repo} ({toast.finding.file_path})
          </div>
        </div>
      ))}
    </div>
  );
}
