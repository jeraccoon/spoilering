'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/nueva-contrasena`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-ink">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-ink/50">
            Introduce tu email y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-ink/10 bg-paper p-6 text-center shadow-sm">
            <p className="text-sm text-ink/70">
              Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block text-sm font-semibold text-ink/50 underline hover:text-ink"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ember py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>

            <p className="text-center text-sm text-ink/50">
              <Link href="/login" className="text-ink/40 hover:text-ink hover:underline">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
