'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function switchTo(target: string) {
    if (target === locale) return
    const qs = searchParams.toString()
    const href = qs ? `${pathname}?${qs}` : pathname
    startTransition(() => {
      router.replace(href, { locale: target as (typeof routing.locales)[number] })
    })
  }

  return (
    <div
      className="flex items-center rounded-full border border-ink/15 bg-ink/[0.03] p-0.5 text-[11px] font-bold uppercase tracking-wide"
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((loc) => {
        const isActive = loc === locale
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            disabled={isPending || isActive}
            aria-pressed={isActive}
            className={`rounded-full px-2 py-0.5 transition ${
              isActive
                ? 'bg-paper text-ink shadow-sm'
                : 'text-ink/45 hover:text-ink/70'
            }`}
          >
            {loc}
          </button>
        )
      })}
    </div>
  )
}
