/**
 * Sustituye title/overview de un work por las traducciones cacheadas
 * (works.title_translations[locale], works.overview_translations[locale])
 * si existen para el locale dado.
 *
 * NO llama a Claude. Solo sirve cache. Si no hay traducción cacheada,
 * devuelve los valores originales sin modificar.
 *
 * Pensado para listados y búsquedas, donde no podemos pagar el coste de
 * traducción IA por cada item. La traducción profunda de la ficha se
 * dispara solo al entrar a /[locale]/ficha/[slug] vía translate-card.ts.
 */
export interface LocalizableWork {
  title: string
  overview?: string | null
  title_translations?: Record<string, string> | null
  overview_translations?: Record<string, string> | null
}

export function localizeWork<T extends LocalizableWork>(work: T, locale: string): T {
  const titleTrans = work.title_translations?.[locale]
  const overviewTrans = work.overview_translations?.[locale]
  if (!titleTrans && !overviewTrans) return work
  return {
    ...work,
    title: titleTrans ?? work.title,
    overview: overviewTrans ?? work.overview,
  }
}
