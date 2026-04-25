'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteCardButton({ cardId }: { cardId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta ficha? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-semibold text-ink/30 transition hover:text-ember disabled:opacity-40"
    >
      {deleting ? '…' : 'Eliminar'}
    </button>
  )
}
