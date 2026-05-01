import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const STATIC_ROUTES = [
  { url: siteUrl, changeFrequency: 'weekly' as const, priority: 1 },
  { url: `${siteUrl}/buscar`, changeFrequency: 'weekly' as const, priority: 0.6 },
  { url: `${siteUrl}/login`, changeFrequency: 'yearly' as const, priority: 0.3 },
  { url: `${siteUrl}/registro`, changeFrequency: 'yearly' as const, priority: 0.3 },
  { url: `${siteUrl}/aviso-legal`, changeFrequency: 'yearly' as const, priority: 0.2 },
  { url: `${siteUrl}/privacidad`, changeFrequency: 'yearly' as const, priority: 0.2 },
  { url: `${siteUrl}/cookies`, changeFrequency: 'yearly' as const, priority: 0.2 },
  { url: `${siteUrl}/faq`, changeFrequency: 'monthly' as const, priority: 0.4 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: cards } = await (supabase.from('cards') as any)
    .select('updated_at, work:works(slug)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(1000)

  const fichaRoutes: MetadataRoute.Sitemap = (cards ?? [])
    .filter((c: any) => c.work?.slug)
    .map((c: any) => ({
      url: `${siteUrl}/ficha/${c.work.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  return [...STATIC_ROUTES, ...fichaRoutes]
}
