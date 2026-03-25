import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MapPin, Calendar, Clock, Truck, Users, Building2, Package, Hash, DollarSign, Navigation, MoreVertical, Edit, Trash2, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { tripAPI, vehicleAPI, driverAPI, clientAPI, billAPI } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import { format } from 'date-fns'

export default function Trips() {
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [tripsRes, vehiclesRes, driversRes, clientsRes] = await Promise.all([
        tripAPI.getAll(),
        vehicleAPI.getAll(),
        driverAPI.getAll(),
        clientAPI.getAll()
      ])
      setTrips(tripsRes.data.sort((a, b) => new Date(b.tripDate) - new Date(a.tripDate)))
      setVehicles(vehiclesRes.data)
      setDrivers(driversRes.data)
      setClients(clientsRes.data)
    } catch (error) {
      console.error('Failed to load trips data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this trip record?')) {
      try {
        await tripAPI.delete(id)
        loadData()
      } catch (error) {
        console.error('Failed to delete trip:', error)
      }
    }
  }

  const handleConvertToBill = async (trip) => {
    if (!trip.client) {
      alert('This trip must have a client to generate a bill')
      return
    }
    if (!confirm(`Generate bill from Trip ${trip.tripNumber || trip.id} for ${formatCurrency(trip.tripCharges)}?`)) {
      return
    }
    try {
      const res = await tripAPI.convertToBill(trip.id)
      alert(`Bill ${res.data.bill.billNo} created successfully!`)
      loadData()
    } catch (error) {
      console.error('Failed to convert to bill:', error)
      alert(error.response?.data?.error || 'Failed to convert trip to bill')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Trip</span> Logistics
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Navigation className="w-3 h-3 text-primary-500" /> Active Fleet Operations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" /> Log New Dispatch
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-mesh rounded-[2.5rem] border border-dark-100">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full shadow-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {trips.length === 0 ? (
             <div className="bg-white rounded-[2.5rem] border border-dark-100 p-20 text-center bg-mesh">
                <div className="w-20 h-20 bg-dark-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-dark-100 shadow-xl">
                   <Navigation className="w-10 h-10 text-dark-200" />
                </div>
                <h3 className="text-xl font-black text-dark-900 uppercase tracking-tight">No Dispatch Records</h3>
                <p className="text-xs font-bold text-dark-400 uppercase tracking-widest mt-2">Initialize your fleet by logging the first operational trip.</p>
             </div>
          ) : (
            trips.map((trip, index) => (
              <motion.div
                key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[2rem] border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 overflow-hidden"
              >
                <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-mesh">
                  {/* Status & ID */}
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg",
                      trip.status === 'COMPLETED' ? "bg-emerald-600 shadow-emerald-200" :
                      trip.status === 'IN_PROGRESS' ? "bg-primary-600 shadow-primary-200" : "bg-rose-600 shadow-rose-200"
                    )}>
                      {trip.status === 'COMPLETED' ? <CheckCircle2 className="w-8 h-8" /> : 
                       trip.status === 'IN_PROGRESS' ? <Clock className="w-8 h-8 animate-pulse" /> : <AlertCircle className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-dark-400 uppercase tracking-widest">Voyage ID</span>
                        <span className="text-xs font-black text-dark-900 tracking-tight">#{trip.tripNumber || trip.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ml-2 border",
                          trip.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          trip.status === 'IN_PROGRESS' ? "bg-primary-50 text-primary-600 border-primary-100" : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {trip.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-dark-900 flex items-center gap-2 font-outfit">
                        {trip.siteLocation || 'Terminal Site Alpha'}
                      </h3>
                      <p className="text-xs font-bold text-dark-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-primary-500" /> {format(new Date(trip.tripDate), 'dd MMMM yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Operational Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 max-w-3xl">
                    <TripStat icon={Truck} label="Unit" value={trip.vehicle?.vehicleNumber} />
                    <TripStat icon={Users} label="Operator" value={trip.driver?.name} />
                    <TripStat icon={Package} label="Payload" value={trip.materialType || 'General'} sub={`${trip.quantity || 0} Tons`} />
                    <TripStat icon={DollarSign} label="Yield" value={formatCurrency(trip.tripCharges)} color="primary" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pl-8 border-l border-dark-100/50">
                    {trip.status !== 'BILLED' && trip.client && (
                      <button 
                        onClick={() => handleConvertToBill(trip)} 
                        className="p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 hover:text-emerald-600 transition-all border border-emerald-100 text-emerald-500"
                        title="Convert to Bill"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    )}
                    {trip.status === 'BILLED' && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                        BILLED
                      </span>
                    )}
                    <button onClick={() => { setSelectedTrip(trip); setShowModal(true); }} className="p-3 bg-dark-50 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all border border-dark-100">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(trip.id)} className="p-3 bg-dark-50 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-dark-100 text-rose-400">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Expandable Meta (Implicit) */}
                <div className="px-8 py-4 bg-dark-50/30 border-t border-dark-100/50 flex flex-wrap gap-6 text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Building2 className="w-3 h-3" /> Client: <span className="text-dark-900">{trip.client?.partyName || 'Private Unit'}</span></div>
                  <div className="flex items-center gap-2"><Navigation className="w-3 h-3" /> Distance: <span className="text-dark-900">{trip.distance || 0} KM</span></div>
                  {trip.startTime && <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> Start: <span className="text-dark-900">{format(new Date(trip.startTime), 'HH:mm')}</span></div>}
                  {trip.endTime && <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> End: <span className="text-dark-900">{format(new Date(trip.endTime), 'HH:mm')}</span></div>}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <TripModal
          trip={selectedTrip}
          vehicles={vehicles}
          drivers={drivers}
          clients={clients}
          onClose={() => { setShowModal(false); setSelectedTrip(null); }}
          onSave={() => { setShowModal(false); setSelectedTrip(null); loadData(); }}
        />
      )}
    </div>
  )
}

function TripStat({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-dark-50 rounded-xl flex items-center justify-center border border-dark-100">
        <Icon className={cn("w-5 h-5", color === 'primary' ? 'text-primary-600' : 'text-dark-400')} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-dark-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className={cn("text-xs font-black text-dark-900 truncate uppercase tracking-tight", color === 'primary' && 'text-primary-600')}>{value || 'N/A'}</p>
        {sub && <p className="text-[8px] font-bold text-dark-400 leading-none mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function TripModal({ trip, vehicles, drivers, clients, onClose, onSave }) {
  const [formData, setFormData] = useState({
    tripNumber: trip?.tripNumber || '',
    tripDate: trip?.tripDate || new Date().toISOString().split('T')[0],
    vehicleId: trip?.vehicle?.id || '',
    driverId: trip?.driver?.id || '',
    clientId: trip?.client?.id || '',
    siteLocation: trip?.siteLocation || '',
    materialType: trip?.materialType || '',
    quantity: trip?.quantity || '',
    tripCharges: trip?.tripCharges || '',
    distance: trip?.distance || '',
    startTime: trip?.startTime ? new Date(trip.startTime).toISOString().slice(0, 16) : '',
    endTime: trip?.endTime ? new Date(trip.endTime).toISOString().slice(0, 16) : '',
    status: trip?.status || 'IN_PROGRESS',
    notes: trip?.notes || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        vehicle: { id: formData.vehicleId },
        driver: formData.driverId ? { id: formData.driverId } : null,
        client: formData.clientId ? { id: formData.clientId } : null,
        quantity: parseFloat(formData.quantity) || 0,
        tripCharges: parseFloat(formData.tripCharges) || 0,
        distance: parseFloat(formData.distance) || 0,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null
      }
      
      if (trip?.id) {
        await tripAPI.update(trip.id, payload)
      } else {
        await tripAPI.create(payload)
      }
      onSave()
    } catch (error) {
      console.error('Failed to save trip:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col premium-shadow">
        <div className="p-8 border-b border-dark-100 flex items-center justify-between glass-card font-outfit">
          <div>
            <h2 className="text-2xl font-black text-dark-900 tracking-tight">{trip ? 'Modify' : 'Log'} <span className="text-gradient">Voyage</span></h2>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">Operational Dispatch Registry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-100 rounded-full transition-colors"><Plus className="w-8 h-8 rotate-45 text-dark-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto bg-mesh font-inter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FormGroup 
              label="Voyage Number" 
              value={formData.tripNumber} 
              onChange={(v) => setFormData({ ...formData, tripNumber: v })} 
              placeholder={trip ? "e.g. TR-2024-001" : "AUTO-GENERATED"} 
              helperText={!trip && "Leave empty for automatic numbering"}
            />
            <FormGroup label="Operational Date" value={formData.tripDate} onChange={(v) => setFormData({ ...formData, tripDate: v })} type="date" required />
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Voyage Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="interactive-field">
                <option value="IN_PROGRESS">Active - In Progress</option>
                <option value="COMPLETED">Finalized - Completed</option>
                <option value="CANCELLED">Terminated - Cancelled</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Active Unit</label>
              <select value={formData.vehicleId} onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })} className="interactive-field" required>
                <option value="">Assign Vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Unit Operator</label>
              <select value={formData.driverId} onChange={(e) => setFormData({ ...formData, driverId: e.target.value })} className="interactive-field">
                <option value="">Select Operator</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Partner Client</label>
              <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="interactive-field">
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.partyName}</option>)}
              </select>
            </div>

            <FormGroup label="Site Location" value={formData.siteLocation} onChange={(v) => setFormData({ ...formData, siteLocation: v })} placeholder="Terminal / Site Name" />
            <FormGroup label="Material Payload" value={formData.materialType} onChange={(v) => setFormData({ ...formData, materialType: v })} placeholder="e.g. Concrete, Sand" />
            <FormGroup label="Quantity (Tons)" value={formData.quantity} onChange={(v) => setFormData({ ...formData, quantity: v })} type="number" />
            <FormGroup label="Dispatch Charges" value={formData.tripCharges} onChange={(v) => setFormData({ ...formData, tripCharges: v })} type="number" />
            <FormGroup label="Distance (KM)" value={formData.distance} onChange={(v) => setFormData({ ...formData, distance: v })} type="number" />
            <div className="md:col-span-1" />
            
            <FormGroup label="Dispatched At" value={formData.startTime} onChange={(v) => setFormData({ ...formData, startTime: v })} type="datetime-local" />
            <FormGroup label="Finalized At" value={formData.endTime} onChange={(v) => setFormData({ ...formData, endTime: v })} type="datetime-local" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">Operational Intelligence (Notes)</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="interactive-field resize-none h-24" placeholder="Log details, challenges, or specific trip events..." />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-dark-50">
            <button type="button" onClick={onClose} className="btn-secondary">Dismiss</button>
            <button type="submit" className="btn-primary px-10">Authorize Voyage</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function FormGroup({ label, value, onChange, type = "text", required, placeholder, helperText }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-dark-400 uppercase tracking-widest">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="interactive-field" 
        required={required}
        placeholder={placeholder}
      />
      {helperText && <p className="text-[8px] font-bold text-primary-500 uppercase tracking-tight ml-1">{helperText}</p>}
    </div>
  )
}
