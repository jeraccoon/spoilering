import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: seasons, error } = await (supabase.from('seasons') as any)
    .select(`
      id,
      season_number,
      name,
      overview,
      air_date,
      episode_count,
      poster_path,
      tmdb_season_id,
      episodes (
        id,
        episode_number,
        name,
        overview,
        air_date,
        runtime,
        still_path,
        card_id
      )
    `)
    .eq('work_id', workId)
    .order('season_number', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sorted = (seasons ?? []).map((s: any) => ({
    ...s,
    episodes: (s.episodes ?? []).sort((a: any, b: any) => a.episode_number - b.episode_number),
  }))

  return NextResponse.json({ seasons: sorted })
}
