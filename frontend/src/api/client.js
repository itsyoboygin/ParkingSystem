import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Residents
export const getResidents = (limit = 100, offset = 0) => 
  api.get(`/api/residents?limit=${limit}&offset=${offset}`);

export const getResident = (id) => 
  api.get(`/api/residents/${id}`);

export const createResident = (data) => 
  api.post('/api/residents', data);

export const updateResident = (id, data) => 
  api.put(`/api/residents/${id}`, data);

export const deleteResident = (id) => 
  api.delete(`/api/residents/${id}`);

// Vehicles
export const getVehicles = (limit = 100, offset = 0) => 
  api.get(`/api/vehicles?limit=${limit}&offset=${offset}`);

export const getVehiclesByResident = (residentId) => 
  api.get(`/api/vehicles/resident/${residentId}`);

export const createVehicle = (data) => 
  api.post('/api/vehicles', data);

export const updateVehicle = (id, data) => 
  api.put(`/api/vehicles/${id}`, data);

export const deleteVehicle = (id) => 
  api.delete(`/api/vehicles/${id}`);

export const validateEntry = (licensePlate) => 
  api.post('/api/vehicles/validate-entry', null, { params: { license_plate: licensePlate } });

// Subscriptions
export const getSubscriptions = (limit = 100, offset = 0) => 
  api.get(`/api/subscriptions?limit=${limit}&offset=${offset}`);

export const getExpiringSubscriptions = (days = 7) => 
  api.get(`/api/subscriptions/expiring?days=${days}`);

export const createSubscription = (data) => 
  api.post('/api/subscriptions', data);

export const renewSubscription = (id, data) => 
  api.post(`/api/subscriptions/${id}/renew`, data);

export const deleteSubscription = (id) => 
  api.delete(`/api/subscriptions/${id}`);

// Visitors
export const getVisitors = (limit = 100, offset = 0) => 
  api.get(`/api/visitors?limit=${limit}&offset=${offset}`);

export const getActiveVisitors = () => 
  api.get('/api/visitors/active');

export const getVisitorStats = () => 
  api.get('/api/visitors/stats');

export const recordVisitorEntry = (data) => 
  api.post('/api/visitors/entry', data);

export const recordVisitorExit = (data) => 
  api.post('/api/visitors/exit', data);

// Dashboard
export const getDashboardStats = () => 
  api.get('/api/dashboard/stats');

export const getManagerDashboard = (managerId) => 
  api.get(`/api/dashboard/manager/${managerId}`);

export const getOccupancyDetails = () => 
  api.get('/api/dashboard/occupancy');

export const getAlerts = () => 
  api.get('/api/dashboard/alerts');

export const getRevenueDetails = () => 
  api.get('/api/dashboard/revenue');

// Supervisors
export const getSupervisors = () => 
  api.get('/api/supervisors');

export const getSupervisorShifts = (supervisorId) => 
  api.get(`/api/supervisors/${supervisorId}/shifts`);

export const getAllShifts = () => 
  api.get('/api/supervisors/shifts/all');

export const shiftCheckIn = (data) => 
  api.post('/api/supervisors/shifts/check-in', data);

export const shiftCheckOut = (shiftId) => 
  api.post(`/api/supervisors/shifts/${shiftId}/check-out`);

export const getSupervisorFinancialReport = (supervisorId) => 
  api.get(`/api/supervisors/${supervisorId}/financial-report`);

export const getAllSupervisorReports = () => 
  api.get('/api/supervisors/financial-report/current-month');

export default api;