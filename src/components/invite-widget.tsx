'use client'

import { useState } from 'react'

const MONTHLY_LIMIT = 5

export function InviteWidget({ initialCount }: { initialCount: number }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(initialCount)

  const remaining = MONTHLY_LIMIT - count
  const atLimit = remaining <= 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || atLimit) return
    setSending(true)
    setSuccess(null)
    setError(null)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar la invitación')
      } else {
        setSuccess(email)
        setEmail('')
        setCount((c) => c + 1)
      }
    } catch {
      setError('Error de red')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-paper">
      <div className="px-6 py-5">
        <p className="mb-1 text-sm text-ink/70">
          Invita a un amigo a Spoilering. Puedes enviar hasta {MONTHLY_LIMIT} invitaciones al mes.
        </p>
        <p className="mb-4 text-xs text-ink/55">
          {atLimit ? (
            <span className="text-ember">Has alcanzado el límite de este mes.</span>
          ) : (
            <span>
              <span className="font-semibold text-ink/60">{count} de {MONTHLY_LIMIT}</span> invitaciones usadas este mes
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSuccess(null); setError(null) }}
            placeholder="email@ejemplo.com"
            disabled={atLimit || sending}
            className="flex-1 rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/45 outline-none transition focus:border-moss/50 focus:ring-1 focus:ring-moss/20 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!email || atLimit || sending}
            className="shrink-0 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? 'Enviando…' : 'Enviar invitación'}
          </button>
        </form>

        {success && (
          <p className="mt-3 text-sm font-medium text-moss">
            Invitación enviada a {success}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-ember">{error}</p>
        )}
      </div>
    </div>
  )
}
