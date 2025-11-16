import { useState, useEffect } from 'react';
import { getResidents, getVehicles, createResident, createVehicle, deleteResident, deleteVehicle } from '../api/client';
import Loading from '../components/Loading';
import { Plus, Trash2, Search, User, Car } from 'lucide-react';

const ResidentsPage = () => {
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResidentForm, setShowResidentForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [residentForm, setResidentForm] = useState({
    apartment_id: '',
    name: '',
    phone_number: '',
    email: ''
  });

  const [vehicleForm, setVehicleForm] = useState({
    resident_id: '',
    license_plate: '',
    vehicle_type: 'Car'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Sub Tabs
  const [activeTab, setActiveTab] = useState('residents');

  // Data Fetching
  const fetchData = async () => {
    try {
      const [residentsRes, vehiclesRes] = await Promise.all([
        getResidents(100, 0),
        getVehicles(100, 0)
      ]);
      
      console.log('=== RESIDENTS DEBUG ===');
      console.log('Full response:', residentsRes);
      console.log('residentsRes.data:', residentsRes.data);
      console.log('residentsRes.data.data:', residentsRes.data?.data);
      console.log('residentsRes.data.count:', residentsRes.data?.count);
      
      // Response structure: {data: {data: [...], count: N}}
      const residentsArray = residentsRes.data?.data || [];
      const vehiclesArray = vehiclesRes.data?.data || [];
      
      console.log('Final residents array:', residentsArray);
      console.log('Final vehicles array:', vehiclesArray);
      console.log('Residents length:', residentsArray.length);
      console.log('Vehicles length:', vehiclesArray.length);
      
      setResidents(residentsArray);
      setVehicles(vehiclesArray);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResident = async (e) => {
    e.preventDefault();
    try {
      await createResident(residentForm);
      setShowResidentForm(false);
      setResidentForm({ apartment_id: '', name: '', phone_number: '', email: '' });
      fetchData();
      console.log('[notification] success: Resident created successfully');
    } catch (error) {
      console.error('Error creating resident:', error);
      console.error('[notification] error:', error?.message || 'Failed to create resident');
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await createVehicle(vehicleForm);
      setShowVehicleForm(false);
      setVehicleForm({ resident_id: '', license_plate: '', vehicle_type: 'Car' });
      fetchData();
      console.log('[notification] success: Vehicle registered successfully');
    } catch (error) {
      console.error('Error registering vehicle:', error);
      console.error('[notification] error:', error?.message || 'Failed to register vehicle');
    }
  };

  const handleDeleteResident = async (id) => {
    if (window.confirm('Are you sure you want to delete this resident?')) {
      try {
        await deleteResident(id);
        fetchData();
        console.log('[notification] success: Resident deleted successfully');
      } catch (error) {
        console.error('Error deleting resident:', error);
        console.error('[notification] error:', error?.message || 'Failed to delete resident');
      }
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id);
        fetchData();
        console.log('[notification] success: Vehicle deleted successfully');
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        console.error('[notification] error:', error?.message || 'Failed to delete vehicle');
      }
    }
  };

  const filteredResidents = residents.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.resident_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* Pagination Logic */
  const itemsPerPage = 20;
  const [currentPageResidents, setCurrentPageResidents] = useState(1);
  const [currentPageVehicles, setCurrentPageVehicles] = useState(1);

  const totalPagesResidents = Math.ceil(filteredResidents.length / itemsPerPage);
  const startIndexResidents = (currentPageResidents - 1) * itemsPerPage;
  const endIndexResidents = startIndexResidents + itemsPerPage;
  const currentResidents = filteredResidents.slice(startIndexResidents, endIndexResidents);

  const totalPagesVehicles = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndexVehicles = (currentPageVehicles - 1) * itemsPerPage;
  const endIndexVehicles = startIndexVehicles + itemsPerPage;
  const currentVehicles = filteredVehicles.slice(startIndexVehicles, endIndexVehicles);

  if (loading) return <Loading />;

  return (
    <div className="dashboard-container">
      <div className="page-header mb-6 flex justify-between items-start">
        <h1>Residents & Vehicles</h1>
        <p>Manage resident information and vehicle registrations</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'residents' ? 'active' : ''}`}
          onClick={() => setActiveTab('residents')}
        >
          Residents
        </button>
        <button
          className={`tab-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          Vehicles
        </button>
      </div>

      {activeTab === 'residents' && (
        <div>
          <button onClick={() => setShowResidentForm(!showResidentForm)} className="btn-secondary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Resident
          </button>

          {/* Search Bar */}
          <div className="card">
            <div className="flex items-center">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by name, email, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Resident Form */}
          {showResidentForm && (
            <div className="card">
              <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                New Resident
              </h2>
              <form onSubmit={handleCreateResident} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apartment ID</label>
                  <input
                    type="number"
                    value={residentForm.apartment_id}
                    onChange={(e) => setResidentForm({...residentForm, apartment_id: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={residentForm.name}
                    onChange={(e) => setResidentForm({...residentForm, name: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={residentForm.phone_number}
                    onChange={(e) => setResidentForm({...residentForm, phone_number: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={residentForm.email}
                    onChange={(e) => setResidentForm({...residentForm, email: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <br></br>
                <div className="md:col-span-2 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowResidentForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-secondary">
                    Create Resident
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Residents Table */}
          <div className="card">
            <h2 className="text-xl font-semibold text-primary mb-4">Residents ({filteredResidents.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header rounded-tl-lg">ID</th>
                    <th className="table-header">Name</th>
                    <th className="table-header">Building</th>
                    <th className="table-header">Floor</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Email</th>
                    <th className="table-header rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredResidents.slice(0, 20).map((resident) => (
                    <tr key={`resident-${resident.resident_id}`} className="hover:bg-gray-50">
                      <td className="table-cell">{resident.resident_id}</td>
                      <td className="table-cell font-medium">{resident.name}</td>
                      <td className="table-cell">{resident.building_id}</td>
                      <td className="table-cell">{resident.floor}</td>
                      <td className="table-cell">{resident.phone_number}</td>
                      <td className="table-cell">{resident.email}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleDeleteResident(resident.resident_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Residents */}
            <div className="table-pagination">
              <div className="page-info">
                Showing {startIndexResidents + 1} to {Math.min(endIndexResidents, filteredResidents.length)} of {filteredResidents.length} residents
              </div>
              <div className="page-controls">
                <button onClick={() => setCurrentPageResidents(prev => Math.max(prev - 1, 1))} disabled={currentPageResidents === 1}>Previous</button>
                {Array.from({ length: totalPagesResidents }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPageResidents(page)} className={currentPageResidents === page ? 'active' : ''}>{page}</button>
                ))}
                <button onClick={() => setCurrentPageResidents(prev => Math.min(prev + 1, totalPagesResidents))} disabled={currentPageResidents === totalPagesResidents}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div>
          <button onClick={() => setShowVehicleForm(!showVehicleForm)} className="btn-secondary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Register Vehicle
          </button>

          {/* Search Bar */}
          <div className="card">
            <div className="flex items-center">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by name, email, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Vehicle Form */}
          {showVehicleForm && (
            <div className="card">
              <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2" />
                Register Vehicle
              </h2>
              <form onSubmit={handleCreateVehicle} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resident ID</label>
                  <input
                    type="number"
                    value={vehicleForm.resident_id}
                    onChange={(e) => setVehicleForm({...vehicleForm, resident_id: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                  <input
                    type="text"
                    value={vehicleForm.license_plate}
                    onChange={(e) => setVehicleForm({...vehicleForm, license_plate: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleForm.vehicle_type}
                    onChange={(e) => setVehicleForm({...vehicleForm, vehicle_type: e.target.value})}
                    className="input-field"
                  >
                    <option value="Car">Car</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="EV_Car">EV Car</option>
                    <option value="EV_Motorcycle">EV Motorcycle</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowVehicleForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-secondary">
                    Register Vehicle
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vehicles Table */}
          <div className="card">
            <h2 className="text-xl font-semibold text-primary mb-4">Vehicles ({filteredVehicles.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header rounded-tl-lg">ID</th>
                    <th className="table-header">License Plate</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Owner</th>
                    <th className="table-header rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredVehicles.slice(0, 20).map((vehicle) => (
                    <tr key={`vehicle-${vehicle.vehicle_id}`} className="hover:bg-gray-50">
                      <td className="table-cell">{vehicle.vehicle_id}</td>
                      <td className="table-cell font-mono font-bold">{vehicle.license_plate}</td>
                      <td className="table-cell">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {vehicle.vehicle_type}
                        </span>
                      </td>
                      <td className="table-cell">{vehicle.resident_name}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.vehicle_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Vehicles */}
            <div className="table-pagination">
              <div className="page-info">
                Showing {startIndexResidents + 1} to {Math.min(endIndexVehicles, filteredVehicles.length)} of {filteredVehicles.length} vehicles
              </div>
              <div className="page-controls">
                <button onClick={() => setCurrentPageVehicles(prev => Math.max(prev - 1, 1))} disabled={currentPageVehicles === 1}>Previous</button>
                {Array.from({ length: totalPagesResidents }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPageVehicles(page)} className={currentPageVehicles === page ? 'active' : ''}>{page}</button>
                ))}
                <button onClick={() => setCurrentPageVehicles(prev => Math.min(prev + 1, totalPagesVehicles))} disabled={currentPageVehicles === totalPagesVehicles}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentsPage;