'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const TYPE_LABELS: Record<string, string> = {
  movie: 'Película',
  series: 'Serie',
  book: 'Libro',
}
const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-blue-600 text-white',
  series: 'bg-purple-600 text-white',
  book: 'bg-amber-600 text-white',
}

interface SearchResult {
  slug: string
  title: string
  type: string
  year: number | null
  poster_url: string | null
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

export function NavSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setHighlighted(-1)
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const { data } = await (supabase.from('works') as any)
        .select('slug, title, type, year, poster_url, cards!inner(status)')
        .eq('cards.status', 'published')
        .ilike('title', `%${query.trim()}%`)
        .order('title', { ascending: true })
        .limit(6)
      setResults((data ?? []) as SearchResult[])
      setHighlighted(-1)
      setLoading(false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(prev => Math.min(prev + 1, results.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(prev => Math.max(prev - 1, -1))
      return
    }
    if (e.key === 'Enter') {
      if (highlighted >= 0 && results[highlighted]) {
        router.push(`/ficha/${results[highlighted].slug}`)
        setOpen(false)
      } else if (query.trim().length >= 2) {
        router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)
        setOpen(false)
      }
    }
  }

  const showDropdown = open && (results.length > 0 || (loading && query.trim().length >= 2))

  return (
    <div ref={containerRef} className="relative flex items-center">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Buscar"
          className="flex items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-3 py-1.5 text-sm text-ink/40 transition hover:border-ink/25 hover:bg-ink/10 hover:text-ink/60 sm:w-40"
        >
          <SearchIcon />
          <span className="hidden sm:block">Buscar...</span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative sm:w-72 w-[calc(100vw-5rem)]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar series, películas, libros..."
              className="w-full rounded-lg border border-ink/20 bg-paper py-1.5 pl-9 pr-8 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/30">…</span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar búsqueda"
            className="shrink-0 rounded-lg p-1.5 text-sm text-ink/40 transition hover:text-ink"
          >
            ✕
          </button>
        </div>
      )}

      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-lg">
          {results.map((result, i) => (
            <Link
              key={result.slug}
              href={`/ficha/${result.slug}`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 transition ${
                i === highlighted ? 'bg-ember/5' : 'hover:bg-ink/5'
              }`}
            >
              <div className="relative size-8 shrink-0 overflow-hidden rounded">
                {result.poster_url ? (
                  <Image
                    src={result.poster_url}
                    alt={result.title}
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-ink/5 text-sm">📖</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{result.title}</p>
                {result.year && <p className="text-xs text-ink/40">{result.year}</p>}
              </div>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[result.type] ?? ''}`}>
                {TYPE_LABELS[result.type] ?? result.type}
              </span>
            </Link>
          ))}
          {query.trim().length >= 2 && (
            <Link
              href={`/buscar?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setOpen(false)}
              className="block border-t border-ink/10 px-4 py-2.5 text-center text-xs font-semibold text-ink/50 transition hover:bg-ink/5 hover:text-ember"
            >
              Ver todos los resultados →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
