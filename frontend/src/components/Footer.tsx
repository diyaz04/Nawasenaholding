import { Building2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-background border-t py-12">
      <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center space-x-2 font-bold text-xl tracking-tight text-foreground/80">
          <Building2 className="h-6 w-6 text-primary" />
          <span>NAWASENA HOLDING</span>
        </div>
        
        <div className="flex flex-col items-center md:items-end space-y-2">
          <p className="text-sm text-muted-foreground text-center md:text-right">
            &copy; {new Date().getFullYear()} Nawasena Holding. Hak Cipta Dilindungi.
          </p>
          <a href="/admin/login" className="text-xs text-muted-foreground/50 hover:text-primary transition-colors flex items-center">
            Login Admin &rarr;
          </a>
        </div>
      </div>
    </footer>
  )
}
