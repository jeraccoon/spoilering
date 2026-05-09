'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface DraftCard {
  id: string
  created_at: string
  work: { title: string; type: string; slug: string } | null
  creator: { username: string; role: string } | null
}

export function DraftCardsSection({ initialCards }: { initialCards: DraftCard[] }) {
  const t = useTranslations('Admin.draftCards')
  const tw = useTranslations('WorkType')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? 'en-US' : 'es-ES'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })

  const [cards, setCards] = useState<DraftCard[]>(initialCards)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(cardId: string) {
    if (!confirm(t('confirmDelete'))) return
    setDeleting(cardId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? t('errorDelete'))
        return
      }
      setCards((prev) => prev.filter((c) => c.id !== cardId))
    } catch {
      setError(t('errorUnexpected'))
    } finally {
      setDeleting(null)
    }
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/55">
        {t('empty')}
      </div>
    )
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-ember/30 bg-ember/5 px-4 py-2.5 text-sm text-ember">{error}</p>
      )}
      <div className="overflow-hidden rounded-lg border border-ink/10">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{t('tableWork')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('tableType')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('tableCreated')}</th>
              <th className="px-4 py-3 text-right font-semibold">{t('tableActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {cards.map((card) => {
              const type = card.work?.type
              const typeLabel = type === 'movie' || type === 'series' || type === 'book' ? tw(type) : '—'
              return (
                <tr key={card.id} className="transition hover:bg-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">
                    <span>{card.work?.title ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-ink/50">{typeLabel}</td>
                  <td className="px-4 py-3 text-ink/50">
                    {card.created_at ? formatDate(card.created_at) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/ficha/${card.id}`}
                        className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink"
                      >
                        {t('edit')}
                      </Link>
                      <Link
                        href={`/admin/fichas/${card.id}/publicar`}
                        className="rounded-md bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss transition hover:bg-moss/20"
                      >
                        {t('publish')}
                      </Link>
                      <button
                        onClick={() => handleDelete(card.id)}
                        disabled={deleting === card.id}
                        className="text-xs font-semibold text-ink/45 transition hover:text-ember disabled:opacity-40"
                      >
                        {deleting === card.id ? '…' : t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
