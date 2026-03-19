import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Truck, Users, DollarSign, Activity, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Zap, Target, Navigation } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import { dashboardAPI, tripAPI } from '../lib/api'
import { formatCurrency, cn } from '../lib/utils'
import { format } from 'date-fns'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

const mockMonthlyData = [
  { month: 'Jan', revenue: 320000, expenses: 180000 },
  { month: 'Feb', revenue: 350000, expenses: 195000 },
  { month: 'Mar', revenue: 380000, expenses: 210000 },
  { month: 'Apr', revenue: 360000, expenses: 185000 },
  { month: 'May', revenue: 420000, expenses: 220000 },
  { month: 'Jun', revenue: 450000, expenses: 235000 },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      const [response, tripsRes] = await Promise.all([
        dashboardAPI.getStats(),
        tripAPI.getAll()
      ])
      setStats(response.data)
      setTrips(tripsRes.data.slice(0, 3))
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setStats({
        totalVehicles: 0,
        activeDrivers: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        profit: 0,
        upcomingReminders: [],
        vehiclePerformance: []
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Fleet Strength', value: stats?.totalVehicles || 0, icon: Truck, trend: '+0', color: 'indigo' },
    { title: 'Active Operators', value: stats?.activeDrivers || 0, icon: Users, trend: '+1', color: 'emerald' },
    { title: 'Gross Revenue', value: formatCurrency(stats?.monthlyRevenue || 0), icon: Zap, trend: '+12%', color: 'primary' },
    { title: 'Operational Burn', value: formatCurrency(stats?.monthlyExpenses || 0), icon: Activity, trend: '+5%', color: 'amber' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            <span className="text-gradient">Command</span> Center
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary-500" /> Real-time Fleet Intelligence
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest leading-none">Operational Cycle</p>
          <p className="text-sm font-black text-dark-900 mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-[2rem] p-8 border border-dark-100 premium-shadow group hover:border-primary-500 transition-all duration-500 bg-mesh relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                 <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                   stat.color === 'indigo' ? "bg-indigo-600 shadow-indigo-200" :
                   stat.color === 'emerald' ? "bg-emerald-600 shadow-emerald-200" :
                   stat.color === 'primary' ? "bg-primary-600 shadow-primary-200" : "bg-amber-600 shadow-amber-200"
                 )}>
                   <stat.icon className="w-6 h-6" />
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                   <ArrowUpRight className="w-3 h-3" /> {stat.trend}
                 </div>
              </div>
              <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest leading-none">{stat.title}</p>
              <p className="text-2xl font-black text-dark-900 mt-2 tracking-tight">{stat.value}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                <stat.icon className="w-32 h-32" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Dispatch Feed */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.35 }}
           className="lg:col-span-3 bg-dark-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary-900/40"
        >
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 blur-[100px] -mr-48 -mt-48" />
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="flex-1">
                 <h3 className="text-xl font-black uppercase tracking-tight mb-2">Live <span className="text-primary-500">Dispatch</span> Feed</h3>
                 <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest leading-none">Real-time voyage tracking and personnel telemetry</p>
              </div>
              
              <div className="flex-[2] grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                 {trips.map((trip, i) => (
                   <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 group hover:bg-white/10 transition-all cursor-default relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2">
                            <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", trip.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary-500')} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-400 leading-none">{trip.status}</span>
                         </div>
                         <span className="text-[9px] font-black opacity-40 leading-none">#{trip.tripNumber?.slice(-4) || trip.id}</span>
                      </div>
                      <p className="text-sm font-black truncate uppercase tracking-tight">{trip.siteLocation || 'Transit Site'}</p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 leading-none">
                            <Truck className="w-4 h-4" /> {trip.vehicle?.vehicleNumber?.slice(-4) || 'UNIT'}
                         </span>
                         <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono leading-none">
                            {formatCurrency(trip.tripCharges)}
                         </span>
                      </div>
                   </div>
                 ))}
                 {trips.length === 0 && (
                   <div className="md:col-span-3 py-10 text-center text-dark-400 font-bold text-[10px] uppercase tracking-widest border border-white/5 rounded-3xl border-dashed">
                      Idle Fleet - Waiting for Active Dispatch Cycle
                   </div>
                 )}
              </div>
           </div>
        </motion.div>

        {/* Profit Performance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 bg-dark-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-primary-900/40"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10">
              <Target className="w-6 h-6 text-primary-400" />
            </div>
            <p className="text-xs font-black text-primary-400 uppercase tracking-[0.3em] mb-2 font-outfit">Net Profit Margin</p>
            <h2 className="text-5xl font-black tracking-tighter mb-4">{formatCurrency(stats?.profit || 0)}</h2>
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" /> 18.2% Above Target
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-white/10 relative z-10">
             <div className="flex items-center gap-4">
                <div className="flex-1">
                   <div className="flex justify-between mb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Progress</span>
                     <span className="text-[10px] font-black tracking-widest">82%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full w-[82%]" />
                   </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Revenue Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-dark-100 premium-shadow bg-mesh"
        >
          <div className="flex items-center justify-between mb-10">
             <div>
                <h3 className="text-xl font-black text-dark-900 tracking-tight uppercase">Cashflow <span className="text-gradient">Dynamics</span></h3>
                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-1">6-Month Financial Trajectory</p>
             </div>
             <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-[10px] font-black uppercase text-dark-500">Revenue</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-black uppercase text-dark-500">Expenses</span>
               </div>
             </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyData}>
                <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '10px', fontWeight: 900 }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={4} strokeDasharray="8 8" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Lowers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Asset Performance */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
           className="bg-white rounded-[2.5rem] p-10 border border-dark-100 premium-shadow bg-mesh h-full"
         >
           <h3 className="text-xl font-black text-dark-900 tracking-tight uppercase mb-8">Asset <span className="text-gradient">Yield</span></h3>
           <div className="space-y-4">
              {stats?.vehiclePerformance?.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-dark-50/50 border border-dark-100 rounded-[1.5rem] group hover:bg-white hover:border-primary-200 transition-all duration-300">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-dark-100 flex items-center justify-center text-dark-900 font-black text-xs">
                         {v.vehicleNumber.slice(-4)}
                      </div>
                      <div>
                         <p className="text-xs font-black text-dark-900 uppercase leading-none mb-1">{v.vehicleNumber}</p>
                         <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{formatCurrency(v.profit)} PROFIT</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-dark-400 uppercase tracking-widest mb-1">Utilization</p>
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-24 bg-dark-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-600 rounded-full w-[78%]" />
                         </div>
                         <span className="text-xs font-black text-dark-900">78%</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
         </motion.div>

         {/* Compliance & Reminders */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.7 }}
           className="bg-white rounded-[2.5rem] p-10 border border-dark-100 premium-shadow bg-mesh h-full"
         >
           <h3 className="text-xl font-black text-dark-900 tracking-tight uppercase mb-8">Critical <span className="text-gradient">Operational</span> Tasks</h3>
           <div className="space-y-4">
             {stats?.upcomingReminders?.map((r, i) => (
               <div key={i} className="flex items-center justify-between p-6 bg-rose-50 border border-rose-100 rounded-[1.5rem] group hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                       <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-rose-900 uppercase leading-none mb-1">{r.title}</p>
                       <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{r.vehicle} • Expiring in {r.daysRemaining} days</p>
                    </div>
                  </div>
                  <button className="bg-white text-rose-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-rose-200 shadow-sm hover:bg-rose-600 hover:text-white transition-colors">
                     Action
                  </button>
               </div>
             ))}
             {stats?.upcomingReminders?.length === 0 && (
               <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100 shadow-xl">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <p className="font-black text-[10px] text-dark-400 uppercase tracking-[0.2em]">Compliance records are operational</p>
               </div>
             )}
           </div>
         </motion.div>
      </div>
    </div>
  )
}
