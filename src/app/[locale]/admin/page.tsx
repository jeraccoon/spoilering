import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { PendingCardsSection, type PendingCard } from '@/components/pending-cards-section'
import { OrphanWorksSection } from '@/components/admin/orphan-works-section'
import { InactiveDraftsSection } from '@/components/admin/inactive-drafts-section'
import { AdminCardsFilter } from '@/components/admin/admin-cards-filter'

export const dynamic = 'force-dynamic'

async function getAdminData() {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [works, published, drafts, users, pendingRevisions, pendingSuggestions, allDraftCards, orphanWorksResult, inactiveDraftsResult, { data: { user } }, contactResult] =
    await Promise.all([
      supabase.from('works').select('*', { count: 'exact', head: true }),
      supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('revisions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      (supabase.from('suggestions') as any).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      (supabase.from('cards') as any)
        .select('id, status, is_committed, created_at, work:works(title, type, slug), creator:profiles!created_by(username, role)')
        .order('created_at', { ascending: false })
        .limit(100),
      (supabase.from('works') as any)
        .select('id, title, type, year, created_at, cards(id)')
        .order('created_at', { ascending: false })
        .limit(50),
      (supabase.from('cards') as any)
        .select('id, updated_at, work:works(title, type)')
        .eq('status', 'draft')
        .lt('updated_at', thirtyDaysAgo)
        .order('updated_at', { ascending: true })
        .limit(30),
      supabase.auth.getUser(),
      (supabase.from('contact_messages') as any)
        .select('id, name, email, type, message, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
    ])

  let username = 'admin'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    username = (profile as { username: string } | null)?.username ?? 'admin'
  }

  const allCards: any[] = allDraftCards.data ?? []
  const pendingCards: PendingCard[] = allCards
    .filter((c) => c.status === 'draft' && c.creator?.role === 'user' && c.is_committed !== false)
    .slice(0, 20)
  const uncommittedCount = allCards.filter((c) => c.is_committed === false && c.creator?.role === 'user').length

  const inactiveDrafts: any[] = inactiveDraftsResult.data ?? []

  const allWorks: any[] = orphanWorksResult.data ?? []
  const orphanWorks = allWorks
    .filter((w: any) => !w.cards || w.cards.length === 0)
    .map(({ cards: _cards, ...w }: any) => w)
    .slice(0, 20)

  const contactMessages: any[] = contactResult.data ?? []

  return {
    stats: {
      works: works.count ?? 0,
      published: published.count ?? 0,
      drafts: drafts.count ?? 0,
      users: users.count ?? 0,
      pendingRevisions: pendingRevisions.count ?? 0,
      pendingSuggestions: pendingSuggestions.count ?? 0,
      uncommitted: uncommittedCount,
    },
    allCards,
    pendingCards,
    orphanWorks,
    inactiveDrafts,
    contactMessages,
    username,
  }
}


const TYPE_COLORS: Record<string, string> = {
  suggestion: 'bg-moss/10 text-moss',
  bug: 'bg-ember/10 text-ember',
  other: 'bg-ink/10 text-ink/60',
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Admin.main')
  const tContactTypes = await getTranslations('Admin.contact.types')
  const dateLocale = locale === 'en' ? 'en-US' : 'es-ES'

  const { stats, allCards, pendingCards, orphanWorks, inactiveDrafts, contactMessages, username } = await getAdminData()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Cabecera */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink/50">
            {t('welcome')} <span className="font-semibold text-ink">{username}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/usuarios"
            className="rounded-lg border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-ink/40 hover:bg-ink/5 hover:text-ink"
          >
            {t('users')}
          </Link>
          <Link
            href="/admin/nueva-obra"
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90"
          >
            {t('newWork')}
          </Link>
        </div>
      </div>

      {/* Estadísticas + fichas filtrables */}
      <AdminCardsFilter allCards={allCards} stats={stats} />

      {/* Fichas sin confirmar */}
      {stats.uncommitted > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-4 rounded-lg border border-orange-200 bg-orange-50 px-6 py-4">
            <span className={`text-3xl font-black tabular-nums text-orange-600`}>
              {stats.uncommitted}
            </span>
            <div>
              <p className="font-semibold text-orange-800">
                {t('uncommittedTitle', { count: stats.uncommitted })}
              </p>
              <p className="text-sm text-orange-700/70">{t('uncommittedSubtitle')}</p>
            </div>
          </div>
        </section>
      )}

      {/* Fichas pendientes de revisión (enviadas por usuarios) */}
      <section className="mb-10">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/55">
          {t('pendingCardsTitle')}
        </h2>
        <p className="mb-4 text-xs text-ink/55">{t('pendingCardsSubtitle')}</p>
        <PendingCardsSection initialCards={pendingCards} />
      </section>

      {/* Borradores inactivos */}
      {inactiveDrafts.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/55">
            {t('inactiveDraftsTitle')}
          </h2>
          <p className="mb-4 text-xs text-ink/55">{t('inactiveDraftsSubtitle')}</p>
          <InactiveDraftsSection initialDrafts={inactiveDrafts} />
        </section>
      )}

      {/* Obras sin ficha */}
      {orphanWorks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/55">
            {t('orphanWorksTitle')}
          </h2>
          <p className="mb-4 text-xs text-ink/55">{t('orphanWorksSubtitle')}</p>
          <OrphanWorksSection initialWorks={orphanWorks} />
        </section>
      )}

      {/* Revisiones pendientes */}
      <section className="mb-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/55">
          {t('pendingRevisionsTitle')}
        </h2>
        <div className="flex items-center gap-4 rounded-lg border border-ink/10 bg-paper px-6 py-5 shadow-sm">
          <span className="text-4xl font-black tabular-nums text-ink">
            {stats.pendingRevisions}
          </span>
          <div>
            <p className="font-semibold text-ink">
              {t('pendingRevisionsLabel', { count: stats.pendingRevisions })}
            </p>
            <p className="text-sm text-ink/50">{t('pendingRevisionsSubtitle')}</p>
          </div>
          {stats.pendingRevisions > 0 && (
            <Link
              href={'/admin' as const}
              className="ml-auto rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5"
            >
              {t('review')}
            </Link>
          )}
        </div>
      </section>

      {/* Mensajes de contacto */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/55">
              {t('contactMessagesTitle')}
            </h2>
            <p className="text-xs text-ink/55">{t('contactMessagesSubtitle')}</p>
          </div>
          <Link
            href="/admin/contacto"
            className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/40 hover:text-ink"
          >
            {t('viewAll')}
          </Link>
        </div>
        {contactMessages.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/[0.02] px-6 py-8 text-center text-sm text-ink/45">
            {t('noMessages')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">{t('tableDate')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('tableType')}</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">{t('tableFrom')}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t('tableMessage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {contactMessages.map((m: any) => {
                  const typeKey = m.type as 'suggestion' | 'error' | 'bug' | 'other'
                  const typeLabel = ['suggestion', 'error', 'bug', 'other'].includes(typeKey) ? tContactTypes(typeKey) : m.type
                  return (
                    <tr key={m.id} className="align-top transition hover:bg-ink/5">
                      <td className="px-4 py-3 text-xs text-ink/55 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[m.type] ?? TYPE_COLORS.other}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink/50 hidden sm:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {m.name && <span className="font-medium text-ink">{m.name}</span>}
                          {m.email && <span className="text-ink/55">{m.email}</span>}
                          {!m.name && !m.email && <span className="text-ink/25">{t('anonymous')}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink/70 max-w-xs">
                        <p className="line-clamp-3 text-sm leading-relaxed">{m.message}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sugerencias pendientes */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/55">
          {t('suggestionsTitle')}
        </h2>
        <div className="flex items-center gap-4 rounded-lg border border-ink/10 bg-paper px-6 py-5 shadow-sm">
          <span className={`text-4xl font-black tabular-nums ${stats.pendingSuggestions > 0 ? 'text-plum' : 'text-ink'}`}>
            {stats.pendingSuggestions}
          </span>
          <div>
            <p className="font-semibold text-ink">
              {t('suggestionsLabel', { count: stats.pendingSuggestions })}
            </p>
            <p className="text-sm text-ink/50">{t('suggestionsSubtitle')}</p>
          </div>
          <Link
            href="/admin/sugerencias"
            className="ml-auto rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5"
          >
            {stats.pendingSuggestions > 0 ? t('review') : t('viewAllSuggestions')}
          </Link>
        </div>
      </section>
    </div>
  )
}
