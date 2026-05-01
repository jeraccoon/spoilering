'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SpoilerGate } from '@/components/spoiler-gate'
import { SuggestionModal } from '@/components/suggestion-modal'
import type { SectionWithChildren } from '@/types/database'

interface Props {
  sections: SectionWithChildren[]
  summary: string | null
  isLoggedIn: boolean
  slug: string
  cardId: string
}

const mdComponents = {
  p: ({ children }: any) => (
    <p className="mb-4 text-[17px] leading-8 text-ink/80 sm:text-justify" style={{ hyphens: 'auto', WebkitHyphens: 'auto' }}>
      {children}
    </p>
  ),
  h1: ({ children }: any) => <h1 className="mb-3 mt-8 text-xl font-bold text-ink">{children}</h1>,
  h2: ({ children }: any) => <h2 className="mb-3 mt-7 text-lg font-semibold text-ink">{children}</h2>,
  h3: ({ children }: any) => <h3 className="mb-2 mt-5 text-base font-semibold text-ink">{children}</h3>,
  ul: ({ children }: any) => <ul className="mb-4 space-y-1.5 pl-5 text-ink/80 [list-style:disc]">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-4 space-y-1.5 pl-5 text-ink/80 [list-style:decimal]">{children}</ol>,
  li: ({ children }: any) => <li className="text-[17px] leading-8">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-ink/70">{children}</em>,
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ember underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-4 border-l-2 border-ember pl-4 italic text-ink/60">{children}</blockquote>
  ),
  code: ({ children, className }: any) => {
    if (className?.includes('language-')) return <code className={className}>{children}</code>
    return <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[0.85em] text-ink/80">{children}</code>
  },
  pre: ({ children }: any) => (
    <pre className="my-4 overflow-x-auto rounded-lg bg-ink/5 p-4 font-mono text-sm text-ink/80">{children}</pre>
  ),
  hr: () => <hr className="my-6 border-ink/10" />,
}

export function CardContent({ sections, summary, isLoggedIn, slug }: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(sections[0] ? [sections[0].id] : [])
  )

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <SpoilerGate slug={slug}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {summary && (
          <div className="mb-8 rounded-2xl border border-ember/20 bg-ember/[0.04] p-5 sm:p-6">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-ember/80">
              Resumen rápido
            </p>
            <p className="text-[16px] leading-relaxed text-ink/85 sm:text-[17px]">
              {summary}
            </p>
          </div>
        )}
        {sections.length === 0 ? (
          <p className="text-ink/45">Esta ficha todavía no tiene contenido.</p>
        ) : (
          <div className="space-y-2">
            {sections.map((section) => {
              const isOpen = openIds.has(section.id)
              return (
                <div key={section.id} className="overflow-hidden rounded-xl border border-ink/10">
                  {/* Cabecera */}
                  <button
                    onClick={() => toggleOpen(section.id)}
                    className="flex w-full items-center gap-3 bg-ink/[0.03] px-5 py-4 text-left transition hover:bg-ink/[0.06]"
                  >
                    <span
                      className="shrink-0 text-[10px] text-ink/55 transition-transform duration-150"
                      style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none' }}
                    >
                      ▶
                    </span>
                    <span className="font-bold text-ink">{section.label}</span>
                  </button>

                  {/* Cuerpo */}
                  {isOpen && (
                    <div className="px-5 pb-6 pt-2">
                      {section.content ? (
                        <div>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                            {section.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-ink/45">Esta sección todavía no tiene contenido.</p>
                      )}

                      {isLoggedIn && (
                        <div className="mt-8">
                          <SuggestionModal
                            sectionId={section.id}
                            sectionLabel={section.label}
                            originalContent={section.content ?? ''}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </SpoilerGate>
  )
}
