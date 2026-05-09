'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
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
  publisher: string | null
  pages: number | null
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

export default function NuevaObraClient() {
  const t = useTranslations('Admin.newWork')
  const tw = useTranslations('WorkType')
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

  const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
    all: t('filterAll'),
    movie: tw('movie'),
    series: tw('series'),
    book: tw('book'),
  }

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
    setDuplicateSlug(null)
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
      publisher: result.publisher ?? '',
      pages: result.pages ? String(result.pages) : '',
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
      let q = (supabase.from('works') as any)
        .select('id, cards!inner(id, status)')
        .eq('cards.is_committed', true)
        .limit(1)
      if (tmdbId) q = q.eq('tmdb_id', tmdbId)
      else if (booksId) q = q.eq('google_books_id', booksId)
      const { data } = await q.maybeSingle()
      if (data?.cards?.length > 0) {
        const card = data.cards[0]
        if (card.status === 'published') {
          setExistingCard({ cardId: card.id })
        }
        // Committed draft — no warning; create-work will redirect to edit it
      }
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
      setError(err instanceof Error ? t('errors.uploadWith', { message: err.message }) : t('errors.uploadGeneric'))
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
        publisher: publisher || null,
        pages: book.number_of_pages ?? null,
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

        setIsbnError(t('errors.olNotFound'))
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
        if (!book) { setIsbnError(t('errors.isbnNotFound')); return }
        applyOlBook(book)
        return
      }

      setIsbnError(t('errors.invalidIsbnOrLink'))
    } catch {
      setIsbnError(t('errors.lookupNetwork'))
    } finally {
      setIsbnSearching(false)
    }
  }

  function buildPayload() {
    return {
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
    }
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
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.slug) {
          // Ya existe una ficha activa para esta obra
          setDuplicateSlug(data.slug)
        } else {
          setError(data.error ?? t('errors.createWork'))
        }
        setSubmitting(false)
        return
      }
      if (data.redirectTo) {
        router.push(data.redirectTo)
      } else if (data.cardId) {
        router.push(`/admin/ficha/${data.cardId}`)
      }
    } catch {
      setError(t('errors.unexpected'))
      setSubmitting(false)
    }
  }

  const searchLabel = searchType === 'book'
    ? t('searchLabelBook')
    : searchType !== 'all'
    ? t('searchLabelTmdb')
    : t('searchLabelAll')

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-ink/50">
          {t('subtitle')}
        </p>
      </div>

      {/* Selector de tipo */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/55">{t('typeQuestion')}</p>
        <div className="flex gap-2">
          {(['all', 'movie', 'series', 'book'] as SearchType[]).map((tp) => (
            <button key={tp} type="button" onClick={() => setSearchType(tp)}
              className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
                searchType === tp ? 'border-ember bg-ember text-white' : 'border-ink/20 text-ink/50 hover:border-ink/40 hover:text-ink'
              }`}>
              {SEARCH_TYPE_LABELS[tp]}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-8">
        <label className="mb-1.5 block text-sm font-semibold text-ink">{searchLabel}</label>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20" />
        <p className="mt-1.5 text-xs text-ink/55">
          {searchType === 'book' ? t('hintBook') : t('hintMedia')}
        </p>
        {searching && <p className="mt-1 text-xs text-ink/55">{t('searching')}</p>}

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
                  <p className="text-xs text-ink/55">
                    {result.year ?? '—'} · {tw(result.type)}
                    {result.authors.length > 0 && ` · ${result.authors[0]}`}
                  </p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[result.type]}`}>
                  {result.open_library_id && !result.google_books_id ? 'OL' : tw(result.type)}
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
            {t('isbnLabel')}{' '}
            <span className="font-normal text-ink/55">{t('isbnOptional')}</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={isbnQuery}
              onChange={(e) => { setIsbnQuery(e.target.value); setIsbnError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); lookupByIsbnOrGoodreads(isbnQuery) } }}
              placeholder={t('isbnPlaceholder')}
              className="flex-1 rounded-lg border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            />
            <button
              type="button"
              onClick={() => lookupByIsbnOrGoodreads(isbnQuery)}
              disabled={!isbnQuery.trim() || isbnSearching}
              className="rounded-lg border border-ink/20 px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isbnSearching ? t('isbnSearching') : t('isbnSearch')}
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
            {t('selected')} <span className="font-semibold">{selected.title}</span>
            {selected.year && <span className="text-ink/50"> ({selected.year})</span>}
          </p>
          <button type="button" onClick={() => { setSelected(null); setForm(EMPTY_FORM); setExistingCard(null) }}
            className="ml-auto text-xs text-ink/55 hover:text-ink">
            {t('clear')}
          </button>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Tipo */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">{t('type')}</label>
          <div className="flex gap-2">
            {(['movie', 'series', 'book'] as const).map((tp) => (
              <button key={tp} type="button" onClick={() => updateField('type', tp)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  form.type === tp ? 'border-ember bg-ember text-white' : 'border-ink/20 text-ink/60 hover:border-ink/40 hover:text-ink'
                }`}>
                {tw(tp)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('fieldTitle')} value={form.title} onChange={(v) => updateField('title', v)} required />
          <Field label={t('fieldOriginalTitle')} value={form.original_title} onChange={(v) => updateField('original_title', v)} />
          <Field label={t('fieldYear')} value={form.year} onChange={(v) => updateField('year', v)} type="number" placeholder={t('fieldYearPlaceholder')} />
          {form.type === 'series' && (
            <Field label={t('fieldSeasonsCount')} value={form.seasons_count} onChange={(v) => updateField('seasons_count', v)} type="number" placeholder={t('fieldSeasonsPlaceholder')} />
          )}
        </div>

        {form.title && (
          <p className="text-xs text-ink/55">{t('slugAuto')}</p>
        )}

        {/* Póster */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">{t('poster')}</label>
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => setPosterMode('url')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                posterMode === 'url' ? 'border-ember bg-ember text-white' : 'border-ink/20 text-ink/50 hover:border-ink/40 hover:text-ink'
              }`}>
              {t('posterUrl')}
            </button>
            <button type="button" onClick={() => setPosterMode('file')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                posterMode === 'file' ? 'border-ember bg-ember text-white' : 'border-ink/20 text-ink/50 hover:border-ink/40 hover:text-ink'
              }`}>
              {t('posterUpload')}
            </button>
          </div>

          {posterMode === 'url' ? (
            <input type="url" value={form.poster_url} onChange={(e) => updateField('poster_url', e.target.value)}
              placeholder={t('posterUrlPlaceholder')}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20" />
          ) : (
            <div className="flex flex-col gap-2">
              <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink/20 px-4 py-6 text-sm text-ink/50 transition hover:border-ink/40 hover:text-ink/70 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                <span className="text-2xl">📁</span>
                <span>{uploading ? t('posterUploading') : t('posterUploadHint')}</span>
                <span className="text-xs text-ink/45">{t('posterFormats')}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePosterUpload(f) }} />
              </label>
              {form.poster_url && posterMode === 'file' && (
                <p className="text-xs text-moss">{t('posterUploaded')}</p>
              )}
            </div>
          )}

          {form.poster_url && (
            <div className="relative mt-3 h-32 w-24 overflow-hidden rounded-lg border border-ink/10">
              <Image src={form.poster_url} alt={t('posterAlt')} fill className="object-cover" unoptimized />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">{t('overview')}</label>
          <textarea value={form.overview} onChange={(e) => updateField('overview', e.target.value)} rows={3}
            className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            placeholder={t('overviewPlaceholder')} />
        </div>

        <Field label={t('fieldGenres')} value={form.genres} onChange={(v) => updateField('genres', v)} placeholder={t('fieldGenresPlaceholder')} />

        {form.type === 'book' && (
          <Field label={t('fieldAuthors')} value={form.authors} onChange={(v) => updateField('authors', v)} placeholder={t('fieldAuthorsPlaceholder')} />
        )}
        {(form.type === 'movie' || form.type === 'series') && (
          <Field
            label={form.type === 'series' ? t('fieldDirectorsSeries') : t('fieldDirectorsMovie')}
            value={form.directors}
            onChange={(v) => updateField('directors', v)}
            placeholder={form.type === 'series' ? t('fieldDirectorsPlaceholderSeries') : t('fieldDirectorsPlaceholderMovie')}
          />
        )}

        {/* Campos específicos de libros */}
        {form.type === 'book' && (
          <>
            <Field label={t('fieldIsbn')} value={form.isbn} onChange={(v) => updateField('isbn', v)} placeholder={t('fieldIsbnPlaceholder')} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('fieldPublisher')} value={form.publisher} onChange={(v) => updateField('publisher', v)} placeholder={t('fieldPublisherPlaceholder')} />
              <Field label={t('fieldPages')} value={form.pages} onChange={(v) => updateField('pages', v)} type="number" placeholder={t('fieldPagesPlaceholder')} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('fieldSaga')} value={form.saga} onChange={(v) => updateField('saga', v)} placeholder={t('fieldSagaPlaceholder')} />
              <Field label={t('fieldSagaOrder')} value={form.saga_order} onChange={(v) => updateField('saga_order', v)} type="number" placeholder={t('fieldSagaOrderPlaceholder')} />
            </div>
          </>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('fieldTmdbId')} value={form.tmdb_id} onChange={(v) => updateField('tmdb_id', v)} type="number" />
          <Field label={t('fieldGoogleBooksId')} value={form.google_books_id} onChange={(v) => updateField('google_books_id', v)} />
        </div>

        {duplicateSlug !== null && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">{t('duplicateTitle')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`/ficha/${duplicateSlug}`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ember">
                {t('duplicateView')}
              </a>
              <a href={`/ficha/${duplicateSlug}`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/40 hover:bg-ink/5">
                {t('duplicateSuggest')}
              </a>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</p>
        )}

        {existingCard && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">{t('existingCardTitle')}</p>
            <a href={`/admin/ficha/${existingCard.cardId}`}
              className="mt-1 inline-block underline underline-offset-2 hover:text-amber-900">
              {t('existingCardLink')}
            </a>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {checkingDuplicate ? (
            <span className="text-sm text-ink/55">{t('checking')}</span>
          ) : existingCard || duplicateSlug !== null ? null : (
            <button type="submit" disabled={submitting || !form.title}
              className="rounded-lg bg-ember px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? t('submitting') : t('submit')}
            </button>
          )}
          <button type="button" onClick={() => router.back()}
            className="text-sm font-semibold text-ink/50 hover:text-ink">
            {t('cancel')}
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
        className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20" />
      {hint && <p className="mt-1 text-[11px] text-ink/55">{hint}</p>}
    </div>
  )
}
