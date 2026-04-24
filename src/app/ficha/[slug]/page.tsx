import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CardContent } from '@/components/card-content'
import type { CardFull } from '@/types/database'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}

async function getCard(slug: string): Promise<CardFull | null> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient()
  const { data: work } = await supabase.from('works').select('id').eq('slug', slug).single()
  if (!work) return null
  const { id: workId } = work as { id: string }
  const { data: card } = await supabase
    .from('cards').select('*, work:works(*), sections(*)')
    .eq('work_id', workId).single() as { data: any; error: unknown }
  if (!card) return null
  const all = (card.sections ?? []) as any[]
  const roots = all
    .filter((s: any) => s.parent_id === null)
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((root: any) => ({
      ...root,
      children: all
        .filter((s: any) => s.parent_id === root.id)
        .sort((a: any, b: any) => a.order_index - b.order_index),
    }))
  return { ...card, sections: roots } as CardFull
}

async function getAuthInfo(): Promise<{ role: string | null; isLoggedIn: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { role: null, isLoggedIn: false }
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role').eq('id', user.id).single()
    return { role: profile?.role ?? 'user', isLoggedIn: true }
  } catch {
    return { role: null, isLoggedIn: false }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const card = await getCard(slug)
  if (!card) return { title: 'Ficha no encontrada — Spoilering' }
  if (card.status !== 'published') return { title: `${card.work.title} — Spoilering`, robots: { index: false } }
  return {
    title: `${card.work.title}${card.work.year ? ` (${card.work.year})` : ''} — Spoilering`,
    description: `Resumen completo con spoilers de ${card.work.title}.`.slice(0, 160),
    openGraph: { images: card.work.poster_url ? [card.work.poster_url] : [] },
  }
}

const TYPE_LABELS = { movie: 'Película', series: 'Serie', book: 'Libro' }

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-ink/20 px-2.5 py-1 text-xs text-ink/60 transition hover:border-ember hover:text-ember"
    >
      {label}
      <span aria-hidden className="text-[10px]">↗</span>
    </a>
  )
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params

  const [card, { role, isLoggedIn }] = await Promise.all([getCard(slug), getAuthInfo()])
  if (!card) notFound()

  const isDraft = card.status !== 'published'
  const canEdit = role === 'admin' || role === 'editor'

  if (isDraft && !canEdit) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="text-xl font-black text-ink">Esta ficha aún no está disponible</h1>
        <p className="max-w-sm text-sm text-ink/50">
          El contenido está siendo preparado y todavía no ha sido publicado.
        </p>
        <Link href="/buscar" className="mt-2 text-sm font-semibold text-ember hover:underline">
          Explorar fichas publicadas
        </Link>
      </div>
    )
  }

  const { work, sections } = card

  return (
    <div>
      {card.is_complete === false && card.status === 'published' && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm text-amber-800">
              ⚠️ Esta ficha está incompleta. ¿La conoces? Ayúdanos a completarla usando el botón &quot;Sugerir corrección&quot; en cada sección.
            </p>
          </div>
        </div>
      )}

      {isDraft && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <p className="text-sm font-medium text-amber-800">
              Esta ficha está en borrador y no es visible para el público.
            </p>
            <Link
              href={`/admin/ficha/${card.id}`}
              className="shrink-0 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-900"
            >
              Ir al editor
            </Link>
          </div>
        </div>
      )}

      {/* Cabecera de la obra */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8 sm:gap-8">
          {work.poster_url && (
            <div className="relative hidden h-64 w-44 shrink-0 overflow-hidden rounded-lg border border-ink/10 shadow-md sm:block">
              <Image src={work.poster_url} alt={work.title} fill className="object-cover" priority />
            </div>
          )}
          <div className="flex flex-col justify-end gap-3">
            {/* Tipo + año + runtime/temporadas */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink/50">
              <span>{TYPE_LABELS[work.type as keyof typeof TYPE_LABELS]}</span>
              {work.year && <><span>·</span><span>{work.year}</span></>}
              {work.runtime && (
                <><span>·</span><span>{formatRuntime(work.runtime)}</span></>
              )}
              {work.seasons_count && (
                <><span>·</span><span>{work.seasons_count} temporada{work.seasons_count !== 1 ? 's' : ''}</span></>
              )}
              {work.pages && (
                <><span>·</span><span>{work.pages} páginas</span></>
              )}
            </div>

            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">{work.title}</h1>

            {/* Géneros */}
            {work.genres && work.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {work.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-medium text-moss"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Metadatos */}
            <div className="flex flex-col gap-1">
              {work.directors && work.directors.length > 0 && (
                <p className="text-sm text-ink/60">
                  <span className="font-medium text-ink/75">Dirección:</span>{' '}
                  {work.directors.join(', ')}
                </p>
              )}
              {work.authors && work.authors.length > 0 && (
                <p className="text-sm text-ink/60">
                  <span className="font-medium text-ink/75">Autor:</span>{' '}
                  {work.authors.join(', ')}
                </p>
              )}
              {work.cast && work.cast.length > 0 && (
                <p className="text-sm text-ink/60">
                  <span className="font-medium text-ink/75">Reparto:</span>{' '}
                  {work.cast.slice(0, 5).join(', ')}
                </p>
              )}
              {work.publisher && (
                <p className="text-sm text-ink/60">
                  <span className="font-medium text-ink/75">Editorial:</span>{' '}
                  {work.publisher}
                </p>
              )}
              {work.saga && (
                <p className="text-sm text-ink/60">
                  <span className="font-medium text-ink/75">Saga:</span>{' '}
                  {work.saga_order != null ? `${work.saga} #${work.saga_order}` : work.saga}
                </p>
              )}
              {work.isbn && (
                <p className="text-sm text-ink/60">
                  <span className="font-medium text-ink/75">ISBN:</span>{' '}
                  {work.isbn}
                </p>
              )}
            </div>

            {work.overview && (
              <p className="max-w-2xl text-sm leading-relaxed text-ink/60">{work.overview}</p>
            )}

            {/* Badge spoilers */}
            <span className="w-fit rounded-full bg-ember/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ember">
              ⚠ Contiene spoilers
            </span>

            {/* Enlaces externos */}
            {(work.type === 'movie' || work.type === 'series') && work.tmdb_id && (
              <div className="flex flex-wrap gap-2">
                <ExternalLink
                  href={`https://www.themoviedb.org/${work.type === 'movie' ? 'movie' : 'tv'}/${work.tmdb_id}`}
                  label="TMDb"
                />
              </div>
            )}
            {work.type === 'book' && (
              <div className="flex flex-wrap gap-2">
                {work.google_books_id && (
                  <ExternalLink
                    href={`https://books.google.com/books?id=${work.google_books_id}`}
                    label="Google Books"
                  />
                )}
                <ExternalLink
                  href={`https://www.goodreads.com/search?q=${encodeURIComponent(work.title)}`}
                  label="Goodreads"
                />
                <ExternalLink
                  href={`https://openlibrary.org/search?q=${encodeURIComponent(work.title)}`}
                  label="Open Library"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <CardContent sections={sections} isLoggedIn={isLoggedIn} slug={slug} cardId={card.id} />
    </div>
  )
}
