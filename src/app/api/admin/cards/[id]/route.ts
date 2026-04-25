import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  const role: string = profile?.role ?? 'user'

  const { id } = await params

  const { data: card } = await (supabase.from('cards') as any)
    .select('created_by').eq('id', id).maybeSingle()
  if (!card) return NextResponse.json({ error: 'Ficha no encontrada' }, { status: 404 })

  const isCreator = card.created_by === user.id
  const isAdmin = role === 'admin'
  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { error } = await (supabase.from('cards') as any).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
