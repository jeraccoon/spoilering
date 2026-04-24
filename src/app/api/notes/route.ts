import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get('card_id')
  if (!cardId) return NextResponse.json({ error: 'card_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await (supabase.from('notes') as any)
    .select('id, content, updated_at')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .maybeSingle()

  return NextResponse.json({ note: data ?? null })
}

export async function POST(req: NextRequest) {
  const { card_id, content } = await req.json()
  if (!card_id || !content?.trim()) {
    return NextResponse.json({ error: 'card_id and content required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase.from('notes') as any)
    .upsert(
      { user_id: user.id, card_id, content: content.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id,card_id' },
    )
    .select('id, content, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

export async function DELETE(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get('card_id')
  if (!cardId) return NextResponse.json({ error: 'card_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await (supabase.from('notes') as any)
    .delete()
    .eq('user_id', user.id)
    .eq('card_id', cardId)

  return NextResponse.json({ ok: true })
}
