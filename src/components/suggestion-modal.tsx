'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  sectionId: string
  sectionLabel: string
  originalContent: string
}

export function SuggestionModal({ sectionId, sectionLabel, originalContent }: Props) {
  const t = useTranslations('SuggestionModal')
  const tCommon = useTranslations('Common')
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
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
    setContent('')
    setComment('')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded border border-moss px-3 py-1.5 text-sm font-semibold text-moss transition-colors hover:bg-moss/10"
      >
        <span>✏️</span>
        {t('trigger')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
            {sent ? (
              <div className="py-4 text-center">
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
                <div className="mb-5">
                  <h3 className="text-lg font-black text-ink">{t('title')}</h3>
                  <p className="mt-0.5 text-sm text-ink/50">
                    {t('section')} <span className="font-semibold text-ink">{sectionLabel}</span>
                  </p>
                  <p className="mt-2 text-sm text-ink/60">
                    {t('intro')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      {t('contentLabel')}
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      required
                      autoFocus
                      placeholder={t('contentPlaceholder')}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
                    />

                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      {t('commentLabel')} <span className="font-normal text-ink/55">{t('commentOptional')}</span>
                    </label>
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={200}
                      placeholder={t('commentPlaceholder')}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
                    />
                  </div>

                  {error && <p className="text-sm text-ember">{error}</p>}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={sending || !content.trim()}
                      className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
                    >
                      {sending ? t('submitting') : t('submit')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-sm font-semibold text-ink/50 hover:text-ink"
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
