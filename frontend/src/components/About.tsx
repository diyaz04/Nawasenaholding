import { useEffect, useState } from 'react'
import { getPageSection } from '@/api'
import { Skeleton } from './ui/skeleton'

export default function About() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPageSection('about')
      .then(res => {
        if (res.content) setData(JSON.parse(res.content))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section id="about" className="py-20 bg-muted/30 border-t">
      <div className="container max-w-4xl">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-[250px] mx-auto mb-8" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight mb-8">{data?.title || 'Tentang Kami'}</h2>
            <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
              {data?.content ? (
                <p>{data.content}</p>
              ) : (
                <p>Nawasena Holding adalah grup perusahaan terkemuka yang berdedikasi membangun masa depan melalui inovasi dan integrasi di berbagai sektor strategis.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
