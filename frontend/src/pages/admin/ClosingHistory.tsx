import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getClosingHistory, getClosingAllocations } from '@/api'
import { toast } from 'sonner'
import { History, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

// Helper formatting
const formatRp = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
}

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

export default function ClosingHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [allocations, setAllocations] = useState<Record<string, any[]>>({})
  const [loadingAlloc, setLoadingAlloc] = useState<Record<string, boolean>>({})

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const data = await getClosingHistory()
      setHistory(data)
    } catch (e) {
      toast.error('Gagal memuat riwayat tutup buku')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    
    setExpandedId(id)
    
    if (!allocations[id]) {
      try {
        setLoadingAlloc(prev => ({ ...prev, [id]: true }))
        const allocData = await getClosingAllocations(id)
        setAllocations(prev => ({ ...prev, [id]: allocData }))
      } catch (e) {
        toast.error('Gagal memuat detail alokasi')
      } finally {
        setLoadingAlloc(prev => ({ ...prev, [id]: false }))
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Tutup Buku</h1>
        <p className="text-muted-foreground mt-1">Daftar pencatatan omset harian dan detail distribusinya.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Log Transaksi Harian</CardTitle>
          <CardDescription>Semua data tutup buku yang berhasil atau tertunda ada di sini.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-8 text-muted-foreground">Memuat riwayat...</div>
          ) : history.length === 0 ? (
            <div className="text-center p-12 border rounded-xl border-dashed bg-muted/20">
              <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold mb-1">Belum Ada Riwayat</h3>
              <p className="text-sm text-muted-foreground">Tutup buku otomatis pertama akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(record => (
                <div key={record.id} className={`border rounded-lg overflow-hidden transition-colors ${record.status === 'pending' ? 'border-amber-500/30' : 'border-border'}`}>
                  {/* Header Row */}
                  <div 
                    onClick={() => toggleExpand(record.id)}
                    className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 cursor-pointer hover:bg-muted/30 ${record.status === 'pending' ? 'bg-amber-500/5' : 'bg-card'}`}
                  >
                    <div className="flex items-center gap-4 mb-3 md:mb-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.status === 'pending' ? 'bg-amber-100' : 'bg-green-100'}`}>
                        {record.status === 'pending' ? <Clock className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      </div>
                      <div>
                        <h4 className="font-bold">{formatDate(record.closing_date)}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {record.status === 'pending' ? (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> TERTUNDA (PENDING ADS)
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">SELESAI</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Diproses: {record.processed_at ? new Date(record.processed_at + 'Z').toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'}) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto pl-14 md:pl-0">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Omset Kotor</p>
                        <p className="font-bold text-lg text-primary">{formatRp(record.total_revenue)}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Biaya Iklan</p>
                        <p className="font-bold text-destructive">
                          {record.status === 'pending' ? 'Menunggu' : formatRp(record.total_ads_cost)}
                        </p>
                      </div>
                      <div className="hidden sm:block text-muted-foreground">
                        {expandedId === record.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {expandedId === record.id && (
                    <div className="bg-muted/10 border-t p-4 sm:pl-18">
                      {record.status === 'pending' ? (
                        <div className="text-sm p-4 bg-amber-500/10 text-amber-800 rounded-md border border-amber-500/20">
                          <strong>Tutup Buku Terhenti!</strong> <br />
                          Sistem tidak bisa menarik data iklan otomatis dari Shopee Ads API. Silakan ke halaman Dashboard untuk menginput nominal biaya iklan secara manual agar distribusi saldo bisa dilanjutkan.
                        </div>
                      ) : loadingAlloc[record.id] ? (
                        <div className="text-sm text-center text-muted-foreground py-4">Memuat detail distribusi...</div>
                      ) : allocations[record.id] && allocations[record.id].length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {allocations[record.id].map((alloc: any) => (
                            <div key={alloc.id} className="bg-background border rounded-md p-3 flex justify-between items-center shadow-sm">
                              <span className="text-sm font-medium">{alloc.pos_name}</span>
                              <span className="font-bold text-primary">{formatRp(alloc.allocated_amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Tidak ada detail distribusi.</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
