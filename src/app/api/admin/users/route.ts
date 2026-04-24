import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const admin = createAdminClient()
  const supabase = await createClient()

  const [
    { data: { users: authUsers } },
    { data: profiles },
    { data: cards },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    (supabase.from('profiles') as any).select('id, username, role, is_active, created_at'),
    (supabase.from('cards') as any).select('created_by').not('created_by', 'is', null),
  ])

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))
  const cardCountMap = new Map<string, number>()
  for (const card of (cards ?? [])) {
    if (card.created_by) {
      cardCountMap.set(card.created_by, (cardCountMap.get(card.created_by) ?? 0) + 1)
    }
  }

  const rows = authUsers.map((u) => {
    const p = profileMap.get(u.id) as any
    return {
      id: u.id,
      email: u.email ?? '',
      username: p?.username ?? null,
      role: p?.role ?? 'user',
      is_active: p?.is_active !== false,
      created_at: p?.created_at ?? u.created_at,
      card_count: cardCountMap.get(u.id) ?? 0,
    }
  })

  return NextResponse.json({ users: rows })
}
