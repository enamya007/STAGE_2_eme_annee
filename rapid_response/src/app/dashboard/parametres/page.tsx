'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useMe } from '@/hooks/useAuth'
import { useUpdateUser } from '@/hooks/useUsers'
import { logoutCurrentSession } from '@/lib/logout'
import { displayPersonName } from '@/features/tickets/ticketUi'
import { isValidPhone } from '@/schema/phone.schema'

const roleLabels = {
    ADMIN: 'Administrateur',
    TECHNICIAN: 'Technicien',
    CLIENT: 'Client',
} as const

const inputClass =
    'w-full rounded-lg border border-moon-abyss/12 px-3.5 py-2.5 text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:border-moon-violet focus:outline-none'

const labelClass =
    'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-moon-abyss/45'

export default function SettingsPage() {
    const meQuery = useMe()
    const me = meQuery.data
    const updateUser = useUpdateUser()
    const canEditProfile = me?.role === 'ADMIN'

    const [form, setForm] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
    })

    useEffect(() => {
        if (!me) return
        setForm({
            username: me.username,
            email: me.email,
            firstName: me.firstName ?? '',
            lastName: me.lastName ?? '',
            phone: me.phone ?? '',
        })
    }, [me])

    const canSave =
        form.username.trim().length >= 3 &&
        form.email.includes('@') &&
        isValidPhone(form.phone)

    const save = () => {
        if (!me || !canSave) return
        updateUser.mutate({
            id: me.id,
            body: {
                username: form.username.trim(),
                email: form.email.trim(),
                firstName: form.firstName.trim() || undefined,
                lastName: form.lastName.trim() || undefined,
                phone: form.phone.trim(),
            },
        })
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-moon-abyss">Paramètres</h1>
                <p className="mt-0.5 text-sm text-moon-abyss/50">Votre compte</p>
            </div>

            <div className="rounded-2xl border border-moon-abyss/8 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-moon-violet-dark">Profil</h2>
                {meQuery.isLoading && (
                    <p className="mt-4 text-sm text-moon-abyss/50">Chargement…</p>
                )}
                {meQuery.isError && (
                    <p className="mt-4 text-sm text-rose-700">Impossible de charger le profil.</p>
                )}
                {me && !canEditProfile && (
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                            <dt className={labelClass}>Nom</dt>
                            <dd className="text-moon-abyss">
                                {displayPersonName(me.firstName, me.lastName, me.username)}
                            </dd>
                        </div>
                        <div>
                            <dt className={labelClass}>Identifiant</dt>
                            <dd className="text-moon-abyss">{me.username}</dd>
                        </div>
                        <div>
                            <dt className={labelClass}>Email</dt>
                            <dd className="text-moon-abyss">{me.email}</dd>
                        </div>
                        <div>
                            <dt className={labelClass}>Téléphone</dt>
                            <dd className="text-moon-abyss">{me.phone ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className={labelClass}>Rôle</dt>
                            <dd className="text-moon-abyss">{roleLabels[me.role]}</dd>
                        </div>
                    </dl>
                )}
                {me && canEditProfile && (
                    <div className="mt-4 space-y-4">
                        <p className="text-xs text-moon-abyss/50">
                            Rôle : {roleLabels[me.role]} — vous ne pouvez pas changer votre propre
                            rôle ici.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="me-username" className={labelClass}>
                                    Identifiant
                                </label>
                                <input
                                    id="me-username"
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, username: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="me-email" className={labelClass}>
                                    Email
                                </label>
                                <input
                                    id="me-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, email: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="me-firstname" className={labelClass}>
                                    Prénom
                                </label>
                                <input
                                    id="me-firstname"
                                    value={form.firstName}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, firstName: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="me-lastname" className={labelClass}>
                                    Nom
                                </label>
                                <input
                                    id="me-lastname"
                                    value={form.lastName}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, lastName: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="me-phone" className={labelClass}>
                                    Téléphone
                                </label>
                                <input
                                    id="me-phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, phone: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        {updateUser.isError && (
                            <p className="text-sm text-rose-700">
                                {updateUser.error instanceof Error
                                    ? updateUser.error.message
                                    : 'Enregistrement impossible'}
                            </p>
                        )}
                        {updateUser.isSuccess && (
                            <p className="text-sm text-emerald-700">Profil mis à jour.</p>
                        )}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={save}
                                disabled={!canSave || updateUser.isPending}
                                className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white hover:bg-moon-violet disabled:opacity-40"
                            >
                                {updateUser.isPending ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {canEditProfile && (
                <p className="text-sm text-moon-abyss/50">
                    Changement de mot de passe une fois connecté : non disponible. Utilisez{' '}
                    <Link href="/forgot-password" className="font-medium text-moon-violet underline">
                        Mot de passe oublié
                    </Link>
                    .
                </p>
            )}

            <button
                type="button"
                onClick={() => void logoutCurrentSession()}
                className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/80 hover:bg-moon-rose/20"
            >
                Se déconnecter
            </button>
        </div>
    )
}
