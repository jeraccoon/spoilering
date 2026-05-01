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
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3">
      <Link
        href="/buscar"
        className="w-full rounded-lg bg-ember px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-ember/90 hover:shadow-md sm:w-auto"
      >
        Buscar una obra
      </Link>
      <Link
        href={isLoggedIn ? '/nueva-obra' : '/login?redirect=/nueva-obra'}
        className="w-full rounded-lg border border-ember/40 px-6 py-3 text-base font-semibold text-ember transition hover:border-ember hover:bg-ember/5 sm:w-auto"
      >
        + Añadir obra
      </Link>
    </div>
  )
}
