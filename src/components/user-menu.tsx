'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  username: string
}

export function UserMenu({ username }: Props) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm font-medium text-ink/50 sm:block">{username}</span>
      <Link
        href="/perfil"
        className="text-sm font-semibold text-ink/70 transition hover:text-ember"
      >
        Mi perfil
      </Link>
      <button
        onClick={handleSignOut}
        className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:border-ink/40 hover:text-ink"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
