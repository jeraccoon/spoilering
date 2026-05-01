# Roadmap — Spoilering
_Última actualización: 1 mayo 2026 — tarde_

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
