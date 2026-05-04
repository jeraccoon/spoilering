'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { TYPE_LABELS, TYPE_BADGE as TYPE_COLORS } from '@/lib/work-types'
import type { WorkType } from '@/types/database'

export type { WorkType }
export type Filter = 'all' | WorkType

export interface Result {
  slug: string
  title: string
  type: WorkType
  year: number | null
  poster_url: string | null
}

const supabase = createClient()
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'movie', label: 'Películas' },
  { value: 'series', label: 'Series' },
  { value: 'book', label: 'Libros' },
]

interface Props {
  initialFilter: Filter
  initialQuery: string
  initialResults: Result[]
  pageTitle: string
}

export function BuscarClient({ initialFilter, initialQuery, initialResults, pageTitle }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Result[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(initialQuery.trim().length >= 2)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Si cambia la prop initialResults (navegación de filtro server-side), refrescamos resultados
  // siempre que no haya búsqueda activa por texto.
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

  // Búsqueda por texto con debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      // Volvemos al catálogo SSR
      setResults(initialResults)
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      let q = (supabase.from('works') as any)
        .select('slug, title, type, year, poster_url, cards!inner(status)')
        .eq('cards.status', 'published')
        .ilike('title', `%${query.trim()}%`)
        .order('title', { ascending: true })
        .limit(48)

      if (initialFilter !== 'all') q = q.eq('type', initialFilter)

      const { data } = await q
      setResults((data ?? []) as Result[])
      setSearched(true)
      setLoading(false)
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, initialFilter, initialResults])

  function handleFilterClick(value: Filter) {
    if (value === initialFilter) return
    const params = new URLSearchParams()
    if (value !== 'all') params.set('tipo', value)
    if (query.trim().length >= 2) params.set('q', query.trim())
    const qs = params.toString()
    router.push(qs ? `/buscar?${qs}` : '/buscar')
  }

  const isEmpty = searched && results.length === 0
  const isBrowsing = query.trim().length < 2

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      {/* Cabecera */}
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-black tracking-tight text-ink sm:text-4xl md:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          {isBrowsing
            ? 'Fichas publicadas en Spoilering'
            : 'Solo obras que ya tienen ficha publicada en Spoilering'}
        </p>
      </div>

      {/* Input de búsqueda */}
      <div className="relative mx-auto mb-6 max-w-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una película, serie o libro..."
          className="w-full rounded-xl border border-ink/20 bg-paper px-5 py-4 text-base text-ink placeholder-ink/55 shadow-sm outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink/45">
            Cargando…
          </span>
        )}
      </div>

      {/* Filtros de tipo */}
      <div className="mb-8 flex justify-center gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleFilterClick(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              initialFilter === value
                ? 'bg-ember text-white'
                : 'border border-ink/15 text-ink/55 hover:border-ink/30 hover:text-ink'
            }`}
          >
            {label}
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
                  {TYPE_LABELS[work.type]}
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
            «{query.length > 60 ? query.slice(0, 60) + '…' : query}» todavía no está en Spoilering
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/70">
            Spoilering es una web colaborativa: el catálogo lo escribe la propia comunidad.
            Si la obra no está, puedes añadirla tú — la IA prepara un borrador y luego se mejora entre todos.
          </p>
          <Link
            href={isLoggedIn ? '/nueva-obra' : `/login?redirect=${encodeURIComponent('/nueva-obra')}`}
            className="mt-6 inline-block rounded-lg bg-ember px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ember/90 hover:shadow"
          >
            + Añadir esta obra
          </Link>
          <p className="mt-3 text-xs text-ink/50">
            Tarda unos 2 minutos.{!isLoggedIn && ' Necesitas una cuenta gratuita.'}
          </p>
          <p className="mt-5 border-t border-ink/10 pt-4 text-xs text-ink/45">
            ¿O prefieres probar con otro título o cambiar el filtro?
          </p>
        </div>
      )}
    </div>
  )
}
