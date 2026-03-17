import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Truck, Users, DollarSign, Activity, AlertTriangle, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { dashboardAPI } from '../lib/api'
import { formatCurrency, cn, getDaysRemaining, getStatusColor } from '../lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

const mockMonthlyData = [
  { month: 'Jan', revenue: 320000, expenses: 180000 },
  { month: 'Feb', revenue: 350000, expenses: 195000 },
  { month: 'Mar', revenue: 380000, expenses: 210000 },
  { month: 'Apr', revenue: 360000, expenses: 185000 },
  { month: 'May', revenue: 420000, expenses: 220000 },
  { month: 'Jun', revenue: 450000, expenses: 235000 },
]

const mockExpenseBreakdown = [
  { name: 'Diesel', value: 45 },
  { name: 'Salary', value: 30 },
  { name: 'Maintenance', value: 15 },
  { name: 'Other', value: 10 },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      // Use mock data if API fails
      setStats({
        totalVehicles: 3,
        activeDrivers: 4,
        monthlyRevenue: 420000,
        monthlyExpenses: 210000,
        profit: 210000,
        upcomingReminders: [],
        vehiclePerformance: [
          { vehicleNumber: 'MH12AB1234', revenue: 150000, expenses: 80000, profit: 70000 },
          { vehicleNumber: 'MH12XY4567', revenue: 140000, expenses: 75000, profit: 65000 },
          { vehicleNumber: 'MH14PQ7890', revenue: 130000, expenses: 55000, profit: 75000 },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats?.totalVehicles || 0,
      icon: Truck,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
    },
    {
      title: 'Active Drivers',
      value: stats?.activeDrivers || 0,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: DollarSign,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-500/10',
      textColor: 'text-primary-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(stats?.monthlyExpenses || 0),
      icon: Activity,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
          <p className="text-dark-500 mt-1">Welcome back! Here's your fleet overview.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-dark-500">Current Date</p>
          <p className="font-semibold text-dark-900">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-dark-100 card-hover"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-dark-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-dark-900 mt-2">{stat.value}</p>
                {stat.trend && (
                  <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", stat.trendUp ? "text-emerald-500" : "text-red-500")}>
                    {stat.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {stat.trend} from last month
                  </div>
                )}
              </div>
              <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                <stat.icon className={cn("w-6 h-6", stat.textColor)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Profit Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg shadow-primary-600/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 font-medium">Net Profit This Month</p>
            <p className="text-4xl font-bold mt-2">{formatCurrency(stats?.profit || 210000)}</p>
            <div className="flex items-center gap-2 mt-3 text-primary-100">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">8% higher than last month</span>
            </div>
          </div>
          <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
            <DollarSign className="w-16 h-16 text-white/80" />
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-dark-100"
        >
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Revenue & Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-dark-100"
        >
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Expense Breakdown</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockExpenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockExpenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {mockExpenseBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-dark-600">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Vehicle Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-dark-100"
      >
        <h3 className="text-lg font-semibold text-dark-900 mb-4">Vehicle Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(stats?.vehiclePerformance || mockMonthlyData).map((vehicle, index) => (
            <div key={index} className="p-4 bg-dark-50 rounded-xl border border-dark-100">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-dark-900">{vehicle.vehicleNumber || `Mixer ${index + 1}`}</span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor('ACTIVE'))}>
                  Active
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Revenue</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(vehicle.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Expenses</span>
                  <span className="font-medium text-red-600">{formatCurrency(vehicle.expenses)}</span>
                </div>
                <div className="pt-2 border-t border-dark-200">
                  <div className="flex justify-between">
                    <span className="text-dark-500 text-sm">Profit</span>
                    <span className="font-bold text-primary-600">{formatCurrency(vehicle.profit)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reminders */}
      {stats?.upcomingReminders?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-dark-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-dark-900">Upcoming Reminders</h3>
          </div>
          <div className="space-y-3">
            {stats.upcomingReminders.map((reminder, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-dark-900">{reminder.title}</p>
                    <p className="text-sm text-dark-500">{reminder.daysRemaining} days remaining</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm font-medium text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
