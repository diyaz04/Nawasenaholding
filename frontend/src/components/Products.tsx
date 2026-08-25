import { useEffect, useState } from 'react'
import { getProducts, submitInquiry } from '@/api'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Package, Send } from 'lucide-react'

export default function Products() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getProducts()
      .then(res => {
        setData(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleOpenDialog = (product: any) => {
    setSelectedProduct(product)
    setSubmitSuccess(false)
    setName('')
    setContact('')
    setMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    setIsSubmitting(true)
    try {
      await submitInquiry({
        product_id: selectedProduct.id,
        name,
        contact,
        message
      })
      setSubmitSuccess(true)
    } catch (err) {
      alert("Gagal mengirim pesanan. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="products" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Katalog Produk</h2>
          <p className="text-muted-foreground">Jelajahi berbagai produk dan layanan unggulan kami.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-xl" />
                <CardHeader>
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Belum ada katalog produk.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.map(prod => (
              <Card key={prod.id} className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
                <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover transition-transform hover:scale-105" />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground/30" />
                  )}
                </div>
                <CardHeader className="flex-1">
                  <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{prod.category || 'Umum'}</div>
                  <CardTitle className="text-lg line-clamp-1">{prod.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">{prod.description}</CardDescription>
                  <div className="mt-2 text-sm text-muted-foreground">by {prod.subsidiary_name}</div>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleOpenDialog(prod)}>
                    Lihat Detail
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.category} • by {selectedProduct?.subsidiary_name}
            </DialogDescription>
          </DialogHeader>
          
          {submitSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-medium text-foreground">Berhasil Dikirim!</h3>
              <p className="text-sm text-muted-foreground">Tim kami akan segera menghubungi Anda melalui kontak yang diberikan.</p>
              <Button className="mt-4" onClick={() => setSelectedProduct(null)}>Tutup</Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="text-sm text-foreground/80 leading-relaxed mb-4">
                {selectedProduct?.description}
              </div>
              
              {selectedProduct?.price ? (
                <div className="font-bold text-lg mb-6">
                  Rp {selectedProduct.price.toLocaleString('id-ID')}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-sm">Formulir Pemesanan / Pertanyaan</h4>
                <div className="space-y-2">
                  <Input placeholder="Nama Lengkap" required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Input placeholder="Nomor HP / Email" required value={contact} onChange={e => setContact(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Textarea placeholder="Pesan (opsional)" value={message} onChange={e => setMessage(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary-gradient_start to-primary-gradient_end text-white" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengirim...' : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Sekarang
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
