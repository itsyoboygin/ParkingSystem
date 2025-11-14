import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage.jsx';
import ResidentsPage from './pages/ResidentsPage.jsx';
import SubscriptionsPage from './pages/SubscriptionsPage.jsx';
import VisitorsPage from './pages/VisitorsPage.jsx';
import SupervisorsPage from './pages/SupervisorsPage.jsx';
import './index.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(!!m.matches);
    onChange();
    m.addEventListener?.('change', onChange);
    return () => m.removeEventListener?.('change', onChange);
  }, []);

  const sidebarWidth = isDesktop ? (sidebarCollapsed ? 80 : 256) : 0;

  return (
    <Router>
      <div className = "app-container">
        {/* Sidebar */}
        <Navbar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((s) => !s)}
        />

        {/* Main content */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/residents" element={<ResidentsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/visitors" element={<VisitorsPage />} />
            <Route path="/supervisors" element={<SupervisorsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;