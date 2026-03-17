import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Disc, Edit, Trash2, Truck, Activity, Search, History, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { tyreAPI, vehicleAPI } from '../lib/api'
import { formatDate, cn } from '../lib/utils'

const TYRE_POSITIONS = [
  'Front Left', 'Front Right',
  'Rear Left Outer', 'Rear Left Inner',
  'Rear Right Outer', 'Rear Right Inner',
  'Stepney (Spare)'
]

const STATUSES = ['ACTIVE', 'RETREADED', 'SCRAPPED']

export default function Tyres() {
  const [tyres, setTyres] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTyre, setSelectedTyre] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [tyresRes, vehiclesRes] = await Promise.all([
        tyreAPI.getAll(),
        vehicleAPI.getAll()
      ])
      setTyres(tyresRes.data)
      setVehicles(vehiclesRes.data)
    } catch (error) {
      console.error('Teletransmission failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('AUTHORIZE DESTRUCTION of this tyre asset record?')) {
      try {
        await tyreAPI.delete(id)
        loadData()
      } catch (error) {
        console.error('Authorization failed:', error)
      }
    }
  }

  const filteredTyres = tyres.filter(t => 
    t.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.vehicle?.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Tyre</span> Intelligence
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Disc className="w-3 h-3 text-primary-500" /> Operational Friction Management
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Log Rubber Asset
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <SummaryCard label="Active Fleet Rubber" value={tyres.filter(t => t.status === 'ACTIVE').length} icon={Disc} color="text-primary-600" />
         <SummaryCard label="In-Process Retreads" value={tyres.filter(t => t.status === 'RETREADED').length} icon={History} color="text-amber-500" />
         <SummaryCard label="Decommissioned Assets" value={tyres.filter(t => t.status === 'SCRAPPED').length} icon={AlertCircle} color="text-rose-500" />
      </div>

      {/* Control Console */}
      <div className="bg-white rounded-[2.5rem] border border-dark-100 p-8 premium-shadow bg-mesh">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within:text-primary-500 transition-colors" />
          <input type="text" placeholder="Search by Serial ID or Unit Plate..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-dark-50/50 border border-dark-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-mesh rounded-[2.5rem] border border-dark-100">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full shadow-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTyres.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-dark-100 bg-mesh">
               <Disc className="w-16 h-16 text-dark-100 mx-auto mb-6" />
               <h3 className="text-xl font-black text-dark-900 uppercase tracking-tight">No Tracked Friction Assets</h3>
               <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-2">Initialize rubber tracking to monitor wear cycles and retread histories.</p>
            </div>
          ) : (
            filteredTyres.map((tyre, i) => (
              <motion.div key={tyre.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 overflow-hidden bg-mesh"
              >
                <div className="p-8">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-45 transition-transform duration-500">
                            <Disc className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-dark-900 leading-none">{tyre.serialNumber || 'SN_PENDING'}</h4>
                            <p className="text-[9px] font-bold text-dark-400 uppercase tracking-widest mt-1">{tyre.brand || 'Generic Compound'}</p>
                         </div>
                      </div>
                      <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", 
                        tyre.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        tyre.status === 'RETREADED' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {tyre.status}
                      </span>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest flex items-center gap-2"><Truck className="w-3 h-3" /> Unit Link</span>
                         <span className="text-xs font-black text-dark-900">{tyre.vehicle?.vehicleNumber || 'UNASSIGNED'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Position Hub</span>
                         <span className="text-[10px] font-black p-1 bg-dark-50 rounded border border-dark-100 text-dark-600 uppercase tracking-tight">{tyre.position || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Retread Cycle</span>
                         <span className="text-xs font-black text-primary-600">x{tyre.retreadCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Installation</span>
                         <span className="text-[10px] font-bold text-dark-500 uppercase italic">{tyre.installationDate ? formatDate(tyre.installationDate) : 'N/A'}</span>
                      </div>
                   </div>
                </div>

                <div className="px-8 py-6 bg-dark-50/50 flex justify-end gap-3 border-t border-dark-100/50 group-hover:bg-primary-50 transition-colors">
                   <button onClick={() => { setSelectedTyre(tyre); setShowModal(true); }} className="p-2 bg-white rounded-lg border border-dark-100 text-dark-400 hover:text-primary-600 transition-all shadow-sm"><Edit className="w-4 h-4" /></button>
                   <button onClick={() => handleDelete(tyre.id)} className="p-2 bg-white rounded-lg border border-rose-100 text-rose-400 hover:text-rose-600 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <TyreModal tyre={selectedTyre} vehicles={vehicles} onClose={() => { setShowModal(false); setSelectedTyre(null); }} onSave={() => { setShowModal(false); setSelectedTyre(null); loadData(); }} />
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-dark-100 premium-shadow bg-mesh overflow-hidden relative group">
       <div className="relative z-10">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg", color.replace('text-', 'bg-').replace('600', '600'))}>
             <Icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-3xl font-black text-dark-900 tracking-tighter leading-none">{value}</p>
       </div>
       <Icon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
    </div>
  )
}

function TyreModal({ tyre, vehicles, onClose, onSave }) {
  const [formData, setFormData] = useState({
    vehicleId: tyre?.vehicle?.id || '',
    serialNumber: tyre?.serialNumber || '',
    brand: tyre?.brand || '',
    position: tyre?.position || TYRE_POSITIONS[0],
    installationDate: tyre?.installationDate || new Date().toISOString().split('T')[0],
    installationOdometer: tyre?.installationOdometer || '',
    status: tyre?.status || 'ACTIVE',
    retreadCount: tyre?.retreadCount || 0
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData, vehicle: { id: formData.vehicleId } }
      if (tyre?.id) await tyreAPI.update(tyre.id, payload)
      else await tyreAPI.create(payload)
      onSave()
    } catch (error) {
      console.error('Teletransmission failed:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden flex flex-col premium-shadow">
        <div className="p-8 border-b border-dark-100 flex items-center justify-between glass-card font-outfit uppercase">
          <div>
            <h3 className="text-2xl font-black text-dark-900 tracking-tight">Rubber <span className="text-gradient">Asset</span> Entry</h3>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Vocational Friction Telemetry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-full transition-colors"><X className="w-8 h-8 text-dark-200" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-mesh font-inter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5 md:col-span-2">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Operational Carrier (Unit)</label>
               <select value={formData.vehicleId} onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })} className="interactive-field" required>
                 <option value="">Assign to Vehicle</option>
                 {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber} - {v.model}</option>)}
               </select>
            </div>
            
            <FormGroup label="Serial Number (Unique ID)" value={formData.serialNumber} onChange={(v) => setFormData({ ...formData, serialNumber: v })} required />
            <FormGroup label="Brand / Compound" value={formData.brand} onChange={(v) => setFormData({ ...formData, brand: v })} />
            
            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Hub Position</label>
               <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="interactive-field">
                 {TYRE_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Lifecycle Status</label>
               <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="interactive-field">
                 {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>

            <FormGroup label="Installation Date" value={formData.installationDate} onChange={(v) => setFormData({ ...formData, installationDate: v })} type="date" />
            <FormGroup label="Install Odometer (KM)" value={formData.installationOdometer} onChange={(v) => setFormData({ ...formData, installationOdometer: v })} type="number" />
            <FormGroup label="Retread Count" value={formData.retreadCount} onChange={(v) => setFormData({ ...formData, retreadCount: v })} type="number" />
          </div>

          <div className="flex gap-4 pt-6 mt-6 border-t border-dark-50">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Abort</button>
            <button type="submit" className="btn-primary flex-1">Authorize Log</button>
          </div>
        </form>
      </motion.div>
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
