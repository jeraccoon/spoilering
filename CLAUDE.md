# CLAUDE.md — Spoilering

## Qué es este proyecto
Spoilering es una web colaborativa de resúmenes con spoilers de series, películas y libros. El objetivo es que los usuarios puedan refrescar la memoria sobre una obra cuando vuelven a ella después de un tiempo.

## Stack tecnológico
- Next.js 15 con App Router y TypeScript
- Tailwind CSS para estilos — paleta personalizada: `ink` (#18181b), `paper` (#fbfaf7), `ember` (#d84f2a), `moss` (#52715a), `plum` (#6d4f72)
- Supabase como backend completo (base de datos PostgreSQL, autenticación, RLS)
- Vercel para deploy
- TMDb API para datos de películas y series
- Google Books API + Open Library para libros
- Anthropic API (claude-sonnet-4-6) para generación de contenido

## Estructura del repositorio
El repo tiene dos niveles — el git está en `C:\Proyectos\spoilering\spoilering\`, no en el padre. El `tsconfig.json` excluye el directorio `"spoilering"` para evitar que el padre compile el proyecto hijo.

## Decisiones de arquitectura tomadas
- Se eliminó Prisma — Supabase sustituye toda la capa de base de datos
- Tipos de Supabase simplificados en `src/types/database.ts`; se usa `(supabase.from('tabla') as any)` para evitar errores de tipo `never`
- Las fichas son documentos colectivos (no hay versiones por usuario)
- Middleware en `src/middleware.ts` — protege /admin por rol
- Autenticación SSR con `@supabase/ssr` y propagación de cookies en redirects del middleware
- El modelo de IA es `claude-sonnet-4-6` — NO usar claude-sonnet-4-20250514, no existe

## Rutas principales
- `/` — home con grid de fichas publicadas
- `/ficha/[slug]` — página pública de ficha con navegación lateral por secciones
- `/buscar` — búsqueda pública de obras
- `/perfil` — perfil del usuario logueado con sus fichas y sugerencias
- `/nueva-obra` — ruta pública que redirige a /admin/nueva-obra para todos los roles
- `/login`, `/registro`, `/auth/callback` — autenticación
- `/admin` — panel de administración (protegido por middleware)
- `/admin/nueva-obra` — crear obra buscando en TMDb/Google Books/Open Library o manualmente
- `/admin/ficha/[id]` — editor de fichas con secciones
- `/admin/sugerencias` — revisión de sugerencias de corrección pendientes
- `/aviso-legal`, `/privacidad`, `/cookies` — textos legales

## APIs internas
- `POST /api/admin/create-work` — crea work + card + 4 secciones. Limita a 3 fichas para rol 'user'
- `GET /api/admin/search-works?q=` — busca en TMDb, Google Books y Open Library simultáneamente
- `POST /api/admin/sections` — crea sección
- `PUT /api/admin/sections/[id]` — actualiza contenido de sección
- `POST /api/admin/sections/[id]/generate` — genera contenido de una sección con Claude
- `POST /api/admin/cards/[id]/generate-all` — genera las secciones en paralelo
- `PATCH /api/admin/cards/[id]/status` — cambia estado draft/published
- `DELETE /api/admin/cards/[id]` — elimina card y sus secciones
- `POST /api/suggestions` — crea una sugerencia de corrección

## Tablas en Supabase
- `works` — obras. Unique constraint en tmdb_id y google_books_id. Columnas extra para libros: isbn, publisher, pages, saga, saga_order
- `cards` — fichas (status: draft/published, is_complete: boolean, created_by: uuid)
- `sections` — secciones de cada ficha (contenido en markdown)
- `profiles` — perfil de usuario con rol (admin/editor/user), username único
- `suggestions` — sugerencias de corrección (status: pending/approved/rejected, user_id: uuid)

## Patrones importantes
- `rm -rf .next` al cambiar dependencias o ante errores de compilación extraños
- El servidor dev suele arrancar en puerto 3006+ porque el 3000 está ocupado
- El modelo de IA correcto es `claude-sonnet-4-6` — no cambiar esto nunca
- El trigger `on_auth_user_created` llama a `handle_new_user()` que crea el perfil automáticamente con username único (añade número si hay duplicado)

## Estado actual (23 abril 2026)

### Funcionando correctamente
- Supabase conectado con todas las tablas y RLS configurado
- Autenticación completa: registro, login, logout, confirmación por email apuntando a www.spoilering.com
- Trigger de creación de perfil con username único automático
- Roles: admin, editor, user — middleware protege /admin
- Navbar con botón "+ Añadir obra" para todos los usuarios logueados
- Home con grid de fichas publicadas
- Panel de admin con estadísticas, fichas en borrador, fichas pendientes de revisión de usuarios, sugerencias
- Búsqueda en TMDb, Google Books y Open Library con deduplicación por título+autor
- Campos específicos para libros: ISBN, editorial, páginas, saga, número en saga
- Creación de obras: slug automático, toggle URL/subir imagen para póster
- Usuarios normales pueden crear hasta 3 fichas (quedan en borrador pendientes de aprobación)
- Admin puede aprobar o rechazar fichas de usuarios desde el panel
- Generación de secciones en paralelo con indicador de progreso
- Prompts con SECTION_GUIDES: 500-900 palabras, subtítulos markdown
- Página pública de ficha visible sin login, con advertencia de spoilers
- Fichas en borrador visibles para admin/editor con banner
- Perfil de usuario: avatar, datos, contador X/3 fichas, lista de fichas con estado, sección de sugerencias
- Sistema de sugerencias: botón en ficha, modal, panel admin con comparación y textarea editable
- Textos legales: /aviso-legal, /privacidad, /cookies con footer en todas las páginas
- Deploy en producción en www.spoilering.com

### Pendiente de resolver
- Búsqueda por ISBN o enlace de Goodreads no funciona — pendiente de revisar
- Perfil de usuario: mejorar diseño para que se parezca más al panel de /admin
- Ejecutar en Supabase las policies RLS para fichas de usuarios:
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
