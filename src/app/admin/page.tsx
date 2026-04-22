import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getStats() {
  const supabase = await createClient()

  const [works, published, drafts, users] = await Promise.all([
    supabase.from('works').select('*', { count: 'exact', head: true }),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  return {
    works: works.count ?? 0,
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    users: users.count ?? 0,
  }
}

async function getDraftCards() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cards')
    .select('*, work:works(title, type, year, slug)')
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(10)
  return (data ?? []) as any[]
}

const TYPE_LABELS: Record<string, string> = {
  movie: 'Película',
  series: 'Serie',
  book: 'Libro',
}

export default async function AdminPage() {
  const [stats, drafts] = await Promise.all([getStats(), getDraftCards()])

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">

        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de administración</h1>
            <p className="mt-1 text-sm text-zinc-400">Gestiona obras, fichas y usuarios.</p>
          </div>
          <Link
            href="/admin/obras/nueva"
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
          >
            + Nueva obra
          </Link>
        </div>

        {/* Estadísticas */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Resumen</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard value={stats.works} label="Obras totales" />
            <StatCard value={stats.published} label="Fichas publicadas" accent="text-green-400" />
            <StatCard value={stats.drafts} label="Fichas en borrador" accent="text-amber-400" />
            <StatCard value={stats.users} label="Usuarios registrados" />
          </div>
        </section>

        {/* Fichas en borrador */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Fichas en borrador
          </h2>
          {drafts.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-10 text-center text-zinc-500">
              No hay fichas en borrador.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900 text-xs text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Obra</th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium">Año</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                  {drafts.map((card) => (
                    <tr key={card.id} className="transition hover:bg-zinc-900">
                      <td className="px-4 py-3 font-medium text-zinc-100">
                        {card.work?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {TYPE_LABELS[card.work?.type] ?? card.work?.type ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {card.work?.year ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/fichas/${card.id}`}
                          className="text-xs font-semibold text-zinc-400 underline hover:text-white"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({
  value,
  label,
  accent = 'text-white',
}: {
  value: number
  label: string
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-5">
      <p className={`text-4xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="mt-1.5 text-sm text-zinc-400">{label}</p>
    </div>
  )
}
