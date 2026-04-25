import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from '@/components/user-menu'
import { NavSearch } from '@/components/NavSearch'

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/buscar', label: 'Buscar' },
]

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

export async function Header() {
  const auth = await getUser()
  const isPrivileged = auth?.role === 'admin' || auth?.role === 'editor'
  const addHref = isPrivileged ? '/admin/nueva-obra' : '/nueva-obra'

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">

        <Link
          href="/"
          className="flex items-center gap-3 font-black tracking-tight text-ink"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-ink text-sm font-black text-paper">
            S
          </span>
          <span className="text-xl">Spoilering</span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-6 sm:flex">
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

        <div className="flex items-center gap-3">
          <NavSearch />
          {auth?.user ? (
            <>
              <Link
                href={addHref}
                className="hidden rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:border-ink/40 hover:text-ink sm:block"
              >
                + Añadir obra
              </Link>
              {auth.username ? (
                <UserMenu username={auth.username} />
              ) : (
                <Link href="/perfil" className="text-sm font-semibold text-ink/70 transition hover:text-ember">
                  Mi perfil
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-ink/70 transition hover:text-ink"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ember"
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
