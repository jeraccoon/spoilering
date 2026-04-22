import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from '@/components/user-menu'

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/buscar', label: 'Buscar' },
]

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let username: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    username = (profile as { username: string } | null)?.username ?? null
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link className="flex items-center gap-3 font-black tracking-tight text-ink" href="/">
          <span className="flex size-9 items-center justify-center rounded-lg bg-ink text-sm text-white">
            S
          </span>
          <span className="text-xl">Spoilering</span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-6 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-zinc-700 transition hover:text-ember"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user && username ? (
            <UserMenu username={username} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-zinc-700 transition hover:text-ink"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
