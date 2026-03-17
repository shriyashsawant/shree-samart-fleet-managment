import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
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
  ChevronLeft,
  Search,
  User,
  BarChart3
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Truck, label: 'Vehicles', path: '/vehicles' },
  { icon: Users, label: 'Drivers', path: '/drivers' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Wrench, label: 'Maintenance', path: '/maintenance' },
  { icon: FileText, label: 'Billing', path: '/billing' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Building2, label: 'Clients', path: '/clients' },
  { icon: Bell, label: 'Reminders', path: '/reminders' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 260 : 80,
          x: mobileOpen ? 0 : undefined
        }}
        className={cn(
          "fixed left-0 top-0 h-full bg-dark-900 text-white z-50",
          "flex flex-col border-r border-dark-700",
          "transition-all duration-300",
          !sidebarOpen && "lg:w-20",
          mobileOpen ? "w-64" : "w-64 lg:w-64 -translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">Shree Samarth</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 hover:bg-dark-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                  : "text-dark-300 hover:bg-dark-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-dark-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-dark-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-dark-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 hover:bg-dark-100 rounded-lg"
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform", !sidebarOpen && "rotate-180")} />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-dark-50 rounded-lg w-80">
              <Search className="w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile */}
            <div className="flex items-center gap-3 px-3 py-2 bg-dark-50 rounded-lg">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-dark-700 hidden sm:block">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
