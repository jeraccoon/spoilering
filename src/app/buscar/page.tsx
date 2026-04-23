'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type WorkType = 'movie' | 'series' | 'book'
type Filter = 'all' | WorkType

interface Result {
  slug: string
  title: string
  type: WorkType
  year: number | null
  poster_url: string | null
}

const supabase = createClient()

const TYPE_LABELS: Record<WorkType, string> = { movie: 'Película', series: 'Serie', book: 'Libro' }
const TYPE_COLORS: Record<WorkType, string> = {
  movie: 'bg-blue-600 text-white',
  series: 'bg-purple-600 text-white',
  book: 'bg-amber-600 text-white',
}
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'movie', label: 'Películas' },
  { value: 'series', label: 'Series' },
  { value: 'book', label: 'Libros' },
]

export default function BuscarPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single()
      setIsAdmin(profile?.role === 'admin')
    })
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setSearched(false)

      // cards!inner filtra solo works que tienen al menos una card publicada
      let q = (supabase
        .from('works') as any)
        .select('slug, title, type, year, poster_url, cards!inner(status)')
        .eq('cards.status', 'published')
        .ilike('title', `%${query.trim()}%`)
        .order('title', { ascending: true })
        .limit(48)

      if (filter !== 'all') q = q.eq('type', filter)

      const { data } = await q
      setResults((data ?? []) as Result[])
      setSearched(true)
      setLoading(false)
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, filter])

  // re-run search when filter changes with existing query
  const isEmpty = searched && results.length === 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      {/* Cabecera */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Buscar fichas</h1>
        <p className="mt-2 text-sm text-ink/50">Solo obras que ya tienen ficha publicada en Spoilering</p>
      </div>

      {/* Input de búsqueda */}
      <div className="relative mx-auto mb-6 max-w-2xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una película, serie o libro..."
          autoFocus
          className="w-full rounded-xl border border-ink/20 bg-paper px-5 py-4 text-base text-ink placeholder-ink/30 shadow-sm outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink/30">Buscando…</span>
        )}
      </div>

      {/* Filtros de tipo */}
      <div className="mb-8 flex justify-center gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === value
                ? 'bg-ember text-white'
                : 'border border-ink/15 text-ink/50 hover:border-ink/30 hover:text-ink'
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
                  <div className="flex h-full items-center justify-center text-4xl text-ink/20">📖</div>
                )}
                <span className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[work.type]}`}>
                  {TYPE_LABELS[work.type]}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <p className="line-clamp-2 text-xs font-semibold leading-tight text-ink">{work.title}</p>
                {work.year && <p className="text-[11px] text-ink/40">{work.year}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {isEmpty && (
        <div className="py-20 text-center">
          <p className="text-lg font-semibold text-ink/40">
            No encontramos ninguna ficha para &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1 text-sm text-ink/30">Prueba con otro título o cambia el filtro de tipo</p>
          {isAdmin && (
            <Link
              href="/admin/nueva-obra"
              className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90"
            >
              + Crear ficha nueva
            </Link>
          )}
        </div>
      )}

      {/* Estado inicial */}
      {!searched && !loading && query.trim().length < 2 && (
        <div className="py-16 text-center text-ink/25">
          <p className="text-5xl">🔍</p>
          <p className="mt-4 text-sm">Escribe al menos 2 caracteres para buscar</p>
        </div>
      )}
    </div>
  )
}
