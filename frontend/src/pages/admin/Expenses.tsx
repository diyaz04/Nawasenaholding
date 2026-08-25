import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getExpenses, createExpense, getPosList } from '@/api'
import { toast } from 'sonner'
import { Receipt, Search, PlusCircle, ArrowDownCircle, FilterX } from 'lucide-react'

// Helper format
const formatRp = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)

export default function Expenses() {
  const [posList, setPosList] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  
  // Data loading states
  const [loadingPos, setLoadingPos] = useState(true)
  const [loadingExp, setLoadingExp] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [posId, setPosId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')

  // Filter state
  const [filterPos, setFilterPos] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const fetchPos = async () => {
    try {
      const data = await getPosList()
      setPosList(data)
    } catch(e) {
      toast.error('Gagal memuat daftar POS')
    } finally {
      setLoadingPos(false)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoadingExp(true)
      const data = await getExpenses({ pos_id: filterPos, date: filterDate })
      setExpenses(data)
    } catch(e) {
      toast.error('Gagal memuat riwayat pengeluaran')
    } finally {
      setLoadingExp(false)
    }
  }

  useEffect(() => {
    fetchPos()
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [filterPos, filterDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!posId || !amount || !date) return toast.error('Lengkapi form pengeluaran')
    
    try {
      setSaving(true)
      await createExpense({
        pos_id: posId,
        amount: Number(amount),
        expense_date: date,
        description
      })
      toast.success('Pengeluaran berhasil dicatat!')
      
      // Reset form
      setPosId('')
      setAmount('')
      setDescription('')
      
      // Refresh data to show new balance and new history
      fetchPos()
      fetchExpenses()
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan pengeluaran')
    } finally {
      setSaving(false)
    }
  }

  const clearFilters = () => {
    setFilterPos('')
    setFilterDate('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="w-8 h-8 text-primary" /> Kelola Pengeluaran
        </h1>
        <p className="text-muted-foreground mt-1">Catat transaksi kas keluar yang bersumber dari POS terkait.</p>
      </div>

      {/* QUICK BALANCES CAROUSEL */}
      <div className="bg-card border rounded-lg p-4 flex gap-4 overflow-x-auto snap-x hide-scrollbar">
        {loadingPos ? (
          <div className="text-muted-foreground text-sm">Memuat saldo...</div>
        ) : (
          posList.map(pos => (
            <div key={pos.id} className="min-w-[200px] border rounded-md p-3 snap-start bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground truncate" title={pos.name}>{pos.name}</p>
              <p className={`text-lg font-bold mt-1 ${pos.current_balance > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {formatRp(pos.current_balance)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ADD EXPENSE FORM */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PlusCircle className="w-5 h-5" /> Catat Kas Keluar</CardTitle>
              <CardDescription>Uang akan dipotong dari saldo POS yang dipilih.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sumber Dana (POS)</label>
                  <select 
                    required
                    value={posId} 
                    onChange={e => setPosId(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="" disabled>-- Pilih POS --</option>
                    {posList.map(p => (
                      <option key={p.id} value={p.id} disabled={p.current_balance <= 0}>
                        {p.name} ({formatRp(p.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nominal (Rp)</label>
                  <Input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="Contoh: 150000" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal</label>
                  <Input 
                    type="date" 
                    required 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keterangan</label>
                  <Textarea 
                    placeholder="Contoh: Beli token listrik ruko" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full bg-destructive hover:bg-destructive/90 text-white" disabled={saving}>
                  {saving ? 'Memproses...' : 'Simpan Pengeluaran'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* EXPENSE HISTORY */}
        <div className="md:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={filterPos} 
              onChange={e => setFilterPos(e.target.value)}
              className="flex h-10 w-full sm:w-[250px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua POS</option>
              {posList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            <Input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full sm:w-[200px]"
            />
            
            {(filterPos || filterDate) && (
              <Button variant="outline" onClick={clearFilters} className="shrink-0">
                <FilterX className="w-4 h-4 mr-2" /> Reset Filter
              </Button>
            )}
          </div>

          {/* History List */}
          <Card>
            <CardContent className="p-0">
              {loadingExp ? (
                <div className="p-8 text-center text-muted-foreground">Memuat riwayat...</div>
              ) : expenses.length === 0 ? (
                <div className="p-12 text-center border-t-0 bg-muted/10 rounded-b-lg">
                  <Search className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Tidak ada transaksi pengeluaran ditemukan.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {expenses.map(exp => (
                    <div key={exp.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex shrink-0 items-center justify-center mt-1 sm:mt-0">
                          <ArrowDownCircle className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-semibold">{exp.description || 'Tanpa keterangan'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="bg-muted px-2 py-0.5 rounded font-medium">{exp.pos_name}</span>
                            <span>&bull;</span>
                            <span>{new Date(exp.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right font-bold text-destructive pl-13 sm:pl-0">
                        -{formatRp(exp.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
