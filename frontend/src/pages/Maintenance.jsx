import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Wrench, Calendar } from 'lucide-react'
import { maintenanceAPI, vehicleAPI } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

const MAINTENANCE_TYPES = ['OIL', 'GREASE', 'FILTER', 'TYRE', 'BATTERY', 'BRAKE', 'OTHER']

export default function Maintenance() {
  const [data, setData] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [mRes, vRes] = await Promise.all([maintenanceAPI.getAll(), vehicleAPI.getAll()])
      setData(mRes.data); setVehicles(vRes.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div><h1 className="text-2xl font-bold text-dark-900">Maintenance</h1><p className="text-dark-500">Track vehicle maintenance & service</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-600/30"><Plus className="w-5 h-5" />Add Maintenance</button>
      </div>
      
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <p className="text-blue-100">Total Maintenance Cost</p>
        <p className="text-4xl font-bold mt-2">{formatCurrency(data.reduce((s, m) => s + (parseFloat(m.cost) || 0), 0))}</p>
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
        <div className="grid gap-4">
          {data.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-4 rounded-xl border border-dark-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Wrench className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <p className="font-semibold text-dark-900">{item.maintenanceType}</p>
                  <p className="text-sm text-dark-500">{item.vehicle?.vehicleNumber} • {formatDate(item.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-dark-900">{formatCurrency(item.cost)}</p>
                {item.nextDueDate && <p className="text-xs text-dark-500 flex items-center gap-1 justify-end"><Calendar className="w-3 h-3" />Next: {formatDate(item.nextDueDate)}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {showModal && <MaintenanceModal vehicles={vehicles} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); loadData(); }} />}
    </div>
  )
}

function MaintenanceModal({ vehicles, onClose, onSave }) {
  const [f, setF] = useState({ vehicle: { id: '' }, maintenanceType: 'OIL', cost: '', date: new Date().toISOString().split('T')[0], nextDueDate: '', notes: '' })
  const handle = async (e) => {
    e.preventDefault()
    try { await maintenanceAPI.create(f); onSave() } catch (e) { console.error(e) }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Add Maintenance</h2>
        <form onSubmit={handle} className="space-y-4">
          <select value={f.vehicle.id} onChange={(e) => setF({ ...f, vehicle: { id: e.target.value } })} className="w-full p-2 border rounded-lg" required><option value="">Vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}</select>
          <select value={f.maintenanceType} onChange={(e) => setF({ ...f, maintenanceType: e.target.value })} className="w-full p-2 border rounded-lg">{MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Cost" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} className="p-2 border rounded-lg" required />
            <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="p-2 border rounded-lg" />
          </div>
          <input type="date" placeholder="Next Due" value={f.nextDueDate} onChange={(e) => setF({ ...f, nextDueDate: e.target.value })} className="w-full p-2 border rounded-lg" />
          <textarea placeholder="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="w-full p-2 border rounded-lg" rows={2} />
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 p-2 border rounded-lg">Cancel</button><button type="submit" className="flex-1 p-2 bg-primary-600 text-white rounded-lg">Save</button></div>
        </form>
      </motion.div>
    </div>
  )
}
