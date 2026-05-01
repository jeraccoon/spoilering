# Roadmap — Spoilering
_Última actualización: 1 mayo 2026 — noche (sesión 2)_

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

---

## 🔧 Pendiente — próxima sesión (por prioridad)

### 0. Migración SQL (manual, si no ejecutada)
- Ejecutar en Supabase: `ALTER TABLE cards ADD COLUMN IF NOT EXISTS summary text;`
- Sin esto, el guardado del Resumen rápido devuelve 500.

### 1. Perfiles con redes sociales
- Añadir letterboxd_profile, tracktv_profile, goodreads_profile, filmaffinity_profile en tabla profiles
- Mostrar en perfil público con enlaces

### 2. Cleanup técnico
- `src/components/home-cards.tsx` parece huérfano. Confirmar y borrar.
- Centralizar TYPE_LABELS en componentes admin usando `@/lib/work-types`.
- Valorar si el Resumen rápido debería ser visible SIN pasar el SpoilerGate.

### 3. Subida de imagen de portada
- Actualmente el póster se añade pegando una URL externa. Añadir opción de subir un archivo desde el dispositivo.
- Requiere almacenamiento: Supabase Storage es la opción natural (ya en el stack). Crear un bucket `posters` con acceso público.
- El flujo sería: usuario selecciona archivo → upload a Supabase Storage → se guarda la URL pública en `works.poster_url`.
- Aplica tanto en la creación de obra (`/admin/nueva-obra`) como en el editor de metadatos (`/admin/ficha/[id]`).

### 4. Feedback de guardado en el editor de fichas
- Actualmente el autoguardado (onBlur) funciona pero el usuario no tiene confirmación visual clara de que sus cambios se han guardado.
- Mejorar el indicador: toast o mensaje visible tipo "Guardado ✓" que aparezca brevemente tras cada guardado exitoso.
- Considerar también un indicador de "Guardando..." mientras la petición está en vuelo, y "Error al guardar" si falla.
- Aplica a secciones, metadatos y resumen rápido.

### 5. Ideas potenciales (sin priorizar)
- "Antes de seguir con T2" — resumen limitado hasta el episodio/capítulo X.
- "Si te gustó X, también te puede sonar Y" — 3 obras del mismo género al final de cada ficha.
- Compartir tarjeta visual generada con `next/og` para RR.SS.
- "Continuar leyendo" en home para usuarios logueados.

---

## 🌍 Multidioma — ítem estratégico importante

El objetivo es que Spoilering funcione en varios idiomas sin duplicar obras. Una misma obra (ej. "El Principito") debe tener una sola entrada en `works`, pero poder tener fichas (`cards`) en distintos idiomas escritas por comunidades diferentes.

**Modelo propuesto:**
- Añadir columna `language` (código ISO: 'es', 'en', 'fr'...) a la tabla `cards`.
- Una obra puede tener múltiples cards, una por idioma.
- El usuario ve la ficha en su idioma (detectado por navegador o seleccionado manualmente).
- Si no existe ficha en su idioma, se muestra la disponible con aviso.
- Las URLs podrían ser `/ficha/[slug]` con header `Accept-Language`, o `/ficha/[slug]/en`.

**Implicaciones técnicas a resolver:**
- Gestión de slugs: ¿slug por obra o por card+idioma?
- Búsqueda y catálogo filtrados por idioma del usuario.
- Panel admin: crear/editar fichas por idioma.
- La IA genera el contenido en el idioma de la ficha.
- Sitemap con `hreflang` por idioma.

**Prioridad:** alta a medio plazo. Bloquear decisiones de arquitectura de `cards` teniendo esto en mente antes de escalar el catálogo.

---

## 📋 Backlog

- Ampliar sistema de sugerencias a metadatos (actores, director, año...)
- Notificaciones al usuario cuando se aprueba/rechaza una ficha o sugerencia
- Búsqueda pública mejorada: filtros por género y año
- Valoraciones y listas de usuario (quiero ver, puntuaciones...)
- Open Graph con imagen de póster por ficha
- JSON-LD estructurado para SEO
- Sistema de reputación por contribuciones
