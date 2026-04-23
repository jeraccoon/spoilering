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

async function generateSection(
  apiKey: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  section: SectionInput,
  workTitle: string,
  workType: string,
  workYear: number | null,
): Promise<{ id: string; content: string; error?: string }> {
  const typeLabel = workType === 'movie' ? 'película' : workType === 'series' ? 'serie' : 'libro'
  const guide = getSectionGuide(section.label)

  const prompt = `Eres un experto redactor de resúmenes con spoilers completos para la web Spoilering.

Escribe el contenido de la sección "${section.label}" para la ficha de "${workTitle}"${workYear ? ` (${workYear})` : ''}, una ${typeLabel}.

**Instrucciones específicas para esta sección:**
${guide}

**Requisitos de formato y estilo:**
- Extensión: entre 500 y 900 palabras
- Usa subtítulos ## para separar bloques temáticos dentro de la sección (mínimo 2 subtítulos)
- Escribe en **negrita** el nombre de cada personaje la primera vez que aparece en el texto
- Estilo enciclopédico, claro y objetivo — sin valoraciones ni opiniones
- Incluye TODOS los spoilers, giros argumentales, revelaciones y motivaciones de los personajes
- NO incluyas advertencias de spoilers ni introducciones genéricas como "En esta sección..."
- Escribe directamente el contenido, empezando por un subtítulo ##`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return { id: section.id, content: '', error: `Error de Anthropic: ${err}` }
  }

  const data = await res.json()
  const content: string = data.content?.[0]?.text ?? ''

  await (supabase.from('sections') as any).update({ content }).eq('id', section.id)

  return { id: section.id, content }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: cardId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })

  const { workTitle, workType, workYear, sections } = await request.json() as {
    workTitle: string
    workType: string
    workYear: number | null
    sections: SectionInput[]
  }

  if (!sections || sections.length === 0) {
    return NextResponse.json({ error: 'No hay secciones' }, { status: 400 })
  }

  void cardId

  const results = await Promise.allSettled(
    sections.map((s) => generateSection(apiKey, supabase, s, workTitle, workType, workYear))
  )

  const generated: Record<string, string> = {}
  const errors: string[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.error) errors.push(result.value.error)
      else generated[result.value.id] = result.value.content
    } else {
      errors.push(String(result.reason))
    }
  }

  return NextResponse.json({ generated, errors: errors.length ? errors : undefined })
}
