import { useState, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Truck, Users, Wrench, Receipt, FileText, CreditCard,
  Bell, Building2, LogOut, Menu, X, Search, User, BarChart3, ShieldCheck,
  Grid, Zap, Navigation, Disc, Wallet, ArrowRightLeft, Settings as SettingsIcon,
  Sparkles, Upload, FileSearch, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'
import { cn } from '../lib/utils'
import { ocrAPI } from '../lib/api'

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
  const [showAiInbox, setShowAiInbox] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mapResult, setMapResult] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleGlobalUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setMapResult(null)
    try {
      const response = await ocrAPI.uploadAndMap(file)
      setMapResult(response.data)
      if (response.data.mappedTo === 'VEHICLE') {
        // success sound or subtle haptic would go here
      }
    } catch (error) {
       console.error('AI Mapping Failed:', error)
       alert('Target acquisition failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80, x: mobileOpen ? 0 : undefined }}
        className={cn("fixed left-0 top-0 h-full bg-gray-100 border-r border-gray-200 z-[70] flex flex-col transition-all duration-300 group",
          mobileOpen ? "w-[280px]" : "-translate-x-full lg:translate-x-0")}
      >
        <div className="h-24 flex items-center justify-between px-6 border-b border-gray-200">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg"><Zap className="w-5 h-5 text-white" /></div>
                <div className="flex flex-col"><span className="font-bold text-base tracking-tight text-gray-900">Samarth</span><span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Enterprise Fleet</span></div>
              </motion.div>
            )}
            {!sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mx-auto shadow-lg"><Zap className="w-5 h-5 text-white" /></motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn("flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive ? "bg-gray-900 text-white shadow-xl" : "text-gray-600 hover:bg-gray-200 hover:text-gray-900")}>
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700")} />
                  <span className={cn("text-xs font-bold whitespace-nowrap overflow-hidden transition-all duration-200 uppercase tracking-widest",
                    sidebarOpen ? "opacity-100" : "w-0 opacity-0 group-hover:w-auto group-hover:opacity-100")}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-rose-50 w-full",
            sidebarOpen ? "" : "justify-center")}>
            <LogOut className="w-5 h-5 text-rose-500" />
            {sidebarOpen && <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <div className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]")}>
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/80">
          <div className="flex items-center gap-6">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"><Menu className="w-5 h-5 text-gray-600" /></button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors shadow-sm"><Grid className={cn("w-5 h-5 text-gray-600", !sidebarOpen && "rotate-90")} /></button>
            <div className="h-8 w-px bg-gray-200" />
            <button onClick={() => setShowAiInbox(true)} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all">
              <Sparkles className="w-3 h-3 fill-white" /> AI Intake
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 w-64 group focus-within:ring-4 focus-within:ring-primary-500/10 transition-all">
              <Search className="w-4 h-4 text-gray-400 group-focus-within:text-primary-600" />
              <input type="text" placeholder="Global Search..." className="bg-transparent border-none outline-none text-[11px] font-bold w-full text-gray-700 placeholder:text-gray-400 uppercase" />
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200 font-outfit">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Fleet Commander</p>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Master Admin</p>
              </div>
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-xl"><User className="w-5 h-5 text-white" /></div>
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>

      {/* Global AI Inbox Modal */}
      <AnimatePresence>
        {showAiInbox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAiInbox(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden premium-shadow p-10 bg-mesh"
            >
              <div className="flex justify-between items-start mb-8 font-outfit">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 uppercase leading-none tracking-tight">AI <span className="text-gradient">Intake</span></h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2"><Sparkles className="w-3 h-3 text-primary-600" /> Universal Mapping Intelligence</p>
                </div>
                <button onClick={() => { setShowAiInbox(false); setMapResult(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-8 h-8 text-gray-200" /></button>
              </div>

              <div className="space-y-8">
                <div onClick={() => fileInputRef.current?.click()} 
                  className={cn("h-64 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                    uploading ? "border-primary-500 bg-primary-50/50 pointer-events-none" : "border-gray-200 hover:border-primary-500 hover:bg-primary-50/30")}>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleGlobalUpload(e.target.files[0])} />
                  {uploading ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                      <p className="text-xs font-black text-primary-900 uppercase tracking-widest">Acquiring Target Assets...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center"><Upload className="w-8 h-8 text-gray-400" /></div>
                      <div className="text-center">
                        <p className="text-xs font-black text-gray-900 uppercase">Drop asset scan here</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Autonomous mapping will initialize instantly</p>
                      </div>
                    </>
                  )}
                </div>

                <AnimatePresence>
                  {mapResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={cn("p-8 rounded-[1.5rem] border-2 flex items-center gap-6",
                        mapResult.mappedTo !== 'UNKNOWN' ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100")}>
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                        mapResult.mappedTo !== 'UNKNOWN' ? "bg-emerald-600" : "bg-orange-500")}>
                        {mapResult.mappedTo !== 'UNKNOWN' ? <CheckCircle2 className="w-7 h-7 text-white" /> : <AlertCircle className="w-7 h-7 text-white" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-dark-400">Target Resolution</p>
                        <p className="text-sm font-black text-gray-900 uppercase mt-1">
                          {mapResult.mappedTo !== 'UNKNOWN' 
                            ? `Mapped to ${mapResult.mappedTo}: ${mapResult.target}` 
                            : 'Unknown Entity - Stored in Inbox'}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1 italic">Type Detected: {mapResult.type}</p>
                      </div>
                      {mapResult.mappedTo !== 'UNKNOWN' && (
                        <button onClick={() => navigate(mapResult.mappedTo === 'VEHICLE' ? `/vehicles/${mapResult.vehicleId || ''}` : '/drivers')}
                           className="ml-auto p-3 bg-white rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                           <ArrowRightLeft className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-8 border-t border-gray-100 flex gap-4">
                  <button onClick={() => setShowAiInbox(false)} className="btn-secondary flex-1">Abort Mission</button>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex-1">New Acquisition</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
