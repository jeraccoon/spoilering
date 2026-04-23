import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const { id } = await params
  const { action } = await request.json()

  if (action === 'approve') {
    const { data: suggestion } = await (supabase.from('suggestions') as any)
      .select('section_id, suggested_content')
      .eq('id', id)
      .single()
    if (!suggestion) return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 })

    await (supabase.from('sections') as any)
      .update({ content: suggestion.suggested_content })
      .eq('id', suggestion.section_id)

    await (supabase.from('suggestions') as any)
      .update({ status: 'approved' })
      .eq('id', id)

    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    await (supabase.from('suggestions') as any)
      .update({ status: 'rejected' })
      .eq('id', id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
