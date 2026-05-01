'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { CardWithWork } from '@/types/database'
import { TYPE_LABELS, TYPE_BADGE_SOLID as TYPE_COLORS } from '@/lib/work-types'



type ViewMode = 'grid' | 'list'
type TypeFilter = 'all' | 'movie' | 'series' | 'book'
type SortKey = 'recent' | 'oldest' | 'az'

const FILTER_LABELS: Record<TypeFilter, string> = {
  all: 'Todos',
  movie: 'Películas',
  series: 'Series',
  book: 'Libros',
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'az', label: 'A–Z' },
]

function GridIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="10" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="1" y="10" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="10" y="10" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <rect x="1" y="2" width="15" height="2.5" rx="1" fill="currentColor" />
      <rect x="1" y="7.25" width="15" height="2.5" rx="1" fill="currentColor" />
      <rect x="1" y="12.5" width="15" height="2.5" rx="1" fill="currentColor" />
    </svg>
  )
}

function GridView({ cards }: { cards: CardWithWork[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/ficha/${card.work.slug}`}
          className="group flex flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper transition-all hover:border-ink/25 hover:shadow-md"
        >
          <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink/5">
            {card.work.poster_url ? (
              <Image
                src={card.work.poster_url}
                alt={card.work.title}
                fill
                sizes="(max-width: 640px) 50vw, 16vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl text-ink/20">📖</div>
            )}
            <span className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[card.work.type as keyof typeof TYPE_COLORS]}`}>
              {TYPE_LABELS[card.work.type as keyof typeof TYPE_LABELS]}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 p-2">
            <p className="line-clamp-2 text-xs font-semibold leading-tight text-ink">{card.work.title}</p>
            {card.work.year && <p className="text-[11px] text-ink/55">{card.work.year}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

function ListView({ cards }: { cards: CardWithWork[] }) {
  return (
    <div className="flex flex-col divide-y divide-ink/10 overflow-hidden rounded-lg border border-ink/10">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/ficha/${card.work.slug}`}
          className="flex items-center gap-3 bg-paper px-3 py-3 transition hover:bg-ink/5 sm:gap-4 sm:px-4"
        >
          <div className="relative h-[60px] w-10 flex-shrink-0 overflow-hidden rounded">
            {card.work.poster_url ? (
              <Image
                src={card.work.poster_url}
                alt={card.work.title}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-ink/5 text-xl">📖</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{card.work.title}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[card.work.type as keyof typeof TYPE_COLORS]}`}>
                {TYPE_LABELS[card.work.type as keyof typeof TYPE_LABELS]}
              </span>
              {card.work.year && <span className="text-xs text-ink/55">{card.work.year}</span>}
            </div>
            {card.work.overview && (
              <p className="mt-1 line-clamp-1 text-xs text-ink/50">{card.work.overview}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

export function HomeCards({ cards, totalCount }: { cards: CardWithWork[]; totalCount: number }) {
  const [view, setView] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<TypeFilter>('all')
  const [sort, setSort] = useState<SortKey>('recent')

  useEffect(() => {
    const saved = localStorage.getItem('home-view') as ViewMode | null
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])

  function setViewMode(mode: ViewMode) {
    setView(mode)
    localStorage.setItem('home-view', mode)
  }

  const filtered = useMemo(() => {
    const base = filter === 'all' ? cards : cards.filter((c) => c.work.type === filter)
    if (sort === 'az') return [...base].sort((a, b) => a.work.title.localeCompare(b.work.title, 'es'))
    if (sort === 'oldest') return [...base].sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    return base // 'recent' — already ordered desc from server
  }, [cards, filter, sort])

  return (
    <div>
      {/* Fila 1: filtros de tipo (scroll horizontal en móvil) */}
      <div className="mb-3 -mx-4 flex items-center gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        {(Object.keys(FILTER_LABELS) as TypeFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1 text-sm font-semibold transition ${
              filter === f
                ? 'bg-ember text-white'
                : 'bg-ink/5 text-ink/60 hover:bg-ink/10 hover:text-ink'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Fila 2: contador + selector orden + toggle vista */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-sm text-ink/50">
          <span className="font-semibold text-ink">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'ficha' : 'fichas'}
          {filter !== 'all' && (
            <span className="hidden sm:inline"> de {totalCount} publicadas</span>
          )}
        </span>

        <div className="flex items-center gap-2">
          {/* Selector de ordenación */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-ink/15 bg-paper py-1 pl-2 pr-6 text-xs font-medium text-ink/60 outline-none transition focus:border-ink/30 hover:border-ink/25"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Toggle vista grid/lista */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Vista cuadrícula"
              className={`rounded p-1.5 transition ${view === 'grid' ? 'text-ember' : 'text-ink/25 hover:text-ink/60'}`}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Vista lista"
              className={`rounded p-1.5 transition ${view === 'list' ? 'text-ember' : 'text-ink/25 hover:text-ink/60'}`}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-ink/55">
          No hay fichas de este tipo todavía.{' '}
          <Link href="/nueva-obra" className="font-semibold text-ember hover:underline">
            ¿La conoces? Añade la primera.
          </Link>
        </div>
      ) : view === 'grid' ? (
        <GridView cards={filtered} />
      ) : (
        <ListView cards={filtered} />
      )}
    </div>
  )
}
