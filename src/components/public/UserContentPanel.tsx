'use client'

import { useState, useRef } from 'react'

interface UserContentRecord {
  id: string
  watched: boolean
  watched_at: string | null
  notes: string | null
}

interface Props {
  workId: string
  initialRecord: UserContentRecord | null
}

export function UserContentPanel({ workId, initialRecord }: Props) {
  const [watched, setWatched] = useState(initialRecord?.watched ?? false)
  const [watchedAt, setWatchedAt] = useState(initialRecord?.watched_at ?? '')
  const [notes, setNotes] = useState(initialRecord?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function save(overrides: Partial<{ watched: boolean; watched_at: string; notes: string }> = {}) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/user-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_id: workId,
          watched: overrides.watched ?? watched,
          watched_at: overrides.watched_at !== undefined ? (overrides.watched_at || null) : (watchedAt || null),
          notes: overrides.notes !== undefined ? (overrides.notes || null) : (notes || null),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Error al guardar')
      } else {
        setSavedMsg(true)
        setTimeout(() => setSavedMsg(false), 2000)
      }
    } catch {
      setError('Error de red')
    } finally {
      setSaving(false)
    }
  }

  async function toggleWatched() {
    const next = !watched
    setWatched(next)
    if (!next) setWatchedAt('')
    await save({ watched: next, watched_at: next ? watchedAt : '' })
  }

  function handleDateChange(value: string) {
    setWatchedAt(value)
    if (dateTimer.current) clearTimeout(dateTimer.current)
    dateTimer.current = setTimeout(() => save({ watched_at: value }), 600)
  }

  function handleNotesChange(value: string) {
    setNotes(value)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => save({ notes: value }), 1200)
  }

  return (
    <div className="mt-5 rounded-xl border border-ink/10 bg-ink/[0.025] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Mi actividad</span>
          <span className="flex items-center gap-1 rounded-full border border-ink/15 px-2 py-0.5 text-[10px] text-ink/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-moss/70">
              <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5V4.5a2 2 0 1 0-4 0V6h4Z" clipRule="evenodd" />
            </svg>
            Solo tú
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {saving && <span className="text-ink/35">Guardando…</span>}
          {savedMsg && <span className="text-moss">✓ Guardado</span>}
          {error && <span className="text-ember">{error}</span>}
        </div>
      </div>

      {/* Watched toggle + date */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleWatched}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            watched
              ? 'bg-moss/15 text-moss hover:bg-moss/25'
              : 'border border-ink/20 text-ink/50 hover:border-ink/30 hover:text-ink'
          }`}
        >
          <span className="text-base leading-none">{watched ? '✓' : '○'}</span>
          {watched ? 'Visto' : 'Marcar como visto'}
        </button>

        {watched && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink/45">¿Cuándo?</label>
            <input
              type="date"
              value={watchedAt}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-md border border-ink/20 bg-paper px-2 py-1 text-xs text-ink/70 outline-none transition focus:border-moss/40"
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mt-3 rounded-lg border border-dashed border-ink/15 bg-paper p-2">
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Notas personales... ¿con quién lo viste? ¿qué te pareció?"
          rows={2}
          className="w-full resize-none bg-transparent px-1 py-1 text-sm leading-relaxed text-ink/75 placeholder:text-ink/25 outline-none"
        />
      </div>
    </div>
  )
}
