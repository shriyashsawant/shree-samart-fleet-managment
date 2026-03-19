import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Receipt, Edit, Trash2, Filter, Fuel, Wrench, DollarSign, Search, X, Truck, Activity } from 'lucide-react'
import { expenseAPI, vehicleAPI } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const EXPENSE_CATEGORIES = ['OPERATIONAL', 'MAINTENANCE', 'TYRE', 'DRIVER_ADVANCE']
const EXPENSE_TYPES = {
  OPERATIONAL: ['DIESEL', 'AIR', 'PUNCTURE', 'WASHING', 'FOOD', 'TOLL', 'OTHER'],
  MAINTENANCE: ['OIL', 'GREASE', 'FILTER', 'BATTERY', 'BRAKE', 'CLUTCH', 'ENGINE', 'OTHER'],
  TYRE: ['TYRE_PURCHASE', 'TYRE_REPAIR', 'TYRE_REPLACEMENT', 'WHEEL_ALIGNMENT', 'OTHER'],
  DRIVER_ADVANCE: ['ADVANCE', 'SETTLEMENT', 'OTHER'],
}

const CATEGORY_COLORS = {
  OPERATIONAL: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  MAINTENANCE: 'bg-amber-50 text-amber-600 border-amber-100',
  TYRE: 'bg-slate-50 text-slate-600 border-slate-100',
  DRIVER_ADVANCE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [filter, setFilter] = useState({ vehicleId: '', expenseType: '', category: '' })

  useEffect(() => { loadData() }, [filter])

  const loadData = async () => {
    try {
      const params = {}
      if (filter.vehicleId) params.vehicleId = filter.vehicleId
      if (filter.expenseType) params.expenseType = filter.expenseType
      if (filter.category) params.category = filter.category
      const [expensesRes, vehiclesRes] = await Promise.all([
        expenseAPI.getAll(params),
        vehicleAPI.getAll()
      ])
      setExpenses(expensesRes.data)
      setVehicles(vehiclesRes.data)
    } catch (error) {
      console.error('Failed to load operational burn data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Authorize deletion of this operational expense record?')) {
      try {
        await expenseAPI.delete(id)
        loadData()
      } catch (error) {
        console.error('Authorization failed:', error)
      }
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 font-inter">
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Burn</span> Rate
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-amber-500" /> Operational Expenditure Log
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Log Expenditure
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-1 bg-dark-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-amber-900/20 bg-mesh">
           <div className="relative z-10">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] font-outfit mb-2">Total Operational Burn</p>
              <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(totalExpenses)}</h2>
              <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-dark-300">Tracking Active</span>
                 </div>
                 <Receipt className="w-10 h-10 text-white/10" />
              </div>
           </div>
        </motion.div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-dark-100 p-10 premium-shadow bg-mesh flex flex-col justify-between">
           <div>
              <h3 className="text-xl font-black text-dark-900 uppercase tracking-tight mb-6">Filter Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Target Unit</label>
                   <select value={filter.vehicleId} onChange={(e) => setFilter({ ...filter, vehicleId: e.target.value })} className="interactive-field">
                     <option value="">Full Fleet</option>
                     {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Category</label>
                   <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value, expenseType: '' })} className="interactive-field">
                     <option value="">All Categories</option>
                     {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Type</label>
                   <select value={filter.expenseType} onChange={(e) => setFilter({ ...filter, expenseType: e.target.value })} className="interactive-field" disabled={!filter.category}>
                     <option value="">All Types</option>
                     {(EXPENSE_TYPES[filter.category] || []).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                   </select>
                </div>
              </div>
           </div>
           <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-8 flex items-center gap-2">
               <Search className="w-3 h-3" /> Refining {expenses.length} transaction records
           </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-mesh rounded-[2.5rem] border border-dark-100">
          <div className="animate-spin w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full shadow-2xl" />
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-dark-100 overflow-hidden premium-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-dark-50 border-b border-dark-100">
                  <th className="px-10 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest">Date</th>
                  <th className="px-10 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest">Unit</th>
                  <th className="px-10 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest">Category</th>
                  <th className="px-10 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest">Type</th>
                  <th className="px-10 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest text-center">Telemetry</th>
                  <th className="px-10 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-10 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-20 text-center">
                       <Receipt className="w-16 h-16 text-dark-100 mx-auto mb-4" />
                       <p className="font-black text-[10px] text-dark-300 uppercase tracking-widest">No Expenditures Detected</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="group hover:bg-dark-50/50 transition-all duration-300">
                      <td className="px-10 py-6 text-sm font-bold text-dark-900">{formatDate(expense.date)}</td>
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-dark-100 flex items-center justify-center text-[10px] font-black text-dark-900 shadow-sm">
                               {expense.vehicle?.vehicleNumber?.slice(-4)}
                            </div>
                            <span className="text-xs font-black uppercase text-dark-900">{expense.vehicle?.vehicleNumber}</span>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                           CATEGORY_COLORS[expense.category] || "bg-dark-50 text-dark-500 border-dark-100"
                         )}>
                           {(expense.category || 'OPERATIONAL').replace('_', ' ')}
                         </span>
                      </td>
                      <td className="px-10 py-6">
                         <span className="px-3 py-1 rounded-full text-[10px] font-bold text-dark-500 bg-dark-50 border border-dark-100">
                           {expense.expenseType}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-center">
                         {expense.expenseType === 'DIESEL' ? (
                           <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold text-dark-500">{expense.fuelQuantity || '-'} LTRS</span>
                           </div>
                         ) : <span className="text-[10px] font-bold text-dark-300 italic">N/A</span>}
                      </td>
                      <td className="px-10 py-6 text-right font-black text-dark-900">{formatCurrency(expense.amount)}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => { setSelectedExpense(expense); setShowModal(true); }} className="p-2 hover:bg-white rounded-xl shadow-sm border border-dark-100 transition-all"><Edit className="w-4 h-4 text-dark-400" /></button>
                           <button onClick={() => handleDelete(expense.id)} className="p-2 hover:bg-rose-50 rounded-xl shadow-sm border border-rose-100 transition-all"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <ExpenseModal
          expense={selectedExpense}
          vehicles={vehicles}
          onClose={() => { setShowModal(false); setSelectedExpense(null); }}
          onSave={() => { setShowModal(false); setSelectedExpense(null); loadData(); }}
        />
      )}
    </div>
  )
}

function ExpenseModal({ expense, vehicles, onClose, onSave }) {
  const [formData, setFormData] = useState({
    vehicle: { id: expense?.vehicle?.id || '' },
    category: expense?.category || 'OPERATIONAL',
    expenseType: expense?.expenseType || 'DIESEL',
    amount: expense?.amount || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    dieselProvidedByClient: expense?.dieselProvidedByClient || false,
    fuelQuantity: expense?.fuelQuantity || '',
    fuelRate: expense?.fuelRate || '',
    odometerReading: expense?.odometerReading || '',
    notes: expense?.notes || ''
  })

  useEffect(() => {
    const types = EXPENSE_TYPES[formData.category] || []
    if (!types.includes(formData.expenseType)) {
      setFormData(f => ({ ...f, expenseType: types[0] || '' }))
    }
  }, [formData.category])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (expense?.id) await expenseAPI.update(expense.id, formData)
      else await expenseAPI.create(formData)
      onSave()
    } catch (error) {
      console.error('Teletransmission failed:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden flex flex-col premium-shadow">
        <div className="p-8 border-b border-dark-100 glass-card flex items-center justify-between font-outfit">
          <div>
            <h2 className="text-2xl font-black text-dark-900 tracking-tight">{expense ? 'Modify' : 'Log'} <span className="text-gradient">Expenditure</span></h2>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Operational Transaction Hub</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-full transition-colors"><X className="w-8 h-8 text-dark-200" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto bg-mesh font-inter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Target Unit</label>
               <select value={formData.vehicle.id} onChange={(e) => setFormData({ ...formData, vehicle: { id: e.target.value } })} className="interactive-field" required>
                 <option value="">Assign Vehicle</option>
                 {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Category</label>
               <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="interactive-field">
                 {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Type</label>
               <select value={formData.expenseType} onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })} className="interactive-field">
                 {(EXPENSE_TYPES[formData.category] || []).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
               </select>
            </div>

            <FormGroup label="Expenditure Amount" value={formData.amount} onChange={(v) => setFormData({ ...formData, amount: v })} type="number" required />
            <FormGroup label="Transaction Date" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} type="date" required />

            {formData.category === 'OPERATIONAL' && formData.expenseType === 'DIESEL' && (
              <div className="col-span-2 p-6 bg-dark-50 rounded-3xl border border-dark-100 space-y-6">
                 <div className="flex items-center gap-2 mb-4">
                    <Fuel className="w-4 h-4 text-primary-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-dark-900">Vocational Fuel Telemetry</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormGroup label="Fuel Vol. (Ltrs)" value={formData.fuelQuantity} onChange={(v) => setFormData({ ...formData, fuelQuantity: v })} type="number" />
                    <FormGroup label="Rate per Ltr" value={formData.fuelRate} onChange={(v) => setFormData({ ...formData, fuelRate: v })} type="number" />
                    <FormGroup label="Odometer Reading" value={formData.odometerReading} onChange={(v) => setFormData({ ...formData, odometerReading: v })} type="number" />
                 </div>
                 <div className="flex items-center gap-3 pt-4 border-t border-dark-100/50">
                    <input type="checkbox" checked={formData.dieselProvidedByClient} onChange={(e) => setFormData({ ...formData, dieselProvidedByClient: e.target.checked })} className="w-5 h-5 rounded-lg border-dark-200 text-primary-600 focus:ring-primary-500/20 transition-all" />
                    <label className="text-xs font-bold text-dark-700 uppercase tracking-tight">External Supply (Client Provided Diesel)</label>
                 </div>
              </div>
            )}

            {formData.category === 'MAINTENANCE' && (
              <div className="col-span-2 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-center gap-4">
                <Wrench className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Maintenance Expense</p>
                  <p className="text-xs font-bold text-amber-600">Type: {formData.expenseType}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Audit Intelligence (Notes)</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="interactive-field resize-none h-24" placeholder="Detail any operational anomalies or specific transaction context..." />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-dark-50">
            <button type="button" onClick={onClose} className="btn-secondary">Dismiss</button>
            <button type="submit" className="btn-primary px-10">Authorize Log</button>
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
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="interactive-field" required={required} placeholder={`Enter ${label}...`} />
    </div>
  )
}
