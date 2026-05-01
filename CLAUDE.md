# CLAUDE.md — Spoilering

## Qué es este proyecto
Spoilering es una web colaborativa de resúmenes con spoilers de series, películas y libros. El objetivo es que los usuarios puedan refrescar la memoria sobre una obra cuando vuelven a ella después de un tiempo.

## Stack tecnológico
- Next.js 15 con App Router y TypeScript
- Tailwind CSS — paleta: `ink` (#18181b), `paper` (#fbfaf7), `ember` (#d84f2a), `moss` (#52715a), `plum` (#6d4f72)
- Supabase como backend completo (PostgreSQL, autenticación, RLS)
- Vercel para deploy
- TMDb API para películas y series
- Google Books API + Open Library para libros
- Anthropic API (claude-sonnet-4-6) para generación de contenido

## Estructura del repositorio
El git está en `C:\Proyectos\spoilering\spoilering\`. El `tsconfig.json` excluye el directorio `"spoilering"` para evitar que el padre compile el proyecto hijo.

## Decisiones de arquitectura
- Sin Prisma — Supabase sustituye toda la capa de base de datos
- Se usa `(supabase.from('tabla') as any)` para evitar errores de tipo `never`
- Middleware en `src/middleware.ts` — protege /admin por rol
- Autenticación SSR con `@supabase/ssr`
- El modelo de IA es `claude-sonnet-4-6` — NO usar claude-sonnet-4-20250514, no existe
- El cliente admin de Supabase está en `src/lib/supabase/admin.ts` con `import 'server-only'` y usa `SUPABASE_SERVICE_ROLE_KEY`

## Roles de usuario
- **user** — hasta 5 fichas (pendientes de aprobación), sugerir correcciones, gestionar perfil
- **editor** — fichas ilimitadas, publicación directa, editar cualquier ficha, aprobar sugerencias, acceso parcial al admin
- **admin** — acceso completo: gestión de usuarios, aprobar/rechazar fichas, todo lo del editor

## Rutas principales
- `/` — home con grid de fichas publicadas
- `/ficha/[slug]` — ficha pública con advertencia de spoilers
- `/buscar` — búsqueda pública
- `/perfil` — mini panel del usuario (fichas, sugerencias, cuenta)
- `/nueva-obra` — redirect a /admin/nueva-obra para todos los roles
- `/login`, `/registro`, `/auth/callback` — autenticación
- `/recuperar-contrasena`, `/nueva-contrasena` — flujo de recuperación
- `/aviso-legal`, `/privacidad`, `/cookies` — textos legales
- `/admin` — panel de administración
- `/admin/nueva-obra` — crear obra
- `/admin/ficha/[id]` — editor de fichas
- `/admin/sugerencias` — revisión de sugerencias
- `/admin/usuarios` — gestión de usuarios (solo admin)

## APIs internas
- `POST /api/admin/create-work` — crea work + card + secciones. Límite 5 fichas para rol 'user'
- `GET /api/admin/search-works?q=` — busca en TMDb, Google Books y Open Library
- `POST /api/admin/sections/[id]/generate` — genera sección con Claude. Responde NO_CONOCIDA si la IA no conoce la obra (devuelve 422)
- `POST /api/admin/cards/[id]/generate-all` — genera todas las secciones en paralelo. Mismo control NO_CONOCIDA
- `PATCH /api/admin/cards/[id]/status` — cambia estado draft/published
- `DELETE /api/admin/cards/[id]` — elimina card y secciones
- `POST /api/suggestions` — crea sugerencia de corrección
- `GET /api/admin/users` — lista usuarios (requiere service role)
- `PATCH /api/admin/users/[id]/role` — cambia rol
- `PATCH /api/admin/users/[id]/status` — activa/desactiva usuario
- `DELETE /api/admin/users/[id]` — elimina usuario
- `GET /api/check-username?username=xxx` — comprueba disponibilidad de username
- `GET /api/get-email-by-username?username=xxx` — obtiene email por username para login
- `DELETE /api/account` — elimina la propia cuenta
- `POST /api/admin/works/[id]/fetch-seasons` — importa temporadas y episodios desde TMDb (upsert)
- `GET /api/admin/works/[id]/seasons` — lista temporadas con episodios anidados
- `POST /api/admin/episodes/[id]/card` — crea card y secciones para un episodio
- `DELETE /api/admin/works/[id]` — elimina work completo (requiere rol editor o admin, usa adminClient)
- `PATCH /api/admin/works/[id]` — actualiza metadatos de la obra (poster_url, cast, runtime, imdb_id, urls externas). Requiere rol editor o admin
- `POST /api/invite` — envía invitación por email (supabaseAdmin.auth.admin.inviteUserByEmail), límite 5/mes por usuario
- `POST /api/contact` — guarda mensaje de contacto en contact_messages (adminClient, acepta usuarios no logueados)
- `POST /api/user-content` — upsert de visionado y notas (get+update/insert, sin onConflict)
- `GET /api/user-content` — obtiene registro de visionado del usuario actual por work_id o episode_id
- `DELETE /api/user-content` — elimina registro de visionado por work_id o episode_id

## Tablas en Supabase
- `works` — obras. Unique en tmdb_id y google_books_id. Extra para libros: isbn, publisher, pages, saga, saga_order. Nuevas columnas: `"cast"` text[], runtime integer, imdb_id text, letterboxd_url text, goodreads_url text, filmaffinity_url text, tracktv_url text, poster_url text. Ejecutar en Supabase si faltan: `ALTER TABLE works ADD COLUMN IF NOT EXISTS filmaffinity_url text; ALTER TABLE works ADD COLUMN IF NOT EXISTS tracktv_url text;`
- `contact_messages` — nombre, email, tipo (Sugerencia/Error/Otro), mensaje, user_id nullable, created_at. RLS: insert público, select solo admin
- `cards` — fichas (status: draft/published, is_committed: boolean, created_by: uuid). El campo `is_complete` fue eliminado.
- `sections` — secciones en markdown
- `profiles` — usuario con rol (admin/editor/user), username único, is_active boolean
- `suggestions` — correcciones (status: pending/approved/rejected, user_id: uuid)
- `seasons` — temporadas (work_id, season_number, tmdb_season_id, episode_count, poster_path)
- `episodes` — episodios (season_id, episode_number, card_id nullable, tmdb_episode_id, still_path)
- `user_content` — user_id, work_id, episode_id, watched, watched_at, notes. RLS estricto por user_id
- `invites` — inviter_id, email, created_at. RLS estricto por inviter_id

## Variables de entorno necesarias (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — sin NEXT_PUBLIC, solo servidor
- `ANTHROPIC_API_KEY`
- `TMDB_API_KEY`
- `GOOGLE_BOOKS_API_KEY`
- `TRAKT_API_KEY` — para auto-fetch de slug Trakt al crear obra desde TMDb
- `NEXT_PUBLIC_SITE_URL` — URL canónica del sitio (https://www.spoilering.com). Necesaria para sitemap y OG tags

## Patrones importantes
- `rm -rf .next` ante errores de compilación extraños
- El servidor dev arranca en puerto 3006+
- El modelo de IA correcto es `claude-sonnet-4-6` — no cambiar nunca
- Los usernames NO llevan @ delante — se muestran sin prefijo
- El login acepta email o username — si no contiene @ busca el email por username
- Columna `cast` en PostgreSQL es palabra reservada — usar siempre entre comillas dobles en queries SQL directas (`"cast"`)

## Script de seed
`scripts/seed-content.mjs` — script Node.js ESM para poblar la BD con contenido de prueba (25 películas, 10 series, 10 libros). Llama directamente a Supabase y Anthropic. Importa temporadas y episodios automáticamente para las series.
Uso: `SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seed-content.mjs`
Requiere las variables de entorno en `.env.local`.

## Flujo de trabajo
- Commits a GitHub solo con los archivos modificados en esa tarea (nunca `git add -A`)
- Hacer commit solo al terminar grupos de cambios importantes, no en cada pequeño fix.
- Actualizar **CLAUDE.md** y **docs/roadmap.md** al final de cada sesión de trabajo.
- Al iniciar una nueva sesión, revisar siempre CLAUDE.md y docs/roadmap.md para recuperar contexto.

## Estado actual (1 mayo 2026 — tarde)

### Funcionando correctamente
- Autenticación completa con confirmación por email apuntando a www.spoilering.com
- Login con email o nombre de usuario
- Registro con username elegido + validación de disponibilidad en tiempo real
- Recuperar contraseña, cambiar contraseña desde perfil, eliminar cuenta
- Roles admin/editor/user con permisos diferenciados
- Navbar con botón "+ Añadir obra" para todos los usuarios logueados
- Botón añadir obra en hero de home visible para todos (logueados → /nueva-obra, no logueados → /login?redirect=/nueva-obra)
- Home editorial: ficha destacada, strips por tipo (películas/series/libros), links filtrados a /buscar?tipo=
- Panel de admin completo: estadísticas, fichas, sugerencias, fichas pendientes de usuarios
- Gestión de usuarios en /admin/usuarios: cambiar rol, activar/desactivar, eliminar
- Búsqueda en TMDb, Google Books y Open Library con deduplicación
- Campos específicos para libros: ISBN, editorial, páginas, saga
- Creación de obras: slug automático, toggle URL/subir imagen para póster
- Usuarios normales pueden crear hasta 5 fichas pendientes de aprobación
- Generación de secciones en paralelo con indicador de progreso
- Prompts con SECTION_GUIDES: 500-900 palabras, subtítulos markdown
- IA devuelve NO_CONOCIDA si no conoce la obra — no se guarda contenido inventado
- Autoguardado silencioso por sección (onBlur) con indicador visual
- Flujo de estado de ficha: etiqueta informativa izquierda (Borrador/Publicada) separada de botones de acción (Generar con IA / Publicar / Despublicar)
- Página pública de ficha visible sin login con advertencia de spoilers
- Perfil de usuario estilo admin: stats, fichas, sugerencias, cuenta
- Sistema de sugerencias end-to-end
- Textos legales + footer en todas las páginas
- Deploy en producción en www.spoilering.com
- Gestión de temporadas y episodios: seasons y episodes en BD, importación automática desde TMDb al crear serie, panel SeasonsPanel en editor admin, botón "Comprobar nuevas temporadas" (upsert, no borra datos)
- Fichas de episodio: POST /api/admin/episodes/[id]/card crea card+secciones por episodio reutilizando el sistema existente
- Borradores inactivos (+30 días) visibles en panel admin con opción eliminar
- Eliminar ficha: usa adminClient (service role) para saltarse RLS, comprobación de permisos (creador o admin) en la propia API antes del borrado
- Eliminar work completo: DELETE /api/admin/works/[id] borra work + cascade elimina seasons y episodes
- Obras sin ficha: works sin card asociada visibles en panel admin con opción de eliminar
- Metadatos enriquecidos en ficha pública: directores, actores (cast, primeros 5), duración (runtime), géneros, y para libros: autores, editorial, páginas, saga
- Enlaces externos en ficha pública: IMDb, Letterboxd (películas y series), Goodreads, Filmaffinity — solo los que tengan URL rellena
- Al crear obra desde TMDb se obtienen en paralelo para movies Y series: cast (/credits), runtime, imdb_id
- Panel "Metadatos y enlaces" en editor de fichas con campos editables por tipo de obra, incluida URL del póster
- Editor de fichas: "Ver en IMDb ↗" aparece junto al campo imdb_id cuando tiene valor
- Editor de fichas: links "Buscar en Letterboxd ↗", "Buscar en Filmaffinity ↗" y "Buscar en Trakt ↗" — abren búsqueda en nueva pestaña
- Editor de fichas: metadatos guardan automáticamente onBlur, sin botón manual
- Buscador inline en navbar: píldora "Buscar..." con dropdown de resultados, Enter navega a /buscar
- /buscar acepta ?tipo=movie|series|book para inicializar filtro y mostrar catálogo sin query (browse mode)
- Sugerir corrección: botón visible para todos en ficha pública, redirige a login si no está logueado
- Invitar amigos: POST /api/invite con límite 5 invitaciones/mes por usuario
- Visionado y notas: tabla user_content, panel "Mi Actividad" en ficha pública y en perfil
- Panel "Mi Actividad" también visible en el editor admin de fichas
- "Mi Actividad" muestra "Marcar como leído"/"Leído" para libros y "Marcar como visto"/"Visto" para pelis y series
- Campo country en works: almacena país de origen en español usando código ISO + tabla de conversión
- original_title mostrado en ficha pública debajo del título principal (solo si difiere del título)
- Secciones en acordeón en el editor y en la ficha pública
- Fichas sin confirmar (is_committed=false): badge "Sin confirmar" en perfil + link "Continuar →", excluidas del panel de revisión del admin
- Guardar borrador y Publicar guardan primero todas las secciones pendientes antes de cambiar estado
- Editorial y páginas se rellenan automáticamente desde Google Books al seleccionar libro
- Reparto y Filmaffinity ocultos en editor para fichas de tipo libro
- Sitemap dinámico: genera rutas para todas las fichas publicadas (async, consulta Supabase)
- Aviso en cabecera para editores/admins cuando hay fichas pendientes de revisión (banner plum)
- Aviso en cabecera para admins cuando hay mensajes de contacto sin leer (banner ember)
- is_complete eliminado completamente del código (columna puede quedar en BD sin efecto)
- covers.openlibrary.org añadido a dominios permitidos en next.config.ts

### Pendiente de resolver (próxima sesión)
- **Letterboxd y Trakt URL — solo manual** — no se pueden auto-rellenar desde Vercel. Flujo: clic en "Buscar en Letterboxd ↗" → copiar URL → pegar. Aceptado así.
- **Perfiles de usuario con redes sociales** — añadir letterboxd_profile, tracktv_profile, goodreads_profile, filmaffinity_profile en tabla profiles. Mostrar en perfil público.
- **Créditos de colaboración en ficha pública** — mostrar el usuario que creó la ficha y contribuidores.

### Conocido pero no urgente
- Ejecutar en Supabase las policies RLS para fichas de usuarios si no se han ejecutado:
  ```sql
  create policy "Usuarios autenticados pueden crear works"
    on works for insert to authenticated with check (true);
  create policy "Usuarios autenticados pueden crear cards"
    on cards for insert to authenticated with check (auth.uid() = created_by);
  create policy "Usuarios ven sus propias cards"
    on cards for select to authenticated
    using (created_by = auth.uid() or status = 'published');
  create policy "Usuarios pueden crear sections de sus cards"
    on sections for insert to authenticated
    with check (exists (select 1 from cards where cards.id = sections.card_id and cards.created_by = auth.uid()));
  ```
