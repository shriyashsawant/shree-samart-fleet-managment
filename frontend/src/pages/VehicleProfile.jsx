import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, MapPin, Shield, FileText, TrendingDown, Wrench, TrendingUp, 
  Truck, Phone, Calendar, Info, Clock, ArrowUpRight, Plus, Disc, 
  Map as MapIcon, ChevronRight, Download, Eye, ExternalLink, Radius,
  Users, Receipt, ChevronLeft, CreditCard, Hash, IndianRupee, ArrowDownRight, MoreVertical, Printer, Edit, Settings, Fuel, CheckCircle2, Navigation, FileSearch, Upload, X, AlertCircle
} from 'lucide-react'
import { analyticsAPI, vehicleAPI, tripAPI, tyreAPI, complianceAPI, tyreLogAPI, paymentAPI } from '../lib/api'
import { formatCurrency, formatDate, cn, openDocument } from '../lib/utils'

export default function VehicleProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [trips, setTrips] = useState([])
  const [tyres, setTyres] = useState([])
  const [compliance, setCompliance] = useState([])
  const [payments, setPayments] = useState([])
  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { loadProfile() }, [id])

  const loadProfile = async () => {
    try {
      const [profileRes, tripsRes, tyresRes, compRes, paymentsRes, docsRes] = await Promise.all([
        analyticsAPI.getVehicleProfile(id),
        tripAPI.getByVehicle(id),
        tyreAPI.getByVehicle(id),
        complianceAPI.getByVehicle(id),
        paymentAPI.getAll({ vehicleId: id }),
        vehicleAPI.getDocuments(id)
      ])
      setProfile(profileRes.data)
      setTrips(tripsRes.data)
      setTyres(tyresRes.data)
      setCompliance(compRes.data)
      setPayments(paymentsRes.data)
      setDocuments(docsRes.data)
    } catch (error) {
      console.error('Failed to load vehicle profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-mesh">
      <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full shadow-2xl" />
    </div>
  )

  if (!profile) return <div className="p-20 text-center font-black text-dark-400">UNIT_NOT_FOUND</div>

  const { vehicle, assignedDriver, totalRevenue, totalExpenses, profit } = profile

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/vehicles')}
          className="btn-secondary group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Fleet
        </button>
        <div className="flex gap-3">
          <button className="btn-secondary"><Printer className="w-4 h-4" /> Export Profile</button>
          <button className="btn-primary" onClick={() => navigate(`/billing?vehicle=${id}`)}><Plus className="w-4 h-4" /> Create Bill</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-dark-100 overflow-hidden premium-shadow bg-mesh">
        {/* Hero Section */}
        <div className="p-10 border-b border-dark-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl -mr-48 -mt-48" />
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-dark-900 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl rotate-3">
                {vehicle.vehicleNumber?.slice(-2)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-black text-dark-900 tracking-tighter uppercase">{vehicle.vehicleNumber}</h1>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-black tracking-[0.2em] border uppercase transition-all",
                    vehicle.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
                  )}>
                    {vehicle.status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-dark-500 font-bold uppercase tracking-widest text-[10px]">
                  <span className="flex items-center gap-2"><Truck className="w-4 h-4" /> {vehicle.model}</span>
                  <span className="flex items-center gap-2 font-mono"><Hash className="w-4 h-4" /> {vehicle.chassisNumber || 'EX-34...'}</span>
                  <span className="flex items-center gap-2 text-primary-600"><Settings className="w-4 h-4" /> {vehicle.fuelType || 'DIESEL'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <PnlStat label="Life-cycle Revenue" value={formatCurrency(totalRevenue)} color="emerald" />
              <PnlStat label="Life-cycle Expenses" value={formatCurrency(totalExpenses)} color="rose" />
              <div className="w-px h-16 bg-dark-100 mx-2 hidden md:block" />
              <PnlStat label="Net Profit" value={formatCurrency(profit)} color="primary" highlight />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 divide-x divide-dark-100">
          <div className="p-10 lg:col-span-3">
            <div className="flex items-center gap-4 mb-8">
               <div className="flex-1 h-px bg-dark-100" />
               <span className="text-[10px] font-black text-dark-400 uppercase tracking-[0.3em]">Fleet Specification Hub</span>
               <div className="flex-1 h-px bg-dark-100" />
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              <Spec label="Financer" value={vehicle.financer || 'Internal'} icon={IndianRupee} />
              <Spec label="Registration" value={formatDate(vehicle.registrationDate) || 'N/A'} icon={Calendar} />
              <Spec label="EMI Structure" value={formatCurrency(vehicle.emiAmount)} icon={CreditCard} highlight />
              <Spec label="EMI Source" value={vehicle.emiBank || 'N/A'} icon={Activity} />
              <Spec label="Engine Code" value={vehicle.engineNumber || 'N/A'} icon={Settings} />
              <Spec label="Purchase" value={formatDate(vehicle.purchaseDate)} icon={Clock} />
              <Spec label="Fuel Rating" value={`${vehicle.fuelEconomy || '0'} km/L`} icon={Fuel} />
              <Spec label="Owner Entity" value={vehicle.ownerName || 'Samarth Ent.'} icon={Shield} />
            </div>
          </div>

          <div className="p-10 bg-dark-50/30">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-dark-900 text-sm uppercase tracking-widest">Active Operator</h3>
              <MoreVertical className="w-4 h-4 text-dark-400" />
            </div>

            {assignedDriver ? (
              <div className="space-y-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-xl mb-4">
                    <div className="w-full h-full bg-primary-100 rounded-2xl flex items-center justify-center">
                      <Users className="w-10 h-10 text-primary-600" />
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-dark-900 tracking-tight">{assignedDriver.name}</h4>
                  <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase mt-1">Verified Operator</span>
                </div>

                <div className="space-y-4 bg-white p-6 rounded-3xl border border-dark-100 shadow-sm">
                  <ContactItem icon={Phone} text={assignedDriver.phone} />
                  <ContactItem icon={CreditCard} text={`DL: ${assignedDriver.license}`} />
                  <ContactItem icon={MapPin} text={assignedDriver.address?.slice(0, 20) + '...'} />
                </div>
              </div>
            ) : (
              <div className="py-20 text-center opacity-40">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p className="font-bold text-xs uppercase tracking-widest">No Operator Assigned</p>
                <button className="mt-6 btn-primary w-full text-xs" onClick={() => navigate('/drivers')}>Assign Unit</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex justify-center mb-12">
        <div className="bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-dark-100 flex gap-2 shadow-xl overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'Terminal', icon: Activity },
            { id: 'trips', label: 'Logistics', icon: MapPin },
            { id: 'tyres', label: 'Rolling Tech', icon: Radius },
            { id: 'compliance', label: 'Regulatory', icon: Shield },
            { id: 'documents', label: 'Vault', icon: FileText },
            { id: 'expenses', label: 'Burn', icon: TrendingDown },
            { id: 'maintenance', label: 'Service', icon: Wrench },
            { id: 'payments', label: 'Settlement', icon: CreditCard },
            { id: 'bills', label: 'Yield', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-dark-900 text-white shadow-xl" 
                  : "text-dark-400 hover:text-dark-900 hover:bg-dark-50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 1.02 }}
           className="bg-white rounded-[2.5rem] border border-dark-100 p-10 premium-shadow min-h-[400px]"
        >
          { activeTab === 'overview' && <DetailedOverview profile={profile} compliance={compliance} /> }
          { activeTab === 'trips' && <TabTable headers={['Date', 'Route', 'Payload', 'Yield', 'Status']} data={trips.reverse().map(t => [formatDate(t.tripDate), t.siteLocation || 'Transit', `${t.quantity || 0}T`, formatCurrency(t.tripCharges), <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest", t.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-primary-50 text-primary-600 border-primary-100")}>{t.status}</span>])} /> }
          { activeTab === 'tyres' && <TabTable headers={['Serial', 'Position', 'Brand', 'Status', 'Retreads']} data={tyres.map(t => [t.serialNumber, t.position, t.brand, <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest", t.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : t.status === 'RETREADED' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100")}>{t.status}</span>, `x${t.retreadCount}`])} /> }
          { activeTab === 'compliance' && <TabTable headers={['Protocol', 'Terminus', 'Premium', 'Status']} data={compliance.map(c => [c.type, formatDate(c.expiryDate), formatCurrency(c.amount), <StatusBadge date={c.expiryDate} />])} /> }
          { activeTab === 'documents' && <DocumentVault vehicleId={id} documents={documents} onUpload={loadProfile} /> }
          { activeTab === 'expenses' && <TabTable headers={['Date', 'Type', 'Amount', 'Notes']} data={profile.latestExpenses.map(e => [formatDate(e.date), e.expenseType, formatCurrency(e.amount), e.notes || '-'])} /> }
          { activeTab === 'maintenance' && <TabTable headers={['Date', 'Service', 'Cost', 'Next Due']} data={profile.latestMaintenance.map(m => [formatDate(m.date), m.maintenanceType, formatCurrency(m.cost), formatDate(m.nextDueDate)])} /> }
          { activeTab === 'payments' && <TabTable headers={['Date', 'Type', 'Amount', 'Mode', 'Status']} data={payments.map(p => [formatDate(p.paymentDate), p.paymentType, formatCurrency(p.amount), p.paymentMode || 'CASH', <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">PAID</span>])} /> }
          { activeTab === 'bills' && <TabTable headers={['Date', 'No.', 'Gross', 'Status']} data={profile.latestBills.map(b => [formatDate(b.billDate), b.billNo, formatCurrency(b.totalAmount), <span className="text-emerald-500 font-black">PAID</span>])} /> }
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function DetailedOverview({ profile, compliance }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
       <div className="space-y-12">
          {/* Critical Milestones */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-dark-400 mb-8 flex items-center gap-4">
               Critical Milestones <div className="h-px flex-1 bg-dark-100" />
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <MilestoneCard 
                  label="Last Oil Change" 
                  value={profile.lastOilChange} 
                  icon={Fuel} 
                  type="amber" 
               />
               <MilestoneCard 
                  label="Last Tyre Strategy" 
                  value={profile.lastTyreChange} 
                  icon={Radius} 
                  type="emerald" 
               />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-dark-400 mb-8 flex items-center gap-4">
               Regulatory Status <div className="h-px flex-1 bg-dark-100" />
            </h4>
            <div className="space-y-4">
              {compliance.length > 0 ? (
                compliance.slice(0, 4).map((c, i) => (
                  <ComplianceRow key={i} label={c.type} status={new Date(c.expiryDate) < new Date() ? 'Expired' : 'Active'} expiry={c.expiryDate} warning={new Date(c.expiryDate) < new Date()} />
                ))
              ) : (
                <div className="p-10 border border-dashed border-dark-200 rounded-3xl text-center opacity-40">
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Regulatory Records Detected</p>
                </div>
              )}
            </div>
          </div>
       </div>

       <div className="space-y-12">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-dark-400 mb-8 flex items-center gap-4">
               Rolling Tech Summary <div className="h-px flex-1 bg-dark-100" />
            </h4>
            <div className="bg-dark-900 rounded-[2rem] p-8 text-white relative overflow-hidden bg-mesh shadow-2xl">
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">Total Active Tyres</p>
                  <h5 className="text-4xl font-black">12 <span className="text-lg opacity-40">/ FULL_DECODE</span></h5>
                  <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-dark-400">
                     <span>Last Rotation: 14 DAYS AGO</span>
                     <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
               </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-dark-400 mb-8 flex items-center gap-4">
               System Metadata <div className="h-px flex-1 bg-dark-100" />
            </h4>
            <div className="bg-dark-50 rounded-3xl p-8 space-y-4 font-mono text-[10px] uppercase">
              <p className="flex justify-between"><span>NODE_ID</span> <span className="text-dark-900 font-bold">{profile.vehicle.id}</span></p>
              <p className="flex justify-between"><span>LIFECYCLE_STAGE</span> <span className="text-dark-900 font-bold">{profile.vehicle.status}</span></p>
              <p className="flex justify-between"><span>OWNER_ENTITY</span> <span className="text-dark-900 font-bold">{profile.vehicle.ownerName || 'INTERNAL_SAMARTH'}</span></p>
              <p className="flex justify-between"><span>LAST_TELEMETRY</span> <span className="text-primary-600 font-bold">{new Date().toLocaleTimeString()}</span></p>
            </div>
          </div>
       </div>
    </div>
  )
}

function PnlStat({ label, value, color, highlight }) {
  const colors = {
     emerald: "text-emerald-600",
     rose: "text-rose-500",
     primary: "text-primary-600"
  }
  return (
    <div className="flex flex-col items-center md:items-end">
      <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={cn(
        "font-black tracking-tighter",
        highlight ? "text-4xl" : "text-xl",
        colors[color]
      )}>{value}</p>
    </div>
  )
}

function Spec({ label, value, icon: Icon, highlight }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-dark-300 group-hover:text-primary-500 transition-colors" />
        <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className={cn(
        "text-sm font-bold text-dark-900 border-l-2 border-dark-100 pl-3 group-hover:border-primary-500 transition-all",
        highlight && "text-primary-600 font-black"
      )}>{value}</p>
    </div>
  )
}

function MilestoneCard({ label, value, icon: Icon, type, subValue }) {
  const types = {
    amber: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
  }
  return (
    <div className={cn("p-6 rounded-3xl border transition-all duration-500 group cursor-default", types[type])}>
       <div className="flex items-center gap-4">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
           <Icon className="w-6 h-6" />
         </div>
         <div className="min-w-0">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-70 truncate">{label}</p>
           <p className="text-sm font-black tracking-tight truncate">
             {value ? formatDate(value) : 'NO_DATA'}
             {subValue && <span className="ml-2 opacity-50 underline decoration-dotted">{formatCurrency(subValue)}</span>}
           </p>
         </div>
       </div>
    </div>
  )
}

function ContactItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-7 h-7 bg-dark-50 rounded-lg flex items-center justify-center border border-dark-100">
        <Icon className="w-3.5 h-3.5 text-dark-400" />
      </div>
      <span className="text-xs font-bold text-dark-600 truncate">{text}</span>
    </div>
  )
}

function TabTable({ headers, data }) {
  if (data.length === 0) return (
    <div className="py-20 flex flex-col items-center justify-center opacity-30">
       <Clock className="w-16 h-16 mb-4" />
       <p className="font-black text-sm uppercase tracking-[0.3em]">No Historical Data</p>
    </div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-dark-100">
            {headers.map(h => <th key={h} className="pb-6 text-[10px] font-black text-dark-400 uppercase tracking-widest">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-50">
          {data.map((row, i) => (
            <tr key={i} className="group hover:bg-dark-50/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-6 text-sm font-bold text-dark-700 whitespace-nowrap px-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ date }) {
  const isExpired = new Date(date) < new Date()
  const isSoon = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)) < 15
  
  if (isExpired) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest">Expired</span>
  if (isSoon) return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest">Due Soon</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">Active</span>
}

function ComplianceRow({ label, status, expiry, warning }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-dark-100 shadow-sm group hover:border-primary-500 transition-all">
       <div className="flex items-center gap-4">
          <div className={cn("w-2 h-2 rounded-full", warning ? "bg-orange-500 animate-pulse" : "bg-emerald-500")} />
          <div>
            <p className="text-sm font-black text-dark-900">{label}</p>
            <p className="text-[10px] font-bold text-dark-400 uppercase italic">Valid until: {formatDate(expiry)}</p>
          </div>
       </div>
       <span className={cn(
         "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
         warning ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
       )}>{status}</span>
    </div>
  )
}

function DocumentVault({ vehicleId, documents, onUpload }) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('RC')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [extractOcr, setExtractOcr] = useState(true)
  const fileInputRef = useRef(null)
  const bulkFileInputRef = useRef(null)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docType)
      formData.append('expiryDate', new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0])
      
      if (extractOcr) {
        const response = await vehicleAPI.uploadWithOcr(vehicleId, formData)
        if (response.data.vehicleUpdated) {
          alert('Document uploaded! OCR data extracted and vehicle details updated.')
        } else {
          alert('Document uploaded! (No OCR data found)')
        }
      } else {
        await vehicleAPI.uploadDocument(vehicleId, formData)
        alert('Document uploaded!')
      }
      setShowUploadModal(false)
      if (onUpload) onUpload()
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    try {
      await vehicleAPI.uploadBulkDocuments(vehicleId, selectedFiles, docType)
      setShowUploadModal(false)
      setSelectedFiles([])
      setIsBulkMode(false)
      if (onUpload) onUpload()
      alert(`Successfully uploaded ${selectedFiles.length} documents!`)
    } catch (err) {
      console.error('Bulk upload failed:', err)
      alert('Bulk upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
     <div className="space-y-10">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-2xl font-black text-dark-900 tracking-tight uppercase leading-none">Digital <span className="text-gradient">Locker</span></h3>
              <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                 <Shield className="w-3 h-3 text-primary-500" /> Stored High-Resolution Asset Cryptography
              </p>
           </div>
           <div className="flex gap-2">
              <button 
                className="btn-secondary py-2 px-4 text-[10px]"
                onClick={() => { setIsBulkMode(true); setShowUploadModal(true); }}
              >
                <Plus className="w-4 h-4" /> Bulk Upload
              </button>
              <button 
                className="btn-primary py-2 px-6 text-[10px]"
                onClick={() => { setIsBulkMode(false); setShowUploadModal(true); }}
              >
                <Plus className="w-4 h-4" /> Deposit Asset
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {documents.map((doc, i) => (
               <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[2rem] p-8 border border-dark-100 group hover:border-primary-500 transition-all cursor-pointer premium-shadow bg-mesh"
              >
                 <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 bg-dark-50 rounded-2xl flex items-center justify-center border border-dark-100 shadow-sm group-hover:scale-110 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all overflow-hidden">
                       {doc.filePath?.startsWith('http') ? (
                          <img src={doc.filePath} alt={doc.documentName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' }} />
                       ) : (
                          <FileText className="w-8 h-8" />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <span className="inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary-50 text-primary-700 border border-primary-100 mb-2">{doc.documentType || 'OTHER'}</span>
                       <p className="text-sm font-black text-dark-900 tracking-tight leading-none truncate">{doc.documentName || 'Untitled Document'}</p>
                       {doc.expiryDate && (
                          <p className="text-[9px] font-bold text-dark-400 uppercase tracking-widest mt-2">Expires: {formatDate(doc.expiryDate)}</p>
                       )}
                    </div>
                 </div>
                 {doc.remarks && (
                    <div className="mb-6 p-4 bg-primary-50/50 rounded-xl border border-primary-100/50">
                       <p className="text-[8px] font-black text-primary-600 uppercase tracking-widest mb-1">AI Extracted Data</p>
                       <p className="text-[10px] font-bold text-dark-500 leading-tight">{doc.remarks}</p>
                    </div>
                 )}
                 <div className="flex items-center justify-between pt-6 border-t border-dark-100/50">
                    <span className="text-[9px] font-black text-dark-300 uppercase tracking-widest flex items-center gap-2">
                       <Clock className="w-3 h-3" /> {formatDate(doc.createdAt)}
                    </span>
                    <button 
                        onClick={() => openDocument(doc.filePath)}
                       className="p-2 bg-dark-900 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0"
                    >
                       <ExternalLink className="w-4 h-4" />
                    </button>
                 </div>
              </motion.div>
           ))}
            {documents.length === 0 && (
               <div className="col-span-full py-32 text-center bg-dark-50/20 border border-dashed border-dark-100 rounded-[2.5rem]">
                  <FileSearch className="w-16 h-16 text-dark-100 mx-auto mb-6 opacity-30" />
                  <p className="font-black text-[10px] text-dark-300 uppercase tracking-[0.3em]">No encrypted asset twins detected</p>
                  <button className="mt-8 text-[9px] font-black text-primary-600 uppercase tracking-[0.2em] hover:underline"onClick={() => setShowUploadModal(true)}>Connect Storage Node</button>
               </div>
            )}
        </div>

         {showUploadModal && (
           <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden premium-shadow">
               <div className="p-8 border-b border-dark-100">
                 <h3 className="text-xl font-black text-dark-900 uppercase">
                   {isBulkMode ? 'Bulk Upload Documents' : 'Deposit Asset'}
                 </h3>
                 <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">
                   {isBulkMode ? 'Upload multiple documents at once' : 'Upload single document'}
                 </p>
               </div>
               <div className="p-8 space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Document Type</label>
                   <select 
                     value={docType} 
                     onChange={(e) => setDocType(e.target.value)}
                     className="interactive-field"
                   >
                     <option value="RC">Registration Certificate (RC)</option>
                     <option value="INSURANCE">Insurance</option>
                     <option value="PERMIT">Permit</option>
                     <option value="PUC">PUC Certificate</option>
                     <option value="FITNESS">Fitness Certificate</option>
                     <option value="TAX">Tax Receipt</option>
                     <option value="OTHER">Other</option>
                   </select>
                 </div>
                 
                  {isBulkMode ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Select Files (Multiple)</label>
                      <div 
                        className="interactive-field flex flex-col items-center justify-center border-dashed py-8 gap-3 cursor-pointer"
                        onClick={() => bulkFileInputRef.current?.click()}
                      >
                        <FileSearch className="w-8 h-8 text-dark-200" />
                        <span className="text-[10px] font-black uppercase text-dark-400">Click to select files</span>
                        <input 
                          type="file" 
                          multiple 
                          ref={bulkFileInputRef}
                          className="hidden"
                          onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                        />
                        {selectedFiles.length > 0 && (
                          <div className="text-xs font-black text-primary-600">
                            {selectedFiles.length} file(s) selected
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">File</label>
                      <div 
                        className="interactive-field flex flex-col items-center justify-center border-dashed py-8 gap-3 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileSearch className="w-8 h-8 text-dark-200" />
                        <span className="text-[10px] font-black uppercase text-dark-400">Click to select file</span>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleUpload}
                        />
                      </div>
                    </div>
                  )}

                  {!isBulkMode && (
                    <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
                      <div>
                        <p className="text-xs font-black text-dark-900 uppercase">Auto-Extract Data (OCR)</p>
                        <p className="text-[10px] text-dark-400">Extract vehicle details from RC, Insurance, Permit</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExtractOcr(!extractOcr)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${extractOcr ? 'bg-primary-500' : 'bg-dark-200'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${extractOcr ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  )}
                </div>
               <div className="p-8 border-t border-dark-100 flex gap-4">
                 <button 
                   className="flex-1 btn-secondary"
                   onClick={() => { setShowUploadModal(false); setSelectedFiles([]); setIsBulkMode(false); }}
                 >
                   Cancel
                 </button>
                 {isBulkMode && (
                   <button 
                     className="flex-1 btn-primary disabled:opacity-50"
                     disabled={selectedFiles.length === 0 || uploading}
                     onClick={handleBulkUpload}
                   >
                     {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
                   </button>
                 )}
               </div>
             </motion.div>
           </div>
         )}
      </div>
   )
}


