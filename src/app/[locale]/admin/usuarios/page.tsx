import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminUsersTable, type UserRow } from '@/components/admin-users-table'

async function getUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') redirect('/admin')

  const admin = createAdminClient()

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

  const rows: UserRow[] = authUsers.map((u) => {
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

  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { users: rows, currentUserId: user.id }
}

export default async function AdminUsuariosPage() {
  const { users, currentUserId } = await getUsers()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Cabecera */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link
              href="/admin"
              className="text-sm text-ink/55 hover:text-ink"
            >
              ← Panel
            </Link>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink">Gestión de usuarios</h1>
          <p className="mt-1 text-sm text-ink/50">
            <span className="font-semibold text-ink">{users.length}</span>{' '}
            {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
          </p>
        </div>
      </div>

      {/* Tabla interactiva */}
      <AdminUsersTable initialUsers={users} currentUserId={currentUserId} />

    </div>
  )
}
