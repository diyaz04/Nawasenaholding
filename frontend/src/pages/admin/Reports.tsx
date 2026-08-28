import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMonthlyReport, getMonthlyReportExcelUrl } from '@/api'
import { toast } from 'sonner'
import { Download, FileText, Search, Loader2 } from 'lucide-react'
import html2pdf from 'html2pdf.js'

const formatRp = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)

export default function Reports() {
  const d = new Date()
  const [month, setMonth] = useState(String(d.getMonth() + 1).padStart(2, '0'))
  const [year, setYear] = useState(String(d.getFullYear()))
  
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  
  const reportRef = useRef<HTMLDivElement>(null)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const data = await getMonthlyReport(month, year)
      setReport(data)
    } catch (e) {
      toast.error('Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [month, year])

  const handleExportExcel = () => {
    if (!report || report.daily_details.length === 0) return toast.error('Tidak ada data untuk diexport')
    // Open the download URL in a new tab which triggers the file download
    window.open(getMonthlyReportExcelUrl(month, year), '_blank')
  }

  const handleExportPdf = async () => {
    if (!report || report.daily_details.length === 0) return toast.error('Tidak ada data untuk diexport')
    if (!reportRef.current) return
    
    try {
      setExportingPdf(true)
      const element = reportRef.current
      const opt = {
        margin:       10,
        filename:     `Laporan-NAWASENA-HOLDING-${month}-${year}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }
      
      await html2pdf().set(opt).from(element).save()
      toast.success('PDF berhasil diunduh')
    } catch (e) {
      toast.error('Gagal men-generate PDF')
    } finally {
      setExportingPdf(false)
    }
  }

  const hasData = report && report.daily_details && report.daily_details.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Bulanan</h1>
          <p className="text-muted-foreground mt-1">Generate laporan keuangan dan distribusi pos per bulan.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={String(i+1).padStart(2, '0')}>
                {new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={e => setYear(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mr-2" /> Memuat data laporan...
        </div>
      ) : !hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">Tidak Ada Data</h3>
            <p className="text-muted-foreground max-w-sm mt-1">
              Belum ada data tutup buku yang berstatus Selesai (Completed) pada bulan {month}/{year}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white">
              <Download className="w-4 h-4 mr-2" /> Unduh Excel (.xlsx)
            </Button>
            <Button onClick={handleExportPdf} variant="outline" disabled={exportingPdf}>
              {exportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              {exportingPdf ? 'Memproses PDF...' : 'Unduh PDF (.pdf)'}
            </Button>
          </div>

          {/* REPORT PREVIEW WRAPPER FOR PDF */}
          <div className="bg-white text-black p-8 rounded-lg border shadow-sm overflow-x-auto" ref={reportRef} style={{ minWidth: '800px' }}>
            
            {/* KOP LAPORAN */}
            <div className="border-b-2 border-orange-500 pb-4 mb-6 text-center">
              <h1 className="text-2xl font-bold text-orange-600 uppercase">NAWASENA HOLDING</h1>
              <h2 className="text-lg font-semibold mt-1">Laporan Keuangan Bulanan</h2>
              <p className="text-gray-500">Periode: {new Date(Number(year), Number(month)-1, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
            </div>

            {/* RINGKASAN */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="border p-4 rounded bg-gray-50 text-center">
                <p className="text-sm text-gray-500 font-medium">Total Omset</p>
                <p className="text-lg font-bold text-green-600 mt-1">{formatRp(report.summary.total_revenue)}</p>
              </div>
              <div className="border p-4 rounded bg-gray-50 text-center">
                <p className="text-sm text-gray-500 font-medium">Total Iklan</p>
                <p className="text-lg font-bold text-red-500 mt-1">{formatRp(report.summary.total_ads)}</p>
              </div>
              <div className="border p-4 rounded bg-gray-50 text-center">
                <p className="text-sm text-gray-500 font-medium">Pengeluaran POS</p>
                <p className="text-lg font-bold text-red-500 mt-1">{formatRp(report.summary.total_expense)}</p>
              </div>
              <div className="border border-orange-200 p-4 rounded bg-orange-50 text-center">
                <p className="text-sm text-orange-600 font-medium">Saldo Bersih Bulan Ini</p>
                <p className="text-lg font-bold text-orange-700 mt-1">{formatRp(report.summary.net_balance)}</p>
              </div>
            </div>

            {/* DISTRIBUSI PER POS */}
            <h3 className="font-bold text-lg mb-3 border-b pb-1">Distribusi Per POS</h3>
            <table className="w-full text-sm mb-8 border-collapse">
              <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="border p-2 text-left">Nama POS</th>
                  <th className="border p-2 text-right">Pemasukan</th>
                  <th className="border p-2 text-right">Pengeluaran</th>
                  <th className="border p-2 text-right">Saldo Bersih</th>
                </tr>
              </thead>
              <tbody>
                {report.pos_distribution.map((p: any) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="border p-2">
                      <div style={{ paddingLeft: p.parent_id ? '20px' : '0', fontWeight: p.parent_id ? 'normal' : 'bold' }}>
                        {p.parent_id ? '↳ ' : ''}{p.name}
                      </div>
                    </td>
                    <td className="border p-2 text-right text-green-600">{formatRp(p.monthly_income)}</td>
                    <td className="border p-2 text-right text-red-500">{formatRp(p.monthly_expense)}</td>
                    <td className="border p-2 text-right font-semibold">{formatRp(p.monthly_net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* RINCIAN HARIAN */}
            <h3 className="font-bold text-lg mb-3 border-b pb-1">Rincian Omset Harian</h3>
            <table className="w-full text-sm border-collapse mb-8">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Tanggal</th>
                  <th className="border p-2 text-right">Estimasi (Masuk)</th>
                  <th className="border p-2 text-right">Omset Real (Cair)</th>
                  <th className="border p-2 text-right">Biaya Iklan</th>
                  <th className="border p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.daily_details.map((d: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="border p-2">{d.closing_date}</td>
                    <td className="border p-2 text-right text-blue-600">{formatRp(d.estimated_revenue)}</td>
                    <td className="border p-2 text-right text-green-600">{formatRp(d.total_revenue)}</td>
                    <td className="border p-2 text-right">{formatRp(d.total_ads_cost)}</td>
                    <td className="border p-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${d.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right text-xs text-gray-400 mt-10">
              Dicetak pada: {new Date().toLocaleString('id-ID')}
            </div>

          </div>
        </>
      )}
    </div>
  )
}
