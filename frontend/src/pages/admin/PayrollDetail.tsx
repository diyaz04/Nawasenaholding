import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPayrollDetail, savePayrollItems, processPayroll, getPosList } from '@/api'
import { toast } from 'sonner'
import { ArrowLeft, Save, CheckCircle2, Download, AlertTriangle } from 'lucide-react'
import html2pdf from 'html2pdf.js'

const formatRp = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export default function PayrollDetail() {
  const { id } = useParams<{id: string}>()
  const navigate = useNavigate()
  const [run, setRun] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [posGaji, setPosGaji] = useState<any>(null)
  const [fallbackPosList, setFallbackPosList] = useState<any[]>([])
  const [selectedFallback, setSelectedFallback] = useState('')
  const [processing, setProcessing] = useState(false)
  const slipRef = useRef<HTMLDivElement>(null)
  const [slipData, setSlipData] = useState<any>(null)

  const load = async () => {
    try {
      const data = await getPayrollDetail(id!)
      setRun(data)
      setItems(data.items)
      
      const pList = await getPosList()
      const gaji = pList.find((p:any) => p.id === data.pos_id_source)
      setPosGaji(gaji)
      
      // Filter out HPP and the main Gaji POS
      const fallbacks = pList.filter((p:any) => p.id !== data.pos_id_source && !p.name.toLowerCase().includes('hpp') && p.current_balance > 0)
      setFallbackPosList(fallbacks)
    } catch (e) {
      toast.error('Gagal memuat detail')
    }
  }

  useEffect(() => { load() }, [id])

  const handleSaveDraft = async () => {
    try {
      await savePayrollItems(id!, items)
      toast.success('Draft disimpan')
      load()
    } catch(e: any) {
      toast.error(e.message || 'Gagal menyimpan')
    }
  }

  const handleProcess = async () => {
    const deficit = run.total_amount - (posGaji?.current_balance || 0)
    if (deficit > 0 && !selectedFallback) {
      return toast.error('Saldo kurang! Silakan pilih POS Dana Talangan terlebih dahulu.')
    }
    
    if (!confirm('Peringatan: Aksi ini tidak dapat dibatalkan. Dana akan langsung dipotong dari POS. Lanjutkan?')) return
    
    try {
      setProcessing(true)
      // Save items first to ensure sync
      await savePayrollItems(id!, items)
      // Then process
      await processPayroll(id!, selectedFallback || undefined)
      toast.success('Penggajian berhasil diproses & dibayarkan!')
      load()
    } catch(e: any) {
      toast.error(e.message || 'Gagal memproses')
    } finally {
      setProcessing(false)
    }
  }

  const downloadSlip = async (item: any) => {
    setSlipData(item)
    // Wait for state to render
    setTimeout(async () => {
      if (!slipRef.current) return
      const opt = {
        margin:       10,
        filename:     `SlipGaji-${item.name.replace(/\s+/g, '')}-${monthNames[run.period_month]}-${run.period_year}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a5', orientation: 'landscape' }
      }
      await html2pdf().set(opt).from(slipRef.current).save()
      setSlipData(null)
    }, 100)
  }

  if (!run) return <div className="p-10">Memuat...</div>

  const isCompleted = run.status === 'completed'
  const currentTotal = items.reduce((acc, curr) => acc + (Number(curr.base_salary) + Number(curr.allowances) - Number(curr.deductions)), 0)
  const balance = posGaji?.current_balance || 0
  const deficit = currentTotal - balance

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/payroll')}><ArrowLeft className="w-4 h-4 mr-2"/> Kembali</Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detail Penggajian</h1>
          <p className="text-muted-foreground mt-1">Periode {monthNames[run.period_month]} {run.period_year}</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          Status: {run.status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5">
          <CardHeader className="pb-2"><CardTitle className="text-lg">Total Tagihan Gaji</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{formatRp(currentTotal)}</p></CardContent>
        </Card>
        
        <Card className={deficit > 0 && !isCompleted ? 'border-red-500 bg-red-50' : 'bg-green-50'}>
          <CardHeader className="pb-2"><CardTitle className="text-lg flex justify-between">
            <span>Saldo POS "{posGaji?.name}"</span>
            {deficit > 0 && !isCompleted && <AlertTriangle className="w-5 h-5 text-red-500" />}
          </CardTitle></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${deficit > 0 && !isCompleted ? 'text-red-600' : 'text-green-600'}`}>{formatRp(balance)}</p>
            {deficit > 0 && !isCompleted && (
              <p className="text-sm text-red-600 mt-2 font-medium">⚠️ Saldo kurang {formatRp(deficit)}!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {deficit > 0 && !isCompleted && (
        <Card className="border-amber-400 bg-amber-50">
          <CardContent className="pt-6">
            <h3 className="font-bold text-amber-800 flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 mr-2" /> Dana Talangan Diperlukan
            </h3>
            <p className="text-sm text-amber-700 mb-4">Karena saldo POS Gaji tidak mencukupi, silakan pilih POS lain untuk menutupi sisa kekurangan sebesar <strong>{formatRp(deficit)}</strong>. (POS HPP disembunyikan)</p>
            
            <select 
              className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedFallback}
              onChange={e => setSelectedFallback(e.target.value)}
            >
              <option value="">-- Pilih POS Dana Talangan --</option>
              {fallbackPosList.map(p => (
                <option key={p.id} value={p.id} disabled={p.current_balance < deficit}>
                  {p.name} (Saldo: {formatRp(p.current_balance)}) {p.current_balance < deficit ? '- SALDO KURANG' : ''}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rincian Gaji Karyawan</CardTitle>
          {!isCompleted && <CardDescription>Ubah nominal tunjangan dan potongan. Gaji bersih akan dihitung otomatis.</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left">Nama</th>
                  <th className="p-3 text-right">Gaji Pokok</th>
                  <th className="p-3 text-right">Tunjangan (+)</th>
                  <th className="p-3 text-right">Potongan (-)</th>
                  <th className="p-3 text-right">Gaji Bersih</th>
                  {isCompleted && <th className="p-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const net = Number(item.base_salary) + Number(item.allowances) - Number(item.deductions)
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="p-3">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.position}</div>
                      </td>
                      <td className="p-3 text-right text-gray-500">{formatRp(item.base_salary)}</td>
                      <td className="p-3 text-right">
                        {isCompleted ? formatRp(item.allowances) : (
                          <Input type="number" className="w-32 ml-auto text-right" value={item.allowances} onChange={e => {
                            const newItems = [...items]
                            newItems[idx].allowances = e.target.value
                            setItems(newItems)
                          }} />
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isCompleted ? formatRp(item.deductions) : (
                          <Input type="number" className="w-32 ml-auto text-right text-red-500" value={item.deductions} onChange={e => {
                            const newItems = [...items]
                            newItems[idx].deductions = e.target.value
                            setItems(newItems)
                          }} />
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">{formatRp(net)}</td>
                      {isCompleted && (
                        <td className="p-3 text-center">
                          <Button variant="outline" size="sm" onClick={() => downloadSlip(item)}>
                            <Download className="w-4 h-4 mr-1" /> Slip
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!isCompleted && (
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="w-4 h-4 mr-2" /> Simpan Draft
              </Button>
              <Button onClick={handleProcess} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" /> {processing ? 'Memproses...' : 'Proses & Bayarkan'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HIDDEN SLIP TEMPLATE FOR PDF */}
      {slipData && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={slipRef} style={{ width: '800px', padding: '40px', backgroundColor: 'white', color: 'black', fontFamily: 'sans-serif' }}>
            <div style={{ borderBottom: '2px solid #f97316', paddingBottom: '20px', marginBottom: '30px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ea580c', margin: '0' }}>NAWASENA HOLDING</h1>
              <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#333' }}>SLIP GAJI KARYAWAN</h2>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div>
                <p style={{ margin: '0 0 5px 0' }}><strong>Nama Karyawan:</strong> {slipData.name}</p>
                <p style={{ margin: '0' }}><strong>Jabatan:</strong> {slipData.position}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Periode:</strong> {monthNames[run.period_month]} {run.period_year}</p>
                <p style={{ margin: '0' }}><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Keterangan</th>
                  <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>Gaji Pokok</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{formatRp(slipData.base_salary)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>Tunjangan</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{formatRp(slipData.allowances)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#ef4444' }}>Potongan</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#ef4444' }}>- {formatRp(slipData.deductions)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#fff7ed', fontWeight: 'bold' }}>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>TOTAL GAJI BERSIH (TAKE HOME PAY)</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', fontSize: '18px', color: '#ea580c' }}>
                    {formatRp(Number(slipData.base_salary) + Number(slipData.allowances) - Number(slipData.deductions))}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <p style={{ marginBottom: '60px' }}>Penerima,</p>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{slipData.name}</p>
              </div>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <p style={{ marginBottom: '60px' }}>Manajemen,</p>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>NAWASENA HOLDING</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
