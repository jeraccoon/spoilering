'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const TYPE_LABELS: Record<string, string> = {
  movie: 'Película', series: 'Serie', book: 'Libro',
}

interface Work {
  id: string
  title: string
  type: string
  year: number | null
  poster_url: string | null
  overview: string | null
  genres: string[] | null
}

export function NuevaFichaEditor({ work }: { work: Work }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/works/${work.id}/card`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data.cardId) {
          router.push(`/admin/ficha/${data.cardId}`)
          return
        }
        setError(data.error ?? 'Error al crear la ficha')
        setSaving(false)
        return
      }
      router.push(data.redirectTo ?? `/admin/ficha/${data.cardId}`)
    } catch {
      setError('Error inesperado. Inténtalo de nuevo.')
      setSaving(false)
    }
  }

  async function handleDiscard() {
    setDiscarding(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/works/${work.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al descartar')
        setDiscarding(false)
        return
      }
      router.push('/admin/nueva-obra')
    } catch {
      setError('Error inesperado. Inténtalo de nuevo.')
      setDiscarding(false)
    }
  }

  const isIncomplete = !work.poster_url || !work.overview || !work.genres?.length

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-2 text-sm text-ink/55">
        <a href="/admin" className="hover:text-ink">Admin</a>
        <span className="mx-1.5">/</span>
        <a href="/admin/nueva-obra" className="hover:text-ink">Nueva obra</a>
        <span className="mx-1.5">/</span>
        <span>Confirmar</span>
      </div>

      <h1 className="mb-6 text-2xl font-black tracking-tight text-ink">Guardar borrador</h1>

      <div className="mb-8 flex gap-5 rounded-xl border border-ink/10 bg-paper p-5 shadow-sm">
        {work.poster_url && (
          <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg">
            <Image src={work.poster_url} alt={work.title} fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/50">
              {TYPE_LABELS[work.type] ?? work.type}
            </span>
            {work.year && (
              <span className="text-xs text-ink/55">{work.year}</span>
            )}
          </div>
          <h2 className="text-xl font-bold text-ink">{work.title}</h2>
          {work.genres && work.genres.length > 0 && (
            <p className="mt-1 text-xs text-ink/50">{work.genres.join(', ')}</p>
          )}
          {work.overview && (
            <p className="mt-2 line-clamp-3 text-sm text-ink/60">{work.overview}</p>
          )}
          {isIncomplete && (
            <p className="mt-3 text-xs text-amber-600">
              Esta obra tiene datos incompletos (sin póster, sinopsis o géneros). La ficha quedará marcada como incompleta.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-5 rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || discarding}
          className="rounded-lg bg-ember px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar borrador'}
        </button>
        <button
          onClick={handleDiscard}
          disabled={saving || discarding}
          className="rounded-lg border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-ink/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {discarding ? 'Descartando…' : 'Descartar obra'}
        </button>
        <a
          href="/admin/nueva-obra"
          className="text-sm font-semibold text-ink/55 hover:text-ink"
        >
          Cancelar
        </a>
      </div>
      <p className="mt-3 text-xs text-ink/45">
        &quot;Descartar obra&quot; elimina permanentemente la obra recién creada sin guardar ninguna ficha.
      </p>
    </div>
  )
}
