'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRouter } from '@/i18n/navigation'
import { SeasonsPanel } from '@/components/admin/SeasonsPanel'
import { UserContentPanel } from '@/components/public/UserContentPanel'

interface Section {
  id: string
  card_id: string
  parent_id: string | null
  order_index: number
  label: string
  short_label: string | null
  content: string
  is_published: boolean
  children: Section[]
}

interface Work {
  id: string
  title: string
  type: string
  year: number | null
  poster_url: string | null
  cast: string[] | null
  runtime: number | null
  imdb_id: string | null
  letterboxd_url: string | null
  goodreads_url: string | null
  filmaffinity_url: string | null
  tracktv_url: string | null
  country: string | null
}

interface Card {
  id: string
  status: string
  is_committed: boolean
  summary: string | null
  work: Work
  sections: Section[]
}

interface AddSectionModalProps {
  cardId: string
  parentId: string | null
  parentLabel?: string
  onClose: () => void
  onCreated: (section: Section) => void
}

function AddSectionModal({ cardId, parentId, parentLabel, onClose, onCreated }: AddSectionModalProps) {
  const t = useTranslations('Admin.editor')
  const [label, setLabel] = useState('')
  const [shortLabel, setShortLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId, parent_id: parentId, label: label.trim(), short_label: shortLabel.trim() || null, order_index: 999 }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSaving(false); return }
      onCreated({ ...data, children: [] })
    } catch {
      setError(t('unexpectedError'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-black text-ink">
          {parentLabel ? t('addSubsectionIn', { label: parentLabel }) : t('addSection')}
        </h3>
        <p className="mb-5 text-sm text-ink/50">
          {parentLabel ? t('subsectionHint') : t('sectionHint')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">{t('sectionNameLabel')}</label>
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder={t('sectionNamePlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">{t('shortNameLabel')}</label>
            <input
              type="text"
              value={shortLabel}
              onChange={(e) => setShortLabel(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder={t('shortNamePlaceholder')}
            />
          </div>
          {error && <p className="text-sm text-ember">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || !label.trim()}
              className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50">
              {saving ? t('creating') : t('createSection')}
            </button>
            <button type="button" onClick={onClose}
              className="text-sm font-semibold text-ink/50 hover:text-ink">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface UserContentRecord {
  id: string
  watched: boolean
  watched_at: string | null
  notes: string | null
}

export function FichaEditor({ card: initialCard, initialUserContent }: { card: Card; initialUserContent: UserContentRecord | null }) {
  const t = useTranslations('Admin.editor')
  const tw = useTranslations('WorkType')
  const router = useRouter()
  const [card, setCard] = useState(initialCard)
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(initialCard.sections[0] ? [initialCard.sections[0].id] : [])
  )
  const [editContent, setEditContent] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    function collect(sections: Section[]) {
      for (const s of sections) { map[s.id] = s.content; collect(s.children) }
    }
    collect(initialCard.sections)
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [showAiWarning, setShowAiWarning] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generatingSections, setGeneratingSections] = useState<Set<string>>(new Set())
  const [statusLoading, setStatusLoading] = useState(false)
  const [modal, setModal] = useState<{ parentId: string | null; parentLabel?: string } | null>(null)

  const [meta, setMeta] = useState({
    poster_url: initialCard.work.poster_url ?? '',
    cast: (initialCard.work.cast ?? []).join(', '),
    runtime: initialCard.work.runtime?.toString() ?? '',
    imdb_id: initialCard.work.imdb_id ?? '',
    letterboxd_url: initialCard.work.letterboxd_url ?? '',
    goodreads_url: initialCard.work.goodreads_url ?? '',
    filmaffinity_url: initialCard.work.filmaffinity_url ?? '',
    tracktv_url: initialCard.work.tracktv_url ?? '',
    country: initialCard.work.country ?? '',
    isbn: (initialCard.work as any).isbn ?? '',
    publisher: (initialCard.work as any).publisher ?? '',
    pages: (initialCard.work as any).pages?.toString() ?? '',
    saga: (initialCard.work as any).saga ?? '',
    saga_order: (initialCard.work as any).saga_order?.toString() ?? '',
  })
  const [savingMeta, setSavingMeta] = useState(false)
  const [savedMeta, setSavedMeta] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)

  const [committed, setCommitted] = useState(initialCard.is_committed)


  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allSections: Section[] = []
  ;(function collect(sections: Section[]) {
    for (const s of sections) { allSections.push(s); collect(s.children) }
  })(card.sections)

  async function saveContent(sectionId: string) {
    setSaving(sectionId)
    setSaveError(null)
    try {
      const res = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent[sectionId] ?? '' }),
      })
      if (!res.ok) throw new Error()
      setSavedId(sectionId)
      setTimeout(() => setSavedId((prev) => (prev === sectionId ? null : prev)), 2000)
    } catch {
      setSaveError(sectionId)
    } finally {
      setSaving(null)
    }
  }

  async function generateSection(section: Section) {
    setGeneratingSections((prev) => new Set([...prev, section.id]))
    setGenerateError(null)
    try {
      const res = await fetch(`/api/admin/sections/${section.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workTitle: card.work.title,
          workType: card.work.type,
          workYear: card.work.year,
          sectionLabel: section.label,
          parentLabel: null,
          existingContent: null,
        }),
      })
      const data = await res.json()
      if (res.ok && data.content) {
        setEditContent((prev) => ({ ...prev, [section.id]: data.content }))
        setOpenIds((prev) => new Set([...prev, section.id]))
        setShowAiWarning(true)
      } else if (!res.ok) {
        setGenerateError(data.error ?? t('generateError'))
      }
    } catch {
      setGenerateError(t('generateNetworkError'))
    } finally {
      setGeneratingSections((prev) => {
        const next = new Set(prev)
        next.delete(section.id)
        return next
      })
    }
  }

  async function generateAll() {
    const rootSections = card.sections
    if (rootSections.length === 0) return
    setGeneratingAll(true)
    setGenerateError(null)
    setGeneratingSections(new Set(rootSections.map((s) => s.id)))

    await Promise.all(
      rootSections.map(async (section) => {
        try {
          const res = await fetch(`/api/admin/sections/${section.id}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workTitle: card.work.title,
              workType: card.work.type,
              workYear: card.work.year,
              sectionLabel: section.label,
              parentLabel: null,
              existingContent: null,
            }),
          })
          const data = await res.json()
          if (res.ok && data.content) {
            setEditContent((prev) => ({ ...prev, [section.id]: data.content }))
            await fetch(`/api/admin/sections/${section.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: data.content }),
            })
          } else if (!res.ok) {
            setGenerateError(data.error ?? t('generateSectionError'))
          }
        } catch {
          setGenerateError(t('generateNetworkError'))
        } finally {
          setGeneratingSections((prev) => {
            const next = new Set(prev)
            next.delete(section.id)
            return next
          })
        }
      })
    )

    setGeneratingAll(false)
    setShowAiWarning(true)
  }

  async function toggleStatus() {
    setStatusLoading(true)
    const next = card.status === 'published' ? 'draft' : 'published'
    if (next === 'published') {
      await Promise.all(
        allSections.map((s) =>
          fetch(`/api/admin/sections/${s.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent[s.id] ?? '' }),
          })
        )
      )
    }
    const res = await fetch(`/api/admin/cards/${card.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setCard((c) => ({ ...c, status: next }))
      setCommitted(true)
    }
    setStatusLoading(false)
  }

  async function saveMeta() {
    setSavingMeta(true)
    setSavedMeta(false)
    setMetaError(null)
    try {
      const castArr = meta.cast.split(',').map((s) => s.trim()).filter(Boolean)
      const res = await fetch(`/api/admin/works/${card.work.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poster_url: meta.poster_url.trim() || null,
          cast: castArr,
          runtime: meta.runtime ? parseInt(meta.runtime) : null,
          imdb_id: meta.imdb_id.trim() || null,
          letterboxd_url: meta.letterboxd_url.trim() || null,
          goodreads_url: meta.goodreads_url.trim() || null,
          filmaffinity_url: meta.filmaffinity_url.trim() || null,
          tracktv_url: meta.tracktv_url.trim() || null,
          country: meta.country.trim() || null,
          isbn: meta.isbn.trim() || null,
          publisher: meta.publisher.trim() || null,
          pages: meta.pages ? parseInt(meta.pages) : null,
          saga: meta.saga.trim() || null,
          saga_order: meta.saga_order ? parseInt(meta.saga_order) : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setMetaError(d.error ?? t('metaSaveError'))
      } else {
        setSavedMeta(true)
        setTimeout(() => setSavedMeta(false), 2500)
      }
    } catch {
      setMetaError(t('metaNetworkError'))
    } finally {
      setSavingMeta(false)
    }
  }

  async function saveAsDraft() {
    setSavingMeta(true)
    await Promise.all(
      allSections.map((s) =>
        fetch(`/api/admin/sections/${s.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent[s.id] ?? '' }),
        })
      )
    )
    const res = await fetch(`/api/admin/cards/${card.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
    })
    if (res.ok) {
      setCommitted(true)
      setSavedMeta(true)
      setTimeout(() => setSavedMeta(false), 2500)
    }
    setSavingMeta(false)
  }

  async function deleteCard() {
    if (!confirm(t('confirmDelete'))) return
    const res = await fetch(`/api/admin/cards/${card.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/admin')
  }

  function onSectionCreated(newSection: Section, parentId: string | null) {
    setCard((prev) => {
      if (!parentId) {
        return { ...prev, sections: [...prev.sections, newSection] }
      }
      function insertChild(sections: Section[]): Section[] {
        return sections.map((s) =>
          s.id === parentId ? { ...s, children: [...s.children, newSection] } : { ...s, children: insertChild(s.children) }
        )
      }
      return { ...prev, sections: insertChild(prev.sections) }
    })
    setEditContent((prev) => ({ ...prev, [newSection.id]: '' }))
    setOpenIds((prev) => new Set([...prev, newSection.id]))
    setModal(null)
  }

  function renderSection(section: Section, depth: number = 0) {
    const isOpen = openIds.has(section.id)
    const content = editContent[section.id] ?? ''
    const wordCount = content.split(/\s+/).filter(Boolean).length
    const isGenerating = generatingSections.has(section.id)

    return (
      <div key={section.id} className={depth > 0 ? 'ml-6' : ''}>
        <div className="overflow-hidden rounded-xl border border-ink/10">
          {/* Cabecera */}
          <div className="flex items-center">
            <button
              onClick={() => toggleOpen(section.id)}
              className="flex flex-1 items-center gap-3 px-4 py-3 text-left transition hover:bg-ink/5"
            >
              <span
                className="shrink-0 text-[10px] text-ink/55 transition-transform duration-150"
                style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none' }}
              >
                ▶
              </span>
              <span className="flex-1 text-sm font-semibold text-ink">{section.label}</span>
              {isGenerating ? (
                <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-plum/60" />
              ) : wordCount > 0 ? (
                <span className="mr-1 text-xs text-ink/55">{t('wordCount', { count: wordCount })}</span>
              ) : null}
            </button>
            <div className="flex items-center gap-0.5 pr-3">
              <button
                onClick={() => void generateSection(section)}
                disabled={isGenerating}
                title={t('generateAria')}
                className="rounded px-1.5 py-1 text-xs font-semibold text-plum/50 transition hover:bg-plum/5 hover:text-plum disabled:opacity-40"
              >
                ✦
              </button>
              <button
                onClick={() => setModal({ parentId: section.id, parentLabel: section.label })}
                title={t('addSubsectionAria')}
                className="rounded px-1.5 py-1 text-sm font-semibold text-ink/45 transition hover:bg-ink/5 hover:text-ink/60"
              >
                +
              </button>
            </div>
          </div>

          {/* Cuerpo */}
          {isOpen && (
            <div className="border-t border-ink/10 px-4 pb-4 pt-3">
              <textarea
                value={content}
                onChange={(e) => setEditContent((prev) => ({ ...prev, [section.id]: e.target.value }))}
                onBlur={() => void saveContent(section.id)}
                rows={6}
                style={{ minHeight: '140px' }}
                placeholder={t('sectionPlaceholder')}
                className="w-full resize-y rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm leading-relaxed text-ink placeholder-ink/25 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
              <div className="mt-1.5 flex items-center justify-between text-xs text-ink/45">
                <span>{t('charsCount', { count: content.length })}</span>
                <span>
                  {saving === section.id && <span className="text-ink/55">{t('saving')}</span>}
                  {savedId === section.id && saving !== section.id && <span className="text-moss">{t('saved')}</span>}
                  {saveError === section.id && saving !== section.id && <span className="text-ember">{t('saveError')}</span>}
                </span>
                <span>{t('wordCount', { count: wordCount })}</span>
              </div>

              {section.children.length > 0 && (
                <div className="mt-4 space-y-2">
                  {section.children.map((child) => renderSection(child, depth + 1))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-start gap-5">
        {meta.poster_url && (
          <div className="relative hidden h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-ink/10 sm:block">
            <Image src={meta.poster_url} alt={card.work.title} fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ink/50">
              {card.work.type === 'movie' || card.work.type === 'series' || card.work.type === 'book'
                ? tw(card.work.type as 'movie' | 'series' | 'book')
                : card.work.type}
              {card.work.year && ` · ${card.work.year}`}
            </span>
            <button
              onClick={() => router.push('/admin')}
              className="shrink-0 text-sm font-semibold text-ink/55 hover:text-ink"
            >
              {t('backToAdmin')}
            </button>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink">{card.work.title}</h1>
        </div>
      </div>

      {!committed && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>⚠️</span>
          <span>
            {t.rich('uncommittedNotice', {
              strongDraft: (chunks) => <strong>{chunks}</strong>,
              strongPublish: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
        </div>
      )}

      {/* Barra de acciones */}
      <div className="mb-7 border-b border-ink/10 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {card.status === 'published' ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-moss">
              <span className="h-2 w-2 rounded-full bg-moss" />
              {t('published')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink/55">
              <span className="h-2 w-2 rounded-full bg-ink/30" />
              {t('draft')}
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={generateAll}
              disabled={generatingAll || card.sections.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-plum/30 bg-plum/5 px-3 py-1.5 text-xs font-semibold text-plum transition hover:bg-plum/10 disabled:opacity-50"
            >
              {generatingAll
                ? t('generatingProgress', { done: card.sections.length - generatingSections.size, total: card.sections.length })
                : t('generateAll')}
            </button>

            {card.status === 'draft' ? (
              <>
                <button
                  onClick={() => void saveAsDraft()}
                  disabled={savingMeta}
                  className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/40 hover:bg-ink/5 disabled:opacity-50"
                >
                  {savingMeta ? t('shortLoading') : t('saveDraft')}
                </button>
                <button
                  onClick={() => void toggleStatus()}
                  disabled={statusLoading}
                  className="rounded-lg bg-ember px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
                >
                  {statusLoading ? t('shortLoading') : t('publish')}
                </button>
              </>
            ) : (
              <button
                onClick={() => void toggleStatus()}
                disabled={statusLoading}
                className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/40 hover:bg-ink/5 disabled:opacity-50"
              >
                {statusLoading ? t('shortLoading') : t('unpublish')}
              </button>
            )}
          </div>
        </div>

        {generateError && (
          <p className="mt-2 text-right text-[11px] text-ember">{generateError}</p>
        )}
      </div>

      {showAiWarning && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="mt-0.5 text-amber-500">⚠️</span>
          <div className="flex-1 text-sm text-amber-800">
            <span className="font-semibold">{t('aiWarningStrong')}</span>
            {t('aiWarningTail')}
          </div>
          <button
            onClick={() => setShowAiWarning(false)}
            aria-label={t('dismissAria')}
            className="text-lg leading-none text-amber-400 hover:text-amber-600"
          >
            ×
          </button>
        </div>
      )}


      {/* Acordeón de secciones */}
      <div className="space-y-2">
        {card.sections.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-ink/10 bg-ink/5 text-ink/45">
            <p className="text-sm">{t('noSections')}</p>
          </div>
        )}
        {card.sections.map((section) => renderSection(section))}
        <button
          onClick={() => setModal({ parentId: null })}
          className="w-full rounded-xl border border-dashed border-ink/20 py-2.5 text-sm font-semibold text-ink/55 transition hover:border-ink/40 hover:text-ink/60"
        >
          {t('addSectionButton')}
        </button>
      </div>

      {/* Panel de temporadas — solo para series */}
      <SeasonsPanel workId={card.work.id} workType={card.work.type} />

      {/* Metadatos y enlaces */}
      <section className="mt-10 border-t border-ink/10 pt-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/55">{t('metaTitle')}</h2>
          <div className="flex items-center gap-3">
            {savingMeta && <span className="text-xs text-ink/55">{t('metaSaving')}</span>}
            {savedMeta && !savingMeta && <span className="text-xs text-moss">{t('metaSaved')}</span>}
            {metaError && <span className="text-xs text-ember">{metaError}</span>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldPosterUrl')}</label>
            <input
              type="url"
              value={meta.poster_url}
              onChange={(e) => setMeta((p) => ({ ...p, poster_url: e.target.value }))}
              onBlur={() => void saveMeta()}
              placeholder={t('fieldPosterUrlPlaceholder')}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
            />
          </div>
          {card.work.type !== 'book' && (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldCast')}</label>
              <input
                type="text"
                value={meta.cast}
                onChange={(e) => setMeta((p) => ({ ...p, cast: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldCastPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldCountry')}</label>
            <input
              type="text"
              value={meta.country}
              onChange={(e) => setMeta((p) => ({ ...p, country: e.target.value }))}
              onBlur={() => void saveMeta()}
              placeholder={t('fieldCountryPlaceholder')}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
            />
          </div>
          {card.work.type !== 'book' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldRuntime')}</label>
              <input
                type="number"
                min="0"
                value={meta.runtime}
                onChange={(e) => setMeta((p) => ({ ...p, runtime: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldRuntimePlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type !== 'book' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-ink/60">{t('fieldImdbId')}</label>
                {meta.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${meta.imdb_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-ember/70 hover:text-ember"
                  >
                    {t('viewOnImdb')}
                  </a>
                )}
              </div>
              <input
                type="text"
                value={meta.imdb_id}
                onChange={(e) => setMeta((p) => ({ ...p, imdb_id: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldImdbIdPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type !== 'book' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-ink/60">{t('fieldLetterboxd')}</label>
                <a
                  href={meta.imdb_id
                    ? `https://letterboxd.com/imdb/${meta.imdb_id}/`
                    : `https://letterboxd.com/search/films/${encodeURIComponent(card.work.title)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-ember/70 hover:text-ember"
                >
                  {t('searchOnLetterboxd')}
                </a>
              </div>
              <input
                type="url"
                value={meta.letterboxd_url}
                onChange={(e) => setMeta((p) => ({ ...p, letterboxd_url: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldLetterboxdPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type === 'book' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldGoodreads')}</label>
              <input
                type="url"
                value={meta.goodreads_url}
                onChange={(e) => setMeta((p) => ({ ...p, goodreads_url: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldGoodreadsPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type === 'book' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldIsbn')}</label>
              <input
                type="text"
                value={meta.isbn}
                onChange={(e) => setMeta((p) => ({ ...p, isbn: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldIsbnPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type === 'book' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldPublisher')}</label>
              <input
                type="text"
                value={meta.publisher}
                onChange={(e) => setMeta((p) => ({ ...p, publisher: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldPublisherPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type === 'book' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldPages')}</label>
              <input
                type="number"
                min="0"
                value={meta.pages}
                onChange={(e) => setMeta((p) => ({ ...p, pages: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldPagesPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type === 'book' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldSaga')}</label>
              <input
                type="text"
                value={meta.saga}
                onChange={(e) => setMeta((p) => ({ ...p, saga: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldSagaPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type === 'book' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">{t('fieldSagaOrder')}</label>
              <input
                type="number"
                min="1"
                value={meta.saga_order}
                onChange={(e) => setMeta((p) => ({ ...p, saga_order: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldSagaOrderPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type !== 'book' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-ink/60">{t('fieldFilmaffinity')}</label>
                <a
                  href={`https://www.filmaffinity.com/es/search.php?stext=${encodeURIComponent(card.work.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-ember/70 hover:text-ember"
                >
                  {t('searchOnFilmaffinity')}
                </a>
              </div>
              <input
                type="url"
                value={meta.filmaffinity_url}
                onChange={(e) => setMeta((p) => ({ ...p, filmaffinity_url: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={t('fieldFilmaffinityPlaceholder')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
          {card.work.type !== 'book' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-ink/60">{t('fieldTrakt')}</label>
                <a
                  href={`https://trakt.tv/search?query=${encodeURIComponent(card.work.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-ember/70 hover:text-ember"
                >
                  {t('searchOnTrakt')}
                </a>
              </div>
              <input
                type="url"
                value={meta.tracktv_url}
                onChange={(e) => setMeta((p) => ({ ...p, tracktv_url: e.target.value }))}
                onBlur={() => void saveMeta()}
                placeholder={card.work.type === 'series' ? t('fieldTraktPlaceholderSeries') : t('fieldTraktPlaceholderMovie')}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              />
            </div>
          )}
        </div>
      </section>

      {/* Mi actividad */}
      <UserContentPanel
        workId={card.work.id}
        workType={card.work.type}
        initialRecord={initialUserContent}
      />

      {/* Zona de peligro */}
      <div className="mt-12 border-t border-ink/10 pt-6">
        <button
          onClick={deleteCard}
          className="text-xs font-semibold text-ink/45 transition hover:text-ember"
        >
          {t('deleteCard')}
        </button>
      </div>

      {/* Modal añadir sección */}
      {modal !== null && (
        <AddSectionModal
          cardId={card.id}
          parentId={modal.parentId}
          parentLabel={modal.parentLabel}
          onClose={() => setModal(null)}
          onCreated={(s) => onSectionCreated(s, modal.parentId)}
        />
      )}
    </div>
  )
}
