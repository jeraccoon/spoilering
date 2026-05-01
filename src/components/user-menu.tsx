'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  username: string
}

export function UserMenu({ username }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 hover:text-ink"
      >
        {username}
        <svg
          viewBox="0 0 12 12"
          fill="currentColor"
          className={`h-3 w-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 8L1 3h10L6 8z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-lg">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-2.5 text-sm text-ink/70 transition hover:bg-ink/5 hover:text-ink"
          >
            Mi perfil
          </Link>
          <div className="mx-3 border-t border-ink/10" />
          <button
            onClick={handleSignOut}
            className="flex w-full items-center px-4 py-2.5 text-sm text-ink/60 transition hover:bg-ink/5 hover:text-ember"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
