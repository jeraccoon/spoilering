/**
 * Constantes canónicas para los tipos de obra (movie | series | book).
 *
 * Importa siempre desde aquí en componentes nuevos. Los duplicados
 * dispersos en otros ficheros son deuda técnica pendiente de migrar.
 *
 * Paleta de badges alineada con la paleta global de Tailwind:
 *   movie  → tide  (#3a6fb0) — azul marino tranquilo
 *   series → plum  (#6d4f72) — morado discreto
 *   book   → moss  (#52715a) — verde oliva
 */

import type { WorkType } from '@/types/database'

export const TYPE_LABELS: Record<WorkType, string> = {
  movie: 'Película',
  series: 'Serie',
  book: 'Libro',
}

export const TYPE_LABELS_PLURAL: Record<WorkType, string> = {
  movie: 'Películas',
  series: 'Series',
  book: 'Libros',
}

/** Clases Tailwind para badges con fondo de tipo. Usar versión /90 sobre paper. */
export const TYPE_BADGE: Record<WorkType, string> = {
  movie: 'bg-tide/90 text-white',
  series: 'bg-plum/90 text-white',
  book: 'bg-moss/90 text-white',
}

/** Clases Tailwind para badges sin opacidad (fondos sólidos sobre fondos no-paper). */
export const TYPE_BADGE_SOLID: Record<WorkType, string> = {
  movie: 'bg-tide text-white',
  series: 'bg-plum text-white',
  book: 'bg-moss text-white',
}

/** Color hexadecimal por tipo, útil cuando se necesita inline (e.g. SVG fill). */
export const TYPE_HEX: Record<WorkType, string> = {
  movie: '#3a6fb0',
  series: '#6d4f72',
  book: '#52715a',
}
