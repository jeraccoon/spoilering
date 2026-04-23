# ROADMAP — Spoilering

## Visión del producto
Spoilering es una utilidad personal y colaborativa para gente que consume series, películas y libros. El objetivo es poder llevar un seguimiento y recordatorio de los contenidos que se ven o leen, con resúmenes completos con spoilers sin valoraciones de calidad. La IA apoya la creación de contenido pero se incentiva que sean los propios usuarios quienes generen y corrijan las fichas.

---

## Fase 1 — Antes de la beta

### Obligatorio
- [ ] **Textos legales** — Aviso legal, Política de privacidad, Política de cookies. Sin esto no se puede invitar a usuarios externos.

### Producto
- [ ] **Mejorar libros** — Integrar Open Library como fuente alternativa a Google Books. Añadir campos específicos: ISBN, editorial, número de páginas, saga.
- [ ] **Gestión de temporadas y capítulos** — Nueva estructura de datos para series: temporadas > episodios. Rediseñar secciones para series.
- [ ] **Corrección de fichas completa** — El sistema de sugerencias actual solo permite cambiar el texto de una sección. Ampliar para poder sugerir cambios en director, año, póster, géneros y otros metadatos.
- [ ] **Enlaces externos en fichas** — IMDb, Letterboxd, Goodreads, Netflix, etc. según el tipo de obra.
- [ ] **Home mejorada** — Reescribir el copy para dejar claro el propósito (utilidad personal, sin valoraciones). Añadir opciones de visualización: grid (actual), lista compacta. Filtros por tipo (película/serie/libro).
- [ ] **Diseño ficha pública** — Estilos de markdown más cuidados, texto justificado, mejor tipografía.

### Usuarios
- [ ] **Panel de gestión de usuarios** — Interfaz estilo /admin para ver usuarios, cambiar roles, ver actividad, desactivar cuentas.
- [ ] **Recuperar y cambiar contraseña** — Flujo de recuperación por email y cambio desde el perfil. Supabase ya lo soporta.
- [ ] **Nombres de usuario con mayúsculas** — Mostrar con mayúsculas aunque se guarden en minúsculas internamente para evitar duplicados.
- [ ] **Notas privadas** — Cada usuario puede añadir notas a cualquier ficha, solo visibles para él. Tabla `notes` con `user_id`, `card_id`, `content`. RLS estricto. Ejemplo de uso: "vi esto con María en 2019", "me quedé en el capítulo 4".
- [ ] **FAQ** — Explicar qué es Spoilering, cómo funciona, quién puede contribuir, qué son los spoilers en este contexto.
- [ ] **Sistema de incentivos** — Borradores básicos de IA con huecos evidentes. Badges de colaborador en el perfil. Sello visible "editado por humanos" vs "generado por IA".

---

## Fase 2 — Beta cerrada

- [ ] Invitar a un grupo pequeño de usuarios de confianza
- [ ] Recoger feedback sobre bugs, UX y calidad del contenido
- [ ] Iterar y corregir según prioridad de impacto
- [ ] Evaluar si el flujo de creación y edición de fichas es intuitivo para usuarios nuevos

---

## Fase 3 — Post-beta

### Crecimiento y visibilidad
- [ ] **SEO y sitemap automático** — Metadatos dinámicos por ficha, og:image, sitemap.xml para que Google indexe las fichas.
- [ ] **Buscador público mejorado** — Filtros por tipo, género, año. Paginación.
- [ ] **Idiomas** — Internacionalización con Next.js. Español + inglés de entrada.
- [ ] **Alojamiento propio** — Evaluar migración desde Vercel cuando haya más tráfico o coste lo justifique.
- [ ] **Monetización** — Suscripción premium (sin anuncios, funciones extra) o donaciones tipo Ko-fi.

### Comunidad
- [ ] **Sistema de revisiones con votación** — Fase 2 del sistema de sugerencias: sugerencias públicas, votos, aprobación automática al llegar a X votos.
- [ ] **Favoritos** — Guardar fichas para leer después.
- [ ] **Notificaciones** — Avisar cuando una sugerencia es aprobada o se publica una ficha de interés.
- [ ] **Fichas relacionadas** — Basadas en géneros: "si te gustó X, quizás te interese Y".
- [ ] **Comentarios** — Sistema ligero para que los usuarios debatan sobre las fichas.

---

## Ideas a evaluar en el futuro
- Estadísticas públicas: fichas más vistas, más buscadas
- Modo "sin spoilers" para ver solo la sinopsis oficial
- Integración con Letterboxd o Goodreads para importar listas
