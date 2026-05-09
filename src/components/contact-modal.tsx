'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export function ContactModal() {
  const t = useTranslations('ContactModal')
  const tBeta = useTranslations('BetaBanner')
  const tCommon = useTranslations('Common')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState('suggestion')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const TYPE_OPTIONS = [
    { value: 'suggestion', label: tBeta('types.suggestion') },
    { value: 'bug', label: tBeta('types.bug') },
    { value: 'other', label: tBeta('types.other') },
  ]

  useEffect(() => {
    if (!open) return
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, type, message }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? tCommon('sendError')); setSending(false); return }
      setSent(true)
    } catch {
      setError(tCommon('networkError'))
      setSending(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setSent(false)
    setName('')
    setMessage('')
    setType('suggestion')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="transition hover:text-paper/70"
      >
        {t('trigger')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 px-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="w-full max-w-md rounded-t-2xl border border-ink/10 bg-paper p-6 shadow-xl sm:rounded-xl">
            {sent ? (
              <div className="py-6 text-center">
                <p className="text-3xl">✅</p>
                <h3 className="mt-3 text-lg font-black text-ink">{t('successTitle')}</h3>
                <p className="mt-2 text-sm text-ink/50">
                  {t('successBody')}
                </p>
                <button
                  onClick={handleClose}
                  className="mt-5 rounded-lg bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-ember/90"
                >
                  {tCommon('close')}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-ink">{t('title')}</h3>
                    <p className="mt-0.5 text-sm text-ink/50">{t('subtitle')}</p>
                  </div>
                  <button onClick={handleClose} className="shrink-0 text-ink/45 hover:text-ink" aria-label={t('closeAria')}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink/60">
                        {t('nameLabel')} <span className="font-normal text-ink/35">{t('nameOptional')}</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('namePlaceholder')}
                        className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-1 focus:ring-ember/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink/60">
                        {t('emailLabel')} <span className="font-normal text-ink/35">{t('emailOptional')}</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('emailPlaceholder')}
                        className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-1 focus:ring-ember/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink/60">{t('typeLabel')}</label>
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
                    <label className="mb-1 block text-xs font-semibold text-ink/60">{t('messageLabel')}</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      placeholder={t('messagePlaceholder')}
                      className="w-full resize-none rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-1 focus:ring-ember/20"
                    />
                  </div>

                  {error && <p className="text-sm text-ember">{error}</p>}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
                    >
                      {sending ? tCommon('sending') : tCommon('send')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-sm font-semibold text-ink/55 hover:text-ink"
                    >
                      {tCommon('cancel')}
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
