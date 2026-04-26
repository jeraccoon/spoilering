import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function toLetterboxdSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function resolveLetterboxd(imdb_id: string, title: string): Promise<string | null> {
  // Estrategia 1: redirect por IMDb ID
  try {
    const res = await fetch(`https://letterboxd.com/imdb/${imdb_id}/`, {
      redirect: 'manual',
      headers: { 'User-Agent': BROWSER_UA },
    })
    const location = res.headers.get('location') ?? ''
    if (location.includes('/film/')) {
      const url = location.startsWith('http') ? location : `https://letterboxd.com${location}`
      return url.replace(/\/$/, '') + '/'
    }
  } catch {
    // continúa a estrategia 2
  }

  // Estrategia 2: slug construido desde el título
  try {
    const slug = toLetterboxdSlug(title)
    const res = await fetch(`https://letterboxd.com/film/${slug}/`, {
      headers: { 'User-Agent': BROWSER_UA },
    })
    if (res.ok) return `https://letterboxd.com/film/${slug}/`
  } catch {
    // sin resultado
  }

  return null
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  const role: string = profile?.role ?? 'user'
  if (!['editor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: work, error: workError } = await (admin.from('works') as any)
    .select('imdb_id, tmdb_id, type, title, letterboxd_url, tracktv_url')
    .eq('id', workId)
    .single()

  if (workError || !work) {
    return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })
  }

  const { imdb_id, tmdb_id, type, title, letterboxd_url: existingLetterboxd, tracktv_url: existingTrakt } = work

  let letterboxd_url: string | null = null
  let tracktv_url: string | null = null
  let error_trakt: string | undefined

  const tasks: Promise<void>[] = []

  if (imdb_id && type === 'movie' && !existingLetterboxd) {
    tasks.push(
      resolveLetterboxd(imdb_id, title)
        .then((url) => { letterboxd_url = url })
        .catch(() => {})
    )
  }

  if (tmdb_id && (type === 'movie' || type === 'series') && !existingTrakt) {
    if (!process.env.TRAKT_API_KEY) {
      error_trakt = 'TRAKT_API_KEY no configurada'
    } else {
      const traktType = type === 'series' ? 'show' : 'movie'
      tasks.push(
        fetch(`https://api.trakt.tv/search/tmdb/${tmdb_id}?type=${traktType}`, {
          headers: {
            'trakt-api-key': process.env.TRAKT_API_KEY,
            'trakt-api-version': '2',
            'Content-Type': 'application/json',
          },
        })
          .then(async (res) => {
            console.log('[fetch-links] Trakt status:', res.status, 'workId:', workId)
            if (!res.ok) {
              const body = await res.text()
              console.log('[fetch-links] Trakt error body:', body)
              return
            }
            const data = await res.json()
            console.log('[fetch-links] Trakt response:', JSON.stringify(data).slice(0, 300))
            const hit = Array.isArray(data) ? data.find((r: any) => r.type === traktType) : null
            const slug = hit?.[traktType]?.ids?.slug ?? null
            if (!slug) return
            const base = traktType === 'show' ? 'shows' : 'movies'
            tracktv_url = `https://trakt.tv/${base}/${slug}`
          })
          .catch((err) => {
            console.log('[fetch-links] Trakt fetch error:', err)
          })
      )
    }
  }

  await Promise.allSettled(tasks)

  const found: Record<string, string> = {}
  if (letterboxd_url) found.letterboxd_url = letterboxd_url
  if (tracktv_url) found.tracktv_url = tracktv_url

  if (Object.keys(found).length > 0) {
    await (admin.from('works') as any).update(found).eq('id', workId)
  }

  return NextResponse.json({
    letterboxd_url,
    tracktv_url,
    ...(error_trakt ? { error_trakt } : {}),
  })
}
