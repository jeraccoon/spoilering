import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ record: null })

  const { searchParams } = req.nextUrl
  const work_id = searchParams.get('work_id')
  const episode_id = searchParams.get('episode_id')
  if (!work_id && !episode_id) {
    return NextResponse.json({ error: 'Falta work_id o episode_id' }, { status: 400 })
  }

  let q = (supabase.from('user_content') as any)
    .select('id, watched, watched_at, notes, work_id, episode_id')
    .eq('user_id', user.id)
  if (work_id) q = q.eq('work_id', work_id)
  else q = q.eq('episode_id', episode_id)

  const { data } = await q.maybeSingle()
  return NextResponse.json({ record: data ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { work_id, episode_id, watched, watched_at, notes } = body
  if (!work_id && !episode_id) {
    return NextResponse.json({ error: 'Falta work_id o episode_id' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    watched: watched ?? false,
    watched_at: watched_at || null,
    notes: notes || null,
  }
  if (work_id) payload.work_id = work_id
  else payload.episode_id = episode_id

  const onConflict = work_id ? 'user_id,work_id' : 'user_id,episode_id'

  const { data, error } = await (supabase.from('user_content') as any)
    .upsert(payload, { onConflict })
    .select('id, watched, watched_at, notes, work_id, episode_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ record: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const work_id = searchParams.get('work_id')
  const episode_id = searchParams.get('episode_id')
  if (!work_id && !episode_id) {
    return NextResponse.json({ error: 'Falta work_id o episode_id' }, { status: 400 })
  }

  let q = (supabase.from('user_content') as any).delete().eq('user_id', user.id)
  if (work_id) q = q.eq('work_id', work_id)
  else q = q.eq('episode_id', episode_id)

  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
