import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HomeSections } from '@/components/home-sections'
import { HeroActions } from '@/components/HeroActions'
import type { CardWithWork } from '@/types/database'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = await createClient()
  const { data } = await (supabase
    .from('cards')
    .select('*, work:works(*)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(60) as any)

  const cards = (data ?? []) as CardWithWork[]
  const featuredIndex = cards.length > 0 ? Math.floor(Math.random() * Math.min(cards.length, 20)) : 0
  const featured = cards[featuredIndex] ?? null
  const recent = cards.filter((_, i) => i !== featuredIndex).slice(0, 6)
  const movies = cards.filter((c) => c.work.type === 'movie').slice(0, 6)
  const series = cards.filter((c) => c.work.type === 'series').slice(0, 6)
  const books = cards.filter((c) => c.work.type === 'book').slice(0, 6)

  return { featured, recent, movies, series, books, total: cards.length }
}

export default async function HomePage() {
  const { featured, recent, movies, series, books, total } = await getData()

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-ink/10 px-4 pb-10 pt-16 text-center">
        <h1 className="font-serif text-[34px] font-black leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-[56px]">
          Recuerda cualquier historia<br className="hidden sm:inline" /> sin volver a verla
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-ink/65 sm:text-lg">
          Spoilers incluidos. Resúmenes completos de películas, series y libros para retomar una saga, recordar un final o entender qué pasó sin rodeos.
        </p>
        <HeroActions />
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-ink/15 bg-ink/[0.03] px-6 py-2.5 text-[15px] font-medium text-ink/65">
          <span>📖 Spoilers completos</span>
          <span className="text-ink/25">·</span>
          <span>🚫 Sin opiniones</span>
          <span className="text-ink/25">·</span>
          <span>✏️ Fichas colaborativas</span>
        </div>
      </section>

      {/* Contenido editorial */}
      {total === 0 ? (
        <div className="py-24 text-center text-ink/55">
          <p className="text-lg">Todavía no hay fichas publicadas.</p>
          <Link
            href="/nueva-obra"
            className="mt-4 inline-block text-sm text-ink/60 underline hover:text-ink"
          >
            Sé el primero en crear una
          </Link>
        </div>
      ) : (
        <HomeSections
          featured={featured}
          recent={recent}
          movies={movies}
          series={series}
          books={books}
        />
      )}
    </div>
  )
}
