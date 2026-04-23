'use client'

import { useState } from 'react'

interface Props {
  sectionId: string
  sectionLabel: string
  originalContent: string
}

export function SuggestionModal({ sectionId, sectionLabel, originalContent }: Props) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (content.trim().length < 50) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: sectionId,
          original_content: originalContent,
          suggested_content: content.trim(),
          comment: comment.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); setSending(false); return }
      setSent(true)
    } catch {
      setError('Error de red')
      setSending(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setSent(false)
    setContent('')
    setComment('')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-8 flex items-center gap-1.5 rounded border border-moss px-3 py-1.5 text-sm font-semibold text-moss transition-colors hover:bg-moss/10"
      >
        <span>✏️</span>
        Sugerir corrección
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
            {sent ? (
              <div className="py-4 text-center">
                <p className="text-3xl">✅</p>
                <h3 className="mt-3 text-lg font-black text-ink">Sugerencia enviada</h3>
                <p className="mt-2 text-sm text-ink/50">
                  Gracias por contribuir. Un editor revisará tu propuesta.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-5 rounded-lg bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-ember/90"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h3 className="text-lg font-black text-ink">Sugerir corrección</h3>
                  <p className="mt-0.5 text-sm text-ink/50">
                    Sección: <span className="font-semibold text-ink">{sectionLabel}</span>
                  </p>
                  <p className="mt-2 text-sm text-ink/60">
                    ¿Qué está mal en esta sección? Escribe cómo debería quedar el texto corregido.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      Texto corregido <span className="font-normal text-ink/40">(mínimo 50 caracteres)</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      required
                      autoFocus
                      placeholder="Escribe aquí el texto correcto para esta sección…"
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
                    />
                    <p className={`mt-1 text-right text-xs tabular-nums ${content.length >= 50 ? 'text-moss' : 'text-ink/30'}`}>
                      {content.length} / 50 mínimo
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      Comentario <span className="font-normal text-ink/40">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={200}
                      placeholder="Ej: Falta mencionar el giro del capítulo 5"
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
                    />
                  </div>

                  {error && <p className="text-sm text-ember">{error}</p>}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={sending || content.trim().length < 50}
                      className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
                    >
                      {sending ? 'Enviando…' : 'Enviar sugerencia'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-sm font-semibold text-ink/50 hover:text-ink"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
