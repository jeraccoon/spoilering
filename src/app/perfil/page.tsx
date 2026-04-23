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

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('username, role, created_at, reputation')
    .eq('id', user.id)
    .single()

  const { data: cards } = await (supabase.from('cards') as any)
    .select('*, work:works(*)')
    .eq('created_by', user.id)
    .order('updated_at', { ascending: false })

  const initial = (user.email ?? 'U')[0].toUpperCase()
  const joinedAt = new Date(profile?.created_at ?? user.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const role: string = profile?.role ?? 'user'
  const displayName = profile?.username ? `@${profile.username}` : user.email

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      <div className="flex items-start gap-6">
        <div className="flex size-20 flex-shrink-0 items-center justify-center rounded-full bg-ember text-3xl font-black text-paper">
          {initial}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xl font-bold text-ink">{displayName}</p>
          {profile?.username && (
            <p className="text-sm text-ink/50">{user.email}</p>
          )}
          <p className="text-sm text-ink/50">Miembro desde {joinedAt}</p>
          <span className={`mt-1 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.user}`}>
            {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
          </span>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-ink">
          Mis fichas
          {cards && cards.length > 0 && (
            <span className="ml-2 text-sm font-normal text-ink/40">({cards.length})</span>
          )}
        </h2>

        {(!cards || cards.length === 0) ? (
          <div className="rounded-lg border border-ink/10 px-6 py-10 text-center">
            <p className="text-sm text-ink/40">Todavía no has creado ninguna ficha.</p>
            <Link
              href="/buscar"
              className="mt-3 inline-block text-sm font-semibold text-ember hover:underline"
            >
              Explorar fichas existentes
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(cards as CardWithWork[]).map((card) => (
              <Link
                key={card.id}
                href={`/ficha/${card.work.slug}`}
                className="flex items-center gap-4 rounded-lg border border-ink/10 bg-paper p-3 transition hover:border-ink/25 hover:shadow-sm"
              >
                <div className="relative size-10 flex-shrink-0 overflow-hidden rounded">
                  {card.work.poster_url ? (
                    <Image
                      src={card.work.poster_url}
                      alt={card.work.title}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-ink/5 text-xl">📖</div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-sm font-semibold text-ink">{card.work.title}</p>
                  <p className="text-xs text-ink/40">
                    {TYPE_LABELS[card.work.type as keyof typeof TYPE_LABELS]}
                    {card.work.year ? ` · ${card.work.year}` : ''}
                  </p>
                </div>

                <div className="ml-auto flex flex-shrink-0 items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_COLORS[card.work.type as keyof typeof TYPE_COLORS]}`}>
                    {TYPE_LABELS[card.work.type as keyof typeof TYPE_LABELS]}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${card.status === 'published' ? 'bg-moss/10 text-moss' : 'bg-ink/10 text-ink/50'}`}>
                    {card.status === 'published' ? 'Publicada' : 'Borrador'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
