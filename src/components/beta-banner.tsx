'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const TYPE_OPTIONS = [
  { value: 'suggestion', label: 'Sugerencia' },
  { value: 'bug', label: 'Error o bug' },
  { value: 'other', label: 'Otro' },
]

const SESSION_KEY = 'beta_banner_dismissed'

export function BetaBanner() {
  const [visible, setVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [type, setType] = useState('bug')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) setVisible(true)
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [modalOpen])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  function openModal() { setModalOpen(true) }

  function closeModal() {
    setModalOpen(false)
    setSent(false)
    setMessage('')
    setType('bug')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type, message }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); setSending(false); return }
      setSent(true)
    } catch {
      setError('Error de red')
      setSending(false)
    } finally {
      setSending(false)
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Banner */}
      <div className="relative z-30 bg-moss px-4 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="flex flex-1 items-center justify-center gap-3">
            <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
              Beta
            </span>
            <p className="text-sm text-white/90">
              Spoilering está en desarrollo activo.{' '}
              <span className="hidden sm:inline">¿Encuentras algo raro o tienes ideas? </span>
              <button
                onClick={openModal}
                className="font-semibold text-white underline underline-offset-2 hover:text-white/80"
              >
                ¡Cuéntanos, gracias! →
              </button>
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Cerrar aviso beta"
            className="shrink-0 text-white/50 transition hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal de feedback */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 px-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="w-full max-w-md rounded-t-2xl border border-ink/10 bg-paper p-6 shadow-xl sm:rounded-xl">
            {sent ? (
              <div className="py-6 text-center">
                <p className="text-3xl">✅</p>
                <h3 className="mt-3 text-lg font-black text-ink">¡Gracias!</h3>
                <p className="mt-2 text-sm text-ink/50">
                  Tu mensaje nos ayuda a mejorar Spoilering.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-5 rounded-lg bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-ember/90"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full bg-moss/15 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-moss">Beta</span>
                      <h3 className="text-lg font-black text-ink">Enviar comentarios</h3>
                    </div>
                    <p className="text-sm text-ink/50">Errores, ideas, lo que sea — lo leemos todo.</p>
                  </div>
                  <button onClick={closeModal} className="shrink-0 text-ink/30 hover:text-ink" aria-label="Cerrar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink/60">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-ember focus:ring-1 focus:ring-ember/20"
                    >
                      {TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink/60">
                      Email <span className="font-normal text-ink/35">(opcional, para que podamos responderte)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-1 focus:ring-ember/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink/60">Mensaje</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      autoFocus
                      placeholder="Cuéntanos qué ocurre o qué mejorarías…"
                      className="w-full resize-none rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-1 focus:ring-ember/20"
                    />
                  </div>

                  {error && <p className="text-sm text-ember">{error}</p>}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
                    >
                      {sending ? 'Enviando…' : 'Enviar'}
                    </button>
                    <button type="button" onClick={closeModal} className="text-sm font-semibold text-ink/40 hover:text-ink">
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
