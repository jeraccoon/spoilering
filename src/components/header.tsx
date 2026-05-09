import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserMenu } from '@/components/user-menu'
import { NavSearch } from '@/components/NavSearch'
import { LanguageSwitcher } from '@/components/language-switcher'

async function getUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single()

    const p = profile as { username: string; role: string } | null
    return {
      user,
      username: p?.username ?? null,
      role: p?.role ?? 'user',
    }
  } catch {
    return null
  }
}

async function getUnreadMessagesCount(): Promise<number> {
  try {
    const admin = createAdminClient()
    const { count } = await (admin.from('contact_messages') as any)
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
    return count ?? 0
  } catch {
    return 0
  }
}

async function getPendingCardsCount(): Promise<number> {
  try {
    const admin = createAdminClient()
    const { data: userProfiles } = await (admin.from('profiles') as any)
      .select('id')
      .eq('role', 'user')
    const userIds: string[] = (userProfiles ?? []).map((p: any) => p.id)
    if (userIds.length === 0) return 0
    const { count } = await (admin.from('cards') as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft')
      .eq('is_committed', true)
      .in('created_by', userIds)
    return count ?? 0
  } catch {
    return 0
  }
}

export async function Header() {
  const t = await getTranslations('Header')
  const auth = await getUser()
  const isPrivileged = auth?.role === 'admin' || auth?.role === 'editor'
  const isAdmin = auth?.role === 'admin'
  const addHref = isPrivileged ? '/admin/nueva-obra' : '/nueva-obra'
  const [unreadMessages, pendingCards] = await Promise.all([
    isAdmin ? getUnreadMessagesCount() : Promise.resolve(0),
    isPrivileged ? getPendingCardsCount() : Promise.resolve(0),
  ])

  const navItems = [
    { href: '/buscar', label: t('nav.catalog') },
    { href: '/faq', label: t('nav.howItWorks') },
  ] as const

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
      {pendingCards > 0 && (
        <Link
          href="/admin"
          className="flex w-full items-center justify-center gap-2 bg-plum/90 px-4 py-2 text-xs font-semibold text-white transition hover:bg-plum"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-black">
            {pendingCards}
          </span>
          {t('pendingCards', { count: pendingCards })}
          <span>→</span>
        </Link>
      )}
      {isAdmin && unreadMessages > 0 && (
        <Link
          href="/admin/contacto"
          className="flex w-full items-center justify-center gap-2 bg-ember px-4 py-2 text-xs font-semibold text-white transition hover:bg-ember/90"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-black">
            {unreadMessages}
          </span>
          {t('unreadMessages', { count: unreadMessages })}
          <span>→</span>
        </Link>
      )}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-6 sm:px-6 sm:py-4">

        <Link
          href="/"
          className="flex items-center gap-2 font-black tracking-tight text-ink sm:gap-3"
        >
          <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="size-7 sm:size-9">
            <rect width="36" height="36" rx="7" fill="#18181b"/>
            <ellipse cx="18" cy="18" rx="13" ry="8" fill="#fbfaf7"/>
            <circle cx="18" cy="18" r="6.5" fill="#d84f2a"/>
            <circle cx="18" cy="18" r="3.2" fill="#18181b"/>
            <circle cx="20.8" cy="15.5" r="1.6" fill="white" opacity="0.65"/>
          </svg>
          <span className="text-lg sm:text-xl">Spoilering</span>
        </Link>

        <nav aria-label={t('nav.primaryAria')} className="hidden items-center gap-6 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-ink/70 transition hover:text-ember"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Suspense fallback={null}>
            <NavSearch />
          </Suspense>
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          {auth?.user ? (
            <>
              <Link
                href={addHref}
                className="hidden rounded-lg border border-ember/50 px-3 py-1.5 text-sm font-semibold text-ember transition hover:border-ember hover:bg-ember/5 sm:block"
              >
                {t('addWork')}
              </Link>
              {auth.username ? (
                <UserMenu username={auth.username} />
              ) : (
                <Link href="/perfil" className="text-sm font-semibold text-ink/70 transition hover:text-ember">
                  {t('myProfile')}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-ink/70 transition hover:text-ink sm:block"
              >
                {t('login')}
              </Link>
              <Link
                href="/registro"
                className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-paper transition hover:bg-ember sm:px-4 sm:py-2"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  )
}
