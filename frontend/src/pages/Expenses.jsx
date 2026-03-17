import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Receipt, Edit, Trash2, Filter } from 'lucide-react'
import { expenseAPI, vehicleAPI } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const EXPENSE_TYPES = ['DIESEL', 'AIR', 'PUNCTURE', 'WASHING', 'FOOD', 'TOLL', 'OTHER']

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState({ vehicleId: '', expenseType: '' })

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    try {
      const [expensesRes, vehiclesRes] = await Promise.all([
        expenseAPI.getAll(filter.vehicleId ? { vehicleId: filter.vehicleId } : {}),
        vehicleAPI.getAll()
      ])
      setExpenses(expensesRes.data)
      setVehicles(vehiclesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this expense?')) {
      try {
        await expenseAPI.delete(id)
        loadData()
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Expenses</h1>
          <p className="text-dark-500 mt-1">Track daily vehicle expenses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/30">
          <Plus className="w-5 h-5" /> Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-100">Total Expenses</p>
            <p className="text-4xl font-bold mt-2">{formatCurrency(totalExpenses)}</p>
          </div>
          <Receipt className="w-16 h-16 text-white/30" />
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-4">
        <select value={filter.vehicleId} onChange={(e) => setFilter({ ...filter, vehicleId: e.target.value })} className="px-4 py-2 border border-dark-200 rounded-lg">
          <option value="">All Vehicles</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-50 border-b border-dark-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-dark-600">Date</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-dark-600">Vehicle</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-dark-600">Type</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-dark-600">Diesel by Client</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-dark-600">Amount</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-dark-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-dark-50">
                  <td className="px-6 py-4 text-dark-900">{formatDate(expense.date)}</td>
                  <td className="px-6 py-4 text-dark-900 font-medium">{expense.vehicle?.vehicleNumber || '-'}</td>
                  <td className="px-6 py-4 text-dark-600">{expense.expenseType}</td>
                  <td className="px-6 py-4">
                    {expense.dieselProvidedByClient ? (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Yes</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-dark-900">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(expense.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ExpenseModal vehicles={vehicles} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); loadData(); }} />}
    </div>
  )
}

function ExpenseModal({ vehicles, onClose, onSave }) {
  const [formData, setFormData] = useState({ vehicle: { id: '' }, expenseType: 'DIESEL', amount: '', date: new Date().toISOString().split('T')[0], dieselProvidedByClient: false, notes: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await expenseAPI.create(formData)
      onSave()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-dark-100"><h2 className="text-xl font-bold text-dark-900">Add Expense</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Vehicle</label>
            <select value={formData.vehicle.id} onChange={(e) => setFormData({ ...formData, vehicle: { id: e.target.value } })} className="w-full px-4 py-2 border border-dark-200 rounded-lg" required>
              <option value="">Select Vehicle</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Expense Type</label>
            <select value={formData.expenseType} onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg">
              {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Amount</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg" />
            </div>
          </div>
          {formData.expenseType === 'DIESEL' && (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.dieselProvidedByClient} onChange={(e) => setFormData({ ...formData, dieselProvidedByClient: e.target.checked })} className="w-4 h-4" />
              <label className="text-sm text-dark-700">Diesel provided by client</label>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 border border-dark-200 rounded-lg" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-dark-200 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Save</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
