import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link, redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContactMessagesList } from '@/components/admin/contact-messages-list'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Admin.contact' })
  return { title: t('metaTitle') }
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

export default async function ContactoAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Admin.contact')
  const tTypes = await getTranslations('Admin.contact.types')

  const supabase = await createClient()
  const auth = await supabase.auth.getUser()
  if (!auth.data.user) redirect({ href: '/login', locale })
  const user = auth.data.user!

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') redirect({ href: '/admin', locale })

  const admin = createAdminClient()
  const { data: messages } = await (admin.from('contact_messages') as any)
    .select('*')
    .order('created_at', { ascending: false })

  const list: ContactMessage[] = messages ?? []
  const TYPE_LABELS: Record<string, string> = {
    suggestion: tTypes('suggestion'),
    error: tTypes('error'),
    other: tTypes('other'),
    bug: tTypes('bug'),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t('summary', { unread: list.filter((m) => !m.read_at).length, total: list.length })}
          </p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-ink/50 hover:text-ink">{t('back')}</Link>
      </div>

      <ContactMessagesList initialMessages={list} typeLabels={TYPE_LABELS} />
    </div>
  )
}
