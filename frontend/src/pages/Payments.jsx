import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CreditCard, Users, Truck, Wrench, Search, DollarSign, Calendar, Landmark, X } from 'lucide-react'
import { paymentAPI, driverAPI, vehicleAPI } from '../lib/api'
import { formatCurrency, formatDate, getStatusColor, cn } from '../lib/utils'

const PAYMENT_TYPES = ['SALARY', 'EMI', 'MAINTENANCE']

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [pRes, dRes, vRes] = await Promise.all([paymentAPI.getAll(), driverAPI.getAll(), vehicleAPI.getAll()])
      setPayments(pRes.data); setDrivers(dRes.data); setVehicles(vRes.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const stats = useMemo(() => {
    const total = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
    const activeCount = payments.length
    return { total, activeCount }
  }, [payments])

  const filteredPayments = useMemo(() => {
     return payments.filter(p => 
        p.paymentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vehicle?.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
     )
  }, [payments, searchTerm])

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            Fiscal <span className="text-gradient">Operations</span>
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2">Salary, EMI & Maintenance Lifecycle</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary"
        >
          <Plus className="w-5 h-5" /> Execute Payment
        </button>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <motion.div 
           initial={{ opacity: 0, y: 20 }} 
           animate={{ opacity: 1, y: 0 }} 
           className="bg-dark-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary-900/40 col-span-1 md:col-span-2"
         >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col justify-between h-full">
               <div>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                    <DollarSign className="w-6 h-6 text-primary-400" />
                  </div>
                  <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] mb-2 font-outfit">Consolidated Expenditure</p>
                  <h2 className="text-5xl font-black tracking-tight">{formatCurrency(stats.total)}</h2>
               </div>
               <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-dark-400">Transaction Pulse</span>
                  <span className="text-xs font-black text-emerald-400">{stats.activeCount} Processed Payments</span>
               </div>
            </div>
         </motion.div>

         <div className="space-y-6">
            <PaymentStatMini label="Operators" icon={Users} color="indigo" count={drivers.length} />
            <PaymentStatMini label="Asset Liens" icon={Landmark} color="amber" count={vehicles.length} />
         </div>
      </div>

      <div className="flex items-center justify-between gap-4">
         <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search by Entity or Type..." 
              className="interactive-field pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((p, i) => (
            <motion.div 
              key={p.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }} 
              className="bg-white rounded-[2rem] p-8 border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 bg-mesh relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                    p.paymentType === 'SALARY' ? "bg-indigo-600 shadow-indigo-200" :
                    p.paymentType === 'EMI' ? "bg-amber-600 shadow-amber-200" : "bg-emerald-600 shadow-emerald-200"
                  )}>
                    {p.paymentType === 'SALARY' ? <Users className="w-6 h-6" /> :
                     p.paymentType === 'EMI' ? <Landmark className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
                    p.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                  )}>
                    {p.status}
                  </span>
                </div>
                
                <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest leading-none mb-2">{p.paymentType}</p>
                <h3 className="text-xl font-black text-dark-900 tracking-tight mb-4">
                  {p.driver?.name || p.vehicle?.vehicleNumber || 'Consolidated'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-dark-50">
                   <div>
                      <p className="text-[9px] font-black text-dark-400 uppercase tracking-widest mb-1">Schedule</p>
                      <p className="text-xs font-black text-dark-800">{p.month || formatDate(p.paymentDate)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-dark-400 uppercase tracking-widest mb-1">Quantum</p>
                      <p className="text-sm font-black text-primary-600 tracking-tighter">{formatCurrency(p.amount)}</p>
                   </div>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                  <Landmark className="w-32 h-32" />
              </div>
            </motion.div>
          ))}
          {filteredPayments.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dark-100 italic font-bold text-dark-400 uppercase text-[10px] tracking-[0.2em]">
               No transactional pulse matched current filter criteria
            </div>
          )}
        </div>
      )}
      {showModal && <PaymentModal 
        drivers={drivers} 
        vehicles={vehicles} 
        onClose={() => setShowModal(false)} 
        onSave={() => { setShowModal(false); loadData(); }} 
      />}
    </div>
  )
}

function PaymentStatMini({ label, icon: Icon, color, count }) {
   const colors = {
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100"
   }
   return (
      <div className="bg-white rounded-[1.5rem] p-6 border border-dark-100 flex items-center justify-between group hover:shadow-lg transition-all">
         <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", colors[color])}>
               <Icon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest">{label}</p>
               <p className="text-sm font-black text-dark-900">{count} Active Units</p>
            </div>
         </div>
      </div>
   )
}

function PaymentModal({ drivers, vehicles, onClose, onSave }) {
  const [f, setF] = useState({ 
     paymentType: 'SALARY', 
     driver: { id: '' }, 
     vehicle: { id: '' }, 
     amount: '', 
     paymentDate: new Date().toISOString().split('T')[0], 
     month: '', 
     paymentMethod: 'CASH', 
     status: 'PAID' 
  })
  
  const handle = async (e) => {
    e.preventDefault()
    try { await paymentAPI.create(f); onSave() } catch (e) { console.error(e) }
  }
  
  return (
    <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] w-full max-w-md p-10 premium-shadow">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-black text-dark-900 tracking-tight uppercase">Initiate <span className="text-gradient">Ledger</span></h2>
           <button onClick={onClose} className="p-2 hover:bg-dark-50 rounded-xl transition-colors"><X className="w-5 h-5 text-dark-400" /></button>
        </div>
        
        <form onSubmit={handle} className="space-y-6">
          <div className="space-y-1">
             <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Payment Category</label>
             <select 
               value={f.paymentType} 
               onChange={(e) => setF({ ...f, paymentType: e.target.value })} 
               className="interactive-field w-full"
             >
               {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Assigned Entity</label>
             {f.paymentType === 'SALARY' ? (
                <select 
                  value={f.driver.id} 
                  onChange={(e) => setF({ ...f, driver: { id: e.target.value } })} 
                  className="interactive-field w-full"
                >
                  <option value="">Select Operator</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
             ) : (
                <select 
                  value={f.vehicle.id} 
                  onChange={(e) => setF({ ...f, vehicle: { id: e.target.value } })} 
                  className="interactive-field w-full"
                >
                  <option value="">Select Asset</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
                </select>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Quantum (₹)</label>
               <input 
                 type="number" 
                 placeholder="Amount" 
                 value={f.amount} 
                 onChange={(e) => setF({ ...f, amount: e.target.value })} 
                 className="interactive-field w-full" 
                 required 
               />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Cycle Date</label>
               <input 
                 type="date" 
                 value={f.paymentDate} 
                 onChange={(e) => setF({ ...f, paymentDate: e.target.value })} 
                 className="interactive-field w-full" 
               />
            </div>
          </div>

          {f.paymentType === 'SALARY' && (
             <div className="space-y-1">
               <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Fiscal Period</label>
               <input 
                 type="text" 
                 placeholder="e.g. June 2024" 
                 value={f.month} 
                 onChange={(e) => setF({ ...f, month: e.target.value })} 
                 className="interactive-field w-full" 
               />
             </div>
          )}

          <div className="flex gap-4 pt-4">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-dark-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-dark-50 transition-colors">Cancel</button>
             <button type="submit" className="flex-1 px-4 py-3 bg-dark-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-dark-900/20 hover:bg-primary-600 transition-colors">Commit Entry</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
