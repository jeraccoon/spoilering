import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TMDB_BASE = 'https://api.themoviedb.org/3'

async function tmdbGet(path: string, apiKey: string) {
  const res = await fetch(`${TMDB_BASE}${path}?language=es-ES&api_key=${apiKey}`)
  if (!res.ok) throw new Error(`TMDb error ${res.status}: ${path}`)
  return res.json()
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['editor', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: work } = await (admin.from('works') as any)
    .select('tmdb_id, type')
    .eq('id', workId)
    .single()

  if (!work) return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
  if (work.type !== 'series') return NextResponse.json({ error: 'La obra no es una serie' }, { status: 400 })
  if (!work.tmdb_id) return NextResponse.json({ error: 'La obra no tiene tmdb_id' }, { status: 400 })

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TMDB_API_KEY no configurada' }, { status: 500 })

  const show = await tmdbGet(`/tv/${work.tmdb_id}`, apiKey)
  const tmdbSeasons: any[] = (show.seasons ?? []).filter((s: any) => s.season_number > 0)

  let totalEpisodes = 0

  for (const tmdbSeason of tmdbSeasons) {
    const seasonData = await tmdbGet(`/tv/${work.tmdb_id}/season/${tmdbSeason.season_number}`, apiKey)

    const { data: upsertedSeason } = await (admin.from('seasons') as any)
      .upsert(
        {
          work_id: workId,
          season_number: tmdbSeason.season_number,
          name: tmdbSeason.name ?? seasonData.name ?? null,
          overview: seasonData.overview ?? null,
          air_date: seasonData.air_date ?? null,
          episode_count: seasonData.episodes?.length ?? tmdbSeason.episode_count ?? 0,
          poster_path: tmdbSeason.poster_path ?? null,
          tmdb_season_id: tmdbSeason.id ?? null,
        },
        { onConflict: 'work_id,season_number' },
      )
      .select('id')
      .single()

    if (!upsertedSeason?.id) continue

    const episodes: any[] = seasonData.episodes ?? []
    totalEpisodes += episodes.length

    if (episodes.length > 0) {
      await (admin.from('episodes') as any)
        .upsert(
          episodes.map((ep: any) => ({
            season_id: upsertedSeason.id,
            episode_number: ep.episode_number,
            name: ep.name ?? null,
            overview: ep.overview ?? null,
            air_date: ep.air_date ?? null,
            runtime: ep.runtime ?? null,
            still_path: ep.still_path ?? null,
            tmdb_episode_id: ep.id ?? null,
          })),
          { onConflict: 'season_id,episode_number' },
        )
    }
  }

  return NextResponse.json({ ok: true, seasons: tmdbSeasons.length, episodes: totalEpisodes })
}
