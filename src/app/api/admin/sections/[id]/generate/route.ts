import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })

  const { id } = await params
  const { workTitle, workType, workYear, sectionLabel, parentLabel, existingContent } =
    await request.json()

  const typeLabel = workType === 'movie' ? 'película' : workType === 'series' ? 'serie' : 'libro'
  const context = parentLabel ? `la sección "${parentLabel}" > "${sectionLabel}"` : `la sección "${sectionLabel}"`

  const prompt = [
    `Eres un experto redactor de resúmenes con spoilers para la web Spoilering.`,
    `Escribe un resumen detallado en español de ${context} de la ${typeLabel} "${workTitle}"${workYear ? ` (${workYear})` : ''}.`,
    `El resumen debe:`,
    `- Contener todos los spoilers importantes sin omitir nada relevante`,
    `- Estar escrito en párrafos claros y fluidos`,
    `- Ser objetivo y descriptivo, no valorativo`,
    `- Tener entre 200 y 600 palabras según la complejidad del contenido`,
    existingContent ? `\nContenido previo (mejora o amplía esto):\n${existingContent}` : '',
  ].filter(Boolean).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Error de Anthropic: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  const content = data.content?.[0]?.text ?? ''

  // Guardar el contenido generado en la sección
  await (supabase.from('sections') as any).update({ content }).eq('id', id)

  return NextResponse.json({ content })
}
