import { NextResponse, type NextRequest } from 'next/server'

const TMDB_GENRES: Record<number, string> = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
  80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
  14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
  9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficción',
  53: 'Thriller', 10752: 'Bélica', 37: 'Western',
  10759: 'Acción y aventura', 10762: 'Infantil', 10765: 'Sci-Fi y fantasía',
  10766: 'Telenovela', 10768: 'Guerra y política',
}

function bookDedupKey(title: string, authors: string[]): string {
  const t = title.toLowerCase().replace(/[^a-z0-9]/g, '')
  const a = (authors[0] ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${t}|${a}`
}

function bookScore(item: any): number {
  return (item.poster_url ? 2 : 0) + (item.overview ? 2 : 0) + (item.isbn ? 1 : 0)
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const type = request.nextUrl.searchParams.get('type') // 'movie' | 'series' | 'book' | null

  const tmdbKey = process.env.TMDB_API_KEY
  const booksKey = process.env.GOOGLE_BOOKS_API_KEY

  const wantTmdb = !type || type === 'movie' || type === 'series'
  const wantBooks = !type || type === 'book'

  function buildBooksQuery(raw: string): string {
    if (raw.toLowerCase().includes('autor:')) {
      const [titlePart, authorPart] = raw.toLowerCase().split('autor:')
      const parts: string[] = []
      if (titlePart.trim()) parts.push(`intitle:${titlePart.trim()}`)
      if (authorPart.trim()) parts.push(`inauthor:${authorPart.trim()}`)
      return parts.join('+')
    }
    return raw
  }

  const booksQuery = buildBooksQuery(q)
  const booksBase = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(booksQuery)}&maxResults=6&printType=books&orderBy=relevance${booksKey ? `&key=${booksKey}` : ''}`
  const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=6&fields=key,title,author_name,first_publish_year,isbn,cover_i,subject,number_of_pages_median`

  const [tmdbRes, booksEsRes, booksAllRes, olRes] = await Promise.allSettled([
    wantTmdb && tmdbKey
      ? fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(q)}&language=es-ES&page=1`,
          { next: { revalidate: 60 } }
        )
      : Promise.resolve(null),
    wantBooks
      ? fetch(`${booksBase}&langRestrict=es`, { next: { revalidate: 60 } })
      : Promise.resolve(null),
    wantBooks
      ? fetch(booksBase, { next: { revalidate: 60 } })
      : Promise.resolve(null),
    wantBooks
      ? fetch(olUrl, { next: { revalidate: 60 } })
      : Promise.resolve(null),
  ])

  const results: any[] = []

  // TMDb — películas y series
  if (tmdbRes.status === 'fulfilled' && tmdbRes.value) {
    const json = await tmdbRes.value.json()
    const tvItems: any[] = []

    for (const item of json.results ?? []) {
      if (item.media_type === 'person') continue
      if (type === 'movie' && item.media_type !== 'movie') continue
      if (type === 'series' && item.media_type !== 'tv') continue
      const isMovie = item.media_type === 'movie'
      const title = isMovie ? item.title : item.name
      const original_title = isMovie ? item.original_title : item.original_name
      const date = isMovie ? item.release_date : item.first_air_date
      const year = date ? parseInt(date.substring(0, 4)) : null
      const poster_url = item.poster_path
        ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
        : null
      const genres = (item.genre_ids ?? [])
        .map((id: number) => TMDB_GENRES[id])
        .filter(Boolean)
      const entry = {
        id: `tmdb-${item.id}`,
        type: isMovie ? 'movie' : 'series',
        title,
        original_title: original_title !== title ? original_title : null,
        year,
        poster_url,
        overview: item.overview || null,
        genres,
        authors: [],
        directors: [],
        seasons_count: null as number | null,
        tmdb_id: item.id,
        google_books_id: null,
        open_library_id: null,
        isbn: null,
      }
      results.push(entry)
      if (!isMovie) tvItems.push(entry)
    }

    // Enriquecer series con number_of_seasons desde el endpoint de detalles
    if (tvItems.length > 0 && tmdbKey) {
      const detailResults = await Promise.allSettled(
        tvItems.map((entry) =>
          fetch(
            `https://api.themoviedb.org/3/tv/${entry.tmdb_id}?api_key=${tmdbKey}&language=es-ES`,
            { next: { revalidate: 3600 } },
          ).then((r) => (r.ok ? r.json() : null)),
        ),
      )
      for (let i = 0; i < tvItems.length; i++) {
        const res = detailResults[i]
        if (res.status === 'fulfilled' && res.value?.number_of_seasons) {
          tvItems[i].seasons_count = res.value.number_of_seasons
        }
      }
    }
  }

  // Libros: recoger candidatos de Google Books y Open Library, luego deduplicar
  const bookCandidates: any[] = []
  const seenGoogleIds = new Set<string>()

  function mapGoogleBook(item: any) {
    if (seenGoogleIds.has(item.id)) return
    seenGoogleIds.add(item.id)
    const info = item.volumeInfo ?? {}
    const rawDate: string = info.publishedDate ?? ''
    const yearNum = rawDate ? parseInt(rawDate.match(/^\d{4}/)?.[0] ?? '') : NaN
    const year = isNaN(yearNum) ? null : yearNum
    const poster_url = info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null
    const identifiers: { type: string; identifier: string }[] = info.industryIdentifiers ?? []
    const isbn =
      identifiers.find((i) => i.type === 'ISBN_13')?.identifier ??
      identifiers.find((i) => i.type === 'ISBN_10')?.identifier ??
      null
    bookCandidates.push({
      id: `book-${item.id}`,
      type: 'book',
      title: info.title ?? 'Sin título',
      original_title: null,
      year,
      poster_url,
      overview: info.description ?? null,
      genres: info.categories ?? [],
      authors: info.authors ?? [],
      directors: [],
      seasons_count: null,
      tmdb_id: null,
      google_books_id: item.id,
      open_library_id: null,
      isbn,
      publisher: info.publisher ?? null,
      pages: info.pageCount ? parseInt(info.pageCount) : null,
    })
  }

  if (booksEsRes.status === 'fulfilled' && booksEsRes.value) {
    const json = await booksEsRes.value.json()
    for (const item of json.items ?? []) mapGoogleBook(item)
  }
  if (booksAllRes.status === 'fulfilled' && booksAllRes.value) {
    const json = await booksAllRes.value.json()
    for (const item of json.items ?? []) mapGoogleBook(item)
  }

  // Open Library
  if (olRes.status === 'fulfilled' && olRes.value) {
    try {
      const json = await olRes.value.json()
      for (const item of json.docs ?? []) {
        const title: string = item.title ?? 'Sin título'
        const authors: string[] = item.author_name ?? []
        const coverId: number | undefined = item.cover_i
        const poster_url = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
          : null
        bookCandidates.push({
          id: `ol-${item.key}`,
          type: 'book',
          title,
          original_title: null,
          year: item.first_publish_year ?? null,
          poster_url,
          overview: null,
          genres: (item.subject as string[] | undefined)?.slice(0, 5) ?? [],
          authors,
          directors: [],
          seasons_count: null,
          tmdb_id: null,
          google_books_id: null,
          open_library_id: item.key ?? null,
          isbn: (item.isbn as string[] | undefined)?.[0] ?? null,
        })
      }
    } catch {}
  }

  // Deduplicar libros por título normalizado + primer autor
  const bookMap = new Map<string, any>()
  for (const candidate of bookCandidates) {
    const key = bookDedupKey(candidate.title, candidate.authors)
    const existing = bookMap.get(key)
    if (!existing || bookScore(candidate) > bookScore(existing)) {
      bookMap.set(key, candidate)
    }
  }
  results.push(...bookMap.values())

  return NextResponse.json(results.slice(0, 12))
}
