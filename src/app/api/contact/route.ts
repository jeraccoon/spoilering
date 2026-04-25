import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, type, message } = body
  if (!message?.trim()) {
    return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { error } = await (admin.from('contact_messages') as any).insert({
    user_id: user?.id ?? null,
    name: name?.trim() || null,
    email: email?.trim() || null,
    type: type || 'other',
    message: message.trim(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
