import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAndStoreSeasonsForWork } from '@/lib/tmdb/fetchSeasons'

function isoToCountry(iso: string): string {
  const map: Record<string, string> = {
    US: 'Estados Unidos', GB: 'Reino Unido', ES: 'España', FR: 'Francia',
    DE: 'Alemania', IT: 'Italia', JP: 'Japón', KR: 'Corea del Sur',
    CA: 'Canadá', AU: 'Australia', MX: 'México', BR: 'Brasil',
    AR: 'Argentina', IN: 'India', CN: 'China', SE: 'Suecia',
    DK: 'Dinamarca', NO: 'Noruega', FI: 'Finlandia', NL: 'Países Bajos',
    BE: 'Bélgica', CH: 'Suiza', AT: 'Austria', PL: 'Polonia',
    PT: 'Portugal', RU: 'Rusia', TR: 'Turquía', IL: 'Israel',
    ZA: 'Sudáfrica', NG: 'Nigeria', EG: 'Egipto', TH: 'Tailandia',
    HK: 'Hong Kong', TW: 'Taiwán', NZ: 'Nueva Zelanda', IE: 'Irlanda',
  }
  return map[iso] ?? iso
}

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
      if ((count ?? 0) >= 5) {
        return NextResponse.json(
          { error: 'Has alcanzado el límite de 5 fichas. Contacta con nosotros para ampliar tu acceso.' },
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

    // Enriquecimiento TMDb: cast, runtime, imdb_id + Trakt: tracktv_url
    let enrichedCast: string[] = []
    let enrichedRuntime: number | null = null
    let enrichedImdbId: string | null = null
    let enrichedTracktvUrl: string | null = null
    let enrichedLetterboxdUrl: string | null = null
    let enrichedCountry: string | null = null

    console.log('[create-work] paso 3c: enriquecimiento TMDb — tmdb_id:', tmdb_id, 'type:', type)
    if (tmdb_id && (type === 'movie' || type === 'series')) {
      const tmdbKey = process.env.TMDB_API_KEY
      if (!tmdbKey) {
        console.warn('[create-work] TMDB_API_KEY no definida — saltando enriquecimiento')
      } else {
        const endpoint = type === 'movie' ? 'movie' : 'tv'
        const [detailsRes, creditsRes, externalRes] = await Promise.allSettled([
          fetch(`https://api.themoviedb.org/3/${endpoint}/${tmdb_id}?api_key=${tmdbKey}&language=es-ES`),
          fetch(`https://api.themoviedb.org/3/${endpoint}/${tmdb_id}/credits?api_key=${tmdbKey}&language=es-ES`),
          fetch(`https://api.themoviedb.org/3/${endpoint}/${tmdb_id}/external_ids?api_key=${tmdbKey}`),
        ])
        if (detailsRes.status === 'fulfilled' && detailsRes.value?.ok) {
          const d = await detailsRes.value.json()
          // movies use 'runtime' (minutes), TV shows use 'episode_run_time' (array)
          enrichedRuntime = type === 'movie'
            ? (d.runtime ?? null)
            : ((d.episode_run_time as number[] | undefined)?.[0] ?? null)
          if (type === 'movie') {
            const isoCode = (d.production_countries as { iso_3166_1: string }[] | undefined)?.[0]?.iso_3166_1 ?? null
            enrichedCountry = isoCode ? isoToCountry(isoCode) : null
          } else {
            const isoCode = (d.origin_country as string[] | undefined)?.[0] ?? null
            enrichedCountry = isoCode ? isoToCountry(isoCode) : null
          }
          console.log('[create-work] TMDb details OK — runtime:', enrichedRuntime, '| country:', enrichedCountry)
        } else {
          console.warn('[create-work] TMDb details FAIL —', detailsRes.status === 'rejected' ? detailsRes.reason : 'http error')
        }
        if (creditsRes.status === 'fulfilled' && creditsRes.value?.ok) {
          const d = await creditsRes.value.json()
          enrichedCast = ((d.cast ?? []) as { name: string }[]).slice(0, 5).map((c) => c.name)
          console.log('[create-work] TMDb credits OK — cast:', enrichedCast)
        } else {
          console.warn('[create-work] TMDb credits FAIL —', creditsRes.status === 'rejected' ? creditsRes.reason : 'http error')
        }
        if (externalRes.status === 'fulfilled' && externalRes.value?.ok) {
          const d = await externalRes.value.json()
          enrichedImdbId = d.imdb_id ?? null
          console.log('[create-work] TMDb external_ids OK — imdb_id:', enrichedImdbId)
        } else {
          console.warn('[create-work] TMDb external_ids FAIL —', externalRes.status === 'rejected' ? externalRes.reason : 'http error')
        }

        // Letterboxd: usar redirect de IMDb para obtener la URL exacta del film
        // Solo para películas — el redirect /imdb/{id}/ de Letterboxd es fiable en movies
        if (enrichedImdbId && type === 'movie') {
          try {
            const lbRes = await fetch(
              `https://letterboxd.com/imdb/${enrichedImdbId}/`,
              { redirect: 'manual' }
            )
            const location = lbRes.headers.get('location')
            if (location && location.includes('/film/')) {
              enrichedLetterboxdUrl = location.startsWith('http')
                ? location
                : `https://letterboxd.com${location}`
              console.log('[create-work] Letterboxd OK — letterboxd_url:', enrichedLetterboxdUrl)
            } else {
              console.warn('[create-work] Letterboxd sin redirect — status:', lbRes.status, '| location:', location)
            }
          } catch (e) {
            console.warn('[create-work] Letterboxd error:', e)
          }
        }
      }

      // Trakt.tv: buscar slug por tmdb_id
      const traktKey = process.env.TRAKT_API_KEY
      if (traktKey) {
        const traktType = type === 'series' ? 'show' : 'movie'
        try {
          const traktRes = await fetch(
            `https://api.trakt.tv/search/tmdb/${tmdb_id}?type=${traktType}`,
            { headers: { 'trakt-api-key': traktKey, 'trakt-api-version': '2', 'Content-Type': 'application/json' } }
          )
          if (traktRes.ok) {
            const traktData = await traktRes.json() as { type: string; movie?: { ids: { slug: string } }; show?: { ids: { slug: string } } }[]
            console.log('[create-work] Trakt raw response — url:', `https://api.trakt.tv/search/tmdb/${tmdb_id}?type=${traktType}`, '| status:', traktRes.status, '| data:', JSON.stringify(traktData))
            const hit = traktData.find((r) => r.type === traktType)
            const slug = traktType === 'show' ? hit?.show?.ids.slug : hit?.movie?.ids.slug
            if (slug) {
              enrichedTracktvUrl = traktType === 'show'
                ? `https://trakt.tv/shows/${slug}`
                : `https://trakt.tv/movies/${slug}`
              console.log('[create-work] Trakt OK — tracktv_url:', enrichedTracktvUrl)
            }
          } else {
            console.warn('[create-work] Trakt FAIL — status:', traktRes.status)
          }
        } catch (e) {
          console.warn('[create-work] Trakt error:', e)
        }
      } else {
        console.warn('[create-work] TRAKT_API_KEY no definida — saltando Trakt')
      }
    } else {
      console.log('[create-work] paso 3c: sin enriquecimiento (no es película/serie con tmdb_id)')
    }
    console.log('[create-work] paso 3c resultado — cast:', enrichedCast, '| runtime:', enrichedRuntime, '| imdb_id:', enrichedImdbId, '| tracktv_url:', enrichedTracktvUrl, '| letterboxd_url:', enrichedLetterboxdUrl)

    const genres_arr: string[] = genres ?? []

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
      letterboxd_url: enrichedLetterboxdUrl,
      tracktv_url: enrichedTracktvUrl,
      country: enrichedCountry,
      isbn: isbn ?? null,
      publisher: publisher ?? null,
      pages: pages ?? null,
      saga: saga ?? null,
      saga_order: saga_order ?? null,
    }

    console.log('[create-work] paso 4: insertando work — cast:', workPayload.cast, '| runtime:', workPayload.runtime, '| imdb_id:', workPayload.imdb_id)
    const { data: work, error: workError } = await (supabase
      .from('works') as any)
      .insert(workPayload)
      .select()
      .single()

    if (workError) {
      console.error('[create-work] paso 4 ERROR — workError:', JSON.stringify(workError))
      if (workError.code === '23505') {
        // Duplicate key — find the existing work
        let existingWork: { id: string; slug: string } | null = null
        if (tmdb_id) {
          const { data } = await (supabase.from('works') as any).select('id, slug').eq('tmdb_id', tmdb_id).maybeSingle()
          existingWork = data ?? null
        } else if (google_books_id) {
          const { data } = await (supabase.from('works') as any).select('id, slug').eq('google_books_id', google_books_id).maybeSingle()
          existingWork = data ?? null
        }

        if (!existingWork) {
          return NextResponse.json({ error: 'Ya existe una obra con ese identificador.' }, { status: 409 })
        }

        // Check if the existing work already has a card
        const { data: existingCard } = await (supabase.from('cards') as any)
          .select('id, status')
          .eq('work_id', existingWork.id)
          .maybeSingle()

        if (existingCard) {
          if (existingCard.status === 'published') {
            return NextResponse.json(
              { error: 'Ya existe una ficha publicada para esta obra.', slug: existingWork.slug },
              { status: 409 }
            )
          } else {
            // Draft exists — redirect to edit it silently
            const redirectTo = role === 'user' ? '/perfil' : `/admin/ficha/${existingCard.id}`
            return NextResponse.json({ workId: existingWork.id, cardId: existingCard.id, redirectTo })
          }
        }

        // No card yet — create card + sections for the existing work
        console.log('[create-work] work existente sin card — creando card para work.id:', existingWork.id)
        const { data: newCard, error: cardErr } = await (supabase.from('cards') as any)
          .insert({ work_id: existingWork.id, status: 'draft', created_by: user.id, is_committed: false })
          .select()
          .single()

        if (cardErr) {
          console.error('[create-work] error creando card para work existente:', JSON.stringify(cardErr))
          return NextResponse.json({ error: cardErr.message }, { status: 500 })
        }

        const defaultSections = [
          { card_id: newCard.id, label: 'Inicio', short_label: 'Inicio', order_index: 0, parent_id: null, is_published: false, content: '' },
          { card_id: newCard.id, label: 'Nudo', short_label: 'Nudo', order_index: 1, parent_id: null, is_published: false, content: '' },
          { card_id: newCard.id, label: 'Desenlace', short_label: 'Desenlace', order_index: 2, parent_id: null, is_published: false, content: '' },
          { card_id: newCard.id, label: 'Subtramas y personajes', short_label: 'Subtramas', order_index: 3, parent_id: null, is_published: false, content: '' },
        ]
        await (supabase.from('sections') as any).insert(defaultSections)

        const redirectTo = role === 'user' ? '/perfil' : `/admin/ficha/${newCard.id}`
        return NextResponse.json({ workId: existingWork.id, cardId: newCard.id, redirectTo })
      }
      return NextResponse.json({ error: workError.message, detail: workError }, { status: 400 })
    }
    console.log('[create-work] paso 4 OK — work.id:', work.id, '| cast guardado:', work.cast, '| runtime:', work.runtime, '| imdb_id:', work.imdb_id)

    console.log('[create-work] paso 5: insertando card...')
    const { data: card, error: cardError } = await (supabase
      .from('cards') as any)
      .insert({ work_id: work.id, status: 'draft', created_by: user.id, is_committed: false })
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
