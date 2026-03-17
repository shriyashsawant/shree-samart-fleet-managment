import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Truck, MoreVertical, Edit, Trash2, Eye, FileText, Wrench, Activity, Fuel, AlertTriangle, ClipboardList } from 'lucide-react'
import { vehicleAPI, vehicleLogAPI } from '../lib/api'
import { formatCurrency, formatDate, cn, getStatusColor } from '../lib/utils'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    underMaintenance: 0,
    avgFuelEconomy: 0
  })
  const [vehicleLogs, setVehicleLogs] = useState([])
  const [selectedLogVehicle, setSelectedLogVehicle] = useState(null)

  useEffect(() => {
    loadVehicles()
    loadStats()
  }, [])

  const loadVehicles = async () => {
    try {
      const response = await vehicleAPI.getAll()
      setVehicles(response.data)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await vehicleAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadVehicleLogs = async (vehicleId) => {
    try {
      const response = await vehicleLogAPI.getByVehicle(vehicleId)
      setVehicleLogs(response.data)
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehicleAPI.delete(id)
        loadVehicles()
        loadStats()
      } catch (error) {
        console.error('Failed to delete vehicle:', error)
      }
    }
  }

  const openLogModal = (vehicle) => {
    setSelectedLogVehicle(vehicle)
    loadVehicleLogs(vehicle.id)
    setShowLogModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Vehicles</h1>
          <p className="text-dark-500 mt-1">Manage your cement mixer fleet</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-dark-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Total Vehicles</p>
              <p className="text-2xl font-bold text-dark-900">{stats.totalVehicles}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-dark-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Active Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeVehicles}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-dark-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Under Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">{stats.underMaintenance}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-dark-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Avg Fuel Economy</p>
              <p className="text-2xl font-bold text-dark-900">{stats.avgFuelEconomy || 0} <span className="text-sm">km/L</span></p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Fuel className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vehicle Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden card-hover group"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-dark-800 to-dark-700 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{vehicle.vehicleNumber}</h3>
                      <p className="text-dark-300 text-sm">{vehicle.model}</p>
                    </div>
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(vehicle.status))}>
                    {vehicle.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-dark-500">Insurance</p>
                    <p className="font-medium text-dark-900">{vehicle.insuranceCompany || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Expiry</p>
                    <p className="font-medium text-dark-900">{formatDate(vehicle.insuranceExpiry)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Monthly EMI</p>
                    <p className="font-medium text-primary-600">{formatCurrency(vehicle.emiAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Fuel Economy</p>
                    <p className="font-medium text-dark-900">{vehicle.fuelEconomy || '-'} km/L</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="pt-4 border-t border-dark-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-dark-500">Chassis</p>
                      <p className="text-sm font-medium text-dark-700 truncate max-w-[100px]">{vehicle.chassisNumber?.slice(-6) || '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-dark-500">Engine</p>
                      <p className="text-sm font-medium text-dark-700 truncate max-w-[100px]">{vehicle.engineNumber?.slice(-6) || '-'}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openLogModal(vehicle)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Vehicle Logs"
                    >
                      <ClipboardList className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => { setSelectedVehicle(vehicle); setShowModal(true); }}
                      className="p-2 hover:bg-dark-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-dark-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      {showModal && (
        <VehicleModal
          vehicle={selectedVehicle}
          onClose={() => { setShowModal(false); setSelectedVehicle(null); }}
          onSave={() => { setShowModal(false); setSelectedVehicle(null); loadVehicles(); loadStats(); }}
        />
      )}

      {/* Vehicle Log Modal */}
      {showLogModal && selectedLogVehicle && (
        <VehicleLogModal
          vehicle={selectedLogVehicle}
          logs={vehicleLogs}
          onClose={() => { setShowLogModal(false); setSelectedLogVehicle(null); }}
          onSave={() => loadVehicleLogs(selectedLogVehicle.id)}
        />
      )}
    </div>
  )
}

function VehicleModal({ vehicle, onClose, onSave }) {
  const [formData, setFormData] = useState({
    vehicleNumber: vehicle?.vehicleNumber || '',
    model: vehicle?.model || '',
    purchaseDate: vehicle?.purchaseDate || '',
    chassisNumber: vehicle?.chassisNumber || '',
    engineNumber: vehicle?.engineNumber || '',
    insuranceCompany: vehicle?.insuranceCompany || '',
    insuranceExpiry: vehicle?.insuranceExpiry || '',
    emiAmount: vehicle?.emiAmount || '',
    emiBank: vehicle?.emiBank || '',
    emiStartDate: vehicle?.emiStartDate || '',
    emiEndDate: vehicle?.emiEndDate || '',
    fuelEconomy: vehicle?.fuelEconomy || '',
    status: vehicle?.status || 'ACTIVE',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { 
        ...formData, 
        emiAmount: parseFloat(formData.emiAmount) || 0,
        fuelEconomy: parseFloat(formData.fuelEconomy) || 0
      }
      if (vehicle?.id) {
        await vehicleAPI.update(vehicle.id, data)
      } else {
        await vehicleAPI.create(data)
      }
      onSave()
    } catch (error) {
      console.error('Failed to save vehicle:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-dark-100">
          <h2 className="text-xl font-bold text-dark-900">{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Chassis Number</label>
              <input
                type="text"
                value={formData.chassisNumber}
                onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Engine Number</label>
              <input
                type="text"
                value={formData.engineNumber}
                onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ACTIVE">Active</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Fuel Economy (km/L)</label>
              <input
                type="number"
                step="0.01"
                value={formData.fuelEconomy}
                onChange={(e) => setFormData({ ...formData, fuelEconomy: e.target.value })}
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 4.5"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-dark-100">
            <h3 className="font-semibold text-dark-900 mb-4">Insurance Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Insurance Company</label>
                <input
                  type="text"
                  value={formData.insuranceCompany}
                  onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Insurance Expiry</label>
                <input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-100">
            <h3 className="font-semibold text-dark-900 mb-4">EMI Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Monthly EMI</label>
                <input
                  type="number"
                  value={formData.emiAmount}
                  onChange={(e) => setFormData({ ...formData, emiAmount: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Bank</label>
                <input
                  type="text"
                  value={formData.emiBank}
                  onChange={(e) => setFormData({ ...formData, emiBank: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">EMI Start Date</label>
                <input
                  type="date"
                  value={formData.emiStartDate}
                  onChange={(e) => setFormData({ ...formData, emiStartDate: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">EMI End Date</label>
                <input
                  type="date"
                  value={formData.emiEndDate}
                  onChange={(e) => setFormData({ ...formData, emiEndDate: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-dark-200 rounded-lg hover:bg-dark-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Save Vehicle
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function VehicleLogModal({ vehicle, logs, onClose, onSave }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    logType: 'REPAIR',
    description: '',
    cost: '',
    serviceCenter: '',
    mechanicName: '',
    partsReplaced: '',
    nextDueDate: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        vehicleId: vehicle.id,
        logDate: new Date().toISOString().split('T')[0],
        ...formData,
        cost: parseFloat(formData.cost) || 0
      }
      await vehicleLogAPI.create(data)
      setShowAddForm(false)
      setFormData({
        logType: 'REPAIR',
        description: '',
        cost: '',
        serviceCenter: '',
        mechanicName: '',
        partsReplaced: '',
        nextDueDate: '',
        notes: ''
      })
      onSave()
    } catch (error) {
      console.error('Failed to save log:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this log?')) {
      try {
        await vehicleLogAPI.delete(id)
        onSave()
      } catch (error) {
        console.error('Failed to delete log:', error)
      }
    }
  }

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'REPAIR': return 'bg-blue-100 text-blue-700'
      case 'ACCIDENT': return 'bg-red-100 text-red-700'
      case 'INSPECTION': return 'bg-green-100 text-green-700'
      case 'BREAKDOWN': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getLogTypeIcon = (type) => {
    switch (type) {
      case 'REPAIR': return <Wrench className="w-4 h-4" />
      case 'ACCIDENT': return <AlertTriangle className="w-4 h-4" />
      case 'INSPECTION': return <Activity className="w-4 h-4" />
      case 'BREAKDOWN': return <AlertTriangle className="w-4 h-4" />
      default: return <ClipboardList className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-dark-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-dark-900">Vehicle Logs - {vehicle.vehicleNumber}</h2>
            <p className="text-sm text-dark-500">Repair, Accident, and Service History</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Log
          </button>
        </div>

        {/* Add Log Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-6 border-b border-dark-100 bg-blue-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Log Type</label>
                <select
                  value={formData.logType}
                  onChange={(e) => setFormData({ ...formData, logType: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="REPAIR">Repair</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="INSPECTION">Inspection</option>
                  <option value="BREAKDOWN">Breakdown</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Cost (₹)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the work done..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Service Center</label>
                <input
                  type="text"
                  value={formData.serviceCenter}
                  onChange={(e) => setFormData({ ...formData, serviceCenter: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Mechanic Name</label>
                <input
                  type="text"
                  value={formData.mechanicName}
                  onChange={(e) => setFormData({ ...formData, mechanicName: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-dark-700 mb-1">Parts Replaced</label>
                <input
                  type="text"
                  value={formData.partsReplaced}
                  onChange={(e) => setFormData({ ...formData, partsReplaced: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="List any parts replaced..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Save Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-dark-200 rounded-lg hover:bg-dark-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Logs List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-dark-300 mx-auto mb-2" />
              <p className="text-dark-500">No logs recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border border-dark-100 rounded-lg p-4 hover:bg-dark-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", getLogTypeColor(log.logType))}>
                        {getLogTypeIcon(log.logType)}
                      </div>
                      <div>
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", getLogTypeColor(log.logType))}>
                          {log.logType}
                        </span>
                        <p className="font-medium text-dark-900 mt-1">{log.description || 'No description'}</p>
                        <p className="text-sm text-dark-500">{formatDate(log.logDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {log.cost > 0 && (
                        <p className="font-bold text-primary-600">{formatCurrency(log.cost)}</p>
                      )}
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {(log.serviceCenter || log.mechanicName || log.partsReplaced) && (
                    <div className="mt-3 pt-3 border-t border-dark-100 text-sm text-dark-600">
                      {log.serviceCenter && <span className="mr-4">🏢 {log.serviceCenter}</span>}
                      {log.mechanicName && <span className="mr-4">👨‍🔧 {log.mechanicName}</span>}
                      {log.partsReplaced && <span className="mr-4">🔧 {log.partsReplaced}</span>}
                    </div>
                  )}
                  {log.nextDueDate && (
                    <div className="mt-2 text-sm text-orange-600">
                      Next due: {formatDate(log.nextDueDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dark-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-dark-200 rounded-lg hover:bg-dark-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
