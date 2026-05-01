'use client'

import { useState } from 'react'

interface Props {
  initialLinks: {
    letterboxd_profile: string | null
    tracktv_profile: string | null
    goodreads_profile: string | null
    filmaffinity_profile: string | null
  }
}

const NETWORKS = [
  {
    key: 'letterboxd_profile',
    label: 'Letterboxd',
    placeholder: 'https://letterboxd.com/tuusuario/',
    href: (v: string) => v,
  },
  {
    key: 'tracktv_profile',
    label: 'Trakt.tv',
    placeholder: 'https://trakt.tv/users/tuusuario',
    href: (v: string) => v,
  },
  {
    key: 'goodreads_profile',
    label: 'Goodreads',
    placeholder: 'https://www.goodreads.com/user/show/...',
    href: (v: string) => v,
  },
  {
    key: 'filmaffinity_profile',
    label: 'Filmaffinity',
    placeholder: 'https://www.filmaffinity.com/es/userratings.php?user_id=...',
    href: (v: string) => v,
  },
] as const

export function SocialLinksEditor({ initialLinks }: Props) {
  const [links, setLinks] = useState({
    letterboxd_profile: initialLinks.letterboxd_profile ?? '',
    tracktv_profile: initialLinks.tracktv_profile ?? '',
    goodreads_profile: initialLinks.goodreads_profile ?? '',
    filmaffinity_profile: initialLinks.filmaffinity_profile ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveField(key: string, value: string) {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value.trim() || null }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Error al guardar')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch {
      setError('Error de red')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/55">Mis perfiles externos</h2>
        <div className="flex items-center gap-2 text-xs">
          {saving && <span className="text-ink/55">Guardando…</span>}
          {saved && !saving && <span className="text-moss">Guardado ✓</span>}
          {error && <span className="text-ember">{error}</span>}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-ink/10 bg-paper">
        <div className="grid grid-cols-1 divide-y divide-ink/10 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {NETWORKS.map((net, i) => {
            const value = links[net.key]
            return (
              <div
                key={net.key}
                className={`px-4 py-4 ${i >= 2 ? 'sm:border-t sm:border-ink/10' : ''}`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink/60">{net.label}</label>
                  {value && (
                    <a
                      href={net.href(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-ember/70 hover:text-ember"
                    >
                      Ver perfil ↗
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={value}
                  onChange={(e) => setLinks((p) => ({ ...p, [net.key]: e.target.value }))}
                  onBlur={(e) => void saveField(net.key, e.target.value)}
                  placeholder={net.placeholder}
                  className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
