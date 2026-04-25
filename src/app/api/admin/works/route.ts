import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

async function findUniqueSlug(supabase: any, title: string): Promise<string> {
  const base = toSlug(title)
  let slug = base
  let counter = 1
  while (true) {
    const { data } = await supabase.from('works').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${++counter}`
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  const role: string = profile?.role ?? 'user'

  const body = await request.json()
  const {
    type, title, original_title, year, poster_url, overview,
    genres, authors, directors, seasons_count,
    tmdb_id, google_books_id,
    isbn, publisher, pages, saga, saga_order,
  } = body

  if (!type || !title) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const slug = await findUniqueSlug(supabase, title)
  const genres_arr: string[] = genres ?? []

  const { data: work, error: workError } = await (supabase.from('works') as any)
    .insert({
      type,
      title,
      original_title: original_title || null,
      year: year ? parseInt(year) : null,
      poster_url: poster_url || null,
      overview: overview || null,
      genres: genres_arr,
      authors: authors ?? [],
      directors: directors ?? [],
      seasons_count: seasons_count ? parseInt(seasons_count) : null,
      slug,
      tmdb_id: tmdb_id ?? null,
      google_books_id: google_books_id ?? null,
      isbn: isbn ?? null,
      publisher: publisher ?? null,
      pages: pages ?? null,
      saga: saga ?? null,
      saga_order: saga_order ?? null,
    })
    .select('id, slug')
    .single()

  if (workError) {
    if (workError.code === '23505') {
      let existingWork: { id: string; slug: string } | null = null
      if (tmdb_id) {
        const { data } = await (supabase.from('works') as any)
          .select('id, slug').eq('tmdb_id', tmdb_id).maybeSingle()
        existingWork = data ?? null
      } else if (google_books_id) {
        const { data } = await (supabase.from('works') as any)
          .select('id, slug').eq('google_books_id', google_books_id).maybeSingle()
        existingWork = data ?? null
      }
      if (!existingWork) {
        return NextResponse.json({ error: 'duplicate', slug: null, hasCard: false }, { status: 409 })
      }
      const { data: existingCard } = await (supabase.from('cards') as any)
        .select('id').eq('work_id', existingWork.id).maybeSingle()
      return NextResponse.json(
        { error: 'duplicate', slug: existingWork.slug, workId: existingWork.id, hasCard: !!existingCard },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: workError.message }, { status: 500 })
  }

  void role
  return NextResponse.json({ workId: work.id, slug: work.slug })
}
