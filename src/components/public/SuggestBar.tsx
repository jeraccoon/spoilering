'use client'

import Link from 'next/link'
import { SuggestionModal } from '@/components/suggestion-modal'

interface Section {
  id: string
  label: string
  content: string
}

interface Props {
  isLoggedIn: boolean
  slug: string
  firstSection: Section | null
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.583 1.457a.5.5 0 0 0 .652.652l1.457-.583a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474ZM4.75 3.5A2.25 2.25 0 0 0 2.5 5.75v5.5A2.25 2.25 0 0 0 4.75 13.5h5.5a2.25 2.25 0 0 0 2.25-2.25V9a.75.75 0 0 0-1.5 0v2.25a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75v-5.5a.75.75 0 0 1 .75-.75H7A.75.75 0 0 0 7 2H4.75Z" />
    </svg>
  )
}

export function SuggestBar({ isLoggedIn, slug, firstSection }: Props) {
  if (!firstSection) return null

  return (
    <div className="border-b border-ink/10 bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-end px-4 py-2.5">
        {isLoggedIn ? (
          <SuggestionModal
            sectionId={firstSection.id}
            sectionLabel={firstSection.label}
            originalContent={firstSection.content}
          />
        ) : (
          <Link
            href={`/login?redirect=/ficha/${slug}&mensaje=registro-sugerir`}
            className="flex items-center gap-1.5 rounded border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink/50 transition hover:border-moss hover:text-moss"
          >
            <PencilIcon />
            Sugerir corrección
          </Link>
        )}
      </div>
    </div>
  )
}
