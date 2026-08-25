import { useEffect, useState } from 'react'
import { getPageSection } from '@/api'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

export default function Hero() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPageSection('hero')
      .then(res => {
        if (res.content) setData(JSON.parse(res.content))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16">
      <div className="container relative z-10 flex flex-col items-center text-center">
        {loading ? (
          <div className="space-y-4 flex flex-col items-center">
            <Skeleton className="h-12 w-[300px] md:w-[600px]" />
            <Skeleton className="h-4 w-[250px] md:w-[500px]" />
            <Skeleton className="h-4 w-[200px] md:w-[400px]" />
            <Skeleton className="h-10 w-[150px] mt-8" />
          </div>
        ) : (
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              {data?.title || "NAWASENA HOLDING"}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {data?.subtitle || "Membangun masa depan melalui inovasi dan integritas bisnis yang berkelanjutan."}
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-primary-gradient_start to-primary-gradient_end hover:opacity-90 shadow-lg text-white" onClick={() => document.getElementById('products')?.scrollIntoView({behavior: 'smooth'})}>
                Lihat Katalog
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('about')?.scrollIntoView({behavior: 'smooth'})}>
                Kenali Kami
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />
    </section>
  )
}
