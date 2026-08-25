import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPayrollRuns, createPayrollDraft } from '@/api'
import { toast } from 'sonner'
import { Plus, Banknote, Calendar, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const formatRp = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export default function Payroll() {
  const [runs, setRuns] = useState<any[]>([])
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const navigate = useNavigate()

  const load = async () => {
    try {
      const data = await getPayrollRuns()
      setRuns(data)
    } catch (e) {
      toast.error('Gagal memuat payroll')
    }
  }

  useEffect(() => { load() }, [])

  const handleCreateDraft = async () => {
    try {
      const res = await createPayrollDraft({ period_month: Number(month), period_year: Number(year) })
      toast.success('Draft berhasil dibuat')
      navigate(`/admin/payroll/${res.id}`)
    } catch (e: any) {
      toast.error(e.message || 'Gagal membuat draft')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Penggajian Karyawan</h1>
          <p className="text-muted-foreground mt-1">Kelola gaji, tunjangan, dan slip gaji karyawan.</p>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-1 flex-1">
            <label className="text-sm font-medium">Bulan Periode</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={month} onChange={e => setMonth(e.target.value)}>
              {monthNames.map((m, i) => i > 0 && <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-sm font-medium">Tahun</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={year} onChange={e => setYear(e.target.value)}>
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Button onClick={handleCreateDraft}>
            <Plus className="w-4 h-4 mr-2" /> Buat Penggajian Baru
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {runs.map(run => (
          <Card key={run.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/admin/payroll/${run.id}`)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${run.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Periode {monthNames[run.period_month]} {run.period_year}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {run.status === 'completed' ? `Diproses: ${new Date(run.processed_at).toLocaleDateString()}` : 'Draft belum diproses'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${run.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{run.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tagihan</p>
                  <p className="font-bold text-lg">{formatRp(run.total_amount)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
        {runs.length === 0 && <p className="text-center py-10 text-muted-foreground">Belum ada riwayat penggajian.</p>}
      </div>
    </div>
  )
}
