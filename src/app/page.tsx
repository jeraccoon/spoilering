import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { CardWithWork } from '@/types/database'

const TYPE_LABELS = { movie: 'Película', series: 'Serie', book: 'Libro' }
const TYPE_COLORS = {
  movie: 'bg-moss/20 text-moss',
  series: 'bg-plum/20 text-plum',
  book: 'bg-ember/20 text-ember',
}

async function getRecentCards(): Promise<CardWithWork[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cards')
    .select('*, work:works(*)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(24)
  return (data ?? []) as CardWithWork[]
}

export default async function HomePage() {
  const cards = await getRecentCards()
  return (
    <div>
      <section className="border-b border-ink/10 px-4 py-16 text-center">
        <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">Spoilering</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink/60">
          Resúmenes completos con spoilers de series, películas y libros.
          Para cuando vuelves a algo después de un tiempo y necesitas refrescar la memoria.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/buscar"
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90"
          >
            Buscar una obra
          </Link>
          <Link
            href="/crear"
            className="rounded-lg border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5"
          >
            Crear una ficha
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {cards.length === 0 ? (
          <div className="py-24 text-center text-ink/40">
            <p className="text-lg">Todavía no hay fichas publicadas.</p>
            <Link href="/crear" className="mt-4 inline-block text-sm text-ink/60 underline hover:text-ink">
              Sé el primero en crear una
            </Link>
          </div>
        ) : (
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
