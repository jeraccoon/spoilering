'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

export function SuggestionActions({ id }: { id: string }) {
  const t = useTranslations('Admin.suggestions')
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch(`/api/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    router.refresh()
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => handleAction('approve')}
        disabled={loading !== null}
        className="rounded-lg bg-moss/10 px-3 py-1.5 text-xs font-semibold text-moss transition hover:bg-moss/20 disabled:opacity-50"
      >
        {loading === 'approve' ? '…' : t('approve')}
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
        className="rounded-lg bg-ember/10 px-3 py-1.5 text-xs font-semibold text-ember transition hover:bg-ember/20 disabled:opacity-50"
      >
        {loading === 'reject' ? '…' : t('reject')}
      </button>
    </div>
  )
}
