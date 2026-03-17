import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Download, Printer, Edit, Trash2, Upload, Camera, Check, AlertCircle, X } from 'lucide-react'
import { billAPI, clientAPI, vehicleAPI, ocrAPI } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

export default function Billing() {
  const [bills, setBills] = useState([])
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [editingBill, setEditingBill] = useState(null)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Billing</h1>
          <p className="text-dark-500">Generate & manage bills with GST</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg shadow-green-600/30">
            <Download className="w-5 h-5" />Export CSV
          </button>
          <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg shadow-purple-600/30">
            <Camera className="w-5 h-5" />Scan Invoice
          </button>
          <button onClick={() => { setExtractedData(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-600/30">
            <Plus className="w-5 h-5" />Create Bill
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <p className="text-emerald-100 text-sm">Total Billing Amount</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-4 border">
          <p className="text-dark-500 text-sm">Total Basic</p>
          <p className="text-xl font-bold text-dark-900 mt-1">{formatCurrency(totalBasic)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl p-4 border">
          <p className="text-dark-500 text-sm">Total CGST</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalCgst)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl p-4 border">
          <p className="text-dark-500 text-sm">Total SGST</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalSgst)}</p>
        </motion.div>
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-dark-600">Bill No</th>
                <th className="text-left p-4 text-sm font-semibold text-dark-600">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-dark-600">Party Name</th>
                <th className="text-left p-4 text-sm font-semibold text-dark-600">Party GST</th>
                <th className="text-right p-4 text-sm font-semibold text-dark-600">Basic</th>
                <th className="text-right p-4 text-sm font-semibold text-dark-600">GST</th>
                <th className="text-right p-4 text-sm font-semibold text-dark-600">Total</th>
                <th className="text-left p-4 text-sm font-semibold text-dark-600">Type</th>
                <th className="text-center p-4 text-sm font-semibold text-dark-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bills.map(b => (
                <tr key={b.id} className="hover:bg-dark-50">
                  <td className="p-4 font-medium">#{b.billNo}</td>
                  <td className="p-4">{formatDate(b.billDate)}</td>
                  <td className="p-4">{b.client?.partyName || '-'}</td>
                  <td className="p-4 text-xs font-mono">{b.client?.gstNumber || '-'}</td>
                  <td className="p-4 text-right">{formatCurrency(b.basicAmount)}</td>
                  <td className="p-4 text-right text-blue-600">{formatCurrency((parseFloat(b.cgstAmount)||0) + (parseFloat(b.sgstAmount)||0))}</td>
                  <td className="p-4 text-right font-bold text-primary-600">{formatCurrency(b.totalAmount)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      b.billType === 'Diseal' ? 'bg-orange-100 text-orange-700' : 
                      b.billType === 'Main' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {b.billType || 'General'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => setSelectedBill(b)}
                        className="p-2 hover:bg-dark-100 rounded-lg"
                        title="View Bill"
                      >
                        <Printer className="w-4 h-4 text-dark-600" />
                      </button>
                      <button 
                        onClick={() => setEditingBill(b)}
                        className="p-2 hover:bg-blue-50 rounded-lg"
                        title="Edit Bill"
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                      </button>
                      <button 
                        onClick={() => handleDelete(b.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-dark-50 font-bold">
              <tr>
                <td colSpan={4} className="p-4 text-right">Sub Total:</td>
                <td className="p-4 text-right">{formatCurrency(totalBasic)}</td>
                <td className="p-4 text-right">{formatCurrency(totalCgst + totalSgst)}</td>
                <td className="p-4 text-right text-primary-600">{formatCurrency(totalRevenue)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
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
      setExtracted(response.data)
    } catch (e) {
      console.error(e)
      setError('Failed to extract data. Please try again or enter manually.')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirm = () => {
    if (extracted) {
      onExtract(extracted)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Scan Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-lg">
            <X className="w-5 h-5" />
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
                  
                  <div className="bg-dark-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-dark-700">Extracted Data:</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-dark-500">Bill No:</span> <span className="font-medium">{extracted.billNo || 'N/A'}</span></div>
                      <div><span className="text-dark-500">Date:</span> <span className="font-medium">{extracted.date || 'N/A'}</span></div>
                      <div><span className="text-dark-500">Party:</span> <span className="font-medium">{extracted.partyName || 'N/A'}</span></div>
                      <div><span className="text-dark-500">GST:</span> <span className="font-medium">{extracted.partyGst || 'N/A'}</span></div>
                      <div><span className="text-dark-500">Basic:</span> <span className="font-medium">₹{extracted.basicAmount || 0}</span></div>
                      <div><span className="text-dark-500">Total:</span> <span className="font-medium">₹{extracted.totalAmount || 0}</span></div>
                      <div><span className="text-dark-500">HSN:</span> <span className="font-medium">{extracted.hsnCode || 'N/A'}</span></div>
                      <div><span className="text-dark-500">Type:</span> <span className="font-medium">{extracted.billType || 'N/A'}</span></div>
                    </div>
                    {extracted.confidence && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-dark-500 text-sm">Confidence:</span>
                          <div className="flex-1 h-2 bg-dark-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${(extracted.confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{Math.round((extracted.confidence || 0) * 100)}%</span>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{bill ? 'Edit Bill' : 'Create Bill'}</h2>
          {extractedData && (
            <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
              <Camera className="w-4 h-4" /> Data extracted from scanned invoice
            </p>
          )}
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
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
        
        <div className="p-4 border-t flex gap-3 justify-end">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Close</button>
        </div>
      </motion.div>
    </div>
  )
}
