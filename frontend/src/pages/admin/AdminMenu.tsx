import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CalendarDays, Bell, ChevronRight, LayoutDashboard, Wallet, Receipt, Users, Building, Settings, ArrowRight } from 'lucide-react'

export default function AdminMenu() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Menyesuaikan waktu untuk ucapan (Pagi/Siang/Sore/Malam)
  const hour = new Date().getHours()
  let greeting = 'Selamat Pagi'
  if (hour >= 11 && hour < 15) greeting = 'Selamat Siang'
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore'
  else if (hour >= 18) greeting = 'Selamat Malam'

  // Format Tanggal
  const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())

  // Menu Data
  const menuGroups = [
    {
      title: 'Keuangan & Laporan',
      count: 4,
      icon: <Wallet className="w-5 h-5" />,
      items: [
        { name: 'Dashboard Admin', path: '/admin/dashboard' },
        { name: 'Pengeluaran', path: '/admin/expenses' },
        { name: 'Riwayat Tutup Buku', path: '/admin/history' },
        { name: 'Laporan Bulanan', path: '/admin/reports' },
      ]
    },
    {
      title: 'Penggajian',
      count: 2,
      icon: <Receipt className="w-5 h-5" />,
      items: [
        { name: 'Data Karyawan', path: '/admin/employees' },
        { name: 'Proses Penggajian', path: '/admin/payroll' },
      ]
    },
    {
      title: 'Master Data & Bisnis',
      count: 4,
      icon: <Building className="w-5 h-5" />,
      items: [
        { name: 'Kelola Pos', path: '/admin/pos' },
        { name: 'Kelola Pola Distribusi', path: '/admin/patterns' },
        { name: 'Anak Perusahaan', path: '/admin/subsidiaries' },
        { name: 'Katalog Produk', path: '/admin/products' },
      ]
    },
    {
      title: 'Manajemen Sistem & Lainnya',
      count: 4,
      icon: <Settings className="w-5 h-5" />,
      items: [
        { name: 'Koneksi Shopee', path: '/admin/shopee' },
        { name: 'Config Tutup Buku', path: '/admin/closing-config' },
        { name: 'Pesan Masuk', path: '/admin/inquiries' },
        { name: 'Teks Halaman (CMS)', path: '/admin/cms' },
      ]
    }
  ]

  const [openGroup, setOpenGroup] = useState<number | null>(null)

  const filteredGroups = menuGroups.map(group => {
    const filteredItems = group.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return { ...group, items: filteredItems, count: filteredItems.length }
  }).filter(group => group.count > 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-50 to-orange-100 p-8 shadow-sm border border-orange-100">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-orange-600 font-medium mb-2">
            <span>✨</span> {greeting},
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Tim Nawasena Holding.</h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Semoga hari ini penuh berkah dan kemudahan dalam mengelola operasional dan keuangan Nawasena Holding.
          </p>
          <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-200">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Akses Akun</p>
              <p className="text-sm font-bold text-slate-900">Administrator</p>
            </div>
          </div>
        </div>
        
        {/* Decorative Illustration (Placeholder using circles) */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden md:block">
           <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" alt="Team" className="w-full h-full object-cover rounded-l-[100px] shadow-2xl opacity-90 border-4 border-white" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Cari menu atau layanan di sini..." 
          className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Menu Lists */}
      <div className="space-y-4 pb-10">
        {filteredGroups.map((group, idx) => (
          <div key={idx} className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all">
            <button 
              onClick={() => setOpenGroup(openGroup === idx ? null : idx)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  {group.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-lg">{group.title}</h3>
                  <p className="text-sm text-slate-500">{group.count} fitur</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${openGroup === idx ? 'rotate-90' : ''}`} />
            </button>
            
            {openGroup === idx && (
              <div className="border-t bg-slate-50/50 px-6 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {group.items.map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => navigate(item.path)}
                    className="text-left p-4 rounded-xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <span className="font-medium text-slate-700 group-hover:text-emerald-700">{item.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            Menu tidak ditemukan.
          </div>
        )}
      </div>
    </div>
  )
}


