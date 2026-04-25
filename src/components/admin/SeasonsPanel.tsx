'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Episode {
  id: string
  episode_number: number
  name: string | null
  overview: string | null
  air_date: string | null
  runtime: number | null
  card_id: string | null
}

interface Season {
  id: string
  season_number: number
  name: string | null
  episode_count: number
  episodes: Episode[]
}

interface Props {
  workId: string
  workType: string
}

export function SeasonsPanel({ workId, workType }: Props) {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [openSeasons, setOpenSeasons] = useState<Set<string>>(new Set())
  const [creatingCard, setCreatingCard] = useState<string | null>(null)

  const loadSeasons = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/works/${workId}/seasons`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar temporadas')
      setSeasons(data.seasons ?? [])
      if (data.seasons?.length > 0) {
        setOpenSeasons(new Set([data.seasons[0].id]))
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [workId])

  useEffect(() => {
    if (workType === 'series') loadSeasons()
  }, [workType, loadSeasons])

  async function handleImport() {
    setImporting(true)
    setImportMsg(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/works/${workId}/fetch-seasons`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al importar')
      setImportMsg(`${data.seasons} temporadas, ${data.episodes} episodios actualizados`)
      await loadSeasons()
      setTimeout(() => setImportMsg(null), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImporting(false)
    }
  }

  async function handleCreateCard(episodeId: string) {
    setCreatingCard(episodeId)
    try {
      const res = await fetch(`/api/admin/episodes/${episodeId}/card`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear ficha')
      await loadSeasons()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreatingCard(null)
    }
  }

  function toggleSeason(id: string) {
    setOpenSeasons((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (workType !== 'series') return null

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
          Temporadas y episodios
        </h2>
        {seasons.length > 0 && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/40 hover:text-ink disabled:opacity-40"
          >
            {importing ? 'Comprobando…' : '↻ Comprobar nuevas temporadas'}
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-ember/20 bg-ember/5 px-4 py-2.5 text-sm text-ember">
          {error}
        </p>
      )}
      {importMsg && (
        <p className="mb-4 rounded-lg border border-moss/20 bg-moss/5 px-4 py-2.5 text-sm text-moss">
          ✓ {importMsg}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-ink/40">
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-ink/20" />
          Cargando temporadas…
        </div>
      ) : seasons.length === 0 ? (
        <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center">
          <p className="mb-4 text-sm text-ink/50">No hay temporadas importadas todavía.</p>
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
          >
            {importing ? 'Importando…' : 'Importar temporadas desde TMDb'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {seasons.map((season) => {
            const isOpen = openSeasons.has(season.id)
            return (
              <div
                key={season.id}
                className="overflow-hidden rounded-lg border border-ink/10 bg-paper"
              >
                {/* Cabecera de temporada */}
                <button
                  onClick={() => toggleSeason(season.id)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-ink/5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs text-ink/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    >
                      ▼
                    </span>
                    <span className="font-semibold text-ink">
                      {season.name ?? `Temporada ${season.season_number}`}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-ink/40">
                    {season.episodes.length} episodio{season.episodes.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {/* Lista de episodios */}
                {isOpen && (
                  <div className="border-t border-ink/10">
                    {season.episodes.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-ink/40">Sin episodios</p>
                    ) : (
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-ink/5">
                          {season.episodes.map((ep) => (
                            <tr key={ep.id} className="transition hover:bg-ink/[0.03]">
                              <td className="w-12 px-4 py-2.5 text-right text-xs font-mono text-ink/30">
                                {ep.episode_number}
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="font-medium text-ink leading-snug">
                                  {ep.name ?? `Episodio ${ep.episode_number}`}
                                </p>
                                {ep.air_date && (
                                  <p className="mt-0.5 text-xs text-ink/40">
                                    {new Date(ep.air_date).toLocaleDateString('es-ES', {
                                      day: 'numeric', month: 'short', year: 'numeric',
                                    })}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                {ep.card_id ? (
                                  <Link
                                    href={`/admin/ficha/${ep.card_id}`}
                                    className="rounded-md border border-moss/30 bg-moss/5 px-2.5 py-1 text-xs font-semibold text-moss transition hover:bg-moss/10"
                                  >
                                    Ver ficha
                                  </Link>
                                ) : (
                                  <button
                                    onClick={() => handleCreateCard(ep.id)}
                                    disabled={creatingCard === ep.id}
                                    className="rounded-md border border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink/50 transition hover:border-ember/40 hover:text-ember disabled:opacity-40"
                                  >
                                    {creatingCard === ep.id ? '…' : '+ Crear ficha'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
