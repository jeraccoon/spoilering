import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HomeSections } from '@/components/home-sections'
import { HeroActions } from '@/components/HeroActions'
import type { CardWithWork } from '@/types/database'

async function getData() {
  const supabase = await createClient()
  const { data } = await (supabase
    .from('cards')
    .select('*, work:works(*)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(60) as any)

  const cards = (data ?? []) as CardWithWork[]
  const featured = cards[0] ?? null
  const recent = cards.slice(1, 7)
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
        <p className="mt-6 text-sm text-ink/40">
          📖 Spoilers completos &nbsp;·&nbsp; 🚫 Sin opiniones &nbsp;·&nbsp; ✏️ Fichas colaborativas
        </p>
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
