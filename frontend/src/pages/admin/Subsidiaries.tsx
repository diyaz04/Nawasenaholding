import { useState, useEffect } from 'react'
import { getSubsidiaries, createSubsidiary, updateSubsidiary, deleteSubsidiary, uploadFile } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Edit, Trash, Plus } from 'lucide-react'

export default function SubsidiariesCMS() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [existingLogo, setExistingLogo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const data = await getSubsidiaries()
      setItems(data)
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
      setSlug(item.slug)
      setDescription(item.description || '')
      setWebsiteUrl(item.website_url || '')
      setOrderIndex(item.order_index || 0)
      setExistingLogo(item.logo_url || '')
    } else {
      setEditingId(null)
      setName('')
      setSlug('')
      setDescription('')
      setWebsiteUrl('')
      setOrderIndex(0)
      setExistingLogo('')
    }
    setFile(null)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let logo_url = existingLogo
      if (file) {
        const up = await uploadFile(file)
        logo_url = up.url
      }

      const payload = { name, slug, description, website_url: websiteUrl, order_index: Number(orderIndex), logo_url }

      if (editingId) {
        await updateSubsidiary(editingId, payload)
        toast.success('Berhasil diupdate')
      } else {
        await createSubsidiary(payload)
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
        await deleteSubsidiary(id)
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
        <h1 className="text-3xl font-bold tracking-tight">Anak Perusahaan</h1>
        <Button onClick={() => handleOpen()}><Plus className="mr-2 h-4 w-4"/> Tambah</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Logo</th>
                  <th className="p-4 font-medium">Nama</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Urutan</th>
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
                      {item.logo_url ? <img src={item.logo_url} alt={item.name} className="h-10 w-10 object-contain" /> : '-'}
                    </td>
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">{item.slug}</td>
                    <td className="p-4">{item.order_index}</td>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Anak Perusahaan' : 'Tambah Anak Perusahaan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama</label>
              <Input required value={name} onChange={e => { setName(e.target.value); if(!editingId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')) }} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input required value={slug} onChange={e => setSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL</label>
              <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo (Upload)</label>
              <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
              {existingLogo && !file && <img src={existingLogo} alt="Logo" className="h-12 object-contain mt-2" />}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Urutan Tampil (Order)</label>
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
