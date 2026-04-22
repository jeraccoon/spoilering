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
      <span className="text-sm font-medium text-zinc-600">@{username}</span>
      <button
        onClick={handleSignOut}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-ink"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
