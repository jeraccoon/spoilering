'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { TYPE_BADGE as TYPE_COLORS } from '@/lib/work-types'
import { localizeWork } from '@/lib/localize-work'
import type { WorkType } from '@/types/database'

export type { WorkType }
export type Filter = 'all' | WorkType

export interface Result {
  slug: string
  title: string
  type: WorkType
  year: number | null
  poster_url: string | null
  title_translations?: Record<string, string> | null
}

const supabase = createClient()
const FILTER_VALUES: Filter[] = ['all', 'movie', 'series', 'book']

interface Props {
  initialFilter: Filter
  initialQuery: string
  initialResults: Result[]
  pageTitle: string
}

export function BuscarClient({ initialFilter, initialQuery, initialResults, pageTitle }: Props) {
  const t = useTranslations('BuscarPage')
  const tw = useTranslations('WorkType')
  const locale = useLocale()
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Result[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(initialQuery.trim().length >= 2)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(initialResults)
      setSearched(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialResults])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults(initialResults)
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      let q = (supabase.from('works') as any)
        .select('slug, title, type, year, poster_url, title_translations, cards!inner(status)')
        .eq('cards.status', 'published')
        .ilike('title', `%${query.trim()}%`)
        .order('title', { ascending: true })
        .limit(48)

      if (initialFilter !== 'all') q = q.eq('type', initialFilter)

      const { data } = await q
      const localized = ((data ?? []) as Result[]).map((w) => localizeWork(w, locale))
      setResults(localized)
      setSearched(true)
      setLoading(false)
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, initialFilter, initialResults])

  function handleFilterClick(value: Filter) {
    if (value === initialFilter) return
    const params: { tipo?: Filter; q?: string } = {}
    if (value !== 'all') params.tipo = value
    if (query.trim().length >= 2) params.q = query.trim()
    router.push({ pathname: '/buscar', query: params })
  }

  const isEmpty = searched && results.length === 0
  const isBrowsing = query.trim().length < 2

  const filterLabel = (value: Filter): string => {
    if (value === 'all') return t('filters.all')
    if (value === 'movie') return t('filters.movie')
    if (value === 'series') return t('filters.series')
    return t('filters.book')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      {/* Cabecera */}
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-black tracking-tight text-ink sm:text-4xl md:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          {isBrowsing ? t('subtitleBrowse') : t('subtitleSearch')}
        </p>
      </div>

      {/* Input de búsqueda */}
      <div className="relative mx-auto mb-6 max-w-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="w-full rounded-xl border border-ink/20 bg-paper px-5 py-4 text-base text-ink placeholder-ink/55 shadow-sm outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink/45">
            {t('loading')}
          </span>
        )}
      </div>

      {/* Filtros de tipo */}
      <div className="mb-8 flex justify-center gap-2">
        {FILTER_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => handleFilterClick(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              initialFilter === value
                ? 'bg-ember text-white'
                : 'border border-ink/15 text-ink/55 hover:border-ink/30 hover:text-ink'
            }`}
          >
            {filterLabel(value)}
          </button>
        ))}
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((work) => (
            <Link
              key={work.slug}
              href={`/ficha/${work.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper transition-all hover:border-ink/25 hover:shadow-md"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink/5">
                {work.poster_url ? (
                  <Image
                    src={work.poster_url}
                    alt={work.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 16vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-ink/25">📖</div>
                )}
                <span className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[work.type]}`}>
                  {tw(work.type)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <p className="line-clamp-2 text-xs font-semibold leading-tight text-ink">{work.title}</p>
                {work.year && <p className="text-[11px] text-ink/50">{work.year}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Sin resultados al buscar */}
      {isEmpty && (
        <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-ember/25 bg-ember/[0.04] p-8 text-center">
          <p className="text-3xl">📖</p>
          <h2 className="mt-3 font-serif text-2xl font-black leading-tight text-ink sm:text-3xl">
            {t('empty.title', { query: query.length > 60 ? query.slice(0, 60) + '…' : query })}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/70">
            {t('empty.body')}
          </p>
          <Link
            href={
              isLoggedIn
                ? { pathname: '/nueva-obra' }
                : { pathname: '/login', query: { redirect: '/nueva-obra' } }
            }
            className="mt-6 inline-block rounded-lg bg-ember px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ember/90 hover:shadow"
          >
            {t('empty.addCta')}
          </Link>
          <p className="mt-3 text-xs text-ink/50">
            {t('empty.timeNote')}{!isLoggedIn && ' ' + t('empty.needsAccount')}
          </p>
          <p className="mt-5 border-t border-ink/10 pt-4 text-xs text-ink/45">
            {t('empty.tryOther')}
          </p>
        </div>
      )}
    </div>
  )
}
