import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Building2, Edit, Trash2, Phone, Mail } from 'lucide-react'
import { clientAPI } from '../lib/api'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await clientAPI.getAll()
      setClients(res.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this client?')) {
      try { await clientAPI.delete(id); loadData() } catch (e) { console.error(e) }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div><h1 className="text-2xl font-bold text-dark-900">Clients</h1><p className="text-dark-500">Manage party/client database for billing</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-600/30"><Plus className="w-5 h-5" />Add Client</button>
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl border border-dark-100 p-6 card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setSelected(c); setShowModal(true); }} className="p-2 hover:bg-dark-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <h3 className="font-bold text-dark-900 text-lg">{c.partyName}</h3>
              <p className="text-sm text-dark-500 font-mono mt-1">{c.gstNumber}</p>
              <div className="mt-4 pt-4 border-t border-dark-100 space-y-2">
                {c.phone && <p className="flex items-center gap-2 text-sm text-dark-600"><Phone className="w-4 h-4" />{c.phone}</p>}
                {c.email && <p className="flex items-center gap-2 text-sm text-dark-600"><Mail className="w-4 h-4" />{c.email}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {showModal && <ClientModal client={selected} onClose={() => { setShowModal(false); setSelected(null); }} onSave={() => { setShowModal(false); setSelected(null); loadData(); }} />}
    </div>
  )
}

function ClientModal({ client, onClose, onSave }) {
  const [f, setF] = useState({ partyName: client?.partyName || '', gstNumber: client?.gstNumber || '', phone: client?.phone || '', email: client?.email || '', address: client?.address || '' })
  const handle = async (e) => {
    e.preventDefault()
    try {
      if (client?.id) await clientAPI.update(client.id, f)
      else await clientAPI.create(f)
      onSave()
    } catch (e) { console.error(e) }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">{client ? 'Edit Client' : 'Add Client'}</h2>
        <form onSubmit={handle} className="space-y-4">
          <input type="text" placeholder="Party Name" value={f.partyName} onChange={(e) => setF({ ...f, partyName: e.target.value })} className="w-full p-2 border rounded-lg" required />
          <input type="text" placeholder="GST Number" value={f.gstNumber} onChange={(e) => setF({ ...f, gstNumber: e.target.value })} className="w-full p-2 border rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="p-2 border rounded-lg" />
            <input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="p-2 border rounded-lg" />
          </div>
          <textarea placeholder="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="w-full p-2 border rounded-lg" rows={2} />
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 p-2 border rounded-lg">Cancel</button><button type="submit" className="flex-1 p-2 bg-primary-600 text-white rounded-lg">Save</button></div>
        </form>
      </motion.div>
    </div>
  )
}
