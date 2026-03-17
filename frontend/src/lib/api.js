import axios from 'axios'

const API_URL = 'https://shree-samart-fleet-managment.onrender.com'

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

export default api
