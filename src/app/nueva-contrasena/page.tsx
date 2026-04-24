'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevaContrasenaPage() {
  const router = useRouter()
  const [ready, setReady] = useState<boolean | null>(null) // null = cargando
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/perfil'), 2500)
  }

  if (ready === null) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <p className="text-sm text-ink/40">Verificando enlace…</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-paper p-8 text-center shadow-sm">
          <p className="text-sm text-ink/70">
            El enlace no es válido o ha expirado.{' '}
            <Link href="/recuperar-contrasena" className="font-semibold text-ember hover:underline">
              Solicitar uno nuevo →
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-paper p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="text-xl font-black text-ink">Contraseña actualizada</h1>
          <p className="mt-3 text-sm text-ink/60">Redirigiendo a tu perfil…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-ink">Nueva contraseña</h1>
          <p className="mt-2 text-sm text-ink/50">Elige una contraseña segura para tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-ink">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/30 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder="Repite la contraseña"
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
            {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
