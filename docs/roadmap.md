# Roadmap — Spoilering
_Última actualización: 9 mayo 2026 (sesión 4 — i18n)_

## Estado del proyecto
En producción en www.spoilering.com. Base completa funcionando, **incluida internacionalización (ES + EN) con UI completamente traducida y traducción de fichas con IA bajo demanda**. Fase actual: pulido SEO multi-locale y mejoras de calidad de datos.

---

## ✅ Completado

### Internacionalización (sesión 4 — 9 mayo 2026) ✅
**Fase 1 — UI traducida (ES + EN)**:
- next-intl 4.x instalado, plugin en `next.config.ts`
- Routing en `src/i18n/{routing,navigation,request}.ts`, locales `['es','en']`, prefijo siempre
- Detección automática por `Accept-Language`, fallback a `es`
- 301 desde URLs sin prefijo (`/login` → `/es/login`)
- Todo el árbol movido a `src/app/[locale]/` (mantienen raíz: api, auth, global-error, sitemap, robots, favicons)
- Layout con `NextIntlClientProvider`, `setRequestLocale`, `generateStaticParams`
- Middleware compuesto: i18n + Supabase auth, salta `/api` y `/auth`
- Selector ES|EN en navbar (preserva pathname y query)
- Mensajes en `messages/{es,en}.json` con ~30 namespaces
- Patrón server-wrapper + client-island para páginas client-only que necesitan `generateMetadata`
- Plurales ICU, `t.rich()` para HTML inline, fechas con `dateLocale`
- Páginas legales se mantienen en castellano para ambos locales (decisión consciente, banner aviso en `/en/`)

**Fase 2 — Traducción de fichas con IA bajo demanda**:
- Migración SQL `scripts/migration-phase2-i18n.sql`: cards.original_locale, works.{title,overview}_translations jsonb, tablas section_translations + card_translations con UNIQUE (id, locale)
- Helper `src/lib/translate/translate-card.ts` — server-only — lee cache, llama una sola vez a Claude (claude-sonnet-4-6) con todo lo pendiente en bulk, persiste con upsert
- Banner `TranslationBanner` en plum cuando hay traducción IA activa, con "Ver original →"
- Si Claude falla → sirve original (no rompe la página)

**SEO**:
- Sitemap multi-locale con `alternates.languages` (es, en, x-default) por URL
- `robots.ts` con disallow en `/admin`, `/perfil`, `/api`, `/auth`

### Infraestructura y base
- Proyecto Next.js 16 + Supabase + Vercel
- Autenticación completa (registro, login por email o username, recuperar contraseña, eliminar cuenta)
- Roles: admin / editor / user con permisos diferenciados
- Deploy en producción en www.spoilering.com
- Sitemap dinámico que genera rutas para todas las fichas publicadas
- Variable NEXT_PUBLIC_SITE_URL en Vercel para URLs canónicas correctas
- covers.openlibrary.org añadido a dominios de imagen permitidos

### Contenido y fichas
- Búsqueda en TMDb, Google Books y Open Library
- Creación de obras con slug automático y póster (URL o subida)
- Generación de secciones con IA (claude-sonnet-4-6) en paralelo
- IA devuelve NO_CONOCIDA si no conoce la obra — no se guarda contenido inventado
- Autoguardado de secciones (onBlur)
- Publicar / despublicar fichas
- Fichas de episodios individuales para series
- Gestión de temporadas y episodios importados desde TMDb (upsert, no borra datos)
- Metadatos enriquecidos al crear obra desde TMDb: cast, runtime, imdb_id
- En fichas públicas: director, actores, duración, géneros y enlaces externos
- Script de seed: 25 películas, 10 series, 10 libros con temporadas y episodios

### Panel admin
- Estadísticas, gestión de fichas, sugerencias, fichas pendientes de aprobación
- Gestión de usuarios: cambiar rol, activar/desactivar, eliminar
- Borradores inactivos +30 días visibles con opción de eliminar
- Obras sin ficha visibles con opción de eliminar
- Aviso en cabecera (banner plum) para editores/admins cuando hay fichas pendientes de revisión
- Aviso en cabecera (banner ember) para admins cuando hay mensajes de contacto sin leer

### Editor de fichas
- Panel "Metadatos y enlaces" con campos editables por tipo, incluida URL del póster
- Autoguardado onBlur en todos los campos
- is_complete eliminado completamente del código
- Panel "Mi Actividad" visible en el editor admin (además de en ficha pública y perfil)

### Comunidad básica
- Sistema de sugerencias de corrección end-to-end
- Invitaciones por email (límite 5/mes por usuario)
- Panel "Mi Actividad": visionado, fecha y notas personales
- "Leído"/"Marcar como leído" para libros, "Visto"/"Marcar como visto" para pelis y series
- Límite de 5 fichas por usuario normal

### Home editorial
- H1 "Recuerda cualquier historia sin volver a verla" + subtítulo con spoilers
- Trust bar compacta: "📖 Spoilers completos · 🚫 Sin opiniones · ✏️ Fichas colaborativas"
- Ficha destacada grande (FeaturedCard) con póster, título, descripción y CTA "Ver el resumen"
- Strip "Recién añadidas" + secciones Películas, Series, Libros (6 más recientes de cada tipo)
- Carrusel horizontal en todas las pantallas (sin flex-wrap)
- Links "Ver todas →" en cabecera de cada sección, filtrados por tipo
- Botón "Explorar catálogo completo →" al final
- Sección de características eliminada como bloque independiente

### Catálogo /buscar
- Acepta ?tipo= en la URL para inicializar el filtro
- Browse mode: muestra catálogo sin necesidad de escribir query
- Al llegar filtrado desde la home, carga directamente ese tipo

### Header y navegación
- Nav: logo → Catálogo (/buscar) → Cómo funciona (/faq) → buscador → + Añadir obra → usuario
- "Inicio" eliminado del nav (el logo ya lleva a home)
- "Buscar" eliminado del nav (redundante con la caja de búsqueda)
- "+ Añadir obra" con estilo ember (border + text)
- UserMenu como dropdown: `juanes ▾` → Mi perfil · Cerrar sesión
- scrollbar-none funcional en globals.css para todos los navegadores
- Página /faq creada con preguntas frecuentes en acordeón por secciones

### Ficha pública
- Texto de secciones a ancho completo (eliminado max-w-2xl interno)
- Tamaño de letra del contenido bajado a 15px (coherente con overview)
- Créditos al pie: creador de la ficha + contribuidores con sugerencias aprobadas

### Lifting visual + SEO + UX (1 mayo, noche)
- **Tipografía editorial**: Inter (cuerpo) + Fraunces (titulares serif)
- **Paleta unificada**: `src/lib/work-types.ts` con TYPE_LABELS, TYPE_BADGE, TYPE_BADGE_SOLID, TYPE_HEX. Color `tide` (#3a6fb0) para películas.
- **Contraste WCAG AA**: sweep global de opacidades de texto
- **/buscar Server Component**: SSR + buscar-client.tsx para interactividad
- **Footer rediseñado**: tagline + CTA "Únete" + enlaces legales
- **Resumen rápido (TL;DR)**: columna `cards.summary`, editor con autoguardado, render en ficha pública

### Empuje colaborativo (4 mayo, sesión 3)
Los nuevos visitantes no entendían que es una web colaborativa: buscaban una obra, no la encontraban y se iban. Se refuerza la idea en los puntos de fuga.
- **Empty state de `/buscar` visible para todos**: antes solo el admin veía el CTA. Ahora un bloque grande explica el modelo y ofrece **+ Añadir esta obra** (va a /nueva-obra o /login según auth).
- **Empty state en el dropdown de NavSearch**: panel inline con CTA **+ Añade tú la ficha** cuando la búsqueda del navbar no devuelve resultados.
- **Hero más comunitario**: subtítulo "Una comunidad escribiendo resúmenes…" + línea de prueba social con contador real "X fichas escritas por la comunidad · ¿No está la tuya? Añádela.".
- **CommunityCallout dismissible**: bloque plum solo en home, entre hero y contenido editorial. Explica que el catálogo lo escribe la comunidad. Dismissible con localStorage.

---

## 🔧 Pendiente — próxima sesión (por prioridad)

### 0. Migraciones SQL (manual, si no ejecutadas)
- **CRÍTICO**: ejecutar `scripts/migration-phase2-i18n.sql` en Supabase. Sin esto, las visitas a `/en/...` no podrán cachear traducciones.
- Si no estaba aún: `scripts/migration-summary.sql` (ya antiguo).

### 1. Pulido i18n — pre-traducción al publicar
- La primera vista en `/en/...` espera ~5-10s mientras Claude traduce. Solución: trigger en background al publicar para tener cache caliente cuando llegue el primer usuario.
- Implementación posible: extender `PATCH /api/admin/cards/[id]/status` para que cuando pase a `published` lance `getOrCreateCardTranslation` para todos los locales no-original sin esperar respuesta.

### 2. Pulido i18n — auto-fill de title_translations desde TMDb
- TMDb permite `?language=en-US` y devuelve el título oficial inglés. Aprovecharlo al crear obra: una llamada extra para rellenar `works.title_translations` sin pasar por Claude.
- Aplica a películas y series. Para libros (Google Books), el título viene siempre en inglés u original — menos crítico.

### 3. Botón "Re-traducir" en editor admin
- Cuando una traducción IA queda mala. Endpoint `POST /api/admin/cards/[id]/retranslate?locale=en` que borra de `section_translations` y `card_translations` para ese locale y vuelve a llamar al pipeline.

### 4. profiles.locale (preferencia de idioma del usuario)
- Migración: `ALTER TABLE profiles ADD COLUMN locale text;`.
- Al iniciar sesión, si `profiles.locale` está set y el usuario no está en ese locale, redirigir.
- Toggle en perfil para guardar la preferencia explícita.

### 5. Migrar `middleware.ts` a `proxy.ts`
- Next.js 16 marca `middleware` como deprecado. Renombrar el archivo (mismo API).

### 6. Perfiles con redes sociales (verificar BD)
- UI ya implementada (`SocialLinksEditor`). Verificar que columnas letterboxd_profile, tracktv_profile, goodreads_profile, filmaffinity_profile existen en `profiles` o crear migración.

### 7. Cleanup técnico
- `src/components/home-cards.tsx` parece huérfano. Confirmar y borrar.
- Centralizar TYPE_LABELS en componentes admin usando `@/lib/work-types` o el namespace `WorkType` (algunos sitios todavía usan literales).

### 8. Resumen rápido (TL;DR) — pendiente desde sesiones anteriores
- Se eliminó de la ficha pública y del editor por ser redundante con el `overview` de la obra.
- La columna `cards.summary` sigue en BD por si se reactiva en el futuro.
- **Propuesta para reimplantar**: generado por IA condensando todas las secciones de la ficha en 3-5 frases con spoilers completos. Completamente distinto al overview. Visible solo dentro del SpoilerGate.

### 9. Subida de imagen de portada
- Pegar URL externa funciona; falta opción de subir archivo desde el dispositivo.
- Supabase Storage con bucket `posters` (acceso público).

### 10. Feedback de guardado en el editor
- Toast "Guardado ✓" / "Guardando…" / "Error al guardar" tras cada autoguardado.

### 11. Ideas potenciales (sin priorizar)
- "Antes de seguir con T2" — resumen limitado hasta el episodio/capítulo X.
- "Si te gustó X, también te puede sonar Y" — 3 obras del mismo género al final de cada ficha.
- Compartir tarjeta visual generada con `next/og` para RR.SS.
- "Continuar leyendo" en home para usuarios logueados.
- Soporte de más idiomas (FR, DE, IT, PT) en `routing.locales`.
- Emails de Supabase en idioma del usuario (requiere editar templates en dashboard).

---

## 🌍 Multidioma — RESUELTO con modelo de traducción cacheada

**Decisión final**: en vez de duplicar fichas por idioma, una sola ficha tiene un `original_locale` y las traducciones a otros idiomas se generan con IA bajo demanda y se cachean en tablas `section_translations` y `card_translations`. Una sola entrada en `works` con `title_translations` y `overview_translations` jsonb cubre los metadatos.

**Por qué este modelo y no el de cards-por-idioma:**
- Una sola fuente de verdad por ficha → no hay drift entre versiones.
- El editor escribe en su idioma original, la traducción se genera sola.
- Las correcciones (sugerencias) van al original; las traducciones se regeneran si hace falta.
- Slugs siguen siendo únicos por obra, sin sufijos.
- Coste mínimo: una llamada a Claude por (ficha, idioma_destino), cacheada para siempre.

**Mejoras pendientes en el pipeline (no bloquean producción)**:
- Pre-traducir al publicar (background job) para que el primer usuario en `/en/` no espere ~5-10s.
- Auto-fill de `title_translations` desde TMDb usando `?language=en-US` al crear obra.
- Botón "Re-traducir" en editor admin para forzar regeneración cuando una traducción quede mala.
- Soporte para más idiomas (FR, DE, IT, PT) — solo hay que añadirlos a `routing.locales`.

---

## 📋 Backlog

- Ampliar sistema de sugerencias a metadatos (actores, director, año...)
- Notificaciones al usuario cuando se aprueba/rechaza una ficha o sugerencia
- Búsqueda pública mejorada: filtros por género y año
- Valoraciones y listas de usuario (quiero ver, puntuaciones...)
- Ordenar fichas en el perfil de usuario: por orden alfabético, fecha de creación, estado (publicada/borrador), tipo de obra
- Open Graph con imagen de póster por ficha
- JSON-LD estructurado para SEO
- Sistema de reputación por contribuciones
