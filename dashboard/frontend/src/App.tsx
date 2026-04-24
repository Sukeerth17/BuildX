import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import Overview from './pages/Overview';
import Findings from './pages/Findings';
import Frameworks from './pages/Frameworks';
import AIChat from './pages/AIChat';
import AuditReport from './pages/AuditReport';
import Login from './pages/Login';
import LiveFeedToast from './components/LiveFeedToast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar />
      <div style={{ padding: '24px', paddingTop: '80px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </div>
      <LiveFeedToast />
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
        <Route path="/findings" element={<ProtectedRoute><Findings /></ProtectedRoute>} />
        <Route path="/frameworks" element={<ProtectedRoute><Frameworks /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><AuditReport /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
