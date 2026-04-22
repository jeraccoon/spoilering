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

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const tmdbKey = process.env.TMDB_API_KEY
  const booksKey = process.env.GOOGLE_BOOKS_API_KEY

  const [tmdbRes, booksRes] = await Promise.allSettled([
    tmdbKey
      ? fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(q)}&language=es-ES&page=1`,
          { next: { revalidate: 60 } }
        )
      : Promise.resolve(null),
    fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5${booksKey ? `&key=${booksKey}` : ''}`,
      { next: { revalidate: 60 } }
    ),
  ])

  const results: any[] = []

  if (tmdbRes.status === 'fulfilled' && tmdbRes.value) {
    const json = await tmdbRes.value.json()
    for (const item of json.results ?? []) {
      if (item.media_type === 'person') continue
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

      results.push({
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
        seasons_count: null,
        tmdb_id: item.id,
        google_books_id: null,
      })
    }
  }

  if (booksRes.status === 'fulfilled' && booksRes.value) {
    const json = await booksRes.value.json()
    for (const item of json.items ?? []) {
      const info = item.volumeInfo ?? {}
      const year = info.publishedDate
        ? parseInt(info.publishedDate.substring(0, 4))
        : null
      const poster_url =
        info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null

      results.push({
        id: `book-${item.id}`,
        type: 'book',
        title: info.title ?? 'Sin título',
        original_title: null,
        year: isNaN(year as number) ? null : year,
        poster_url,
        overview: info.description ?? null,
        genres: info.categories ?? [],
        authors: info.authors ?? [],
        directors: [],
        seasons_count: null,
        tmdb_id: null,
        google_books_id: item.id,
      })
    }
  }

  return NextResponse.json(results.slice(0, 12))
}
