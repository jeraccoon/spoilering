import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContactMessagesList } from '@/components/admin/contact-messages-list'

export const metadata = { title: 'Mensajes de contacto — Admin' }

const TYPE_LABELS: Record<string, string> = {
  suggestion: 'Sugerencia',
  error: 'Error',
  other: 'Otro',
}

export type ContactMessage = {
  id: string
  name: string | null
  email: string | null
  type: string
  message: string
  created_at: string
  read_at: string | null
  user_id: string | null
}

export default async function ContactoAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin')

  const admin = createAdminClient()
  const { data: messages } = await (admin.from('contact_messages') as any)
    .select('*')
    .order('created_at', { ascending: false })

  const list: ContactMessage[] = messages ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Mensajes de contacto</h1>
          <p className="mt-1 text-sm text-ink/50">
            {list.filter((m) => !m.read_at).length} sin leer · {list.length} en total
          </p>
        </div>
        <a href="/admin" className="text-sm font-semibold text-ink/50 hover:text-ink">← Admin</a>
      </div>

      <ContactMessagesList initialMessages={list} typeLabels={TYPE_LABELS} />
    </div>
  )
}
