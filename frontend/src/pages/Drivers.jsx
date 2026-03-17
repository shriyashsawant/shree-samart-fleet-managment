import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, Edit, Trash2, Phone, Calendar, CreditCard } from 'lucide-react'
import { driverAPI, vehicleAPI } from '../lib/api'
import { formatCurrency, formatDate, cn, getStatusColor } from '../lib/utils'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        driverAPI.getAll(),
        vehicleAPI.getAll()
      ])
      setDrivers(driversRes.data)
      setVehicles(vehiclesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        await driverAPI.delete(id)
        loadData()
      } catch (error) {
        console.error('Failed to delete driver:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Drivers</h1>
          <p className="text-dark-500 mt-1">Manage driver profiles and assignments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
        >
          <Plus className="w-5 h-5" />
          Add Driver
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden card-hover group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark-900">{driver.name}</h3>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(driver.status))}>
                        {driver.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelectedDriver(driver); setShowModal(true); }} className="p-2 hover:bg-dark-100 rounded-lg">
                      <Edit className="w-4 h-4 text-dark-600" />
                    </button>
                    <button onClick={() => handleDelete(driver.id)} className="p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-dark-600">
                    <Phone className="w-4 h-4" />
                    {driver.phone || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dark-600">
                    <CreditCard className="w-4 h-4" />
                    License: {driver.drivingLicense || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dark-600">
                    <Calendar className="w-4 h-4" />
                    Expiry: {formatDate(driver.licenseExpiry)}
                  </div>
                  <div className="pt-3 border-t border-dark-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-dark-500">Salary</span>
                      <span className="font-semibold text-primary-600">{formatCurrency(driver.salary)}</span>
                    </div>
                    {driver.assignedVehicle && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-dark-500">Vehicle</span>
                        <span className="font-medium text-dark-900">{driver.assignedVehicle.vehicleNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <DriverModal
          driver={selectedDriver}
          vehicles={vehicles}
          onClose={() => { setShowModal(false); setSelectedDriver(null); }}
          onSave={() => { setShowModal(false); setSelectedDriver(null); loadData(); }}
        />
      )}
    </div>
  )
}

function DriverModal({ driver, vehicles, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    address: driver?.address || '',
    aadhaarNumber: driver?.aadhaarNumber || '',
    drivingLicense: driver?.drivingLicense || '',
    licenseExpiry: driver?.licenseExpiry || '',
    salary: driver?.salary || '',
    joiningDate: driver?.joiningDate || '',
    endDate: driver?.endDate || '',
    assignedVehicleId: driver?.assignedVehicle?.id || '',
    status: driver?.status || 'ACTIVE',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData, salary: parseFloat(formData.salary) || 0 }
      if (driver?.id) {
        await driverAPI.update(driver.id, data)
      } else {
        await driverAPI.create(data)
      }
      onSave()
    } catch (error) {
      console.error('Failed to save driver:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-dark-100">
          <h2 className="text-xl font-bold text-dark-900">{driver ? 'Edit Driver' : 'Add New Driver'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Phone</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Aadhaar Number</label>
              <input type="text" value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Driving License</label>
              <input type="text" value={formData.drivingLicense} onChange={(e) => setFormData({ ...formData, drivingLicense: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">License Expiry</label>
              <input type="date" value={formData.licenseExpiry} onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Salary</label>
              <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Joining Date</label>
              <input type="date" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Assigned Vehicle</label>
              <select value={formData.assignedVehicleId} onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="ACTIVE">Active</option>
                <option value="LEFT">Left</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Address</label>
            <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-dark-200 rounded-lg hover:bg-dark-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Driver</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
