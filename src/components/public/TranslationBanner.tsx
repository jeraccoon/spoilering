'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface Props {
  originalLocale: string
  slug: string
}

export function TranslationBanner({ originalLocale, slug }: Props) {
  const t = useTranslations('TranslationBanner')
  const tLanguages = useTranslations('TranslationBanner.languages')

  // Fall back to the raw locale code if we don't have a friendly name.
  let originalLanguage = originalLocale
  try {
    originalLanguage = tLanguages(originalLocale)
  } catch {
    /* keep code */
  }

  return (
    <div className="border-b border-plum/15 bg-plum/[0.04] px-4 py-2.5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-xs text-ink/65">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-plum/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-plum">
            {t('label')}
          </span>
          <span>{t('explain', { originalLanguage })}</span>
        </div>
        <Link
          href={`/ficha/${slug}`}
          locale={originalLocale}
          className="font-semibold text-plum transition hover:underline"
        >
          {t('viewOriginal')}
        </Link>
      </div>
    </div>
  )
}
