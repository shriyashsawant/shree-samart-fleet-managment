import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, CreditCard } from 'lucide-react'
import { paymentAPI, driverAPI, vehicleAPI } from '../lib/api'
import { formatCurrency, formatDate, getStatusColor, cn } from '../lib/utils'

const PAYMENT_TYPES = ['SALARY', 'EMI', 'MAINTENANCE']

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [pRes, dRes, vRes] = await Promise.all([paymentAPI.getAll(), driverAPI.getAll(), vehicleAPI.getAll()])
      setPayments(pRes.data); setDrivers(dRes.data); setVehicles(vRes.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const total = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div><h1 className="text-2xl font-bold text-dark-900">Payments</h1><p className="text-dark-500">Track salary, EMI & maintenance payments</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-600/30"><Plus className="w-5 h-5" />Add Payment</button>
      </div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl p-6 text-white">
        <p className="text-violet-100">Total Payments</p>
        <p className="text-4xl font-bold mt-2">{formatCurrency(total)}</p>
      </motion.div>

      {loading ? <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
        <div className="grid gap-4">
          {payments.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-4 rounded-xl border border-dark-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6 text-violet-600" /></div>
                <div>
                  <p className="font-semibold text-dark-900">{p.paymentType}</p>
                  <p className="text-sm text-dark-500">{p.driver?.name || p.vehicle?.vehicleNumber || '-'} • {p.month || formatDate(p.paymentDate)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-dark-900">{formatCurrency(p.amount)}</p>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(p.status))}>{p.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {showModal && <PaymentModal drivers={drivers} vehicles={vehicles} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); loadData(); }} />}
    </div>
  )
}

function PaymentModal({ drivers, vehicles, onClose, onSave }) {
  const [f, setF] = useState({ paymentType: 'SALARY', driver: { id: '' }, vehicle: { id: '' }, amount: '', paymentDate: new Date().toISOString().split('T')[0], month: '', paymentMethod: 'CASH', status: 'PAID' })
  const handle = async (e) => {
    e.preventDefault()
    try { await paymentAPI.create(f); onSave() } catch (e) { console.error(e) }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Add Payment</h2>
        <form onSubmit={handle} className="space-y-4">
          <select value={f.paymentType} onChange={(e) => setF({ ...f, paymentType: e.target.value })} className="w-full p-2 border rounded-lg">{PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          {f.paymentType === 'SALARY' ? <select value={f.driver.id} onChange={(e) => setF({ ...f, driver: { id: e.target.value } })} className="w-full p-2 border rounded-lg"><option value="">Select Driver</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select> : <select value={f.vehicle.id} onChange={(e) => setF({ ...f, vehicle: { id: e.target.value } })} className="w-full p-2 border rounded-lg"><option value="">Select Vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}</select>}
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="p-2 border rounded-lg" required />
            <input type="date" value={f.paymentDate} onChange={(e) => setF({ ...f, paymentDate: e.target.value })} className="p-2 border rounded-lg" />
          </div>
          {f.paymentType === 'SALARY' && <input type="text" placeholder="Month (e.g. Jan 2025)" value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })} className="w-full p-2 border rounded-lg" />}
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 p-2 border rounded-lg">Cancel</button><button type="submit" className="flex-1 p-2 bg-primary-600 text-white rounded-lg">Save</button></div>
        </form>
      </motion.div>
    </div>
  )
}
