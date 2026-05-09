'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const MONTHLY_LIMIT = 5

export function InviteWidget({ initialCount }: { initialCount: number }) {
  const t = useTranslations('InviteWidget')
  const tCommon = useTranslations('Common')
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
        setError(data.error ?? t('errorSend'))
      } else {
        setSuccess(email)
        setEmail('')
        setCount((c) => c + 1)
      }
    } catch {
      setError(tCommon('networkError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-paper">
      <div className="px-6 py-5">
        <p className="mb-1 text-sm text-ink/70">
          {t('intro', { limit: MONTHLY_LIMIT })}
        </p>
        <p className="mb-4 text-xs text-ink/55">
          {atLimit ? (
            <span className="text-ember">{t('atLimit')}</span>
          ) : (
            <span>
              {t.rich('usage', {
                count,
                limit: MONTHLY_LIMIT,
                bold: (chunks) => <span className="font-semibold text-ink/60">{chunks}</span>,
              })}
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSuccess(null); setError(null) }}
            placeholder={t('emailPlaceholder')}
            disabled={atLimit || sending}
            className="flex-1 rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/45 outline-none transition focus:border-moss/50 focus:ring-1 focus:ring-moss/20 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!email || atLimit || sending}
            className="shrink-0 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? t('submitting') : t('submit')}
          </button>
        </form>

        {success && (
          <p className="mt-3 text-sm font-medium text-moss">
            {t('successTo', { email: success })}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-ember">{error}</p>
        )}
      </div>
    </div>
  )
}
