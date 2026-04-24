import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { CardWithWork } from '@/types/database'

const ROLE_LABELS = { admin: 'Administrador', editor: 'Editor', user: 'Usuario' }
const ROLE_COLORS = {
  admin: 'bg-ember/10 text-ember',
  editor: 'bg-moss/10 text-moss',
  user: 'bg-ink/10 text-ink/60',
}
const TYPE_LABELS = { movie: 'Película', series: 'Serie', book: 'Libro' }
const TYPE_COLORS = {
  movie: 'bg-blue-600 text-white',
  series: 'bg-purple-600 text-white',
  book: 'bg-amber-600 text-white',
}
const SUGGESTION_STATUS: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pendiente',  className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprobada',   className: 'bg-moss/10 text-moss' },
  rejected: { label: 'Rechazada',  className: 'bg-ember/10 text-ember' },
}

const USER_CARD_LIMIT = 3

function CardStatusBadge({ status, isUser }: { status: string; isUser: boolean }) {
  if (status === 'published') {
    return (
      <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-moss/10 text-moss">
        Publicada
      </span>
    )
  }
  if (isUser) {
    return (
      <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-700">
        Pendiente de revisión
      </span>
    )
  }
  return (
    <span className="rounded px-2 py-0.5 text-[11px] font-semibold bg-ink/10 text-ink/50">
      Borrador
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('username, role, created_at, reputation')
    .eq('id', user.id)
    .single()

  const [{ data: cards }, { data: suggestions }] = await Promise.all([
    (supabase.from('cards') as any)
      .select('*, work:works(*)')
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false }),
    (supabase.from('suggestions') as any)
      .select('id, created_at, status, suggested_content, section:sections(label, card:cards(work:works(title, slug)))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const initial = (user.email ?? 'U')[0].toUpperCase()
  const joinedAt = new Date(profile?.created_at ?? user.created_at).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const role: string = profile?.role ?? 'user'
  const isUser = role === 'user'
  const displayName = profile?.username ? `@${profile.username}` : user.email
  const cardCount = cards?.length ?? 0
  const atLimit = isUser && cardCount >= USER_CARD_LIMIT
  const suggestionList: any[] = suggestions ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Cabecera */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="flex size-16 flex-shrink-0 items-center justify-center rounded-full bg-ember text-2xl font-black text-paper">
            {initial}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xl font-bold text-ink">{displayName}</p>
            {profile?.username && (
              <p className="text-sm text-ink/50">{user.email}</p>
            )}
            <div className="flex items-center gap-2">
              <p className="text-sm text-ink/50">Miembro desde {joinedAt}</p>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.user}`}>
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Mis fichas */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/40">Mis fichas</h2>
            {isUser && (
              <p className="mt-0.5 text-sm text-ink/50">
                Has creado <span className="font-semibold text-ink">{cardCount}</span> de{' '}
                <span className="font-semibold text-ink">{USER_CARD_LIMIT}</span> fichas permitidas.
              </p>
            )}
          </div>
          {atLimit ? (
            <span className="cursor-not-allowed rounded-lg bg-ink/20 px-4 py-2 text-sm font-semibold text-ink/40">
              + Añadir obra
            </span>
          ) : (
            <Link
              href={isUser ? '/nueva-obra' : '/admin/nueva-obra'}
              className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember/90"
            >
              + Añadir obra
            </Link>
          )}
        </div>

        {isUser && atLimit && (
          <div className="mb-4 rounded-lg border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
            Has alcanzado el límite de {USER_CARD_LIMIT} fichas. Contacta con nosotros para ampliar tu acceso.
          </div>
        )}

        {(!cards || cards.length === 0) ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center">
            <p className="text-sm text-ink/40">Todavía no has creado ninguna ficha.</p>
            {!atLimit && (
              <Link
                href={isUser ? '/nueva-obra' : '/admin/nueva-obra'}
                className="mt-3 inline-block text-sm font-semibold text-ember hover:underline"
              >
                Añadir una obra →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Obra</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 bg-paper">
                {(cards as CardWithWork[]).map((card) => (
                  <tr key={card.id} className="transition hover:bg-ink/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-8 flex-shrink-0 overflow-hidden rounded">
                          {card.work.poster_url ? (
                            <Image
                              src={card.work.poster_url}
                              alt={card.work.title}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-ink/5 text-sm">📖</div>
                          )}
                        </div>
                        <Link
                          href={`/ficha/${card.work.slug}`}
                          className="font-semibold text-ink hover:text-ember hover:underline"
                        >
                          {card.work.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[card.work.type as keyof typeof TYPE_COLORS]}`}>
                        {TYPE_LABELS[card.work.type as keyof typeof TYPE_LABELS]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CardStatusBadge status={card.status} isUser={isUser} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sección: Mis sugerencias */}
      <section>
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/40">Mis sugerencias</h2>
          <p className="mt-0.5 text-sm text-ink/50">Correcciones que has propuesto sobre fichas existentes.</p>
        </div>

        {suggestionList.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center">
            <p className="text-sm text-ink/40">Todavía no has enviado ninguna sugerencia.</p>
            <Link href="/buscar" className="mt-3 inline-block text-sm font-semibold text-ember hover:underline">
              Explorar fichas →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Ficha · Sección</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 bg-paper">
                {suggestionList.map((s: any) => {
                  const work = s.section?.card?.work
                  const statusInfo = SUGGESTION_STATUS[s.status] ?? SUGGESTION_STATUS.pending
                  return (
                    <tr key={s.id} className="transition hover:bg-ink/5">
                      <td className="px-4 py-3">
                        {work ? (
                          <div>
                            <Link
                              href={`/ficha/${work.slug}`}
                              className="font-semibold text-ink hover:text-ember hover:underline"
                            >
                              {work.title}
                            </Link>
                            {s.section?.label && (
                              <p className="text-xs text-ink/40">{s.section.label}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink/50 hidden sm:table-cell">
                        {s.created_at ? formatDate(s.created_at) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  )
}
