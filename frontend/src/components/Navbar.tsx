import { useState } from 'react'
import { Menu, X, Building2 } from 'lucide-react'
import { Button } from './ui/button'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const scrollToSection = (id: string) => {
    setIsOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-xl tracking-tight cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <Building2 className="h-6 w-6 text-primary" />
          <span>NAWASENA HOLDING</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <button onClick={() => scrollToSection('subsidiaries')} className="transition-colors hover:text-primary">Anak Perusahaan</button>
          <button onClick={() => scrollToSection('products')} className="transition-colors hover:text-primary">Produk & Layanan</button>
          <button onClick={() => scrollToSection('about')} className="transition-colors hover:text-primary">Tentang Kami</button>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b bg-background p-4 flex flex-col space-y-4 shadow-lg absolute w-full left-0 top-16">
          <button onClick={() => scrollToSection('subsidiaries')} className="text-left font-medium p-2 hover:bg-accent rounded-md">Anak Perusahaan</button>
          <button onClick={() => scrollToSection('products')} className="text-left font-medium p-2 hover:bg-accent rounded-md">Produk & Layanan</button>
          <button onClick={() => scrollToSection('about')} className="text-left font-medium p-2 hover:bg-accent rounded-md">Tentang Kami</button>
        </div>
      )}
    </nav>
  )
}
