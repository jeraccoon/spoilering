'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const t = useTranslations('LoginPage')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const mensaje = searchParams.get('mensaje')
  const banner = mensaje === 'registro-sugerir' ? t('banners.registroSugerir') : null

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let email = identifier.trim()

    if (!email.includes('@')) {
      const res = await fetch(`/api/get-email-by-username?username=${encodeURIComponent(email)}`)
      if (!res.ok) {
        setError(t('errors.userNotFound'))
        setLoading(false)
        return
      }
      const data = await res.json()
      email = data.email
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? t('errors.invalidCredentials')
          : signInError.message
      )
      setLoading(false)
      return
    }

    router.refresh()
    router.push(redirect ?? '/')
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {banner && (
          <div className="mb-6 rounded-lg border border-moss/30 bg-moss/5 px-4 py-3 text-sm text-moss">
            {banner}
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-ink">{t('title')}</h1>
          <p className="mt-2 text-sm text-ink/50">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-ink">
              {t('identifierLabel')}
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder={t('identifierPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
              {t('passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder={t('passwordPlaceholder')}
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

        <p className="mt-4 text-center text-sm text-ink/50">
          <Link href="/recuperar-contrasena" className="text-ink/55 hover:text-ink hover:underline">
            {t('forgot')}
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-ink/50">
          {t('noAccount')}{' '}
          <Link href="/registro" className="font-semibold text-ink underline hover:text-ember">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
