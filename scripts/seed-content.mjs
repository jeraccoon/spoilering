/**
 * seed-content.mjs
 * Crea fichas completas (work + card + secciones generadas con IA + publicadas)
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed-content.mjs
 *
 * Encuentra la service role key en:
 *   Supabase Dashboard → Project Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ─── Leer .env.local ────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const SUPABASE_URL       = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE   = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
const TMDB_API_KEY       = env.TMDB_API_KEY
const ANTHROPIC_API_KEY  = env.ANTHROPIC_API_KEY

if (!SUPABASE_SERVICE) {
  console.error('\n❌  SUPABASE_SERVICE_ROLE_KEY no encontrada.')
  console.error('    Pásala así:')
  console.error('    SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seed-content.mjs\n')
  console.error('    Encuéntrala en: Supabase → Project Settings → API → service_role\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Lista de obras ──────────────────────────────────────────────────────────

// Películas — TMDb IDs verificados
const MOVIES = [
  { tmdb_id: 238,    title: 'El Padrino',                             year: 1972 },
  { tmdb_id: 578,    title: 'Tiburón',                                year: 1975 },
  { tmdb_id: 348,    title: 'Alien: El octavo pasajero',              year: 1979 },
  { tmdb_id: 78,     title: 'Blade Runner',                           year: 1982 },
  { tmdb_id: 218,    title: 'Terminator',                             year: 1984 },
  { tmdb_id: 207,    title: 'El club de los poetas muertos',          year: 1989 },
  { tmdb_id: 274,    title: 'El silencio de los corderos',            year: 1991 },
  { tmdb_id: 13,     title: 'Forrest Gump',                           year: 1994 },
  { tmdb_id: 680,    title: 'Pulp Fiction',                           year: 1994 },
  { tmdb_id: 745,    title: 'El sexto sentido',                       year: 1999 },
  { tmdb_id: 603,    title: 'Matrix',                                  year: 1999 },
  { tmdb_id: 641,    title: 'Réquiem por un sueño',                   year: 2000 },
  { tmdb_id: 120,    title: 'El señor de los anillos: La comunidad del anillo', year: 2001 },
  { tmdb_id: 129,    title: 'El viaje de Chihiro',                    year: 2001 },
  { tmdb_id: 670,    title: 'Oldboy',                                  year: 2003 },
  { tmdb_id: 73,     title: 'Brokeback Mountain',                     year: 2005 },
  { tmdb_id: 6977,   title: 'No Country for Old Men',                 year: 2007 },
  { tmdb_id: 155,    title: 'El caballero oscuro',                    year: 2008 },
  { tmdb_id: 12405,  title: 'Slumdog Millionaire',                    year: 2008 },
  { tmdb_id: 27205,  title: 'Origen',                                  year: 2010 },
  { tmdb_id: 152601, title: 'Her',                                     year: 2013 },
  { tmdb_id: 157336, title: 'Interstellar',                           year: 2014 },
  { tmdb_id: 496243, title: 'Parásitos',                              year: 2019 },
  { tmdb_id: 581726, title: 'Nomadland',                              year: 2020 },
  { tmdb_id: 545611, title: 'Todo a la vez en todas partes',          year: 2022 },
]

// Series — TMDb IDs verificados
const SERIES = [
  { tmdb_id: 1396,   title: 'Breaking Bad',      year: 2008 },
  { tmdb_id: 1399,   title: 'Juego de Tronos',   year: 2011 },
  { tmdb_id: 42009,  title: 'Black Mirror',       year: 2011 },
  { tmdb_id: 46648,  title: 'True Detective',     year: 2014 },
  { tmdb_id: 66732,  title: 'Stranger Things',    year: 2016 },
  { tmdb_id: 70523,  title: 'Dark',               year: 2017 },
  { tmdb_id: 63333,  title: 'Succession',         year: 2018 },
  { tmdb_id: 87108,  title: 'Chernobyl',          year: 2019 },
  { tmdb_id: 95396,  title: 'Severance',          year: 2022 },
  { tmdb_id: 100088, title: 'The Last of Us',     year: 2023 },
]

// Libros — metadata manual (sin ID externo, para no depender de APIs)
const BOOKS = [
  {
    title: '1984', original_title: 'Nineteen Eighty-Four', year: 1949,
    authors: ['George Orwell'], genres: ['Distopía', 'Ciencia ficción', 'Política'],
    overview: 'En un futuro totalitario, Winston Smith vive bajo la vigilancia omnipresente del Gran Hermano y el Partido. Trabajador del Ministerio de la Verdad, reescribe la historia según las directrices del régimen. Pero Winston guarda un secreto: odia al Partido y sueña con la rebelión.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
  },
  {
    title: 'El alquimista', original_title: 'O Alquimista', year: 1988,
    authors: ['Paulo Coelho'], genres: ['Fábula', 'Filosofía', 'Aventura'],
    overview: 'Santiago, un joven pastor andaluz, sueña repetidamente con un tesoro escondido en las pirámides de Egipto. Guiado por ese sueño y por una serie de encuentros con personajes que le hablan de la Leyenda Personal, emprende un viaje de autodescubrimiento.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg',
  },
  {
    title: 'Cien años de soledad', year: 1967,
    authors: ['Gabriel García Márquez'], genres: ['Realismo mágico', 'Épica familiar', 'Literatura latinoamericana'],
    overview: 'La saga de los Buendía a lo largo de seis generaciones en el mítico pueblo de Macondo. Una novela que mezcla lo real y lo maravilloso para retratar la historia de América Latina, desde su fundación hasta su decadencia.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780060883287-L.jpg',
  },
  {
    title: 'El gran Gatsby', original_title: 'The Great Gatsby', year: 1925,
    authors: ['F. Scott Fitzgerald'], genres: ['Drama', 'Clásico americano', 'Romance'],
    overview: 'En los dorados años veinte, Nick Carraway se muda a Long Island y se convierte en vecino del misterioso y opulento Jay Gatsby, famoso por sus extravagantes fiestas. Gatsby oculta una obsesión: recuperar a Daisy Buchanan, el amor de su juventud.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
  },
  {
    title: 'Matar a un ruiseñor', original_title: 'To Kill a Mockingbird', year: 1960,
    authors: ['Harper Lee'], genres: ['Drama', 'Clásico', 'Racismo', 'Justicia'],
    overview: 'En un pueblo del sur de Estados Unidos durante la Gran Depresión, la niña Scout Finch ve cómo su padre Atticus, abogado, defiende a Tom Robinson, un hombre negro acusado injustamente de violar a una mujer blanca.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780061743528-L.jpg',
  },
  {
    title: 'Harry Potter y la piedra filosofal', original_title: "Harry Potter and the Philosopher's Stone", year: 1997,
    authors: ['J.K. Rowling'], genres: ['Fantasía', 'Aventura', 'Juvenil'],
    overview: 'Harry Potter descubre el día de su undécimo cumpleaños que es un mago y que tiene plaza en el Colegio Hogwarts de Magia y Hechicería. Allí aprende magia, hace amigos y descubre la verdad sobre la muerte de sus padres y el oscuro mago que los mató.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg',
  },
  {
    title: 'La sombra del viento', year: 2001,
    authors: ['Carlos Ruiz Zafón'], genres: ['Misterio', 'Thriller', 'Drama histórico'],
    overview: 'En la Barcelona de la posguerra, el joven Daniel Sempere descubre en el Cementerio de los Libros Olvidados una novela de Julián Carax. Al intentar encontrar más obras del autor, Daniel descubre que alguien está destruyendo todos los libros de Carax y que hay un misterio oscuro detrás.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780143034902-L.jpg',
  },
  {
    title: 'Sapiens: De animales a dioses', original_title: 'Sapiens: A Brief History of Humankind', year: 2011,
    authors: ['Yuval Noah Harari'], genres: ['Historia', 'Antropología', 'Ensayo'],
    overview: 'Un recorrido por la historia de la humanidad desde los primeros humanos en África hasta los desafíos del siglo XXI. Harari explora cómo el Homo sapiens dominó el mundo gracias a su capacidad para crear y creer en ficciones compartidas.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
  },
  {
    title: 'El nombre del viento', year: 2007,
    authors: ['Patrick Rothfuss'], genres: ['Fantasía épica', 'Aventura'],
    overview: 'Kvothe, considerado el mago más poderoso de su era, vive oculto bajo una identidad falsa en una aldea remota. Cuando un cronista lo encuentra, Kvothe accede a contar su historia: desde su infancia como hijo de juglares hasta convertirse en leyenda.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780756405892-L.jpg',
  },
  {
    title: 'El principito', original_title: 'Le Petit Prince', year: 1943,
    authors: ['Antoine de Saint-Exupéry'], genres: ['Fábula', 'Filosofía', 'Clásico'],
    overview: 'Un aviador que ha tenido que aterrizar de emergencia en el desierto del Sahara conoce a un niño llegado de un pequeño asteroide. A través de sus conversaciones, el principito le relata sus viajes por el universo y las extrañas personas que ha encontrado.',
    poster_url: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg',
  },
]

// ─── Utilidades ──────────────────────────────────────────────────────────────

function toSlug(title) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

async function findUniqueSlug(title) {
  const base = toSlug(title)
  let slug = base, counter = 1
  while (true) {
    const { data } = await supabase.from('works').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${counter++}`
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── TMDb ────────────────────────────────────────────────────────────────────

const ISO_COUNTRY = {
  US:'Estados Unidos',GB:'Reino Unido',ES:'España',FR:'Francia',DE:'Alemania',
  IT:'Italia',JP:'Japón',KR:'Corea del Sur',CA:'Canadá',AU:'Australia',
  MX:'México',BR:'Brasil',DK:'Dinamarca',SE:'Suecia',NO:'Noruega',
}

async function fetchTmdb(tmdbId, type) {
  const endpoint = type === 'movie' ? 'movie' : 'tv'
  const base = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}`
  const lang = 'language=es-ES'
  const key  = `api_key=${TMDB_API_KEY}`

  const [detailsRes, creditsRes, externalRes] = await Promise.allSettled([
    fetch(`${base}?${key}&${lang}`),
    fetch(`${base}/credits?${key}&${lang}`),
    fetch(`${base}/external_ids?${key}`),
  ])

  const details  = detailsRes.status  === 'fulfilled' && detailsRes.value.ok  ? await detailsRes.value.json()  : {}
  const credits  = creditsRes.status  === 'fulfilled' && creditsRes.value.ok  ? await creditsRes.value.json()  : {}
  const external = externalRes.status === 'fulfilled' && externalRes.value.ok ? await externalRes.value.json() : {}

  const genres = (details.genres ?? []).map(g => g.name)
  const authors = []
  const directors = type === 'movie'
    ? (credits.crew ?? []).filter(c => c.job === 'Director').map(c => c.name).slice(0, 3)
    : []
  const cast = (credits.cast ?? []).slice(0, 5).map(c => c.name)

  const runtime = type === 'movie'
    ? (details.runtime ?? null)
    : ((details.episode_run_time ?? [])[0] ?? null)

  const isoCode = type === 'movie'
    ? (details.production_countries ?? [])[0]?.iso_3166_1 ?? null
    : (details.origin_country ?? [])[0] ?? null
  const country = isoCode ? (ISO_COUNTRY[isoCode] ?? isoCode) : null

  const poster_url = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null
  const overview = details.overview || null
  const original_title = details.original_title || details.original_name || null
  const year = details.release_date ? parseInt(details.release_date) : details.first_air_date ? parseInt(details.first_air_date) : null
  const seasons_count = type === 'series' ? (details.number_of_seasons ?? null) : null
  const imdb_id = external.imdb_id ?? null

  return { genres, directors, cast, runtime, country, poster_url, overview, original_title, year, seasons_count, imdb_id, authors }
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

const SECTION_GUIDES = {
  'inicio': 'Cubre: la situación inicial del protagonista y su mundo, el detonante o incidente incitador que rompe el equilibrio, la presentación de los personajes principales con sus motivaciones, y el planteamiento del conflicto central. Incluye el contexto necesario para entender la historia.',
  'nudo': 'Cubre: el desarrollo del conflicto central y sus complicaciones, los obstáculos que enfrenta el protagonista, los giros argumentales más importantes, los cambios en las relaciones entre personajes, los momentos de clímax parciales, y cómo evolucionan las motivaciones de cada personaje a lo largo de la trama.',
  'desenlace': 'Cubre: la resolución del conflicto central, el clímax final y sus consecuencias, el destino de cada personaje principal, las revelaciones finales y giros de último momento, y el estado del mundo al finalizar la historia. Incluye el significado o mensaje de la obra si es relevante.',
  'subtramas y personajes': 'Cubre: las tramas secundarias y su relación con la trama principal, el desarrollo y arco de los personajes secundarios, los temas recurrentes y simbolismos importantes, las relaciones entre personajes más allá del protagonista, y cualquier elemento relevante que no encaje en las secciones anteriores.',
}

async function generateContent(workTitle, workType, workYear, sectionLabel) {
  const typeLabel = workType === 'movie' ? 'película' : workType === 'series' ? 'serie' : 'libro'
  const guide = SECTION_GUIDES[sectionLabel.toLowerCase()] ?? 'Cubre los aspectos más relevantes de esta sección con todos los detalles y spoilers necesarios.'

  const prompt = `Eres un experto redactor de resúmenes con spoilers completos para la web Spoilering.

Escribe el contenido de la sección "${sectionLabel}" para la ficha de "${workTitle}"${workYear ? ` (${workYear})` : ''}, una ${typeLabel}.

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
      'x-api-key': ANTHROPIC_API_KEY,
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
    throw new Error(`Anthropic error: ${err}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// ─── Proceso principal ───────────────────────────────────────────────────────

async function getOrCreateAdminUserId() {
  const { data } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single()
  if (!data) throw new Error('No se encontró ningún usuario admin en profiles')
  return data.id
}

async function workExists(tmdbId, title, type) {
  if (tmdbId) {
    const { data } = await supabase.from('works').select('id, slug').eq('tmdb_id', tmdbId).maybeSingle()
    if (data) return data
  }
  const { data } = await supabase.from('works').select('id, slug').eq('title', title).eq('type', type).maybeSingle()
  return data ?? null
}

async function processWork({ title, original_title, year, type, tmdb_id, authors, genres, overview, poster_url, runtime, directors, cast, seasons_count, imdb_id, country, isbn, publisher, pages, saga, saga_order }, adminUserId, index, total) {
  const label = `[${index}/${total}] ${type.toUpperCase()} "${title}" (${year})`
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`${label}`)

  // ¿Ya existe?
  const existing = await workExists(tmdb_id ?? null, title, type)
  if (existing) {
    console.log(`  ⚠️  Ya existe (slug: ${existing.slug}) — saltando`)
    return { status: 'skipped', title }
  }

  // Enriquecer desde TMDb si es película/serie
  let enriched = { title, original_title, year, authors: authors ?? [], genres: genres ?? [], overview, poster_url, runtime: runtime ?? null, directors: directors ?? [], cast: cast ?? [], seasons_count: seasons_count ?? null, imdb_id: imdb_id ?? null, country: country ?? null }
  if (tmdb_id && (type === 'movie' || type === 'series')) {
    try {
      console.log(`  📡 Obteniendo datos de TMDb...`)
      const tmdbData = await fetchTmdb(tmdb_id, type)
      enriched = {
        ...enriched,
        genres:        tmdbData.genres.length       ? tmdbData.genres       : genres ?? [],
        directors:     tmdbData.directors.length    ? tmdbData.directors    : directors ?? [],
        cast:          tmdbData.cast.length         ? tmdbData.cast         : cast ?? [],
        runtime:       tmdbData.runtime             ?? runtime ?? null,
        country:       tmdbData.country             ?? country ?? null,
        poster_url:    tmdbData.poster_url          ?? poster_url ?? null,
        overview:      tmdbData.overview            ?? overview ?? null,
        original_title:tmdbData.original_title      ?? original_title ?? null,
        year:          tmdbData.year                ?? year,
        seasons_count: tmdbData.seasons_count       ?? seasons_count ?? null,
        imdb_id:       tmdbData.imdb_id             ?? imdb_id ?? null,
      }
    } catch (e) {
      console.log(`  ⚠️  TMDb error: ${e.message} — usando datos base`)
    }
  }

  // Slug único
  const slug = await findUniqueSlug(title)
  console.log(`  🔗 Slug: ${slug}`)

  // Insertar work
  const { data: work, error: workErr } = await supabase.from('works').insert({
    type, title,
    original_title: enriched.original_title || null,
    year: enriched.year ?? year ?? null,
    poster_url: enriched.poster_url || null,
    overview: enriched.overview || null,
    genres: enriched.genres,
    authors: enriched.authors,
    directors: enriched.directors,
    cast: enriched.cast,
    seasons_count: enriched.seasons_count,
    runtime: enriched.runtime,
    country: enriched.country,
    slug,
    tmdb_id: tmdb_id ?? null,
    imdb_id: enriched.imdb_id,
    isbn: isbn ?? null,
    publisher: publisher ?? null,
    pages: pages ?? null,
    saga: saga ?? null,
    saga_order: saga_order ?? null,
  }).select().single()

  if (workErr) {
    console.log(`  ❌ Error al crear work: ${workErr.message}`)
    return { status: 'error', title, error: workErr.message }
  }
  console.log(`  ✅ Work creado (id: ${work.id})`)

  // Insertar card
  const { data: card, error: cardErr } = await supabase.from('cards').insert({
    work_id: work.id,
    status: 'draft',
    created_by: adminUserId,
    is_committed: true,
  }).select().single()

  if (cardErr) {
    console.log(`  ❌ Error al crear card: ${cardErr.message}`)
    return { status: 'error', title, error: cardErr.message }
  }
  console.log(`  ✅ Card creada (id: ${card.id})`)

  // Insertar secciones vacías
  const SECTION_DEFS = [
    { label: 'Inicio',                  short_label: 'Inicio',    order_index: 0 },
    { label: 'Nudo',                    short_label: 'Nudo',      order_index: 1 },
    { label: 'Desenlace',               short_label: 'Desenlace', order_index: 2 },
    { label: 'Subtramas y personajes',  short_label: 'Subtramas', order_index: 3 },
  ]
  const sectionsToInsert = SECTION_DEFS.map(s => ({
    card_id: card.id, ...s, parent_id: null, is_published: false, content: '',
  }))
  const { data: sections, error: sectErr } = await supabase.from('sections').insert(sectionsToInsert).select()
  if (sectErr) {
    console.log(`  ❌ Error al crear secciones: ${sectErr.message}`)
    return { status: 'error', title, error: sectErr.message }
  }
  console.log(`  ✅ ${sections.length} secciones creadas`)

  // Generar contenido con Claude para cada sección
  console.log(`  🤖 Generando contenido con IA...`)
  for (const section of sections) {
    try {
      console.log(`     → Sección "${section.label}"...`)
      const content = await generateContent(title, type, enriched.year ?? year, section.label)
      await supabase.from('sections').update({ content }).eq('id', section.id)
      console.log(`     ✅ ${section.label} (${content.length} caracteres)`)
      await sleep(1500) // pausa entre llamadas a la API
    } catch (e) {
      console.log(`     ❌ Error generando "${section.label}": ${e.message}`)
    }
  }

  // Publicar card
  const { error: pubErr } = await supabase.from('cards').update({ status: 'published' }).eq('id', card.id)
  if (pubErr) {
    console.log(`  ❌ Error al publicar: ${pubErr.message}`)
    return { status: 'error', title, error: pubErr.message }
  }
  console.log(`  🚀 ¡Publicada! → /ficha/${slug}`)
  return { status: 'ok', title, slug }
}

async function main() {
  console.log('\n🎬 Spoilering — Script de contenido inicial')
  console.log('='.repeat(60))

  // Verificar conexión a Supabase
  const { error: pingErr } = await supabase.from('profiles').select('id').limit(1)
  if (pingErr) {
    console.error(`\n❌ Error conectando a Supabase: ${pingErr.message}`)
    process.exit(1)
  }
  console.log('✅ Supabase conectado')

  // Obtener admin user id
  const adminUserId = await getOrCreateAdminUserId()
  console.log(`✅ Admin user: ${adminUserId}`)

  // Construir lista completa
  const works = [
    ...MOVIES.map(w => ({ ...w, type: 'movie' })),
    ...SERIES.map(w => ({ ...w, type: 'series' })),
    ...BOOKS.map(w => ({ ...w, type: 'book', tmdb_id: null })),
  ]

  const total = works.length
  console.log(`\n📋 Total de obras a procesar: ${total} (${MOVIES.length} pelis, ${SERIES.length} series, ${BOOKS.length} libros)`)

  const results = { ok: [], skipped: [], errors: [] }

  for (let i = 0; i < works.length; i++) {
    const result = await processWork(works[i], adminUserId, i + 1, total)
    if (result.status === 'ok')      results.ok.push(result.title)
    else if (result.status === 'skipped') results.skipped.push(result.title)
    else                             results.errors.push(`${result.title}: ${result.error}`)

    // Pausa entre obras para no saturar APIs
    if (i < works.length - 1) await sleep(2000)
  }

  // Resumen final
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN FINAL')
  console.log(`   ✅ Creadas y publicadas: ${results.ok.length}`)
  console.log(`   ⚠️  Ya existían (saltadas): ${results.skipped.length}`)
  console.log(`   ❌ Errores: ${results.errors.length}`)
  if (results.errors.length) {
    console.log('\nErrores:')
    results.errors.forEach(e => console.log(`   - ${e}`))
  }
  if (results.ok.length) {
    console.log('\nFichas creadas:')
    results.ok.forEach(t => console.log(`   - ${t}`))
  }
  console.log('\n✨ Listo.')
}

main().catch(err => {
  console.error('\n💥 Error fatal:', err)
  process.exit(1)
})
