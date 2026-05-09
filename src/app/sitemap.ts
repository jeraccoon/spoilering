import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

interface StaticEntry {
  path: string
  changeFrequency: 'weekly' | 'yearly' | 'monthly'
  priority: number
}

const STATIC_ENTRIES: StaticEntry[] = [
  { path: '/',             changeFrequency: 'weekly',  priority: 1 },
  { path: '/buscar',       changeFrequency: 'weekly',  priority: 0.6 },
  { path: '/login',        changeFrequency: 'yearly',  priority: 0.3 },
  { path: '/registro',     changeFrequency: 'yearly',  priority: 0.3 },
  { path: '/aviso-legal',  changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/privacidad',   changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/cookies',      changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/faq',          changeFrequency: 'monthly', priority: 0.4 },
]

function urlFor(locale: string, path: string): string {
  const tail = path === '/' ? '' : path
  return `${siteUrl}/${locale}${tail}`
}

function altLanguages(path: string): Record<string, string> {
  const langs: Record<string, string> = {}
  for (const locale of routing.locales) {
    langs[locale] = urlFor(locale, path)
  }
  langs['x-default'] = urlFor(routing.defaultLocale, path)
  return langs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: cards } = await (supabase.from('cards') as any)
    .select('updated_at, work:works(slug)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(1000)

  const staticRoutes: MetadataRoute.Sitemap = STATIC_ENTRIES.map(
    ({ path, changeFrequency, priority }) => ({
      url: urlFor(routing.defaultLocale, path),
      changeFrequency,
      priority,
      alternates: { languages: altLanguages(path) },
    }),
  )

  const fichaRoutes: MetadataRoute.Sitemap = (cards ?? [])
    .filter((c: any) => c.work?.slug)
    .map((c: any) => {
      const path = `/ficha/${c.work.slug}`
      return {
        url: urlFor(routing.defaultLocale, path),
        lastModified: new Date(c.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: { languages: altLanguages(path) },
      }
    })

  return [...staticRoutes, ...fichaRoutes]
}
