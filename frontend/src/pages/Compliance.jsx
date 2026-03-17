import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock,
  Download,
  Trash2,
  Filter,
  Truck
} from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

const API_URL = import.meta.env.VITE_API_URL || 'https://shree-samart-fleet-managment.onrender.com/api'

const complianceTypes = [
  { id: 'Road Tax', label: 'Road Tax (Monthly RTO Payment)', description: 'RTO Tax payment records' },
  { id: 'Fitness Certificate', label: 'Fitness Certificate (Vehicle Passing)', description: 'RTO Fitness inspection' },
  { id: 'Insurance', label: 'Insurance', description: 'Vehicle insurance policy' },
  { id: 'PUC', label: 'PUC (Pollution Certificate)', description: 'Environment compliance' },
  { id: 'Permit', label: 'Permit', description: 'Goods carriage permit' }
]

export default function Compliance() {
  const [compliance, setCompliance] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('All')

  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'Road Tax',
    issueDate: '',
    expiryDate: '',
    amount: '',
    remarks: ''
  })
  const [file, setFile] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [compRes, vehRes] = await Promise.all([
        axios.get(`${API_URL}/compliance`),
        axios.get(`${API_URL}/vehicles`)
      ])
      setCompliance(compRes.data)
      setVehicles(vehRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData()
    data.append('vehicleId', formData.vehicleId)
    data.append('type', formData.type)
    data.append('issueDate', formData.issueDate)
    data.append('expiryDate', formData.expiryDate)
    data.append('amount', formData.amount)
    data.append('remarks', formData.remarks)
    if (file) data.append('file', file)

    try {
      await axios.post(`${API_URL}/compliance`, data)
      setShowAddModal(false)
      fetchData()
      setFormData({
        vehicleId: '',
        type: 'Road Tax',
        issueDate: '',
        expiryDate: '',
        amount: '',
        remarks: ''
      })
      setFile(null)
    } catch (error) {
      alert('Error creating compliance record')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`${API_URL}/compliance/${id}`)
        fetchData()
      } catch (error) {
        console.error('Error deleting:', error)
      }
    }
  }

  const filteredCompliance = compliance.filter(item => {
    const matchesSearch = item.vehicle?.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'All' || item.type === selectedType
    return matchesSearch && matchesType
  })

  const getStatusColor = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'bg-red-500/10 text-red-500 border-red-500/20'
    if (diffDays < 15) return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }

  const stats = [
    { label: 'Total Records', value: compliance.length, icon: FileText, color: 'text-primary-500' },
    { label: 'Expiring Soon', value: compliance.filter(i => {
      const diff = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff < 15
    }).length, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Expired', value: compliance.filter(i => new Date(i.expiryDate) < new Date()).length, icon: Clock, color: 'text-red-500' },
    { label: 'Total Compliance Value', value: '₹' + compliance.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString(), icon: ShieldCheck, color: 'text-emerald-500' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Vehicle Compliance</h1>
          <p className="text-dark-500">Manage RTO taxes, fitness certificates, and legal documentation.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Compliance Record
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-dark-200 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-dark-50 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-dark-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-dark-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-dark-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search by vehicle number or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-50 border border-dark-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-dark-500 mr-1" />
          {['All', ...complianceTypes.map(t => t.id)].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedType === type
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white rounded-xl border border-dark-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-50 border-b border-dark-200">
                <th className="px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Vehicle</th>
                <th className="px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Compliance Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Issue Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Expiry Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-dark-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="h-16 bg-dark-50/50"></td>
                  </tr>
                ))
              ) : filteredCompliance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-dark-200" />
                      <p className="text-dark-500 font-medium">No compliance records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompliance.map((item) => (
                  <tr key={item.id} className="hover:bg-dark-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center">
                          <Truck className="w-4 h-4 text-primary-600" />
                        </div>
                        <span className="font-semibold text-dark-900">{item.vehicle?.vehicleNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-dark-900">
                          {complianceTypes.find(t => t.id === item.type)?.label || item.type}
                        </p>
                        <p className="text-xs text-dark-500">{item.remarks}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-600">
                      {item.issueDate ? format(new Date(item.issueDate), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-dark-900">
                      {format(new Date(item.expiryDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-dark-900">
                      ₹{item.amount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(item.expiryDate)}`}>
                        {new Date(item.expiryDate) < new Date() ? 'EXPIRED' : 
                         Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) < 15 ? 'EXPIRING SOON' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-dark-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between bg-dark-50">
                <h3 className="text-lg font-bold text-dark-900">Add Compliance Document</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-dark-200 rounded-full">
                  <Plus className="w-6 h-6 rotate-45 text-dark-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-dark-700 mb-1">Vehicle</label>
                    <select
                      required
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.vehicleNumber} - {v.model}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-dark-700 mb-1">Compliance Type</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      {complianceTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="Amount paid"
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Document File</label>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-dark-700 mb-1">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      placeholder="Optional notes..."
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 h-20 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-dark-200 text-dark-600 rounded-lg hover:bg-dark-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-lg shadow-primary-600/20"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
