import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Building2, Edit, Trash2, Phone, Mail, MapPin, Hash, ExternalLink, Globe } from 'lucide-react'
import { clientAPI } from '../lib/api'
import { cn } from '../lib/utils'

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
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to terminate this partner record?')) {
      try {
        await clientAPI.delete(id)
        loadData()
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase"><span className="text-gradient">Partner</span> Ecosystem</h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-1">Enterprise Party Database</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" /> Expand Network
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-mesh rounded-[2.5rem] border border-dark-100">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full shadow-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clients.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[2rem] overflow-hidden border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 flex flex-col h-full bg-mesh"
            >
              <div className="p-8 flex-1">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 bg-dark-900 rounded-2xl flex items-center justify-center text-white ring-4 ring-dark-50 shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button onClick={() => { setSelected(c); setShowModal(true); }} className="p-2 hover:bg-dark-100 rounded-xl text-dark-600 transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                   <h3 className="text-xl font-black text-dark-900 tracking-tight leading-tight">{c.partyName}</h3>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-black tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase">TAX_ID</span>
                      <p className="text-xs font-bold text-dark-400 font-mono">{c.gstNumber || 'UNREGISTERED'}</p>
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-dark-100/50 space-y-4">
                  <ContactItem icon={Phone} text={c.phone || 'NO_CONTACT'} />
                  <ContactItem icon={Mail} text={c.email || 'NO_EMAIL'} />
                  <ContactItem icon={MapPin} text={c.address?.slice(0, 35) + '...' || 'NO_ADDRESS'} />
                </div>
              </div>
              
              <div className="px-8 py-4 bg-dark-50/50 flex justify-between items-center group-hover:bg-primary-50 transition-colors">
                <span className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Active Partner</span>
                <button className="text-primary-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  View Dossier <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <ClientModal
          client={selected}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={() => { setShowModal(false); setSelected(null); loadData(); }}
        />
      )}
    </div>
  )
}

function ContactItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-dark-100 shadow-sm transition-colors group-hover:border-primary-200">
        <Icon className="w-3.5 h-3.5 text-dark-400 group-hover:text-primary-500" />
      </div>
      <span className="text-xs font-bold text-dark-600 truncate">{text}</span>
    </div>
  )
}

function ClientModal({ client, onClose, onSave }) {
  const [f, setF] = useState({
    partyName: client?.partyName || '',
    gstNumber: client?.gstNumber || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.address || ''
  })

  const handle = async (e) => {
    e.preventDefault()
    try {
      if (client?.id) await clientAPI.update(client.id, f)
      else await clientAPI.create(f)
      onSave()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden flex flex-col premium-shadow">
        <div className="p-8 border-b border-dark-100 glass-card">
          <h2 className="text-2xl font-black text-dark-900 tracking-tight">{client ? 'Modify' : 'Onboard'} <span className="text-gradient">Partner</span></h2>
          <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Enterprise Entity Management</p>
        </div>
        
        <form onSubmit={handle} className="p-10 space-y-6 bg-mesh">
          <FormGroup label="Entity Name" value={f.partyName} onChange={(v) => setF({ ...f, partyName: v })} required />
          <FormGroup label="GST Identification Number" value={f.gstNumber} onChange={(v) => setF({ ...f, gstNumber: v })} />
          
          <div className="grid grid-cols-2 gap-6">
            <FormGroup label="Mobile Contact" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
            <FormGroup label="Electronic Mail" value={f.email} onChange={(v) => setF({ ...f, email: v })} type="email" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Registered Office Address</label>
            <textarea value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="interactive-field resize-none h-24" />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-dark-50">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary px-8">Authorize Record</button>
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
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="interactive-field" 
        placeholder={`Enter ${label}...`}
        required={required}
      />
    </div>
  )
}
