import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      genres, authors, directors, seasons_count, slug,
      tmdb_id, google_books_id,
    } = body

    console.log('[create-work] paso 3: body recibido — title:', title, 'slug:', slug, 'type:', type)

    if (!type || !title || !slug) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const workPayload = {
      type,
      title,
      original_title: original_title || null,
      year: year ? parseInt(year) : null,
      poster_url: poster_url || null,
      overview: overview || null,
      genres: genres ?? [],
      authors: authors ?? [],
      directors: directors ?? [],
      seasons_count: seasons_count ? parseInt(seasons_count) : null,
      slug,
      tmdb_id: tmdb_id ?? null,
      google_books_id: google_books_id ?? null,
    }

    console.log('[create-work] paso 4: insertando work...')
    const { data: work, error: workError } = await (supabase
      .from('works') as any)
      .insert(workPayload)
      .select()
      .single()

    if (workError) {
      console.error('[create-work] paso 4 ERROR — workError:', JSON.stringify(workError))
      const msg = workError.code === '23505'
        ? 'Ya existe una obra con ese slug. Cambia el slug e inténtalo de nuevo.'
        : workError.message
      return NextResponse.json({ error: msg, detail: workError }, { status: 400 })
    }
    console.log('[create-work] paso 4 OK — work.id:', work.id)

    console.log('[create-work] paso 5: insertando card...')
    const { data: card, error: cardError } = await (supabase
      .from('cards') as any)
      .insert({ work_id: work.id, status: 'draft', created_by: user.id })
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
      // No bloqueamos la respuesta — la obra y ficha ya existen, las secciones se pueden crear manualmente
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
