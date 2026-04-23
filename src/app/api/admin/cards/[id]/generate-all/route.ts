import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SectionInput {
  id: string
  label: string
  order_index: number
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: cardId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })

  const { workTitle, workType, workYear, workOverview, sections } = await request.json() as {
    workTitle: string
    workType: string
    workYear: number | null
    workOverview: string | null
    sections: SectionInput[]
  }

  if (!sections || sections.length === 0) {
    return NextResponse.json({ error: 'No hay secciones' }, { status: 400 })
  }

  const typeLabel: Record<string, string> = { movie: 'película', series: 'serie', book: 'libro' }
  const sectionNames = sections.map((s) => s.label).join(', ')

  const prompt = `Eres un experto redactor de resúmenes con spoilers completos. Escribe el contenido de cada sección para la ficha de "${workTitle}"${workYear ? ` (${workYear})` : ''}, una ${typeLabel[workType] ?? workType}.${workOverview ? `\n\nSinopsis oficial: ${workOverview}` : ''}

Genera el contenido de estas secciones: ${sectionNames}.

Reglas:
- Incluye TODOS los spoilers, revelaciones y giros argumentales importantes
- Usa markdown: párrafos separados por doble salto de línea, **negrita** para nombres/términos clave
- Cada sección debe tener entre 200 y 500 palabras
- Escribe en español, estilo enciclopédico y claro
- NO incluyas advertencias de spoilers

Responde ÚNICAMENTE con un objeto JSON válido con este formato exacto (sin markdown, sin explicaciones extra):
{
${sections.map((s) => `  "${s.id}": "contenido completo de la sección ${s.label}"`).join(',\n')}
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Error de Anthropic: ${err}` }, { status: 500 })
  }

  const aiData = await res.json()
  const rawText: string = aiData.content?.[0]?.text?.trim() ?? ''

  let generated: Record<string, string>
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    generated = JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
  } catch {
    return NextResponse.json({ error: 'La IA no devolvió JSON válido', raw: rawText }, { status: 500 })
  }

  await Promise.all(
    sections.map(async (s) => {
      const content = generated[s.id]
      if (!content) return
      await (supabase.from('sections') as any).update({ content }).eq('id', s.id)
    })
  )

  // suppress unused var warning
  void cardId

  return NextResponse.json({ generated })
}
