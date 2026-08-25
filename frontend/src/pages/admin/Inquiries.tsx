import { useState, useEffect } from 'react'
import { getInquiries, updateInquiryStatus } from '@/api'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { MessageSquare } from 'lucide-react'

export default function Inquiries() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const data = await getInquiries()
      setItems(data)
    } catch (e) {
      toast.error('Gagal memuat data pesan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateInquiryStatus(id, newStatus)
      toast.success('Status diperbarui')
      setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i))
    } catch (e) {
      toast.error('Gagal memperbarui status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Pesan & Pemesanan Masuk</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Pengirim</th>
                  <th className="p-4 font-medium">Produk Diminati</th>
                  <th className="p-4 font-medium">Pesan</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center">Belum ada pesan masuk</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} className={`hover:bg-muted/50 ${item.status === 'new' ? 'bg-primary/5' : ''}`}>
                    <td className="p-4 whitespace-nowrap text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.contact}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {item.product_name || 'Umum'}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate" title={item.message}>
                      {item.message || '-'}
                    </td>
                    <td className="p-4">
                      <select
                        className="text-xs border rounded p-1"
                        value={item.status || 'new'}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      >
                        <option value="new">Baru</option>
                        <option value="read">Dibaca</option>
                        <option value="resolved">Selesai / Diproses</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
