'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { InviteWidget } from '@/components/invite-widget'

const TYPE_LABELS = { movie: 'Película', series: 'Serie', book: 'Libro' }
const TYPE_COLORS = {
  movie: 'bg-blue-600 text-white',
  series: 'bg-purple-600 text-white',
  book: 'bg-amber-600 text-white',
}
const USER_CARD_LIMIT = 3

type FilterKey = 'all' | 'published' | 'pending'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Card {
  id: string
  status: string
  is_committed: boolean
  updated_at: string
  work: {
    title: string
    type: string
    slug: string
    poster_url: string | null
  }
}

function StatCard({
  value, label, accent = 'text-ink', active, onClick, clickable = true,
}: {
  value: number | string; label: string; accent?: string
  active: boolean; onClick: () => void; clickable?: boolean
}) {
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

export function PerfilCardsSection({
  initialCards,
  role,
  isUser,
  isPrivileged,
  addHref,
  suggestionCount,
  inviteCount = 0,
}: {
  initialCards: Card[]
  role: string
  isUser: boolean
  isPrivileged: boolean
  addHref: string
  suggestionCount: number
  inviteCount?: number
}) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const publishedCount = cards.filter((c) => c.status === 'published').length
  const pendingCount = cards.filter((c) => c.status !== 'published').length
  const uncommittedCount = cards.filter((c) => !c.is_committed).length
  const atLimit = isUser && cards.length >= USER_CARD_LIMIT

  function toggle(filter: FilterKey) {
    setActiveFilter((prev) => (prev === filter ? 'all' : filter))
  }

  const filtered = cards.filter((c) => {
    if (activeFilter === 'published') return c.status === 'published'
    if (activeFilter === 'pending') return c.status !== 'published'
    return true
  })

  async function handleDelete(cardId: string) {
    if (!confirm('¿Eliminar esta ficha? Esta acción no se puede deshacer.')) return
    setDeleting(cardId)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, { method: 'DELETE' })
      const data = await res.json()
      console.log('[DELETE card]', cardId, res.status, data)
      if (res.ok) setCards((prev) => prev.filter((c) => c.id !== cardId))
    } finally {
      setDeleting(null)
    }
  }

  const pendingLabel = isUser ? 'Pendientes de revisión' : 'En borrador'

  return (
    <>
      {/* Stats */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Resumen</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            value={isUser ? `${cards.length}/${USER_CARD_LIMIT}` : cards.length}
            label="Fichas creadas"
            accent={isUser && atLimit ? 'text-ember' : 'text-ink'}
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          <StatCard
            value={publishedCount}
            label="Publicadas"
            accent={publishedCount > 0 ? 'text-moss' : 'text-ink'}
            active={activeFilter === 'published'}
            onClick={() => toggle('published')}
          />
          <StatCard
            value={pendingCount + uncommittedCount}
            label={pendingLabel}
            accent={pendingCount + uncommittedCount > 0 ? 'text-amber-600' : 'text-ink'}
            active={activeFilter === 'pending'}
            onClick={() => toggle('pending')}
          />
          <StatCard
            value={suggestionCount}
            label="Sugerencias enviadas"
            active={false}
            onClick={() => {}}
            clickable={false}
          />
        </div>
        {isUser && atLimit && (
          <p className="mt-3 text-sm text-ember">
            Has alcanzado el límite de {USER_CARD_LIMIT} fichas. Contacta con nosotros para ampliar tu acceso.
          </p>
        )}
      </section>

      {/* Invita a alguien */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Invita a alguien</h2>
        <InviteWidget initialCount={inviteCount} />
      </section>

      {/* Card table */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Mis fichas</h2>
        {cards.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
            Todavía no has creado ninguna ficha.{' '}
            <Link href={addHref} className="font-semibold text-ember hover:underline">
              Añadir una obra →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
            No hay fichas en esta categoría.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Obra</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Actualizada</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {filtered.map((card) => (
                  <tr key={card.id} className="transition hover:bg-ink/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-8 flex-shrink-0 overflow-hidden rounded">
                          {card.work.poster_url ? (
                            <Image src={card.work.poster_url} alt={card.work.title} fill sizes="32px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-ink/5 text-sm">📖</div>
                          )}
                        </div>
                        <span className="font-semibold text-ink">{card.work.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[card.work.type as keyof typeof TYPE_COLORS] ?? ''}`}>
                        {TYPE_LABELS[card.work.type as keyof typeof TYPE_LABELS] ?? card.work.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/50 hidden md:table-cell">{formatDate(card.updated_at)}</td>
                    <td className="px-4 py-3">
                      {!card.is_committed ? (
                        <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-orange-100 text-orange-700">Sin confirmar</span>
                      ) : card.status === 'published' ? (
                        <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-moss/10 text-moss">Publicada</span>
                      ) : isUser ? (
                        <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-700">Pendiente de revisión</span>
                      ) : (
                        <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-ink/10 text-ink/50">Borrador</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!card.is_committed && (
                          <Link
                            href={`/admin/ficha/${card.id}`}
                            className="text-xs font-semibold text-orange-600 underline underline-offset-2 hover:text-orange-800"
                          >
                            Continuar →
                          </Link>
                        )}
                        {card.is_committed && card.status === 'published' && (
                          <Link
                            href={`/ficha/${card.work.slug}`}
                            className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink"
                          >
                            Ver
                          </Link>
                        )}
                        {card.is_committed && isPrivileged && (
                          <Link
                            href={`/admin/ficha/${card.id}`}
                            className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink"
                          >
                            Editar
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
