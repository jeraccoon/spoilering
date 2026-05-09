'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  username: string
  signOutButton: React.ReactNode
}

export function AccountModals({ username, signOutButton }: Props) {
  const t = useTranslations('AccountModals')
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
      setPasswordError(t('errors.shortPassword'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('errors.mismatch'))
      return
    }

    setPasswordLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setPasswordError(t('errors.noSession'))
      setPasswordLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      setPasswordError(t('errors.wrongCurrent'))
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
      setDeleteError(t('errors.usernameMismatch'))
      return
    }

    setDeleteLoading(true)
    const res = await fetch('/api/account', { method: 'DELETE' })

    if (!res.ok) {
      const data = await res.json()
      setDeleteError(data.error ?? t('errors.deleteFailed'))
      setDeleteLoading(false)
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push({ pathname: '/', query: { cuenta: 'eliminada' } })
  }

  return (
    <>
      {/* Acciones principales */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setModal('password')}
          className="rounded-lg border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/40 hover:bg-ink/5 hover:text-ink"
        >
          {t('changePassword')}
        </button>
        {signOutButton}
      </div>

      {/* Zona de peligro */}
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50/60 px-4 py-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-red-400">
          {t('dangerZone')}
        </p>
        <p className="mb-2 text-xs text-red-400/80">
          {t('dangerWarning')}
        </p>
        <button
          onClick={() => setModal('delete')}
          className="text-xs text-red-400 underline underline-offset-2 transition hover:text-red-600"
        >
          {t('deleteAccount')}
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
              <h2 className="mb-5 text-lg font-black text-ink">{t('modal.passwordTitle')}</h2>

              {passwordSuccess ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-moss">{t('modal.passwordSuccess')}</p>
                  <button onClick={closeModal} className="mt-4 text-sm text-ink/50 underline hover:text-ink">
                    {t('modal.close')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      {t('modal.currentPassword')}
                    </label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
                      placeholder={t('modal.currentPasswordPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      {t('modal.newPassword')}
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
                      placeholder={t('modal.newPasswordPlaceholder')}
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-ink">
                      {t('modal.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink placeholder-ink/45 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
                      placeholder={t('modal.confirmPasswordPlaceholder')}
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
                      {t('modal.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-50"
                    >
                      {passwordLoading ? t('modal.saving') : t('modal.save')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Modal: Eliminar cuenta */}
          {modal === 'delete' && (
            <div className="w-full max-w-sm rounded-xl border border-ink/10 bg-paper p-6 shadow-xl">
              <h2 className="mb-2 text-lg font-black text-ink">{t('modal.deleteTitle')}</h2>
              <p className="mb-5 text-sm text-ink/60">
                {t('modal.deleteIntro')}
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-ink">
                    {t('modal.deleteConfirmLabel')}{' '}
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
                    {t('modal.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading || deleteConfirm !== username}
                    className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteLoading ? t('modal.deleting') : t('modal.deleteSubmit')}
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
