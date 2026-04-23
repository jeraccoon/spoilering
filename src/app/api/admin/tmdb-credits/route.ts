import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const type = request.nextUrl.searchParams.get('type') // 'movie' | 'series'
  const tmdbKey = process.env.TMDB_API_KEY

  if (!id || !type || !tmdbKey) return NextResponse.json({ directors: [] })

  const endpoint = type === 'movie'
    ? `https://api.themoviedb.org/3/movie/${id}/credits`
    : `https://api.themoviedb.org/3/tv/${id}/credits`

  try {
    const res = await fetch(`${endpoint}?api_key=${tmdbKey}`, { next: { revalidate: 3600 } })
    if (!res.ok) return NextResponse.json({ directors: [] })
    const json = await res.json()
    const crew: { name: string; job: string; department: string }[] = json.crew ?? []

    let directors: string[]
    if (type === 'movie') {
      directors = crew.filter((p) => p.job === 'Director').map((p) => p.name)
    } else {
      directors = crew
        .filter((p) => p.job === 'Director' || p.department === 'Directing')
        .map((p) => p.name)
      directors = [...new Set(directors)]
    }

    return NextResponse.json({ directors })
  } catch {
    return NextResponse.json({ directors: [] })
  }
}
