'use client'

import { useState } from 'react'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = { movie: 'Película', series: 'Serie', book: 'Libro' }

type FilterKey = 'all' | 'published' | 'draft' | 'incomplete'

interface Card {
  id: string
  status: string
  created_at: string
  is_complete: boolean
  work: { title: string; type: string; slug: string } | null
  creator: { username: string; role: string } | null
}

interface Stats {
  works: number
  published: number
  drafts: number
  users: number
  incomplete: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatCard({
  value, label, accent = 'text-ink', filter, active, onClick,
}: {
  value: number; label: string; accent?: string
  filter: FilterKey | null; active: boolean; onClick: () => void
}) {
  const clickable = filter !== null
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full rounded-lg border px-5 py-5 text-left shadow-sm transition ${
        active
          ? 'border-ember bg-ember/5 ring-1 ring-ember/30'
          : clickable
          ? 'border-ink/10 bg-paper hover:border-ember/40 hover:bg-ember/5'
          : 'cursor-default border-ink/10 bg-paper'
      }`}
    >
      <p className={`text-4xl font-black tabular-nums ${active ? 'text-ember' : accent}`}>{value}</p>
      <p className="mt-1.5 text-sm text-ink/50">{label}</p>
    </button>
  )
}

export function AdminCardsFilter({
  allCards,
  stats,
}: {
  allCards: Card[]
  stats: Stats
}) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('draft')
  const [cards, setCards] = useState<Card[]>(allCards)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggle(filter: FilterKey) {
    setActiveFilter((prev) => (prev === filter ? 'all' : filter))
  }

  const filtered = cards.filter((c) => {
    if (activeFilter === 'published') return c.status === 'published'
    if (activeFilter === 'draft') return c.status === 'draft' && (!c.creator || c.creator.role !== 'user')
    if (activeFilter === 'incomplete') return c.is_complete === false
    return c.status === 'draft' && (!c.creator || c.creator.role !== 'user')
  })

  async function handleDelete(cardId: string) {
    if (!confirm('¿Eliminar esta ficha? Esta acción no se puede deshacer.')) return
    setDeleting(cardId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, { method: 'DELETE' })
      const data = await res.json()
      console.log('[DELETE card]', cardId, res.status, data)
      if (!res.ok) { setError(data.error ?? 'Error al eliminar'); return }
      setCards((prev) => prev.filter((c) => c.id !== cardId))
    } catch {
      setError('Error inesperado al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  const sectionLabel: Record<FilterKey, string> = {
    all: 'Fichas (admin / editor)',
    published: 'Fichas publicadas',
    draft: 'Fichas en borrador',
    incomplete: 'Fichas incompletas',
  }

  return (
    <>
      {/* Stats */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Resumen</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard value={stats.works}     label="Obras totales"      filter={null}         active={false}                         onClick={() => {}} />
          <StatCard value={stats.published} label="Fichas publicadas"  accent="text-moss"    filter="published" active={activeFilter === 'published'}  onClick={() => toggle('published')} />
          <StatCard value={stats.drafts}    label="En borrador"        accent="text-ember"   filter="draft"     active={activeFilter === 'draft'}      onClick={() => toggle('draft')} />
          <StatCard value={stats.users}     label="Usuarios"           filter={null}         active={false}                         onClick={() => {}} />
          {stats.incomplete > 0 && (
            <StatCard value={stats.incomplete} label="Fichas incompletas" accent="text-amber-600" filter="incomplete" active={activeFilter === 'incomplete'} onClick={() => toggle('incomplete')} />
          )}
        </div>
      </section>

      {/* Filtered table */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
          {sectionLabel[activeFilter]}
        </h2>
        {error && (
          <p className="mb-3 rounded-lg border border-ember/30 bg-ember/5 px-4 py-2.5 text-sm text-ember">{error}</p>
        )}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
            No hay fichas en esta categoría.
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
                {filtered.map((card) => (
                  <tr key={card.id} className="transition hover:bg-ink/5">
                    <td className="px-4 py-3 font-semibold text-ink">
                      <span>{card.work?.title ?? '—'}</span>
                      {card.is_complete === false && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Incompleta</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/50">{TYPE_LABELS[card.work?.type ?? ''] ?? '—'}</td>
                    <td className="px-4 py-3 text-ink/50">{card.created_at ? formatDate(card.created_at) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/ficha/${card.id}`}
                          className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink"
                        >
                          Editar
                        </Link>
                        {card.status === 'draft' && (
                          <Link
                            href={`/admin/fichas/${card.id}/publicar`}
                            className="rounded-md bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss transition hover:bg-moss/20"
                          >
                            Publicar
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(card.id)}
                          disabled={deleting === card.id}
                          className="text-xs font-semibold text-ink/30 transition hover:text-ember disabled:opacity-40"
                        >
                          {deleting === card.id ? '…' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
