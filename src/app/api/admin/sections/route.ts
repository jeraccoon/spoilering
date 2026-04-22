import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { card_id, parent_id, label, short_label, order_index } = await request.json()
  if (!card_id || !label) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error } = await (supabase.from('sections') as any)
    .insert({
      card_id,
      parent_id: parent_id ?? null,
      label,
      short_label: short_label || null,
      content: '',
      order_index: order_index ?? 0,
      is_published: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
