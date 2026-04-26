# ============================================================
# SPOILERING — Guía de configuración con Supabase
# ============================================================


## 1. INSTALAR DEPENDENCIAS

```bash
npm install @supabase/supabase-js @supabase/ssr
```


## 2. VARIABLES DE ENTORNO

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Supabase (encontrar en: Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxx...

# Solo para operaciones de admin desde servidor (opcional por ahora)
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxx...

# TMDb (ya lo tienes)
TMDB_API_KEY=tu_clave_actual

# Google Books API
GOOGLE_BOOKS_API_KEY=tu_clave_aqui

# Anthropic (ya lo tienes)
ANTHROPIC_API_KEY=tu_clave_actual
```


## 3. ESTRUCTURA DE ARCHIVOS A CREAR

```
spoilering/
├── .env.local                        ← Variables de entorno
├── middleware.ts                     ← Protección de rutas (ver spoilering_supabase_clients.ts)
├── types/
│   └── database.ts                  ← Copiar spoilering_types.ts aquí
├── lib/
│   ├── supabase/
│   │   ├── client.ts                ← Copiar cliente browser de spoilering_supabase_clients.ts
│   │   └── server.ts                ← Copiar cliente server de spoilering_supabase_clients.ts
│   └── data.ts                      ← Copiar spoilering_data.ts aquí
```


## 4. BASE DE DATOS EN SUPABASE

1. Ir a https://supabase.com y crear un proyecto nuevo
2. En el panel: **SQL Editor** > **New query**
3. Pegar el contenido de `spoilering_schema.sql` y ejecutar
4. Verificar que las tablas aparecen en **Table Editor**

Después del primer registro (el tuyo), ejecutar esto en SQL Editor
para convertirte en admin:

```sql
update public.profiles
set role = 'admin'
where username = 'tu_username';
```


## 5. AUTENTICACIÓN

Supabase Auth ya viene configurado. Para activar login con email:

1. Panel Supabase > **Authentication** > **Providers**
2. Email está habilitado por defecto
3. Para Google/GitHub OAuth: activar el proveedor y añadir las credenciales

En `.env.local` no necesitas nada extra para auth básico con email.


## 6. VERIFICAR QUE TODO FUNCIONA

Añadir este snippet temporal en cualquier página para probar la conexión:

```typescript
// app/page.tsx (temporal, borrar después)
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('works').select('count')
  
  return (
    <div>
      {error ? `Error: ${error.message}` : `Conexión OK. Obras: ${data?.[0]?.count ?? 0}`}
    </div>
  )
}
```


## 7. MIGRAR CONTENIDO EXISTENTE

Si tienes fichas en `contents.ts`, crear un script de migración:

```typescript
// scripts/migrate.ts
import { createClient } from '@supabase/supabase-js'
import { contents } from '../lib/contents' // tu archivo actual

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // necesitas el service role para esto
)

async function migrate() {
  for (const item of contents) {
    // 1. Crear la obra
    const { data: work } = await supabase.from('works').insert({
      type: item.type,
      title: item.title,
      year: item.year,
      poster_url: item.poster,
      tmdb_id: item.tmdbId,
      slug: item.slug,
      overview: item.overview ?? '',
    }).select().single()

    if (!work) continue

    // 2. Crear la ficha
    const { data: card } = await supabase.from('cards').insert({
      work_id: work.id,
      status: item.status === 'published' ? 'published' : 'draft',
    }).select().single()

    if (!card) continue

    // 3. Crear una sección raíz con el contenido actual
    await supabase.from('sections').insert({
      card_id: card.id,
      order_index: 0,
      label: 'Resumen completo',
      content: item.content ?? '',
      is_published: item.status === 'published',
    })

    console.log(`✓ Migrado: ${item.title}`)
  }
}

migrate().catch(console.error)
```

Ejecutar con:
```bash
npx ts-node scripts/migrate.ts
```


## 8. PRÓXIMOS PASOS DESPUÉS DE CONFIGURAR

Una vez que la conexión funcione, el orden recomendado es:

1. **Auth UI** — páginas de login/registro
2. **Home** — listado de fichas recientes con filtro por tipo
3. **Ficha de detalle** — navegación por secciones (la funcionalidad clave)
4. **Flujo de edición** — proponer y votar revisiones
5. **Panel admin** — gestión de obras y moderación
6. **Prompts IA** — generación estructurada por secciones
