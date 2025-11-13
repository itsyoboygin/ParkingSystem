import { useState, useEffect } from 'react';
import { getSubscriptions, createSubscription, renewSubscription, getExpiringSubscriptions } from '../api/client';
import Loading from '../components/Loading';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    vehicle_id: '',
    resident_id: '',
    subscription_type: 'monthly',
    cost: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, expiringRes] = await Promise.all([
        getSubscriptions(100, 0),
        getExpiringSubscriptions(7)
      ]);
      setSubscriptions(subsRes.data.data);
      setExpiring(expiringRes.data.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSubscription(form);
      setShowForm(false);
      setForm({ vehicle_id: '', resident_id: '', subscription_type: 'monthly', cost: '' });
      fetchData();
      alert('Subscription created successfully!');
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription');
    }
  };

  const handleRenew = async (subscriptionId) => {
    if (window.confirm('Renew this subscription?')) {
      try {
        await renewSubscription(subscriptionId, { renewal_type: 'SAME' });
        fetchData();
        alert('Subscription renewed successfully!');
      } catch (error) {
        console.error('Error renewing subscription:', error);
        alert('Failed to renew subscription');
      }
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Parking Subscriptions</h1>
          <p className="text-gray-600">Manage and renew parking subscriptions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Subscription
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4">Create Subscription</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle ID</label>
              <input
                type="number"
                value={form.vehicle_id}
                onChange={(e) => setForm({...form, vehicle_id: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resident ID</label>
              <input
                type="number"
                value={form.resident_id}
                onChange={(e) => setForm({...form, resident_id: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Type</label>
              <select
                value={form.subscription_type}
                onChange={(e) => setForm({...form, subscription_type: e.target.value})}
                className="input-field"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (VND)</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({...form, cost: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Subscription
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expiring Subscriptions Alert */}
      {expiring.length > 0 && (
        <div className="card bg-orange-50 border-l-4 border-orange-500">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-orange-600 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                {expiring.length} Subscription{expiring.length > 1 ? 's' : ''} Expiring Soon
              </h3>
              <p className="text-orange-700 mb-3">These subscriptions will expire within 7 days. Contact residents to renew.</p>
              <div className="space-y-2">
                {expiring.slice(0, 3).map((sub) => (
                  <div key={sub.subscription_id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{sub.resident_name}</p>
                      <p className="text-sm text-gray-600">{sub.license_plate} • Expires: {new Date(sub.expiration_date).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleRenew(sub.subscription_id)}
                      className="btn-secondary flex items-center text-sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Renew
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Subscriptions Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-primary mb-4">All Subscriptions ({subscriptions.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header rounded-tl-lg">ID</th>
                <th className="table-header">Resident</th>
                <th className="table-header">License Plate</th>
                <th className="table-header">Type</th>
                <th className="table-header">Start Date</th>
                <th className="table-header">Expiration</th>
                <th className="table-header">Cost</th>
                <th className="table-header rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {subscriptions.slice(0, 20).map((sub) => {
                const isExpiring = new Date(sub.expiration_date) - new Date() < 7 * 24 * 60 * 60 * 1000;
                const isExpired = new Date(sub.expiration_date) < new Date();
                
                return (
                  <tr key={sub.subscription_id} className={`hover:bg-gray-50 ${isExpired ? 'bg-red-50' : isExpiring ? 'bg-yellow-50' : ''}`}>
                    <td className="table-cell">{sub.subscription_id}</td>
                    <td className="table-cell font-medium">{sub.resident_name}</td>
                    <td className="table-cell font-mono">{sub.license_plate}</td>
                    <td className="table-cell">
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded-full text-sm">
                        {sub.is_monthly ? 'Monthly' : sub.is_quaterly ? 'Quarterly' : 'Yearly'}
                      </span>
                    </td>
                    <td className="table-cell">{new Date(sub.start_date).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <span className={isExpired ? 'text-red-600 font-semibold' : isExpiring ? 'text-orange-600 font-semibold' : ''}>
                        {new Date(sub.expiration_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="table-cell">{sub.cost?.toLocaleString()} VND</td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleRenew(sub.subscription_id)}
                        className="text-accent hover:text-accent-dark"
                        title="Renew subscription"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;