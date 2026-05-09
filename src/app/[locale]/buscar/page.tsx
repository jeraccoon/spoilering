import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { BuscarClient, type Result, type Filter } from './buscar-client'

const VALID_FILTERS = ['all', 'movie', 'series', 'book'] as const

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tipo?: string; q?: string }>
}

const TITLE_KEY: Record<Filter, 'titleAll' | 'titleMovie' | 'titleSeries' | 'titleBook'> = {
  all: 'titleAll',
  movie: 'titleMovie',
  series: 'titleSeries',
  book: 'titleBook',
}

const DESC_KEY: Record<Filter, 'descriptionAll' | 'descriptionMovie' | 'descriptionSeries' | 'descriptionBook'> = {
  all: 'descriptionAll',
  movie: 'descriptionMovie',
  series: 'descriptionSeries',
  book: 'descriptionBook',
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params
  const search = await searchParams
  const filter = (VALID_FILTERS as readonly string[]).includes(search.tipo ?? '')
    ? (search.tipo as Filter)
    : 'all'
  const t = await getTranslations({ locale, namespace: 'BuscarPage' })
  return {
    title: t(TITLE_KEY[filter]),
    description: t(DESC_KEY[filter]),
  }
}

async function getInitialResults(filter: Filter): Promise<Result[]> {
  const supabase = await createClient()
  let q = (supabase.from('works') as any)
    .select('slug, title, type, year, poster_url, cards!inner(status)')
    .eq('cards.status', 'published')
    .order('updated_at', { ascending: false })
    .limit(60)
  if (filter !== 'all') q = q.eq('type', filter)
  const { data } = await q
  return (data ?? []) as Result[]
}

export default async function BuscarPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const search = await searchParams
  const filter: Filter = (VALID_FILTERS as readonly string[]).includes(search.tipo ?? '')
    ? (search.tipo as Filter)
    : 'all'
  const initialQuery = (search.q ?? '').slice(0, 100)
  const initialResults = await getInitialResults(filter)
  const t = await getTranslations('BuscarPage')

  return (
    <BuscarClient
      initialFilter={filter}
      initialQuery={initialQuery}
      initialResults={initialResults}
      pageTitle={t(TITLE_KEY[filter])}
    />
  )
}
