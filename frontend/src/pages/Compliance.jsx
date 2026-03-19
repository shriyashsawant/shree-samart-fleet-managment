import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Plus, Search, AlertTriangle, Calendar, FileText, CheckCircle2, Clock, Download, Trash2, Filter, Truck, ArrowUpRight, Shield, ExternalLink, X, FileSearch } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import api, { analyticsAPI, vehicleAPI } from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'https://shree-samart-fleet-managment.onrender.com/api'

const complianceTypes = [
  { id: 'RC Book', label: 'RC Book (Vehicle Registration)', description: 'Registration Certificate' },
  { id: 'Road Tax', label: 'Road Tax (Monthly RTO Payment)', description: 'RTO Tax payment records' },
  { id: 'Fitness Certificate', label: 'Fitness Certificate (Vehicle Passing)', description: 'RTO Fitness inspection' },
  { id: 'Insurance', label: 'Insurance', description: 'Vehicle insurance policy' },
  { id: 'PUC', label: 'PUC (Pollution Certificate)', description: 'Environment compliance' },
  { id: 'Permit', label: 'Permit / National Permit', description: 'Goods carriage permit' }
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

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [compRes, vehRes] = await Promise.all([
        api.get('/api/compliance'),
        vehicleAPI.getAll()
      ])
      setCompliance(compRes.data)
      setVehicles(vehRes.data)
    } catch (error) {
      console.error('Teletransmission failed:', error)
    } finally {
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
      await api.post('/api/compliance', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowAddModal(false)
      fetchData()
      setFormData({ vehicleId: '', type: 'Road Tax', issueDate: '', expiryDate: '', amount: '', remarks: '' })
      setFile(null)
    } catch (error) {
      alert('Security clearance failed for record creation.')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('AUTHORIZE PERMANENT DELETION of this compliance record?')) {
      try {
        await api.delete(`/api/compliance/${id}`)
        fetchData()
      } catch (error) {
        console.error('Authorization failed:', error)
      }
    }
  }

  const getStatus = (expiryDate) => {
    const diff = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: 'EXPIRED', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' }
    if (diff < 15) return { label: 'CRITICAL', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' }
    return { label: 'PROTECTED', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' }
  }

  const stats = [
    { label: 'Asset Protection', value: compliance.length, icon: Shield, color: 'text-primary-600' },
    { label: 'Critical Alert', value: compliance.filter(i => {
      const diff = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff < 15
    }).length, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Security Breach', value: compliance.filter(i => new Date(i.expiryDate) < new Date()).length, icon: Clock, color: 'text-rose-500' },
    { label: 'Operational Shield', value: '₹' + compliance.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString(), icon: ShieldCheck, color: 'text-emerald-500' }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Regulatory</span> Vault
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-primary-500" /> Enterprise Compliance Management
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Deposit Record
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2rem] border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 bg-mesh overflow-hidden relative"
          >
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg", stat.color.replace('text-', 'bg-').replace('500', '600').replace('600', '600'))}>
                   <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                   <p className="text-2xl font-black text-dark-900 tracking-tight">{stat.value}</p>
                </div>
             </div>
             <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon className="w-32 h-32" />
             </div>
          </motion.div>
        ))}
      </div>

      {/* Security Console (Filters) */}
      <div className="bg-white rounded-[2.5rem] border border-dark-100 p-8 premium-shadow bg-mesh flex flex-col md:flex-row gap-8 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within:text-primary-500 transition-colors" />
          <input type="text" placeholder="Search operational registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-dark-50/50 border border-dark-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest"
          />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto scrollbar-hide py-2">
          {['All', ...complianceTypes.map(t => t.id)].map(type => (
            <button key={type} onClick={() => setSelectedType(type)}
              className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                selectedType === type ? 'bg-dark-900 text-white shadow-xl' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance Grid (Digital Locker Feel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
             <div key={i} className="h-64 bg-dark-50 animate-pulse rounded-[2.5rem] border border-dark-100" />
          ))
        ) : compliance.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-dark-100 bg-mesh">
             <Shield className="w-16 h-16 text-dark-100 mx-auto mb-6" />
             <h3 className="text-xl font-black text-dark-900 uppercase tracking-tight">No Protected Records</h3>
             <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-2">Initialize security protocols by depositing the first record.</p>
          </div>
        ) : (
          compliance.filter(i => (selectedType === 'All' || i.type === selectedType) && i.vehicle?.vehicleNumber?.toUpperCase().includes(searchTerm.toUpperCase())).map((item, i) => {
            const status = getStatus(item.expiryDate)
            return (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 overflow-hidden bg-mesh active:scale-[0.98]"
              >
                 <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                             <Truck className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-dark-900 leading-none">{item.vehicle?.vehicleNumber}</h4>
                             <p className="text-[9px] font-bold text-dark-400 uppercase tracking-widest mt-1">{item.vehicle?.model}</p>
                          </div>
                       </div>
                       <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", status.color, status.bg, status.border)}>
                          {status.label}
                       </span>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Type Protocol</span>
                          <span className="text-xs font-black text-dark-700 uppercase tracking-tighter">{item.type}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Terminus Date</span>
                          <span className="text-xs font-black text-dark-900 underline decoration-primary-500/30 decoration-2 underline-offset-4">{format(new Date(item.expiryDate), 'dd MMM yyyy')}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Premium Value</span>
                          <span className="text-xs font-mono font-black text-dark-900 text-gradient">{formatCurrency(item.amount)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="px-8 py-6 bg-dark-50/50 mt-4 flex justify-between items-center group-hover:bg-primary-50 transition-colors border-t border-dark-100/50">
                    <div className="flex gap-2">
                       {item.filePath && (
                          <button className="p-2 bg-white rounded-lg border border-dark-100 text-dark-400 hover:text-primary-600 transition-colors shadow-sm">
                             <FileSearch className="w-4 h-4" />
                          </button>
                       )}
                       <button onClick={() => handleDelete(item.id)} className="p-2 bg-white rounded-lg border border-rose-100 text-rose-400 hover:text-rose-600 transition-colors shadow-sm">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 group/btn">
                       Access Dossier <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                 </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden premium-shadow"
            >
              <div className="p-8 border-b border-dark-100 flex items-center justify-between glass-card font-outfit">
                <div>
                  <h3 className="text-2xl font-black text-dark-900 tracking-tight uppercase">Deposit <span className="text-gradient">Protocol</span></h3>
                  <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Registry Compliance Entry</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-dark-100 rounded-full transition-colors"><X className="w-8 h-8 text-dark-200" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-mesh font-inter">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Target Asset</label>
                    <select required value={formData.vehicleId} onChange={(e) => setFormData({...formData, vehicleId: e.target.value})} className="interactive-field">
                      <option value="">Select Vehicle</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber} - {v.model}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Document Protocol</label>
                    <select required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="interactive-field">
                      {complianceTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <FormGroup label="Issuance Date" value={formData.issueDate} onChange={(v) => setFormData({...formData, issueDate: v})} type="date" />
                  <FormGroup label="Terminus Date" value={formData.expiryDate} onChange={(v) => setFormData({...formData, expiryDate: v})} type="date" required />
                  <FormGroup label="Registry Fee (₹)" value={formData.amount} onChange={(v) => setFormData({...formData, amount: v})} type="number" required />
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Digital Twin (File)</label>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-[10px] font-black uppercase text-dark-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-dark-100 file:text-dark-900 hover:file:bg-primary-50 transition-all cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Vault Annotations</label>
                  <textarea value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} placeholder="Log unique document serials or RTO context..." className="interactive-field resize-none h-24" />
                </div>
                <div className="flex gap-4 pt-6 mt-6 border-t border-dark-50">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Abort</button>
                  <button type="submit" className="btn-primary flex-1">Authorize Vault Deposit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FormGroup({ label, value, onChange, type = "text", required }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="interactive-field" placeholder={`Enter ${label}...`} />
    </div>
  )
}

function formatCurrency(val) {
   return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
}
