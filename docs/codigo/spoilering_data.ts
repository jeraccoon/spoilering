// ============================================================
// lib/data.ts
// Capa de acceso a datos — todas las queries y mutaciones
// Usar en Server Components y API routes
// ============================================================
import { createClient } from '@/lib/supabase/server'
import type {
  CardFull,
  CardWithWork,
  WorkWithCard,
  RevisionWithAuthor,
  CreateWorkInput,
  CreateSectionInput,
  ProposeRevisionInput,
  WorkType,
} from '@/types/database'

// ------------------------------------------------------------
// OBRAS
// ------------------------------------------------------------

export async function getWorks(type?: WorkType): Promise<WorkWithCard[]> {
  const supabase = await createClient()

  let query = supabase
    .from('works')
    .select(`
      *,
      card:cards(id, status)
    `)
    .order('title')

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw error
  return data as WorkWithCard[]
}

export async function getWorkBySlug(slug: string): Promise<WorkWithCard | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('works')
    .select(`*, card:cards(id, status)`)
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as WorkWithCard
}

export async function searchWorks(query: string): Promise<WorkWithCard[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('works')
    .select(`*, card:cards(id, status)`)
    .ilike('title', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data as WorkWithCard[]
}

export async function createWork(input: CreateWorkInput) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('works')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

// ------------------------------------------------------------
// FICHAS
// ------------------------------------------------------------

// Ficha completa con obra + secciones anidadas (para página de detalle)
export async function getCardByWorkSlug(slug: string): Promise<CardFull | null> {
  const supabase = await createClient()

  const { data: work } = await supabase
    .from('works')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!work) return null

  const { data: card, error } = await supabase
    .from('cards')
    .select(`
      *,
      work:works(*),
      sections(*)
    `)
    .eq('work_id', work.id)
    .eq('status', 'published')
    .single()

  if (error) return null

  // Anidar secciones: raíces con sus hijos
  const allSections = card.sections ?? []
  const roots = allSections
    .filter((s: any) => s.parent_id === null)
    .sort((a: any, b: any) => a.order_index - b.order_index)

  const sectionsNested = roots.map((root: any) => ({
    ...root,
    children: allSections
      .filter((s: any) => s.parent_id === root.id)
      .sort((a: any, b: any) => a.order_index - b.order_index),
  }))

  return { ...card, sections: sectionsNested } as CardFull
}

export async function getRecentCards(limit = 12): Promise<CardWithWork[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cards')
    .select(`*, work:works(*)`)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as CardWithWork[]
}

export async function createCard(workId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('cards')
    .insert({ work_id: workId, created_by: user?.id })
    .select()
    .single()

  if (error) throw error
  return data
}

// ------------------------------------------------------------
// SECCIONES
// ------------------------------------------------------------

export async function createSection(input: CreateSectionInput) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sections')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSectionContent(sectionId: string, content: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sections')
    .update({ content, is_published: true })
    .eq('id', sectionId)

  if (error) throw error
}

// ------------------------------------------------------------
// REVISIONES
// ------------------------------------------------------------

export async function getRevisionsBySection(
  sectionId: string
): Promise<RevisionWithAuthor[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('revisions')
    .select(`
      *,
      author:profiles(id, username, avatar_url, reputation),
      revision_votes(vote, user_id)
    `)
    .eq('section_id', sectionId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r: any) => ({
    ...r,
    user_vote: user
      ? (r.revision_votes?.find((v: any) => v.user_id === user.id)?.vote ?? null)
      : null,
    revision_votes: undefined, // limpiar del objeto final
  })) as RevisionWithAuthor[]
}

export async function proposeRevision(input: ProposeRevisionInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Obtener contenido actual de la sección
  const { data: section } = await supabase
    .from('sections')
    .select('content')
    .eq('id', input.section_id)
    .single()

  if (!section) throw new Error('Sección no encontrada')

  const { data, error } = await supabase
    .from('revisions')
    .insert({
      section_id: input.section_id,
      proposed_by: user.id,
      content_before: section.content,
      content_after: input.content_after,
      summary: input.summary,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function voteRevision(revisionId: string, vote: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Upsert: si ya votó, actualiza; si no, inserta
  const { error: voteError } = await supabase
    .from('revision_votes')
    .upsert({ revision_id: revisionId, user_id: user.id, vote })

  if (voteError) throw voteError

  // Actualizar contadores en la revisión
  const { data: votes } = await supabase
    .from('revision_votes')
    .select('vote')
    .eq('revision_id', revisionId)

  const votes_up = votes?.filter(v => v.vote).length ?? 0
  const votes_down = votes?.filter(v => !v.vote).length ?? 0

  const { error: updateError } = await supabase
    .from('revisions')
    .update({ votes_up, votes_down })
    .eq('id', revisionId)

  if (updateError) throw updateError
}

// Admin: aprobar o rechazar revisión manualmente
export async function resolveRevision(
  revisionId: string,
  action: 'approved' | 'rejected'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  if (action === 'approved') {
    const { data: revision } = await supabase
      .from('revisions')
      .select('section_id, content_after')
      .eq('id', revisionId)
      .single()

    if (revision) {
      await supabase
        .from('sections')
        .update({ content: revision.content_after })
        .eq('id', revision.section_id)
    }
  }

  await supabase
    .from('revisions')
    .update({
      status: action,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', revisionId)
}

// ------------------------------------------------------------
// USUARIOS Y PERFIL
// ------------------------------------------------------------

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function getProfileByUsername(username: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  return data
}

// ------------------------------------------------------------
// IA — Registro de generaciones
// ------------------------------------------------------------

export async function logAiGeneration(params: {
  work_id?: string
  section_id?: string
  prompt_used: string
  content_out: string
  accepted?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('ai_generations').insert({
    ...params,
    generated_by: user?.id ?? null,
    model: 'claude-sonnet-4-20250514',
  })
}
