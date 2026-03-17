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
  { icon: LayoutDashboard, label: 'Command Center', path: '/' },
  { icon: Truck, label: 'Fleet Assets', path: '/vehicles' },
  { icon: Users, label: 'Operators', path: '/drivers' },
  { icon: Navigation, label: 'Trip Logistics', path: '/trips' },
  { icon: Receipt, label: 'Burn Rate', path: '/expenses' },
  { icon: Wrench, label: 'Unit Health', path: '/maintenance' },
  { icon: Disc, label: 'Tyre Intel', path: '/tyres' },
  { icon: ShieldCheck, label: 'Compliance', path: '/compliance' },
  { icon: FileText, label: 'Revenue Log', path: '/billing' },
  { icon: CreditCard, label: 'Clearance', path: '/payments' },
  { icon: Wallet, label: 'Cash Advances', path: '/advances' },
  { icon: Building2, label: 'Partners', path: '/clients' },
  { icon: Bell, label: 'Watchtower', path: '/reminders' },
  { icon: BarChart3, label: 'Intelligence', path: '/analytics' },
  { icon: SettingsIcon, label: 'Control Hub', path: '/settings' }, // Added new item
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
            className="fixed inset-0 bg-dark-900/40 backdrop-blur-md z-[60] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 100, x: mobileOpen ? 0 : undefined }}
        className={cn(
          "fixed left-0 top-0 h-full bg-dark-950 text-white z-[70] flex flex-col border-r border-white/5 transition-all duration-500 bg-mesh shadow-[20px_0_40px_rgba(0,0,0,0.1)]",
          mobileOpen ? "w-[280px]" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-24 flex items-center justify-between px-8 border-b border-white/5">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 ring-4 ring-primary-500/10">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tighter uppercase leading-none">Samarth</span>
                  <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest leading-none mt-1">Enterprise Fleet</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-10 px-4 space-y-2 overflow-y-auto scrollbar-hide font-inter">
          {navItems.map((item) => (
            <NavLink
              key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 group relative",
                isActive 
                  ? "bg-white/10 text-white ring-1 ring-white/10 shadow-2xl" 
                  : "text-dark-400 hover:text-white"
              )}
            >
              <item.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", location.pathname === item.path ? "text-primary-500" : "text-dark-500 group-hover:text-white")} />
              {sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}
              {location.pathname === item.path && (
                <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-primary-500 rounded-full my-auto inset-y-0" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-4 w-full px-5 py-4 rounded-[1.5rem] text-rose-400 hover:bg-rose-500/10 transition-all group">
            <LogOut className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
            {sidebarOpen && <span className="text-sm font-black uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <div className={cn("transition-all duration-500 min-h-screen bg-mesh", sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[100px]")}>
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-dark-100 flex items-center justify-between px-10 sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-3 bg-dark-50 rounded-2xl hover:bg-dark-100 transition-colors"><Menu className="w-6 h-6" /></button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex p-3 bg-dark-50 rounded-2xl hover:bg-dark-100 transition-colors shadow-sm ring-1 ring-dark-100">
              <Grid className={cn("w-6 h-6 transition-all", !sidebarOpen ? "rotate-45" : "rotate-0")} />
            </button>
            <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-dark-50 rounded-[1.25rem] w-96 border border-dark-100 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
              <Search className="w-4 h-4 text-dark-400" />
              <input type="text" placeholder="Access Command Console..." className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-full placeholder:text-dark-300" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 pl-6 border-l border-dark-100">
               <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-black text-dark-300 uppercase tracking-[0.2em] leading-none mb-1">Authenticated As</p>
                  <p className="text-[11px] font-black text-dark-900 uppercase">Master Admin</p>
               </div>
               <div className="w-12 h-12 bg-dark-900 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-dark-50">
                 <User className="w-6 h-6 text-white" />
               </div>
            </div>
          </div>
        </header>

        <main className="p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
