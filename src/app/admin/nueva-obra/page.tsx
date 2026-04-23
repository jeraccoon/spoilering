'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
  slug: string
  tmdb_id: string
  google_books_id: string
}

const TYPE_LABELS = { movie: 'Película', series: 'Serie', book: 'Libro' }
const TYPE_COLORS = {
  movie: 'bg-moss/15 text-moss',
  series: 'bg-plum/15 text-plum',
  book: 'bg-ember/15 text-ember',
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

const EMPTY_FORM: FormState = {
  type: 'movie', title: '', original_title: '', year: '',
  poster_url: '', overview: '', genres: '', authors: '',
  directors: '', seasons_count: '', slug: '',
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `/api/admin/search-works?q=${encodeURIComponent(query)}${searchType !== 'all' ? `&type=${searchType}` : ''}`
        const res = await fetch(url)
        const data = await res.json()
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, searchType])

  function selectResult(result: SearchResult) {
    setSelected(result)
    setResults([])
    setQuery('')
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
      slug: generateSlug(result.title),
      tmdb_id: result.tmdb_id ? String(result.tmdb_id) : '',
      google_books_id: result.google_books_id ?? '',
    })
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === 'title') updated.slug = generateSlug(value)
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.slug || !form.type) return
    setError(null)
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
      if (!res.ok) { setError(data.error); setSubmitting(false); return }
      router.push(`/admin/ficha/${data.cardId}`)
    } catch {
      setError('Error inesperado. Inténtalo de nuevo.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Cabecera */}
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
            <button
              key={t}
              type="button"
              onClick={() => setSearchType(t)}
              className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
                searchType === t
                  ? 'border-ember bg-ember text-white'
                  : 'border-ink/20 text-ink/50 hover:border-ink/40 hover:text-ink'
              }`}
            >
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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            searchType === 'book' ? 'Ej: El señor de los anillos, Dune…'
            : searchType === 'series' ? 'Ej: Breaking Bad, The Wire…'
            : searchType === 'movie' ? 'Ej: Inception, El padrino…'
            : 'Ej: Breaking Bad, El señor de los anillos…'
          }
          className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
        {searching && (
          <p className="mt-2 text-xs text-ink/40">Buscando…</p>
        )}

        {/* Resultados del buscador */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-lg">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => selectResult(result)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-ink/5"
              >
                <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-ink/10">
                  {result.poster_url ? (
                    <Image
                      src={result.poster_url}
                      alt={result.title}
                      fill
                      sizes="32px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg text-ink/20">📖</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{result.title}</p>
                  <p className="text-xs text-ink/40">
                    {result.year ?? '—'} · {TYPE_LABELS[result.type]}
                  </p>
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
          <button
            type="button"
            onClick={() => { setSelected(null); setForm(EMPTY_FORM) }}
            className="ml-auto text-xs text-ink/40 hover:text-ink"
          >
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
              <button
                key={t}
                type="button"
                onClick={() => updateField('type', t)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  form.type === t
                    ? 'border-ember bg-ember text-white'
                    : 'border-ink/20 text-ink/60 hover:border-ink/40 hover:text-ink'
                }`}
              >
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

        <Field label="Slug (URL) *" value={form.slug} onChange={(v) => updateField('slug', v)} required
          hint="Solo letras minúsculas, números y guiones." />

        <Field label="URL del póster" value={form.poster_url} onChange={(v) => updateField('poster_url', v)} placeholder="https://…" />

        {/* Vista previa del póster */}
        {form.poster_url && (
          <div className="relative h-32 w-24 overflow-hidden rounded-lg border border-ink/10">
            <Image src={form.poster_url} alt="Póster" fill className="object-cover" unoptimized />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Sinopsis</label>
          <textarea
            value={form.overview}
            onChange={(e) => updateField('overview', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            placeholder="Descripción breve de la obra…"
          />
        </div>

        <Field label="Géneros (separados por comas)" value={form.genres} onChange={(v) => updateField('genres', v)} placeholder="Drama, Thriller, Ciencia ficción" />

        {form.type === 'book' && (
          <Field label="Autores (separados por comas)" value={form.authors} onChange={(v) => updateField('authors', v)} placeholder="J.R.R. Tolkien" />
        )}
        {form.type === 'movie' && (
          <Field label="Directores (separados por comas)" value={form.directors} onChange={(v) => updateField('directors', v)} placeholder="Christopher Nolan" />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="TMDb ID" value={form.tmdb_id} onChange={(v) => updateField('tmdb_id', v)} type="number" />
          <Field label="Google Books ID" value={form.google_books_id} onChange={(v) => updateField('google_books_id', v)} />
        </div>

        {error && (
          <p className="rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !form.title || !form.slug}
            className="rounded-lg bg-ember px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creando…' : 'Crear obra y ficha'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold text-ink/50 hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label, value, onChange, required, type = 'text', placeholder, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
      />
      {hint && <p className="mt-1 text-[11px] text-ink/40">{hint}</p>}
    </div>
  )
}
