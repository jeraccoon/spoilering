'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { SeasonsPanel } from '@/components/admin/SeasonsPanel'

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
}

interface Card {
  id: string
  status: string
  work: Work
  sections: Section[]
}

const TYPE_LABELS: Record<string, string> = { movie: 'Película', series: 'Serie', book: 'Libro' }
const STATUS_LABELS: Record<string, string> = { draft: 'Borrador', published: 'Publicada', locked: 'Bloqueada' }
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700 border-amber-200',
  published: 'bg-moss/10 text-moss border-moss/20',
  locked: 'bg-ink/10 text-ink/60 border-ink/20',
}

interface AddSectionModalProps {
  cardId: string
  parentId: string | null
  parentLabel?: string
  onClose: () => void
  onCreated: (section: Section) => void
}

function AddSectionModal({ cardId, parentId, parentLabel, onClose, onCreated }: AddSectionModalProps) {
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
      setError('Error inesperado')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-black text-ink">
          {parentLabel ? `Añadir subsección en "${parentLabel}"` : 'Añadir sección'}
        </h3>
        <p className="mb-5 text-sm text-ink/50">
          {parentLabel ? 'Por ejemplo: Episodio 1, Capítulo 3…' : 'Por ejemplo: Temporada 1, Acto I, Resumen general…'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Nombre de la sección *</label>
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder="Ej: Temporada 1"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Nombre corto (nav)</label>
            <input
              type="text"
              value={shortLabel}
              onChange={(e) => setShortLabel(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder="Ej: T1 (opcional)"
            />
          </div>
          {error && <p className="text-sm text-ember">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || !label.trim()}
              className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50">
              {saving ? 'Creando…' : 'Crear sección'}
            </button>
            <button type="button" onClick={onClose}
              className="text-sm font-semibold text-ink/50 hover:text-ink">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function FichaEditor({ card: initialCard }: { card: Card }) {
  const router = useRouter()
  const [card, setCard] = useState(initialCard)
  const [selectedId, setSelectedId] = useState<string | null>(card.sections[0]?.id ?? null)
  const [editContent, setEditContent] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    function collect(sections: Section[]) {
      for (const s of sections) { map[s.id] = s.content; collect(s.children) }
    }
    collect(card.sections)
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generatingSections, setGeneratingSections] = useState<Set<string>>(new Set())
  const [statusLoading, setStatusLoading] = useState(false)
  const [modal, setModal] = useState<{ parentId: string | null; parentLabel?: string } | null>(null)

  const allSections: Section[] = []
  function flatten(sections: Section[]) {
    for (const s of sections) { allSections.push(s); flatten(s.children) }
  }
  flatten(card.sections)
  const selectedSection = allSections.find((s) => s.id === selectedId) ?? null
  const parentOfSelected = selectedSection?.parent_id
    ? allSections.find((s) => s.id === selectedSection.parent_id) ?? null
    : null

  async function saveContent(sectionId: string) {
    setSaving(sectionId)
    await fetch(`/api/admin/sections/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent[sectionId] ?? '' }),
    })
    setSaving(null)
    setSavedId(sectionId)
    setTimeout(() => setSavedId((prev) => (prev === sectionId ? null : prev)), 2000)
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
          } else if (!res.ok) {
            setGenerateError(data.error ?? 'Error al generar una sección')
          }
        } catch {
          setGenerateError('Error de red al generar')
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
  }

  async function toggleStatus() {
    setStatusLoading(true)
    const next = card.status === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/admin/cards/${card.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) setCard((c) => ({ ...c, status: next }))
    setStatusLoading(false)
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
    setSelectedId(newSection.id)
    setModal(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">

      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-start gap-5">
        {card.work.poster_url && (
          <div className="relative hidden h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-ink/10 sm:block">
            <Image src={card.work.poster_url} alt={card.work.title} fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ink/50">
              {TYPE_LABELS[card.work.type] ?? card.work.type}
              {card.work.year && ` · ${card.work.year}`}
            </span>
            <button
              onClick={() => router.push('/admin')}
              className="shrink-0 text-sm font-semibold text-ink/40 hover:text-ink"
            >
              ← Admin
            </button>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink">{card.work.title}</h1>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="mb-7 border-b border-ink/10 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Estado (izquierda) */}
          {card.status === 'published' ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-moss">
              <span className="h-2 w-2 rounded-full bg-moss" />
              Publicada
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink/40">
              <span className="h-2 w-2 rounded-full bg-ink/30" />
              Borrador
            </span>
          )}

          {/* Acciones (derecha) */}
          <div className="flex items-center gap-2">
            <button
              onClick={generateAll}
              disabled={generatingAll || card.sections.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-plum/30 bg-plum/5 px-3 py-1.5 text-xs font-semibold text-plum transition hover:bg-plum/10 disabled:opacity-50"
            >
              {generatingAll
                ? `⏳ Generando… (${card.sections.length - generatingSections.size}/${card.sections.length})`
                : '✦ Generar todo con IA'}
            </button>

            {card.status === 'draft' ? (
              <button
                onClick={toggleStatus}
                disabled={statusLoading}
                className="rounded-lg bg-ember px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
              >
                {statusLoading ? '…' : 'Publicar'}
              </button>
            ) : (
              <button
                onClick={toggleStatus}
                disabled={statusLoading}
                className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/40 hover:bg-ink/5 disabled:opacity-50"
              >
                {statusLoading ? '…' : 'Despublicar'}
              </button>
            )}
          </div>
        </div>

        {generateError && (
          <p className="mt-2 text-right text-[11px] text-ember">{generateError}</p>
        )}
      </div>

      <div className="flex gap-6">
        {/* Panel izquierdo — secciones */}
        <aside className="w-56 shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Secciones</p>
            <button
              onClick={() => setModal({ parentId: null })}
              className="rounded-md bg-ember px-2 py-1 text-[11px] font-semibold text-white hover:bg-ember/90"
            >
              + Añadir
            </button>
          </div>

          <nav className="space-y-0.5">
            {card.sections.length === 0 && (
              <p className="py-4 text-center text-xs text-ink/30">Sin secciones</p>
            )}
            {card.sections.map((section) => (
              <div key={section.id}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedId(section.id)}
                    className={`flex-1 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                      selectedId === section.id
                        ? 'bg-ember/10 font-semibold text-ember'
                        : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {section.short_label ?? section.label}
                      {generatingSections.has(section.id) && (
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-plum/60" />
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => setModal({ parentId: section.id, parentLabel: section.label })}
                    title="Añadir subsección"
                    className="rounded px-1 py-1 text-ink/30 hover:text-ink/60"
                  >
                    +
                  </button>
                </div>
                {section.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedId(child.id)}
                    className={`ml-4 mt-0.5 block w-[calc(100%-1rem)] rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                      selectedId === child.id
                        ? 'bg-ember/10 font-semibold text-ember'
                        : 'text-ink/50 hover:bg-ink/5 hover:text-ink'
                    }`}
                  >
                    {child.short_label ?? child.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Panel derecho — editor */}
        <div className="min-w-0 flex-1">
          {!selectedSection ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-ink/10 bg-ink/5 text-ink/30">
              <p className="text-sm">Selecciona o crea una sección para empezar</p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div>
                  {parentOfSelected && (
                    <p className="text-xs text-ink/40">{parentOfSelected.label} /</p>
                  )}
                  <h2 className="text-lg font-black text-ink">{selectedSection.label}</h2>
                </div>
                {saving === selectedSection.id && (
                  <span className="text-xs text-ink/40">Guardando…</span>
                )}
                {savedId === selectedSection.id && saving !== selectedSection.id && (
                  <span className="text-xs text-moss">✓ Guardado</span>
                )}
              </div>

              <textarea
                value={editContent[selectedSection.id] ?? ''}
                onChange={(e) => setEditContent((prev) => ({ ...prev, [selectedSection.id]: e.target.value }))}
                onBlur={() => saveContent(selectedSection.id)}
                rows={11}
                style={{ minHeight: '240px' }}
                placeholder="Escribe el contenido de esta sección o usa el botón ✨ para generarlo con IA…"
                className="w-full resize-y rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm leading-relaxed text-ink placeholder-ink/25 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              />

              <div className="mt-2 flex items-center justify-between text-xs text-ink/30">
                <span>{(editContent[selectedSection.id] ?? '').length} caracteres</span>
                <span>{(editContent[selectedSection.id] ?? '').split(/\s+/).filter(Boolean).length} palabras</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel de temporadas — solo para series */}
      <SeasonsPanel workId={card.work.id} workType={card.work.type} />

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
