'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const USERNAME_REGEX = /^[a-z0-9_]+$/

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function UsernameHint({ state }: { state: UsernameState }) {
  if (state === 'checking') return <span className="text-ink/55">Comprobando…</span>
  if (state === 'available') return <span className="font-semibold text-moss">✓ Disponible</span>
  if (state === 'taken') return <span className="font-semibold text-ember">✗ Ya está en uso</span>
  if (state === 'invalid') return <span className="text-ember">Mínimo 3, máximo 20. Solo letras minúsculas, números y guiones bajos.</span>
  return <span className="text-ink/55">Solo letras, números y guiones bajos. Sin espacios.</span>
}

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usernameState, setUsernameState] = useState<UsernameState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (username.length === 0) {
      setUsernameState('idle')
      return
    }

    if (username.length < 3 || username.length > 20 || !USERNAME_REGEX.test(username)) {
      setUsernameState('invalid')
      return
    }

    setUsernameState('checking')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        setUsernameState(data.available ? 'available' : 'taken')
      } catch {
        setUsernameState('idle')
      }
    }, 500)
    timerRef.current = timer

    return () => clearTimeout(timer)
  }, [username])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (usernameState !== 'available') {
      setError('Elige un nombre de usuario válido y disponible.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'Ya existe una cuenta con ese email.'
          : signUpError.message
      )
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const borderClass = (state: UsernameState) => {
    if (state === 'available') return 'border-moss focus:border-moss focus:ring-moss/20'
    if (state === 'taken' || state === 'invalid') return 'border-ember focus:border-ember focus:ring-ember/20'
    return 'border-ink/20 focus:border-ember focus:ring-ember/20'
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
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-ink">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className={`w-full rounded-lg border bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:ring-2 ${borderClass(usernameState)}`}
              placeholder="ej: juanperez"
              maxLength={20}
            />
            <p className="mt-1 text-[11px]">
              <UsernameHint state={usernameState} />
            </p>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
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
            disabled={loading || usernameState !== 'available'}
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
