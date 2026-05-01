'use client'

import { useState, useMemo } from 'react'

export interface UserRow {
  id: string
  email: string
  username: string | null
  role: 'admin' | 'editor' | 'user'
  is_active: boolean
  created_at: string
  card_count: number
}

const ROLE_LABELS = { admin: 'Admin', editor: 'Editor', user: 'Usuario' }
const ROLE_COLORS = {
  admin: 'bg-plum/10 text-plum',
  editor: 'bg-moss/10 text-moss',
  user: 'bg-ink/10 text-ink/50',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function Avatar({ name }: { name: string }) {
  const initial = (name ?? 'U')[0].toUpperCase()
  return (
    <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-ember text-xs font-black text-paper">
      {initial}
    </div>
  )
}

export function AdminUsersTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[]
  currentUserId: string
}) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loadingMap, setLoadingMap] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const q = search.toLowerCase()
        if (!u.email.toLowerCase().includes(q) && !(u.username ?? '').toLowerCase().includes(q)) {
          return false
        }
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter === 'active' && !u.is_active) return false
      if (statusFilter === 'inactive' && u.is_active) return false
      return true
    })
  }, [users, search, roleFilter, statusFilter])

  function setLoading(id: string, action: string | null) {
    setLoadingMap((prev) => {
      const next = { ...prev }
      if (action === null) delete next[id]
      else next[id] = action
      return next
    })
  }

  async function changeRole(id: string, role: string) {
    setLoading(id, 'role')
    await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: role as UserRow['role'] } : u))
    setLoading(id, null)
  }

  async function toggleStatus(id: string, currentActive: boolean) {
    setLoading(id, 'status')
    await fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    })
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !currentActive } : u))
    setLoading(id, null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setDeleteError(data.error ?? 'Error al eliminar el usuario.')
      setDeleteLoading(false)
      return
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleteLoading(false)
  }

  return (
    <>
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por username o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-ember"
        >
          <option value="all">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="user">Usuario</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-ember"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Desactivados</option>
        </select>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-ink/10 bg-ink/5 px-6 py-10 text-center text-sm text-ink/55">
          No hay usuarios que coincidan con los filtros.
        </div>
      ) : (
        <div className="overflow-x-auto overflow-hidden rounded-lg border border-ink/10">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 bg-ink/5 text-xs text-ink/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Rol</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Registro</th>
                <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Fichas</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId
                const busy = loadingMap[u.id]
                return (
                  <tr key={u.id} className={`transition hover:bg-ink/5 ${!u.is_active ? 'opacity-50' : ''}`}>
                    {/* Usuario */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.username ?? u.email} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">
                            {u.username ?? <span className="text-ink/55 italic">sin username</span>}
                            {isSelf && <span className="ml-1.5 text-[10px] font-normal text-ink/45">(tú)</span>}
                          </p>
                          <p className="truncate text-xs text-ink/55">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {isSelf ? (
                        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={!!busy}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className={`rounded border border-ink/20 bg-paper px-2 py-0.5 text-xs font-semibold outline-none transition focus:border-ember disabled:opacity-50 ${ROLE_COLORS[u.role]}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="user">Usuario</option>
                        </select>
                      )}
                    </td>

                    {/* Registro */}
                    <td className="px-4 py-3 text-ink/50 hidden lg:table-cell">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Fichas */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-semibold tabular-nums text-ink">{u.card_count}</span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${u.is_active ? 'bg-moss/10 text-moss' : 'bg-ink/10 text-ink/55'}`}>
                        {u.is_active ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isSelf && (
                          <>
                            <button
                              onClick={() => toggleStatus(u.id, u.is_active)}
                              disabled={!!busy}
                              className="rounded-md border border-ink/20 px-2.5 py-1 text-xs font-semibold text-ink/60 transition hover:border-ink/40 hover:text-ink disabled:opacity-40"
                            >
                              {busy === 'status' ? '…' : u.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              disabled={!!busy}
                              className="rounded-md bg-ember/10 px-2.5 py-1 text-xs font-semibold text-ember transition hover:bg-ember/20 disabled:opacity-40"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Confirmar eliminación */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setDeleteTarget(null); setDeleteError(null) } }}
        >
          <div className="w-full max-w-sm rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-black text-ink">Eliminar usuario</h2>
            <p className="mb-5 text-sm text-ink/60">
              ¿Eliminar a{' '}
              <span className="font-semibold text-ink">
                {deleteTarget.username ?? deleteTarget.email}
              </span>
              ? Esta acción es irreversible.
            </p>

            {deleteError && (
              <p className="mb-4 rounded-lg border border-ember/30 bg-ember/5 px-3 py-2 text-sm text-ember">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
                className="text-sm text-ink/50 hover:text-ink"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
              >
                {deleteLoading ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
