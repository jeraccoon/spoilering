'use client'

import { useState } from 'react'
import { EpisodeRow } from './EpisodeRow'
import type { Episode } from './EpisodeRow'

export interface Season {
  id: string
  season_number: number
  name: string | null
  episode_count: number
  episodes: Episode[]
}

interface Props {
  seasons: Season[]
  role: string | null
  isLoggedIn: boolean
  watchedEpisodeIds?: string[]
}

export function SeasonsAccordion({ seasons, role, isLoggedIn, watchedEpisodeIds = [] }: Props) {
  const watchedSet = new Set(watchedEpisodeIds)
  const [openSeasons, setOpenSeasons] = useState<Set<string>>(
    () => new Set(seasons.length > 0 ? [seasons[0].id] : [])
  )
  const [openEpisodeId, setOpenEpisodeId] = useState<string | null>(null)

  if (seasons.length === 0) return null

  function toggleSeason(id: string) {
    setOpenSeasons((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleEpisode(id: string) {
    setOpenEpisodeId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="border-t border-ink/10">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-ink/40">
          Temporadas y episodios
        </h2>
        <div className="flex flex-col gap-2">
          {seasons.map((season) => {
            const isOpen = openSeasons.has(season.id)
            return (
              <div key={season.id} className="overflow-hidden rounded-lg border border-ink/10 bg-paper">
                <button
                  onClick={() => toggleSeason(season.id)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-ink/5"
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

                {isOpen && (
                  <div className="divide-y divide-ink/5 border-t border-ink/10">
                    {season.episodes.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-ink/40">Sin episodios</p>
                    ) : (
                      season.episodes.map((ep) => (
                        <EpisodeRow
                          key={ep.id}
                          episode={ep}
                          role={role}
                          isLoggedIn={isLoggedIn}
                          isOpen={openEpisodeId === ep.id}
                          onToggle={() => toggleEpisode(ep.id)}
                          initialWatched={watchedSet.has(ep.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
