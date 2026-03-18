import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Building, Mail, Phone, MapPin, CreditCard, Save, Upload, ShieldCheck, Landmark, Hash, Globe, CheckCircle2 } from 'lucide-react'
import { tenantAPI } from '../lib/api'
import { cn } from '../lib/utils'

export default function Settings() {
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await tenantAPI.getMe()
      setTenant(res.data)
    } catch (error) {
      console.error('Failed to load enterprise profile:', error)
      // Initialize with default state if not found
      setTenant({
        companyName: 'New Protocol Identity',
        email: '',
        phone: '',
        address: '',
        gstNumber: '',
        panNumber: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        logoPath: null,
        createdAt: new Date().toISOString(),
        companyCode: 'SAMARTH-NEW'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await tenantAPI.updateMe(tenant)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Teletransmission failed:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-mesh">
      <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full shadow-2xl" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Protocol</span> Settings
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <SettingsIcon className="w-3 h-3 text-primary-500" /> Enterprise Configuration Hub
          </p>
        </div>
        {success && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> System Synchronized
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-dark-100 p-10 premium-shadow bg-mesh flex flex-col items-center text-center">
              <div className="relative group">
                 <div className="w-32 h-32 bg-dark-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl overflow-hidden ring-4 ring-dark-50 transition-all group-hover:ring-primary-100">
                    {tenant?.logoPath ? (
                      <img src={tenant.logoPath} alt="Enterprise Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-12 h-12 opacity-50" />
                    )}
                 </div>
                 <button className="absolute -bottom-2 -right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-xl hover:bg-primary-700 transition-all">
                    <Upload className="w-4 h-4" />
                 </button>
              </div>
              <h3 className="mt-8 text-2xl font-black text-dark-900 tracking-tight leading-none">{tenant?.companyName || 'Unknown Entity'}</h3>
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mt-2 italic shadow-sm bg-primary-50 px-3 py-1 rounded-full">EST. {new Date(tenant?.createdAt || new Date()).getFullYear()}</p>
              
              <div className="w-full mt-10 pt-10 border-t border-dark-50 space-y-4">
                 <SidebarStat icon={Globe} label="Enterprise ID" value={tenant?.companyCode || 'SAMARTH-01'} />
                 <SidebarStat icon={ShieldCheck} label="Fiscal Node" value={tenant?.gstNumber || 'NO_GST_FOUND'} />
              </div>
           </div>

           <div className="bg-dark-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                 <h4 className="text-xl font-black tracking-tight mb-2">Automated Billing Protocol</h4>
                 <p className="text-[10px] font-bold text-dark-300 uppercase tracking-widest leading-relaxed">System-generated invoices will utilize the organizational details defined in this terminal.</p>
              </div>
              <Landmark className="absolute -right-8 -bottom-8 w-32 h-32 text-dark-800 rotate-12 group-hover:scale-110 transition-transform duration-700" />
           </div>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] border border-dark-100 overflow-hidden premium-shadow bg-mesh shadow-2xl">
             <div className="p-10 border-b border-dark-100 glass-card">
                <h3 className="text-xl font-black text-dark-900 uppercase tracking-tighter">Organizational Identity</h3>
             </div>
             
             <div className="p-12 space-y-10">
                <section className="space-y-6">
                  <div className="flex items-center gap-4 text-dark-400 mb-2">
                     <Building className="w-4 h-4" />
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Core Specifications</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormGroup label="Identity Name" value={tenant.companyName} onChange={v => setTenant({...tenant, companyName: v})} required />
                    <FormGroup label="Professional Email" value={tenant.email} onChange={v => setTenant({...tenant, email: v})} icon={Mail} />
                    <FormGroup label="Tele-Comm Line" value={tenant.phone} onChange={v => setTenant({...tenant, phone: v})} icon={Phone} />
                    <FormGroup label="Regulatory (GST)" value={tenant.gstNumber} onChange={v => setTenant({...tenant, gstNumber: v})} icon={ShieldCheck} />
                    <FormGroup label="Fiscal ID (PAN)" value={tenant.panNumber} onChange={v => setTenant({...tenant, panNumber: v})} icon={CreditCard} />
                    <div className="md:col-span-2">
                       <FormGroup label="Logistics Hub Address" value={tenant.address} onChange={v => setTenant({...tenant, address: v})} icon={MapPin} full />
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-10 border-t border-dark-50">
                  <div className="flex items-center gap-4 text-dark-400 mb-2">
                     <Landmark className="w-4 h-4" />
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Banking Protocols (Invoice Generation)</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormGroup label="Financial Institution" value={tenant.bankName} onChange={v => setTenant({...tenant, bankName: v})} />
                    <FormGroup label="Vault Record (A/C)" value={tenant.accountNumber} onChange={v => setTenant({...tenant, accountNumber: v})} icon={Hash} />
                    <FormGroup label="Routing Code (IFSC)" value={tenant.ifscCode} onChange={v => setTenant({...tenant, ifscCode: v})} />
                  </div>
                </section>

                <div className="flex justify-end pt-8">
                   <button type="submit" disabled={saving} className={cn("btn-primary transition-all shadow-xl hover:shadow-primary-600/20 active:scale-95", saving && "opacity-50 pointer-events-none")}>
                      {saving ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <><Save className="w-5 h-5" /> Synchronize System</>
                      )}
                   </button>
                </div>
             </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function FormGroup({ label, value, onChange, icon: Icon, type = "text", required, full }) {
  return (
    <div className={cn("space-y-2", full && "w-full")}>
       <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">{label}</label>
       <div className="relative group">
          {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-200 group-focus-within:text-primary-500 transition-colors" />}
          <input 
            type={type} required={required} value={value || ''} onChange={e => onChange(e.target.value)}
            className={cn("interactive-field focus:ring-4 focus:ring-primary-500/5", Icon && "pl-12")}
            placeholder={`Protocol ${label}...`}
          />
       </div>
    </div>
  )
}

function SidebarStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-left group">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-dark-50 flex items-center justify-center border border-dark-100 group-hover:bg-primary-50 transition-colors">
             <Icon className="w-4 h-4 text-dark-400 group-hover:text-primary-600" />
          </div>
          <div>
             <p className="text-[9px] font-black text-dark-400 uppercase tracking-widest leading-none mb-1">{label}</p>
             <p className="text-xs font-black text-dark-900 tracking-tight">{value}</p>
          </div>
       </div>
    </div>
  )
}
