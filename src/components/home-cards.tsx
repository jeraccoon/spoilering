'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { CardWithWork } from '@/types/database'

const TYPE_LABELS = { movie: 'Película', series: 'Serie', book: 'Libro' }
const TYPE_COLORS = {
  movie: 'bg-blue-600 text-white',
  series: 'bg-purple-600 text-white',
  book: 'bg-amber-600 text-white',
}

type ViewMode = 'grid' | 'list'
type TypeFilter = 'all' | 'movie' | 'series' | 'book'

const FILTER_LABELS: Record<TypeFilter, string> = {
  all: 'Todos',
  movie: 'Películas',
  series: 'Series',
  book: 'Libros',
}

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
            {card.work.year && <p className="text-[11px] text-ink/40">{card.work.year}</p>}
            {card.is_complete === false && (
              <p className="text-[10px] font-medium text-amber-600">⚠ Incompleta</p>
            )}
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
          className="flex items-center gap-4 bg-paper px-4 py-3 transition hover:bg-ink/5"
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
              {card.work.year && <span className="text-xs text-ink/40">{card.work.year}</span>}
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

  useEffect(() => {
    const saved = localStorage.getItem('home-view') as ViewMode | null
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])

  function setViewMode(mode: ViewMode) {
    setView(mode)
    localStorage.setItem('home-view', mode)
  }

  const filtered = filter === 'all' ? cards : cards.filter((c) => c.work.type === filter)

  return (
    <div>
      {/* Barra de controles */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-sm text-ink/50">
          <span className="font-semibold text-ink">{totalCount}</span>{' '}
          {totalCount === 1 ? 'ficha publicada' : 'fichas publicadas'}
        </span>
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

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as TypeFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1 text-sm font-semibold transition ${
              filter === f
                ? 'bg-ember text-white'
                : 'bg-ink/5 text-ink/60 hover:bg-ink/10 hover:text-ink'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-ink/40">
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
