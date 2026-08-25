import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, ArrowRight, ArrowLeft, MapPin, Phone, Mail, Menu, X, Calendar, Users } from 'lucide-react'

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Initialize theme from system or local storage
  useEffect(() => {
    const root = window.document.documentElement
    const initialColorValue = root.classList.contains('dark')
    setIsDark(initialColorValue)
  }, [])

  const toggleTheme = () => {
    const root = window.document.documentElement
    root.classList.toggle('dark')
    setIsDark(!isDark)
  }

  const logoSrc = isDark ? '/logo-dark.png' : '/logo-light.png'

  return (
    <div className="min-h-screen font-sans bg-white dark:bg-[#0a0f1c] text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0a0f1c]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Nawasena Holding" className="h-12 sm:h-14 md:h-20 object-contain" onError={(e) => {
              const target = e.currentTarget
              if (target.src.includes('.png')) {
                target.src = target.src.replace('.png', '.jpg')
              } else if (target.src.includes('.jpg')) {
                target.src = target.src.replace('.jpg', '.jpeg')
              } else {
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }
            }} />
            <span className="hidden text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              NAWASENA <span className="text-gold">HOLDING</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#beranda" className="hover:text-gold transition-colors">Beranda</a>
            <a href="#portofolio" className="hover:text-gold transition-colors">Anak Perusahaan</a>
            <a href="#layanan" className="hover:text-gold transition-colors">Layanan</a>
            <a href="#berita" className="hover:text-gold transition-colors">Berita</a>
            <a href="#tentang" className="hover:text-gold transition-colors">Tentang Kami</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isDark ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <a href="#kontak" className="px-6 py-2.5 bg-[#0a192f] dark:bg-transparent border dark:border-gold text-white dark:text-gold text-sm font-medium hover:bg-gold dark:hover:bg-gold dark:hover:text-[#0a192f] transition-all rounded-sm">
              Hubungi Kami
            </a>
          </div>

          {/* Mobile Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 border border-gray-300 dark:border-gold/50 text-slate-700 dark:text-gold rounded flex items-center justify-center">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#0a0f1c] border-b border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-4 shadow-lg">
            <a href="#beranda" className="block hover:text-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Beranda</a>
            <a href="#portofolio" className="block hover:text-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Anak Perusahaan</a>
            <a href="#layanan" className="block hover:text-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Layanan</a>
            <a href="#berita" className="block hover:text-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Berita</a>
            <a href="#tentang" className="block hover:text-gold transition-colors" onClick={() => setIsMenuOpen(false)}>Tentang Kami</a>
            <div className="h-[1px] bg-gray-100 dark:bg-gray-800 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm">Tema Tampilan</span>
              <button onClick={toggleTheme} className="p-2 border border-gray-200 dark:border-gray-700 rounded-full flex items-center gap-2">
                {isDark ? <Sun className="w-4 h-4 text-gold" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>
            <a href="#kontak" className="block text-center mt-2 px-6 py-3 bg-[#0a192f] dark:bg-gold text-white dark:text-[#0a192f] font-medium rounded-sm" onClick={() => setIsMenuOpen(false)}>Hubungi Kami</a>
          </div>
        )}
      </nav>

      <main>
        {/* HERO SECTION */}
        <section id="beranda" className="pt-24 pb-12 md:pt-40 md:pb-24 relative overflow-hidden">
          {/* Decorative Gold Arc */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full border-[1px] border-gold/30 -translate-y-1/4 translate-x-1/4 opacity-50 dark:opacity-20 pointer-events-none hidden md:block" />
          
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1 space-y-4 md:space-y-6 z-10 w-full">
                <div className="hidden md:flex items-center gap-4 mb-6">
                  <div className="w-12 h-[1px] bg-gold" />
                  <span className="text-gold text-sm tracking-widest uppercase font-semibold">Nawasena Holding</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight text-slate-900 dark:text-white">
                  Membangun Masa Depan,<br className="hidden md:block"/> Melalui <span className="text-gold italic">Inovasi</span> dan <br className="hidden md:block"/><span className="text-gold italic">Integritas</span> Bisnis Berkelanjutan.
                </h1>
                <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                  Nawasena Holding berkomitmen untuk menciptakan nilai jangka panjang melalui pengelolaan bisnis yang inovatif, bertanggung jawab, dan berorientasi pada masa depan.
                </p>
                <div className="flex flex-row items-center gap-3 pt-2 md:pt-4">
                  <a href="#tentang" className="px-4 py-2.5 md:px-8 md:py-3.5 bg-gold dark:bg-gold/90 text-white dark:text-[#0a192f] text-xs md:text-base font-medium hover:bg-yellow-600 transition-all rounded-sm flex items-center">
                    Kenali Kami <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                  <a href="#portofolio" className="px-4 py-2.5 md:px-8 md:py-3.5 border border-[#0a192f] dark:border-gold text-[#0a192f] dark:text-gold text-xs md:text-base font-medium hover:bg-[#0a192f] hover:text-white dark:hover:bg-gold dark:hover:text-[#0a192f] transition-all rounded-sm">
                    Lihat Anak Perusahaan
                  </a>
                </div>
              </div>
              
              <div className="flex-1 relative z-10 w-full mt-6 md:mt-0">
                <div className="aspect-[4/3] md:aspect-square relative rounded-tr-[80px] rounded-bl-[80px] md:rounded-tr-[100px] md:rounded-bl-[100px] overflow-hidden shadow-2xl">
                  {/* Decorative arc behind image for mobile */}
                  <div className="absolute top-0 right-0 w-full h-full rounded-full border-[1px] border-gold/30 -translate-y-1/2 translate-x-1/2 opacity-50 dark:opacity-20 pointer-events-none md:hidden" />
                  <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" alt="Modern Building" className="w-full h-full object-cover relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0a192f]/40 dark:from-[#0a0f1c]/80 to-transparent z-10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="bg-[#0a192f] dark:bg-[#0d1326] py-8 md:py-16 mt-4 rounded-xl mx-4 md:mx-8 md:rounded-none md:mx-0 shadow-xl border border-gray-800 md:border-none">
          <div className="container mx-auto px-2 md:px-8">
            <div className="grid grid-cols-4 divide-x divide-white/10 dark:divide-white/5">
              
              <div className="flex flex-col items-center text-center px-1 md:px-4">
                <div className="text-gold mb-2 md:mb-4">
                  <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><path d="M9 7h6"/><path d="M9 11h6"/></svg>
                </div>
                <h3 className="text-xl md:text-3xl font-bold text-white mb-1">10+</h3>
                <p className="text-white font-semibold text-[10px] md:text-sm mb-1 leading-tight">Anak Perusahaan</p>
                <p className="text-slate-400 text-[9px] md:text-xs hidden md:block">Beroperasi di berbagai sektor strategis</p>
              </div>
              
              <div className="flex flex-col items-center text-center px-1 md:px-4">
                <div className="text-gold mb-2 md:mb-4">
                  <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="text-xl md:text-3xl font-bold text-white mb-1">500+</h3>
                <p className="text-white font-semibold text-[10px] md:text-sm mb-1 leading-tight">Profesional</p>
                <p className="text-slate-400 text-[9px] md:text-xs hidden md:block">Talenta terbaik yang menggerakkan inovasi</p>
              </div>
              
              <div className="flex flex-col items-center text-center px-1 md:px-4">
                <div className="text-gold mb-2 md:mb-4">
                  <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                </div>
                <h3 className="text-xl md:text-3xl font-bold text-white mb-1">5+</h3>
                <p className="text-white font-semibold text-[10px] md:text-sm mb-1 leading-tight">Sektor Bisnis</p>
                <p className="text-slate-400 text-[9px] md:text-xs hidden md:block">Portofolio bisnis yang terdiversifikasi</p>
              </div>
              
              <div className="flex flex-col items-center text-center px-1 md:px-4">
                <div className="text-gold mb-2 md:mb-4">
                  <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                <h3 className="text-sm md:text-xl font-bold text-white mb-1 mt-1.5 md:mt-2">Berkelanjutan</h3>
                <p className="text-slate-400 text-[9px] md:text-xs leading-tight hidden md:block">Komitmen pada pertumbuhan jangka panjang dan nilai berkelanjutan</p>
              </div>
              
            </div>
          </div>
        </section>

        {/* PORTFOLIO SECTION */}
        <section id="portofolio" className="py-16 md:py-20 bg-white dark:bg-[#0a0f1c]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12">
              <div>
                <span className="text-gold text-xs md:text-sm tracking-widest uppercase font-semibold block mb-2">Bisnis Kami</span>
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">Portofolio yang Terdiversifikasi</h2>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-2 md:mt-3 max-w-2xl">Berbagai sektor usaha yang saling bersinergi untuk menciptakan nilai tambah.</p>
              </div>
              <div className="hidden md:flex gap-4 mt-6 md:mt-0">
                <button className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <button className="w-12 h-12 rounded-full bg-[#0a192f] dark:bg-transparent dark:border dark:border-gold flex items-center justify-center hover:bg-gold transition-colors group">
                  <ArrowRight className="w-5 h-5 text-white dark:text-gold group-hover:text-white" />
                </button>
              </div>
            </div>
            
            {/* Horizontal Scroll for Mobile, Grid for Desktop */}
            <div className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar gap-4 md:grid-cols-2 lg:grid-cols-5 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
              {[
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: "Energi & Sumber Daya", desc: "Pengelolaan energi dan sumber daya alam secara berkelanjutan." },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><path d="M9 7h6"/><path d="M9 11h6"/></svg>, title: "Properti & Konstruksi", desc: "Pengembangan properti dan konstruksi berkualitas tinggi." },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>, title: "Industri & Manufaktur", desc: "Solusi industri dan manufaktur berstandar global." },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>, title: "Teknologi & Digital", desc: "Inovasi teknologi untuk masa depan yang lebih baik." },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>, title: "Lainnya", desc: "Unit bisnis lainnya yang mendukung ekosistem kami." }
              ].map((item, idx) => (
                <div key={idx} className="min-w-[75%] sm:min-w-[300px] md:min-w-0 snap-center border border-gray-200 dark:border-gray-800 rounded-xl p-5 md:p-6 hover:shadow-lg transition-shadow bg-white dark:bg-[#0d1326] flex flex-col group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded bg-orange-50 dark:bg-transparent dark:border dark:border-gray-800 flex items-center justify-center text-gold mb-4 md:mb-6 group-hover:bg-gold group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1">{item.desc}</p>
                  <a href="#" className="inline-flex items-center text-xs md:text-sm font-medium text-gold hover:text-yellow-600 transition-colors mt-auto">
                    Lihat Perusahaan <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BERITA TERKINI SECTION */}
        <section id="berita" className="py-16 md:py-20 bg-gray-50 dark:bg-[#0a0f1c] relative border-t border-gray-100 dark:border-gray-900">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-row justify-between items-end mb-8 md:mb-12">
              <div>
                <span className="text-gold text-xs md:text-sm tracking-widest uppercase font-semibold block mb-1">Berita Terkini</span>
                <a href="#" className="text-xs font-medium text-slate-600 dark:text-gold flex items-center md:hidden">
                  Lihat Semua Berita <ArrowRight className="w-3 h-3 ml-1" />
                </a>
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white hidden md:block mt-2">Informasi & Kegiatan Terbaru</h2>
              </div>
              <a href="#" className="hidden md:flex px-6 py-2 border border-gray-300 dark:border-gray-700 text-slate-700 dark:text-slate-300 rounded-sm text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                Lihat Semua Berita
              </a>
            </div>

            <div className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar gap-4 md:grid-cols-3 -mx-4 px-4 md:mx-0 md:px-0 pb-6 md:pb-0">
              {[
                { img: "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?q=80&w=1932&auto=format&fit=crop", date: "20 Mei 2025", title: "Rapat Strategis Nawasena Holding: Menatap Masa Depan", desc: "Membahas strategi pertumbuhan dan inovasi berkelanjutan di seluruh lini bisnis." },
                { img: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?q=80&w=2056&auto=format&fit=crop", date: "15 Mei 2025", title: "Komitmen pada Keberlanjutan Lingkungan", desc: "Nawasena Holding terus berkomitmen mendukung inisiatif keberlanjutan di setiap lini usaha." },
                { img: "https://images.unsplash.com/photo-1444419988131-046ed4e508c7?q=80&w=2070&auto=format&fit=crop", date: "10 Mei 2025", title: "Ekspansi Bisnis di Sektor Strategis", desc: "Langkah strategis memperkuat portofolio bisnis di sektor potensial." }
              ].map((news, idx) => (
                <div key={idx} className="min-w-[85%] sm:min-w-[320px] md:min-w-0 snap-center bg-white dark:bg-[#0d1326] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={news.img} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5 md:p-6 flex-1 flex flex-col">
                    <div className="flex items-center text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mb-2 md:mb-3">
                      <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5" />
                      {news.date}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-gold transition-colors">
                      <a href="#">{news.title}</a>
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-auto">
                      {news.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Dots for mobile */}
            <div className="flex md:hidden justify-center items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-gold"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-8 px-4 md:px-8 bg-white dark:bg-[#0a0f1c]">
          <div className="container mx-auto">
            <div className="relative bg-[#0a192f] dark:bg-[#0d1326] rounded-2xl overflow-hidden border border-gray-800">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
              <div className="absolute bottom-0 right-0 w-[300px] h-[100px] border-t border-gold/30 rounded-t-[100%] opacity-40 pointer-events-none hidden md:block" />
              
              <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 md:p-0 text-gold hidden sm:block">
                    <Users className="w-10 h-10 md:w-16 md:h-16" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-3xl font-serif font-bold text-white mb-1 md:mb-3">Mari Bekerja Sama</h2>
                    <p className="text-xs md:text-sm text-slate-300 max-w-lg leading-relaxed">Kami terbuka untuk kolaborasi dan peluang kerja sama strategis untuk pertumbuhan bersama.</p>
                  </div>
                </div>
                <div className="w-full md:w-auto text-right md:text-left mt-2 md:mt-0">
                  <a href="#kontak" className="inline-block px-6 py-2.5 md:px-8 md:py-3.5 bg-gold text-[#0a192f] text-sm font-bold hover:bg-yellow-500 transition-colors rounded-md shadow-lg whitespace-nowrap">
                    Hubungi Kami
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="kontak" className="bg-[#050914] pt-16 pb-8 border-t border-gray-900">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="space-y-4 md:space-y-6">
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo-dark.png" alt="Nawasena" className="h-12 md:h-20 object-contain" onError={(e) => {
                    const target = e.currentTarget
                    if (target.src.includes('.png')) {
                      target.src = target.src.replace('.png', '.jpg')
                    } else if (target.src.includes('.jpg')) {
                      target.src = target.src.replace('.jpg', '.jpeg')
                    } else {
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }
                  }} />
                <span className="hidden text-2xl font-bold tracking-tight text-white">
                  NAWASENA <span className="text-gold">HOLDING</span>
                </span>
              </Link>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-xs">
                Membangun masa depan melalui inovasi, integritas, dan kolaborasi untuk memberikan nilai terbaik bagi semua pemangku kepentingan.
              </p>
              <div className="flex gap-4 pt-2">
                <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-800 flex items-center justify-center text-slate-400 hover:text-gold hover:border-gold transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-800 flex items-center justify-center text-slate-400 hover:text-gold hover:border-gold transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-800 flex items-center justify-center text-slate-400 hover:text-gold hover:border-gold transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                </a>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              <h4 className="text-white font-bold mb-4 md:mb-6 text-sm md:text-base">Navigasi</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-slate-400">
                <li><a href="#beranda" className="hover:text-gold transition-colors">Beranda</a></li>
                <li><a href="#portofolio" className="hover:text-gold transition-colors">Anak Perusahaan</a></li>
                <li><a href="#layanan" className="hover:text-gold transition-colors">Layanan</a></li>
                <li><a href="#berita" className="hover:text-gold transition-colors">Berita</a></li>
                <li><a href="#tentang" className="hover:text-gold transition-colors">Tentang Kami</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 md:mb-6 text-sm md:text-base">Lainnya</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-slate-400">
                <li><a href="#" className="hover:text-gold transition-colors">Karir</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Hubungi Kami</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Syarat & Ketentuan</a></li>
                <li><Link to="/admin/login" className="hover:text-gold transition-colors text-slate-500">Login Admin</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 md:mb-6 text-sm md:text-base">Kontak</h4>
              <ul className="space-y-3 md:space-y-4 text-xs md:text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gold shrink-0 mt-0.5" />
                  <span>Jl. Jenderal Sudirman Kav. 52-53<br/>Jakarta 12190, Indonesia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-gold shrink-0" />
                  <span>+62 21 1234 5678</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-gold shrink-0" />
                  <span>info@nawasena.co.id</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-900 pt-6 text-center text-[10px] md:text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Nawasena Holding. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
