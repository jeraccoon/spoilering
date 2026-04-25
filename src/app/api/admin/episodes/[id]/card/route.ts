import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: episodeId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['editor', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: episode } = await (admin.from('episodes') as any)
    .select('id, episode_number, name, card_id, season:seasons(id, season_number, work_id)')
    .eq('id', episodeId)
    .single()

  if (!episode) return NextResponse.json({ error: 'Episodio no encontrado' }, { status: 404 })
  if (episode.card_id) return NextResponse.json({ error: 'Este episodio ya tiene ficha' }, { status: 400 })

  const season = episode.season
  if (!season?.work_id) return NextResponse.json({ error: 'No se pudo obtener la temporada' }, { status: 500 })

  const { data: work } = await (admin.from('works') as any)
    .select('id, title, type, year')
    .eq('id', season.work_id)
    .single()

  if (!work) return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })

  const episodeLabel = `T${season.season_number}E${episode.episode_number}`
  const episodeName = episode.name ? ` - ${episode.name}` : ''
  const cardTitle = `${work.title} (${episodeLabel}${episodeName})`
  void cardTitle

  const { data: card, error: cardError } = await (admin.from('cards') as any)
    .insert({
      work_id: season.work_id,
      episode_id: episodeId,
      status: 'draft',
      is_complete: false,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 })

  const sectionTitle = `${work.title} — ${episodeLabel}${episodeName}`
  const defaultSections = [
    { card_id: card.id, label: `Inicio (${sectionTitle})`, short_label: 'Inicio', order_index: 0, parent_id: null, is_published: false, content: '' },
    { card_id: card.id, label: `Nudo (${sectionTitle})`, short_label: 'Nudo', order_index: 1, parent_id: null, is_published: false, content: '' },
    { card_id: card.id, label: `Desenlace (${sectionTitle})`, short_label: 'Desenlace', order_index: 2, parent_id: null, is_published: false, content: '' },
    { card_id: card.id, label: `Subtramas y personajes (${sectionTitle})`, short_label: 'Subtramas', order_index: 3, parent_id: null, is_published: false, content: '' },
  ]

  const { error: sectionsError } = await (admin.from('sections') as any).insert(defaultSections)
  if (sectionsError) {
    return NextResponse.json({ error: `Secciones no creadas: ${sectionsError.message}` }, { status: 500 })
  }

  await (admin.from('episodes') as any)
    .update({ card_id: card.id })
    .eq('id', episodeId)

  return NextResponse.json({ ok: true, cardId: card.id })
}
