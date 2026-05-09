'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface OrphanWork {
  id: string
  title: string
  type: string
  year: number | null
  created_at: string
}

export function OrphanWorksSection({ initialWorks }: { initialWorks: OrphanWork[] }) {
  const t = useTranslations('Admin.orphanWorks')
  const tw = useTranslations('WorkType')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? 'en-US' : 'es-ES'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })

  const [works, setWorks] = useState<OrphanWork[]>(initialWorks)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(workId: string) {
    setDeleting(workId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/works/${workId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? t('errorDelete'))
        return
      }
      setWorks((prev) => prev.filter((w) => w.id !== workId))
    } catch {
      setError(t('errorUnexpected'))
    } finally {
      setDeleting(null)
    }
  }

  if (works.length === 0) return null

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
            {works.map((work) => {
              const typeLabel = work.type === 'movie' || work.type === 'series' || work.type === 'book' ? tw(work.type) : '—'
              return (
                <tr key={work.id} className="transition hover:bg-ink/5">
                  <td className="px-4 py-3 font-semibold text-ink">{work.title}</td>
                  <td className="px-4 py-3 text-ink/50">{typeLabel}</td>
                  <td className="px-4 py-3 text-ink/50">{formatDate(work.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/nueva-ficha/${work.id}`}
                        className="rounded-md bg-ember/10 px-2.5 py-1 text-xs font-semibold text-ember transition hover:bg-ember/20"
                      >
                        {t('createCard')}
                      </Link>
                      <button
                        onClick={() => handleDelete(work.id)}
                        disabled={deleting === work.id}
                        className="text-xs font-semibold text-ink/45 transition hover:text-ember disabled:opacity-40"
                      >
                        {deleting === work.id ? '…' : t('delete')}
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
