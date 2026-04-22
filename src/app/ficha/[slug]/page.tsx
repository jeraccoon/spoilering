import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { CardFull, SectionWithChildren } from '@/types/database'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ seccion?: string }>
}

async function getCard(slug: string): Promise<CardFull | null> {
  const supabase = await createClient()
  const { data: work } = await supabase.from('works').select('id').eq('slug', slug).single()
  if (!work) return null
  const { id: workId } = work as { id: string }
  const { data: card } = await supabase
    .from('cards').select('*, work:works(*), sections(*)')
    .eq('work_id', workId).eq('status', 'published').single() as { data: any; error: unknown }
  if (!card) return null
  const all = (card.sections ?? []) as any[]
  const roots = all
    .filter((s) => s.parent_id === null)
    .sort((a, b) => a.order_index - b.order_index)
    .map((root) => ({
      ...root,
      children: all.filter((s) => s.parent_id === root.id).sort((a, b) => a.order_index - b.order_index),
    }))
  return { ...card, sections: roots } as CardFull
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const card = await getCard(slug)
  if (!card) return { title: 'Ficha no encontrada — Spoilering' }
  return {
    title: `${card.work.title}${card.work.year ? ` (${card.work.year})` : ''} — Spoilering`,
    description: `Resumen completo con spoilers de ${card.work.title}.`.slice(0, 160),
    openGraph: { images: card.work.poster_url ? [card.work.poster_url] : [] },
  }
}

const TYPE_LABELS = { movie: 'Película', series: 'Serie', book: 'Libro' }

export default async function CardPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { seccion } = await searchParams
  const card = await getCard(slug)
  if (!card) notFound()
  const { work, sections } = card
  const activeSection = sections.find((s) => s.id === seccion) ?? sections[0]
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
          {work.poster_url && (
            <div className="relative hidden h-48 w-32 shrink-0 overflow-hidden rounded-lg sm:block">
              <Image src={work.poster_url} alt={work.title} fill className="object-cover" priority />
            </div>
          )}
          <div className="flex flex-col justify-end gap-2">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>{TYPE_LABELS[work.type as keyof typeof TYPE_LABELS]}</span>
              {work.year && <><span>·</span><span>{work.year}</span></>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{work.title}</h1>
            {work.overview && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">{work.overview}</p>}
            <span className="mt-2 w-fit rounded-full bg-red-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-400">
              ⚠ Contiene spoilers
            </span>
          </div>
        </div>
      </section>
      <div className="mx-auto flex max-w-5xl gap-8 px-4 py-8">
        <aside className="hidden w-56 shrink-0 sm:block">
          <div className="sticky top-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Contenido</p>
            <nav className="space-y-0.5">
              {sections.map((section) => (
                <a key={section.id} href={`/ficha/${slug}?seccion=${section.id}`}
                  className={`block rounded px-2 py-1.5 text-sm transition-colors ${
                    activeSection?.id === section.id
                      ? 'bg-zinc-800 font-semibold text-white'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}>
                  {section.short_label ?? section.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {activeSection ? (
            <article>
              <h2 className="mb-6 text-xl font-bold">{activeSection.label}</h2>
              {activeSection.content ? (
                <div className="space-y-4">
                  {activeSection.content.split('\n\n').map((p, i) => (
                    <p key={i} className="leading-relaxed text-zinc-300">{p}</p>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600">Esta sección todavía no tiene contenido.</p>
              )}
            </article>
          ) : (
            <p className="text-zinc-500">Esta ficha todavía no tiene contenido.</p>
          )}
        </div>
      </div>
    </main>
  )
}
