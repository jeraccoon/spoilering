import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SuggestionActions } from './suggestion-actions'

async function getSuggestions() {
  const supabase = await createClient()
  const { data } = await (supabase.from('suggestions') as any)
    .select('*, section:sections(label, card:cards(work:works(title, slug)))')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  return (data ?? []) as any[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function SugerenciasPage() {
  const suggestions = await getSuggestions()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Link href="/admin" className="text-sm font-semibold text-ink/55 transition hover:text-ink">
          ← Admin
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-ink">Sugerencias pendientes</h1>
        {suggestions.length > 0 && (
          <span className="rounded-full bg-ember/10 px-3 py-1 text-sm font-semibold text-ember">
            {suggestions.length}
          </span>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-16 text-center text-ink/55">
          No hay sugerencias pendientes.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {suggestions.map((s: any) => {
            const workTitle = s.section?.card?.work?.title ?? '—'
            const workSlug = s.section?.card?.work?.slug
            const sectionLabel = s.section?.label ?? '—'

            return (
              <div key={s.id} className="rounded-lg border border-ink/10 bg-paper p-5 shadow-sm">

                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {workSlug ? (
                      <Link
                        href={`/ficha/${workSlug}`}
                        className="font-bold text-ink transition hover:text-ember"
                        target="_blank"
                      >
                        {workTitle}
                      </Link>
                    ) : (
                      <p className="font-bold text-ink">{workTitle}</p>
                    )}
                    <p className="mt-0.5 text-sm text-ink/50">
                      Sección: <span className="font-semibold text-ink/70">{sectionLabel}</span>
                      <span className="mx-1.5 text-ink/45">·</span>
                      {formatDate(s.created_at)}
                    </p>
                  </div>
                  <SuggestionActions id={s.id} />
                </div>

                {s.comment && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                    <span className="font-semibold">Comentario:</span> {s.comment}
                  </div>
                )}

                <div className={`grid gap-3 ${s.original_content ? 'sm:grid-cols-2' : ''}`}>
                  {s.original_content && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink/55">
                        Texto actual
                      </p>
                      <div className="max-h-48 overflow-y-auto rounded-lg bg-ink/5 p-3 text-xs leading-relaxed text-ink/60 whitespace-pre-wrap">
                        {s.original_content}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-moss">
                      Texto sugerido
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-lg bg-moss/5 p-3 text-xs leading-relaxed text-ink whitespace-pre-wrap">
                      {s.suggested_content}
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
