import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null as string | null }
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  return { user, role: (profile?.role ?? 'user') as string }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, role } = await getAuth()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  // Solo aceptamos campos editables conocidos
  const update: Record<string, unknown> = {}
  if (typeof body.summary === 'string' || body.summary === null) {
    update.summary = body.summary === '' ? null : body.summary
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin cambios válidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: card } = await (admin.from('cards') as any)
    .select('created_by').eq('id', id).maybeSingle()
  if (!card) return NextResponse.json({ error: 'Ficha no encontrada' }, { status: 404 })

  const isCreator = card.created_by === user.id
  const isPrivileged = role === 'admin' || role === 'editor'
  if (!isCreator && !isPrivileged) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { error } = await (admin.from('cards') as any).update(update).eq('id', id)
  if (error) {
    console.error('[PATCH card] update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, role } = await getAuth()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  const admin = createAdminClient()

  const { data: card, error: fetchError } = await (admin.from('cards') as any)
    .select('created_by').eq('id', id).maybeSingle()

  if (fetchError) {
    console.error('[DELETE card] fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!card) return NextResponse.json({ error: 'Ficha no encontrada' }, { status: 404 })

  const isCreator = card.created_by === user.id
  const isAdmin = role === 'admin'
  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { error } = await (admin.from('cards') as any).delete().eq('id', id)
  if (error) {
    console.error('[DELETE card] delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
