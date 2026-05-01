import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BuscarClient, type Result, type Filter } from './buscar-client'

const VALID_FILTERS = ['all', 'movie', 'series', 'book'] as const

interface Props {
  searchParams: Promise<{ tipo?: string; q?: string }>
}

const PAGE_TITLE: Record<Filter, string> = {
  all: 'Catálogo completo',
  movie: 'Películas',
  series: 'Series',
  book: 'Libros',
}

const PAGE_DESCRIPTION: Record<Filter, string> = {
  all: 'Explora el catálogo completo de fichas con resúmenes y spoilers de películas, series y libros publicadas en Spoilering.',
  movie: 'Películas con resumen completo y spoilers en Spoilering.',
  series: 'Series con resumen completo y spoilers en Spoilering.',
  book: 'Libros con resumen completo y spoilers en Spoilering.',
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const filter = (VALID_FILTERS as readonly string[]).includes(params.tipo ?? '')
    ? (params.tipo as Filter)
    : 'all'
  return {
    title: PAGE_TITLE[filter],
    description: PAGE_DESCRIPTION[filter],
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

export default async function BuscarPage({ searchParams }: Props) {
  const params = await searchParams
  const filter: Filter = (VALID_FILTERS as readonly string[]).includes(params.tipo ?? '')
    ? (params.tipo as Filter)
    : 'all'
  const initialQuery = (params.q ?? '').slice(0, 100)
  const initialResults = await getInitialResults(filter)

  return (
    <BuscarClient
      initialFilter={filter}
      initialQuery={initialQuery}
      initialResults={initialResults}
      pageTitle={PAGE_TITLE[filter]}
    />
  )
}
