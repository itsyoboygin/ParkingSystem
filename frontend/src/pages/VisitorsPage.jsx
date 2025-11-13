import { useState, useEffect } from 'react';
import { getVisitors, getActiveVisitors, getVisitorStats, recordVisitorEntry, recordVisitorExit } from '../api/client';
import Loading from '../components/Loading';
import { LogIn, LogOut, DollarSign } from 'lucide-react';

const VisitorsPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showExitForm, setShowExitForm] = useState(false);

  const [entryForm, setEntryForm] = useState({
    license_plate: '',
    space_id: ''
  });

  const [exitForm, setExitForm] = useState({
    license_plate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [visitorsRes, activeRes, statsRes] = await Promise.all([
        getVisitors(50, 0),
        getActiveVisitors(),
        getVisitorStats()
      ]);
      setVisitors(visitorsRes.data?.data || []);
      setActiveVisitors(activeRes.data?.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Error fetching visitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntry = async (e) => {
    e.preventDefault();
    try {
      await recordVisitorEntry(entryForm);
      setShowEntryForm(false);
      setEntryForm({ license_plate: '', space_id: '' });
      fetchData();
      alert('Visitor entry recorded successfully!');
    } catch (error) {
      console.error('Error recording entry:', error);
      alert('Failed to record entry');
    }
  };

  const handleExit = async (e) => {
    e.preventDefault();
    try {
      const response = await recordVisitorExit(exitForm);
      setShowExitForm(false);
      setExitForm({ license_plate: '' });
      fetchData();
      alert(`Visitor exit recorded! Parking fee: ${response.data.parking_fee.toLocaleString()} VND`);
    } catch (error) {
      console.error('Error recording exit:', error);
      alert('Failed to record exit');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Visitor Parking</h1>
          <p className="text-gray-600">Manage visitor entries, exits, and fee calculation</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowEntryForm(!showEntryForm)} className="btn-primary flex items-center">
            <LogIn className="w-4 h-4 mr-2" />
            Record Entry
          </button>
          <button onClick={() => setShowExitForm(!showExitForm)} className="btn-secondary flex items-center">
            <LogOut className="w-4 h-4 mr-2" />
            Record Exit
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Visitors Today</p>
              <p className="text-3xl font-bold text-primary">{stats?.total_visitors_today || 0}</p>
            </div>
            <div className="p-4 rounded-full bg-blue-100">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Currently Parked</p>
              <p className="text-3xl font-bold text-accent">{stats?.currently_parked || 0}</p>
            </div>
            <div className="p-4 rounded-full bg-blue-100">
              <LogOut className="w-8 h-8 text-accent" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Today's Revenue</p>
              <p className="text-3xl font-bold text-green-600">{(stats?.total_revenue_today || 0).toLocaleString()} VND</p>
            </div>
            <div className="p-4 rounded-full bg-green-100">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      {showEntryForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
            <LogIn className="w-5 h-5 mr-2" />
            Record Visitor Entry
          </h2>
          <form onSubmit={handleEntry} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
              <input
                type="text"
                value={entryForm.license_plate}
                onChange={(e) => setEntryForm({...entryForm, license_plate: e.target.value})}
                className="input-field"
                placeholder="e.g., 29A-12345"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parking Space ID</label>
              <input
                type="number"
                value={entryForm.space_id}
                onChange={(e) => setEntryForm({...entryForm, space_id: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowEntryForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Record Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exit Form */}
      {showExitForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
            <LogOut className="w-5 h-5 mr-2" />
            Record Visitor Exit & Calculate Fee
          </h2>
          <form onSubmit={handleExit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
              <input
                type="text"
                value={exitForm.license_plate}
                onChange={(e) => setExitForm({...exitForm, license_plate: e.target.value})}
                className="input-field"
                placeholder="e.g., 29A-12345"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Fee: Day rate (6:00-18:00) 15,000 VND/hour | Night rate (18:00-6:00) 10,000 VND/hour
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowExitForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="btn-secondary">
                Calculate & Record Exit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Visitors */}
      {activeVisitors.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4">Currently Parked Visitors ({activeVisitors.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-lg">Record ID</th>
                  <th className="table-header">License Plate</th>
                  <th className="table-header">Space ID</th>
                  <th className="table-header">Arrival Time</th>
                  <th className="table-header rounded-tr-lg">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {activeVisitors.map((visitor, idx) => {
                  const duration = Math.floor((new Date() - new Date(visitor.arrival_time)) / 1000 / 60);
                  return (
                    <tr key={`active-visitor-${visitor.record_id}-${idx}-${visitor.arrival_time}`} className="hover:bg-gray-50">
                      <td className="table-cell">{visitor.record_id}</td>
                      <td className="table-cell font-mono font-bold">{visitor.license_plate || 'N/A'}</td>
                      <td className="table-cell">{visitor.space_id}</td>
                      <td className="table-cell">
                        {visitor.arrival_time ? new Date(visitor.arrival_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="table-cell">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {duration} mins
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visitor History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-primary mb-4">Recent Visitor History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header rounded-tl-lg">Record ID</th>
                <th className="table-header">License Plate</th>
                <th className="table-header">Arrival</th>
                <th className="table-header">Departure</th>
                <th className="table-header rounded-tr-lg">Fee (VND)</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {visitors.slice(0, 20).map((visitor, idx) => (
                <tr key={`visitor-history-${visitor.record_id}-${idx}-${visitor.arrival_time}`} className="hover:bg-gray-50">
                  <td className="table-cell">{visitor.record_id}</td>
                  <td className="table-cell font-mono">{visitor.license_plate || 'N/A'}</td>
                  <td className="table-cell">
                    {visitor.arrival_time ? new Date(visitor.arrival_time).toLocaleString() : 'N/A'}
                  </td>
                  <td className="table-cell">
                    {visitor.departure_time ? new Date(visitor.departure_time).toLocaleString() : 
                      <span className="text-green-600 font-semibold">Still parked</span>
                    }
                  </td>
                  <td className="table-cell">
                    {visitor.parking_fee ? (
                      <span className="font-semibold text-green-600">{visitor.parking_fee.toLocaleString()}</span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitorsPage;