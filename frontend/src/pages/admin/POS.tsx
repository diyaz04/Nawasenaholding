import { useState, useEffect } from 'react'
import { getPosList, createPos, updatePos, deletePos, seedPos } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash, ChevronDown, ChevronRight, CornerDownRight, DatabaseZap } from 'lucide-react'

// Helper to format currency
const formatRp = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
}

// Tree Builder
const buildTree = (items: any[], parentId: string | null = null): any[] => {
  return items
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }))
}

export default function POS() {
  const [items, setItems] = useState<any[]>([])
  const [tree, setTree] = useState<any[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  // Dialog State
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [parentNameContext, setParentNameContext] = useState<string>('')
  
  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState('biaya')
  const [parentId, setParentId] = useState<string | null>(null)
  const [orderIndex, setOrderIndex] = useState(0)

  // Confirmation Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [posToDelete, setPosToDelete] = useState<any | null>(null)

  const fetchData = async () => {
    try {
      const data = await getPosList()
      setItems(data)
      setTree(buildTree(data, null))
      // Expand all roots by default
      const roots = data.filter((d: any) => !d.parent_id).map((d: any) => d.id)
      setExpanded(new Set([...expanded, ...roots]))
    } catch (e) {
      toast.error('Gagal memuat struktur POS')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  const openForm = (editItem: any | null = null, parentIdContext: string | null = null, parentName: string = '') => {
    setEditingId(editItem?.id || null)
    setParentId(parentIdContext)
    setParentNameContext(parentName)
    
    setName(editItem?.name || '')
    setType(editItem?.type || 'biaya')
    setOrderIndex(editItem?.order_index || 0)
    
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { parent_id: parentId, name, type, order_index: Number(orderIndex) }
      if (editingId) {
        await updatePos(editingId, payload)
        toast.success('Pos diperbarui')
      } else {
        await createPos(payload)
        toast.success('Pos baru ditambahkan')
        if (parentId) setExpanded(prev => new Set([...prev, parentId]))
      }
      setIsOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan')
    }
  }

  const handleDeleteRequest = (item: any) => {
    const hasChildren = items.some(i => i.parent_id === item.id)
    setPosToDelete({ ...item, hasChildren })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!posToDelete) return
    try {
      await deletePos(posToDelete.id)
      toast.success('Pos berhasil dihapus')
      setDeleteConfirmOpen(false)
      fetchData()
    } catch (e) {
      toast.error('Gagal menghapus Pos')
    }
  }

  const handleSeed = async () => {
    if(!confirm('Ini akan mereset dan menghapus seluruh struktur Pos Anda. Yakin buat struktur contoh?')) return
    try {
      await seedPos()
      toast.success('Struktur Pos contoh berhasil dibuat')
      fetchData()
    } catch (e) {
      toast.error('Gagal membuat struktur')
    }
  }

  const renderNode = (node: any, depth = 0) => {
    const isExpanded = expanded.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const paddingLeft = depth * 24

    return (
      <div key={node.id} className="flex flex-col">
        <div 
          className="flex items-center justify-between py-2 px-4 hover:bg-muted/50 border-b border-border/50 transition-colors group"
          style={{ paddingLeft: `${paddingLeft + 16}px` }}
        >
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <button 
              className={`w-6 h-6 flex items-center justify-center rounded hover:bg-muted ${!hasChildren && 'invisible'}`}
              onClick={() => toggleExpand(node.id)}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            <div className="flex flex-col">
              <span className="font-medium text-sm md:text-base flex items-center gap-2">
                {depth > 0 && <CornerDownRight className="w-3 h-3 text-muted-foreground/50" />}
                {node.name}
              </span>
              <div className="flex gap-2 text-[10px] md:text-xs text-muted-foreground mt-0.5">
                <span className={`px-1.5 py-0.5 rounded ${node.type === 'profit' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                  {node.type.toUpperCase()}
                </span>
                <span>Saldo: {formatRp(node.current_balance)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openForm(null, node.id, node.name)} title="Tambah Anak Pos">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openForm(node, node.parent_id)} title="Edit Pos">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRequest(node)} title="Hapus Pos">
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="flex flex-col w-full">
            {node.children.map((child: any) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pos Keuangan</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola struktur akun dompet keuangan Anda</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none" onClick={handleSeed}>
            <DatabaseZap className="mr-2 h-4 w-4" /> Data Contoh
          </Button>
          <Button className="flex-1 md:flex-none" onClick={() => openForm(null, null, 'Root')}>
            <Plus className="mr-2 h-4 w-4" /> Pos Utama
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="bg-muted px-4 py-3 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
          <span>Struktur Pohon Pos</span>
          <span>Aksi</span>
        </div>
        <div className="flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Memuat struktur pos...</div>
          ) : tree.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <p className="mb-4">Belum ada struktur pos keuangan.</p>
              <Button variant="outline" onClick={handleSeed}>Buat Struktur Contoh Sekarang</Button>
            </div>
          ) : (
            tree.map(node => renderNode(node, 0))
          )}
        </div>
      </Card>

      {/* CREATE / EDIT FORM DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Pos' : parentId ? `Tambah Anak Pos ke "${parentNameContext}"` : 'Tambah Pos Utama'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Pos</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Iklan Facebook" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Pos</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={type} onChange={e => setType(e.target.value)} required>
                <option value="biaya">Biaya / Pengeluaran</option>
                <option value="profit">Profit / Pendapatan</option>
              </select>
              <p className="text-xs text-muted-foreground">Menentukan apakah pos ini untuk menyimpan profit bersih atau menampung biaya operasional.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Urutan Tampil (Order)</label>
              <Input type="number" value={orderIndex} onChange={e => setOrderIndex(Number(e.target.value))} />
            </div>
            
            <Button type="submit" className="w-full mt-4">Simpan Pos</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Peringatan Penghapusan!</DialogTitle>
            <DialogDescription className="pt-2">
              Anda yakin ingin menghapus pos <strong>{posToDelete?.name}</strong>?
              {posToDelete?.hasChildren && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm font-medium">
                  ⚠️ PERHATIAN: Pos ini memiliki ANAK POS di bawahnya. 
                  Jika Anda melanjutkan, seluruh anak pos (beserta saldonya) akan ikut <strong>terhapus secara permanen</strong>.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete}>Ya, Hapus Permanen</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
