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
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-paper p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">✉️</div>
          <h1 className="text-xl font-black text-ink">Revisa tu email</h1>
          <p className="mt-3 text-sm text-ink/60">
            Te hemos enviado un enlace de confirmación a{' '}
            <span className="font-semibold text-ink">{email}</span>.
            Haz clic en él para activar tu cuenta.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-ink/50 underline hover:text-ink"
          >
            Volver al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-ink">Crea tu cuenta</h1>
          <p className="mt-2 text-sm text-ink/50">Únete a Spoilering</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-ink mb-1.5">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder="tunombre"
              minLength={3}
              maxLength={30}
            />
            <p className="mt-1 text-[11px] text-ink/40">Solo letras minúsculas, números y guiones bajos.</p>
          </div>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
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
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/50">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-ink underline hover:text-ember">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
