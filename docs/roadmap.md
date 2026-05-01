# Roadmap — Spoilering
_Última actualización: 1 mayo 2026 — noche_

## Estado del proyecto
En producción en www.spoilering.com. Base completa funcionando. Fase actual: mejoras de UX, comunidad y calidad de datos.

---

## ✅ Completado

### Infraestructura y base
- Proyecto Next.js 15 + Supabase + Vercel
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
- Headline: "El resumen que necesitabas" / subtítulo con spoilers incluidos
- Ficha destacada grande (la más reciente) con póster, título, descripción y botón
- Strip "Recién añadidas" con las siguientes 6
- Secciones separadas: Películas, Series, Libros (6 más recientes de cada tipo)
- Links "Ver todas →" filtrados: /buscar?tipo=movie, /buscar?tipo=series, /buscar?tipo=book
- Botón "Ver catálogo completo →" al final

### Catálogo /buscar
- Acepta ?tipo= en la URL para inicializar el filtro
- Browse mode: muestra catálogo sin necesidad de escribir query
- Al llegar filtrado desde la home, carga directamente ese tipo

### Consistencia visual
- Badges de tipo uniformes en toda la app: blue-600/90 (películas), plum/90 (series), moss/90 (libros)
- NavSearch y /buscar usan la misma paleta que la home
- Badge "Pendiente" en sugerencias usa paleta propia (bg-ink/8) en lugar de amber-100
- Copy de las 3 características de la home reescrito con más personalidad
- Placeholder del login corregido: "tu@email.com o tu_nombre"
- USER_CARD_LIMIT corregido a 5 en perfil/page.tsx

### Lifting visual + SEO + UX (1 mayo, noche)
- **Tipografía editorial**: Inter (cuerpo) + Fraunces (titulares serif) cargadas con `next/font/google`. Aplicada a H1 hero, H1 ficha, FAQ, /buscar y FeaturedCard.
- **Paleta unificada**: nuevo `src/lib/work-types.ts` con TYPE_LABELS, TYPE_BADGE, TYPE_BADGE_SOLID, TYPE_HEX. Color `tide` (#3a6fb0) sustituye al `bg-blue-600` antiguo. Cero ocurrencias de Tailwind colors fuera de paleta en el árbol src/.
- **Contraste WCAG AA**: sweep global subiendo `text-ink/30→/45`, `/40→/55`, `text-paper/40→/65`, placeholders `/30→/45` (~50 ficheros).
- **/buscar pasa a Server Component**: page.tsx (SSR con catálogo según `?tipo=`) + buscar-client.tsx (interactividad). Ahora indexable por Google. Metadata dinámica por tipo.
- **FeaturedCard arreglada**: pretítulo "Ficha destacada", `justify-between` (CTA abajo), sin `max-w-lg/xl`, gradiente ember/moss, CTA "Ver el resumen". Resuelve el problema de texto descuadrado.
- **Header móvil**: cabe en 360px+. Paddings y gaps responsive, logo más pequeño en móvil, "Iniciar sesión" hidden en móvil. "Registrarse" ya no se sale.
- **"Ver todas" como tarjeta fantasma** al final de cada strip (en vez de fila de cabecera con espacio en blanco).
- **Copy del hero rehecho**: H1 "Recuerda cualquier historia sin volver al principio" + nuevo subtítulo. Beneficios reescritos. CTAs grandes ("Buscar una obra"). Banner beta intacto.
- **Footer rediseñado**: dos filas, tagline "No es un agregador de reseñas...", CTA "Únete". Mucho más legible.
- **Resumen rápido (TL;DR) en ficha**: nueva columna `cards.summary` (requiere SQL `ALTER TABLE cards ADD COLUMN IF NOT EXISTS summary text;`). Editor con textarea autoguardable. Render arriba de la ficha pública dentro del SpoilerGate.

---

## 🔧 Pendiente — próxima sesión (por prioridad)

### 0. Migración SQL (manual)
- Ejecutar en Supabase: `ALTER TABLE cards ADD COLUMN IF NOT EXISTS summary text;` (script en `scripts/migration-summary.sql`).
- Sin esto, el guardado del Resumen rápido devuelve 500.

### 1. Perfiles con redes sociales
- Añadir letterboxd_profile, tracktv_profile, goodreads_profile, filmaffinity_profile en tabla profiles
- Mostrar en perfil público con enlaces

### 2. Créditos de colaboración en ficha pública
- Mostrar quién creó la ficha y quién ha contribuido con sugerencias aprobadas

### 3. Cleanup (técnico)
- `src/components/home-cards.tsx` parece huérfano (no se importa en ninguna ruta). Confirmar y borrar o documentar uso.
- Centralizar TYPE_LABELS también en componentes admin (admin/nueva-obra, admin/ficha/[id]/ficha-editor, draft-cards-section, etc.) usando `@/lib/work-types`.
- Algún refactor más fino del CardContent: el SpoilerGate envuelve la sección + summary; valorar si Resumen rápido debería ser visible SIN pasar el gate (porque algunos usuarios solo querrán el TL;DR rápido sin ver el resto).

### 4. Ideas potenciales (sin priorizar)
- "Antes de seguir con T2" — variante del Resumen rápido limitado a hasta el episodio/capítulo X (idea de ChatGPT, particularmente útil para series y sagas).
- "Si te gustó X, también te puede sonar Y" al final de cada ficha (3 obras del mismo género).
- Compartir tarjeta visual generada con `next/og` (poster + título + frase) para RR.SS.
- "Continuar leyendo" en home para usuarios logueados (últimas fichas vistas sin marcar como completadas).

---

## 📋 Backlog

- Ampliar sistema de sugerencias a metadatos (actores, director, año...)
- Notificaciones al usuario cuando se aprueba/rechaza una ficha o sugerencia
- Búsqueda pública mejorada: filtros por género y año
- Valoraciones y listas de usuario (quiero ver, puntuaciones...)
- Open Graph con imagen de póster por ficha
- JSON-LD estructurado para SEO
- Sistema de reputación por contribuciones
- Multidioma
