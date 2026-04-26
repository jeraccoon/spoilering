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
- Deploy en producción en www.spoilering.com
- Build de Vercel corregido: docs/ excluido de TypeScript, tipo WorkWithCard añadido
- Botón de contacto y sugerencias (modal en footer, tabla contact_messages)

### Contenido y fichas
- Búsqueda en TMDb, Google Books y Open Library
- Creación de obras con slug automático y póster (URL o subida)
- Generación de secciones con IA (claude-sonnet-4-6) en paralelo
- Autoguardado de secciones (onBlur)
- Publicar / despublicar fichas
- Fichas de episodios individuales para series
- Gestión de temporadas y episodios importados desde TMDb
- Metadatos enriquecidos al crear obra desde TMDb (movies y series): cast, runtime, imdb_id
- En fichas públicas: información de director, actores, duración, géneros y enlaces a IMDb, Letterboxd, Filmaffinity, Goodreads, Trakt
- Buscador inline en navbar (sin ir a página especial)

### Panel admin
- Estadísticas, gestión de fichas, sugerencias, fichas pendientes de aprobación
- Gestión de usuarios: cambiar rol, activar/desactivar, eliminar
- Borradores inactivos +30 días visibles con opción de eliminar
- Obras sin ficha visibles con opción de eliminar

### Editor de fichas — metadatos
- Panel "Metadatos y enlaces" con campos editables por tipo de obra
- Cada campo guarda automáticamente onBlur (sin botón manual)
- "Ver en IMDb ↗" junto al campo imdb_id cuando tiene valor
- "Buscar en Letterboxd ↗", "Buscar en Filmaffinity ↗" y "Buscar en Trakt ↗" abren búsqueda manual
- Nota: Letterboxd y Trakt no se pueden auto-rellenar desde Vercel (bloqueados por Cloudflare)

### Comunidad básica
- Sistema de sugerencias de corrección de secciones end-to-end
- Invitaciones por email (límite 5/mes por usuario)
- Visionado y notas por usuario (tabla user_content, panel Mi Actividad en ficha y perfil)

---

## 🔧 Pendiente — próxima sesión (por prioridad)

### 1. Marcar como vista con fecha al crear ficha _(implementado pero pendiente de revisar)_
- En `/admin/nueva-obra`: opción de marcar como vista con fecha opcional
- Misma UX que en perfil (no solo checkbox)
- También mejorar el checkbox del editor al publicar (añadir campo de fecha)
- Claude Code lo implementó pero el resultado no es correcto — revisar y ajustar

### 2. Aviso de revisión de IA ✅
- Banner en editor cuando se genera contenido con IA — hecho

### 3. Bug — al eliminar ficha sigue apareciendo en el panel
- Después de eliminar una ficha, el panel admin no la quita sin recargar
- Hay que actualizar el estado local tras la eliminación

---

## 📋 Backlog — Comunidad y perfiles

### Perfiles de usuario con redes sociales
- Añadir columnas en `profiles`: letterboxd_profile, tracktv_profile, goodreads_profile, filmaffinity_profile
- Mostrar en perfil público con enlaces a esos perfiles externos

### Créditos de colaboración en ficha pública
- Mostrar quién creó la ficha y quién ha contribuido con sugerencias aprobadas
- Sección "Contribuidores" en la ficha pública

### Ampliar sistema de sugerencias a metadatos
- Actualmente solo permite sugerir cambios en el texto de secciones
- Debería permitir también corregir director, actores, año, etc.

### Botón "Sugerir corrección" más accesible
- Actualmente solo aparece en la ficha pública
- Valorar añadirlo también en más puntos de entrada (ficha incompleta, etc.)

---

## 📋 Backlog — Calidad de datos y UX

### Mejorar introducción de libros
- Revisar el flujo de creación y edición de fichas de libros
- Campos específicos (ISBN, editorial, saga) y búsqueda mejorada

### Replantear "fichas incompletas"
- El concepto actual de is_complete no es muy útil
- Pensar alternativa: indicador de calidad, campos mínimos obligatorios, etc.

### Búsqueda por ISBN / Goodreads no funciona
- Revisar el flujo en /admin/nueva-obra

---

## 💡 Ideas futuras (no planificadas)

- SEO: metadatos Open Graph, sitemap automático
- Búsqueda pública mejorada (filtros por género, año, tipo)
- Valoraciones y listas de usuarios
- Notificaciones cuando se aprueba una sugerencia
- Sistema de reputación por contribuciones
- Multidioma
- App móvil
