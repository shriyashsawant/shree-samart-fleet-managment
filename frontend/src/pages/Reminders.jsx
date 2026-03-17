import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { reminderAPI } from '../lib/api'
import { formatDate, cn, getDaysRemaining } from '../lib/utils'

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')

  useEffect(() => { loadData() }, [filter])

  const loadData = async () => {
    try {
      const res = await reminderAPI.getAll({ status: filter })
      setReminders(res.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleComplete = async (id) => {
    try {
      await reminderAPI.complete(id)
      loadData()
    } catch (e) { console.error(e) }
  }

  const getUrgency = (days) => {
    if (days < 0) return { color: 'bg-red-500', text: 'text-red-600', label: 'Overdue' }
    if (days <= 7) return { color: 'bg-red-500', text: 'text-red-600', label: 'Urgent' }
    if (days <= 30) return { color: 'bg-amber-500', text: 'text-amber-600', label: 'Upcoming' }
    return { color: 'bg-emerald-500', text: 'text-emerald-600', label: 'OK' }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-dark-900">Reminders</h1><p className="text-dark-500">Never miss important renewals</p></div>
        <div className="flex gap-2">
          {['PENDING', 'COMPLETED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={cn("px-4 py-2 rounded-lg font-medium transition-colors", filter === s ? "bg-primary-600 text-white" : "bg-dark-100 text-dark-600 hover:bg-dark-200")}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="text-center py-12 text-dark-500"><CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" /><p>No {filter.toLowerCase()} reminders</p></div>
          ) : (
            reminders.map((r, i) => {
              const days = getDaysRemaining(r.expiryDate)
              const urgency = getUrgency(days)
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={cn("bg-white rounded-xl border p-4 flex items-center justify-between", r.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50' : 'border-dark-100')}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", urgency.color, r.status === 'COMPLETED' && 'bg-emerald-500')}>
                      {r.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6 text-white" /> : <AlertTriangle className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-dark-900">{r.title}</p>
                      <p className="text-sm text-dark-500">{r.description} • Due: {formatDate(r.expiryDate)}</p>
                      {r.status === 'PENDING' && <span className={cn("text-xs font-medium", urgency.text)}>{days < 0 ? Math.abs(days) + ' days overdue' : days + ' days left'}</span>}
                    </div>
                  </div>
                  {r.status === 'PENDING' && <button onClick={() => handleComplete(r.id)} className="px-4 py-2 bg-primary-100 text-primary-600 rounded-lg font-medium hover:bg-primary-200">Mark Done</button>}
                </motion.div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
