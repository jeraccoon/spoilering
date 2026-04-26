# Roadmap — Spoilering
_Última actualización: 26 abril 2026_

## Estado del proyecto
En producción en www.spoilering.com. Base completa funcionando. Fase actual: mejoras de UX, comunidad y calidad de datos.

---

## ✅ Completado

### Infraestructura y base
- Proyecto Next.js 15 + Supabase + Vercel
- Autenticación completa (registro, login por email o username, recuperar contraseña, eliminar cuenta)
- Roles: admin / editor / user con permisos diferenciados
- Deploy en producción con dominio propio

### Contenido y fichas
- Búsqueda en TMDb, Google Books y Open Library
- Creación de obras con slug automático y póster (URL o subida)
- Generación de secciones con IA (claude-sonnet-4-6) en paralelo
- Autoguardado de secciones (onBlur)
- Publicar / despublicar fichas
- Fichas de episodios individuales para series
- Gestión de temporadas importadas desde TMDb
- Metadatos enriquecidos: cast, runtime, imdb_id (movies y series), letterboxd_url, filmaffinity_url, tracktv_url, goodreads_url
- Al crear obra: auto-fetch de cast, runtime, imdb_id, tracktv_url (Trakt), letterboxd_url (via redirect IMDb, solo movies)

### Panel admin
- Estadísticas, gestión de fichas, sugerencias, fichas pendientes de aprobación
- Gestión de usuarios (cambiar rol, activar/desactivar, eliminar)
- Borradores inactivos +30 días visibles con opción de eliminar
- Obras sin ficha visibles con opción de eliminar

### Comunidad básica
- Sistema de sugerencias de corrección end-to-end
- Invitaciones por email (límite 5/mes por usuario)
- Visionado y notas por usuario (tabla user_content)
- Panel "Mi Actividad" en ficha pública y en perfil

---

## 🔧 En progreso / próxima sesión (tarde 26 abril)

### Fix urgente — Generar URLs en editor
- Crear `POST /api/admin/works/[id]/fetch-links`
  - Letterboxd: `fetch('https://letterboxd.com/imdb/{imdb_id}/', { redirect: 'manual' })` → capturar header Location
  - Trakt: `fetch('https://api.trakt.tv/search/tmdb/{tmdb_id}?type={show|movie}')` con TRAKT_API_KEY
  - Solo sobreescribir campos vacíos en BD (no pisar datos ya guardados)
- Conectar botón "Generar URL" del editor a este endpoint

### UX — Metadatos autoguardado
- Eliminar botón manual "Guardar borrador" de metadatos
- Cada campo guarda onBlur automáticamente (igual que secciones de contenido)

### UX — Marcar como vista al crear ficha
- En /admin/nueva-obra: añadir opción de marcar como vista con fecha opcional
- Misma UX que en el perfil (no solo checkbox simple)

---

## 📋 Backlog — Comunidad y perfiles

### Perfiles de usuario enriquecidos
- Añadir columnas en `profiles`: letterboxd_profile, tracktv_profile, goodreads_profile, filmaffinity_profile
- Mostrar en página de perfil público
- Pensar cómo enlazar actividad entre usuarios con perfiles externos

### Créditos de colaboración
- Mostrar en ficha pública: quién la creó y quién ha aportado sugerencias aprobadas
- Crear pequeña sección de "Contribuidores" en la ficha

### Aviso de revisión de IA
- Banner o texto en editor al generar contenido con IA
- Mensaje claro: "El contenido generado puede contener errores, revísalo antes de publicar"

---

## 📋 Backlog — Calidad de datos

### Búsqueda por ISBN / Goodreads
- La búsqueda por ISBN o enlace de Goodreads no funciona correctamente — revisar

### Filmaffinity URL automática
- Filmaffinity no tiene API pública — explorar si se puede buscar automáticamente o dejarlo solo manual

---

## 💡 Ideas futuras (no planificadas)

- SEO: metadatos Open Graph, sitemap automático
- Búsqueda pública mejorada (filtros por género, año, tipo)
- Valoraciones y listas de usuarios
- Notificaciones cuando se aprueba una sugerencia
- Estadísticas públicas de la plataforma
- Sistema de reputación por contribuciones
- App móvil
- Multidioma
