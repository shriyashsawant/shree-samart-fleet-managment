import axios from 'axios';

const API_URL = 'https://shree-samart-fleet-managment.onrender.com/api';
const ANALYTICS_URL = `${API_URL}/analytics`;
const BILLS_URL = `${API_URL}/bills`;

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export const analyticsAPI = {
  // Vehicle P&L Report
  getVehicleProfit: () => axios.get(`${ANALYTICS_URL}/vehicle-profit`, getAuthHeader()),
  
  // Monthly Profit Trend
  getMonthlyProfit: (months = 12) => axios.get(`${ANALYTICS_URL}/monthly-profit?months=${months}`, getAuthHeader()),
  
  // Expense Breakdown
  getExpenseBreakdown: () => axios.get(`${ANALYTICS_URL}/expense-breakdown`, getAuthHeader()),
  
  // GST Summary
  getGstSummary: (months = 12) => axios.get(`${ANALYTICS_URL}/gst-summary?months=${months}`, getAuthHeader()),
  
  // Party Revenue
  getPartyRevenue: () => axios.get(`${ANALYTICS_URL}/party-revenue`, getAuthHeader()),
  
  // Idle Alerts
  getIdleAlerts: () => axios.get(`${ANALYTICS_URL}/idle-alerts`, getAuthHeader()),

  // Vehicle Profit by Month (P&L Engine)
  getVehicleProfitByMonth: (vehicleId, month) => 
    axios.get(`${ANALYTICS_URL}/vehicles/${vehicleId}/profit?month=${month}`, getAuthHeader()),
  
  // Document Health Score
  getDocumentHealth: (vehicleId) => 
    axios.get(`${ANALYTICS_URL}/vehicles/${vehicleId}/document-health`, getAuthHeader()),
};

export const billAPI = {
  // GST Monthly Export (CSV)
  exportGstMonthly: (month) => 
    axios.get(`${BILLS_URL}/reports/gst-monthly?month=${month}`, {
      ...getAuthHeader(),
      responseType: 'blob',
    }),
};
