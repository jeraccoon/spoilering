import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HomeCards } from '@/components/home-cards'
import { HeroActions } from '@/components/HeroActions'
import type { CardWithWork } from '@/types/database'

async function getData() {
  const supabase = await createClient()
  const { data: cards } = await supabase
    .from('cards')
    .select('*, work:works(*)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(200)
  return { cards: (cards ?? []) as CardWithWork[] }
}

export default async function HomePage() {
  const { cards } = await getData()

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-ink/10 px-4 py-16 text-center">
        <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">
          Tu memoria para series,<br className="hidden sm:block" /> películas y libros
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink/60 sm:text-lg">
          Resúmenes completos con spoilers para cuando vuelves a algo después de un tiempo
          y necesitas recordar qué pasaba. Sin valoraciones, solo los hechos.
        </p>
        <HeroActions />
      </section>

      {/* Sección de características */}
      <section className="border-b border-ink/10 bg-ink/[0.02] px-4 py-10">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mb-3 text-3xl">📖</div>
            <h3 className="font-semibold text-ink">Resúmenes completos</h3>
            <p className="mt-1.5 text-sm text-ink/50">Con todos los spoilers, sin omitir nada</p>
          </div>
          <div className="text-center">
            <div className="mb-3 text-3xl">✏️</div>
            <h3 className="font-semibold text-ink">Creados por la comunidad</h3>
            <p className="mt-1.5 text-sm text-ink/50">Cualquiera puede contribuir y corregir</p>
          </div>
          <div className="text-center">
            <div className="mb-3 text-3xl">🔒</div>
            <h3 className="font-semibold text-ink">Sin valoraciones</h3>
            <p className="mt-1.5 text-sm text-ink/50">Solo hechos, tú decides si lo ves o no</p>
          </div>
        </div>
      </section>

      {/* Grid de fichas */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {cards.length === 0 ? (
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
          <HomeCards cards={cards} totalCount={cards.length} />
        )}
      </section>
    </div>
  )
}
