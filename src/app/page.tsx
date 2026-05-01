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
  const recent = cards.slice(1, 11)
  const movies = cards.filter((c) => c.work.type === 'movie').slice(0, 10)
  const series = cards.filter((c) => c.work.type === 'series').slice(0, 10)
  const books = cards.filter((c) => c.work.type === 'book').slice(0, 10)

  return { featured, recent, movies, series, books, total: cards.length }
}

export default async function HomePage() {
  const { featured, recent, movies, series, books, total } = await getData()

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-ink/10 px-4 py-16 text-center">
        <h1 className="font-serif text-[34px] font-black leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-[56px]">
          Recuerda cualquier historia<br className="hidden sm:inline" /> sin volver a verla
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-ink/65 sm:text-lg">
          Spoilers incluidos. Resúmenes completos de películas, series y libros para retomar una saga, recordar un final o entender qué pasó sin rodeos.
        </p>
        <HeroActions />
      </section>

      {/* Características */}
      <section className="border-b border-ink/10 bg-ink/[0.02] px-4 py-10">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mb-3 text-3xl">📖</div>
            <h3 className="font-semibold text-ink">Todo el argumento</h3>
            <p className="mt-1.5 text-sm text-ink/60">Giros, finales, revelaciones y escenas clave. Sin rodeos.</p>
          </div>
          <div className="text-center">
            <div className="mb-3 text-3xl">🚫</div>
            <h3 className="font-semibold text-ink">Sin opiniones ni notas</h3>
            <p className="mt-1.5 text-sm text-ink/60">No valoramos la obra: te contamos qué pasa y tú decides.</p>
          </div>
          <div className="text-center">
            <div className="mb-3 text-3xl">✏️</div>
            <h3 className="font-semibold text-ink">Hecho por la comunidad</h3>
            <p className="mt-1.5 text-sm text-ink/60">Añade fichas, sugiere cambios y ayuda a mejorar los resúmenes.</p>
          </div>
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
