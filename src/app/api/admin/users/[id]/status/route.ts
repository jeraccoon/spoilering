import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireAdmin()
  if (!currentUser) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { id } = await params
  if (id === currentUser.id) {
    return NextResponse.json({ error: 'No puedes desactivarte a ti mismo.' }, { status: 400 })
  }

  const { is_active } = await request.json()
  const supabase = await createClient()
  const { error } = await (supabase.from('profiles') as any)
    .update({ is_active })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
