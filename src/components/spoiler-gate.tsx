'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SpoilerGateProps {
  slug: string
  children: React.ReactNode
}

export function SpoilerGate({ slug, children }: SpoilerGateProps) {
  const router = useRouter()
  const storageKey = `spoiler-accepted:${slug}`
  const [state, setState] = useState<'checking' | 'blocked' | 'revealed'>('checking')

  useEffect(() => {
    setState(localStorage.getItem(storageKey) === '1' ? 'revealed' : 'blocked')
  }, [storageKey])

  function reveal() {
    localStorage.setItem(storageKey, '1')
    setState('revealed')
  }

  if (state === 'revealed') return <>{children}</>

  return (
    <div className="relative">
      <div
        className="pointer-events-none select-none overflow-hidden"
        style={{ filter: 'blur(6px)', maxHeight: '32rem' }}
        aria-hidden="true"
      >
        {children}
      </div>

      {state === 'blocked' && (
        <div className="absolute inset-0 flex items-start justify-center bg-paper/85 px-4 pt-16">
          <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-paper px-8 py-8 shadow-xl text-center">
            <p className="mb-3 text-4xl">⚠️</p>
            <h2 className="mb-2 text-xl font-black text-ink">
              Esta ficha contiene spoilers completos
            </h2>
            <p className="mb-6 text-sm text-ink/60">
              Si no has visto o leído la obra, te recomendamos no continuar.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={reveal}
                className="rounded-lg bg-ember px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90"
              >
                Mostrar de todas formas
              </button>
              <button
                onClick={() => router.push('/')}
                className="rounded-lg border border-ink/20 px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink/5"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
