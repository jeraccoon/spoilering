import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

const TMDB_BASE = 'https://api.themoviedb.org/3'

async function tmdbGet(path: string, apiKey: string) {
  const res = await fetch(`${TMDB_BASE}${path}?language=es-ES&api_key=${apiKey}`)
  if (!res.ok) throw new Error(`TMDb error ${res.status}: ${path}`)
  return res.json()
}

export async function fetchAndStoreSeasonsForWork(workId: string, tmdbId: number): Promise<{ seasons: number; episodes: number }> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) throw new Error('TMDB_API_KEY no configurada')

  const admin = createAdminClient()
  const show = await tmdbGet(`/tv/${tmdbId}`, apiKey)
  const tmdbSeasons: any[] = (show.seasons ?? []).filter((s: any) => s.season_number > 0)

  let totalEpisodes = 0

  for (const tmdbSeason of tmdbSeasons) {
    const seasonData = await tmdbGet(`/tv/${tmdbId}/season/${tmdbSeason.season_number}`, apiKey)

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

  return { seasons: tmdbSeasons.length, episodes: totalEpisodes }
}
