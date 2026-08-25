import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { logoutAdmin, getClosingHistory } from '@/api'
import { Menu, X, LayoutDashboard, FileText, Wallet, Route as RouteIcon, Store, Settings, Receipt, History, LogOut, Building, Package, MessageSquare, Users, Banknote, List, Bell, CalendarDays, User } from 'lucide-react'

const navigationMenuUtama = [
  { name: 'Menu', href: '/admin', icon: List },
  { name: 'Dashboard Admin', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Pengeluaran', href: '/admin/expenses', icon: Receipt },
  { name: 'Riwayat Tutup Buku', href: '/admin/history', icon: History },
  { name: 'Laporan Bulanan', href: '/admin/reports', icon: FileText },
  { name: 'Penggajian', href: '/admin/payroll', icon: Banknote },
  { name: 'Karyawan', href: '/admin/employees', icon: Users },
]

const navigationMaster = [
  { name: 'Data Master (Pos)', href: '/admin/pos', icon: Wallet },
  { name: 'Master Potongan (Pola)', href: '/admin/patterns', icon: RouteIcon },
  { name: 'Anak Perusahaan', href: '/admin/subsidiaries', icon: Building },
  { name: 'Katalog Produk', href: '/admin/products', icon: Package },
  { name: 'Koneksi Shopee', href: '/admin/shopee', icon: Store },
  { name: 'Pesan Masuk', href: '/admin/inquiries', icon: MessageSquare },
  { name: 'Teks Halaman', href: '/admin/cms', icon: FileText },
  { name: 'Pengaturan (Tutup Buku)', href: '/admin/closing-config', icon: Settings },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch notifications (recent closings)
    getClosingHistory().then(res => {
      // Just take top 3-5 for notification dropdown
      setNotifications(res.slice(0, 5))
    }).catch(console.error)
  }, [])

  const handleLogout = () => {
    logoutAdmin()
    navigate('/admin/login')
  }

  const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())

  const NavItem = ({ item }: { item: any }) => {
    const isActive = item.href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.href)
    return (
      <Link
        to={item.href}
        className={`flex items-center gap-3 px-4 py-3 mx-4 rounded-xl text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-emerald-50 text-emerald-600' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
        {item.name}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 xl:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out xl:translate-x-0 xl:static xl:flex xl:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold font-serif shadow-sm">
              N
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">NAWASENA</h1>
              <p className="text-[11px] text-slate-500">Command Center</p>
            </div>
          </Link>
          <button className="ml-auto xl:hidden text-slate-500 hover:text-slate-900" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-hide">
          <div>
            <p className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</p>
            <div className="space-y-1">
              {navigationMenuUtama.map((item) => <NavItem key={item.name} item={item} />)}
            </div>
          </div>
          <div>
            <p className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Master & Pengaturan</p>
            <div className="space-y-1">
              {navigationMaster.map((item) => <NavItem key={item.name} item={item} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-[#f8fafc] shrink-0 z-10 w-full max-w-5xl mx-auto pt-6">
          <div className="flex items-center gap-3">
            <button className="p-2 -ml-2 text-slate-500 hover:text-slate-900 xl:hidden bg-white border rounded-lg shadow-sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm text-sm font-medium text-slate-600">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              {today}
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
            {/* Bell Dropdown */}
            <div className="relative">
              <button 
                className="w-10 h-10 bg-white border rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm relative transition-colors"
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => n.status === 'pending') && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
              
              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Notifikasi Tutup Buku</h3>
                    <Link to="/admin/history" className="text-xs text-emerald-600 font-medium hover:underline" onClick={() => setNotifOpen(false)}>Lihat Semua</Link>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((notif: any) => (
                          <div key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors ${notif.status === 'pending' ? 'bg-red-50/30' : ''}`}>
                            <p className="text-sm text-slate-800 mb-1">
                              {notif.status === 'pending' 
                                ? <span className="font-bold text-red-600">Menunggu Input Manual</span>
                                : <span className="font-bold text-emerald-600">Selesai Diproses</span>}
                            </p>
                            <p className="text-xs text-slate-500 mb-2">Tutup buku tanggal: {notif.closing_date}</p>
                            
                            {/* Action Buttons for Notification */}
                            <div className="flex gap-2 mt-2">
                              {notif.status === 'completed' && (
                                <button 
                                  className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium hover:bg-emerald-200 flex items-center gap-1"
                                  onClick={() => {
                                    window.open(`http://localhost:8787/api/reports/daily/export/excel?date=${notif.closing_date}`, '_blank')
                                  }}
                                >
                                  📊 Export Excel
                                </button>
                              )}
                              <Link 
                                to="/admin/history" 
                                className="text-[10px] px-2 py-1 border rounded text-slate-600 font-medium hover:bg-slate-100"
                                onClick={() => setNotifOpen(false)}
                              >
                                Lihat Detail
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-slate-500">
                        Belum ada notifikasi tutup buku.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border shadow-sm hover:border-emerald-200 transition-colors"
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold leading-none text-slate-900">Admin Pusat</p>
                  <p className="text-[10px] text-slate-500 mt-1">Nawasena Holding</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#0a192f] text-gold flex items-center justify-center font-bold text-sm shadow-inner">
                  A
                </div>
              </button>

              {profileOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <p className="font-bold text-slate-900">Administrator</p>
                    <p className="text-xs text-slate-500 truncate">admin@nawasena.co.id</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button 
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-emerald-600 rounded-lg flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setProfileOpen(false)
                        alert("Pengaturan Profil akan segera hadir.")
                      }}
                    >
                      <User className="w-4 h-4" />
                      Pengaturan Profil
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button 
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors font-medium"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto px-4 pb-8 md:px-8 relative w-full h-full" onClick={() => {
          if (notifOpen) setNotifOpen(false)
          if (profileOpen) setProfileOpen(false)
        }}>
          <Outlet />
        </main>

      </div>
    </div>
  )
}
