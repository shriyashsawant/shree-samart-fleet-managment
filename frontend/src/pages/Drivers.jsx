import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, Edit, Trash2, Phone, Calendar, CreditCard, ClipboardList, CheckCircle2, XCircle, Clock, MapPin, ArrowUpRight, ArrowLeft, MoreVertical, FileSearch, ExternalLink, FileText } from 'lucide-react'
import { driverAPI, vehicleAPI, attendanceAPI, driverDocumentAPI } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import { format } from 'date-fns'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showConsoleModal, setShowConsoleModal] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [consoleDriver, setConsoleDriver] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        driverAPI.getAll(),
        vehicleAPI.getAll()
      ])
      setDrivers(driversRes.data)
      setVehicles(vehiclesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this operator?')) {
      try {
        await driverAPI.delete(id)
        loadData()
      } catch (error) {
        console.error('Failed to delete driver:', error)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase"><span className="text-gradient">Operator</span> Directory</h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
             <Users className="w-3 h-3 text-primary-500" /> Human Capital Management
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" /> Enroll Operator
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-mesh rounded-[2.5rem] border border-dark-100">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full shadow-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {drivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[2rem] overflow-hidden border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 flex flex-col h-full bg-mesh"
            >
              <div className="p-8 flex-1">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-dark-900 rounded-2xl flex items-center justify-center text-white ring-4 ring-dark-50 shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-dark-900 tracking-tight">{driver.name}</h3>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase mt-1 inline-block",
                        driver.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {driver.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={() => { setConsoleDriver(driver); setShowConsoleModal(true); }}
                      className="p-2 hover:bg-primary-50 rounded-xl text-primary-600 transition-colors"
                      title="Personnel Console"
                    >
                      <ClipboardList className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setSelectedDriver(driver); setShowModal(true); }} className="p-2 hover:bg-dark-100 rounded-xl text-dark-600 transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(driver.id)} className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 font-inter">
                  <div className="grid grid-cols-1 gap-3">
                    <DriverMeta icon={Phone} label="Contact" value={driver.phone || 'N/A'} />
                    <DriverMeta icon={CreditCard} label="License ID" value={driver.drivingLicense || 'N/A'} />
                    <DriverMeta icon={Calendar} label="License Expiry" value={formatDate(driver.licenseExpiry)} type="warning" />
                  </div>

                  <div className="mt-8 pt-8 border-t border-dark-100/50 uppercase">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-1">Standard Salary</p>
                        <p className="text-xl font-black text-primary-600 tracking-tighter">{formatCurrency(driver.salary)}</p>
                      </div>
                      {driver.assignedVehicleNumber && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-1">Unit Assignment</p>
                          <span className="font-black text-dark-900 text-sm bg-white px-3 py-1 rounded-lg border border-dark-100 shadow-sm block">
                            {driver.assignedVehicleNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <DriverModal
          driver={selectedDriver}
          vehicles={vehicles}
          onClose={() => { setShowModal(false); setSelectedDriver(null); }}
          onSave={() => { setShowModal(false); setSelectedDriver(null); loadData(); }}
        />
      )}

      <AnimatePresence>
        {showConsoleModal && consoleDriver && (
          <PersonnelConsole 
            driver={consoleDriver}
            onClose={() => { setShowConsoleModal(false); setConsoleDriver(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PersonnelConsole({ driver, onClose }) {
  const [activeTab, setActiveTab] = useState('attendance')
  const [attendance, setAttendance] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingDate, setMarkingDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('PRESENT')
  const [notes, setNotes] = useState('')
  const [summary, setSummary] = useState({ present: 0, absent: 0, leave: 0, halfDay: 0, payableDays: 0 })
  const [docFile, setDocFile] = useState(null)
  const [docType, setDocType] = useState('LICENSE')
  const [docNumber, setDocNumber] = useState('')

  useEffect(() => { 
     loadAttendance()
     loadDocuments()
  }, [driver.id])

  useEffect(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const stats = attendance.reduce((acc, rec) => {
      const recDate = new Date(rec.date)
      if (recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear) {
        if (rec.status === 'PRESENT') { acc.present++; acc.payableDays += 1 }
        else if (rec.status === 'ABSENT') { acc.absent++ }
        else if (rec.status === 'LEAVE') { acc.leave++ }
        else if (rec.status === 'HALF_DAY') { acc.halfDay++; acc.payableDays += 0.5 }
      }
      return acc
    }, { present: 0, absent: 0, leave: 0, halfDay: 0, payableDays: 0 })
    
    setSummary(stats)
  }, [attendance])

  const loadAttendance = async () => {
    try {
      const res = await attendanceAPI.getByDriver(driver.id)
      setAttendance(res.data.sort((a, b) => new Date(b.date) - new Date(a.date)))
    } catch (error) { console.error('Error fetching attendance:', error) }
    finally { setLoading(false) }
  }

  const loadDocuments = async () => {
     try {
        const res = await driverDocumentAPI.getByDriver(driver.id)
        setDocuments(res.data)
     } catch (e) { console.error(e) }
  }

  const handleMark = async (e) => {
    e.preventDefault()
    try {
      await attendanceAPI.mark({ driverId: driver.id, date: markingDate, status, notes })
      loadAttendance()
      setNotes('')
    } catch (error) { console.error('Error marking attendance:', error) }
  }

  const handleDocUpload = async (e) => {
     e.preventDefault()
     if (!docFile) return
     const data = new FormData()
     data.append('driverId', driver.id)
     data.append('documentType', docType)
     data.append('documentNumber', docNumber)
     data.append('file', docFile)
     try {
        await driverDocumentAPI.upload(data)
        loadDocuments()
        setDocFile(null); setDocNumber('')
     } catch (e) { console.error(e) }
  }

  const deleteRecord = async (id) => {
    if (confirm('Delete this record?')) {
      try { await attendanceAPI.delete(id); loadAttendance() }
      catch (error) { console.error('Error deleting:', error) }
    }
  }

  const deleteDoc = async (id) => {
     if (confirm('Authorize document destruction?')) {
        try { await driverDocumentAPI.delete(id); loadDocuments() }
        catch (e) { console.error(e) }
     }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 h-full">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col premium-shadow h-[85vh]">
        <div className="p-8 border-b border-dark-100 flex items-center justify-between glass-card font-outfit">
          <div className="flex items-center gap-6">
            <div>
               <h3 className="text-2xl font-black text-dark-900 tracking-tight uppercase leading-none">Personnel <span className="text-gradient">Console</span></h3>
               <p className="text-[10px] font-bold text-dark-400 uppercase tracking-[0.2em] mt-2">{driver.name} • Deep Operations Manager</p>
            </div>
            <div className="h-10 w-px bg-dark-100" />
            <div className="flex gap-1 p-1 bg-dark-50 rounded-2xl">
               {['attendance', 'vault'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab ? "bg-white text-dark-900 shadow-md" : "text-dark-400 hover:text-dark-600"
                    )}
                  >
                     {tab}
                  </button>
               ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-full transition-colors group">
             <Plus className="w-8 h-8 rotate-45 text-dark-200 group-hover:text-rose-500 transition-colors" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-x divide-dark-50 bg-mesh">
           {activeTab === 'attendance' ? (
              <>
                 <div className="p-10 w-full md:w-1/3 bg-dark-50/20 overflow-y-auto">
                    <h4 className="text-[10px] font-black text-dark-900 uppercase tracking-[0.3em] mb-8 font-outfit">Operational Sentinel</h4>
                    <form onSubmit={handleMark} className="space-y-8 font-inter">
                       <div className="space-y-1">
                          <label className="block text-[9px] font-black text-dark-400 uppercase tracking-widest ml-1">Dispatch Hub Date</label>
                          <input type="date" value={markingDate} onChange={(e) => setMarkingDate(e.target.value)} className="interactive-field" required />
                       </div>
                       <div className="space-y-3">
                          <label className="block text-[9px] font-black text-dark-400 uppercase tracking-widest ml-1">Duty Status Protocol</label>
                          <div className="grid grid-cols-2 gap-3">
                             {['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY'].map((s) => (
                                <button
                                   key={s} type="button" onClick={() => setStatus(s)}
                                   className={cn(
                                      "px-4 py-4 text-[9px] font-black rounded-2xl border transition-all uppercase tracking-[0.15em] leading-none",
                                      status === s ? "bg-dark-900 text-white border-dark-900 shadow-xl shadow-dark-900/30" : "bg-white text-dark-600 border-dark-100 hover:border-dark-300"
                                   )}
                                >
                                   {s.replace('_', ' ')}
                                </button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="block text-[9px] font-black text-dark-400 uppercase tracking-widest ml-1">Security Notes</label>
                          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="interactive-field resize-none h-24 text-xs" placeholder="Operational telemetry context..." />
                       </div>
                       <button type="submit" className="btn-primary w-full py-4 text-[10px] mt-4">Execute Log Entry</button>
                    </form>
                 </div>

                 <div className="p-10 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-6 mb-12">
                       <SummaryBox label="Verified Pulse" value={summary.present} color="emerald" />
                       <SummaryBox label="Unit Dropout" value={summary.absent} color="rose" />
                       <SummaryBox label="Authorized Void" value={summary.leave} color="amber" />
                       <SummaryBox label="Settlement Days" value={summary.payableDays} color="primary" />
                    </div>

                    <h4 className="text-[10px] font-black text-dark-900 uppercase tracking-[0.3em] mb-8 font-outfit">Transaction History Log</h4>
                    <div className="space-y-4">
                       {loading ? (
                          <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white border border-dark-50 animate-pulse rounded-3xl" />)}</div>
                       ) : attendance.length === 0 ? (
                          <div className="py-32 text-center bg-white border border-dashed border-dark-100 rounded-[2rem]">
                             <Clock className="w-16 h-16 text-dark-50 mx-auto mb-6" />
                             <p className="font-black text-[10px] text-dark-300 uppercase tracking-[0.2em]">No operational telemetry found</p>
                          </div>
                       ) : (
                          attendance.map((record) => (
                             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={record.id} className="flex items-center justify-between p-6 bg-white border border-dark-100 rounded-[2rem] premium-shadow group hover:border-primary-500 transition-all cursor-default relative overflow-hidden">
                                <div className="flex items-center gap-6 relative z-10">
                                   <div className={cn(
                                      "w-3 h-3 rounded-full shadow-lg",
                                      record.status === 'PRESENT' ? 'bg-emerald-500 shadow-emerald-200' :
                                      record.status === 'ABSENT' ? 'bg-rose-500 shadow-rose-200' :
                                      record.status === 'LEAVE' ? 'bg-amber-500 shadow-amber-200' : 'bg-primary-500 shadow-primary-200'
                                   )} />
                                   <div>
                                      <p className="text-sm font-black text-dark-900 font-outfit tracking-tight">{format(new Date(record.date), 'dd MMMM yyyy')}</p>
                                      <p className="text-[9px] font-bold text-dark-400 uppercase tracking-[0.2em] mt-1">{record.status.replace('_', ' ')}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                   {record.notes && <span className="text-[9px] font-bold text-dark-300 italic hidden md:block">"{record.notes}"</span>}
                                   <button onClick={() => deleteRecord(record.id)} className="opacity-0 group-hover:opacity-100 p-3 text-rose-400 hover:text-white hover:bg-rose-500 rounded-2xl transition-all scale-90 group-hover:scale-100 shadow-sm border border-rose-50">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-dark-50/5 to-transparent pointer-events-none" />
                             </motion.div>
                          ))
                       )}
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 p-10 overflow-y-auto">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <h4 className="text-[10px] font-black text-dark-900 uppercase tracking-[0.3em] font-outfit">Credential Repository</h4>
                       <form onSubmit={handleDocUpload} className="bg-white p-8 rounded-[2.5rem] border border-dark-100 premium-shadow space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Asset Integrity Type</label>
                                <select value={docType} onChange={e => setDocType(e.target.value)} className="interactive-field">
                                   <option value="LICENSE">Driving License</option>
                                   <option value="AADHAAR">Aadhaar Card</option>
                                   <option value="PAN">PAN Card</option>
                                   <option value="VOTER_ID">Voter ID</option>
                                   <option value="OTHER">Other Protocol</option>
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Unique Identifier</label>
                                <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="SRN / ID No..." className="interactive-field" />
                             </div>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Physical Verification (File)</label>
                             <div className="mt-2 text-[10px] font-black uppercase text-dark-400 group relative">
                                <div className="interactive-field flex flex-col items-center justify-center border-dashed py-10 gap-3">
                                   <FileSearch className="w-8 h-8 text-dark-200" />
                                   <span>Deposit Cryptographic Twin</span>
                                   <input type="file" onChange={e => setDocFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" id="fileInput" />
                                   {docFile && <span className="text-primary-600 border px-3 py-1 rounded-full border-primary-100">{docFile.name}</span>}
                                </div>
                             </div>
                          </div>
                          <button type="submit" disabled={!docFile} className="btn-primary w-full disabled:opacity-30 disabled:grayscale">Encrypt & Deposit</button>
                       </form>
                    </div>

                    <div className="space-y-8">
                       <h4 className="text-[10px] font-black text-dark-900 uppercase tracking-[0.3em] font-outfit">Active Vault Directory</h4>
                       <div className="grid gap-4">
                          {documents.map((doc, idx) => (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} key={doc.id} className="bg-white p-6 rounded-[2rem] border border-dark-100 hover:border-primary-500 transition-all premium-shadow group">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-dark-50 rounded-2xl flex items-center justify-center text-dark-400 border border-dark-100 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                         <FileText className="w-6 h-6" />
                                      </div>
                                      <div>
                                         <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest">{doc.documentType}</p>
                                         <h5 className="font-black text-dark-900 tracking-tight">{doc.documentNumber || doc.documentName}</h5>
                                      </div>
                                   </div>
                                   <div className="flex gap-2">
                                       {doc.filePath && (
                                          <button 
                                             onClick={() => window.open(doc.filePath, '_blank')}
                                             className="p-3 bg-dark-50 rounded-xl text-dark-600 hover:bg-primary-50 hover:text-primary-600 transition-all opacity-0 group-hover:opacity-100"
                                          >
                                             <ExternalLink className="w-4 h-4" />
                                          </button>
                                       )}
                                       <button onClick={() => deleteDoc(doc.id)} className="p-3 bg-dark-50 rounded-xl text-dark-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                </div>
                             </motion.div>
                          ))}
                          {documents.length === 0 && (
                             <div className="py-20 text-center opacity-30 italic font-black text-dark-400 uppercase text-[9px] tracking-[0.3em]">
                                No identity credentials detected in vault
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </motion.div>
    </div>
  )
}

function SummaryBox({ label, value, color }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    primary: "bg-primary-50 text-primary-600 border-primary-100"
  }
  return (
    <div className={cn("p-4 rounded-2xl border text-center shadow-sm bg-white transition-transform hover:scale-105", colors[color])}>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  )
}

function DriverModal({ driver, vehicles, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    address: driver?.address || '',
    aadhaarNumber: driver?.aadhaarNumber || '',
    drivingLicense: driver?.drivingLicense || '',
    licenseExpiry: driver?.licenseExpiry || '',
    salary: driver?.salary || '',
    joiningDate: driver?.joiningDate || '',
    endDate: driver?.endDate || '',
    assignedVehicleId: driver?.assignedVehicleId || '',
    status: driver?.status || 'ACTIVE',
  })
  const [licenseFile, setLicenseFile] = useState(null)
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...formData, salary: parseFloat(formData.salary) || 0 }
      let savedDriver
      if (driver?.id) {
        savedDriver = (await driverAPI.update(driver.id, data)).data
      } else {
        savedDriver = (await driverAPI.create(data)).data
      }

      if (licenseFile) {
        const fd = new FormData()
        fd.append('file', licenseFile)
        await driverAPI.uploadLicense(savedDriver.id, fd)
      }
      if (aadhaarFile) {
        const fd = new FormData()
        fd.append('file', aadhaarFile)
        await driverAPI.uploadAadhaar(savedDriver.id, fd)
      }
      onSave()
    } catch (error) { console.error('Failed to save driver:', error) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col premium-shadow">
        <div className="p-8 border-b border-dark-100 glass-card">
          <h2 className="text-2xl font-black text-dark-900 tracking-tight">{driver ? 'Modify' : 'Enroll'} <span className="text-gradient">Operator</span></h2>
          <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Personnel Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto bg-mesh">
          <div className="grid grid-cols-2 gap-8">
            <FormGroup label="Full Name" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} required />
            <FormGroup label="Mobile Contact" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
            <FormGroup label="Aadhaar ID" value={formData.aadhaarNumber} onChange={(v) => setFormData({ ...formData, aadhaarNumber: v })} />
            <FormGroup label="License Number" value={formData.drivingLicense} onChange={(v) => setFormData({ ...formData, drivingLicense: v })} />
            <FormGroup label="License Expiry" value={formData.licenseExpiry} onChange={(v) => setFormData({ ...formData, licenseExpiry: v })} type="date" />
            <FormGroup label="Standard Salary" value={formData.salary} onChange={(v) => setFormData({ ...formData, salary: v })} type="number" />
            <FormGroup label="Joining Date" value={formData.joiningDate} onChange={(v) => setFormData({ ...formData, joiningDate: v })} type="date" />

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Unit Assignment</label>
              <select
                value={formData.assignedVehicleId}
                onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                className="interactive-field"
              >
                <option value="">No Active Unit</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Postal Address</label>
            <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="interactive-field resize-none h-24" />
          </div>

          <div className="p-6 bg-dark-50 rounded-3xl border border-dark-100 space-y-4">
             <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest">Document Upload</p>
             <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Driving License Copy</label>
                  {driver?.licenseFilePath && <span className="text-[9px] text-emerald-600 font-bold ml-1">File uploaded</span>}
                  <div className="mt-1">
                    <input type="file" accept="image/*,.pdf" onChange={e => setLicenseFile(e.target.files[0])} className="text-xs file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-dark-50 file:text-[10px] file:font-black file:text-dark-600 file:uppercase file:tracking-widest hover:file:bg-dark-100 transition-all cursor-pointer w-full" />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">Aadhaar Card Copy</label>
                  {driver?.aadhaarFilePath && <span className="text-[9px] text-emerald-600 font-bold ml-1">File uploaded</span>}
                  <div className="mt-1">
                    <input type="file" accept="image/*,.pdf" onChange={e => setAadhaarFile(e.target.files[0])} className="text-xs file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-dark-50 file:text-[10px] file:font-black file:text-dark-600 file:uppercase file:tracking-widest hover:file:bg-dark-100 transition-all cursor-pointer w-full" />
                  </div>
               </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-dark-50">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Finalize Enrollment'}</button>
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
        required={required}
      />
    </div>
  )
}

function DriverMeta({ icon: Icon, label, value, type }) {
  return (
    <div className="flex items-center gap-3">
       <div className="w-8 h-8 bg-dark-50 rounded-xl flex items-center justify-center border border-dark-100">
         <Icon className="w-4 h-4 text-dark-400" />
       </div>
       <div>
         <p className="text-[9px] font-black text-dark-400 uppercase tracking-widest leading-none mb-1">{label}</p>
         <p className={cn(
           "text-xs font-bold text-dark-900 leading-none",
           type === 'warning' && "text-orange-600"
         )}>{value}</p>
       </div>
    </div>
  )
}
