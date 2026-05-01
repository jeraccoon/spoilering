import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  const role: string = profile?.role ?? 'user'
  if (!['editor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const allowed = ['cast', 'runtime', 'imdb_id', 'letterboxd_url', 'goodreads_url', 'filmaffinity_url', 'tracktv_url', 'country', 'isbn', 'publisher', 'pages', 'saga', 'saga_order']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin campos a actualizar' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await (admin.from('works') as any).update(update).eq('id', workId)
  if (error) {
    console.error('[PATCH work]', workId, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  const role: string = profile?.role ?? 'user'
  if (!['editor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: card } = await (admin.from('cards') as any)
    .select('id').eq('work_id', workId).maybeSingle()
  if (card) {
    return NextResponse.json({ error: 'No se puede eliminar una obra que ya tiene ficha' }, { status: 409 })
  }

  const { error } = await (admin.from('works') as any).delete().eq('id', workId)
  if (error) {
    console.error('[DELETE work]', workId, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
