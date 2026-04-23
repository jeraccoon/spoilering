# CLAUDE.md — Spoilering

## Qué es este proyecto
Spoilering es una web colaborativa de resúmenes con spoilers de series, películas y libros. El objetivo es que los usuarios puedan refrescar la memoria sobre una obra cuando vuelven a ella después de un tiempo.

## Stack tecnológico
- Next.js 15 con App Router y TypeScript
- Tailwind CSS para estilos — paleta personalizada: `ink` (#18181b), `paper` (#fbfaf7), `ember` (#d84f2a), `moss` (#52715a), `plum` (#6d4f72)
- Supabase como backend completo (base de datos PostgreSQL, autenticación, RLS)
- Vercel para deploy
- TMDb API para datos de películas y series
- Google Books API para libros
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
- `/perfil` — perfil del usuario logueado con sus fichas
- `/login`, `/registro`, `/auth/callback` — autenticación
- `/admin` — panel de administración (protegido por middleware)
- `/admin/nueva-obra` — crear obra buscando en TMDb/Google Books o manualmente
- `/admin/ficha/[id]` — editor de fichas con secciones
- `/admin/sugerencias` — revisión de sugerencias de corrección pendientes

## APIs internas
- `POST /api/admin/create-work` — crea work + card + 4 secciones predeterminadas
- `GET /api/admin/search-works?q=` — busca en TMDb y Google Books simultáneamente
- `POST /api/admin/sections` — crea sección
- `PUT /api/admin/sections/[id]` — actualiza contenido de sección
- `POST /api/admin/sections/[id]/generate` — genera contenido de una sección con Claude
- `POST /api/admin/cards/[id]/generate-all` — genera las secciones en paralelo (una llamada por sección)
- `PATCH /api/admin/cards/[id]/status` — cambia estado draft/published
- `POST /api/suggestions` — crea una sugerencia de corrección

## Tablas en Supabase
- `works` — obras (películas, series, libros). Unique constraint en tmdb_id y google_books_id
- `cards` — fichas asociadas a obras (status: draft/published, is_complete: boolean)
- `sections` — secciones de cada ficha (contenido en markdown)
- `profiles` — perfil de usuario con rol (admin/editor/user)
- `suggestions` — sugerencias de corrección (status: pending/approved/rejected)

## Patrones importantes
- `rm -rf .next` al cambiar dependencias o ante errores de compilación extraños
- El servidor dev suele arrancar en puerto 3006+ porque el 3000 está ocupado
- Los logs del servidor están en `.next/dev/logs/next-development.log`
- El modelo de IA correcto es `claude-sonnet-4-6` — no cambiar esto nunca

## Estado actual (23 abril 2026)

### Funcionando correctamente
- Supabase conectado con todas las tablas creadas y RLS configurado
- Autenticación completa: registro, login, logout, confirmación por email
- Email de confirmación apunta a www.spoilering.com (Supabase > URL Configuration)
- Roles: admin, editor, user — middleware protege /admin
- Navbar actualizado en tiempo real al hacer login/logout
- Home con grid de fichas publicadas
- Panel de admin con estadísticas reales
- Búsqueda en TMDb y Google Books con soporte "autor:nombre", directores incluidos
- Creación de obras: slug automático, toggle URL/subir imagen para póster, is_complete
- Cuando obra ya existe muestra mensaje amigable con enlace a la ficha
- Editor de fichas con 4 secciones predeterminadas
- Generación de secciones en paralelo con indicador de progreso
- Prompts con SECTION_GUIDES: 500-900 palabras, subtítulos markdown, guías por sección
- Página pública de ficha visible sin login (RLS anon configurado)
- Fichas en borrador: visibles para admin/editor con banner, ocultas para el resto
- Advertencia de spoilers con botón para revelar contenido
- Perfil de usuario (/perfil): avatar, email, fecha, rol, lista de fichas propias
- Sistema de sugerencias: botón en ficha, modal, tabla Supabase, panel admin con comparación
- Deploy en producción en www.spoilering.com (Vercel + dominio propio)

### Próximos pasos (ver ROADMAP.md para detalle completo)
1. Panel de gestión de usuarios
2. Textos legales (obligatorio antes de beta)
3. Mejorar libros y corrección de fichas completa
4. Sistema de incentivos y notas privadas
