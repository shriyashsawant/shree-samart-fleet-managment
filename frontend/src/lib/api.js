import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
}

// Analytics & Reporting APIs
export const analyticsAPI = {
  getVehicleProfit: () => api.get('/api/analytics/vehicle-profit'),
  getMonthlyProfit: (months) => api.get('/api/analytics/monthly-profit', { params: { months } }),
  getExpenseBreakdown: () => api.get('/api/analytics/expense-breakdown'),
  getGstSummary: (months) => api.get('/api/analytics/gst-summary', { params: { months } }),
  getPartyRevenue: () => api.get('/api/analytics/party-revenue'),
  getIdleAlerts: () => api.get('/api/analytics/idle-alerts'),
  getVehicleSummaryList: () => api.get('/api/analytics/vehicles/summary'),
  getVehicleProfile: (id) => api.get(`/api/analytics/vehicles/${id}/profile`),
  getDocumentHealth: (id) => api.get(`/api/analytics/vehicles/${id}/document-health`),
  getVehicleProfitByMonth: (id, month) => api.get(`/api/analytics/vehicles/${id}/profit`, { params: { month } }),
}

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
}

// Vehicle APIs
export const vehicleAPI = {
  getAll: () => api.get('/api/vehicles'),
  getById: (id) => api.get(`/api/vehicles/${id}`),
  create: (data) => api.post('/api/vehicles', data),
  update: (id, data) => api.put(`/api/vehicles/${id}`, data),
  delete: (id) => api.delete(`/api/vehicles/${id}`),
  getStats: () => api.get('/api/vehicles/stats'),
  getDocuments: (id) => api.get(`/api/vehicles/${id}/documents`),
  uploadDocument: (id, formData) => api.post(`/api/vehicles/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// Vehicle Log APIs
export const vehicleLogAPI = {
  getByVehicle: (vehicleId) => api.get(`/api/vehicle-logs/vehicle/${vehicleId}`),
  getByVehicleAndType: (vehicleId, logType) => api.get(`/api/vehicle-logs/vehicle/${vehicleId}/type/${logType}`),
  create: (data) => api.post('/api/vehicle-logs', data),
  update: (id, data) => api.put(`/api/vehicle-logs/${id}`, data),
  delete: (id) => api.delete(`/api/vehicle-logs/${id}`),
}

// Driver APIs
export const driverAPI = {
  getAll: () => api.get('/api/drivers'),
  getById: (id) => api.get(`/api/drivers/${id}`),
  getByVehicle: (vehicleId) => api.get(`/api/drivers/vehicle/${vehicleId}`),
  create: (data) => api.post('/api/drivers', data),
  update: (id, data) => api.put(`/api/drivers/${id}`, data),
  delete: (id) => api.delete(`/api/drivers/${id}`),
}

// Expense APIs
export const expenseAPI = {
  getAll: (params) => api.get('/api/expenses', { params }),
  getById: (id) => api.get(`/api/expenses/${id}`),
  create: (data) => api.post('/api/expenses', data),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
}

// Maintenance APIs
export const maintenanceAPI = {
  getAll: (params) => api.get('/api/maintenance', { params }),
  getById: (id) => api.get(`/api/maintenance/${id}`),
  create: (data) => api.post('/api/maintenance', data),
  update: (id, data) => api.put(`/api/maintenance/${id}`, data),
  delete: (id) => api.delete(`/api/maintenance/${id}`),
}

// Payment APIs
export const paymentAPI = {
  getAll: (params) => api.get('/api/payments', { params }),
  getById: (id) => api.get(`/api/payments/${id}`),
  create: (data) => api.post('/api/payments', data),
  update: (id, data) => api.put(`/api/payments/${id}`, data),
  delete: (id) => api.delete(`/api/payments/${id}`),
}

// Client APIs
export const clientAPI = {
  getAll: () => api.get('/api/clients'),
  getById: (id) => api.get(`/api/clients/${id}`),
  create: (data) => api.post('/api/clients', data),
  update: (id, data) => api.put(`/api/clients/${id}`, data),
  delete: (id) => api.delete(`/api/clients/${id}`),
}

// Bill APIs
export const billAPI = {
  getAll: (params) => api.get('/api/bills', { params }),
  getById: (id) => api.get(`/api/bills/${id}`),
  create: (data) => api.post('/api/bills', data),
  update: (id, data) => api.put(`/api/bills/${id}`, data),
  delete: (id) => api.delete(`/api/bills/${id}`),
}

// Reminder APIs
export const reminderAPI = {
  getAll: (params) => api.get('/api/reminders', { params }),
  getPending: () => api.get('/api/reminders/pending'),
  complete: (id) => api.put(`/api/reminders/${id}/complete`),
  delete: (id) => api.delete(`/api/reminders/${id}`),
}

// Compliance APIs
export const complianceAPI = {
  getAll: () => api.get('/api/compliance'),
  getByVehicle: (id) => api.get(`/api/compliance/vehicle/${id}`),
  create: (formData) => api.post('/api/compliance', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/api/compliance/${id}`, data),
  delete: (id) => api.delete(`/api/compliance/${id}`),
}

// Attendance APIs
export const attendanceAPI = {
  getAll: (date) => api.get('/api/attendance', { params: { date } }),
  getByDriver: (driverId, startDate, endDate) => 
    api.get(`/api/attendance/driver/${driverId}`, { params: { startDate, endDate } }),
  mark: (data) => api.post('/api/attendance/mark', data),
  delete: (id) => api.delete(`/api/attendance/${id}`)
}

export const tyreAPI = {
  getAll: () => api.get('/api/tyres'),
  getByVehicle: (vehicleId) => api.get(`/api/tyres/vehicle/${vehicleId}`),
  create: (data) => api.post('/api/tyres', data),
  update: (id, data) => api.put(`/api/tyres/${id}`, data),
  delete: (id) => api.delete(`/api/tyres/${id}`)
}

export const advanceAPI = {
  getAll: () => api.get('/api/advances'),
  getPending: () => api.get('/api/advances/pending'),
  getByDriver: (driverId) => api.get(`/api/advances/driver/${driverId}`),
  create: (data) => api.post('/api/advances', data),
  settle: (id) => api.post(`/api/advances/${id}/settle`),
  delete: (id) => api.delete(`/api/advances/${id}`)
}

export const inventoryAPI = {
  getAll: () => api.get('/api/inventory'),
  getLowStock: () => api.get('/api/inventory/low-stock'),
  create: (data) => api.post('/api/inventory', data),
  update: (id, data) => api.put(`/api/inventory/${id}`, data),
  adjustStock: (id, quantity) => api.post(`/api/inventory/${id}/stock?quantity=${quantity}`),
  delete: (id) => api.delete(`/api/inventory/${id}`)
}

// Trip APIs
export const tripAPI = {
  getAll: () => api.get('/api/trips'),
  getById: (id) => api.get(`/api/trips/${id}`),
  getByVehicle: (vehicleId) => api.get(`/api/trips/vehicle/${vehicleId}`),
  getByDriver: (driverId) => api.get(`/api/trips/driver/${driverId}`),
  getByClient: (clientId) => api.get(`/api/trips/client/${clientId}`),
  create: (data) => api.post('/api/trips', data),
  update: (id, data) => api.put(`/api/trips/${id}`, data),
  delete: (id) => api.delete(`/api/trips/${id}`),
}

// OCR APIs
export const ocrAPI = {
  extractInvoice: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/ocr/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  healthCheck: () => api.get('/api/ocr/health'),
}

export const tenantAPI = {
  getMe: () => api.get('/api/tenant/me'),
  updateMe: (data) => api.put('/api/tenant/me', data),
  updateLogo: (logoPath) => api.post('/api/tenant/me/logo', { logoPath }),
}

export const userAPI = {
  getAll: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  delete: (id) => api.delete(`/api/users/${id}`),
}

export default api

export const driverDocumentAPI = {
  getByDriver: (id) => api.get(`/api/driver-documents/driver/${id}`),
  upload: (data) => api.post('/api/driver-documents', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/api/driver-documents/${id}`)
}

export const tyreLogAPI = {
  getByTyre: (id) => api.get(`/api/tyre-logs/tyre/${id}`),
  create: (data) => api.post('/api/tyre-logs', data),
  delete: (id) => api.delete(`/api/tyre-logs/${id}`)
}
