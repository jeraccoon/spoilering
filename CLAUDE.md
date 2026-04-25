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
- **user** — hasta 3 fichas (pendientes de aprobación), sugerir correcciones, gestionar perfil
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
- `POST /api/admin/create-work` — crea work + card + secciones. Límite 3 fichas para rol 'user'
- `GET /api/admin/search-works?q=` — busca en TMDb, Google Books y Open Library
- `POST /api/admin/sections/[id]/generate` — genera sección con Claude
- `POST /api/admin/cards/[id]/generate-all` — genera todas las secciones en paralelo
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

## Tablas en Supabase
- `works` — obras. Unique en tmdb_id y google_books_id. Extra para libros: isbn, publisher, pages, saga, saga_order
- `cards` — fichas (status: draft/published, is_complete: boolean, created_by: uuid)
- `sections` — secciones en markdown
- `profiles` — usuario con rol (admin/editor/user), username único, is_active boolean
- `suggestions` — correcciones (status: pending/approved/rejected, user_id: uuid)
- `seasons` — temporadas (work_id, season_number, tmdb_season_id, episode_count, poster_path)
- `episodes` — episodios (season_id, episode_number, card_id nullable, tmdb_episode_id, still_path)

## Variables de entorno necesarias (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — sin NEXT_PUBLIC, solo servidor
- `ANTHROPIC_API_KEY`
- `TMDB_API_KEY`
- `GOOGLE_BOOKS_API_KEY`

## Patrones importantes
- `rm -rf .next` ante errores de compilación extraños
- El servidor dev arranca en puerto 3006+
- El modelo de IA correcto es `claude-sonnet-4-6` — no cambiar nunca
- Los usernames NO llevan @ delante — se muestran sin prefijo
- El login acepta email o username — si no contiene @ busca el email por username

## Estado actual (25 abril 2026)

### Funcionando correctamente
- Autenticación completa con confirmación por email apuntando a www.spoilering.com
- Login con email o nombre de usuario
- Registro con username elegido + validación de disponibilidad en tiempo real
- Recuperar contraseña, cambiar contraseña desde perfil, eliminar cuenta
- Roles admin/editor/user con permisos diferenciados
- Navbar con botón "+ Añadir obra" para todos los usuarios logueados
- Botón añadir obra en hero de home (solo usuarios logueados, client component)
- Home con grid de fichas publicadas
- Panel de admin completo: estadísticas, fichas, sugerencias, fichas pendientes de usuarios
- Gestión de usuarios en /admin/usuarios: cambiar rol, activar/desactivar, eliminar
- Búsqueda en TMDb, Google Books y Open Library con deduplicación
- Campos específicos para libros: ISBN, editorial, páginas, saga
- Creación de obras: slug automático, toggle URL/subir imagen para póster
- Usuarios normales pueden crear hasta 3 fichas pendientes de aprobación
- Generación de secciones en paralelo con indicador de progreso
- Prompts con SECTION_GUIDES: 500-900 palabras, subtítulos markdown
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

### Pendiente de resolver
- Búsqueda por ISBN o enlace de Goodreads no funciona — pendiente de revisar
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
