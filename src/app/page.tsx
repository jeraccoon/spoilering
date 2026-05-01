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
      <section className="border-b border-ink/10 px-4 py-16 text-center">
        <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">
          Recuerda qué pasaba<br className="hidden sm:block" /> sin empezar desde cero
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink/60 sm:text-lg">
          Resúmenes completos con spoilers de series, películas y libros.
          Para cuando vuelves a algo y necesitas ponerte al día. Sin críticas, solo los hechos.
        </p>
        <HeroActions />
      </section>

      {/* Características */}
      <section className="border-b border-ink/10 bg-ink/[0.02] px-4 py-10">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mb-3 text-3xl">📖</div>
            <h3 className="font-semibold text-ink">Todo contado, sin filtros</h3>
            <p className="mt-1.5 text-sm text-ink/50">Giros, finales y revelaciones. Nada omitido.</p>
          </div>
          <div className="text-center">
            <div className="mb-3 text-3xl">✏️</div>
            <h3 className="font-semibold text-ink">Hecho por la comunidad</h3>
            <p className="mt-1.5 text-sm text-ink/50">Cualquiera puede añadir fichas y corregir errores.</p>
          </div>
          <div className="text-center">
            <div className="mb-3 text-3xl">🎯</div>
            <h3 className="font-semibold text-ink">Hechos, no opiniones</h3>
            <p className="mt-1.5 text-sm text-ink/50">Sin notas ni valoraciones. Tú decides si lo ves.</p>
          </div>
        </div>
      </section>

      {/* Contenido editorial */}
      {total === 0 ? (
        <div className="py-24 text-center text-ink/40">
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
