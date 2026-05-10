import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { HomeSections } from '@/components/home-sections'
import { HeroActions } from '@/components/HeroActions'
import { CommunityCallout } from '@/components/community-callout'
import { localizeWork } from '@/lib/localize-work'
import type { CardWithWork } from '@/types/database'

export const dynamic = 'force-dynamic'

async function getData(locale: string) {
  const supabase = await createClient()
  const [{ data }, { count }] = await Promise.all([
    (supabase
      .from('cards')
      .select('*, work:works(*)')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(60) as any),
    (supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published') as any),
  ])

  const rawCards = (data ?? []) as CardWithWork[]
  // Aplica traducciones cacheadas de title/overview a nivel work si existen
  const cards = rawCards.map((c) => ({ ...c, work: localizeWork(c.work, locale) }))
  const featuredIndex = cards.length > 0 ? Math.floor(Math.random() * Math.min(cards.length, 20)) : 0
  const featured = cards[featuredIndex] ?? null
  const recent = cards.filter((_, i) => i !== featuredIndex).slice(0, 6)
  const movies = cards.filter((c) => c.work.type === 'movie').slice(0, 6)
  const series = cards.filter((c) => c.work.type === 'series').slice(0, 6)
  const books = cards.filter((c) => c.work.type === 'book').slice(0, 6)

  return { featured, recent, movies, series, books, total: (count as number | null) ?? cards.length }
}

export default async function HomePage() {
  const t = await getTranslations('Home')
  const locale = await getLocale()
  const { featured, recent, movies, series, books, total } = await getData(locale)

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-ink/10 px-4 pb-10 pt-16 text-center">
        <h1 className="font-serif text-[34px] font-black leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-[56px]">
          {t('hero.titleStart')}<br className="hidden sm:inline" /> {t('hero.titleBreak')}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-ink/65 sm:text-lg">
          {t('hero.subtitle')}
        </p>
        <HeroActions />
        {total > 0 && (
          <p className="mt-5 text-sm text-ink/55">
            {t.rich('hero.communityCount', {
              count: total,
              bold: (chunks) => <span className="font-bold text-ink/80">{chunks}</span>,
            })}{' '}
            <span className="text-ink/65">{t('hero.communityCta')}</span>
          </p>
        )}
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-ink/15 bg-ink/[0.03] px-6 py-2.5 text-[15px] font-medium text-ink/65">
          <span>{t('hero.trustSpoilers')}</span>
          <span className="text-ink/25">·</span>
          <span>{t('hero.trustNoOpinions')}</span>
          <span className="text-ink/25">·</span>
          <span>{t('hero.trustCollab')}</span>
        </div>
      </section>

      <CommunityCallout />

      {/* Contenido editorial */}
      {total === 0 ? (
        <div className="py-24 text-center text-ink/55">
          <p className="text-lg">{t('empty.noCards')}</p>
          <Link
            href="/nueva-obra"
            className="mt-4 inline-block text-sm text-ink/60 underline hover:text-ink"
          >
            {t('empty.beFirst')}
          </Link>
        </div>
      ) : (
        <HomeSections
          featured={featured}
          recent={recent}
          movies={movies}
          series={series}
          books={books}
        />
      )}
    </div>
  )
}
