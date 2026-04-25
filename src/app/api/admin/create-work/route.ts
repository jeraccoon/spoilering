import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAndStoreSeasonsForWork } from '@/lib/tmdb/fetchSeasons'

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

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role').eq('id', user.id).single()
    const role: string = profile?.role ?? 'user'

    if (role === 'user') {
      const { count } = await (supabase.from('cards') as any)
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          { error: 'Has alcanzado el límite de 3 fichas. Contacta con nosotros para ampliar tu acceso.' },
          { status: 403 }
        )
      }
    }

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

    // Enriquecimiento TMDb: cast, runtime, imdb_id
    let enrichedCast: string[] = []
    let enrichedRuntime: number | null = null
    let enrichedImdbId: string | null = null

    if (tmdb_id && (type === 'movie' || type === 'series')) {
      const tmdbKey = process.env.TMDB_API_KEY
      if (tmdbKey) {
        const endpoint = type === 'movie' ? 'movie' : 'tv'
        const [detailsRes, creditsRes, externalRes] = await Promise.allSettled([
          type === 'movie'
            ? fetch(`https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${tmdbKey}&language=es-ES`)
            : Promise.resolve(null),
          fetch(`https://api.themoviedb.org/3/${endpoint}/${tmdb_id}/credits?api_key=${tmdbKey}&language=es-ES`),
          type === 'movie'
            ? fetch(`https://api.themoviedb.org/3/movie/${tmdb_id}/external_ids?api_key=${tmdbKey}`)
            : Promise.resolve(null),
        ])
        if (detailsRes.status === 'fulfilled' && detailsRes.value?.ok) {
          const d = await detailsRes.value.json()
          if (d.runtime) enrichedRuntime = d.runtime
        }
        if (creditsRes.status === 'fulfilled' && creditsRes.value?.ok) {
          const d = await creditsRes.value.json()
          enrichedCast = ((d.cast ?? []) as { name: string }[]).slice(0, 5).map((c) => c.name)
        }
        if (externalRes.status === 'fulfilled' && externalRes.value?.ok) {
          const d = await externalRes.value.json()
          if (d.imdb_id) enrichedImdbId = d.imdb_id
        }
      }
    }

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
      cast: enrichedCast.length > 0 ? enrichedCast : [],
      seasons_count: seasons_count ? parseInt(seasons_count) : null,
      runtime: enrichedRuntime,
      slug,
      tmdb_id: tmdb_id ?? null,
      google_books_id: google_books_id ?? null,
      imdb_id: enrichedImdbId,
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

    if (type === 'series' && tmdb_id) {
      try {
        await fetchAndStoreSeasonsForWork(work.id, tmdb_id)
      } catch {
        // Non-fatal: seasons can be imported later from the editor
      }
    }

    const redirectTo = role === 'user' ? '/perfil' : `/admin/ficha/${card.id}`
    return NextResponse.json({ workId: work.id, cardId: card.id, redirectTo })
  } catch (err: unknown) {
    console.error('[create-work] excepción no controlada:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error interno: ${msg}` }, { status: 500 })
  }
}
