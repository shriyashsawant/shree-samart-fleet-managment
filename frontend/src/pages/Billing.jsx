import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Download, Printer, Edit, Trash2, Upload, Camera, Check, AlertCircle, X, Search } from 'lucide-react'
import { billAPI, clientAPI, vehicleAPI, ocrAPI } from '../lib/api'
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

  // Delete bill
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      try {
        await billAPI.delete(id)
        loadData()
      } catch (e) { console.error(e) }
    }
  }

  // Export to Excel format (matching the Excel sheet)
  const exportToExcel = () => {
    const headers = ['Sr No', 'Date', 'Bill No', 'Party Name', 'Party Gst No', 'HSN Code', 'GST %', 'Basic', 'CGST Amount', 'SGST Amount', 'P/F', 'Total', 'Bill Type']
    const rows = bills.map((bill, index) => [
      index + 1,
      bill.billDate ? new Date(bill.billDate).toLocaleDateString('en-GB') : '',
      bill.billNo || '',
      bill.client?.partyName || '',
      bill.client?.gstNumber || '',
      bill.hsnCode || '',
      bill.gstPercentage || '',
      bill.basicAmount || 0,
      bill.cgstAmount || 0,
      bill.sgstAmount || 0,
      bill.pfAmount || 0,
      bill.totalAmount || 0,
      bill.billType || ''
    ])

    // Add subtotal row
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Sub Total:',
      totalBasic.toFixed(2),
      totalCgst.toFixed(2),
      totalSgst.toFixed(2),
      '0',
      totalRevenue.toFixed(2),
      ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Shree_Samarth_Bills_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Handle OCR upload and create bill
  const handleOcrComplete = (data) => {
    setExtractedData(data)
    setShowUploadModal(false)
    setShowModal(true)
  }

  const filteredBills = bills.filter(b => 
    b.billNo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.client?.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
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
                        <span className="text-sm font-black text-dark-800 tracking-tight">{b.client?.partyName || '-'}</span>
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.1em] mt-1">{b.client?.gstNumber || 'NON-GST'}</span>
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
    
    setProcessing(true)
    setError(null)
    
    try {
      const response = await ocrAPI.extractInvoice(file)
      const raw = response.data
      
      const normalized = {
        billNo: raw.bill_no || '',
        date: raw.date || '',
        partyName: raw.party_name || '',
        partyGst: raw.party_gst || '',
        companyGst: raw.company_gst || '',
        basicAmount: raw.basic_amount || '',
        totalAmount: raw.total_amount || '',
        hsnCode: raw.hsn_code || '',
        billType: raw.bill_type || '',
        confidence: raw.confidence || 0,
      }
      
      setExtracted(normalized)
      setEditedData(normalized)
    } catch (e) {
      console.error('OCR error:', e)
      setError('Failed to extract data. Please try again or enter manually.')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirm = () => {
    if (editedData) {
      onExtract(editedData)
    }
  }

  const handleEditChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value })
  }

  return (
    <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col premium-shadow">
        <div className="p-6 border-b border-dark-100 flex justify-between items-center glass-card">
          <div>
            <h2 className="text-2xl font-black text-dark-900 tracking-tight">Lens <span className="text-gradient">Scanner</span></h2>
            <p className="text-xs text-dark-500 font-bold uppercase tracking-widest mt-0.5">Automated Intelligence</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Upload Area */}
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-dark-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto text-dark-400 mb-4" />
              <p className="text-lg font-medium text-dark-600">Drop invoice here</p>
              <p className="text-dark-400 text-sm mt-1">or click to browse</p>
              <p className="text-dark-400 text-xs mt-2">Supports: JPG, PNG, PDF</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border">
                <img src={preview} alt="Invoice preview" className="w-full max-h-64 object-contain bg-dark-100" />
                <button 
                  onClick={() => { setFile(null); setPreview(null); setExtracted(null); }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {!extracted && !processing && (
                <button 
                  onClick={handleExtract}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Extract Data
                </button>
              )}
              
              {processing && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-dark-600">Processing invoice...</p>
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}
              
              {extracted && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5" />
                    Data extracted successfully!
                  </div>
                  
                  <div className="bg-dark-50 rounded-xl p-5 space-y-4 border border-dark-100">
                    <div className="flex justify-between items-center pb-2 border-b border-dark-100">
                      <h3 className="text-sm font-black text-dark-900 uppercase tracking-widest">Extracted Intelligence</h3>
                      <span className="text-[10px] font-bold text-dark-400">EDITABLE FIELDS</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Bill Number</label>
                        <input 
                          type="text" 
                          value={editedData?.billNo || ''} 
                          onChange={(e) => handleEditChange('billNo', e.target.value)}
                          className="w-full bg-white border border-dark-200 rounded-lg px-3 py-1.5 text-sm font-black text-primary-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Transaction Date</label>
                        <input 
                          type="text" 
                          value={editedData?.date || ''} 
                          onChange={(e) => handleEditChange('date', e.target.value)}
                          className="w-full bg-white border border-dark-200 rounded-lg px-3 py-1.5 text-sm font-black text-dark-700"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Counterparty Identification</label>
                        <input 
                          type="text" 
                          value={editedData?.partyName || ''} 
                          onChange={(e) => handleEditChange('partyName', e.target.value)}
                          className="w-full bg-white border border-dark-200 rounded-lg px-3 py-1.5 text-sm font-black text-dark-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest">GST Validation ID</label>
                        <input 
                          type="text" 
                          value={editedData?.partyGst || ''} 
                          onChange={(e) => handleEditChange('partyGst', e.target.value)}
                          className="w-full bg-white border border-dark-200 rounded-lg px-3 py-1.5 text-sm font-black text-dark-700 uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest">HSN Code</label>
                        <input 
                          type="text" 
                          value={editedData?.hsnCode || ''} 
                          onChange={(e) => handleEditChange('hsnCode', e.target.value)}
                          className="w-full bg-white border border-dark-200 rounded-lg px-3 py-1.5 text-sm font-black text-dark-700 uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Basic Amount (₹)</label>
                        <input 
                          type="number" 
                          value={editedData?.basicAmount || ''} 
                          onChange={(e) => handleEditChange('basicAmount', e.target.value)}
                          className="w-full bg-white border border-dark-200 rounded-lg px-3 py-1.5 text-sm font-black text-primary-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Total Yield (₹)</label>
                        <input 
                          type="number" 
                          value={editedData?.totalAmount || ''} 
                          onChange={(e) => handleEditChange('totalAmount', e.target.value)}
                          className="w-full bg-white border border-dark-200 rounded-lg px-3 py-1.5 text-sm font-black text-emerald-600"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Company GST</label>
                        <input 
                          type="text" 
                          value={editedData?.companyGst || ''} 
                          onChange={(e) => handleEditChange('companyGst', e.target.value)}
                          className="w-full bg-white border border-dark-200 rounded-lg px-3 py-1.5 text-sm font-black text-dark-700 uppercase"
                        />
                      </div>
                      </div>
                    </div>

                    {extracted.confidence !== undefined && (
                      <div className="pt-3 border-t border-dark-100">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] font-black text-dark-400 uppercase tracking-widest">Engine Confidence</span>
                          <div className="flex-1 h-1.5 bg-dark-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary-500 to-emerald-500" 
                              style={{ width: `${extracted.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-dark-900 tracking-tighter">{Math.round(extracted.confidence)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setFile(null); setPreview(null); setExtracted(null); }}
                      className="flex-1 py-2 border rounded-lg"
                    >
                      Scan Another
                    </button>
                    <button 
                      onClick={handleConfirm}
                      className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium"
                    >
                      Use This Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
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
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white rounded-2xl p-5 border border-dark-100 shadow-sm group hover:border-primary-200 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color] || colors.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-dark-400 text-[10px] font-bold uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-dark-900 tracking-tight">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

function BillModal({ clients, vehicles, bill, nextBillNo, extractedData, onClose, onSave }) {
  // Find matching client by GST number
  const findClientByGst = (gst) => {
    if (!gst) return ''
    return clients.find(c => c.gstNumber === gst)?.id || ''
  }

  const [f, setF] = useState({ 
    billNo: bill?.billNo || extractedData?.billNo || nextBillNo,
    billDate: bill?.billDate || extractedData?.date || new Date().toISOString().split('T')[0], 
    client: { id: bill?.client?.id || findClientByGst(extractedData?.partyGst) || '' }, 
    vehicle: { id: bill?.vehicle?.id || '' }, 
    hsnCode: bill?.hsnCode || extractedData?.hsnCode || '9973', 
    basicAmount: bill?.basicAmount || extractedData?.basicAmount || '', 
    gstPercentage: bill?.gstPercentage || '18', 
    pfAmount: bill?.pfAmount || '0', 
    billType: bill?.billType || extractedData?.billType || 'Diseal' 
  })
  
  const basic = parseFloat(f.basicAmount) || 0
  const gst = parseFloat(f.gstPercentage) || 0
  const cgst = (basic * gst / 100) / 2
  const sgst = (basic * gst / 100) / 2
  const pf = parseFloat(f.pfAmount) || 0
  const total = basic + cgst + sgst + pf

  const handle = async (e) => {
    e.preventDefault()
    try {
      const data = { ...f, cgstAmount: cgst, sgstAmount: sgst, totalAmount: total }
      if (bill?.id) {
        await billAPI.update(bill.id, data)
      } else {
        await billAPI.create(data)
      }
      onSave()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto premium-shadow">
        <div className="p-6 border-b border-dark-100 glass-card">
          <h2 className="text-2xl font-black text-dark-900 tracking-tight">{bill ? 'Update' : 'Generate'} <span className="text-gradient">Invoice</span></h2>
          {extractedData && (
            <div className="flex items-center gap-2 mt-2 py-1 px-3 bg-purple-50 text-purple-600 rounded-lg w-fit">
              <Camera className="w-4 h-4" /> 
              <span className="text-[10px] font-bold uppercase tracking-widest">AI Assisted Data</span>
            </div>
          )}
        </div>
        <form onSubmit={handle} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bill No</label>
              <input 
                type="text" 
                value={f.billNo} 
                onChange={(e) => setF({ ...f, billNo: e.target.value })} 
                className="w-full p-2 border rounded-lg" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input 
                type="date" 
                value={f.billDate} 
                onChange={(e) => setF({ ...f, billDate: e.target.value })} 
                className="w-full p-2 border rounded-lg" 
                required 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Party Name</label>
              <select 
                value={f.client.id} 
                onChange={(e) => setF({ ...f, client: { id: e.target.value } })} 
                className="w-full p-2 border rounded-lg" 
                required
              >
                <option value="">Select Party</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.partyName} ({c.gstNumber})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle (Optional)</label>
              <select 
                value={f.vehicle.id} 
                onChange={(e) => setF({ ...f, vehicle: { id: e.target.value } })} 
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bill Type</label>
              <select 
                value={f.billType} 
                onChange={(e) => setF({ ...f, billType: e.target.value })} 
                className="w-full p-2 border rounded-lg"
              >
                <option value="Diseal">Diseal (Diesel)</option>
                <option value="Main">Main</option>
                <option value="Rent">Rent</option>
                <option value="Service">Service</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">HSN Code</label>
              <input 
                value={f.hsnCode} 
                onChange={(e) => setF({ ...f, hsnCode: e.target.value })} 
                className="w-full p-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GST %</label>
              <input 
                type="number" 
                value={f.gstPercentage} 
                onChange={(e) => setF({ ...f, gstPercentage: e.target.value })} 
                className="w-full p-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Basic Amount (₹)</label>
              <input 
                type="number" 
                value={f.basicAmount} 
                onChange={(e) => setF({ ...f, basicAmount: e.target.value })} 
                className="w-full p-2 border rounded-lg" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">P/F Charges (₹)</label>
              <input 
                type="number" 
                value={f.pfAmount} 
                onChange={(e) => setF({ ...f, pfAmount: e.target.value })} 
                className="w-full p-2 border rounded-lg" 
              />
            </div>
          </div>
          
          {/* GST Calculation Preview */}
          <div className="p-4 bg-dark-50 rounded-lg space-y-2">
            <div className="flex justify-between"><span className="text-dark-600">Basic Amount</span><span className="font-medium">₹{basic.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-dark-600">CGST ({f.gstPercentage/2}%)</span><span className="font-medium">₹{cgst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-dark-600">SGST ({f.gstPercentage/2}%)</span><span className="font-medium">₹{sgst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-dark-600">P/F</span><span className="font-medium">₹{pf.toFixed(2)}</span></div>
            <div className="flex justify-between pt-2 border-t font-bold text-lg"><span>Total</span><span className="text-primary-600">₹{total.toFixed(2)}</span></div>
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 p-2 border rounded-lg">Cancel</button>
            <button type="submit" className="flex-1 p-2 bg-primary-600 text-white rounded-lg">{bill ? 'Update Bill' : 'Generate Bill'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function BillPrintModal({ bill, onClose }) {
  const client = bill.client || {}
  const basic = parseFloat(bill.basicAmount) || 0
  const cgst = parseFloat(bill.cgstAmount) || 0
  const sgst = parseFloat(bill.sgstAmount) || 0
  const pf = parseFloat(bill.pfAmount) || 0
  const total = parseFloat(bill.totalAmount) || 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Bill Print View */}
        <div className="p-8" id="bill-print">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-dark-900">SHREE SAMARTH ENTERPRISES</h1>
            <p className="text-dark-500">Cement Mixer Services</p>
          </div>
          
          <div className="border-b-2 border-dark-800 mb-4 pb-2">
            <div className="flex justify-between">
              <div>
                <p className="font-bold">Bill No: {bill.billNo}</p>
                <p>Date: {formatDate(bill.billDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">GSTIN: 27ASXPP6488L1ZD</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <p><span className="font-medium">Party Name:</span> {client.partyName || '-'}</p>
            <p><span className="font-medium">Party GST No:</span> {client.gstNumber || '-'}</p>
            {bill.vehicle && <p><span className="font-medium">Vehicle:</span> {bill.vehicle.vehicleNumber}</p>}
          </div>
          
          <table className="w-full border mb-4">
            <thead className="bg-dark-100">
              <tr>
                <th className="border p-2 text-left">HSN Code</th>
                <th className="border p-2 text-right">Basic Amount</th>
                <th className="border p-2 text-right">GST %</th>
                <th className="border p-2 text-right">CGST</th>
                <th className="border p-2 text-right">SGST</th>
                <th className="border p-2 text-right">P/F</th>
                <th className="border p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">{bill.hsnCode}</td>
                <td className="border p-2 text-right">₹{basic.toFixed(2)}</td>
                <td className="border p-2 text-right">{bill.gstPercentage}%</td>
                <td className="border p-2 text-right">₹{cgst.toFixed(2)}</td>
                <td className="border p-2 text-right">₹{sgst.toFixed(2)}</td>
                <td className="border p-2 text-right">₹{pf.toFixed(2)}</td>
                <td className="border p-2 text-right font-bold">₹{total.toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot className="bg-dark-50 font-bold">
              <tr>
                <td colSpan={5} className="border p-2 text-right">Total:</td>
                <td className="border p-2 text-right">₹{pf.toFixed(2)}</td>
                <td className="border p-2 text-right">₹{total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div className="text-center text-sm text-dark-500 mt-8">
            <p>Thank you for your business!</p>
          </div>
        </div>
        
        <div className="p-8 border-t border-dark-100 glass-card flex gap-3 justify-end sticky bottom-0">
          <button onClick={() => window.print()} className="btn-primary">
            <Printer className="w-4 h-4" /> Print Document
          </button>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </motion.div>
    </div>
  )
}
