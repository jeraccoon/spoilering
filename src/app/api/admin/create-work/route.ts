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
    counter++
    slug = `${base}-${counter}`
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[create-work] paso 1: iniciando')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    console.log('[create-work] paso 2: user =', user?.id ?? 'null')
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const {
      type, title, original_title, year, poster_url, overview,
      genres, authors, directors, seasons_count,
      tmdb_id, google_books_id,
      isbn, publisher, pages, saga, saga_order,
    } = body

    console.log('[create-work] paso 3: body recibido — title:', title, 'type:', type)

    if (!type || !title) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    console.log('[create-work] paso 3b: generando slug único...')
    const slug = await findUniqueSlug(supabase, title)
    console.log('[create-work] paso 3b OK — slug:', slug)

    const genres_arr: string[] = genres ?? []
    const is_complete = Boolean(poster_url && overview && genres_arr.length > 0)

    const workPayload = {
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
    }

    console.log('[create-work] paso 4: insertando work...')
    const { data: work, error: workError } = await (supabase
      .from('works') as any)
      .insert(workPayload)
      .select()
      .single()

    if (workError) {
      console.error('[create-work] paso 4 ERROR — workError:', JSON.stringify(workError))
      if (workError.code === '23505') {
        // Duplicate key — find the existing work's slug
        let existingSlug: string | null = null
        if (tmdb_id) {
          const { data } = await (supabase.from('works') as any).select('slug').eq('tmdb_id', tmdb_id).maybeSingle()
          existingSlug = data?.slug ?? null
        } else if (google_books_id) {
          const { data } = await (supabase.from('works') as any).select('slug').eq('google_books_id', google_books_id).maybeSingle()
          existingSlug = data?.slug ?? null
        }
        if (!existingSlug) {
          const { data } = await (supabase.from('works') as any).select('slug').eq('slug', await findUniqueSlug(supabase, title)).maybeSingle()
          existingSlug = data?.slug ?? null
        }
        return NextResponse.json({ error: 'duplicate', slug: existingSlug }, { status: 409 })
      }
      return NextResponse.json({ error: workError.message, detail: workError }, { status: 400 })
    }
    console.log('[create-work] paso 4 OK — work.id:', work.id)

    console.log('[create-work] paso 5: insertando card...')
    const { data: card, error: cardError } = await (supabase
      .from('cards') as any)
      .insert({ work_id: work.id, status: 'draft', created_by: user.id, is_complete })
      .select()
      .single()

    if (cardError) {
      console.error('[create-work] paso 5 ERROR — cardError:', JSON.stringify(cardError))
      return NextResponse.json({ error: cardError.message, detail: cardError }, { status: 500 })
    }
    console.log('[create-work] paso 5 OK — card.id:', card.id)

    const defaultSections = [
      { card_id: card.id, label: 'Inicio', short_label: 'Inicio', order_index: 0, parent_id: null, is_published: false, content: '' },
      { card_id: card.id, label: 'Nudo', short_label: 'Nudo', order_index: 1, parent_id: null, is_published: false, content: '' },
      { card_id: card.id, label: 'Desenlace', short_label: 'Desenlace', order_index: 2, parent_id: null, is_published: false, content: '' },
      { card_id: card.id, label: 'Subtramas y personajes', short_label: 'Subtramas', order_index: 3, parent_id: null, is_published: false, content: '' },
    ]

    console.log('[create-work] paso 6: insertando', defaultSections.length, 'secciones...')
    const { error: sectionsError } = await (supabase.from('sections') as any).insert(defaultSections)

    if (sectionsError) {
      console.error('[create-work] paso 6 ERROR — sectionsError:', JSON.stringify(sectionsError))
      return NextResponse.json({
        workId: work.id,
        cardId: card.id,
        warning: `Secciones no creadas: ${sectionsError.message}`,
      })
    }
    console.log('[create-work] paso 6 OK — secciones insertadas')

    return NextResponse.json({ workId: work.id, cardId: card.id })
  } catch (err: unknown) {
    console.error('[create-work] excepción no controlada:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error interno: ${msg}` }, { status: 500 })
  }
}
