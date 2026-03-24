import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Download, Printer, Edit, Trash2, Upload, Camera, Check, AlertCircle, X, Search } from 'lucide-react'
import { billAPI, clientAPI, vehicleAPI, tenantAPI } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'

export default function Billing() {
  const [bills, setBills] = useState([])
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [editingBill, setEditingBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [extractedData, setExtractedData] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [bRes, cRes, vRes] = await Promise.all([billAPI.getAll(), clientAPI.getAll(), vehicleAPI.getAll()])
      setBills(bRes.data); setClients(cRes.data); setVehicles(vRes.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const totalRevenue = bills.reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0)
  const totalBasic = bills.reduce((s, b) => s + (parseFloat(b.basicAmount) || 0), 0)
  const totalCgst = bills.reduce((s, b) => s + (parseFloat(b.cgstAmount) || 0), 0)
  const totalSgst = bills.reduce((s, b) => s + (parseFloat(b.sgstAmount) || 0), 0)

  // Get next bill number
  const getNextBillNo = () => {
    const maxBill = bills.reduce((max, bill) => {
      const num = parseInt(bill.billNo) || 0
      return num > max ? num : max
    }, 0)
    return String(maxBill + 1)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      try {
        await billAPI.delete(id)
        loadData()
      } catch (e) { console.error(e) }
    }
  }

  const exportToExcel = () => {
    const headers = ['Sr No', 'Date', 'Bill No', 'Party Name', 'Party Gst No', 'HSN Code', 'GST %', 'Basic', 'CGST Amount', 'SGST Amount', 'P/F', 'Total', 'Bill Type']
    const rows = bills.map((bill, index) => [
      index + 1,
      bill.billDate ? new Date(bill.billDate).toLocaleDateString('en-GB') : '',
      bill.billNo || '',
      bill.clientName || '',
      bill.clientGstNumber || '',
      bill.hsnCode || '',
      bill.gstPercentage || '',
      bill.basicAmount || 0,
      bill.cgstAmount || 0,
      bill.sgstAmount || 0,
      bill.pfAmount || 0,
      bill.totalAmount || 0,
      bill.billType || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      ['', '', '', '', '', '', 'Sub Total:', totalBasic.toFixed(2), totalCgst.toFixed(2), totalSgst.toFixed(2), '0', totalRevenue.toFixed(2), '']
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Shree_Samarth_Bills_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleOcrComplete = (data) => {
    setExtractedData(data)
    setShowUploadModal(false)
    setShowModal(true)
  }

  const filteredBills = bills.filter(b =>
    b.billNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-dark-900 tracking-tight">
            Revenue <span className="text-gradient">Intelligence</span>
          </h1>
          <p className="text-dark-500 font-medium mt-1">Manage billing, GST compliance, and financial records.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportToExcel} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setShowUploadModal(true)} className="btn-secondary border-purple-200 text-purple-700 hover:bg-purple-50">
            <Camera className="w-4 h-4" /> Scan Invoice
          </button>
          <button onClick={() => { setExtractedData(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-5 h-5" /> Create Bill
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-dark-900 rounded-[2rem] p-8 text-white premium-shadow relative overflow-hidden group col-span-1 md:col-span-2 shadow-2xl shadow-primary-900/40"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
               <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                 <FileText className="w-6 h-6 text-primary-400" />
               </div>
               <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] mb-2 font-outfit">Aggregate Gross Billing</p>
               <h2 className="text-4xl font-black tracking-tight">{formatCurrency(totalRevenue)}</h2>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Transactions</span>
               <span className="text-xs font-black text-emerald-400">{bills.length} Records</span>
            </div>
          </div>
        </motion.div>

        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
           <StatMini label="Taxable Yield" value={formatCurrency(totalBasic)} icon={Check} color="blue" />
           <StatMini label="Accrued GST" value={formatCurrency(totalCgst + totalSgst)} icon={AlertCircle} color="amber" />
           <div className="col-span-2">
              <div className="bg-white rounded-[1.5rem] p-6 border border-dark-100 flex items-center justify-between group hover:border-primary-500 transition-all duration-300">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                       <Upload className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Digital Input</p>
                       <p className="text-sm font-black text-dark-900 uppercase tracking-tight">Rapid OCR Intake</p>
                    </div>
                 </div>
                 <button onClick={() => setShowUploadModal(true)} className="px-4 py-2 bg-dark-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-dark-900/20">
                    Deploy Lens
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-8">
         <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search by Bill No or Client..." 
              className="interactive-field pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
        <div className="bg-white rounded-[2.5rem] border border-dark-100 overflow-hidden premium-shadow bg-mesh">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dark-100">
                  <th className="px-8 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest">Protocol</th>
                  <th className="px-8 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest">Counterparty</th>
                  <th className="px-8 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest text-right">Yield</th>
                  <th className="px-8 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest text-right">Tax Modality</th>
                  <th className="px-8 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest text-right">Consolidated</th>
                  <th className="px-8 py-6 text-[10px] font-black text-dark-400 uppercase tracking-widest text-center">Protocol Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {filteredBills.map(b => (
                  <tr key={b.id} className="group hover:bg-dark-50/50 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-dark-900 tracking-tight">INV-{b.billNo}</span>
                        <span className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-0.5">{formatDate(b.billDate)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-dark-800 tracking-tight">{b.clientName || '-'}</span>
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.1em] mt-1">{b.clientGstNumber || 'NON-GST'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className="text-sm font-black text-dark-900 font-mono tracking-tighter">{formatCurrency(b.basicAmount)}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-amber-600 font-mono tracking-tighter">{formatCurrency((parseFloat(b.cgstAmount)||0) + (parseFloat(b.sgstAmount)||0))}</span>
                          <span className="text-[9px] font-black text-dark-300 uppercase tracking-widest mt-0.5">{b.gstPercentage}% Slab</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100 font-mono tracking-tighter">
                        {formatCurrency(b.totalAmount)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setSelectedBill(b)} 
                          className="p-2.5 bg-white hover:bg-dark-900 hover:text-white rounded-xl text-dark-400 shadow-sm border border-dark-100 transition-all duration-300"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingBill(b)} 
                          className="p-2.5 bg-white hover:bg-primary-600 hover:text-white rounded-xl text-dark-400 shadow-sm border border-dark-100 transition-all duration-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(b.id)} 
                          className="p-2.5 bg-white hover:bg-rose-600 hover:text-white rounded-xl text-rose-400 shadow-sm border border-rose-100 transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                       <FileText className="w-12 h-12 text-dark-200 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest">No matching transactional records detected</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {showModal && <BillModal 
        clients={clients} 
        vehicles={vehicles} 
        nextBillNo={getNextBillNo()}
        extractedData={extractedData}
        onClose={() => { setShowModal(false); setExtractedData(null); }} 
        onSave={() => { setShowModal(false); setExtractedData(null); loadData(); }} 
      />}
      
      {editingBill && <BillModal 
        clients={clients} 
        vehicles={vehicles} 
        bill={editingBill}
        onClose={() => setEditingBill(null)} 
        onSave={() => { setEditingBill(null); loadData(); }} 
      />}
      
      {selectedBill && <BillPrintModal bill={selectedBill} onClose={() => setSelectedBill(null)} />}
      
      {showUploadModal && <InvoiceUploadModal 
        clients={clients}
        onClose={() => setShowUploadModal(false)} 
        onExtract={handleOcrComplete}
      />}
    </div>
  )
}

function InvoiceUploadModal({ clients, onClose, onExtract }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [editedData, setEditedData] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setExtracted(null)
      setError(null)
    }
  }

  const handleExtract = async () => {
    if (!file) return
    setProcessing(true); setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await billAPI.extractOcr(formData)
      const raw = response.data.ocrData
      
      const normalized = {
        billNo: raw.bill_no || '',
        date: raw.date || '',
        partyName: raw.party_name || '',
        partyGst: raw.party_gst || '',
        companyName: raw.company_name || '',
        companyGst: raw.company_gst || '',
        companyMobile: raw.company_mobile || '',
        basicAmount: raw.basic_amount || '',
        totalAmount: raw.total_amount || '',
        hsnCode: raw.hsn_code || '',
        bankName: raw.bank_name || '',
        bankAccountNo: raw.bank_account_no || '',
        bankIfsc: raw.bank_ifsc || '',
        mathValid: raw.math_valid || false,
        billType: raw.bill_type || '',
        confidence: raw.confidence || 0,
      }
      setExtracted(normalized); setEditedData(normalized)
    } catch (e) {
      console.error('OCR error:', e); setError('Extraction failed. Try manual entry.')
    } finally { setProcessing(false) }
  }

  const handleEditChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value })
  }

  return (
    <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col premium-shadow">
        <div className="p-6 border-b border-dark-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black text-dark-900 tracking-tight">Lens <span className="text-gradient">Scanner</span></h2>
            <p className="text-[10px] text-dark-400 font-bold uppercase tracking-widest mt-0.5">AI Extraction Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto">
          {!preview ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-dark-100 rounded-[2rem] p-16 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group">
              <div className="w-20 h-20 bg-dark-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-dark-400" />
              </div>
              <p className="text-xl font-black text-dark-900 tracking-tight">Ingest Invoice Data</p>
              <p className="text-dark-400 text-sm font-medium mt-1">Authorized Formats: PDF, JPG, PNG</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="relative rounded-[2rem] overflow-hidden border border-dark-100 shadow-lg">
                <img src={preview} alt="Preview" className="w-full max-h-64 object-contain bg-dark-50" />
                <button onClick={() => { setFile(null); setPreview(null); setExtracted(null); }} className="absolute top-4 right-4 p-2 bg-dark-900/80 text-white rounded-xl backdrop-blur-md">
                   <X className="w-5 h-5" />
                </button>
              </div>
              
              {!extracted && !processing && (
                <button onClick={handleExtract} className="btn-primary w-full py-5 text-lg">
                   <Camera className="w-6 h-6" /> Start Neural Scan
                </button>
              )}
              
              {processing && (
                <div className="text-center py-10 bg-dark-50 rounded-[2rem] border border-dark-100">
                  <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6" />
                  <p className="text-dark-900 font-black uppercase tracking-widest text-[10px]">Processing Telemetry...</p>
                </div>
              )}
              
              {error && <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 font-bold flex items-center gap-3"><AlertCircle /> {error}</div>}
              
              {extracted && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6 bg-dark-50/50 p-8 rounded-[2.5rem] border border-dark-100">
                     <div className="col-span-2 flex justify-between items-center mb-2 border-b border-dark-100 pb-4">
                        <span className="text-[10px] font-black text-dark-900 uppercase tracking-[0.3em]">Extracted Metadata</span>
                        <div className="flex items-center gap-2">
                           <div className="h-1.5 w-24 bg-dark-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${extracted.confidence}%` }} />
                           </div>
                           <span className="text-[10px] font-black">{Math.round(extracted.confidence)}%</span>
                        </div>
                     </div>
                     <MiniField label="Bill No" value={editedData.billNo} onChange={v => handleEditChange('billNo', v)} />
                     <MiniField label="Date" value={editedData.date} onChange={v => handleEditChange('date', v)} />
                     <MiniField label="Party Name" value={editedData.partyName} onChange={v => handleEditChange('partyName', v)} full />
                     <MiniField label="Amount" value={editedData.basicAmount} onChange={v => handleEditChange('basicAmount', v)} type="number" />
                     <MiniField label="Total" value={editedData.totalAmount} onChange={v => handleEditChange('totalAmount', v)} type="number" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => { setFile(null); setPreview(null); setExtracted(null); }} className="btn-secondary flex-1 py-4">Re-Scan</button>
                    <button onClick={() => onExtract(editedData)} className="btn-primary flex-1 py-4">Confirm Data</button>
                  </div>
                </div>
              )}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
        </div>
      </motion.div>
    </div>
  )
}

function MiniField({ label, value, onChange, type = "text", full }) {
  return (
    <div className={cn("space-y-1.5", full && "col-span-2")}>
       <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest ml-1">{label}</label>
       <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white border border-dark-100 rounded-xl px-4 py-2.5 text-sm font-black text-dark-900 focus:border-primary-500 transition-all outline-none" />
    </div>
  )
}

function BillModal({ clients, vehicles, bill, nextBillNo, extractedData, onClose, onSave }) {
  const [submitting, setSubmitting] = useState(false)
  const findClientByGst = (gst) => gst ? clients.find(c => c.gstNumber === gst)?.id || '' : ''

  const [f, setF] = useState({
    billNo: bill?.billNo || extractedData?.billNo || nextBillNo,
    billDate: bill?.billDate || extractedData?.date || new Date().toISOString().split('T')[0],
    client: { id: bill?.clientId || findClientByGst(extractedData?.partyGst) || '' },
    vehicle: { id: bill?.vehicleId || '' },
    hsnCode: bill?.hsnCode || extractedData?.hsnCode || '9973', 
    basicAmount: bill?.basicAmount || extractedData?.basicAmount || '', 
    gstPercentage: bill?.gstPercentage || '18', 
    pfAmount: bill?.pfAmount || '0', 
    billType: bill?.billType || extractedData?.billType || 'Diseal',
    companyName: bill?.companyName || extractedData?.companyName || '',
    companyGst: bill?.companyGst || extractedData?.companyGst || '',
    companyMobile: bill?.companyMobile || extractedData?.companyMobile || '',
    partyName: bill?.partyName || extractedData?.partyName || '',
    partyGst: bill?.partyGst || extractedData?.partyGst || '',
    partyPan: bill?.partyPan || extractedData?.partyPan || '',
    bankName: bill?.bankName || extractedData?.bankName || '',
    bankAccountNo: bill?.bankAccountNo || extractedData?.bankAccountNo || '',
    bankIfsc: bill?.bankIfsc || extractedData?.bankIfsc || '',
  })
  
  const basic = parseFloat(f.basicAmount) || 0
  const gst = parseFloat(f.gstPercentage) || 0
  const cgst = (basic * gst / 100) / 2
  const sgst = (basic * gst / 100) / 2
  const pf = parseFloat(f.pfAmount) || 0
  const total = basic + cgst + sgst + pf

  const handle = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = { ...f, cgstAmount: cgst, sgstAmount: sgst, totalAmount: total }
      if (bill?.id) await billAPI.update(bill.id, data)
      else await billAPI.create(data)
      onSave()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto premium-shadow">
        <div className="p-8 border-b border-dark-100 bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-black text-dark-900 tracking-tight">{bill ? 'Update' : 'Generate'} <span className="text-gradient">Invoice</span></h2>
          <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Financial Integrity Protocol</p>
        </div>
        <form onSubmit={handle} className="p-10 space-y-8 bg-mesh">
          <div className="grid grid-cols-2 gap-8">
            <FormGroup label="Bill No" value={f.billNo} onChange={v => setF({...f, billNo:v})} required />
            <FormGroup label="Date" value={f.billDate} onChange={v => setF({...f, billDate:v})} type="date" required />
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest mb-2 ml-1">Counterparty Selection</label>
              <select value={f.client.id} onChange={e => setF({...f, client:{id:e.target.value}})} className="interactive-field" required>
                <option value="">Select Protocol Party</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.partyName} ({c.gstNumber})</option>)}
              </select>
            </div>
            <FormGroup label="Basic Amount (₹)" value={f.basicAmount} onChange={v => setF({...f, basicAmount:v})} type="number" required />
            <FormGroup label="GST % Slab" value={f.gstPercentage} onChange={v => setF({...f, gstPercentage:v})} type="number" />
            <FormGroup label="HSN Code" value={f.hsnCode} onChange={v => setF({...f, hsnCode:v})} />
            <FormGroup label="P/F Charges" value={f.pfAmount} onChange={v => setF({...f, pfAmount:v})} type="number" />
          </div>

          <div className="p-8 bg-dark-900 text-white rounded-[2rem] space-y-4 shadow-xl">
             <div className="flex justify-between items-center opacity-60"><span className="text-[10px] font-black uppercase">Tax Breakdown</span> <span className="text-[10px] font-black font-mono tracking-widest">v1.2</span></div>
             <div className="flex justify-between text-sm font-bold"><span>Taxable Value</span><span>{formatCurrency(basic)}</span></div>
             <div className="flex justify-between text-sm opacity-80 font-medium"><span>Central Tax ({gst/2}%)</span><span>{formatCurrency(cgst)}</span></div>
             <div className="flex justify-between text-sm opacity-80 font-medium"><span>State Tax ({gst/2}%)</span><span>{formatCurrency(sgst)}</span></div>
             <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400">Consolidated Yield</span>
                <span className="text-3xl font-black tracking-tighter">{formatCurrency(total)}</span>
             </div>
          </div>
          
          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-4">Discard</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-4">{submitting ? 'Processing...' : (bill ? 'Commit Changes' : 'Generate Record')}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function StatMini({ label, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
  }
  return (
    <div className="bg-white rounded-3xl p-6 border border-dark-100 premium-shadow group hover:border-primary-500 transition-all">
      <div className="flex items-center gap-5">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-dark-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-dark-900 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}

function FormGroup({ label, value, onChange, type = "text", required }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest ml-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="interactive-field" required={required} />
    </div>
  )
}

function BillPrintModal({ bill, onClose }) {
  const [companyGst, setCompanyGst] = useState(null)
  useEffect(() => {
    tenantAPI.getMe().then(r => setCompanyGst(r.data?.gstNumber || 'N/A')).catch(() => setCompanyGst('N/A'))
  }, [])

  return (
    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto premium-shadow flex flex-col">
        <div className="p-8 border-b border-dark-100 flex justify-between items-center glass-card sticky top-0 z-10 bg-white/80">
           <h3 className="text-xl font-black text-dark-900 tracking-tight">Print Preview</h3>
           <div className="flex gap-3">
              <button onClick={() => window.print()} className="btn-primary py-2 px-6"><Printer className="w-4 h-4" /> Hard Copy</button>
              <button onClick={onClose} className="btn-secondary py-2">Close</button>
           </div>
        </div>
        <div className="p-12 font-inter" id="bill-print">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-black tracking-tight text-dark-900">SHREE SAMARTH ENTERPRISES</h1>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-dark-400 mt-2">Cement mixer Logistics & Infrastructure</p>
          </div>
          <div className="grid grid-cols-2 gap-12 mb-12 pb-12 border-b-2 border-dark-900">
             <div className="space-y-4">
                <p className="text-sm font-black uppercase tracking-widest text-dark-400">Transaction ID</p>
                <p className="text-2xl font-black text-dark-900">INV-{bill.billNo}</p>
                <p className="text-sm font-bold">{formatDate(bill.billDate)}</p>
             </div>
             <div className="text-right space-y-4">
                <p className="text-sm font-black uppercase tracking-widest text-dark-400">Company GSTIN</p>
                <p className="text-xl font-black text-dark-900">{companyGst}</p>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-12 mb-12">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-dark-400">Billed To</p>
                <p className="font-black text-lg text-dark-900">{bill.clientName}</p>
                <p className="text-sm font-bold text-dark-600">GST: {bill.clientGstNumber || 'NOT-SPECIFIED'}</p>
             </div>
             {bill.vehicleNumber && (
                <div className="text-right space-y-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-dark-400">Unit Reference</p>
                   <p className="font-black text-lg text-dark-900">{bill.vehicleNumber}</p>
                </div>
             )}
          </div>
          <table className="w-full mb-12">
             <thead>
                <tr className="border-y-2 border-dark-900">
                   <th className="py-4 text-left text-[10px] font-black uppercase tracking-widest">Operational Detail</th>
                   <th className="py-4 text-center text-[10px] font-black uppercase tracking-widest">HSN</th>
                   <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Amount (INR)</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-dark-100">
                <tr className="[&>td]:py-6">
                   <td className="font-bold text-sm">Services provided via {bill.billType || 'Standard'} Protocol</td>
                   <td className="text-center font-mono text-xs">{bill.hsnCode}</td>
                   <td className="text-right font-black">{formatCurrency(bill.basicAmount)}</td>
                </tr>
                {bill.pfAmount > 0 && (
                   <tr className="[&>td]:py-4">
                      <td className="text-sm">Packing & Forwarding</td>
                      <td className="text-center">-</td>
                      <td className="text-right">{formatCurrency(bill.pfAmount)}</td>
                   </tr>
                )}
             </tbody>
          </table>
          <div className="ml-auto w-1/2 space-y-3 font-outfit">
             <div className="flex justify-between text-sm"><span>Subtotal Value</span><span>{formatCurrency(bill.basicAmount)}</span></div>
             <div className="flex justify-between text-sm"><span>CGST ({bill.gstPercentage || 18 / 2}%)</span><span>{formatCurrency(bill.cgstAmount)}</span></div>
             <div className="flex justify-between text-sm"><span>SGST ({bill.gstPercentage || 18 / 2}%)</span><span>{formatCurrency(bill.sgstAmount)}</span></div>
             <div className="flex justify-between text-xl font-black pt-4 border-t-2 border-dark-900">
                <span className="uppercase tracking-widest text-xs mt-2">Aggregate Total</span>
                <span>{formatCurrency(bill.totalAmount)}</span>
             </div>
          </div>
          <div className="mt-20 pt-12 border-t border-dark-100 flex justify-between">
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-dark-400">Declaration</p>
                <p className="text-[9px] text-dark-500 max-w-xs leading-relaxed italic">This is an electronically generated record and does not require a physical holographic signature for official validation under the GST network protocols.</p>
             </div>
             <div className="text-right">
                <div className="w-48 h-px bg-dark-900 ml-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
