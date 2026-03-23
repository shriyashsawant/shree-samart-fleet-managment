import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Truck,
  Users,
  Wrench,
  Receipt,
  FileText,
  CreditCard,
  Bell,
  Building2,
  LogOut,
  Menu,
  X,
  Search,
  User,
  BarChart3,
  ShieldCheck,
  Grid,
  Zap,
  Navigation,
  Disc,
  Wallet,
  ArrowRightLeft,
  Settings as SettingsIcon
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Truck, label: 'Vehicles', path: '/vehicles' },
  { icon: Users, label: 'Drivers', path: '/drivers' },
  { icon: Navigation, label: 'Trips', path: '/trips' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: ShieldCheck, label: 'Compliance', path: '/compliance' },
  { icon: FileText, label: 'Bills', path: '/billing' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Building2, label: 'Clients', path: '/clients' },
  { icon: Bell, label: 'Reminders', path: '/reminders' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80, x: mobileOpen ? 0 : undefined }}
        className={cn(
          "fixed left-0 top-0 h-full bg-gray-100 border-r border-gray-200 z-[70] flex flex-col transition-all duration-300 group",
          mobileOpen ? "w-[280px]" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-24 flex items-center justify-between px-6 border-b border-gray-200">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base tracking-tight text-gray-900">Samarth</span>
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Enterprise Fleet</span>
                </div>
              </motion.div>
            )}
            {!sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 hover:bg-gray-200 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path} 
              to={item.path} 
              onClick={() => setMobileOpen(false)}
              className={(props) => {
                const isActive = props?.isActive ?? false
                return cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-gray-800 text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900",
                  "group-hover:px-4"
                )
              }}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700")} />
                  <span className={cn(
                    "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200",
                    sidebarOpen ? "opacity-100" : "w-0 opacity-0 group-hover:w-auto group-hover:opacity-100"
                  )}>{item.label}</span>
                  {isActive && (
                    <motion.div layoutId="nav-indicator" className="absolute left-0 w-1 h-6 bg-gray-800 rounded-r-full my-auto inset-y-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-red-50 w-full",
            sidebarOpen ? "" : "justify-center"
          )}>
            <LogOut className="w-5 h-5 text-red-500" />
            {sidebarOpen && <span className="text-sm font-medium text-red-600">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <div className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]")}>
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Grid className={cn("w-5 h-5 text-gray-600", !sidebarOpen && "rotate-90")} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400" />
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-gray-500">Authenticated As</p>
                <p className="text-sm font-semibold text-gray-900">Master Admin</p>
              </div>
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
