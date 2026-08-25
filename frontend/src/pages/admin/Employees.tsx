import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/api'
import { toast } from 'sonner'
import { Users, Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react'

const formatRp = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([])
  const [formData, setFormData] = useState({ name: '', position: '', base_salary: '', joined_at: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const load = async () => {
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (e) {
      toast.error('Gagal memuat karyawan')
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateEmployee(editingId, { ...formData, is_active: true }) // will retain status toggle separately
        toast.success('Diperbarui')
      } else {
        await createEmployee(formData)
        toast.success('Karyawan ditambahkan')
      }
      setFormData({ name: '', position: '', base_salary: '', joined_at: '' })
      setEditingId(null)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan')
    }
  }

  const handleToggleStatus = async (emp: any) => {
    try {
      await updateEmployee(emp.id, { ...emp, is_active: !emp.is_active })
      load()
    } catch (e) {
      toast.error('Gagal update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus karyawan ini?')) return
    try {
      await deleteEmployee(id)
      toast.success('Dihapus')
      load()
    } catch (e) {
      toast.error('Gagal menghapus')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Karyawan</h1>
        <p className="text-muted-foreground mt-1">Kelola data karyawan dan gaji pokok.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nama</label>
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Jabatan</label>
              <Input required value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Gaji Pokok (Rp)</label>
              <Input type="number" required value={formData.base_salary} onChange={e => setFormData({ ...formData, base_salary: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tgl Bergabung</label>
              <Input type="date" value={formData.joined_at} onChange={e => setFormData({ ...formData, joined_at: e.target.value })} />
            </div>
            <Button type="submit" className="mb-[2px]">
              {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingId ? 'Simpan' : 'Tambah'}
            </Button>
            {editingId && <Button type="button" variant="outline" className="mb-[2px]" onClick={() => { setEditingId(null); setFormData({ name: '', position: '', base_salary: '', joined_at: '' }) }}>Batal</Button>}
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <Card key={emp.id} className={!emp.is_active ? 'opacity-50' : ''}>
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">{emp.name}</CardTitle>
                <CardDescription>{emp.position}</CardDescription>
              </div>
              <Users className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg text-green-600 mb-4">{formatRp(emp.base_salary)}</p>
              
              <div className="flex justify-between items-center mt-4">
                <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(emp)} className={emp.is_active ? 'text-green-600' : 'text-red-500'}>
                  {emp.is_active ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                  {emp.is_active ? 'Aktif' : 'Nonaktif'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => { setEditingId(emp.id); setFormData({ name: emp.name, position: emp.position, base_salary: emp.base_salary, joined_at: emp.joined_at || '' }) }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(emp.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {employees.length === 0 && <p className="text-muted-foreground py-10 col-span-full text-center">Belum ada data karyawan.</p>}
      </div>
    </div>
  )
}
