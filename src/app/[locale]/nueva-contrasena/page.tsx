'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NuevaContrasenaPage() {
  const t = useTranslations('NuevaContrasenaPage')
  const router = useRouter()
  const [ready, setReady] = useState<boolean | null>(null)
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
      setError(t('errors.shortPassword'))
      return
    }
    if (password !== confirm) {
      setError(t('errors.mismatch'))
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
        <p className="text-sm text-ink/55">{t('verifying')}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-paper p-8 text-center shadow-sm">
          <p className="text-sm text-ink/70">
            {t('invalidLink')}{' '}
            <Link href="/recuperar-contrasena" className="font-semibold text-ember hover:underline">
              {t('requestNew')}
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
          <h1 className="text-xl font-black text-ink">{t('successTitle')}</h1>
          <p className="mt-3 text-sm text-ink/60">{t('successBody')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-ink">{t('title')}</h1>
          <p className="mt-2 text-sm text-ink/50">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
              {t('passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder={t('passwordPlaceholder')}
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-ink">
              {t('confirmLabel')}
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder={t('confirmPlaceholder')}
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
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
