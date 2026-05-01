import Link from 'next/link'
import Image from 'next/image'
import type { CardWithWork } from '@/types/database'

const TYPE_LABELS: Record<string, string> = { movie: 'Película', series: 'Serie', book: 'Libro' }
const TYPE_BADGE: Record<string, string> = {
  movie: 'bg-blue-600/90 text-white',
  series: 'bg-plum/90 text-white',
  book: 'bg-moss/90 text-white',
}

/* ── Ficha destacada ─────────────────────────────────────────── */

function FeaturedCard({ card }: { card: CardWithWork }) {
  const w = card.work
  return (
    <Link
      href={`/ficha/${w.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.025] transition hover:border-ink/20 hover:shadow-lg sm:flex-row"
    >
      {/* Póster */}
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden sm:aspect-[2/3] sm:w-52 md:w-64">
        {w.poster_url ? (
          <Image
            src={w.poster_url}
            alt={w.title}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 256px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-ink/5 text-6xl">📖</div>
        )}
      </div>

      {/* Texto */}
      <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8 md:p-10">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TYPE_BADGE[w.type] ?? 'bg-ink/10 text-ink'}`}>
            {TYPE_LABELS[w.type] ?? w.type}
          </span>
          {w.year && <span className="text-sm text-ink/40">{w.year}</span>}
        </div>

        <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl md:text-4xl">
          {w.title}
        </h2>

        {w.overview && (
          <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-ink/55 sm:text-base">
            {w.overview}
          </p>
        )}

        <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-ember/90">
          Leer ficha
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

/* ── Tarjeta pequeña para strips ─────────────────────────────── */

function StripCard({ card }: { card: CardWithWork }) {
  const w = card.work
  return (
    <Link href={`/ficha/${w.slug}`} className="group w-28 shrink-0 sm:w-32 md:w-36">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-ink/10 transition group-hover:border-ink/25 group-hover:shadow-md">
        {w.poster_url ? (
          <Image
            src={w.poster_url}
            alt={w.title}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-ink/5 text-3xl">📖</div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight text-ink">{w.title}</p>
      {w.year && <p className="mt-0.5 text-[11px] text-ink/40">{w.year}</p>}
    </Link>
  )
}

/* ── Sección con título y scroll horizontal ──────────────────── */

function CardSection({
  title,
  cards,
  seeAllLabel = 'Ver todas',
}: {
  title: string
  cards: CardWithWork[]
  seeAllLabel?: string
}) {
  if (cards.length === 0) return null
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-ink/50">{title}</h2>
        <Link
          href="/buscar"
          className="text-xs font-semibold text-ember/70 transition hover:text-ember"
        >
          {seeAllLabel} →
        </Link>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:gap-4 sm:px-0">
        {cards.map((card) => (
          <StripCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}

/* ── Componente principal ────────────────────────────────────── */

export interface HomeSectionsProps {
  featured: CardWithWork | null
  recent: CardWithWork[]
  movies: CardWithWork[]
  series: CardWithWork[]
  books: CardWithWork[]
}

export function HomeSections({ featured, recent, movies, series, books }: HomeSectionsProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      {featured && <FeaturedCard card={featured} />}

      {recent.length > 0 && (
        <CardSection title="Recién añadidas" cards={recent} seeAllLabel="Ver catálogo" />
      )}

      <CardSection title="Películas" cards={movies} seeAllLabel="Ver todas" />
      <CardSection title="Series" cards={series} seeAllLabel="Ver todas" />
      <CardSection title="Libros" cards={books} seeAllLabel="Ver todos" />

      <div className="border-t border-ink/10 pt-6 text-center">
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 rounded-lg border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-ink/40 hover:text-ink"
        >
          Ver catálogo completo →
        </Link>
      </div>
    </div>
  )
}
