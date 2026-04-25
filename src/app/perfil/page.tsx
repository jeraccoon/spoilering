import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/sign-out-button'
import { AccountModals } from '@/components/account-modals'
import { DeleteCardButton } from '@/components/delete-card-button'
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

const COLOR_STYLES = {
  plum:  { card: 'bg-plum/10 border-plum/20 hover:bg-plum/15',  icon: 'text-plum',  text: 'text-plum' },
  moss:  { card: 'bg-moss/10 border-moss/20 hover:bg-moss/15',  icon: 'text-moss',  text: 'text-moss' },
  ember: { card: 'bg-ember/10 border-ember/20 hover:bg-ember/15', icon: 'text-ember', text: 'text-ember' },
}

function QuickLink({
  href, icon, label, color, disabled = false,
}: {
  href: string
  icon: string
  label: string
  color: keyof typeof COLOR_STYLES
  disabled?: boolean
}) {
  const styles = COLOR_STYLES[color]
  if (disabled) {
    return (
      <span className={`inline-flex cursor-not-allowed items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium opacity-40 ${styles.card} ${styles.text}`}>
        <span aria-hidden>{icon}</span>
        {label}
      </span>
    )
  }
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${styles.card} ${styles.text}`}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </Link>
  )
}

function StatCard({
  value,
  label,
  accent = 'text-ink',
}: {
  value: number | string
  label: string
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper px-5 py-5 shadow-sm">
      <p className={`text-4xl font-black tabular-nums ${accent}`}>{value}</p>
      <p className="mt-1.5 text-sm text-ink/50">{label}</p>
    </div>
  )
}

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
    .select('username, role, created_at')
    .eq('id', user.id)
    .single()

  const [{ data: cards }, { data: suggestions }, { data: notes }] = await Promise.all([
    (supabase.from('cards') as any)
      .select('*, work:works(*)')
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false }),
    (supabase.from('suggestions') as any)
      .select('id, created_at, status, section:sections(label, card:cards(work:works(title, slug)))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    (supabase.from('notes') as any)
      .select('id, content, updated_at, card:cards(work:works(title, slug))')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  const role: string = profile?.role ?? 'user'
  const isUser = role === 'user'
  const isPrivileged = role === 'admin' || role === 'editor'
  const username = profile?.username ?? user.email?.split('@')[0] ?? 'usuario'
  const initial = username[0].toUpperCase()
  const cardList: CardWithWork[] = cards ?? []
  const suggestionList: any[] = suggestions ?? []
  const noteList: any[] = notes ?? []
  const atLimit = isUser && cardList.length >= USER_CARD_LIMIT

  const publishedCount = cardList.filter((c) => c.status === 'published').length
  const pendingCount = cardList.filter((c) => c.status !== 'published').length
  const joinedAt = new Date(profile?.created_at ?? user.created_at).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const addHref = isPrivileged ? '/admin/nueva-obra' : '/nueva-obra'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Cabecera */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink">Mi perfil</h1>
          <p className="mt-1 text-sm text-ink/50">
            Bienvenido, <span className="font-semibold text-ink">{username}</span>
          </p>
        </div>
        {atLimit ? (
          <span className="cursor-not-allowed rounded-lg bg-ink/10 px-5 py-2.5 text-sm font-semibold text-ink/30">
            + Añadir obra
          </span>
        ) : (
          <Link
            href={addHref}
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90"
          >
            + Añadir obra
          </Link>
        )}
      </div>

      {/* Resumen */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Resumen</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            value={isUser ? `${cardList.length}/${USER_CARD_LIMIT}` : cardList.length}
            label="Fichas creadas"
            accent={isUser && atLimit ? 'text-ember' : 'text-ink'}
          />
          <StatCard
            value={publishedCount}
            label="Publicadas"
            accent={publishedCount > 0 ? 'text-moss' : 'text-ink'}
          />
          <StatCard
            value={pendingCount}
            label={isUser ? 'Pendientes de revisión' : 'En borrador'}
            accent={pendingCount > 0 ? 'text-amber-600' : 'text-ink'}
          />
          <StatCard value={suggestionList.length} label="Sugerencias enviadas" />
        </div>
        {isUser && atLimit && (
          <p className="mt-3 text-sm text-ember">
            Has alcanzado el límite de {USER_CARD_LIMIT} fichas. Contacta con nosotros para ampliar tu acceso.
          </p>
        )}
      </section>

      {/* Accesos rápidos */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Accesos rápidos</h2>
        <div className="flex flex-wrap gap-3">
          {role === 'admin' && (
            <>
              <QuickLink href="/admin" icon="⚙️" label="Panel de administración" color="plum" />
              <QuickLink href="/admin/usuarios" icon="👥" label="Gestión de usuarios" color="plum" />
              <QuickLink href="/admin/sugerencias" icon="✏️" label="Sugerencias pendientes" color="plum" />
              <QuickLink href="/admin" icon="📋" label="Fichas pendientes" color="plum" />
              <QuickLink href="/admin/nueva-obra" icon="➕" label="Nueva obra" color="plum" />
            </>
          )}
          {role === 'editor' && (
            <>
              <QuickLink href="/admin" icon="⚙️" label="Panel de administración" color="moss" />
              <QuickLink href="/admin/sugerencias" icon="✏️" label="Sugerencias pendientes" color="moss" />
              <QuickLink href="/admin/nueva-obra" icon="➕" label="Nueva obra" color="moss" />
            </>
          )}
          {role === 'user' && (
            <>
              <QuickLink
                href={atLimit ? '#' : '/nueva-obra'}
                icon="➕"
                label={`Añadir una obra (${USER_CARD_LIMIT - cardList.length} de ${USER_CARD_LIMIT} disponibles)`}
                color="ember"
                disabled={atLimit}
              />
              <QuickLink href="/buscar" icon="🔍" label="Explorar fichas" color="ember" />
              <QuickLink href="/faq" icon="❓" label="Ver el FAQ" color="ember" />
            </>
          )}
        </div>
      </section>

      {/* Mis fichas */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Mis fichas</h2>
        {cardList.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
            Todavía no has creado ninguna ficha.{' '}
            <Link href={addHref} className="font-semibold text-ember hover:underline">
              Añadir una obra →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Obra</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Actualizada</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {cardList.map((card) => (
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
                        <span className="font-semibold text-ink">{card.work.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[card.work.type as keyof typeof TYPE_COLORS]}`}>
                        {TYPE_LABELS[card.work.type as keyof typeof TYPE_LABELS]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/50 hidden md:table-cell">
                      {formatDate(card.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <CardStatusBadge status={card.status} isUser={isUser} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {card.status === 'published' && (
                          <Link
                            href={`/ficha/${card.work.slug}`}
                            className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink"
                          >
                            Ver
                          </Link>
                        )}
                        {isPrivileged && (
                          <Link
                            href={`/admin/ficha/${card.id}`}
                            className="text-xs font-semibold text-ink/50 underline underline-offset-2 hover:text-ink"
                          >
                            Editar
                          </Link>
                        )}
                        {card.status !== 'published' && (
                          <DeleteCardButton cardId={card.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Mis sugerencias */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Mis sugerencias</h2>
        {suggestionList.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
            Todavía no has enviado ninguna sugerencia.{' '}
            <Link href="/buscar" className="font-semibold text-ember hover:underline">
              Explorar fichas →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Ficha</th>
                  <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Sección</th>
                  <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {suggestionList.map((s: any) => {
                  const work = s.section?.card?.work
                  const statusInfo = SUGGESTION_STATUS[s.status] ?? SUGGESTION_STATUS.pending
                  return (
                    <tr key={s.id} className="transition hover:bg-ink/5">
                      <td className="px-4 py-3 font-semibold text-ink">
                        {work ? (
                          <Link href={`/ficha/${work.slug}`} className="hover:text-ember hover:underline">
                            {work.title}
                          </Link>
                        ) : (
                          <span className="text-ink/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink/50 hidden sm:table-cell">
                        {s.section?.label ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-ink/50 hidden md:table-cell">
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

      {/* Mis notas */}
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Mis notas</h2>
        {noteList.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/40">
            Todavía no has añadido ninguna nota.{' '}
            <Link href="/buscar" className="font-semibold text-ember hover:underline">
              Explorar fichas →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-ink/10 overflow-hidden rounded-lg border border-ink/10">
            {noteList.map((n: any) => {
              const work = n.card?.work
              return (
                <div key={n.id} className="flex flex-col gap-1 bg-paper px-4 py-3 transition hover:bg-ink/5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-ink">
                      {work ? (
                        <Link href={`/ficha/${work.slug}`} className="hover:text-ember hover:underline">
                          {work.title}
                        </Link>
                      ) : (
                        <span className="text-ink/40">—</span>
                      )}
                    </p>
                    <span className="shrink-0 text-xs text-ink/40">{formatDate(n.updated_at)}</span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-ink/50">{n.content}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Mi cuenta */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Mi cuenta</h2>
        <div className="overflow-hidden rounded-lg border border-ink/10 bg-paper shadow-sm">
          {/* Info + acciones */}
          <div className="flex flex-wrap items-center gap-6 px-6 py-5">
            <div className="flex size-14 flex-shrink-0 items-center justify-center rounded-full bg-ember text-2xl font-black text-paper">
              {initial}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate font-semibold text-ink">{user.email}</p>
              <p className="text-sm text-ink/50">Miembro desde {joinedAt}</p>
              <span className={`mt-0.5 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.user}`}>
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
              </span>
            </div>
            <div className="ml-auto">
              <AccountModals username={username} signOutButton={<SignOutButton />} />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
