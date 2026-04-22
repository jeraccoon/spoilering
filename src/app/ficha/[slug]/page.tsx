import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/server'
import type { CardFull } from '@/types/database'

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
      children: all
        .filter((s) => s.parent_id === root.id)
        .sort((a, b) => a.order_index - b.order_index),
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
    <div>
      {/* Cabecera de la obra */}
      <section className="border-b border-ink/10">
        <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
          {work.poster_url && (
            <div className="relative hidden h-48 w-32 shrink-0 overflow-hidden rounded-lg border border-ink/10 sm:block">
              <Image src={work.poster_url} alt={work.title} fill className="object-cover" priority />
            </div>
          )}
          <div className="flex flex-col justify-end gap-2">
            <div className="flex items-center gap-2 text-sm text-ink/50">
              <span>{TYPE_LABELS[work.type as keyof typeof TYPE_LABELS]}</span>
              {work.year && <><span>·</span><span>{work.year}</span></>}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-ink">{work.title}</h1>
            {work.overview && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/60">{work.overview}</p>
            )}
            <span className="mt-2 w-fit rounded-full bg-ember/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ember">
              ⚠ Contiene spoilers
            </span>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <div className="mx-auto flex max-w-5xl gap-8 px-4 py-8">

        {/* Navegación lateral */}
        <aside className="hidden w-56 shrink-0 sm:block">
          <div className="sticky top-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Contenido</p>
            <nav className="space-y-0.5">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`/ficha/${slug}?seccion=${section.id}`}
                  className={`block rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                    activeSection?.id === section.id
                      ? 'bg-ember/10 font-semibold text-ember'
                      : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  {section.short_label ?? section.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Artículo */}
        <div className="min-w-0 flex-1">
          {activeSection ? (
            <article>
              <h2 className="mb-6 text-xl font-black text-ink">{activeSection.label}</h2>
              {activeSection.content ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-4 text-justify leading-relaxed text-ink/80">{children}</p>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-lg font-black text-ink">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-5 text-base font-black text-ink">{children}</h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 space-y-1 pl-5 text-ink/80 [list-style:disc]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 space-y-1 pl-5 text-ink/80 [list-style:decimal]">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-justify leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-ink">{children}</strong>
                    ),
                  }}
                >
                  {activeSection.content}
                </ReactMarkdown>
              ) : (
                <p className="text-ink/30">Esta sección todavía no tiene contenido.</p>
              )}
            </article>
          ) : (
            <p className="text-ink/30">Esta ficha todavía no tiene contenido.</p>
          )}
        </div>
      </div>
    </div>
  )
}
