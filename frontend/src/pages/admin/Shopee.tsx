import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Store, Link2, Unlink, Activity, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { getShopeeAuthUrl, getShopeeAccounts, deleteShopeeAccount, testFetchShopee } from '@/api'

export default function Shopee() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchingTest, setFetchingTest] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const data = await getShopeeAccounts()
      setAccounts(data)
    } catch (e) {
      toast.error('Gagal memuat akun Shopee')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if coming back from OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('status') === 'success') {
      toast.success('Akun Shopee berhasil disambungkan!')
      // clean up url
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    fetchAccounts()
  }, [])

  const handleConnect = async () => {
    try {
      const res = await getShopeeAuthUrl()
      if (res.url) {
        window.location.href = res.url
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat URL Otorisasi')
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Yakin ingin memutus koneksi akun Shopee ini?')) return
    try {
      await deleteShopeeAccount(id)
      toast.success('Koneksi diputus')
      fetchAccounts()
    } catch (e) {
      toast.error('Gagal memutus koneksi')
    }
  }

  const handleTestFetch = async () => {
    try {
      setFetchingTest(true)
      setTestResult(null)
      const res = await testFetchShopee()
      setTestResult(res)
      toast.success('Berhasil melakukan test fetch API')
    } catch (e: any) {
      toast.error(e.message || 'Gagal melakukan test fetch')
    } finally {
      setFetchingTest(false)
    }
  }

  // Helper formatting
  const formatRp = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Koneksi Akun Shopee</h1>
        <p className="text-muted-foreground mt-1">Kelola integrasi dengan Shopee Open Platform API untuk tarik data otomatis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Actions */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Otorisasi Shopee</CardTitle>
              <CardDescription>Sambungkan toko Shopee Seller Center Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleConnect} className="w-full bg-[#ee4d2d] hover:bg-[#d74529] text-white">
                <Store className="mr-2 h-4 w-4" /> Sambungkan Toko Shopee
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Ambil Data</CardTitle>
              <CardDescription>Uji coba koneksi API untuk menarik pendapatan dan biaya iklan hari ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleTestFetch} disabled={fetchingTest || accounts.length === 0} variant="outline" className="w-full">
                {fetchingTest ? 'Mengambil Data...' : <><Activity className="mr-2 h-4 w-4" /> Tes Ambil Data Hari Ini</>}
              </Button>

              {testResult && (
                <div className="bg-muted p-4 rounded-lg space-y-3 text-sm mt-4 border border-border">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Toko Di-fetch</span>
                    <span className="font-semibold">{testResult.shops_fetched} Toko</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Total Pendapatan</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{formatRp(testResult.total_income)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Biaya Iklan (Ads)</span>
                    <span className="font-semibold text-red-500">
                      {testResult.ads_status === 'available' ? formatRp(testResult.total_ads_cost) : <span className="text-muted-foreground text-xs italic">Tidak Tersedia / Belum Aktif</span>}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Connected Accounts */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Toko Tersambung</CardTitle>
              <CardDescription>Daftar akun Shopee yang akses API-nya aktif.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-8 text-muted-foreground">Memuat data akun...</div>
              ) : accounts.length === 0 ? (
                <div className="text-center p-12 border rounded-xl border-dashed bg-muted/20">
                  <Store className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <h3 className="font-semibold mb-1">Belum Ada Toko</h3>
                  <p className="text-sm text-muted-foreground">Klik tombol di samping untuk menyambungkan toko pertama Anda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="w-10 h-10 rounded-full bg-[#ee4d2d]/10 flex items-center justify-center">
                          <Store className="w-5 h-5 text-[#ee4d2d]" />
                        </div>
                        <div>
                          <h4 className="font-bold flex items-center gap-2">
                            {acc.shop_name}
                            <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Aktif
                            </span>
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Shop ID: {acc.shop_id} &bull; Exp: {new Date(acc.token_expires_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      
                      <Button variant="destructive" size="sm" onClick={() => handleDisconnect(acc.id)}>
                        <Unlink className="w-4 h-4 mr-2" /> Putuskan
                      </Button>
                    </div>
                  ))}
                  
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Sistem akan otomatis melakukan refresh token sebelum kadaluarsa (30 hari) agar koneksi tetap berjalan untuk penutupan buku harian otomatis.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
