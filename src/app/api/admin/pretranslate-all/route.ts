import { NextResponse, after, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { routing } from '@/i18n/routing'
import { getOrCreateCardTranslation } from '@/lib/translate/translate-card'

/**
 * Pre-traduce TODAS las fichas publicadas a todos los locales no-original.
 * Pensado para arrancar el cache después de un deploy o tras una nueva
 * implantación de un locale. Solo admin/editor.
 *
 * Se ejecuta en background con `after()`. La respuesta vuelve inmediatamente
 * con el número de fichas que se van a procesar.
 *
 * Idempotente: las fichas ya cacheadas no llaman a Claude (cache hit).
 */
export async function POST(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role').eq('id', user.id).single()
  if (!['admin', 'editor'].includes((profile as any)?.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: cards, error } = await (admin.from('cards') as any)
    .select(
      'id, original_locale, summary, work:works(id, title, overview, title_translations, overview_translations), sections(id, label, short_label, content)',
    )
    .eq('status', 'published')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const list = (cards ?? []) as Array<{
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
  }>

  // Disparar todas las traducciones en background. Cada (card, locale) es una
  // promesa que llama a getOrCreateCardTranslation. Las cacheadas son no-ops.
  after(async () => {
    let processed = 0
    let errors = 0
    for (const card of list) {
      const originalLocale = card.original_locale ?? 'es'
      const targets = routing.locales.filter((l) => l !== originalLocale)
      for (const target of targets) {
        try {
          await getOrCreateCardTranslation(
            {
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
            },
            target,
          )
          processed++
        } catch (e) {
          errors++
          console.error('[pretranslate-all] failed', card.id, target, e)
        }
      }
    }
    console.log(`[pretranslate-all] done: ${processed} translations, ${errors} errors`)
  })

  return NextResponse.json({
    queued: list.length,
    locales: routing.locales.length - 1,
    message: 'Pre-traducción lanzada en background. Mira los logs del servidor para el progreso.',
  })
}
