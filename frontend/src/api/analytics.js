import axios from 'axios';

const API_URL = 'https://shree-samart-fleet-managment.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyticsAPI = {
  getVehicleSummaryList: () => api.get('/analytics/vehicles/summary'),
  getVehicleProfit: () => api.get('/analytics/vehicle-profit'),
  getMonthlyProfit: (months = 12) => api.get('/analytics/monthly-profit', { params: { months } }),
  getExpenseBreakdown: () => api.get('/analytics/expense-breakdown'),
  getGstSummary: (months = 12) => api.get('/analytics/gst-summary', { params: { months } }),
  getPartyRevenue: () => api.get('/analytics/party-revenue'),
  getIdleAlerts: () => api.get('/analytics/idle-alerts'),
};

export default analyticsAPI;
