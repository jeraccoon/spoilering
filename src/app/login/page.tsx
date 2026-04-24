'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos.'
        : error.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/')
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-ink">Inicia sesión</h1>
          <p className="mt-2 text-sm text-ink/50">Bienvenido de nuevo a Spoilering</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1.5">
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

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-ember/30 bg-ember/5 px-3 py-2 text-sm text-ember">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ember py-2.5 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink/50">
          <Link href="/recuperar-contrasena" className="text-ink/40 hover:text-ink hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-ink/50">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-ink underline hover:text-ember">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
