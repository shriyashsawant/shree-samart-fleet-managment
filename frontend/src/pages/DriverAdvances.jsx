import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, DollarSign, Edit, Trash2, Users, Activity, Search, History, CheckCircle2, X, Wallet, ArrowRightLeft, CreditCard, Calendar } from 'lucide-react'
import { advanceAPI, driverAPI } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const PURPOSES = ['Fuel', 'Toll', 'Food', 'Maintenance', 'Personal', 'Other']

export default function DriverAdvances() {
  const [advances, setAdvances] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedAdvance, setSelectedAdvance] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [advRes, driversRes] = await Promise.all([
        advanceAPI.getAll(),
        driverAPI.getAll()
      ])
      setAdvances(advRes.data)
      setDrivers(driversRes.data)
    } catch (error) {
      console.error('Teletransmission failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('AUTHORIZE DELETION of this financial advance record?')) {
      try {
        await advanceAPI.delete(id)
        loadData()
      } catch (error) {
        console.error('Authorization failed:', error)
      }
    }
  }

  const handleSettle = async (id) => {
    if (confirm('Authorize SETTLEMENT of this cash advance?')) {
      try {
        await advanceAPI.settle(id)
        loadData()
      } catch (error) {
        console.error('Settlement authorization failed:', error)
      }
    }
  }

  const filteredAdvances = advances.filter(a => 
    a.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingAmount = advances.filter(a => !a.isSettled).reduce((sum, a) => sum + (a.amount || 0), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Cash</span> Advances
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Wallet className="w-3 h-3 text-emerald-500" /> Personnel Liquidity Log
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Issue Advance
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <SummaryCard label="Total Disbursed" value={formatCurrency(advances.reduce((s, a) => s + (a.amount || 0), 0))} icon={DollarSign} color="text-primary-600" />
         <SummaryCard label="Pending Settlement" value={formatCurrency(pendingAmount)} icon={Activity} color="text-amber-500" highlight />
         <SummaryCard label="Completed Audits" value={advances.filter(a => a.isSettled).length} icon={CheckCircle2} color="text-emerald-500" />
      </div>

      {/* Control Console */}
      <div className="bg-white rounded-[2.5rem] border border-dark-100 p-8 premium-shadow bg-mesh">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within:text-primary-500 transition-colors" />
          <input type="text" placeholder="Search by Driver Name or Purpose..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-dark-50/50 border border-dark-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-mesh rounded-[2.5rem] border border-dark-100">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full shadow-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAdvances.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-dark-100 bg-mesh">
               <Wallet className="w-16 h-16 text-dark-100 mx-auto mb-6" />
               <h3 className="text-xl font-black text-dark-900 uppercase tracking-tight">No Financial Advances</h3>
               <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-2">Initialize personnel liquidity tracking to monitor hand loans and trip settlements.</p>
            </div>
          ) : (
            filteredAdvances.reverse().map((advance, i) => (
              <motion.div key={advance.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 overflow-hidden bg-mesh"
              >
                <div className="p-8">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Users className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-dark-900 leading-none">{advance.driver?.name}</h4>
                            <p className="text-[9px] font-bold text-dark-400 uppercase tracking-widest mt-1">{formatDate(advance.advanceDate)}</p>
                         </div>
                      </div>
                      <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", 
                        advance.isSettled ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {advance.isSettled ? 'SETTLED' : 'PENDING'}
                      </span>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Purpose</span>
                         <span className="text-xs font-black text-dark-700 uppercase tracking-tighter">{advance.purpose || 'General'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Issued Amount</span>
                         <span className="text-xl font-black text-dark-900 text-gradient leading-none">{formatCurrency(advance.amount)}</span>
                      </div>
                      {advance.isSettled && (
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-dark-300 uppercase tracking-widest">Settled At</span>
                           <span className="text-[10px] font-bold text-emerald-600 italic">{formatDate(advance.settlementDate)}</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="px-8 py-6 bg-dark-50/50 flex justify-between items-center border-t border-dark-100/50 group-hover:bg-primary-50 transition-colors">
                   {!advance.isSettled && (
                     <button onClick={() => handleSettle(advance.id)} className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 group/btn">
                        Finalize Settlement <ArrowRightLeft className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" />
                     </button>
                   )}
                   <div className="flex gap-2 ml-auto">
                      <button onClick={() => handleDelete(advance.id)} className="p-2 bg-white rounded-lg border border-rose-100 text-rose-400 hover:text-rose-600 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <AdvanceModal advance={selectedAdvance} drivers={drivers} onClose={() => { setShowModal(false); setSelectedAdvance(null); }} onSave={() => { setShowModal(false); setSelectedAdvance(null); loadData(); }} />
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color, highlight }) {
  return (
    <div className={cn("bg-white p-8 rounded-[2.5rem] border border-dark-100 premium-shadow bg-mesh overflow-hidden relative group", highlight && "ring-2 ring-amber-500/20")}>
       <div className="relative z-10">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg", color.replace('text-', 'bg-').replace('600', '600').replace('500', '500'))}>
             <Icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-3xl font-black text-dark-900 tracking-tighter leading-none">{value}</p>
       </div>
       <Icon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
    </div>
  )
}

function AdvanceModal({ advance, drivers, onClose, onSave }) {
  const [formData, setFormData] = useState({
    driverId: advance?.driver?.id || '',
    amount: advance?.amount || '',
    advanceDate: advance?.advanceDate || new Date().toISOString().split('T')[0],
    purpose: advance?.purpose || PURPOSES[0],
    notes: advance?.notes || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData, driver: { id: formData.driverId } }
      if (advance?.id) await advanceAPI.update(advance.id, payload)
      else await advanceAPI.create(payload)
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
            <h3 className="text-2xl font-black text-dark-900 tracking-tight">Financial <span className="text-gradient">Disbursement</span></h3>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Personnel Liquidity Entry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-full transition-colors"><X className="w-8 h-8 text-dark-200" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-mesh font-inter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5 md:col-span-2">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Target Operator (Driver)</label>
               <select value={formData.driverId} onChange={(e) => setFormData({ ...formData, driverId: e.target.value })} className="interactive-field" required>
                 <option value="">Select Operator</option>
                 {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
               </select>
            </div>
            
            <FormGroup label="Advance Amount (₹)" value={formData.amount} onChange={(v) => setFormData({ ...formData, amount: v })} type="number" required />
            <FormGroup label="Issuance Date" value={formData.advanceDate} onChange={(v) => setFormData({ ...formData, advanceDate: v })} type="date" required />
            
            <div className="space-y-1.5 md:col-span-2">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Vocational Purpose</label>
               <select value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="interactive-field">
                 {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Audit intelligence (Notes)</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Log specific trip context or toll locations..." className="interactive-field resize-none h-24" />
          </div>

          <div className="flex gap-4 pt-6 mt-6 border-t border-dark-50">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Abort</button>
            <button type="submit" className="btn-primary flex-1">Authorize Disbursement</button>
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
