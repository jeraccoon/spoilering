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
  open_library_id: string | null
  isbn: string | null
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
  isbn: string
  publisher: string
  pages: string
  saga: string
  saga_order: string
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
  isbn: '', publisher: '', pages: '', saga: '', saga_order: '',
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
  const [isbnQuery, setIsbnQuery] = useState('')
  const [isbnSearching, setIsbnSearching] = useState(false)
  const [isbnError, setIsbnError] = useState<string | null>(null)
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
      isbn: result.isbn ?? '',
      publisher: '',
      pages: '',
      saga: '',
      saga_order: '',
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

    // Comprobar duplicado solo si hay un ID externo que podamos buscar en BD
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

  async function lookupByIsbnOrGoodreads(input: string) {
    const trimmed = input.trim()
    if (!trimmed) return

    function applyOlBook(book: any) {
      const title: string = book.title ?? ''
      const authors: string[] = (book.authors ?? []).map((a: any) => a.name as string).filter(Boolean)
      const rawYear: string = book.publish_date ?? ''
      const yearMatch = rawYear.match(/\d{4}/)
      const year = yearMatch ? parseInt(yearMatch[0]) : null
      const publisher: string = book.publishers?.[0]?.name ?? ''
      const pages: string = book.number_of_pages ? String(book.number_of_pages) : ''
      const isbn13: string = book.identifiers?.isbn_13?.[0] ?? ''
      const isbn10: string = book.identifiers?.isbn_10?.[0] ?? ''
      const isbn = isbn13 || isbn10 || ''
      const subjects: string[] = (book.subjects ?? [])
        .slice(0, 5)
        .map((s: any) => (typeof s === 'string' ? s : (s.name as string)))
        .filter(Boolean)

      let poster_url = ''
      if (book.cover?.large) poster_url = book.cover.large as string
      else if (book.cover?.medium) poster_url = book.cover.medium as string
      else if (isbn13) poster_url = `https://covers.openlibrary.org/b/isbn/${isbn13}-M.jpg`
      else if (isbn10) poster_url = `https://covers.openlibrary.org/b/isbn/${isbn10}-M.jpg`

      setSelected({
        id: 'ol-lookup',
        type: 'book',
        title,
        original_title: null,
        year,
        poster_url: poster_url || null,
        overview: null,
        genres: subjects,
        authors,
        directors: [],
        seasons_count: null,
        tmdb_id: null,
        google_books_id: null,
        open_library_id: (book.key as string) ?? null,
        isbn: isbn || null,
      })
      setForm((prev) => ({
        ...prev,
        type: 'book',
        title: title || prev.title,
        authors: authors.length > 0 ? authors.join(', ') : prev.authors,
        year: year ? String(year) : prev.year,
        poster_url: poster_url || prev.poster_url,
        publisher: publisher || prev.publisher,
        pages: pages || prev.pages,
        isbn: isbn || prev.isbn,
        genres: subjects.length > 0 ? subjects.join(', ') : prev.genres,
      }))
      setIsbnQuery('')
      setExistingCard(null)
    }

    setIsbnSearching(true)
    setIsbnError(null)

    try {
      // Goodreads URL
      const grMatch = trimmed.match(/goodreads\.com\/book\/show\/(\d+)(?:\.([^?#\s]+))?/)
      if (grMatch) {
        const goodreadsId = grMatch[1]
        const urlSlug: string | undefined = grMatch[2]

        const res = await fetch(
          `https://openlibrary.org/api/books?bibkeys=GOODREADS:${goodreadsId}&format=json&jscmd=data`
        )
        const json = await res.json()
        const book = Object.values(json)[0] as any

        if (book) { applyOlBook(book); return }

        // Fallback: buscar por título extraído del slug de la URL
        if (urlSlug) {
          const titleQuery = urlSlug.replace(/[_-]/g, ' ').trim()
          if (titleQuery.length >= 2) {
            const searchRes = await fetch(`/api/admin/search-works?q=${encodeURIComponent(titleQuery)}&type=book`)
            const searchResults = await searchRes.json()
            if (searchResults.length > 0) {
              setResults(searchResults)
              setIsbnQuery('')
              return
            }
          }
        }

        setIsbnError('No se encontró este libro en Open Library. Prueba a buscarlo por título.')
        return
      }

      // ISBN-10 o ISBN-13 (con o sin guiones)
      const cleanIsbn = trimmed.replace(/[-\s]/g, '')
      if (/^\d{10}$/.test(cleanIsbn) || /^\d{13}$/.test(cleanIsbn)) {
        const res = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`
        )
        const json = await res.json()
        const book = Object.values(json)[0] as any
        if (!book) { setIsbnError('No se encontró ningún libro con ese ISBN.'); return }
        applyOlBook(book)
        return
      }

      setIsbnError('Introduce un ISBN (10 o 13 dígitos) o un enlace de Goodreads válido.')
    } catch {
      setIsbnError('Error al buscar. Comprueba la conexión e inténtalo de nuevo.')
    } finally {
      setIsbnSearching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.type) return
    setError(null)
    setDuplicateSlug(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/works', {
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
          isbn: form.isbn || null,
          publisher: form.publisher || null,
          pages: form.pages ? parseInt(form.pages) : null,
          saga: form.saga || null,
          saga_order: form.saga_order ? parseInt(form.saga_order) : null,
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
      router.push(`/admin/nueva-ficha/${data.workId}`)
    } catch {
      setError('Error inesperado. Inténtalo de nuevo.')
      setSubmitting(false)
    }
  }

  const searchLabel = searchType === 'book'
    ? 'Buscar en Google Books y Open Library'
    : searchType !== 'all'
    ? 'Buscar en TMDb'
    : 'Buscar en TMDb, Google Books y Open Library'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-ink">Nueva obra</h1>
        <p className="mt-1 text-sm text-ink/50">
          Busca en TMDb, Google Books u Open Library para rellenar el formulario automáticamente.
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
        <label className="mb-1.5 block text-sm font-semibold text-ink">{searchLabel}</label>
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
                  <p className="text-xs text-ink/40">
                    {result.year ?? '—'} · {TYPE_LABELS[result.type]}
                    {result.authors.length > 0 && ` · ${result.authors[0]}`}
                  </p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[result.type]}`}>
                  {result.open_library_id && !result.google_books_id ? 'OL' : TYPE_LABELS[result.type]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Búsqueda por ISBN o Goodreads — solo libros */}
      {searchType === 'book' && (
        <div className="mb-8">
          <label className="mb-1.5 block text-sm font-semibold text-ink">
            ISBN o enlace de Goodreads{' '}
            <span className="font-normal text-ink/40">(opcional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={isbnQuery}
              onChange={(e) => { setIsbnQuery(e.target.value); setIsbnError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); lookupByIsbnOrGoodreads(isbnQuery) } }}
              placeholder="9780618640157  o  https://www.goodreads.com/book/show/…"
              className="flex-1 rounded-lg border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            />
            <button
              type="button"
              onClick={() => lookupByIsbnOrGoodreads(isbnQuery)}
              disabled={!isbnQuery.trim() || isbnSearching}
              className="rounded-lg border border-ink/20 px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isbnSearching ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
          {isbnError && <p className="mt-2 text-xs text-ember">{isbnError}</p>}
        </div>
      )}

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

        {form.title && (
          <p className="text-xs text-ink/40">URL generada automáticamente a partir del título.</p>
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

        {/* Campos específicos de libros */}
        {form.type === 'book' && (
          <>
            <Field label="ISBN" value={form.isbn} onChange={(v) => updateField('isbn', v)} placeholder="978-84-..." />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Editorial" value={form.publisher} onChange={(v) => updateField('publisher', v)} placeholder="Minotauro" />
              <Field label="Número de páginas" value={form.pages} onChange={(v) => updateField('pages', v)} type="number" placeholder="340" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Saga / serie de libros" value={form.saga} onChange={(v) => updateField('saga', v)} placeholder="El Señor de los Anillos" />
              <Field label="Número en la saga" value={form.saga_order} onChange={(v) => updateField('saga_order', v)} type="number" placeholder="1" />
            </div>
          </>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="TMDb ID" value={form.tmdb_id} onChange={(v) => updateField('tmdb_id', v)} type="number" />
          <Field label="Google Books ID" value={form.google_books_id} onChange={(v) => updateField('google_books_id', v)} />
        </div>

        {duplicateSlug !== null && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Esta obra ya está en Spoilering.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`/ficha/${duplicateSlug}`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ember">
                Ver la ficha →
              </a>
              <a href={`/ficha/${duplicateSlug}#sugerir`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5">
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
              {submitting ? 'Creando…' : 'Continuar →'}
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
