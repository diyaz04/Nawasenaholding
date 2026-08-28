import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  getClosingHistory, 
  submitManualAds, 
  getDashboardMetrics, 
  getDashboardCharts, 
  getPosList 
} from '@/api'
import { 
  Wallet, 
  TrendingUp, 
  ArrowDownCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts'

const formatRp = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300', '#413ea0', '#f44236']

// Helper to build tree for POS
const buildPosTree = (items: any[], parentId: string | null = null): any[] => {
  return items
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      ...item,
      children: buildPosTree(items, item.id)
    }))
}

const PosTreeRow = ({ node, level = 0 }: { node: any, level?: number }) => (
  <>
    <div className={`flex justify-between items-center py-2 ${level === 0 ? 'font-bold border-b' : 'text-sm text-muted-foreground border-b border-dashed'}`} style={{ paddingLeft: `${level * 1.5}rem` }}>
      <span>{node.name}</span>
      <span className={node.current_balance > 0 ? (level === 0 ? 'text-primary' : 'text-green-600') : ''}>
        {formatRp(node.current_balance)}
      </span>
    </div>
    {node.children && node.children.map((child: any) => (
      <PosTreeRow key={child.id} node={child} level={level + 1} />
    ))}
  </>
)

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>({
    income_this_month: 0,
    estimated_this_month: 0,
    expenses_this_month: 0,
    total_balance: 0,
    pending_closings_count: 0
  })
  
  const [charts, setCharts] = useState<{ trend: any[], distribution: any[] }>({ trend: [], distribution: [] })
  const [posTree, setPosTree] = useState<any[]>([])
  
  const [pendingClosings, setPendingClosings] = useState<any[]>([])
  const [adsInput, setAdsInput] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  // Date Filters (default last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const loadDashboardData = async () => {
    try {
      const [m, c, pList, hList] = await Promise.all([
        getDashboardMetrics(),
        getDashboardCharts({ start_date: startDate, end_date: endDate }),
        getPosList(),
        getClosingHistory()
      ])
      
      setMetrics(m)
      setCharts(c)
      setPosTree(buildPosTree(pList))
      setPendingClosings(hList.filter((h: any) => h.status === 'pending'))
    } catch (e) {
      toast.error('Gagal memuat data dashboard')
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [startDate, endDate])

  const handleSubmitAds = async (closingId: string) => {
    const cost = Number(adsInput[closingId])
    if (isNaN(cost) || cost < 0) return toast.error('Masukkan nominal yang valid')
    
    try {
      setSubmitting(prev => ({ ...prev, [closingId]: true }))
      await submitManualAds({ closing_id: closingId, manual_ads_cost: cost })
      toast.success('Berhasil! Tutup buku dilanjutkan dan selesai.')
      
      // Refresh all data
      loadDashboardData()
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengirim data iklan')
    } finally {
      setSubmitting(prev => ({ ...prev, [closingId]: false }))
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ringkasan performa finansial dan posisi kas saat ini.</p>
      </div>

      {/* PENDING ALERTS */}
      {pendingClosings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-amber-700 dark:text-amber-500">
            <AlertTriangle className="h-5 w-5" /> 
            Perhatian: Ada {pendingClosings.length} Tutup Buku Tertunda!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingClosings.map((closing) => (
              <Card key={closing.id} className="border-amber-500/50 shadow-sm">
                <CardHeader className="pb-3 bg-amber-500/5">
                  <CardTitle className="text-base">Tanggal: {closing.closing_date}</CardTitle>
                  <CardDescription>Omset: {formatRp(closing.total_revenue)} <br/>Menunggu input biaya iklan.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="Biaya Iklan (Rp)" 
                    value={adsInput[closing.id] || ''}
                    onChange={(e) => setAdsInput(prev => ({ ...prev, [closing.id]: e.target.value }))}
                  />
                  <Button 
                    onClick={() => handleSubmitAds(closing.id)}
                    disabled={submitting[closing.id]}
                  >
                    {submitting[closing.id] ? 'Proses...' : 'Lanjutkan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Omset Real (Cair)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRp(metrics.income_this_month)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimasi (Masuk)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRp(metrics.estimated_this_month)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Saldo Kas</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRp(metrics.total_balance)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran Bulan Ini</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRp(metrics.expenses_this_month)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status Sistem</CardTitle>
            {metrics.pending_closings_count > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.pending_closings_count > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {metrics.pending_closings_count > 0 ? `${metrics.pending_closings_count} Pending` : 'All Clear'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHARTS */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
              <div>
                <CardTitle>Tren Pendapatan Harian</CardTitle>
                <CardDescription>Omset (Gross) vs Biaya Iklan</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
                <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="bg-transparent border-none text-sm w-[110px] outline-none"
                />
                <span className="text-muted-foreground">-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="bg-transparent border-none text-sm w-[110px] outline-none"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                {charts.trend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">Belum ada data di rentang tanggal ini.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.trend} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => formatRp(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="total_revenue" name="Omset Real" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="estimated_revenue" name="Estimasi Masuk" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="total_ads_cost" name="Biaya Iklan" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribusi Saldo (Akumulasi)</CardTitle>
              <CardDescription>Berdasarkan uang masuk di rentang waktu terpilih.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {charts.distribution.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">Belum ada data distribusi.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.distribution}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {charts.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatRp(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* POS BALANCES */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Rincian Saldo Terkini</CardTitle>
              <CardDescription>Total uang kas aktual di semua POS saat ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {posTree.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Belum ada data POS.</p>
                ) : (
                  posTree.map(node => (
                    <PosTreeRow key={node.id} node={node} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
