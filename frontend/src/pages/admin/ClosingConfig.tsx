import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getClosingConfig, updateClosingConfig, getPatternsList, runClosingNow } from '@/api'
import { Settings, PlayCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function ClosingConfig() {
  const [config, setConfig] = useState<any>(null)
  const [patterns, setPatterns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)

  // Form State
  const [time, setTime] = useState('')
  const [patternId, setPatternId] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [confData, patData] = await Promise.all([
        getClosingConfig(),
        getPatternsList()
      ])
      
      setConfig(confData)
      setTime(confData.closing_time || '23:00')
      setPatternId(confData.active_pattern_id || '')
      setIsEnabled(confData.is_enabled === 1)
      
      // Only show active patterns
      const activePats = patData.filter((p: any) => p.is_active === 1 || p.is_active === true || p.is_active === '1');
      setPatterns(activePats);
    } catch (e) {
      toast.error('Gagal memuat konfigurasi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patternId) return toast.error('Pilih pola distribusi aktif terlebih dahulu')
    if (!time) return toast.error('Tentukan jam tutup buku')

    try {
      setSaving(true)
      await updateClosingConfig({
        closing_time: time,
        active_pattern_id: patternId,
        is_enabled: isEnabled
      })
      toast.success('Konfigurasi berhasil disimpan')
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan konfigurasi')
    } finally {
      setSaving(false)
    }
  }

  const handleRunManual = async () => {
    if (!confirm('Yakin ingin menjalankan tutup buku hari ini sekarang? Proses ini akan menarik data Shopee secara live.')) return
    
    try {
      setRunning(true)
      const res = await runClosingNow()
      
      if (res.status === 'pending') {
        toast.warning(res.message || 'Iklan gagal ditarik otomatis. Silakan isi manual di Dashboard.', { duration: 6000 })
      } else {
        toast.success('Tutup buku berhasil dieksekusi!')
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal menjalankan tutup buku manual')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Konfigurasi Tutup Buku</h1>
        <p className="text-muted-foreground mt-1">Atur jadwal dan pola untuk mesin distribusi keuangan otomatis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CONFIG FORM */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Pengaturan Mesin
            </CardTitle>
            <CardDescription>Tentukan jam berapa sistem berjalan setiap hari (WIB).</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Memuat pengaturan...</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jam Eksekusi Otomatis (WIB)</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="time" 
                        required 
                        value={time} 
                        onChange={e => setTime(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pola Distribusi Aktif</label>
                    <select 
                      required
                      value={patternId} 
                      onChange={e => setPatternId(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="" disabled>-- Pilih Pola --</option>
                      {patterns.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.pos_count} POS)</option>
                      ))}
                    </select>
                    {patterns.length === 0 && (
                      <p className="text-xs text-red-500">Tidak ada pola yang aktif. Silakan aktifkan pola di menu Kelola Pola.</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t mt-4">
                    <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg bg-muted/30">
                      <input 
                        type="checkbox" 
                        checked={isEnabled} 
                        onChange={e => setIsEnabled(e.target.checked)} 
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" 
                      />
                      <div>
                        <div className="font-semibold text-sm">Aktifkan Mesin Otomatis</div>
                        <div className="text-xs text-muted-foreground">Jika dicentang, tutup buku akan berjalan sendiri setiap jam {time} WIB.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving || patterns.length === 0}>
                  {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* MANUAL TRIGGER */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <PlayCircle className="w-5 h-5" /> Eksekusi Manual
              </CardTitle>
              <CardDescription>Jalankan proses tutup buku hari ini sekarang juga tanpa menunggu jam {time} WIB.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background p-4 rounded-lg border text-sm space-y-2">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Sistem akan memastikan data hari ini belum pernah diproses (Anti-Dobel).</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Sistem akan langsung memotong biaya statis, membagi persentase biaya, dan menyetor sisa ke Profit.</span>
                </p>
              </div>

              <Button 
                onClick={handleRunManual} 
                disabled={running || !patternId} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                {running ? 'Mengeksekusi...' : 'Jalankan Tutup Buku Sekarang'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardContent className="p-4 flex gap-3 text-sm">
              <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-destructive mb-1">Catatan Keamanan (Idempotent)</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Sistem didesain agar sangat aman. Tombol manual ini bisa dipencet berkali-kali namun sistem hanya akan memproses omset 1 kali saja per tanggal. Jika ingin mengulang tutup buku hari ini, hubungi Super Admin untuk reset data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
