import { useState, useEffect } from 'react'
import { getProducts, getSubsidiaries, createProduct, updateProduct, deleteProduct, uploadFile } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Edit, Trash, Plus, Package } from 'lucide-react'

export default function ProductsCMS() {
  const [items, setItems] = useState<any[]>([])
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [subsidiaryId, setSubsidiaryId] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [existingImage, setExistingImage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [prodRes, subRes] = await Promise.all([getProducts(), getSubsidiaries()])
      setItems(prodRes)
      setSubs(subRes)
    } catch (e) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleOpen = (item?: any) => {
    if (item) {
      setEditingId(item.id)
      setName(item.name)
      setSubsidiaryId(item.subsidiary_id)
      setCategory(item.category || '')
      setDescription(item.description || '')
      setPrice(item.price ? String(item.price) : '')
      setOrderIndex(item.order_index || 0)
      setExistingImage(item.image_url || '')
    } else {
      setEditingId(null)
      setName('')
      setSubsidiaryId(subs.length > 0 ? subs[0].id : '')
      setCategory('')
      setDescription('')
      setPrice('')
      setOrderIndex(0)
      setExistingImage('')
    }
    setFile(null)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subsidiaryId) return toast.error('Pilih anak perusahaan')
    setIsSubmitting(true)
    try {
      let image_url = existingImage
      if (file) {
        const up = await uploadFile(file)
        image_url = up.url
      }

      const payload = { 
        name, subsidiary_id: subsidiaryId, category, description, 
        price: price ? Number(price) : null, order_index: Number(orderIndex), image_url 
      }

      if (editingId) {
        await updateProduct(editingId, payload)
        toast.success('Berhasil diupdate')
      } else {
        await createProduct(payload)
        toast.success('Berhasil ditambahkan')
      }
      setIsOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus?')) {
      try {
        await deleteProduct(id)
        toast.success('Berhasil dihapus')
        fetchData()
      } catch (e) {
        toast.error('Gagal menghapus')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Katalog Produk</h1>
        <Button onClick={() => handleOpen()}><Plus className="mr-2 h-4 w-4"/> Tambah</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium w-16">Img</th>
                  <th className="p-4 font-medium">Nama</th>
                  <th className="p-4 font-medium">Anak Perusahaan</th>
                  <th className="p-4 font-medium">Kategori</th>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center">Belum ada data</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="h-10 w-10 object-cover rounded" /> : <Package className="h-8 w-8 text-muted-foreground/50"/>}
                    </td>
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">{item.subsidiary_name}</td>
                    <td className="p-4">{item.category}</td>
                    <td className="p-4 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpen(item)}><Edit className="h-4 w-4"/></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}><Trash className="h-4 w-4"/></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Produk</label>
              <Input required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Anak Perusahaan</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={subsidiaryId} 
                onChange={e => setSubsidiaryId(e.target.value)} required>
                <option value="">-- Pilih --</option>
                {subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Misal: Software" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga (Rp)</label>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Kosongkan jika negosiasi" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gambar (Upload)</label>
              <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
              {existingImage && !file && <img src={existingImage} alt="Img" className="h-20 object-contain mt-2" />}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Urutan Tampil</label>
              <Input type="number" value={orderIndex} onChange={e => setOrderIndex(Number(e.target.value))} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
