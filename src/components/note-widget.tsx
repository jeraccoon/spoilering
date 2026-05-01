'use client'

import { useState, useEffect, useRef } from 'react'

interface Note {
  id: string
  content: string
  updated_at: string
}

export function NoteWidget({ cardId }: { cardId: string }) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const savedDraft = useRef('')

  useEffect(() => {
    fetch(`/api/notes?card_id=${cardId}`)
      .then((r) => r.json())
      .then(({ note }) => {
        setNote(note)
        setLoading(false)
        if (!note) setEditing(true)
      })
  }, [cardId])

  async function save(content: string) {
    if (!content.trim()) return
    setSaving(true)
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: cardId, content }),
    })
    const { note: saved } = await res.json()
    setNote(saved)
    setEditing(false)
    setSaving(false)
    savedDraft.current = content
  }

  async function deleteNote() {
    await fetch(`/api/notes?card_id=${cardId}`, { method: 'DELETE' })
    setNote(null)
    setDraft('')
    savedDraft.current = ''
    setEditing(true)
  }

  function startEdit() {
    const current = note?.content ?? ''
    setDraft(current)
    savedDraft.current = current
    setEditing(true)
  }

  function handleBlur() {
    if (draft.trim() && draft !== savedDraft.current) {
      save(draft)
    }
  }

  if (loading) return null

  return (
    <div className="mt-10 max-w-2xl rounded-lg border border-moss/20 bg-moss/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base" aria-hidden>🔒</span>
        <h3 className="text-sm font-semibold text-ink/70">Mis notas</h3>
        <span className="text-xs text-ink/55">(solo tú puedes ver esto)</span>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            placeholder="Añade una nota personal sobre esta obra... ¿Cuándo la viste? ¿Con quién? ¿Qué te pareció?"
            rows={4}
            autoFocus={!note}
            className="w-full resize-none rounded-md border border-moss/20 bg-paper px-3 py-2.5 text-sm leading-relaxed text-ink/80 placeholder:text-ink/45 focus:border-moss/40 focus:outline-none focus:ring-1 focus:ring-moss/20"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => save(draft)}
              disabled={!draft.trim() || saving}
              className="rounded-md bg-moss px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-moss/90 disabled:opacity-40"
            >
              {saving ? 'Guardando…' : 'Guardar nota'}
            </button>
            {note && (
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-ink/55 transition hover:text-ink/70"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/70">{note?.content}</p>
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={startEdit}
              className="text-xs font-semibold text-moss/70 underline underline-offset-2 transition hover:text-moss"
            >
              Editar
            </button>
            <button
              onClick={deleteNote}
              className="text-xs text-ink/45 underline underline-offset-2 transition hover:text-ember"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
