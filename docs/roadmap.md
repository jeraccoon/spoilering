# Roadmap — Spoilering
_Última actualización: 1 mayo 2026_

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
- Metadatos enriquecidos al crear obra desde TMDb (movies y series): cast, runtime, imdb_id
- En fichas públicas: información de director, actores, duración, géneros y enlaces a IMDb, Letterboxd, Filmaffinity, Goodreads, Trakt
- Script de seed para poblar la BD: 25 películas, 10 series, 10 libros con temporadas y episodios

### Panel admin
- Estadísticas, gestión de fichas, sugerencias, fichas pendientes de aprobación
- Gestión de usuarios: cambiar rol, activar/desactivar, eliminar
- Borradores inactivos +30 días visibles con opción de eliminar
- Obras sin ficha visibles con opción de eliminar
- Aviso en cabecera (banner plum) para editores/admins cuando hay fichas pendientes de revisión
- Aviso en cabecera (banner ember) para admins cuando hay mensajes de contacto sin leer

### Editor de fichas — metadatos
- Panel "Metadatos y enlaces" con campos editables por tipo de obra, incluida URL del póster
- Cada campo guarda automáticamente onBlur (sin botón manual)
- "Ver en IMDb ↗" junto al campo imdb_id cuando tiene valor
- "Buscar en Letterboxd ↗", "Buscar en Filmaffinity ↗" y "Buscar en Trakt ↗" abren búsqueda manual
- is_complete eliminado completamente del código

### Comunidad básica
- Sistema de sugerencias de corrección de secciones end-to-end
- Invitaciones por email (límite 5/mes por usuario)
- Visionado y notas por usuario (tabla user_content)
- Panel "Mi Actividad" en ficha pública, en perfil y en editor admin
- "Mi Actividad" muestra "Leído"/"Marcar como leído" para libros y "Visto"/"Marcar como visto" para pelis y series

### Flujo de creación de fichas
- Campo `is_committed` en tabla `cards`: false al crear, true al guardar/publicar
- Fichas no confirmadas se excluyen del panel "Pendientes de revisión" del admin
- En perfil: badge "Sin confirmar" + enlace "Continuar →"
- Límite de 5 fichas por usuario normal

### Home editorial
- Ficha destacada grande (la más reciente) con póster, título, descripción y botón "Leer ficha"
- Strip "Recién añadidas" con las siguientes 6
- Secciones separadas: Películas, Series, Libros (6 más recientes de cada tipo)
- Links "Ver todas →" filtrados por tipo: `/buscar?tipo=movie`, `/buscar?tipo=series`, `/buscar?tipo=book`
- Botón "Ver catálogo completo →" al final

### Catálogo /buscar
- Acepta parámetro `?tipo=` en la URL para inicializar el filtro
- Muestra catálogo completo sin necesidad de escribir query (browse mode)
- Al llegar desde un link filtrado de la home, carga directamente ese tipo
- Búsqueda por texto con debounce mantiene el filtro activo

### UX del editor y ficha pública
- Secciones en acordeón — tanto en editor como en ficha pública
- Guardar borrador y Publicar guardan todas las secciones pendientes antes de cambiar estado
- Reparto y Filmaffinity ocultos en editor para libros
- Botón "+ Añadir obra" visible para todos en el hero (no logueados → login con redirect)
- Buscador inline en navbar con dropdown de resultados

### Metadatos y datos de obras
- Campo `country` en works con conversión ISO → español
- `original_title` mostrado en ficha pública debajo del título
- Editorial y páginas se rellenan automáticamente desde Google Books al buscar libro

---

## 🔧 Pendiente — próxima sesión (por prioridad)

### 1. Perfiles con redes sociales
- Añadir letterboxd_profile, tracktv_profile, goodreads_profile, filmaffinity_profile en tabla profiles
- Mostrar en perfil público con enlaces

### 2. Créditos de colaboración en ficha pública
- Mostrar quién creó la ficha y quién ha contribuido con sugerencias aprobadas

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
