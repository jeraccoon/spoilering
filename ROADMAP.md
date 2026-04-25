# ROADMAP — Spoilering

## Visión del producto
Spoilering es una utilidad personal y colaborativa para gente que consume series, películas y libros. El objetivo es poder llevar un seguimiento y recordatorio de los contenidos que se ven o leen, con resúmenes completos con spoilers sin valoraciones de calidad. La IA apoya la creación de contenido pero se incentiva que sean los propios usuarios quienes generen y corrijan las fichas.

---

## Fase 1 — Antes de la beta

### Completado ✅
- [x] Textos legales (aviso legal, privacidad, cookies)
- [x] Mejorar libros — Open Library, ISBN, editorial, páginas, saga
- [x] Usuarios normales pueden crear fichas — límite 3, aprobación admin
- [x] Perfil de usuario estilo admin
- [x] Username elegido al registrarse con validación en tiempo real
- [x] Login con email o nombre de usuario
- [x] Recuperar contraseña, cambiar contraseña, eliminar cuenta
- [x] Panel de gestión de usuarios (/admin/usuarios)
- [x] Gestión de temporadas y capítulos — estructura series por temporada y episodio
- [x] Botón añadir obra visible en hero (solo usuarios logueados)
- [x] Autoguardado silencioso por sección en editor de fichas
- [x] Temporadas importadas automáticamente al crear una serie
- [x] Botón "Comprobar nuevas temporadas" sin borrar datos existentes
- [x] Borradores inactivos (+30 días) visibles en admin con opción eliminar
- [x] Estado de ficha separado de las acciones en editor (etiqueta vs botones)

### Pendiente
- [x] Bug: eliminar ficha actualiza estado local sin recargar página
- [x] Bug: eliminar ficha bloqueada por RLS — corregido usando adminClient en API
- [x] Obras sin ficha eliminables desde panel admin (borra el work completo con cascade)
- [ ] **Búsqueda por ISBN o enlace de Goodreads** — implementado pero no funciona
- [x] **Sugerir cambios desde ficha pública** — botón visible para todos, redirige a /login con mensaje si no está logueado, vuelve a la ficha tras login
- [x] **Invitar usuarios por email** — sección en perfil, límite 5/mes, tabla invites en Supabase
- [x] **Fecha de visionado y notas personales** — tabla `user_content`, panel Mi Actividad en ficha pública y perfil, marcado por obra y episodio
- [ ] **Botón sugerir corrección en editor** — visible arriba en el editor junto al estado de la ficha, no solo en la ficha pública
- [ ] **Revisar concepto "fichas incompletas"** — actualmente poco claro; evaluar si tiene sentido como métrica o si se sustituye por otro indicador más útil
- [x] Buscador inline en navbar — píldora expandible con dropdown de resultados
- [x] Información de director, actores y enlaces externos en ficha pública — bloque de metadatos con cast, runtime, géneros, enlaces a IMDb, Letterboxd, Goodreads, Netflix
- [ ] **Botón de contacto y sugerencias** — enlace o modal accesible desde el footer o navbar para enviar feedback al equipo
- [ ] **Corrección de fichas completa** — sugerir cambios en metadatos (director, año, póster, géneros)
- [ ] **Borrar o regenerar ficha** — eliminar ficha o regenerar secciones con IA
- [ ] **Home mejorada** — copy claro, opciones grid/lista, filtros por tipo
- [ ] **Diseño ficha pública** — markdown más cuidado, texto justificado
- [x] **Notas privadas** — cubierto por `user_content.notes` (misma funcionalidad)
- [ ] **FAQ** — qué es Spoilering, cómo funciona, cómo contribuir
- [ ] **Sistema de incentivos** — badges de colaborador, sello "editado por humanos" vs "generado por IA"

---

## Fase 2 — Beta cerrada
- [ ] Invitar grupo pequeño de usuarios de confianza
- [ ] Recoger feedback sobre bugs, UX y calidad del contenido
- [ ] Iterar y corregir según prioridad de impacto

---

## Fase 3 — Post-beta
- [ ] SEO y sitemap automático
- [ ] Buscador público mejorado con filtros y paginación
- [ ] Idiomas (i18n, español + inglés)
- [ ] Alojamiento propio (evaluar cuando haya más tráfico)
- [ ] Monetización (suscripción premium o donaciones)
- [ ] Sistema de revisiones con votación
- [ ] Favoritos y notificaciones
- [ ] Fichas relacionadas por género
- [ ] Comentarios

---

## Ideas a evaluar
- Estadísticas públicas: fichas más vistas, más buscadas
- Modo "sin spoilers" — solo sinopsis oficial
- Importar listas desde Letterboxd o Goodreads
