import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SectionInput {
  id: string
  label: string
  order_index: number
}

const SECTION_GUIDES: Record<string, string> = {
  inicio: `Cubre: la situación inicial del protagonista y su mundo, el detonante o incidente incitador que rompe el equilibrio, la presentación de los personajes principales con sus motivaciones, y el planteamiento del conflicto central. Incluye el contexto necesario para entender la historia.`,
  nudo: `Cubre: el desarrollo del conflicto central y sus complicaciones, los obstáculos que enfrenta el protagonista, los giros argumentales más importantes, los cambios en las relaciones entre personajes, los momentos de clímax parciales, y cómo evolucionan las motivaciones de cada personaje a lo largo de la trama.`,
  desenlace: `Cubre: la resolución del conflicto central, el clímax final y sus consecuencias, el destino de cada personaje principal, las revelaciones finales y giros de último momento, y el estado del mundo al finalizar la historia. Incluye el significado o mensaje de la obra si es relevante.`,
  subtramas: `Cubre: las tramas secundarias y su relación con la trama principal, el desarrollo y arco de los personajes secundarios, los temas recurrentes y simbolismos importantes, las relaciones entre personajes más allá del protagonista, y cualquier elemento relevante que no encaje en las secciones anteriores.`,
  'subtramas y personajes': `Cubre: las tramas secundarias y su relación con la trama principal, el desarrollo y arco de los personajes secundarios, los temas recurrentes y simbolismos importantes, las relaciones entre personajes más allá del protagonista, y cualquier elemento relevante que no encaje en las secciones anteriores.`,
}

function getSectionGuide(label: string): string {
  const key = label.toLowerCase().trim()
  return SECTION_GUIDES[key] ?? `Cubre los aspectos más relevantes de esta sección con todos los detalles y spoilers necesarios.`
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

  const sectionInstructions = sections.map((s) => {
    const guide = getSectionGuide(s.label)
    return `### Sección: "${s.label}" (id: "${s.id}")
${guide}

Requisitos: entre 500 y 900 palabras, mínimo 2 subtítulos ## dentro del contenido, escribe en **negrita** el nombre de cada personaje la primera vez que aparece, empieza directamente con un subtítulo ##.`
  }).join('\n\n')

  const prompt = `Eres un experto redactor de resúmenes con spoilers completos para la web Spoilering.

Escribe el contenido de cada sección para la ficha de "${workTitle}"${workYear ? ` (${workYear})` : ''}, una ${typeLabel[workType] ?? workType}.${workOverview ? `\n\nSinopsis oficial: ${workOverview}` : ''}

**Instrucciones por sección:**
${sectionInstructions}

**Requisitos generales de estilo:**
- Estilo enciclopédico, claro y objetivo — sin valoraciones ni opiniones
- Incluye TODOS los spoilers, giros argumentales, revelaciones y motivaciones de los personajes
- NO incluyas advertencias de spoilers ni introducciones genéricas
- Escribe en español

Responde ÚNICAMENTE con un objeto JSON válido con este formato exacto (sin markdown envolvente, sin explicaciones extra):
{
${sections.map((s) => `  "${s.id}": "contenido completo de la sección ${s.label} con saltos de línea como \\n"`).join(',\n')}
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
      max_tokens: 8000,
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
