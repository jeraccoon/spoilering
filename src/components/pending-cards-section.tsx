'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface PendingCard {
  id: string
  created_at: string
  is_complete: boolean
  is_committed?: boolean
  work: { title: string; type: string; slug: string } | null
  creator: { username: string; role: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  movie: 'Película', series: 'Serie', book: 'Libro',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function PendingCardsSection({ initialCards }: { initialCards: PendingCard[] }) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  const [loading, setLoading] = useState<string | null>(null)

  async function approve(id: string) {
    setLoading(id)
    try {
      await fetch(`/api/admin/cards/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })
      setCards((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setLoading(null)
    }
  }

  async function reject(id: string) {
    if (!confirm('¿Eliminar esta ficha? Esta acción no se puede deshacer.')) return
    setLoading(id)
    try {
      await fetch(`/api/admin/cards/${id}`, { method: 'DELETE' })
      setCards((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
        No hay fichas pendientes de revisión.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-amber-200">
      <table className="w-full text-sm">
        <thead className="border-b border-amber-200 bg-amber-50 text-xs text-amber-800">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Obra</th>
            <th className="px-4 py-3 text-left font-semibold">Tipo</th>
            <th className="px-4 py-3 text-left font-semibold">Usuario</th>
            <th className="px-4 py-3 text-left font-semibold">Fecha</th>
            <th className="px-4 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100 bg-paper">
          {cards.map((card) => (
            <tr key={card.id} className="transition hover:bg-amber-50/50">
              <td className="px-4 py-3 font-semibold text-ink">
                <Link href={`/ficha/${card.work?.slug}`} className="hover:text-ember hover:underline">
                  {card.work?.title ?? '—'}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink/50">
                {TYPE_LABELS[card.work?.type ?? ''] ?? '—'}
              </td>
              <td className="px-4 py-3 text-ink/60">
                {card.creator?.username ?? '—'}
              </td>
              <td className="px-4 py-3 text-ink/50">
                {card.created_at ? formatDate(card.created_at) : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => approve(card.id)}
                    disabled={loading === card.id}
                    className="rounded-md bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss transition hover:bg-moss/20 disabled:opacity-40"
                  >
                    {loading === card.id ? '…' : 'Aprobar'}
                  </button>
                  <button
                    onClick={() => reject(card.id)}
                    disabled={loading === card.id}
                    className="rounded-md bg-ember/10 px-2.5 py-1 text-xs font-semibold text-ember transition hover:bg-ember/20 disabled:opacity-40"
                  >
                    {loading === card.id ? '…' : 'Rechazar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
