'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface Question {
  q: string
  a: string
}

interface Section {
  title: string
  questions: Question[]
}

function AccordionItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-ink/10 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-0 py-4 text-left"
      >
        <span className="font-semibold text-ink">{q}</span>
        <span
          className={`flex-shrink-0 text-ink/55 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-sm leading-relaxed text-ink/70">{a}</p>
      </div>
    </div>
  )
}

export default function FaqClient() {
  const t = useTranslations('FaqPage')
  const sections = t.raw('sections') as Section[]
  const [openKey, setOpenKey] = useState<string | null>(null)

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Cabecera */}
      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl font-black tracking-tight text-ink sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-base text-ink/50">{t('subtitle')}</p>
      </div>

      {/* Secciones */}
      <div className="flex flex-col gap-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/55">
              {section.title}
            </h2>
            <div className="rounded-lg border border-ink/10 bg-paper px-5 shadow-sm">
              {section.questions.map((item) => {
                const key = `${section.title}::${item.q}`
                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    isOpen={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Contacto */}
      <div className="mt-12 rounded-lg border border-ink/10 bg-ink/[0.02] px-6 py-5 text-center">
        <p className="text-sm text-ink/60">
          {t('moreQuestions')}{' '}
          <Link
            href="mailto:spoilering@outlook.com"
            className="font-semibold text-ember hover:underline"
          >
            {t('writeUs')}
          </Link>
        </p>
      </div>
    </div>
  )
}
