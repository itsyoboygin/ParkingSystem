import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getDashboardStats, getExpiringSubscriptions, getVisitorStats, getAlerts } from '../api/client';
import Loading from '../components/Loading';
import { AlertCircle, TrendingUp, Users, Car, DollarSign, Clock, Activity, ParkingSquare } from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState([]);
  const [visitorStats, setVisitorStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      setStats(statsRes.data || {});
      setExpiringSubscriptions(expiringRes.data?.data || []);
      setVisitorStats(visitorStatsRes.data || {});
      setAlerts(alertsRes.data?.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="alert alert-danger flex items-center justify-between">
          <div>
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="btn-primary ml-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const occupancyData = stats ? [
    { name: 'Occupied', value: stats.current_occupied_spaces || 0, color: '#1e40af', percentage: Math.round(((stats.current_occupied_spaces || 0) / ((stats.current_occupied_spaces || 0) + (stats.total_available_spaces || 1))) * 100) },
    { name: 'Available', value: stats.total_available_spaces || 0, color: '#0ea5e9', percentage: Math.round(((stats.total_available_spaces || 0) / ((stats.current_occupied_spaces || 0) + (stats.total_available_spaces || 1))) * 100) }
  ] : [];

  const StatCard = ({ title, value, icon: Icon, gradient, subtitle, trend }) => (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Gradient Background */}
      <div className={`absolute inset-0 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-3">{title}</p>
            <p className="text-4xl font-black text-gray-800 mb-2 group-hover:scale-105 transition-transform">
              {value}
            </p>
            {subtitle && (
              <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Icon with Gradient Background */}
          <div className={`${gradient} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
        </div>
        
        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            <div className={`flex items-center gap-1 text-sm font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend)}%</span>
            </div>
            <span className="text-gray-400 text-sm">vs last month</span>
          </div>
        )}
      </div>
      
      {/* Decorative Element */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-slide-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-tight">
            Welcome Back! 👋
          </h1>
          <p className="text-gray-500 text-lg font-medium">
            Real-time parking management overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 rounded-2xl border border-blue-200">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="text-blue-900 font-semibold">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Grid - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Active Subscriptions"
          value={stats?.active_subscriptions || 0}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-600 to-blue-700"
          trend={12}
        />
        <StatCard
          title="Current Visitors"
          value={stats?.current_visitors || 0}
          icon={Car}
          gradient="bg-gradient-to-br from-cyan-500 to-cyan-600"
          trend={8}
        />
        <StatCard
          title="Today's Revenue"
          value={`${(stats?.today_visitor_revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
          subtitle="VND"
        />
        <StatCard
          title="Expiring Soon"
          value={stats?.expiring_soon || 0}
          icon={Clock}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          subtitle="Within 7 days"
        />
      </div>

      {/* Charts Row - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parking Occupancy Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl">
                <ParkingSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Parking Occupancy</h2>
                <p className="text-sm text-gray-500 font-medium">Current space utilization</p>
              </div>
            </div>
            <div className="badge badge-primary px-4 py-2 text-sm font-bold">Live</div>
          </div>
          
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex flex-col gap-4 flex-1 pl-6">
              {occupancyData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="font-semibold text-gray-700">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-gray-800">{entry.value}</div>
                    <div className="text-sm text-gray-500 font-medium">{entry.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visitor Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-3 rounded-xl">
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Visitor Activity</h2>
              <p className="text-sm text-gray-500 font-medium">Today's statistics</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl"></div>
              <div className="relative flex items-center justify-between p-5 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-semibold uppercase">Total Visitors</div>
                    <div className="text-3xl font-black text-gray-800">{visitorStats?.total_visitors_today || 0}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 rounded-xl"></div>
              <div className="relative flex items-center justify-between p-5 rounded-xl border-2 border-cyan-100 hover:border-cyan-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-3 rounded-xl">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-semibold uppercase">Currently Parked</div>
                    <div className="text-3xl font-black text-gray-800">{visitorStats?.currently_parked || 0}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl"></div>
              <div className="relative flex items-center justify-between p-5 rounded-xl border-2 border-green-100 hover:border-green-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-semibold uppercase">Total Revenue</div>
                    <div className="text-3xl font-black text-gray-800">
                      {(visitorStats?.total_revenue_today || 0).toLocaleString()}
                      <span className="text-lg text-gray-500 ml-2">VND</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions */}
      {expiringSubscriptions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Subscriptions Expiring Soon</h2>
                <p className="text-sm text-gray-500 font-medium">Requires attention within 7 days</p>
              </div>
            </div>
            <div className="badge badge-warning text-base px-6 py-2.5 font-bold">
              {expiringSubscriptions.length} subscriptions
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Resident</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">License Plate</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Expiration</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expiringSubscriptions.slice(0, 5).map((sub) => (
                  <tr key={sub.subscription_id} className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-800">{sub.resident_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
                        {sub.license_plate || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-accent px-3 py-1.5 font-semibold">
                        {sub.subscription_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-orange-600 font-bold">
                        {sub.expiration_date ? new Date(sub.expiration_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{sub.email || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl animate-pulse">
                <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">System Alerts</h2>
                <p className="text-sm text-gray-500 font-medium">Requires immediate attention</p>
              </div>
            </div>
            <div className="badge badge-danger text-base px-6 py-2.5 font-bold">
              {alerts.length} active
            </div>
          </div>
          
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-5 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all"
              >
                <div className="bg-red-500 p-2 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-900 mb-1 text-lg">
                    {alert.alert_type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN ALERT'}
                  </p>
                  <p className="text-red-700 font-medium">{alert.message || 'No message available'}</p>
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