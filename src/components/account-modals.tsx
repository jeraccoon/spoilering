'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  username: string
  signOutButton: React.ReactNode
}

export function AccountModals({ username, signOutButton }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<'none' | 'password' | 'delete'>('none')

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function closeModal() {
    setModal('none')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setPasswordSuccess(false)
    setPasswordLoading(false)
    setDeleteConfirm('')
    setDeleteError(null)
    setDeleteLoading(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    setPasswordLoading(true)
    const supabase = createClient()

    // Verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setPasswordError('No se pudo verificar tu sesión.')
      setPasswordLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      setPasswordError('La contraseña actual no es correcta.')
      setPasswordLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setPasswordError(updateError.message)
      setPasswordLoading(false)
      return
    }

    setPasswordSuccess(true)
    setPasswordLoading(false)
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    setDeleteError(null)

    if (deleteConfirm !== username) {
      setDeleteError('El nombre de usuario no coincide.')
      return
    }

    setDeleteLoading(true)
    const res = await fetch('/api/account', { method: 'DELETE' })

    if (!res.ok) {
      const data = await res.json()
      setDeleteError(data.error ?? 'Error al eliminar la cuenta.')
      setDeleteLoading(false)
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/?cuenta=eliminada')
  }

  return (
    <>
      {/* Acciones principales */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setModal('password')}
          className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/40 hover:bg-ink/5 hover:text-ink"
        >
          Cambiar contraseña
        </button>
        {signOutButton}
      </div>

      {/* Zona de peligro */}
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50/60 px-4 py-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-red-400">
          Zona de peligro
        </p>
        <p className="mb-2 text-xs text-red-400/80">
          Esta acción es irreversible y eliminará tu cuenta y todos tus datos.
        </p>
        <button
          onClick={() => setModal('delete')}
          className="text-xs text-red-400 underline underline-offset-2 transition hover:text-red-600"
        >
          Eliminar cuenta
        </button>
      </div>

      {/* Overlay */}
      {modal !== 'none' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          {/* Modal: Cambiar contraseña */}
          {modal === 'password' && (
            <div className="w-full max-w-sm rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
              <h2 className="mb-5 text-lg font-black text-ink">Cambiar contraseña</h2>

              {passwordSuccess ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-moss">✓ Contraseña actualizada correctamente.</p>
                  <button onClick={closeModal} className="mt-4 text-sm text-ink/50 underline hover:text-ink">
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
                      placeholder="Repite la contraseña"
                    />
                  </div>

                  {passwordError && (
                    <p className="rounded-lg border border-ember/30 bg-ember/5 px-3 py-2 text-sm text-ember">
                      {passwordError}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="text-sm text-ink/50 hover:text-ink"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
                    >
                      {passwordLoading ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Modal: Eliminar cuenta */}
          {modal === 'delete' && (
            <div className="w-full max-w-sm rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
              <h2 className="mb-2 text-lg font-black text-ink">Eliminar cuenta</h2>
              <p className="mb-5 text-sm text-ink/60">
                ¿Estás seguro? Esta acción es irreversible. Se eliminarán tu perfil y todas tus fichas.
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    Escribe tu nombre de usuario para confirmar:{' '}
                    <span className="font-black text-ember">{username}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
                    placeholder={username}
                    autoComplete="off"
                  />
                </div>

                {deleteError && (
                  <p className="rounded-lg border border-ember/30 bg-ember/5 px-3 py-2 text-sm text-ember">
                    {deleteError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-sm text-ink/50 hover:text-ink"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading || deleteConfirm !== username}
                    className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteLoading ? 'Eliminando…' : 'Eliminar mi cuenta'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  )
}
