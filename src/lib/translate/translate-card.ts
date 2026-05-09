import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

const LOCALE_NAMES: Record<string, string> = {
  es: 'Spanish',
  en: 'English',
}

interface SectionInput {
  id: string
  label: string
  short_label: string | null
  content: string | null
}

interface WorkInput {
  id: string
  title: string
  overview: string | null
  title_translations?: Record<string, string> | null
  overview_translations?: Record<string, string> | null
}

interface CardInput {
  id: string
  original_locale: string
  summary: string | null
  sections: SectionInput[]
  work: WorkInput
}

export interface TranslatedCard {
  /** Per-section translation (label + content). Includes both cached and freshly-generated. */
  sectionTranslations: Map<
    string,
    { label: string; short_label: string | null; content: string | null }
  >
  /** Translated `cards.summary`, or null if there's nothing to translate. */
  summaryTranslation: string | null
  /** Translated work title, falling back to the original if no translation is available. */
  workTitleTranslation: string
  /** Translated work overview, falling back to original. */
  workOverviewTranslation: string | null
  /** Whether at least one new piece was generated (vs all served from cache). */
  generatedSomething: boolean
}

interface ClaudeTranslationResult {
  title?: string
  overview?: string
  summary?: string
  sections?: Array<{
    section_id: string
    label: string
    short_label: string | null
    content: string | null
  }>
}

/**
 * Returns translated content for a card if `targetLocale` differs from
 * `card.original_locale`. Uses Supabase as a cache; on cache miss calls
 * Claude (claude-sonnet-4-6) once to generate everything missing in bulk
 * and persists the result.
 *
 * Returns null when no translation is needed (locales match).
 */
export async function getOrCreateCardTranslation(
  card: CardInput,
  targetLocale: string,
): Promise<TranslatedCard | null> {
  if (targetLocale === card.original_locale) return null

  const supabase = createAdminClient()
  const sectionIds = card.sections.map((s) => s.id)

  const [sectionRes, cardRes] = await Promise.all([
    sectionIds.length > 0
      ? (supabase.from('section_translations') as any)
          .select('section_id, label, short_label, content')
          .eq('locale', targetLocale)
          .in('section_id', sectionIds)
      : Promise.resolve({ data: [] }),
    (supabase.from('card_translations') as any)
      .select('summary')
      .eq('locale', targetLocale)
      .eq('card_id', card.id)
      .maybeSingle(),
  ])

  const sectionMap = new Map<
    string,
    { label: string; short_label: string | null; content: string | null }
  >()
  for (const row of (sectionRes.data ?? []) as any[]) {
    sectionMap.set(row.section_id, {
      label: row.label,
      short_label: row.short_label,
      content: row.content,
    })
  }

  const cachedSummary: string | null = cardRes.data?.summary ?? null
  const titleCached = card.work.title_translations?.[targetLocale]
  const overviewCached = card.work.overview_translations?.[targetLocale]

  const missingSections = card.sections.filter((s) => !sectionMap.has(s.id))
  const needsSummary = !!card.summary && !cachedSummary
  const needsTitle = !titleCached
  const needsOverview = !!card.work.overview && !overviewCached

  let generated: ClaudeTranslationResult | null = null
  if (
    missingSections.length > 0 ||
    needsSummary ||
    needsTitle ||
    needsOverview
  ) {
    generated = await translateWithClaude({
      sourceLocale: card.original_locale,
      targetLocale,
      title: needsTitle ? card.work.title : null,
      overview: needsOverview ? (card.work.overview ?? null) : null,
      summary: needsSummary ? (card.summary ?? null) : null,
      sections: missingSections,
    })

    if (generated) {
      await persistTranslations({
        cardId: card.id,
        workId: card.work.id,
        targetLocale,
        generated,
        existingTitleTrans: card.work.title_translations ?? {},
        existingOverviewTrans: card.work.overview_translations ?? {},
      })

      for (const s of generated.sections ?? []) {
        sectionMap.set(s.section_id, {
          label: s.label,
          short_label: s.short_label,
          content: s.content,
        })
      }
    }
  }

  return {
    sectionTranslations: sectionMap,
    summaryTranslation: generated?.summary ?? cachedSummary,
    workTitleTranslation: generated?.title ?? titleCached ?? card.work.title,
    workOverviewTranslation:
      generated?.overview ?? overviewCached ?? card.work.overview,
    generatedSomething: generated !== null,
  }
}

async function translateWithClaude(input: {
  sourceLocale: string
  targetLocale: string
  title: string | null
  overview: string | null
  summary: string | null
  sections: SectionInput[]
}): Promise<ClaudeTranslationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[translate-card] ANTHROPIC_API_KEY not set')
    return null
  }

  const sourceLang = LOCALE_NAMES[input.sourceLocale] ?? input.sourceLocale
  const targetLang = LOCALE_NAMES[input.targetLocale] ?? input.targetLocale

  const fields: string[] = []
  if (input.title) fields.push(`### Title (single line)\n${input.title}`)
  if (input.overview)
    fields.push(`### Overview (single paragraph)\n${input.overview}`)
  if (input.summary) fields.push(`### Summary (TL;DR)\n${input.summary}`)
  if (input.sections.length > 0) {
    const sectionsBlock = input.sections
      .map(
        (s) =>
          `### Section [id=${s.id}]\n` +
          `LABEL: ${s.label}\n` +
          (s.short_label ? `SHORT_LABEL: ${s.short_label}\n` : '') +
          `CONTENT (markdown, may be empty):\n${s.content ?? '(empty)'}`,
      )
      .join('\n\n')
    fields.push(`### Sections\n${sectionsBlock}`)
  }

  const expectedKeys: string[] = []
  if (input.title) expectedKeys.push('"title": "<translated title>"')
  if (input.overview) expectedKeys.push('"overview": "<translated overview>"')
  if (input.summary) expectedKeys.push('"summary": "<translated summary>"')
  if (input.sections.length > 0) {
    expectedKeys.push(
      `"sections": [\n    { "section_id": "<id>", "label": "...", "short_label": "..." | null, "content": "..." | null }\n  ]`,
    )
  }

  const prompt = `You are a professional translator for Spoilering, a community-driven website that hosts spoiler-rich summaries of films, TV shows and books.

Translate the following content from ${sourceLang} to ${targetLang}.

STRICT RULES:
1. Preserve markdown structure exactly: headings (##, ###), **bold**, _italic_, lists, links, blockquotes, horizontal rules.
2. Preserve proper nouns: character names, place names, work titles. Use the canonical English title for the work if there's a widely-known one (e.g. "El Padrino" → "The Godfather"); otherwise keep the original title.
3. Preserve editorial style: encyclopedic, neutral, factual. Do not add commentary or warnings.
4. Translate section LABELs naturally (e.g. "Inicio" → "Setup", "Nudo" → "Conflict", "Desenlace" → "Resolution", "Subtramas" → "Subplots", "Subtramas y personajes" → "Subplots and characters").
5. If a CONTENT is "(empty)", return null for that section's content.
6. NEVER omit any section from the input. Return one entry per input section.

OUTPUT FORMAT
Return ONLY a single JSON object wrapped in <json>...</json> tags. No prose, no commentary outside the tags.
The JSON must contain exactly these keys (in this order):

<json>
{
  ${expectedKeys.join(',\n  ')}
}
</json>

CONTENT TO TRANSLATE:

${fields.join('\n\n')}
`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[translate-card] Anthropic error:', res.status, err)
    return null
  }

  const data = await res.json()
  const text: string = data.content?.[0]?.text ?? ''
  const match = text.match(/<json>([\s\S]*?)<\/json>/)
  if (!match) {
    console.error(
      '[translate-card] Response missing <json> wrapper. Got:',
      text.slice(0, 500),
    )
    return null
  }
  try {
    return JSON.parse(match[1].trim()) as ClaudeTranslationResult
  } catch (e) {
    console.error('[translate-card] JSON parse error:', e)
    console.error('[translate-card] Raw json block:', match[1].slice(0, 500))
    return null
  }
}

async function persistTranslations(args: {
  cardId: string
  workId: string
  targetLocale: string
  generated: ClaudeTranslationResult
  existingTitleTrans: Record<string, string>
  existingOverviewTrans: Record<string, string>
}) {
  const supabase = createAdminClient()
  const tasks: Promise<unknown>[] = []

  if (args.generated.sections && args.generated.sections.length > 0) {
    const rows = args.generated.sections.map((s) => ({
      section_id: s.section_id,
      locale: args.targetLocale,
      label: s.label,
      short_label: s.short_label,
      content: s.content,
      source: 'ai',
    }))
    tasks.push(
      (supabase.from('section_translations') as any).upsert(rows, {
        onConflict: 'section_id,locale',
      }),
    )
  }

  if (args.generated.summary) {
    tasks.push(
      (supabase.from('card_translations') as any).upsert(
        {
          card_id: args.cardId,
          locale: args.targetLocale,
          summary: args.generated.summary,
          source: 'ai',
        },
        { onConflict: 'card_id,locale' },
      ),
    )
  }

  if (args.generated.title || args.generated.overview) {
    const updates: Record<string, unknown> = {}
    if (args.generated.title) {
      updates.title_translations = {
        ...args.existingTitleTrans,
        [args.targetLocale]: args.generated.title,
      }
    }
    if (args.generated.overview) {
      updates.overview_translations = {
        ...args.existingOverviewTrans,
        [args.targetLocale]: args.generated.overview,
      }
    }
    tasks.push(
      (supabase.from('works') as any).update(updates).eq('id', args.workId),
    )
  }

  await Promise.allSettled(tasks)
}
