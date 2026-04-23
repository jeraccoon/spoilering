'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface SearchResult {
  id: string
  type: 'movie' | 'series' | 'book'
  title: string
  original_title: string | null
  year: number | null
  poster_url: string | null
  overview: string | null
  genres: string[]
  authors: string[]
  directors: string[]
  seasons_count: number | null
  tmdb_id: number | null
  google_books_id: string | null
}

interface FormState {
  type: 'movie' | 'series' | 'book'
  title: string
  original_title: string
  year: string
  poster_url: string
  overview: string
  genres: string
  authors: string
  directors: string
  seasons_count: string
  tmdb_id: string
  google_books_id: string
}

const TYPE_LABELS = { movie: 'Película', series: 'Serie', book: 'Libro' }
const TYPE_COLORS = {
  movie: 'bg-moss/15 text-moss',
  series: 'bg-plum/15 text-plum',
  book: 'bg-ember/15 text-ember',
}

const EMPTY_FORM: FormState = {
  type: 'movie', title: '', original_title: '', year: '',
  poster_url: '', overview: '', genres: '', authors: '',
  directors: '', seasons_count: '',
  tmdb_id: '', google_books_id: '',
}

type SearchType = 'all' | 'movie' | 'series' | 'book'
const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  all: 'Todo', movie: 'Película', series: 'Serie', book: 'Libro',
}

export default function NuevaObraPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateSlug, setDuplicateSlug] = useState<string | null>(null)
  const [existingCard, setExistingCard] = useState<{ cardId: string } | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [posterMode, setPosterMode] = useState<'url' | 'file'>('url')
  const [uploading, setUploading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `/api/admin/search-works?q=${encodeURIComponent(query)}${searchType !== 'all' ? `&type=${searchType}` : ''}`
        const res = await fetch(url)
        setResults(await res.json())
      } catch { setResults([]) } finally { setSearching(false) }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, searchType])

  async function selectResult(result: SearchResult) {
    setSelected(result)
    setResults([])
    setQuery('')
    setExistingCard(null)
    setForm({
      type: result.type,
      title: result.title,
      original_title: result.original_title ?? '',
      year: result.year ? String(result.year) : '',
      poster_url: result.poster_url ?? '',
      overview: result.overview ?? '',
      genres: result.genres.join(', '),
      authors: result.authors.join(', '),
      directors: result.directors.join(', '),
      seasons_count: result.seasons_count ? String(result.seasons_count) : '',
      tmdb_id: result.tmdb_id ? String(result.tmdb_id) : '',
      google_books_id: result.google_books_id ?? '',
    })

    if ((result.type === 'movie' || result.type === 'series') && result.tmdb_id) {
      try {
        const creditsRes = await fetch(`/api/admin/tmdb-credits?id=${result.tmdb_id}&type=${result.type}`)
        const { directors } = await creditsRes.json()
        if (directors.length > 0) {
          setForm((prev) => ({ ...prev, directors: directors.join(', ') }))
        }
      } catch {}
    }

    const tmdbId = result.tmdb_id
    const booksId = result.google_books_id
    if (!tmdbId && !booksId) return
    setCheckingDuplicate(true)
    try {
      let q = (supabase.from('works') as any).select('id, cards(id)').limit(1)
      if (tmdbId) q = q.eq('tmdb_id', tmdbId)
      else if (booksId) q = q.eq('google_books_id', booksId)
      const { data } = await q.maybeSingle()
      if (data?.cards?.length > 0) setExistingCard({ cardId: data.cards[0].id })
    } finally { setCheckingDuplicate(false) }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handlePosterUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error: uploadError } = await supabase.storage
        .from('posters')
        .upload(fileName, file, { contentType: file.type, upsert: false })
      if (uploadError) throw new Error(uploadError.message)
      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(data.path)
      updateField('poster_url', publicUrl)
    } catch (err) {
      setError(err instanceof Error ? `Error al subir imagen: ${err.message}` : 'Error al subir imagen')
    } finally { setUploading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.type) return
    setError(null)
    setDuplicateSlug(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/create-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: form.year ? parseInt(form.year) : null,
          seasons_count: form.seasons_count ? parseInt(form.seasons_count) : null,
          tmdb_id: form.tmdb_id ? parseInt(form.tmdb_id) : null,
          google_books_id: form.google_books_id || null,
          genres: form.genres.split(',').map((s) => s.trim()).filter(Boolean),
          authors: form.authors.split(',').map((s) => s.trim()).filter(Boolean),
          directors: form.directors.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'duplicate') {
          setDuplicateSlug(data.slug ?? null)
        } else {
          setError(data.error)
        }
        setSubmitting(false)
        return
      }
      router.push(`/admin/ficha/${data.cardId}`)
    } catch {
      setError('Error inesperado. Inténtalo de nuevo.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-ink">Nueva obra</h1>
        <p className="mt-1 text-sm text-ink/50">
          Busca en TMDb o Google Books para rellenar el formulario automáticamente.
        </p>
      </div>

      {/* Selector de tipo */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">¿Qué tipo de obra es?</p>
        <div className="flex gap-2">
          {(['all', 'movie', 'series', 'book'] as SearchType[]).map((t) => (
            <button key={t} type="button" onClick={() => setSearchType(t)}
              className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
                searchType === t ? 'border-ember bg-ember text-white' : 'border-ink/20 text-ink/50 hover:border-ink/40 hover:text-ink'
              }`}>
              {SEARCH_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-8">
        <label className="mb-1.5 block text-sm font-semibold text-ink">
          {searchType === 'book' ? 'Buscar en Google Books' : searchType !== 'all' ? 'Buscar en TMDb' : 'Buscar en TMDb y Google Books'}
        </label>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por título, autor, director, actor..."
          className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20" />
        <p className="mt-1.5 text-xs text-ink/40">
          {searchType === 'book'
            ? 'Puedes buscar por título o autor. Ejemplo: "autor:tolkien" para buscar por autor.'
            : 'Puedes buscar por título, director o actor.'}
        </p>
        {searching && <p className="mt-1 text-xs text-ink/40">Buscando…</p>}

        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-lg">
            {results.map((result) => (
              <button key={result.id} type="button" onClick={() => selectResult(result)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-ink/5">
                <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-ink/10">
                  {result.poster_url ? (
                    <Image src={result.poster_url} alt={result.title} fill sizes="32px" className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg text-ink/20">📖</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{result.title}</p>
                  <p className="text-xs text-ink/40">{result.year ?? '—'} · {TYPE_LABELS[result.type]}</p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[result.type]}`}>
                  {TYPE_LABELS[result.type]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Obra seleccionada */}
      {selected && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-moss/30 bg-moss/5 px-4 py-3">
          <span className="text-moss">✓</span>
          <p className="text-sm text-ink">
            Seleccionado: <span className="font-semibold">{selected.title}</span>
            {selected.year && <span className="text-ink/50"> ({selected.year})</span>}
          </p>
          <button type="button" onClick={() => { setSelected(null); setForm(EMPTY_FORM); setExistingCard(null) }}
            className="ml-auto text-xs text-ink/40 hover:text-ink">
            Limpiar
          </button>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Tipo */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Tipo</label>
          <div className="flex gap-2">
            {(['movie', 'series', 'book'] as const).map((t) => (
              <button key={t} type="button" onClick={() => updateField('type', t)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  form.type === t ? 'border-ember bg-ember text-white' : 'border-ink/20 text-ink/60 hover:border-ink/40 hover:text-ink'
                }`}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Título *" value={form.title} onChange={(v) => updateField('title', v)} required />
          <Field label="Título original" value={form.original_title} onChange={(v) => updateField('original_title', v)} />
          <Field label="Año" value={form.year} onChange={(v) => updateField('year', v)} type="number" placeholder="2024" />
          {form.type === 'series' && (
            <Field label="Número de temporadas" value={form.seasons_count} onChange={(v) => updateField('seasons_count', v)} type="number" placeholder="5" />
          )}
        </div>

        {/* Slug automático — solo informativo */}
        {form.title && (
          <p className="text-xs text-ink/40">
            URL generada automáticamente a partir del título.
          </p>
        )}

        {/* Póster */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">Póster</label>
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => setPosterMode('url')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                posterMode === 'url' ? 'border-ember bg-ember text-white' : 'border-ink/20 text-ink/50 hover:border-ink/40 hover:text-ink'
              }`}>
              URL externa
            </button>
            <button type="button" onClick={() => setPosterMode('file')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                posterMode === 'file' ? 'border-ember bg-ember text-white' : 'border-ink/20 text-ink/50 hover:border-ink/40 hover:text-ink'
              }`}>
              Subir imagen
            </button>
          </div>

          {posterMode === 'url' ? (
            <input type="url" value={form.poster_url} onChange={(e) => updateField('poster_url', e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20" />
          ) : (
            <div className="flex flex-col gap-2">
              <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink/20 px-4 py-6 text-sm text-ink/50 transition hover:border-ink/40 hover:text-ink/70 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                <span className="text-2xl">📁</span>
                <span>{uploading ? 'Subiendo…' : 'Haz clic para seleccionar una imagen'}</span>
                <span className="text-xs text-ink/30">JPG, PNG o WEBP</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePosterUpload(f) }} />
              </label>
              {form.poster_url && posterMode === 'file' && (
                <p className="text-xs text-moss">✓ Imagen subida correctamente</p>
              )}
            </div>
          )}

          {form.poster_url && (
            <div className="relative mt-3 h-32 w-24 overflow-hidden rounded-lg border border-ink/10">
              <Image src={form.poster_url} alt="Póster" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Sinopsis</label>
          <textarea value={form.overview} onChange={(e) => updateField('overview', e.target.value)} rows={3}
            className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            placeholder="Descripción breve de la obra…" />
        </div>

        <Field label="Géneros (separados por comas)" value={form.genres} onChange={(v) => updateField('genres', v)} placeholder="Drama, Thriller, Ciencia ficción" />

        {form.type === 'book' && (
          <Field label="Autores (separados por comas)" value={form.authors} onChange={(v) => updateField('authors', v)} placeholder="J.R.R. Tolkien" />
        )}
        {(form.type === 'movie' || form.type === 'series') && (
          <Field
            label={form.type === 'series' ? 'Directores / Creadores (separados por comas)' : 'Directores (separados por comas)'}
            value={form.directors}
            onChange={(v) => updateField('directors', v)}
            placeholder={form.type === 'series' ? 'Vince Gilligan' : 'Christopher Nolan'}
          />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="TMDb ID" value={form.tmdb_id} onChange={(v) => updateField('tmdb_id', v)} type="number" />
          <Field label="Google Books ID" value={form.google_books_id} onChange={(v) => updateField('google_books_id', v)} />
        </div>

        {duplicateSlug !== null && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Esta obra ya está en Spoilering.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`/ficha/${duplicateSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ember"
              >
                Ver la ficha →
              </a>
              <a
                href={`/ficha/${duplicateSlug}#sugerir`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5"
              >
                Sugerir una corrección
              </a>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</p>
        )}

        {existingCard && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Ya existe una ficha para esta obra.</p>
            <a href={`/admin/ficha/${existingCard.cardId}`}
              className="mt-1 inline-block underline underline-offset-2 hover:text-amber-900">
              Ir a editar la ficha existente →
            </a>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {checkingDuplicate ? (
            <span className="text-sm text-ink/40">Verificando…</span>
          ) : existingCard ? null : (
            <button type="submit" disabled={submitting || !form.title}
              className="rounded-lg bg-ember px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? 'Creando…' : 'Crear obra y ficha'}
            </button>
          )}
          <button type="button" onClick={() => router.back()}
            className="text-sm font-semibold text-ink/50 hover:text-ink">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, required, type = 'text', placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; type?: string; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20" />
      {hint && <p className="mt-1 text-[11px] text-ink/40">{hint}</p>}
    </div>
  )
}
