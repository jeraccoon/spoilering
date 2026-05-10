import { NextResponse, type NextRequest, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { routing } from '@/i18n/routing'
import { getOrCreateCardTranslation } from '@/lib/translate/translate-card'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const { status } = await request.json()
  if (!['draft', 'published', 'locked'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { status, is_committed: true }
  if (status === 'published') updateData.updated_at = new Date().toISOString()

  const { error } = await (supabase.from('cards') as any)
    .update(updateData)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Pre-traducción al publicar: dispara traducciones a locales no-originales en
  // background con `after` para que el editor reciba la respuesta inmediata.
  // Cuando el primer visitante extranjero llegue a la ficha, el cache ya está caliente.
  if (status === 'published') {
    after(async () => {
      try {
        await pretranslateCard(id)
      } catch (e) {
        console.error('[pretranslate] failed for card', id, e)
      }
    })
  }

  return NextResponse.json({ ok: true })
}

async function pretranslateCard(cardId: string) {
  const admin = createAdminClient()

  const { data: cardRow, error: cardErr } = await (admin.from('cards') as any)
    .select(
      'id, original_locale, summary, work:works(id, title, overview, title_translations, overview_translations), sections(id, label, short_label, content)',
    )
    .eq('id', cardId)
    .single()

  if (cardErr || !cardRow) {
    console.error('[pretranslate] could not fetch card', cardId, cardErr)
    return
  }

  const card = cardRow as {
    id: string
    original_locale: string | null
    summary: string | null
    work: {
      id: string
      title: string
      overview: string | null
      title_translations: Record<string, string> | null
      overview_translations: Record<string, string> | null
    }
    sections: Array<{
      id: string
      label: string
      short_label: string | null
      content: string | null
    }>
  }

  const originalLocale = card.original_locale ?? 'es'
  const targets = routing.locales.filter((l) => l !== originalLocale)

  if (targets.length === 0) return

  const cardForTranslate = {
    id: card.id,
    original_locale: originalLocale,
    summary: card.summary,
    sections: card.sections,
    work: {
      id: card.work.id,
      title: card.work.title,
      overview: card.work.overview,
      title_translations: card.work.title_translations ?? {},
      overview_translations: card.work.overview_translations ?? {},
    },
  }

  // Traducciones a distintos locales en paralelo (cada locale es una llamada
  // a Claude independiente, así que no competen entre sí).
  await Promise.all(
    targets.map((locale) =>
      getOrCreateCardTranslation(cardForTranslate, locale).catch((e) => {
        console.error('[pretranslate] locale failed', locale, e)
        return null
      }),
    ),
  )
}
