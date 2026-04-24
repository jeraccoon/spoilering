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

### Pendiente
- [ ] **Búsqueda por ISBN o enlace de Goodreads** — implementado pero no funciona
- [ ] **Gestión de temporadas y capítulos** — estructura series por temporada y episodio
- [ ] **Corrección de fichas completa** — sugerir cambios en metadatos (director, año, póster, géneros)
- [ ] **Borrar o regenerar ficha** — eliminar ficha o regenerar secciones con IA
- [ ] **Enlaces externos en fichas** — IMDb, Letterboxd, Goodreads, Netflix según tipo
- [ ] **Home mejorada** — copy claro, opciones grid/lista, filtros por tipo
- [ ] **Diseño ficha pública** — markdown más cuidado, texto justificado
- [ ] **Notas privadas** — tabla `notes` con user_id, card_id, content. RLS estricto
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
