import axios from 'axios'

const API_URL = '/api'

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
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}

// Vehicle APIs
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  getStats: () => api.get('/vehicles/stats'),
  getDocuments: (id) => api.get(`/vehicles/${id}/documents`),
  uploadDocument: (id, formData) => api.post(`/vehicles/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// Vehicle Log APIs
export const vehicleLogAPI = {
  getByVehicle: (vehicleId) => api.get(`/vehicle-logs/vehicle/${vehicleId}`),
  getByVehicleAndType: (vehicleId, logType) => api.get(`/vehicle-logs/vehicle/${vehicleId}/type/${logType}`),
  create: (data) => api.post('/vehicle-logs', data),
  update: (id, data) => api.put(`/vehicle-logs/${id}`, data),
  delete: (id) => api.delete(`/vehicle-logs/${id}`),
}

// Driver APIs
export const driverAPI = {
  getAll: () => api.get('/drivers'),
  getById: (id) => api.get(`/drivers/${id}`),
  getByVehicle: (vehicleId) => api.get(`/drivers/vehicle/${vehicleId}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
}

// Expense APIs
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
}

// Maintenance APIs
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
}

// Payment APIs
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
}

// Client APIs
export const clientAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
}

// Bill APIs
export const billAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
}

// Reminder APIs
export const reminderAPI = {
  getAll: (params) => api.get('/reminders', { params }),
  getPending: () => api.get('/reminders/pending'),
  complete: (id) => api.put(`/reminders/${id}/complete`),
  delete: (id) => api.delete(`/reminders/${id}`),
}

// OCR APIs
export const ocrAPI = {
  extractInvoice: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/ocr/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  healthCheck: () => api.get('/ocr/health'),
}

export default api
