'use client'

import { useState } from 'react'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  movie: 'Película', series: 'Serie', book: 'Libro',
}

interface DraftCard {
  id: string
  created_at: string
  work: { title: string; type: string; slug: string } | null
  creator: { username: string; role: string } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function DraftCardsSection({ initialCards }: { initialCards: DraftCard[] }) {
  const [cards, setCards] = useState<DraftCard[]>(initialCards)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(cardId: string) {
    if (!confirm('¿Eliminar esta ficha? Esta acción no se puede deshacer.')) return
    setDeleting(cardId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al eliminar')
        return
      }
      setCards((prev) => prev.filter((c) => c.id !== cardId))
    } catch {
      setError('Error inesperado al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
        No hay fichas en borrador.
      </div>
    )
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-ember/30 bg-ember/5 px-4 py-2.5 text-sm text-ember">{error}</p>
      )}
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
            {cards.map((card) => (
              <tr key={card.id} className="transition hover:bg-ink/5">
                <td className="px-4 py-3 font-semibold text-ink">
                  <span>{card.work?.title ?? '—'}</span>
                </td>
                <td className="px-4 py-3 text-ink/50">
                  {TYPE_LABELS[card.work?.type ?? ''] ?? '—'}
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
    </div>
  )
}
