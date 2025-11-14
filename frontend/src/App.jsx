import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage.jsx';
import ResidentsPage from './pages/ResidentsPage.jsx';
import SubscriptionsPage from './pages/SubscriptionsPage.jsx';
import VisitorsPage from './pages/VisitorsPage.jsx';
import SupervisorsPage from './pages/SupervisorsPage.jsx';
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