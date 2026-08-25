import { useState, useEffect } from 'react'
import { getPageSections, updatePageSection } from '@/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export default function ContentCMS() {
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [aboutTitle, setAboutTitle] = useState('')
  const [aboutContent, setAboutContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingHero, setSavingHero] = useState(false)
  const [savingAbout, setSavingAbout] = useState(false)

  useEffect(() => {
    getPageSections().then(res => {
      const hero = res.find((s: any) => s.section_key === 'hero')
      const about = res.find((s: any) => s.section_key === 'about')
      
      if (hero && hero.content) {
        const hc = JSON.parse(hero.content)
        setHeroTitle(hc.title || '')
        setHeroSubtitle(hc.subtitle || '')
      }
      if (about && about.content) {
        const ac = JSON.parse(about.content)
        setAboutTitle(ac.title || '')
        setAboutContent(ac.content || '')
      }
      setLoading(false)
    })
  }, [])

  const saveHero = async () => {
    setSavingHero(true)
    try {
      await updatePageSection('hero', JSON.stringify({ title: heroTitle, subtitle: heroSubtitle }))
      toast.success('Hero section disimpan')
    } catch (e) {
      toast.error('Gagal menyimpan Hero')
    }
    setSavingHero(false)
  }

  const saveAbout = async () => {
    setSavingAbout(true)
    try {
      await updatePageSection('about', JSON.stringify({ title: aboutTitle, content: aboutContent }))
      toast.success('About section disimpan')
    } catch (e) {
      toast.error('Gagal menyimpan About')
    }
    setSavingAbout(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">CMS Konten Landingpage</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Bagian Hero (Paling Atas)</CardTitle>
          <CardDescription>Teks besar yang pertama kali dilihat pengunjung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Judul Besar</label>
            <Input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="NAWASENA HOLDING" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sub-Judul (Deskripsi Singkat)</label>
            <Textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} placeholder="Membangun masa depan..." />
          </div>
          <Button onClick={saveHero} disabled={savingHero}>
            <Save className="w-4 h-4 mr-2" /> {savingHero ? 'Menyimpan...' : 'Simpan Hero'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bagian Tentang Kami (About)</CardTitle>
          <CardDescription>Profil singkat perusahaan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Judul Bagian</label>
            <Input value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} placeholder="Tentang Nawasena" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Isi Profil Perusahaan</label>
            <Textarea className="min-h-[150px]" value={aboutContent} onChange={e => setAboutContent(e.target.value)} />
          </div>
          <Button onClick={saveAbout} disabled={savingAbout}>
            <Save className="w-4 h-4 mr-2" /> {savingAbout ? 'Menyimpan...' : 'Simpan Tentang Kami'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
