'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const KEY = 'spoilering_community_callout_dismissed'

export function CommunityCallout() {
  const t = useTranslations('CommunityCallout')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mx-auto mt-8 max-w-4xl px-4">
      <div className="relative rounded-2xl border border-plum/25 bg-plum/[0.04] p-5 sm:p-6">
        <button
          onClick={dismiss}
          aria-label={t('dismissAria')}
          className="absolute right-3 top-3 text-ink/35 transition hover:text-ink/70"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-plum/15 text-xl">
            ✏️
          </div>
          <div className="flex-1 pr-6 sm:pr-0">
            <p className="text-[15px] font-bold text-ink">{t('title')}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink/65">
              {t('body')}{' '}
              <span className="font-semibold text-ink/80">{t('addItYourself')}</span>{t('bodyTail')}
            </p>
            <Link
              href="/faq"
              className="mt-2 inline-block text-xs font-semibold text-plum hover:underline"
            >
              {t('howItWorks')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
