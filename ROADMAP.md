# ROADMAP — Spoilering

## Visión del producto
Spoilering es una utilidad personal y colaborativa para gente que consume series, películas y libros. El objetivo es poder llevar un seguimiento y recordatorio de los contenidos que se ven o leen, con resúmenes completos con spoilers sin valoraciones de calidad. La IA apoya la creación de contenido pero se incentiva que sean los propios usuarios quienes generen y corrijan las fichas.

---

## Fase 1 — Antes de la beta

### Obligatorio
- [x] **Textos legales** — Aviso legal, Política de privacidad, Política de cookies ✅

### Producto
- [x] **Mejorar libros** — Open Library integrado, campos ISBN, editorial, páginas, saga ✅
- [ ] **Búsqueda por ISBN o enlace de Goodreads** — implementado pero no funciona, pendiente de revisar
- [ ] **Gestión de temporadas y capítulos** — Nueva estructura para series: temporadas > episodios
- [ ] **Corrección de fichas completa** — Sugerir cambios en metadatos: director, año, póster, géneros
- [ ] **Borrar o regenerar ficha** — opción para que el creador o admin elimine una ficha o regenere secciones con IA
- [ ] **Enlaces externos en fichas** — IMDb, Letterboxd, Goodreads, Netflix según el tipo de obra
- [ ] **Home mejorada** — copy claro sobre el propósito, opciones de visualización grid/lista, filtros por tipo
- [ ] **Diseño ficha pública** — markdown más cuidado, texto justificado, mejor tipografía

### Usuarios
- [x] **Usuarios normales pueden crear fichas** — límite de 3, pendientes de aprobación admin ✅
- [ ] **Perfil de usuario mejorado** — diseño similar al panel de /admin (PRÓXIMO PASO)
- [ ] **Username elegido al registrarse** — pedir username en el registro con validación de duplicados
- [ ] **Panel de gestión de usuarios** — ver usuarios, cambiar roles, ver actividad, desactivar cuentas
- [ ] **Recuperar y cambiar contraseña** — flujo de recuperación por email y cambio desde el perfil
- [ ] **Notas privadas** — cada usuario puede añadir notas a cualquier ficha, solo visibles para él. Tabla `notes` con user_id, card_id, content. RLS estricto.
- [ ] **FAQ** — qué es Spoilering, cómo funciona, quién puede contribuir
- [ ] **Sistema de incentivos** — badges de colaborador, sello "editado por humanos" vs "generado por IA"

---

## Fase 2 — Beta cerrada
- [ ] Invitar grupo pequeño de usuarios de confianza
- [ ] Recoger feedback sobre bugs, UX y calidad del contenido
- [ ] Iterar y corregir según prioridad de impacto
- [ ] Evaluar si el flujo de creación y edición es intuitivo para usuarios nuevos

---

## Fase 3 — Post-beta

### Crecimiento y visibilidad
- [ ] **SEO y sitemap automático** — metadatos dinámicos, og:image, sitemap.xml
- [ ] **Buscador público mejorado** — filtros por tipo, género, año. Paginación
- [ ] **Idiomas** — i18n con Next.js, español + inglés
- [ ] **Alojamiento propio** — evaluar migración desde Vercel cuando haya más tráfico
- [ ] **Monetización** — suscripción premium o donaciones tipo Ko-fi

### Comunidad
- [ ] **Sistema de revisiones con votación** — sugerencias públicas, votos, aprobación automática
- [ ] **Favoritos** — guardar fichas para leer después
- [ ] **Notificaciones** — avisar cuando una sugerencia es aprobada o se publica una ficha de interés
- [ ] **Fichas relacionadas** — basadas en géneros
- [ ] **Comentarios** — sistema ligero para debatir sobre las fichas

---

## Ideas a evaluar en el futuro
- Estadísticas públicas: fichas más vistas, más buscadas
- Modo "sin spoilers" para ver solo la sinopsis oficial
- Integración con Letterboxd o Goodreads para importar listas
