import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PendingCardsSection, type PendingCard } from '@/components/pending-cards-section'
import { OrphanWorksSection } from '@/components/admin/orphan-works-section'

async function getAdminData() {
  const supabase = await createClient()

  const [works, published, drafts, users, pendingRevisions, pendingSuggestions, incomplete, allDraftCards, orphanWorksResult, { data: { user } }] =
    await Promise.all([
      supabase.from('works').select('*', { count: 'exact', head: true }),
      supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('revisions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      (supabase.from('suggestions') as any).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      (supabase.from('cards') as any).select('*', { count: 'exact', head: true }).eq('is_complete', false),
      (supabase.from('cards') as any)
        .select('id, created_at, is_complete, work:works(title, type, slug), creator:profiles!created_by(username, role)')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(30),
      (supabase.from('works') as any)
        .select('id, title, type, year, created_at, cards(id)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.auth.getUser(),
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

  const allDrafts: any[] = allDraftCards.data ?? []
  const pendingCards: PendingCard[] = allDrafts
    .filter((c) => c.creator?.role === 'user')
    .slice(0, 20)
  const draftCards = allDrafts
    .filter((c) => !c.creator || c.creator.role !== 'user')
    .slice(0, 10)

  const allWorks: any[] = orphanWorksResult.data ?? []
  const orphanWorks = allWorks
    .filter((w: any) => !w.cards || w.cards.length === 0)
    .map(({ cards: _cards, ...w }: any) => w)
    .slice(0, 20)

  return {
    stats: {
      works: works.count ?? 0,
      published: published.count ?? 0,
      drafts: drafts.count ?? 0,
      users: users.count ?? 0,
      pendingRevisions: pendingRevisions.count ?? 0,
      pendingSuggestions: pendingSuggestions.count ?? 0,
      incomplete: incomplete.count ?? 0,
    },
    draftCards,
    pendingCards,
    orphanWorks,
    username,
  }
}

const TYPE_LABELS: Record<string, string> = {
  movie: 'Película',
  series: 'Serie',
  book: 'Libro',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminPage() {
  const { stats, draftCards, pendingCards, orphanWorks, username } = await getAdminData()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Cabecera */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink">Panel de administración</h1>
          <p className="mt-1 text-sm text-ink/50">
            Bienvenido, <span className="font-semibold text-ink">{username}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/usuarios"
            className="rounded-lg border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-ink/40 hover:bg-ink/5 hover:text-ink"
          >
            Usuarios
          </Link>
          <Link
            href="/admin/nueva-obra"
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90"
          >
            + Nueva obra
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Resumen</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard value={stats.works}      label="Obras totales" />
          <StatCard value={stats.published}  label="Fichas publicadas" accent="text-moss" />
          <StatCard value={stats.drafts}     label="En borrador"       accent="text-ember" />
          <StatCard value={stats.users}      label="Usuarios" />
          {stats.incomplete > 0 && (
            <StatCard value={stats.incomplete} label="Fichas incompletas" accent="text-amber-600" />
          )}
        </div>
      </section>

      {/* Fichas pendientes de revisión (enviadas por usuarios) */}
      <section className="mb-10">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/40">
          Fichas pendientes de revisión
        </h2>
        <p className="mb-4 text-xs text-ink/40">Enviadas por usuarios registrados, esperando aprobación.</p>
        <PendingCardsSection initialCards={pendingCards} />
      </section>

      {/* Fichas en borrador (admin / editor) */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
          Fichas en borrador
        </h2>
        {draftCards.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
            No hay fichas en borrador.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Obra</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Creada</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {draftCards.map((card: any) => (
                  <tr key={card.id} className="transition hover:bg-ink/5">
                    <td className="px-4 py-3 font-semibold text-ink">
                      <span>{card.work?.title ?? '—'}</span>
                      {card.is_complete === false && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Incompleta</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/50">
                      {TYPE_LABELS[card.work?.type] ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-ink/50">
                      {card.created_at ? formatDate(card.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/ficha/${card.id}`}
                          className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/admin/fichas/${card.id}/publicar`}
                          className="rounded-md bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss transition hover:bg-moss/20"
                        >
                          Publicar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Obras sin ficha */}
      {orphanWorks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/40">
            Obras sin ficha
          </h2>
          <p className="mb-4 text-xs text-ink/40">Obras creadas pero sin borrador guardado todavía.</p>
          <OrphanWorksSection initialWorks={orphanWorks} />
        </section>
      )}

      {/* Revisiones pendientes */}
      <section className="mb-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
          Revisiones pendientes
        </h2>
        <div className="flex items-center gap-4 rounded-lg border border-ink/10 bg-paper px-6 py-5 shadow-sm">
          <span className="text-4xl font-black tabular-nums text-ink">
            {stats.pendingRevisions}
          </span>
          <div>
            <p className="font-semibold text-ink">
              {stats.pendingRevisions === 1 ? 'revisión pendiente' : 'revisiones pendientes'}
            </p>
            <p className="text-sm text-ink/50">Propuestas de edición esperando aprobación</p>
          </div>
          {stats.pendingRevisions > 0 && (
            <Link
              href="/admin/revisiones"
              className="ml-auto rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5"
            >
              Revisar
            </Link>
          )}
        </div>
      </section>

      {/* Sugerencias pendientes */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
          Sugerencias de corrección
        </h2>
        <div className="flex items-center gap-4 rounded-lg border border-ink/10 bg-paper px-6 py-5 shadow-sm">
          <span className={`text-4xl font-black tabular-nums ${stats.pendingSuggestions > 0 ? 'text-plum' : 'text-ink'}`}>
            {stats.pendingSuggestions}
          </span>
          <div>
            <p className="font-semibold text-ink">
              {stats.pendingSuggestions === 1 ? 'sugerencia pendiente' : 'sugerencias pendientes'}
            </p>
            <p className="text-sm text-ink/50">Correcciones propuestas por usuarios registrados</p>
          </div>
          <Link
            href="/admin/sugerencias"
            className="ml-auto rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5"
          >
            {stats.pendingSuggestions > 0 ? 'Revisar' : 'Ver todas'}
          </Link>
        </div>
      </section>
    </div>
  )
}

function StatCard({
  value,
  label,
  accent = 'text-ink',
}: {
  value: number
  label: string
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper px-5 py-5 shadow-sm">
      <p className={`text-4xl font-black tabular-nums ${accent}`}>{value}</p>
      <p className="mt-1.5 text-sm text-ink/50">{label}</p>
    </div>
  )
}
