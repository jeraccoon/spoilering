import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { section_id, original_content, suggested_content, comment } = await request.json()

  if (!section_id || !suggested_content) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (suggested_content.trim().length < 50) {
    return NextResponse.json({ error: 'La sugerencia debe tener al menos 50 caracteres' }, { status: 400 })
  }

  const { error } = await (supabase.from('suggestions') as any).insert({
    section_id,
    user_id: user.id,
    original_content: original_content ?? null,
    suggested_content: suggested_content.trim(),
    comment: comment ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
