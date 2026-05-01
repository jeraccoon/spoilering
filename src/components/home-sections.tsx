import Link from 'next/link'
import Image from 'next/image'
import type { CardWithWork } from '@/types/database'
import { TYPE_LABELS, TYPE_BADGE } from '@/lib/work-types'


/* ── Ficha destacada ─────────────────────────────────────────── */

function FeaturedCard({ card }: { card: CardWithWork }) {
  const w = card.work
  return (
    <section aria-labelledby="ficha-destacada">
      <h2
        id="ficha-destacada"
        className="mb-3 text-xs font-black uppercase tracking-widest text-ink/55"
      >
        Ficha destacada
      </h2>
      <Link
        href={`/ficha/${w.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br from-ember/[0.04] via-paper to-moss/[0.04] transition hover:border-ink/25 hover:shadow-xl sm:flex-row"
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
        <div className="flex flex-1 flex-col justify-between gap-5 p-6 sm:p-8 md:p-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TYPE_BADGE[w.type] ?? 'bg-ink/10 text-ink'}`}>
                {TYPE_LABELS[w.type] ?? w.type}
              </span>
              {w.year && <span className="text-sm text-ink/45">{w.year}</span>}
            </div>

            <h3 className="font-serif text-[26px] font-black leading-[1.1] tracking-tight text-ink sm:text-[32px] md:text-[40px]">
              {w.title}
            </h3>

            {w.overview && (
              <p className="line-clamp-3 text-[15px] leading-relaxed text-ink/65 sm:line-clamp-4">
                {w.overview}
              </p>
            )}
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-ember px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition group-hover:bg-ember/90 group-hover:shadow-md">
            Ver el resumen
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </Link>
    </section>
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
      {w.year && <p className="mt-0.5 text-[11px] text-ink/55">{w.year}</p>}
    </Link>
  )
}

/* ── Sección con título y scroll horizontal ──────────────────── */

function CardSection({
  title,
  cards,
  seeAllHref = '/buscar',
  seeAllLabel = 'Ver todas',
}: {
  title: string
  cards: CardWithWork[]
  seeAllHref?: string
  seeAllLabel?: string
}) {
  if (cards.length === 0) return null
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-ink/55">{title}</h2>
        <Link
          href={seeAllHref}
          className="group flex items-center gap-1 text-xs font-semibold text-ink/45 transition hover:text-ember"
        >
          {seeAllLabel}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:gap-4 sm:px-0">
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
        <CardSection title="Recién añadidas" cards={recent} seeAllHref="/buscar" seeAllLabel="Ver catálogo" />
      )}

      <CardSection title="Películas" cards={movies} seeAllHref="/buscar?tipo=movie" seeAllLabel="Ver todas" />
      <CardSection title="Series" cards={series} seeAllHref="/buscar?tipo=series" seeAllLabel="Ver todas" />
      <CardSection title="Libros" cards={books} seeAllHref="/buscar?tipo=book" seeAllLabel="Ver todos" />

      <div className="border-t border-ink/10 pt-8 text-center">
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 rounded-lg border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/65 transition hover:border-ink/40 hover:text-ink"
        >
          Explorar catálogo completo →
        </Link>
      </div>
    </div>
  )
}
