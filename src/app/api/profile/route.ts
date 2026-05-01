import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const allowed = ['letterboxd_profile', 'tracktv_profile', 'goodreads_profile', 'filmaffinity_profile']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin campos a actualizar' }, { status: 400 })
  }

  const { error } = await (supabase.from('profiles') as any)
    .update(update)
    .eq('id', user.id)

  if (error) {
    console.error('[PATCH profile]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
