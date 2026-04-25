'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function HeroActions() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link
        href="/buscar"
        className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90"
      >
        Explorar fichas
      </Link>
      {isLoggedIn && (
        <Link
          href="/nueva-obra"
          className="rounded-lg border border-ember/40 px-5 py-2.5 text-sm font-semibold text-ember transition hover:border-ember hover:bg-ember/5"
        >
          + Añadir obra
        </Link>
      )}
    </div>
  )
}
