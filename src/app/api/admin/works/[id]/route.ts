import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: card } = await (supabase.from('cards') as any)
    .select('id').eq('work_id', workId).maybeSingle()
  if (card) {
    return NextResponse.json({ error: 'No se puede eliminar una obra que ya tiene ficha' }, { status: 409 })
  }

  const { error } = await (supabase.from('works') as any).delete().eq('id', workId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
