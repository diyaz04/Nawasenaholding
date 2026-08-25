import { useEffect, useState } from 'react'
import { getSubsidiaries } from '@/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Building } from 'lucide-react'

export default function Subsidiaries() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSubsidiaries()
      .then(res => {
        setData(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section id="subsidiaries" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Anak Perusahaan</h2>
          <p className="text-muted-foreground">Pilar bisnis yang memperkuat ekosistem Nawasena Holding.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-10 w-10 rounded-full mb-2" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 bg-background rounded-lg border border-dashed">
            <p className="text-muted-foreground">Belum ada data anak perusahaan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map(sub => (
              <Card key={sub.id} className="transition-all hover:shadow-md hover:-translate-y-1">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {sub.logo_url ? (
                      <img src={sub.logo_url} alt={sub.name} className="h-full w-full object-contain p-2" />
                    ) : (
                      <Building className="h-6 w-6" />
                    )}
                  </div>
                  <CardTitle>{sub.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm line-clamp-3">
                    {sub.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
