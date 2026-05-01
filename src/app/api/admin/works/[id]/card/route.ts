import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAndStoreSeasonsForWork } from '@/lib/tmdb/fetchSeasons'

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

  if (role === 'user') {
    const { count } = await (supabase.from('cards') as any)
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de 3 fichas. Contacta con nosotros para ampliar tu acceso.' },
        { status: 403 }
      )
    }
  }

  const { data: work } = await (supabase.from('works') as any)
    .select('id, title, type, tmdb_id').eq('id', workId).maybeSingle()
  if (!work) return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 })

  const { data: existingCard } = await (supabase.from('cards') as any)
    .select('id').eq('work_id', workId).maybeSingle()
  if (existingCard) {
    return NextResponse.json({ error: 'Ya existe una ficha para esta obra', cardId: existingCard.id }, { status: 409 })
  }

  const { data: card, error: cardError } = await (supabase.from('cards') as any)
    .insert({ work_id: workId, status: 'draft', created_by: user.id })
    .select('id')
    .single()

  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 })

  const defaultSections = [
    { card_id: card.id, label: 'Inicio', short_label: 'Inicio', order_index: 0, parent_id: null, is_published: false, content: '' },
    { card_id: card.id, label: 'Nudo', short_label: 'Nudo', order_index: 1, parent_id: null, is_published: false, content: '' },
    { card_id: card.id, label: 'Desenlace', short_label: 'Desenlace', order_index: 2, parent_id: null, is_published: false, content: '' },
    { card_id: card.id, label: 'Subtramas y personajes', short_label: 'Subtramas', order_index: 3, parent_id: null, is_published: false, content: '' },
  ]

  const { error: sectionsError } = await (supabase.from('sections') as any).insert(defaultSections)
  if (sectionsError) {
    return NextResponse.json({ cardId: card.id, warning: `Secciones no creadas: ${sectionsError.message}` })
  }

  if (work.type === 'series' && work.tmdb_id) {
    try {
      await fetchAndStoreSeasonsForWork(workId, work.tmdb_id)
    } catch {
      // Non-fatal: seasons can be imported later from the editor
    }
  }

  const redirectTo = role === 'user' ? '/perfil' : `/admin/ficha/${card.id}`
  return NextResponse.json({ cardId: card.id, redirectTo })
}
