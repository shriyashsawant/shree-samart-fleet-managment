import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Shield, Mail, Trash2, Key, CheckCircle2, AlertCircle, X, ShieldAlert, Monitor, UserCheck, ShieldCheck } from 'lucide-react'
import { userAPI } from '../lib/api'
import { cn } from '../lib/utils'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'USER' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const res = await userAPI.getAll()
      setUsers(res.data)
    } catch (err) {
      console.error('Failed to load team:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await userAPI.create(newUser)
      setSuccess(`Protocol Activated: Welcome email dispatched to ${newUser.email}`)
      setShowAddModal(false)
      setNewUser({ username: '', email: '', password: '', role: 'USER' })
      loadUsers()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize new user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to terminate this user protocol?')) return
    try {
      await userAPI.delete(id)
      loadUsers()
    } catch (err) {
      console.error('Termination failed:', err)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full shadow-2xl" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Security</span> Personnel
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary-500" /> Command Access Hub
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary group shadow-xl hover:shadow-primary-600/20"
        >
          <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Authorize New Personnel
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} label="Active Personnel" value={users.length} color="primary" />
        <StatCard icon={ShieldCheck} label="Admin Nodes" value={users.filter(u => u.role === 'ADMIN').length} color="indigo" />
        <StatCard icon={Monitor} label="Standard Users" value={users.filter(u => u.role === 'USER').length} color="emerald" />
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-xs uppercase tracking-widest">
           <CheckCircle2 className="w-5 h-5" /> {success}
        </motion.div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-[2.5rem] border border-dark-100 overflow-hidden premium-shadow bg-mesh shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-900/5 backdrop-blur-xl border-b border-dark-100">
                <th className="px-8 py-6 text-[10px] font-black text-dark-500 uppercase tracking-[0.2em]">Personnel ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-dark-500 uppercase tracking-[0.2em]">Authorization Level</th>
                <th className="px-8 py-6 text-[10px] font-black text-dark-500 uppercase tracking-[0.2em]">Company</th>
                <th className="px-8 py-6 text-[10px] font-black text-dark-500 uppercase tracking-[0.2em]">Contact Node</th>
                <th className="px-8 py-6 text-[10px] font-black text-dark-500 uppercase tracking-[0.2em]">Joined</th>
                <th className="px-8 py-6 text-[10px] font-black text-dark-500 uppercase tracking-[0.2em]">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-primary-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-dark-900 flex items-center justify-center text-white font-black shadow-lg">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-black text-dark-900 tracking-tight">{user.username}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      user.role === 'ADMIN' ? "bg-indigo-100 text-indigo-600 border border-indigo-200" : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-dark-600 bg-dark-50 px-3 py-1 rounded-lg border border-dark-100">
                      {user.tenantName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-bold text-dark-500 text-xs lowercase tracking-tighter italic">
                    {user.email || 'NO_EMAIL_CONFIGURED'}
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-dark-400 font-outfit">
                    {new Date(user.createdAt || new Date()).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-3 text-dark-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-dark-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl border border-dark-100 premium-shadow bg-mesh">
              <div className="p-10 border-b border-dark-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-dark-900 uppercase tracking-tighter">New Personnel Protocol</h3>
                  <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1 italic">Initializing credentials for secure dispatch</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-dark-50 rounded-2xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-10 space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <AlertCircle className="w-5 h-5" /> {error}
                  </div>
                )}
                
                <div className="space-y-6">
                  <Input label="Protocol Username" value={newUser.username} onChange={v => setNewUser({...newUser, username: v})} required placeholder="Unique ID..." />
                  <Input label="Contact Email (Dispatch Notification)" value={newUser.email} onChange={v => setNewUser({...newUser, email: v})} icon={Mail} required type="email" placeholder="email@shreesamarth.com" />
                  <Input label="One-Time Login Password" value={newUser.password} onChange={v => setNewUser({...newUser, password: v})} icon={Key} required placeholder="Generate secure key..." />
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] ml-2 italic">Authorization Level</label>
                    <div className="grid grid-cols-2 gap-4">
                       <RoleOption active={newUser.role === 'USER'} onClick={() => setNewUser({...newUser, role: 'USER'})} icon={UserCheck} title="Standard User" desc="Operations Access" />
                       <RoleOption active={newUser.role === 'ADMIN'} onClick={() => setNewUser({...newUser, role: 'ADMIN'})} icon={ShieldAlert} title="Administrator" desc="Full System Control" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={submitting} className={cn("btn-primary w-full py-5 rounded-[1.5rem] shadow-xl", submitting && "opacity-50 select-none")}>
                    {submitting ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      "Authorize & Dispatch Welcome Email"
                    )}
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

function Input({ label, icon: Icon, value, onChange, placeholder, type = "text", required }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] ml-2 italic">{label}</label>
      <div className="relative group">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-200 group-focus-within:text-primary-500 transition-colors" />}
        <input 
          type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
          className={cn("interactive-field focus:ring-4 focus:ring-primary-100", Icon && "pl-12")}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

function RoleOption({ active, onClick, icon: Icon, title, desc }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex flex-col items-center p-6 rounded-3xl border-2 transition-all text-center", active ? "bg-primary-50 border-primary-500" : "bg-white border-dark-50 hover:border-dark-100")}>
       <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3 shadow-lg", active ? "bg-primary-600 text-white" : "bg-dark-900 text-white")}>
         <Icon className="w-5 h-5" />
       </div>
       <div className="font-black text-dark-900 text-xs tracking-tight">{title}</div>
       <div className="text-[9px] font-bold text-dark-400 uppercase tracking-widest mt-1 italic">{desc}</div>
    </button>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: "text-primary-600 bg-primary-50 border-primary-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100"
  }
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-dark-100 premium-shadow flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div className={cn("w-14 h-14 rounded-[1.2rem] flex items-center justify-center border shadow-xl", colors[color])}>
           <Icon className="w-6 h-6" />
        </div>
        <div>
           <p className="text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] mb-1 italic leading-none">{label}</p>
           <p className="text-3xl font-black text-dark-900 font-outfit tracking-tighter leading-none">{value}</p>
        </div>
      </div>
    </div>
  )
}
