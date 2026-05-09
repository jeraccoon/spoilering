'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { ContactMessage } from '@/app/[locale]/admin/contacto/page'

export function ContactMessagesList({
  initialMessages,
  typeLabels,
}: {
  initialMessages: ContactMessage[]
  typeLabels: Record<string, string>
}) {
  const t = useTranslations('Admin.contactList')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? 'en-US' : 'es-ES'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)
  const [marking, setMarking] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function markAsRead(id: string) {
    setMarking(id)
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, { method: 'PATCH' })
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => m.id === id ? { ...m, read_at: new Date().toISOString() } : m)
        )
      }
    } finally {
      setMarking(null)
    }
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-16 text-center text-sm text-ink/55">
        {t('empty')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => {
        const isUnread = !msg.read_at
        const isExpanded = expanded === msg.id
        return (
          <div
            key={msg.id}
            className={`rounded-lg border bg-paper transition ${
              isUnread ? 'border-ember/30 shadow-sm' : 'border-ink/10'
            }`}
          >
            {/* Cabecera */}
            <button
              onClick={() => setExpanded(isExpanded ? null : msg.id)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
            >
              <div className="flex items-start gap-3">
                {isUnread && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ember" />
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">
                      {msg.name ?? msg.email ?? t('anonymous')}
                    </span>
                    <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-ink/50">
                      {typeLabels[msg.type] ?? msg.type}
                    </span>
                    {isUnread && (
                      <span className="rounded bg-ember/10 px-1.5 py-0.5 text-[10px] font-semibold text-ember">
                        {t('newBadge')}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink/55">{formatDate(msg.created_at)}</p>
                </div>
              </div>
              <span className={`mt-1 shrink-0 text-xs text-ink/45 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Contenido expandido */}
            {isExpanded && (
              <div className="border-t border-ink/10 px-5 py-4">
                {msg.email && (
                  <p className="mb-3 text-sm">
                    <span className="font-semibold text-ink/60">{t('emailLabel')} </span>
                    <a href={`mailto:${msg.email}`} className="text-ember hover:underline">
                      {msg.email}
                    </a>
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {msg.message}
                </p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-xs text-ink/45">
                    {msg.read_at ? t('readAt', { date: formatDate(msg.read_at) }) : t('unread')}
                  </p>
                  {isUnread && (
                    <button
                      onClick={() => void markAsRead(msg.id)}
                      disabled={marking === msg.id}
                      className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/40 hover:text-ink disabled:opacity-40"
                    >
                      {marking === msg.id ? t('marking') : t('markRead')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
