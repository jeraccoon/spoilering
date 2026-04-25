'use client'

import { useState } from 'react'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  movie: 'Película', series: 'Serie', book: 'Libro',
}

interface InactiveDraft {
  id: string
  updated_at: string
  work: { title: string; type: string } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function InactiveDraftsSection({ initialDrafts }: { initialDrafts: InactiveDraft[] }) {
  const [drafts, setDrafts] = useState<InactiveDraft[]>(initialDrafts)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(cardId: string) {
    setDeleting(cardId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al eliminar')
        return
      }
      setDrafts((prev) => prev.filter((d) => d.id !== cardId))
    } catch {
      setError('Error inesperado al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  if (drafts.length === 0) return null

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
              <th className="px-4 py-3 text-left font-semibold">Último cambio</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {drafts.map((draft) => (
              <tr key={draft.id} className="transition hover:bg-ink/5">
                <td className="px-4 py-3 font-semibold text-ink">
                  <span>{draft.work?.title ?? '—'}</span>
                  <span className="ml-2 rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-ink/50">Inactivo</span>
                </td>
                <td className="px-4 py-3 text-ink/50">
                  {TYPE_LABELS[draft.work?.type ?? ''] ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink/50">{formatDate(draft.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/ficha/${draft.id}`}
                      className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      disabled={deleting === draft.id}
                      className="text-xs font-semibold text-ink/30 transition hover:text-ember disabled:opacity-40"
                    >
                      {deleting === draft.id ? '…' : 'Eliminar'}
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
