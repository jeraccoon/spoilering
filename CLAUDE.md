# CLAUDE.md — Spoilering

## Qué es este proyecto
Spoilering es una web colaborativa de resúmenes con spoilers de series, películas y libros. El objetivo es que los usuarios puedan refrescar la memoria sobre una obra cuando vuelven a ella después de un tiempo.

## Stack tecnológico
- Next.js 16 con App Router y TypeScript
- **next-intl 4.x** para internacionalización (locales `es` + `en`, prefijo siempre)
- Tailwind CSS — paleta: `ink` (#18181b), `paper` (#fbfaf7), `ember` (#d84f2a), `moss` (#52715a), `plum` (#6d4f72), `tide` (#3a6fb0)
- Tipografía: **Inter** (sans, body) + **Fraunces** (serif, titulares editoriales) cargadas vía `next/font/google`. Variables CSS `--font-sans` y `--font-serif` en `<html>`. Usar `font-serif` solo en H1/H2 destacados (hero, ficha pública, FeaturedCard, FAQ, /buscar).
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
- Middleware en `src/middleware.ts` — protege /admin por rol Y compone con next-intl
- Autenticación SSR con `@supabase/ssr`
- El modelo de IA es `claude-sonnet-4-6` — NO usar claude-sonnet-4-20250514, no existe
- El cliente admin de Supabase está en `src/lib/supabase/admin.ts` con `import 'server-only'` y usa `SUPABASE_SERVICE_ROLE_KEY`
- **i18n**: todo el árbol de páginas vive en `src/app/[locale]/`. `api/`, `auth/`, `global-error.tsx`, `robots.ts`, `sitemap.ts` y favicons se quedan en la raíz `src/app/`.
- **Imports de navegación interna**: usar SIEMPRE `@/i18n/navigation` (`Link`, `useRouter`, `redirect`, `usePathname`). NO importar `Link` de `next/link` ni `useRouter`/`redirect` de `next/navigation` para rutas internas — perderán el prefijo de locale.

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
- `PATCH /api/admin/cards/[id]` — actualiza campos editables de la card (por ahora `summary`). Permisos: creador, editor o admin
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

## i18n — pipeline de traducción
- Locales soportados: `['es', 'en']`. Default `es`. Configuración en `src/i18n/routing.ts`. URLs SIEMPRE con prefijo (`localePrefix: 'always'`).
- Mensajes de UI en `messages/{es,en}.json`. Namespaces principales: `Common`, `Header`, `Footer`, `BetaBanner`, `ContactModal`, `NavSearch`, `UserMenu`, `HeroActions`, `CommunityCallout`, `Home`, `HomeSections`, `BuscarPage`, `LoginPage`, `RegistroPage`, `RecuperarPage`, `NuevaContrasenaPage`, `FaqPage`, `PerfilPage`, `PerfilCards`, `AccountModals`, `SocialLinks`, `NoteWidget`, `InviteWidget`, `FichaPage`, `SuggestBar`, `SuggestionModal`, `SpoilerGate`, `CardContent`, `UserContentPanel`, `SeasonsAccordion`, `EpisodeRow`, `TranslationBanner`, `Admin.*`, `WorkType`, `Roles`, `SuggestionStatus`, `Metadata`, `ContenidoPage`, `Legal`.
- Patrón de `WorkType`: usar `const tw = useTranslations('WorkType'); tw(work.type)` en lugar de TYPE_LABELS hardcoded.
- Pluralización ICU: `"key": "{count, plural, =1 {1 cosa} other {# cosas}}"`, llamado con `t('key', { count })`.
- Rich text con tags HTML: `t.rich('key', { bold: chunks => <span>{chunks}</span> })`.
- Páginas client-only que necesitan `generateMetadata`: patrón **server-wrapper + client-island**. Ej. `faq/page.tsx` (server) → renderiza `<FaqClient />` (client). Aplicado a: faq, registro, recuperar-contrasena, nueva-contrasena.
- Selector de idioma: `src/components/language-switcher.tsx` (píldoras ES|EN), integrado en Header. Preserva pathname y query params al cambiar.
- **Traducción de fichas con IA bajo demanda**: `src/lib/translate/translate-card.ts`. Cuando un usuario visita `/en/ficha/X` y `card.original_locale === 'es'`, lee cache en `section_translations` + `card_translations` + `works.title_translations`/`overview_translations`. Si falta algo, una sola llamada a Claude (`claude-sonnet-4-6`) traduce TODO lo pendiente en bulk con respuesta JSON dentro de `<json>...</json>`. Persiste con upsert. Banner `TranslationBanner` muestra "Traducido automáticamente con IA" + "Ver original →" en plum.
- **Sitemap multi-locale**: `src/app/sitemap.ts` emite cada URL con `alternates.languages` (es, en, x-default) para hreflang.
- **Cuerpo legal**: aviso-legal, privacidad y cookies se mantienen en castellano para ambos locales (decisión consciente para no inventar texto legal). Banner aviso solo en `/en/`.

## Tablas en Supabase
- `works` — obras. Unique en tmdb_id y google_books_id. Extra para libros: isbn, publisher, pages, saga, saga_order. Nuevas columnas: `"cast"` text[], runtime integer, imdb_id text, letterboxd_url text, goodreads_url text, filmaffinity_url text, tracktv_url text, poster_url text. Ejecutar en Supabase si faltan: `ALTER TABLE works ADD COLUMN IF NOT EXISTS filmaffinity_url text; ALTER TABLE works ADD COLUMN IF NOT EXISTS tracktv_url text;`
- `contact_messages` — nombre, email, tipo (Sugerencia/Error/Otro), mensaje, user_id nullable, created_at. RLS: insert público, select solo admin
- `cards` — fichas (status: draft/published, is_committed: boolean, created_by: uuid, **summary** text nullable, **original_locale** text default 'es'). Migraciones SQL: `scripts/migration-summary.sql` (summary) y `scripts/migration-phase2-i18n.sql` (original_locale + tablas de traducción).
- `sections` — secciones en markdown
- `profiles` — usuario con rol (admin/editor/user), username único, is_active boolean
- `suggestions` — correcciones (status: pending/approved/rejected, user_id: uuid)
- `seasons` — temporadas (work_id, season_number, tmdb_season_id, episode_count, poster_path)
- `episodes` — episodios (season_id, episode_number, card_id nullable, tmdb_episode_id, still_path)
- `user_content` — user_id, work_id, episode_id, watched, watched_at, notes. RLS estricto por user_id
- `invites` — inviter_id, email, created_at. RLS estricto por inviter_id
- `section_translations` — section_id, locale, label, short_label, content, source ('ai'|'manual'|'tmdb'). UNIQUE (section_id, locale). RLS lectura pública.
- `card_translations` — card_id, locale, summary, source. UNIQUE (card_id, locale). RLS lectura pública.
- `works.title_translations` — jsonb `{"es":"…","en":"…"}` (no es tabla, columna).
- `works.overview_translations` — jsonb similar.

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

## Estado actual (4 mayo 2026 — sesión 3)

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

### Lifting visual / SEO / UX (sesión 1 mayo — noche)
- **Tipografía editorial**: Inter para cuerpo, Fraunces para titulares clave.
- **Paleta centralizada**: `src/lib/work-types.ts` exporta `TYPE_LABELS`, `TYPE_BADGE`, `TYPE_BADGE_SOLID`, `TYPE_HEX`.
- **Color `tide`** (#3a6fb0) reemplaza `bg-blue-600` para badges de películas.
- **Contrastes WCAG**: sweep global de opacidades de texto.
- **/buscar Server Component**: SSR + buscar-client.tsx para interactividad. Indexable por Google.
- **FeaturedCard rediseñada**: gradiente ember/moss, CTA "Ver el resumen", justify-between.
- **Footer rediseñado**: tagline + CTA "Únete" + enlaces legales.
- **Resumen rápido (TL;DR)**: columna `cards.summary`, editor con autoguardado, render en ficha pública. Migración SQL en `scripts/migration-summary.sql`.

### UX / visual (sesión 1 mayo — noche, sesión 2)
- **Hero**: H1 "Recuerda cualquier historia sin volver a verla". Subtítulo con "Spoilers incluidos" al principio. Trust bar compacta con cápsula: "📖 Spoilers completos · 🚫 Sin opiniones · ✏️ Fichas colaborativas". Bloque de 3 características eliminado.
- **Header**: Nav con "Catálogo" (→/buscar) y "Cómo funciona" (→/faq). "Inicio" y "Buscar" eliminados. "+ Añadir obra" con estilo ember. UserMenu como dropdown `juanes ▾` con Mi perfil + Cerrar sesión.
- **scrollbar-none**: CSS global añadido en globals.css para funcionar en todos los navegadores.
- **Home strips**: carrusel horizontal en todas las pantallas (eliminado sm:flex-wrap). "Ver todas" en cabecera de cada sección.
- **Ficha pública**: texto de secciones a ancho completo (eliminado max-w-2xl). Tamaño de letra 15px en contenido y overview.
- **Página /faq**: creada con preguntas frecuentes en acordeón por secciones (Sobre Spoilering, Las fichas, Contribuir, Cuenta).
- **destripando.com**: redirige a spoilering.com vía Cloudflare Page Rule (301 permanente).

### Fixes sesión 2 (cierre)
- **Ficha destacada aleatoria**: `Math.random()` entre las 20 más recientes. La ficha destacada no se repite en "Recién añadidas".
- **updated_at al publicar**: `PATCH /api/admin/cards/[id]/status` actualiza `updated_at = now()` al publicar, para que la ficha aparezca en "Recién añadidas".
- **Póster en editor**: cabecera del editor usa `meta.poster_url` en lugar de `card.work.poster_url` → preview en tiempo real al cambiar la URL.
- **Dominios Next.js Image**: añadidos `m.media-amazon.com`, `*.media-amazon.com`, `i.gr-assets.com`, `*.goodreads.com` a `remotePatterns` en `next.config.ts`.
- **Home force-dynamic**: `export const dynamic = 'force-dynamic'` en `src/app/page.tsx` para evitar caché de Vercel y mostrar siempre datos frescos.
- **destripando.com**: redirige a spoilering.com vía Cloudflare Page Rule (301 permanente) con registro DNS A proxy a 192.0.2.1.

### Sesión 4 mayo — empuje colaborativo
**Motivación**: feedback de usuarios reales — entran, buscan una obra, no la encuentran y se van. No entienden que es una web colaborativa donde el catálogo lo construye la propia comunidad. Se refuerza ese mensaje en los puntos de fuga clave.

- **Empty state de `/buscar` para todos los usuarios** (antes solo aparecía CTA si eras admin). Cuando una búsqueda no devuelve resultados, se muestra un bloque grande con borde ember: «{query}» todavía no está en Spoilering, explicación del modelo colaborativo y botón **+ Añadir esta obra** (va a `/nueva-obra` o `/login?redirect=/nueva-obra` según auth). Texto pequeño con fallback "¿O prefieres probar con otro título?".
- **Empty state en el dropdown de NavSearch**: antes el dropdown se ocultaba si no había coincidencias. Ahora aparece un panel inline con fondo ember y botón **+ Añade tú la ficha**. Si hay resultados, se mantiene el "Ver todos los resultados →".
- **Hero más comunitario**: subtítulo cambiado a "Una comunidad escribiendo resúmenes…" en lugar del genérico "Resúmenes completos…". Añadida una línea de prueba social entre los botones y la trust bar: **"X fichas escritas por la comunidad · ¿No está la tuya? Añádela."** El contador es el `count` exacto de Supabase (head:true count:'exact'), no el `length` del array limitado a 60.
- **CommunityCallout dismissible** (`src/components/community-callout.tsx`): bloque plum entre el hero y el contenido editorial, solo en home. Explica el modelo colaborativo en 2 frases ("No es un catálogo terminado, es un proyecto comunitario...") y enlaza a `/faq`. Dismissible con `localStorage` (`spoilering_community_callout_dismissed`). Una vez cerrado, no vuelve a aparecer en ese navegador.

### Sesión 9 mayo — internacionalización (i18n) completa
**Motivación**: abrir Spoilering a hablantes de inglés sin duplicar trabajo editorial. La fase 1 traduce toda la UI; la fase 2 traduce las fichas con IA bajo demanda y cachea.

**Stack**: next-intl 4.x, locales `['es','en']`, prefijo siempre, detección por `Accept-Language` con fallback a `es`.

**Fase 1 — UI traducida**:
- `src/i18n/{routing,navigation,request}.ts`. Plugin en `next.config.ts` con `createNextIntlPlugin('./src/i18n/request.ts')`.
- Todo el árbol movido a `src/app/[locale]/`. `api/`, `auth/callback/`, `global-error.tsx`, `robots.ts`, `sitemap.ts`, favicons SE QUEDAN en raíz.
- Layout único en `[locale]/layout.tsx` con `NextIntlClientProvider`, `setRequestLocale`, `generateStaticParams`, validación con `hasLocale`, `<html lang={locale}>` dinámico, `generateMetadata` con `alternates.languages` para hreflang automático.
- Middleware compuesto: `handleI18nRouting` + Supabase auth en pipeline. Salta i18n para `/api` y `/auth`. Protección admin migrada a regex `^/{es|en}/admin` con redirects locale-aware.
- Selector de idioma `LanguageSwitcher` (píldoras ES|EN) en Header. Preserva pathname y query params.
- Páginas client-only refactorizadas a patrón server-wrapper + client-island para soportar `generateMetadata`: faq, registro, recuperar-contrasena, nueva-contrasena.
- Cuerpo legal mantiene castellano en ambos locales con banner aviso en `/en/`.
- Plurales ICU en banners ("1 ficha pendiente" / "3 fichas pendientes"). Fechas con `dateLocale` (es-ES/en-US).

**Fase 2 — Fichas traducidas con IA**:
- Migración SQL: `scripts/migration-phase2-i18n.sql` (cards.original_locale, works.{title,overview}_translations jsonb, tablas section_translations y card_translations con UNIQUE (id, locale), RLS lectura pública, trigger updated_at).
- Helper `src/lib/translate/translate-card.ts` (server-only): lee cache, detecta lo que falta, llama UNA SOLA VEZ a Claude (claude-sonnet-4-6) con título + overview + summary + secciones pendientes en bulk, parsea JSON dentro de `<json>...</json>`, persiste con upsert.
- Integración en `[locale]/ficha/[slug]/page.tsx`: tras `getCard`, ejecuta `getOrCreateCardTranslation` en paralelo con seasons/credits cuando `locale !== card.original_locale`. Aplica overrides in-place sobre title, overview, summary, label, short_label y content de cada sección y subsección. Si Claude falla, sirve original (no rompe).
- `generateMetadata` usa solo cache (`work.title_translations[locale]`) — no dispara Claude antes del render.
- `TranslationBanner` (plum) sobre la ficha cuando hay traducción activa, con enlace "Ver original →" usando `Link locale={originalLocale}`.

**SEO**:
- Sitemap multi-locale con `alternates.languages` (es, en, x-default) por cada URL. `urlFor()` y `altLanguages()` helpers en `src/app/sitemap.ts`.
- `robots.ts` actualizado con disallow para `/admin`, `/perfil`, `/api`, `/auth` (y sus equivalentes con prefijo).

**Componentes refactorizados**:
- Globales: Header, Footer, UserMenu, NavSearch, BetaBanner, ContactModal, HeroActions, CommunityCallout, SignOutButton.
- Públicos: home, /buscar (con generateMetadata por locale), /login, /registro, /faq, /perfil, /ficha/[slug], /contenido/[slug], /nueva-obra, recuperar/nueva-contraseña.
- Públicos compartidos: SuggestBar, SuggestionModal, SpoilerGate, CardContent, UserContentPanel, SeasonsAccordion, EpisodeRow, TranslationBanner.
- Perfil: account-modals, perfil-cards-section, social-links-editor, note-widget, invite-widget.
- Admin: page principal, /admin/usuarios, /admin/sugerencias (+ acciones), /admin/contacto, /admin/nueva-ficha, /admin/nueva-obra, /admin/ficha/[id]/ficha-editor, admin-cards-filter, admin-users-table, draft-cards-section, inactive-drafts-section, orphan-works-section, pending-cards-section, contact-messages-list, SeasonsPanel.

### Cierre sesión 9 mayo (i18n + deploy preview)
- ✅ **Migración SQL fase 2 ejecutada en Supabase** (cards.original_locale, works.{title,overview}_translations, section_translations, card_translations).
- ✅ **Vercel preview construye OK** en commit `02b09b2`. URL: `spoilering-git-claude-dazzling-heyro-1aea74-jeraccoons-projects.vercel.app` (rama `claude/dazzling-heyrovsky-4f9775`).
- ✅ **Probado en preview**: cambio de idioma OK, traducción de fichas funciona.
- ⚠ **Observación**: la primera traducción tarda ~5-10s (Claude traduciendo ~2000-3600 palabras de golpe). Cache hit posterior es instantáneo. **Solución acordada**: implementar pre-traducción al publicar (próxima sesión, alta prioridad).
- ⚠ **NO mergeado a main todavía**. La rama está en preview, esperando que se implemente la pre-traducción para evitar la mala UX del primer visitante en `/en/`.

#### Bugs encontrados y arreglados durante el deploy a preview:
- `not-found.tsx` y `error.tsx` se quedaron en castellano en fase 1 → traducidos (commit `64a37cf`).
- `/admin/nueva-obra` falla en static prerender porque `useRouter` de @/i18n/navigation usa `useSearchParams` → wrap en Suspense (commit `4fc515c`) + force-dynamic en todas las admin pages, perfil y nueva-obra (commit `f59d324`).
- **Causa raíz**: el Header en el layout renderiza NavSearch y LanguageSwitcher (ambos client components con useSearchParams transitivo). Sin Suspense, cualquier página estática bailaba en prerender. Fix: envolver ambos en `<Suspense fallback={null}>` dentro del Header (commit `02b09b2`). Esto cura todas las páginas estáticas, no solo admin.

### Pendiente de resolver (próxima sesión)

#### Prioridad ALTA — bloquean el merge a producción
1. **Pre-traducción al publicar**: en `PATCH /api/admin/cards/[id]/status`, cuando una ficha pasa a `published`, lanzar `getOrCreateCardTranslation(card, 'en')` (y para cualquier locale no-original) en background sin `await` antes del response. Editor publica → respuesta inmediata. Mientras Claude traduce ~10s en segundo plano, cuando el primer visitante inglés llega ya tiene cache caliente.
   - Alternativa complementaria: paralelizar por sección dentro de `translate-card.ts` (4 calls de ~3s vs 1 de ~10s, mismo coste de tokens).

2. **Una vez resuelto lo anterior, mergear `claude/dazzling-heyrovsky-4f9775` a `main`** y desplegar a producción. La migración SQL ya está ejecutada.

#### Prioridad MEDIA
3. **Auto-fill de title_translations desde TMDb** al crear obra (`?language=en-US`). Reduce 1 traducción Claude por obra cuando se crea desde TMDb.
4. **Botón "Re-traducir"** en editor admin (`POST /api/admin/cards/[id]/retranslate?locale=en` que borra cache y regenera).
5. **Migrar `middleware.ts` a `proxy.ts`** — Next.js 16 marca middleware como deprecado. Mismo API, solo renombrar.
6. **profiles.locale** — preferencia de idioma del usuario.

#### Prioridad BAJA
7. **Migración SQL** (si no ejecutada): `scripts/migration-summary.sql` (summary, ya antiguo).
8. **Perfiles con redes sociales** — UI ya hecha, verificar columnas en `profiles`.
9. **Cleanup técnico**: `home-cards.tsx` probablemente huérfano. Centralizar TYPE_LABELS hardcoded.
10. **Emails de Supabase en idioma del usuario** — requiere editar templates en dashboard de Supabase.

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
