'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/40 hover:bg-ink/5 hover:text-ink"
    >
      Cerrar sesión
    </button>
  )
}
