import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Package, Edit, Trash2, Activity, Search, AlertTriangle, CheckCircle2, X, ShoppingCart, RefreshCcw, Filter, Layers } from 'lucide-react'
import { inventoryAPI } from '../lib/api'
import { cn } from '../lib/utils'

const CATEGORIES = ['Spare Parts', 'Oil & Lubricants', 'Filters', 'Tyres', 'Electrical', 'Hardware']
const UNITS = ['Nos', 'Liters', 'Kgs', 'Sets']

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await inventoryAPI.getAll()
      setItems(res.data)
    } catch (error) {
      console.error('Teletransmission failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('AUTHORIZE DESTRUCTION of this inventory asset record?')) {
      try {
        await inventoryAPI.delete(id)
        loadData()
      } catch (error) {
        console.error('Authorization failed:', error)
      }
    }
  }

  const handleStockAdjust = async (id, qty) => {
    try {
      await inventoryAPI.adjustStock(id, qty)
      loadData()
    } catch (error) {
      console.error('Adjustment failed:', error)
    }
  }

  const filteredItems = items.filter(i => 
    (selectedCategory === 'All' || i.category === selectedCategory) &&
    i.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockCount = items.filter(i => i.quantityInStock <= i.reorderLevel).length

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Spares</span> & Spares
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Package className="w-3 h-3 text-primary-500" /> Maintenance Stock Console
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Enroll Asset
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <SummaryCard label="Unique Assets" value={items.length} icon={Layers} color="text-primary-600" />
         <SummaryCard label="Critical Spares" value={lowStockCount} icon={AlertTriangle} color="text-rose-500" highlight={lowStockCount > 0} />
         <SummaryCard label="Fleet Readiness" value="94%" icon={Activity} color="text-emerald-500" />
      </div>

      {/* Control Console */}
      <div className="bg-white rounded-[2.5rem] border border-dark-100 p-8 premium-shadow bg-mesh flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within:text-primary-500 transition-colors" />
          <input type="text" placeholder="Search by Asset Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-dark-50/50 border border-dark-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                selectedCategory === cat ? 'bg-dark-900 text-white shadow-xl' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-mesh rounded-[2.5rem] border border-dark-100">
           <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border border-dark-100 bg-mesh">
               <Package className="w-16 h-16 text-dark-100 mx-auto mb-6" />
               <h3 className="text-xl font-black text-dark-900 uppercase tracking-tight">No Tracked Maintenance Assets</h3>
               <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-2">Initialize inventory tracking to monitor oil, filters, and spare parts across the fleet.</p>
            </div>
          ) : (
            filteredItems.map((item, i) => {
              const IS_LOW = item.quantityInStock <= item.reorderLevel
              return (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className={cn("bg-white rounded-[2.5rem] border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 overflow-hidden bg-mesh", 
                    IS_LOW && "border-rose-200"
                  )}
                >
                  <div className="p-8">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                           <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", IS_LOW ? "bg-rose-500" : "bg-dark-900")}>
                              <Package className="w-5 h-5" />
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-dark-900 leading-none">{item.itemName}</h4>
                              <p className="text-[9px] font-bold text-dark-400 uppercase tracking-widest mt-1">{item.category}</p>
                           </div>
                        </div>
                        {IS_LOW && (
                          <div className="px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg animate-pulse">
                             <AlertTriangle className="w-3 h-3 text-rose-600" />
                          </div>
                        )}
                     </div>

                     <div className="space-y-6">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-dark-300 uppercase tracking-[0.2em] mb-2">Available Stock</span>
                           <div className="flex items-baseline gap-2">
                              <span className={cn("text-4xl font-black tracking-tighter", IS_LOW ? "text-rose-600" : "text-dark-900")}>{item.quantityInStock}</span>
                              <span className="text-xs font-bold text-dark-400 uppercase tracking-widest">{item.unit}</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={() => handleStockAdjust(item.id, 1)} className="flex items-center justify-center gap-2 py-3 bg-dark-50 rounded-xl hover:bg-dark-900 hover:text-white transition-all group/btn border border-dark-100">
                              <Plus className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Restock</span>
                           </button>
                           <button onClick={() => handleStockAdjust(item.id, -1)} className="flex items-center justify-center gap-2 py-3 bg-dark-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all group/btn border border-dark-100" disabled={item.quantityInStock <= 0}>
                              <X className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Consume</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="px-8 py-6 bg-dark-50/50 flex justify-between items-center border-t border-dark-100/50 group-hover:bg-primary-50 transition-colors">
                     <span className="text-[10px] font-black text-dark-400 uppercase tracking-widest">Threshold: {item.reorderLevel} {item.unit}</span>
                     <div className="flex gap-2">
                        <button onClick={() => { setSelectedItem(item); setShowModal(true); }} className="p-2 bg-white rounded-lg border border-dark-100 text-dark-400 hover:text-primary-600 transition-all shadow-sm"><Edit className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-white rounded-lg border border-rose-100 text-rose-400 hover:text-rose-600 transition-all shadow-sm"><Trash2 className="w-3 h-3" /></button>
                     </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      )}

      {showModal && (
        <InventoryModal item={selectedItem} onClose={() => { setShowModal(false); setSelectedItem(null); }} onSave={() => { setShowModal(false); setSelectedItem(null); loadData(); }} />
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color, highlight }) {
  return (
    <div className={cn("bg-white p-8 rounded-[2.5rem] border border-dark-100 premium-shadow bg-mesh overflow-hidden relative group", highlight && "ring-2 ring-rose-500/20")}>
       <div className="relative z-10">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg", color.replace('text-', 'bg-').replace('600', '600').replace('500', '500'))}>
             <Icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-3xl font-black text-dark-900 tracking-tighter leading-none">{value}</p>
       </div>
       <Icon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
    </div>
  )
}

function InventoryModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    itemName: item?.itemName || '',
    category: item?.category || CATEGORIES[0],
    quantityInStock: item?.quantityInStock || 0,
    unit: item?.unit || UNITS[0],
    reorderLevel: item?.reorderLevel || 5
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (item?.id) await inventoryAPI.update(item.id, formData)
      else await inventoryAPI.create(formData)
      onSave()
    } catch (error) {
      console.error('Teletransmission failed:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden flex flex-col premium-shadow">
        <div className="p-8 border-b border-dark-100 flex items-center justify-between glass-card font-outfit uppercase">
          <div>
            <h3 className="text-2xl font-black text-dark-900 tracking-tight">Enrol <span className="text-gradient">Maintenance</span> Asset</h3>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Operational Inventory Hub</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-full transition-colors"><X className="w-8 h-8 text-dark-200" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-mesh font-inter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5 md:col-span-2">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Asset Name</label>
               <input type="text" required value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="interactive-field" placeholder="e.g. 15W40 Engine Oil (HP)" />
            </div>
            
            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Inventory Category</label>
               <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="interactive-field">
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Measurement Unit</label>
               <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="interactive-field">
                 {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
               </select>
            </div>

            <FormGroup label="Initial Stock" value={formData.quantityInStock} onChange={(v) => setFormData({ ...formData, quantityInStock: v })} type="number" required />
            <FormGroup label="Reorder Threshold" value={formData.reorderLevel} onChange={(v) => setFormData({ ...formData, reorderLevel: v })} type="number" required />
          </div>

          <div className="flex gap-4 pt-6 mt-6 border-t border-dark-50">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Abort</button>
            <button type="submit" className="btn-primary flex-1">Authorize Registry</button>
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
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="interactive-field" placeholder={`Enter ${label}...`} />
    </div>
  )
}
