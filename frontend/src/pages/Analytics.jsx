import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { 
  BarChart3, TrendingUp, Receipt, Users, AlertTriangle, ShieldCheck, 
  Download, Filter, Calendar, ArrowUpRight, ArrowDownRight, Activity, 
  Truck, Layers, PieChart as PieChartIcon, IndianRupee, Clock
} from 'lucide-react'
import { analyticsAPI, billAPI } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const COLORS = ['#0f172a', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [vehicleProfit, setVehicleProfit] = useState([])
  const [monthlyProfit, setMonthlyProfit] = useState([])
  const [expenseBreakdown, setExpenseBreakdown] = useState([])
  const [gstSummary, setGstSummary] = useState([])
  const [partyRevenue, setPartyRevenue] = useState([])
  const [idleAlerts, setIdleAlerts] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => { loadAnalytics() }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [profitRes, monthlyRes, expenseRes, gstRes, partyRes, alertsRes] = await Promise.all([
        analyticsAPI.getVehicleProfit(),
        analyticsAPI.getMonthlyProfit(12),
        analyticsAPI.getExpenseBreakdown(),
        analyticsAPI.getGstSummary(12),
        analyticsAPI.getPartyRevenue(),
        analyticsAPI.getIdleAlerts(),
      ])
      
      setVehicleProfit(profitRes.data)
      setMonthlyProfit(monthlyRes.data)
      setExpenseBreakdown(expenseRes.data)
      setGstSummary(gstRes.data)
      setPartyRevenue(partyRes.data)
      setIdleAlerts(alertsRes.data)
    } catch (error) {
      console.error('Teletransmission failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Executive Intelligence', icon: BarChart3 },
    { id: 'profitability', label: 'Profit & Loss (P&L)', icon: TrendingUp },
    { id: 'gst', label: 'Regulatory Ledger', icon: ShieldCheck },
    { id: 'market', label: 'Market Sentiment', icon: PieChartIcon },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-mesh">
      <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full shadow-2xl" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="font-outfit">
          <h1 className="text-5xl font-black text-dark-900 tracking-tighter uppercase leading-none">
            Fleet <span className="text-gradient">Intelligence</span>
          </h1>
          <p className="text-xs font-bold text-dark-400 uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary-500" /> Operational Analytical Terminal
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-6 py-3 rounded-2xl border border-dark-100 flex items-center gap-4 premium-shadow">
              <Calendar className="w-4 h-4 text-dark-400" />
              <div className="text-left">
                 <p className="text-[9px] font-black text-dark-300 uppercase tracking-widest">Protocol Window</p>
                 <p className="text-xs font-black text-dark-900 uppercase">Last 12 Fiscal Months</p>
              </div>
           </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-full border border-dark-100 premium-shadow flex gap-1 w-max mx-auto shadow-2xl ring-1 ring-dark-900/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-3 px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-500",
              activeTab === tab.id 
                ? "bg-dark-900 text-white shadow-2xl scale-105" 
                : "text-dark-400 hover:text-dark-900 hover:bg-dark-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           transition={{ duration: 0.5, ease: "circOut" }}
           className="space-y-12"
        >
          {activeTab === 'overview' && <OverviewTab monthly={monthlyProfit} alerts={idleAlerts} expenses={expenseBreakdown} />}
          {activeTab === 'profitability' && <ProfitabilityTab vehicleProfit={vehicleProfit} trend={monthlyProfit} />}
          {activeTab === 'gst' && <GstTab summary={gstSummary} month={selectedMonth} setMonth={setSelectedMonth} />}
          {activeTab === 'market' && <MarketTab partyRevenue={partyRevenue} expenses={expenseBreakdown} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function OverviewTab({ monthly, alerts, expenses }) {
  const totalRev = monthly.reduce((sum, m) => sum + (m.revenue || 0), 0)
  const totalExp = monthly.reduce((sum, m) => sum + (m.expenses || 0), 0)
  const totalProfit = totalRev - totalExp

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         <StatsCard label="Lifetime Revenue" value={formatCurrency(totalRev)} icon={ArrowUpRight} color="emerald" trend="+12.5%" />
         <StatsCard label="Operational Burn" value={formatCurrency(totalExp)} icon={ArrowDownRight} color="rose" trend="+4.2%" inverse />
         <StatsCard label="Consolidated Profit" value={formatCurrency(totalProfit)} icon={Activity} color="primary" trend="+18.9%" />
         <StatsCard label="Risk Alerts" value={alerts.length} icon={AlertTriangle} color="amber" highlight={alerts.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-dark-100 premium-shadow bg-mesh h-[500px]">
            <div className="flex items-center justify-between mb-8">
               <h4 className="text-sm font-black uppercase tracking-[0.2em] text-dark-900">Capital Flow Synchronization</h4>
               <div className="flex gap-4">
                  <LegendItem color="#10b981" label="Revenue" />
                  <LegendItem color="#f59e0b" label="Burn" />
               </div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" strokeDasharray="8 8" />
              </AreaChart>
            </ResponsiveContainer>
         </div>

         <div className="bg-white rounded-[3rem] p-10 border border-dark-100 premium-shadow bg-mesh">
             <h4 className="text-sm font-black uppercase tracking-[0.2em] text-dark-900 mb-8">Expense Distribution</h4>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenses} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={10} dataKey="amount">
                      {expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-8 space-y-4">
                {expenses.slice(0, 4).map((e, i) => (
                  <div key={i} className="flex justify-between items-center group">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-dark-400 group-hover:text-dark-900 transition-colors">{e.category}</span>
                     </div>
                     <span className="text-xs font-black text-dark-900">{e.percentage}%</span>
                  </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  )
}

function ProfitabilityTab({ vehicleProfit, trend }) {
  return (
    <div className="space-y-12">
       <div className="bg-white rounded-[3.5rem] p-12 border border-dark-100 premium-shadow bg-mesh">
          <div className="flex justify-between items-end mb-12">
             <div>
                <h3 className="text-2xl font-black text-dark-900 tracking-tight leading-none mb-3 uppercase">Unit Yield Ranking</h3>
                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">Efficiency analysis per vocational mixer unit</p>
             </div>
             <button className="btn-secondary text-[9px]"><Download className="w-4 h-4" /> Export Ledger</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {vehicleProfit.map((v, i) => (
               <motion.div key={v.vehicleId || i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                 className="bg-dark-50/50 rounded-[2.5rem] p-8 border border-dark-100 hover:border-primary-500 transition-all duration-500 group"
               >
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h4 className="text-lg font-black text-dark-900 tracking-tighter uppercase">{v.vehicleNumber}</h4>
                        <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest">{v.model}</p>
                     </div>
                     <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", v.profitMargin > 20 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-primary-50 text-primary-600 border-primary-100")}>
                        {v.profitMargin || 0}% Margin
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div>
                        <p className="text-[10px] font-black text-dark-300 uppercase tracking-widest mb-1">Net Life-cycle Yield</p>
                        <p className="text-2xl font-black text-dark-900 tracking-tighter">{formatCurrency(v.profit)}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-6 border-t border-dark-100/50">
                        <div>
                           <p className="text-[8px] font-black text-dark-400 uppercase tracking-widest">Revenue</p>
                           <p className="text-sm font-black text-emerald-600">{formatCurrency(v.totalRevenue)}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-dark-400 uppercase tracking-widest">Burn</p>
                           <p className="text-sm font-black text-rose-500">{formatCurrency(v.totalExpenses)}</p>
                        </div>
                     </div>
                  </div>
               </motion.div>
             ))}
          </div>
       </div>
    </div>
  )
}

function GstTab({ summary, month, setMonth }) {
  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-dark-100 premium-shadow bg-mesh">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div>
             <h3 className="text-2xl font-black text-dark-900 tracking-tight leading-none mb-3 uppercase">Regulatory Gst Ledger</h3>
             <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest">Consolidated monthly tax data for filing protocols</p>
          </div>
          <div className="flex gap-4">
             <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="interactive-field !py-3 !text-[10px] font-black uppercase tracking-widest" />
             <button className="btn-primary !py-3 !px-6"><Download className="w-5 h-5" /> Export .CSV</button>
          </div>
       </div>

       <div className="overflow-x-auto">
          <table className="w-full">
             <thead className="border-b border-dark-100">
                <tr>
                   <th className="pb-8 text-left text-[10px] font-black text-dark-300 uppercase tracking-[0.2em]">Fiscal Period</th>
                   <th className="pb-8 text-right text-[10px] font-black text-dark-300 uppercase tracking-[0.2em]">Basic Yield</th>
                   <th className="pb-8 text-right text-[10px] font-black text-dark-300 uppercase tracking-[0.2em]">CGST (9%)</th>
                   <th className="pb-8 text-right text-[10px] font-black text-dark-300 uppercase tracking-[0.2em]">SGST (9%)</th>
                   <th className="pb-8 text-right text-[10px] font-black text-dark-300 uppercase tracking-[0.2em]">Net Liability</th>
                   <th className="pb-8 text-right text-[10px] font-black text-dark-300 uppercase tracking-[0.2em]">Gross Invoiced</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-dark-50">
                {summary.map((g, i) => (
                  <tr key={i} className="group hover:bg-dark-50/50 transition-colors">
                     <td className="py-8 font-black text-dark-900 tracking-tight uppercase text-sm">{g.month} {g.year}</td>
                     <td className="py-8 text-right font-bold text-dark-700 text-sm">{formatCurrency(g.basicAmount)}</td>
                     <td className="py-8 text-right font-bold text-primary-600 text-sm">{formatCurrency(g.cgstAmount)}</td>
                     <td className="py-8 text-right font-bold text-primary-600 text-sm">{formatCurrency(g.sgstAmount)}</td>
                     <td className="py-8 text-right font-black text-dark-900 text-sm underline decoration-primary-200 decoration-4 underline-offset-4">{formatCurrency(g.totalGst)}</td>
                     <td className="py-8 text-right">
                        <span className="inline-block px-4 py-2 bg-dark-900 text-white rounded-xl font-black text-xs shadow-xl">{formatCurrency(g.totalAmount)}</span>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  )
}

function MarketTab({ partyRevenue, expenses }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
       <div className="bg-white rounded-[3.5rem] p-12 border border-dark-100 premium-shadow bg-mesh h-[600px]">
          <h3 className="text-xl font-black text-dark-900 tracking-tight leading-none mb-3 uppercase">Client Market Share</h3>
          <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-10">Revenue concentration per partner node</p>
          <ResponsiveContainer width="100%" height="75%">
             <BarChart data={partyRevenue.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="partyName" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalRevenue" radius={[0, 10, 10, 0]} barSize={20}>
                  {partyRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
             </BarChart>
          </ResponsiveContainer>
       </div>

       <div className="bg-white rounded-[3.5rem] p-12 border border-dark-100 premium-shadow bg-mesh">
          <h3 className="text-xl font-black text-dark-900 tracking-tight leading-none mb-3 uppercase">Top Partner Performance</h3>
          <p className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mb-10">Fiscal impact per client alliance</p>
          <div className="space-y-6">
             {partyRevenue.slice(0, 6).map((p, i) => (
               <div key={i} className="flex items-center justify-between p-6 bg-dark-50/50 rounded-3xl border border-dark-100 group hover:border-primary-500 transition-all duration-500">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-dark-100 shadow-sm font-black text-xs group-hover:bg-primary-500 group-hover:text-white transition-all">
                        {p.partyName?.charAt(0)}
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-dark-900 uppercase tracking-tighter">{p.partyName}</h4>
                        <p className="text-[8px] font-black text-dark-300 uppercase tracking-widest">{p.billCount} Commercial Bills</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-dark-900 leading-none">{formatCurrency(p.totalRevenue)}</p>
                     <p className="text-[9px] font-black text-emerald-600 uppercase mt-1">SHARE: {p.percentage}%</p>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  )
}

function StatsCard({ label, value, icon: Icon, color, trend, inverse, highlight }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
    primary: "bg-primary-50 text-primary-600 ring-primary-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100"
  }
  return (
    <div className={cn("bg-white p-8 rounded-[3rem] border border-dark-100 premium-shadow group hover:shadow-2xl transition-all duration-700 relative overflow-hidden", highlight && "ring-2 ring-rose-200")}>
       <div className="relative z-10">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl transition-transform group-hover:scale-110 duration-500 ring-4", colors[color])}>
             <Icon className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black text-dark-400 uppercase tracking-[0.2em] mb-2">{label}</p>
          <p className="text-3xl font-black text-dark-900 tracking-tighter leading-none">{value}</p>
          {trend && (
            <div className={cn("flex items-center gap-1 mt-3 px-2 py-0.5 rounded-lg w-max text-[9px] font-black uppercase", (inverse ? trend.includes('+') : trend.includes('-')) ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
               {trend} vs Projected
            </div>
          )}
       </div>
       <Icon className="absolute -right-6 -bottom-6 w-32 h-32 opacity-5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
    </div>
  )
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900 text-white p-4 rounded-2xl shadow-2xl border border-dark-800 backdrop-blur-md">
        <p className="text-[10px] font-black uppercase tracking-widest mb-2 border-b border-dark-700 pb-2">{payload[0].payload.month}</p>
        <div className="space-y-1">
          {payload.map((p, i) => (
            <p key={i} className="text-xs font-bold flex justify-between gap-6">
              <span className="opacity-60">{p.name}:</span>
              <span>{formatCurrency(p.value)}</span>
            </p>
          ))}
        </div>
      </div>
    )
  }
  return null
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
       <span className="text-[9px] font-black text-dark-400 uppercase tracking-widest">{label}</span>
    </div>
  )
}
