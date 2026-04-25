import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAndStoreSeasonsForWork } from '@/lib/tmdb/fetchSeasons'

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

  const { data: work } = await (supabase.from('works') as any)
    .select('tmdb_id, type')
    .eq('id', workId)
    .single()

  if (!work) return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
  if (work.type !== 'series') return NextResponse.json({ error: 'La obra no es una serie' }, { status: 400 })
  if (!work.tmdb_id) return NextResponse.json({ error: 'La obra no tiene tmdb_id' }, { status: 400 })

  try {
    const result = await fetchAndStoreSeasonsForWork(workId, work.tmdb_id)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error al importar temporadas' }, { status: 500 })
  }
}
