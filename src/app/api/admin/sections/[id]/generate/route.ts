import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })

  const { id } = await params
  const { workTitle, workType, workYear, sectionLabel, parentLabel, existingContent } =
    await request.json()

  const typeLabel = workType === 'movie' ? 'película' : workType === 'series' ? 'serie' : 'libro'
  const context = parentLabel ? `la subsección "${parentLabel} > ${sectionLabel}"` : `la sección "${sectionLabel}"`
  const guide = getSectionGuide(sectionLabel)

  const prompt = `Eres un experto redactor de resúmenes con spoilers completos para la web Spoilering.

Escribe el contenido de ${context} para la ficha de "${workTitle}"${workYear ? ` (${workYear})` : ''}, una ${typeLabel}.

**Instrucciones específicas para esta sección:**
${guide}

**Requisitos de formato y estilo:**
- Extensión: entre 500 y 900 palabras
- Usa subtítulos ## para separar bloques temáticos dentro de la sección (mínimo 2 subtítulos)
- Escribe en **negrita** el nombre de cada personaje la primera vez que aparece en el texto
- Estilo enciclopédico, claro y objetivo — sin valoraciones ni opiniones
- Incluye TODOS los spoilers, giros argumentales, revelaciones y motivaciones de los personajes
- NO incluyas advertencias de spoilers ni introducciones genéricas como "En esta sección..."
- Escribe directamente el contenido, empezando por un subtítulo ##

${existingContent ? `\nContenido previo (mejora, amplía o corrige esto):\n${existingContent}` : ''}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Error de Anthropic: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  const content = data.content?.[0]?.text ?? ''

  await (supabase.from('sections') as any).update({ content }).eq('id', id)

  return NextResponse.json({ content })
}
