import { useState, useEffect, useMemo } from 'react'
import { getPatternsList, getPatternDetail, createPattern, updatePattern, deletePattern, seedPattern, getPosList, updatePatternStatus } from '@/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Edit, Trash, DatabaseZap, Calculator, AlertTriangle, ArrowLeft, CornerDownRight, CheckCircle2, XCircle } from 'lucide-react'

// Helper to format currency
const formatRp = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
}

const buildTree = (items: any[], parentId: string | null = null): any[] => {
  return items
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }))
}

type AllocData = { type: 'percentage' | 'nominal', percentage: number, nominal_amount: number }

export default function Patterns() {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [patterns, setPatterns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pos Tree State
  const [posItems, setPosItems] = useState<any[]>([])
  const [posTree, setPosTree] = useState<any[]>([])
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [allocations, setAllocations] = useState<Record<string, AllocData>>({})
  
  // Preview State
  const [previewInput, setPreviewInput] = useState<number>(10000000)

  const fetchPatterns = async () => {
    try {
      setLoading(true)
      const data = await getPatternsList()
      setPatterns(data)
    } catch (e) {
      toast.error('Gagal memuat pola distribusi')
    } finally {
      setLoading(false)
    }
  }

  const loadDependencies = async () => {
    try {
      const posData = await getPosList()
      setPosItems(posData)
      setPosTree(buildTree(posData, null))
    } catch (e) {
      toast.error('Gagal memuat data POS')
    }
  }

  useEffect(() => { 
    fetchPatterns() 
    loadDependencies()
  }, [])

  const handleOpenForm = async (pattern?: any) => {
    if (pattern) {
      setEditingId(pattern.id)
      setName(pattern.name)
      setDescription(pattern.description || '')
      setIsActive(pattern.is_active === 1)
      try {
        const detail = await getPatternDetail(pattern.id)
        setAllocations(detail.allocations || {})
      } catch (e) {
        toast.error('Gagal memuat detail pola')
        return
      }
    } else {
      setEditingId(null)
      setName('')
      setDescription('')
      setIsActive(true) // Default active for new
      setAllocations({})
    }
    setView('form')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (invalidLevels.length > 0) {
      if(!confirm('Ada level POS yang total persentasenya BUKAN 100%. Yakin ingin menyimpan sebagai draft?')) return
    }

    try {
      const payload = { name, description, is_active: isActive, allocations }
      if (editingId) {
        await updatePattern(editingId, payload)
        toast.success('Pola diperbarui')
      } else {
        await createPattern(payload)
        toast.success('Pola baru dibuat')
      }
      setView('list')
      fetchPatterns()
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus pola ini?')) {
      try {
        await deletePattern(id)
        toast.success('Pola dihapus')
        fetchPatterns()
      } catch (e) {
        toast.error('Gagal menghapus')
      }
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updatePatternStatus(id, !currentStatus)
      toast.success('Status diubah')
      fetchPatterns()
    } catch (e) {
      toast.error('Gagal mengubah status')
    }
  }

  const handleSeed = async () => {
    if(!confirm('Yakin membuat pola contoh?')) return
    try {
      await seedPattern()
      toast.success('Pola contoh berhasil dibuat')
      fetchPatterns()
    } catch (e: any) {
      toast.error(e.message || 'Gagal membuat pola contoh')
    }
  }

  const updateAlloc = (posId: string, field: keyof AllocData, val: any) => {
    setAllocations(prev => {
      const current = prev[posId] || { type: 'percentage', percentage: 0, nominal_amount: 0 }
      return { ...prev, [posId]: { ...current, [field]: val } }
    })
  }

  // --- CALCULATIONS (Memoized) ---
  const previewData = useMemo(() => {
    const result: Record<string, number> = {}
    
    const calc = (nodes: any[], parentAmount: number) => {
      // Pass 1: Deduct Nominals (For both Biaya and Profit)
      let totalAllocated = 0
      nodes.forEach(node => {
        const a = allocations[node.id]
        if (a?.type === 'nominal') {
          const amt = Math.min(a.nominal_amount || 0, parentAmount - totalAllocated)
          result[node.id] = amt
          totalAllocated += amt
        }
      })

      const baseForPercentages = parentAmount - totalAllocated

      // Pass 2: Calculate explicit percentages ONLY for 'biaya' (Pengeluaran)
      nodes.forEach(node => {
        const a = allocations[node.id]
        if (node.type === 'biaya' && (!a || a.type === 'percentage')) {
          const pct = a?.percentage || 0
          // Calculate from the remaining base, clamp to prevent negative profit
          const amt = Math.min(baseForPercentages * (pct / 100), parentAmount - totalAllocated)
          result[node.id] = amt
          totalAllocated += amt
        }
      })

      // Pass 3: Dump the final remaining amount into 'profit' (Pendapatan) nodes
      const finalRemainder = parentAmount - totalAllocated
      const profitNodes = nodes.filter(n => n.type === 'profit' && allocations[n.id]?.type !== 'nominal')
      
      if (profitNodes.length > 0) {
        // If multiple profit nodes, distribute proportionally based on inputted percentages
        const totalProfitPct = profitNodes.reduce((sum, n) => sum + (allocations[n.id]?.percentage || 0), 0)
        profitNodes.forEach(node => {
          if (totalProfitPct > 0) {
            result[node.id] = finalRemainder * ((allocations[node.id].percentage || 0) / totalProfitPct)
          } else {
            result[node.id] = finalRemainder / profitNodes.length
          }
        })
      }

      // Recursively run for children
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          calc(node.children, result[node.id] || 0)
        }
      })
    }
    
    calc(posTree, previewInput)
    return result
  }, [posTree, allocations, previewInput])

  const invalidLevels = useMemo(() => {
    const errors: string[] = []
    
    // Check root level: total allocated should equal previewInput
    const rootSum = posTree.reduce((sum, n) => sum + (previewData[n.id] || 0), 0)
    // Use a small epsilon for floating point comparison
    if (posTree.length > 0 && Math.abs(rootSum - previewInput) > 0.01) {
      errors.push('root')
    }

    // Check children recursively
    const checkNode = (node: any) => {
      if (node.children && node.children.length > 0) {
        const childSum = node.children.reduce((sum: number, c: any) => sum + (previewData[c.id] || 0), 0)
        const parentAmt = previewData[node.id] || 0
        
        // Only check if parentAmt > 0 to avoid division by zero logic, but actually just check absolute sum
        if (Math.abs(childSum - parentAmt) > 0.01) {
          errors.push(node.id)
        }
        node.children.forEach(checkNode)
      }
    }
    posTree.forEach(checkNode)
    
    return errors
  }, [posTree, previewData, previewInput])

  // Recursive Tree Renderer for Form
  const renderPosRow = (node: any, depth = 0, parentError = false) => {
    const hasError = invalidLevels.includes(node.id)
    const paddingLeft = depth * 24 + 16
    
    const alloc = allocations[node.id] || { type: 'percentage', percentage: 0, nominal_amount: 0 }
    const allocatedAmt = previewData[node.id] || 0
    
    // Calculate equivalent percentage for nominals to show to user
    const parentAmt = depth === 0 ? previewInput : (previewData[node.parent_id] || 0)
    const equivPct = parentAmt > 0 ? ((allocatedAmt / parentAmt) * 100).toFixed(1) : '0'

    return (
      <div key={node.id} className="flex flex-col border-b border-border/40 last:border-0">
        <div 
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 pr-4 transition-colors hover:bg-muted/30 ${parentError ? 'bg-red-500/5' : ''}`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            {depth > 0 && <CornerDownRight className="w-4 h-4 text-muted-foreground/50" />}
            <span className={`font-medium ${parentError ? 'text-red-600 dark:text-red-400' : ''}`}>{node.name}</span>
            {hasError && <AlertTriangle className="w-4 h-4 text-red-500 ml-2" title="Total alokasi level ini tidak 100%" />}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto pl-6 sm:pl-0">
            <select 
              value={alloc.type} 
              onChange={e => updateAlloc(node.id, 'type', e.target.value)}
              className={`h-9 border rounded-md text-sm px-2 bg-background ${parentError ? 'border-red-500' : ''}`}
            >
              <option value="percentage">% Persen</option>
              <option value="nominal">Rp Statis</option>
            </select>

            {alloc.type === 'percentage' ? (
              <div className="flex items-center gap-1 w-32 relative">
                <Input 
                  type="number" step="0.01" min="0" max="100"
                  value={alloc.percentage || ''}
                  onChange={e => updateAlloc(node.id, 'percentage', parseFloat(e.target.value) || 0)}
                  className={`h-9 text-right pr-6 ${parentError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder="0"
                />
                <span className="absolute right-2 text-muted-foreground text-xs font-bold">%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 w-32 relative">
                <Input 
                  type="number" min="0"
                  value={alloc.nominal_amount || ''}
                  onChange={e => updateAlloc(node.id, 'nominal_amount', parseFloat(e.target.value) || 0)}
                  className="h-9 text-right"
                  placeholder="0"
                />
                <span className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground whitespace-nowrap">
                  Setara {equivPct}%
                </span>
              </div>
            )}
            
            <div className="w-32 text-right text-sm font-semibold text-primary/80 bg-primary/10 py-1.5 px-3 rounded-md hidden md:block ml-2">
              {formatRp(allocatedAmt)}
            </div>
          </div>
        </div>
        
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col w-full">
            {node.children.map((child: any) => renderPosRow(child, depth + 1, hasError))}
          </div>
        )}
      </div>
    )
  }

  if (view === 'form') {
    const isRootError = invalidLevels.includes('root')
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{editingId ? 'Edit Pola Distribusi' : 'Buat Pola Baru'}</h1>
            <p className="text-muted-foreground text-sm">Atur pembagian jatah tiap pos (Bisa % atau Rp)</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Pola</label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Pola Akhir Tahun" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status Aktif</label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-background">
                    <label className="flex items-center gap-2 cursor-pointer w-full">
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
                      <span className="text-sm">Jadikan sebagai Pola Aktif</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deskripsi (Opsional)</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${invalidLevels.length > 0 ? 'border-red-500/50 shadow-sm shadow-red-500/20' : 'border-primary/20'}`}>
            <div className="bg-muted px-4 py-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Struktur Alokasi 
                  {invalidLevels.length > 0 && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Error: Alokasi Biaya Melebihi 100%</span>}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Nominal statis dipotong pertama. Pos Biaya (%) mengambil sisa. Saldo akhir ditampung otomatis ke Pos Profit.</p>
              </div>
              
              <div className="flex items-center gap-3 bg-background p-2 rounded-md border shadow-sm w-full md:w-auto">
                <Calculator className="w-4 h-4 text-muted-foreground ml-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">Preview Saldo Masuk (Rp)</span>
                  <Input 
                    type="number" 
                    value={previewInput} 
                    onChange={e => setPreviewInput(Number(e.target.value))}
                    className="h-7 text-sm font-bold border-0 bg-transparent p-0 focus-visible:ring-0 w-32 md:w-40"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col pb-2">
              {posTree.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Belum ada Pos Keuangan dibuat.</div>
              ) : (
                <>
                  <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider bg-muted/30 border-b flex justify-between ${isRootError ? 'text-red-500' : 'text-muted-foreground'}`}>
                    <span>Pos Utama (Root)</span>
                    <span className="pr-[120px] hidden sm:block">Alokasi & Preview</span>
                  </div>
                  {posTree.map(node => renderPosRow(node, 0, isRootError))}
                </>
              )}
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setView('list')}>Batal</Button>
            <Button type="submit">Simpan Pola</Button>
          </div>
        </form>
      </div>
    )
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pola Distribusi</h1>
          <p className="text-muted-foreground text-sm mt-1">Atur persentase & nominal pembagian keuangan</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleSeed}>
            <DatabaseZap className="mr-2 h-4 w-4" /> Pola Contoh
          </Button>
          <Button className="flex-1 md:flex-none" onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" /> Buat Pola Baru
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">Memuat pola...</div>
        ) : patterns.length === 0 ? (
          <div className="col-span-full p-12 flex flex-col items-center justify-center bg-muted/30 border rounded-xl border-dashed">
            <p className="mb-4 text-muted-foreground">Belum ada pola distribusi.</p>
            <Button variant="outline" onClick={handleSeed}>Buat Pola Contoh</Button>
          </div>
        ) : patterns.map(pattern => (
          <Card key={pattern.id} className={`overflow-hidden transition-all ${pattern.is_active ? 'border-primary shadow-sm shadow-primary/20' : 'border-border'}`}>
            <CardContent className="p-0">
              <div className={`px-5 py-3 border-b flex justify-between items-center ${pattern.is_active ? 'bg-primary/5' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-2">
                  {pattern.is_active ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                  <span className={`text-sm font-semibold ${pattern.is_active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {pattern.is_active ? 'POLA AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
                {/* Custom Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={pattern.is_active === 1} onChange={() => handleToggleStatus(pattern.id, pattern.is_active === 1)} />
                  <div className="w-9 h-5 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold mb-1 truncate" title={pattern.name}>{pattern.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{pattern.description || 'Tidak ada deskripsi'}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="bg-muted px-2.5 py-1 rounded-md font-medium text-muted-foreground">{pattern.pos_count || 0} Pos Diatur</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(pattern)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(pattern.id)}><Trash className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
