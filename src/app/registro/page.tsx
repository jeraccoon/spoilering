'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegistroPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Ya existe una cuenta con ese email.'
          : error.message
      )
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">✉️</div>
          <h1 className="text-xl font-bold text-white">Revisa tu email</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Te hemos enviado un enlace de confirmación a <span className="text-zinc-200">{email}</span>.
            Haz clic en él para activar tu cuenta.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm text-zinc-400 underline hover:text-white">
            Volver al login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-white">Spoilering</Link>
          <p className="mt-2 text-sm text-zinc-400">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="tunombre"
              minLength={3}
              maxLength={30}
            />
            <p className="mt-1 text-[11px] text-zinc-600">Solo letras minúsculas, números y guiones bajos.</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-zinc-300 underline hover:text-white">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
