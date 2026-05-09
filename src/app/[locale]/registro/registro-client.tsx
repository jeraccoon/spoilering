'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

const USERNAME_REGEX = /^[a-z0-9_]+$/

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

function UsernameHint({ state }: { state: UsernameState }) {
  const t = useTranslations('RegistroPage.username')
  if (state === 'checking') return <span className="text-ink/55">{t('checking')}</span>
  if (state === 'available') return <span className="font-semibold text-moss">{t('available')}</span>
  if (state === 'taken') return <span className="font-semibold text-ember">{t('taken')}</span>
  if (state === 'invalid') return <span className="text-ember">{t('invalid')}</span>
  return <span className="text-ink/55">{t('default')}</span>
}

export default function RegistroClient() {
  const t = useTranslations('RegistroPage')
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
      setError(t('errors.invalidUsername'))
      return
    }

    if (password.length < 6) {
      setError(t('errors.shortPassword'))
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
          ? t('errors.alreadyRegistered')
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
          <h1 className="text-xl font-black text-ink">{t('success.title')}</h1>
          <p className="mt-3 text-sm text-ink/60">
            {t.rich('success.body', {
              email,
              bold: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
            })}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-ink/50 underline hover:text-ink"
          >
            {t('success.back')}
          </Link>
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
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
              {t('emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-ink">
              {t('usernameLabel')}
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className={`w-full rounded-lg border bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:ring-2 ${borderClass(usernameState)}`}
              placeholder={t('usernamePlaceholder')}
              maxLength={20}
            />
            <p className="mt-1 text-[11px]">
              <UsernameHint state={usernameState} />
            </p>
          </div>

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
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/50">
          {t('haveAccount')}{' '}
          <Link href="/login" className="font-semibold text-ink underline hover:text-ember">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
