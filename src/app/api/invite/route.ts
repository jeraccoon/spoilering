import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MONTHLY_LIMIT = 5

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { email } = body
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  // Check monthly invite count
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await (supabase.from('invites') as any)
    .select('id', { count: 'exact', head: true })
    .eq('inviter_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  if ((count ?? 0) >= MONTHLY_LIMIT) {
    return NextResponse.json(
      { error: 'Has alcanzado el límite de 5 invitaciones mensuales' },
      { status: 429 }
    )
  }

  // Send invite via Supabase Auth
  const admin = createAdminClient()
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email)
  if (inviteError) {
    // "User already registered" is a common error — surface it clearly
    const msg = inviteError.message.toLowerCase().includes('already')
      ? 'Ese email ya tiene una cuenta en Spoilering'
      : inviteError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Record in invites table
  await (supabase.from('invites') as any).insert({ inviter_id: user.id, email })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await (supabase.from('invites') as any)
    .select('id', { count: 'exact', head: true })
    .eq('inviter_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  return NextResponse.json({ count: count ?? 0 })
}
