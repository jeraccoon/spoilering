# Roadmap — Spoilering
_Última actualización: 26 abril 2026 (tarde)_

## Estado del proyecto
En producción en www.spoilering.com. Base completa funcionando. Fase actual: mejoras de UX, comunidad y calidad de datos.

---

## ✅ Completado

### Infraestructura y base
- Proyecto Next.js 15 + Supabase + Vercel
- Autenticación completa (registro, login por email o username, recuperar contraseña, eliminar cuenta)
- Roles: admin / editor / user con permisos diferenciados
- Deploy en producción con dominio propio
- Build de Vercel corregido: docs/ excluido de TypeScript, tipo WorkWithCard añadido

### Contenido y fichas
- Búsqueda en TMDb, Google Books y Open Library
- Creación de obras con slug automático y póster (URL o subida)
- Generación de secciones con IA (claude-sonnet-4-6) en paralelo
- Autoguardado de secciones (onBlur)
- Publicar / despublicar fichas
- Fichas de episodios individuales para series
- Gestión de temporadas importadas desde TMDb
- Metadatos enriquecidos al crear obra desde TMDb (movies y series): cast, runtime, imdb_id
- Auto-fetch letterboxd_url via redirect IMDb al crear película (puede fallar en Vercel por Cloudflare)

### Panel admin
- Estadísticas, gestión de fichas, sugerencias, fichas pendientes de aprobación
- Gestión de usuarios (cambiar rol, activar/desactivar, eliminar)
- Borradores inactivos +30 días visibles con opción de eliminar
- Obras sin ficha visibles con opción de eliminar

### Editor de fichas — metadatos
- Panel "Metadatos y enlaces" con campos editables por tipo de obra
- Cada campo guarda automáticamente onBlur (sin botón manual)
- "Ver en IMDb ↗" aparece junto al campo imdb_id cuando tiene valor
- "Buscar en Letterboxd ↗" usa imdb_id si existe para ir directo al film
- "Buscar en Filmaffinity ↗" y "Buscar en Trakt ↗" abren búsqueda manual
- Nota: Letterboxd y Trakt no se pueden auto-rellenar desde Vercel (bloqueados)

### Comunidad básica
- Sistema de sugerencias de corrección end-to-end
- Invitaciones por email (límite 5/mes por usuario)
- Visionado y notas por usuario (tabla user_content)
- Panel "Mi Actividad" en ficha pública y en perfil

---

## 🔧 Pendiente próxima sesión

### Fix — Borrador existente al crear obra duplicada
- Si el usuario crea una obra, abandona el borrador y vuelve a crearla, recibe error
- Debería redirigir al borrador existente en lugar de dar error
- Archivos: `src/app/api/admin/create-work/route.ts` y `src/app/admin/nueva-obra/page.tsx`
- Prompt ya preparado, pendiente de aplicar

### UX — Marcar como vista al crear ficha
- En `/admin/nueva-obra`: añadir opción con fecha de visionado opcional
- Misma UX que en el perfil (no solo checkbox)

### UX — Aviso de revisión de IA
- Banner visible en editor cuando se genera contenido con IA
- Mensaje: "Revisa el contenido antes de publicar, la IA puede cometer errores"

---

## 📋 Backlog — Comunidad y perfiles

### Perfiles de usuario con redes sociales
- Añadir columnas en `profiles`: letterboxd_profile, tracktv_profile, goodreads_profile, filmaffinity_profile
- Mostrar en página de perfil público con enlaces externos
- No empezado

### Créditos de colaboración en ficha pública
- Mostrar quién creó la ficha y quién ha aportado sugerencias aprobadas
- Sección "Contribuidores" en la ficha pública
- No empezado

---

## 📋 Backlog — Calidad de datos

### Búsqueda por ISBN / Goodreads no funciona
- Revisar el flujo en /admin/nueva-obra

### Filmaffinity URL automática
- No tiene API pública — solo manual por ahora

---

## 💡 Ideas futuras (no planificadas)

- SEO: metadatos Open Graph, sitemap automático
- Búsqueda pública mejorada (filtros por género, año, tipo)
- Valoraciones y listas de usuarios
- Notificaciones cuando se aprueba una sugerencia
- Sistema de reputación por contribuciones
- App móvil
- Multidioma
