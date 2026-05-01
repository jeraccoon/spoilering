import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FichaEditor } from './ficha-editor'

interface Props {
  params: Promise<{ id: string }>
}

async function getCard(id: string) {
  const supabase = await createClient()

  const { data: card } = await (supabase
    .from('cards')
    .select('*, work:works(id, title, type, year, slug, poster_url, overview, genres, authors, directors, "cast", runtime, seasons_count, imdb_id, letterboxd_url, goodreads_url, filmaffinity_url, tracktv_url, country, tmdb_id, google_books_id, isbn, publisher, pages, saga, saga_order), sections(*)')
    .eq('id', id)
    .single() as any)

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

  return { ...card, sections: roots }
}

export default async function FichaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [card, { data: { user } }] = await Promise.all([
    getCard(id),
    supabase.auth.getUser(),
  ])
  if (!card) notFound()

  let userContent: { id: string; watched: boolean; watched_at: string | null; notes: string | null } | null = null
  if (user) {
    const { data: uc } = await (supabase
      .from('user_content')
      .select('id, watched, watched_at, notes')
      .eq('user_id', user.id)
      .eq('work_id', card.work.id)
      .maybeSingle() as any)
    userContent = uc ?? null
  }

  return <FichaEditor card={card} initialUserContent={userContent} />
}
