'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Section {
  id: string
  label: string
  short_label: string | null
  content: string
  order_index: number
}

export interface EpisodeCard {
  id: string
  status: string
  sections: Section[]
}

export interface Episode {
  id: string
  episode_number: number
  name: string | null
  air_date: string | null
  runtime: number | null
  card: EpisodeCard | null
}

interface Props {
  episode: Episode
  role: string | null
  isLoggedIn: boolean
  isOpen: boolean
  onToggle: () => void
  initialWatched?: boolean
}

function formatAirDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function EpisodeRow({ episode, role, isLoggedIn, isOpen, onToggle, initialWatched = false }: Props) {
  const publishedCard = episode.card?.status === 'published' ? episode.card : null
  const isPrivileged = role === 'admin' || role === 'editor'
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [watched, setWatched] = useState(initialWatched)
  const [savingWatched, setSavingWatched] = useState(false)

  const sections = publishedCard?.sections ?? []
  const activeSectionId = activeSection ?? sections[0]?.id ?? null
  const activeSectionData = sections.find((s) => s.id === activeSectionId) ?? null

  async function toggleEpisodeWatched(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isLoggedIn) return
    const next = !watched
    setWatched(next)
    setSavingWatched(true)
    await fetch('/api/user-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episode_id: episode.id, watched: next }),
    })
    setSavingWatched(false)
  }

  async function handleCreateCard() {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch(`/api/admin/episodes/${episode.id}/card`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.cardId) {
        router.push(`/admin/ficha/${data.cardId}`)
      } else {
        setCreateError(data.error ?? 'Error al crear ficha')
      }
    } catch {
      setCreateError('Error de red')
    } finally {
      setCreating(false)
    }
  }

  if (publishedCard) {
    return (
      <div>
        <div className="flex w-full items-start gap-3 px-4 py-3">
          {/* Watched toggle */}
          {isLoggedIn && (
            <button
              onClick={toggleEpisodeWatched}
              disabled={savingWatched}
              title={watched ? 'Marcar como no visto' : 'Marcar como visto'}
              className={`mt-0.5 shrink-0 text-sm transition ${watched ? 'text-moss' : 'text-ink/20 hover:text-ink/50'}`}
            >
              {watched ? '✓' : '○'}
            </button>
          )}
          <button
            onClick={onToggle}
            className="flex flex-1 items-start gap-3 text-left"
          >
            <span className="w-8 shrink-0 pt-0.5 text-right text-xs font-mono text-ink/30">
              {episode.episode_number}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug text-ink">
                {episode.name ?? `Episodio ${episode.episode_number}`}
              </p>
              {episode.air_date && (
                <p className="mt-0.5 text-xs text-ink/40">{formatAirDate(episode.air_date)}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-moss/10 px-2.5 py-0.5 text-[11px] font-semibold text-moss">
              {isOpen ? 'Cerrar ▲' : 'Ver ficha ▼'}
            </span>
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-ink/5 bg-ink/[0.02] px-4 py-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-ember/70">
              ⚠ Contiene spoilers
            </p>

            {sections.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      activeSectionId === s.id
                        ? 'bg-ember text-white'
                        : 'border border-ink/15 text-ink/50 hover:border-ink/30 hover:text-ink'
                    }`}
                  >
                    {s.short_label ?? s.label}
                  </button>
                ))}
              </div>
            )}

            {activeSectionData ? (
              <div className="max-w-2xl">
                {sections.length > 1 && (
                  <h3 className="mb-3 text-sm font-semibold text-ink">{activeSectionData.label}</h3>
                )}
                {activeSectionData.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p
                          className="mb-3 text-sm leading-7 text-ink/80"
                          style={{ textAlign: 'justify', hyphens: 'auto', WebkitHyphens: 'auto' }}
                        >
                          {children}
                        </p>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-2 mt-5 text-sm font-semibold text-ink">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-1.5 mt-4 text-sm font-semibold text-ink">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-3 space-y-1 pl-4 text-sm text-ink/80 [list-style:disc]">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-3 space-y-1 pl-4 text-sm text-ink/80 [list-style:decimal]">{children}</ol>
                      ),
                      li: ({ children }) => <li className="leading-7">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-ink">{children}</strong>
                      ),
                      hr: () => <hr className="my-4 border-ink/10" />,
                    }}
                  >
                    {activeSectionData.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm text-ink/30">Esta sección no tiene contenido todavía.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink/30">Sin contenido disponible.</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // No published card
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {isLoggedIn && (
        <button
          onClick={toggleEpisodeWatched}
          disabled={savingWatched}
          title={watched ? 'Marcar como no visto' : 'Marcar como visto'}
          className={`mt-0.5 shrink-0 text-sm transition ${watched ? 'text-moss' : 'text-ink/15 hover:text-ink/40'}`}
        >
          {watched ? '✓' : '○'}
        </button>
      )}
      <span className="w-8 shrink-0 pt-0.5 text-right text-xs font-mono text-ink/25">
        {episode.episode_number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug text-ink/50">
          {episode.name ?? `Episodio ${episode.episode_number}`}
        </p>
        {episode.air_date && (
          <p className="mt-0.5 text-xs text-ink/30">{formatAirDate(episode.air_date)}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        {isPrivileged ? (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleCreateCard}
              disabled={creating}
              className="rounded-md border border-ink/15 px-2.5 py-1 text-[11px] font-semibold text-ink/40 transition hover:border-ember/40 hover:text-ember disabled:opacity-40"
            >
              {creating ? '…' : '+ Crear ficha'}
            </button>
            {createError && <p className="text-[10px] text-ember">{createError}</p>}
          </div>
        ) : isLoggedIn ? (
          <span className="text-[11px] text-ink/30">
            Sin ficha ·{' '}
            <Link href="/perfil" className="underline underline-offset-2 hover:text-ember">
              ¿Contribuir?
            </Link>
          </span>
        ) : (
          <Link
            href="/registro"
            className="text-[11px] text-ink/30 underline underline-offset-2 hover:text-ember"
          >
            Regístrate para contribuir
          </Link>
        )}
      </div>
    </div>
  )
}
