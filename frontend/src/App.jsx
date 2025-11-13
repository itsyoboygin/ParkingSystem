import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ResidentsPage from './pages/ResidentsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import VisitorsPage from './pages/VisitorsPage';
import SupervisorsPage from './pages/SupervisorsPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto">
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