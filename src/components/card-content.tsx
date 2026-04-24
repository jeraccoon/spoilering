'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SpoilerGate } from '@/components/spoiler-gate'
import { SuggestionModal } from '@/components/suggestion-modal'
import type { SectionWithChildren } from '@/types/database'

interface Props {
  sections: SectionWithChildren[]
  isLoggedIn: boolean
  slug: string
}

export function CardContent({ sections, isLoggedIn, slug }: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]

  return (
    <SpoilerGate slug={slug}>
      {/* Mobile tabs */}
      <div className="sticky top-0 z-10 -mx-4 border-b border-ink/10 bg-paper sm:hidden">
        <div className="flex overflow-x-auto px-4 scrollbar-none">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeId === s.id
                  ? 'border-ember text-ember'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              {s.short_label ?? s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl gap-8 px-4 py-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-52 shrink-0 sm:block">
          <div className="sticky top-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Contenido</p>
            <nav className="flex flex-col">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                    activeId === s.id
                      ? 'border-ember font-semibold text-ember'
                      : 'border-transparent text-ink/55 hover:border-ink/20 hover:text-ink'
                  }`}
                >
                  {s.short_label ?? s.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Article */}
        <div className="min-w-0 flex-1">
          {activeSection ? (
            <article>
              <h2 className="mb-6 text-2xl font-bold text-ink">{activeSection.label}</h2>
              {activeSection.content ? (
                <div className="max-w-2xl">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p
                          className="mb-4 leading-7 text-ink/80"
                          style={{ textAlign: 'justify', hyphens: 'auto', WebkitHyphens: 'auto' }}
                        >
                          {children}
                        </p>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-3 mt-7 text-lg font-semibold text-ink">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-2 mt-5 text-base font-semibold text-ink">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 space-y-1.5 pl-5 text-ink/80 [list-style:disc]">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 space-y-1.5 pl-5 text-ink/80 [list-style:decimal]">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-7">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-ink">{children}</strong>
                      ),
                      hr: () => <hr className="my-6 border-ink/10" />,
                    }}
                  >
                    {activeSection.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-ink/30">Esta sección todavía no tiene contenido.</p>
              )}

              {isLoggedIn && (
                <div className="mt-8">
                  <SuggestionModal
                    sectionId={activeSection.id}
                    sectionLabel={activeSection.label}
                    originalContent={activeSection.content ?? ''}
                  />
                </div>
              )}
            </article>
          ) : (
            <p className="text-ink/30">Esta ficha todavía no tiene contenido.</p>
          )}
        </div>
      </div>
    </SpoilerGate>
  )
}
