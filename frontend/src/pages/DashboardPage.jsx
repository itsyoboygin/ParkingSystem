import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardStats, getExpiringSubscriptions, getVisitorStats, getAlerts } from '../api/client';
import Loading from '../components/Loading';
import { AlertCircle, TrendingUp, Users, Car, DollarSign, Clock } from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState([]);
  const [visitorStats, setVisitorStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, expiringRes, visitorStatsRes, alertsRes] = await Promise.all([
        getDashboardStats(),
        getExpiringSubscriptions(7),
        getVisitorStats(),
        getAlerts()
      ]);
      
      setStats(statsRes.data);
      setExpiringSubscriptions(expiringRes.data.data);
      setVisitorStats(visitorStatsRes.data);
      setAlerts(alertsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const occupancyData = stats ? [
    { name: 'Occupied', value: stats.current_occupied_spaces || 0, color: '#002b5c' },
    { name: 'Available', value: stats.total_available_spaces || 0, color: '#66b2ff' }
  ] : [];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-full ${color.replace('text', 'bg').replace('-', '-')}/10`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
        <p className="text-gray-600">Real-time parking management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Subscriptions"
          value={stats?.active_subscriptions || 0}
          icon={Users}
          color="text-primary"
        />
        <StatCard
          title="Current Visitors"
          value={stats?.current_visitors || 0}
          icon={Car}
          color="text-accent"
        />
        <StatCard
          title="Today's Revenue"
          value={`${(stats?.today_visitor_revenue || 0).toLocaleString()} VND`}
          icon={DollarSign}
          color="text-green-600"
        />
        <StatCard
          title="Expiring Soon"
          value={stats?.expiring_soon || 0}
          icon={Clock}
          color="text-orange-600"
          subtitle="Within 7 days"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4">Parking Occupancy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Visitor Statistics */}
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4">Visitor Statistics (Today)</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total Visitors</span>
              <span className="text-2xl font-bold text-primary">{visitorStats?.total_visitors_today || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="text-gray-700 font-medium">Currently Parked</span>
              <span className="text-2xl font-bold text-accent">{visitorStats?.currently_parked || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total Revenue</span>
              <span className="text-2xl font-bold text-green-600">
                {(visitorStats?.total_revenue_today || 0).toLocaleString()} VND
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions */}
      {expiringSubscriptions.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Subscriptions Expiring Soon
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-lg">Resident</th>
                  <th className="table-header">License Plate</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Expiration Date</th>
                  <th className="table-header rounded-tr-lg">Contact</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {expiringSubscriptions.slice(0, 5).map((sub) => (
                  <tr key={sub.subscription_id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{sub.resident_name}</td>
                    <td className="table-cell">{sub.license_plate}</td>
                    <td className="table-cell">
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded-full text-sm">
                        {sub.subscription_type}
                      </span>
                    </td>
                    <td className="table-cell">{new Date(sub.expiration_date).toLocaleDateString()}</td>
                    <td className="table-cell">{sub.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
            System Alerts
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className="flex items-start p-3 bg-red-50 border-l-4 border-red-500 rounded"
              >
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">{alert.alert_type.replace('_', ' ')}</p>
                  <p className="text-sm text-red-700">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;