'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Search, Plus, Pencil, Ban, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import StatCard from '@/features/dashboard/components/StatCard'
import Modal from '@/features/dashboard/components/Modal'
import RequireRole from '@/components/RequireRole'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers'
import type { User, UserRole } from '@/types/auth'
import type { AdminAssignableRole } from '@/schema/user.schema'
import { isValidPhone } from '@/schema/phone.schema'
import { displayPersonName, formatDate, initialsOf } from '@/features/tickets/ticketUi'

const roleStyles: Record<UserRole, string> = {
    ADMIN: 'bg-moon-abyss text-moon-rose',
    TECHNICIAN: 'bg-moon-violet/12 text-moon-violet',
    CLIENT: 'bg-moon-lavande/12 text-moon-lavande',
}

const roleLabels: Record<UserRole, string> = {
    ADMIN: 'ADMIN',
    TECHNICIAN: 'TECHNICIEN',
    CLIENT: 'CLIENT',
}

const inputClass =
    'w-full rounded-lg border border-moon-abyss/12 px-3.5 py-2.5 text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:border-moon-violet focus:outline-none'

const labelClass =
    'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-moon-abyss/45'

const emptyCreate = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CLIENT' as AdminAssignableRole,
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

const isStrongPassword = (password: string) =>
    password.length >= 10 &&
    password.length <= 72 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)

function UsersPageContent() {
    const { data: session } = useSession()
    const myId = session?.user?.id

    const [query, setQuery] = useState('')
    const usersQuery = useUsers({ page: 1, limit: 100, search: query || undefined })
    const createUser = useCreateUser()
    const updateUser = useUpdateUser()
    const deleteUser = useDeleteUser()

    const users = useMemo(() => usersQuery.data?.data ?? [], [usersQuery.data?.data])

    const [addOpen, setAddOpen] = useState(false)
    const [editing, setEditing] = useState<User | null>(null)
    const [deactivating, setDeactivating] = useState<User | null>(null)
    const [reactivating, setReactivating] = useState<User | null>(null)
    const [deleting, setDeleting] = useState<User | null>(null)
    const [createForm, setCreateForm] = useState(emptyCreate)
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'CLIENT' as AdminAssignableRole,
        isActive: true,
    })
    const [editPhoneError, setEditPhoneError] = useState<string | null>(null)

    const admins = users.filter((u) => u.role === 'ADMIN').length
    const techs = users.filter((u) => u.role === 'TECHNICIAN').length
    const clients = users.filter((u) => u.role === 'CLIENT').length
    const disabled = users.filter((u) => !u.isActive).length

    const canSubmitCreate =
        createForm.username.trim().length >= 3 &&
        isValidEmail(createForm.email) &&
        isStrongPassword(createForm.password) &&
        isValidPhone(createForm.phone)

    const openAdd = () => {
        createUser.reset()
        setCreateForm(emptyCreate)
        setAddOpen(true)
    }

    const closeEdit = () => {
        setEditing(null)
        setEditPhoneError(null)
        updateUser.reset()
    }

    const openEdit = (user: User) => {
        updateUser.reset()
        setEditPhoneError(null)
        setEditForm({
            username: user.username,
            email: user.email,
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            phone: user.phone ?? '',
            role: user.role === 'ADMIN' ? 'ADMIN' : 'CLIENT',
            isActive: user.isActive,
        })
        setEditing(user)
    }

    const submitCreate = () => {
        if (!canSubmitCreate) return
        createUser.mutate(
            {
                username: createForm.username.trim(),
                email: createForm.email.trim(),
                password: createForm.password,
                role: createForm.role,
                firstName: createForm.firstName.trim() || undefined,
                lastName: createForm.lastName.trim() || undefined,
                phone: createForm.phone.trim(),
            },
            { onSuccess: () => setAddOpen(false) },
        )
    }

    const submitEdit = () => {
        if (!editing) return
        if (!isValidPhone(editForm.phone)) {
            setEditPhoneError('Le numéro de téléphone est requis')
            return
        }
        setEditPhoneError(null)
        const body = {
            username: editForm.username.trim(),
            email: editForm.email.trim(),
            firstName: editForm.firstName.trim() || undefined,
            lastName: editForm.lastName.trim() || undefined,
            phone: editForm.phone.trim(),
            isActive: editForm.isActive,
            ...(editing.role !== 'TECHNICIAN' && editing.id !== myId
                ? { role: editForm.role }
                : {}),
        }
        updateUser.mutate(
            { id: editing.id, body },
            { onSuccess: closeEdit },
        )
    }

    const confirmDeactivate = () => {
        if (!deactivating) return
        updateUser.mutate(
            { id: deactivating.id, body: { isActive: false } },
            { onSuccess: () => setDeactivating(null) },
        )
    }

    const confirmReactivate = () => {
        if (!reactivating) return
        updateUser.mutate(
            { id: reactivating.id, body: { isActive: true } },
            { onSuccess: () => setReactivating(null) },
        )
    }

    const confirmDelete = () => {
        if (!deleting) return
        deleteUser.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-moon-abyss">Utilisateurs</h1>
                    <p className="mt-0.5 text-sm text-moon-abyss/50">
                        {usersQuery.data?.meta.total ?? users.length} comptes enregistrés
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAdd}
                    className="flex items-center gap-2 rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet"
                >
                    <Plus size={16} />
                    Ajouter un utilisateur
                </button>
            </div>

            <p className="rounded-lg border border-moon-abyss/10 bg-white px-3 py-2 text-sm text-moon-abyss/70">
                Les comptes techniciens se créent et se gèrent sur{' '}
                <Link href="/dashboard/techniciens" className="font-medium text-moon-violet hover:underline">
                    Techniciens
                </Link>
                . Ici : clients et administrateurs (ajout, modification, désactivation, suppression).
            </p>

            {usersQuery.isError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    Impossible de charger les utilisateurs.
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard value={admins} label="Administrateurs" tone="rose" />
                <StatCard value={techs} label="Techniciens" tone="violet" />
                <StatCard value={clients} label="Clients" tone="lavande" />
                <StatCard value={disabled} label="Désactivés" tone="neutral" />
            </div>

            <div className="flex w-72 items-center gap-2 rounded-lg border border-moon-abyss/10 bg-white px-3 py-2 shadow-sm">
                <Search size={15} className="text-moon-abyss/40" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full bg-transparent text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:outline-none"
                />
            </div>

            <div className="overflow-hidden rounded-2xl border border-moon-abyss/8 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-moon-abyss/8 font-mono text-[11px] uppercase tracking-widest text-moon-abyss/40">
                            <th className="px-5 py-3 font-medium">Nom</th>
                            <th className="px-5 py-3 font-medium">Email</th>
                            <th className="px-5 py-3 font-medium">Rôle</th>
                            <th className="px-5 py-3 font-medium">Statut</th>
                            <th className="px-5 py-3 font-medium">Créé le</th>
                            <th className="px-5 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersQuery.isLoading && (
                            <tr>
                                <td colSpan={6} className="px-5 py-8 text-sm text-moon-abyss/50">
                                    Chargement…
                                </td>
                            </tr>
                        )}
                        {users.map((u) => {
                            const name = displayPersonName(u.firstName, u.lastName, u.username)
                            const isSelf = u.id === myId
                            return (
                                <tr
                                    key={u.id}
                                    className="border-b border-moon-abyss/5 last:border-0 hover:bg-moon-rose/10"
                                >
                                    <td className="px-5 py-3.5">
                                        <span className="flex items-center gap-2.5 font-semibold text-moon-abyss">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moon-lavande/15 text-[11px] font-bold text-moon-lavande">
                                                {initialsOf(name)}
                                            </span>
                                            {name}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-xs text-moon-abyss/60">
                                        {u.email}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span
                                            className={`rounded-md px-2 py-1 text-[11px] font-bold tracking-wide ${roleStyles[u.role]}`}
                                        >
                                            {roleLabels[u.role]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                u.isActive
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-moon-abyss/8 text-moon-abyss/50'
                                            }`}
                                        >
                                            {u.isActive ? 'Actif' : 'Désactivé'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-xs text-moon-abyss/50">
                                        {formatDate(u.createdAt)}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(u)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-moon-lavande/30 px-3 py-1.5 text-xs font-medium text-moon-lavande transition-colors hover:bg-moon-lavande hover:text-white"
                                            >
                                                <Pencil size={12} />
                                                Modifier
                                            </button>
                                            {u.isActive ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeactivating(u)}
                                                    disabled={isSelf}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-moon-abyss/15 px-3 py-1.5 text-xs font-medium text-moon-abyss/50 transition-colors hover:bg-moon-abyss/5 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <Ban size={12} />
                                                    Désactiver
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateUser.reset()
                                                        setReactivating(u)
                                                    }}
                                                    disabled={isSelf}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <CheckCircle size={12} />
                                                    Réactiver
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(u)}
                                                disabled={isSelf}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Trash2 size={12} />
                                                Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal open={addOpen} title="Ajouter un utilisateur" onClose={() => setAddOpen(false)}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="add-username" className={labelClass}>
                            Nom d&apos;utilisateur
                        </label>
                        <input
                            id="add-username"
                            value={createForm.username}
                            onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="add-email" className={labelClass}>
                            Email
                        </label>
                        <input
                            id="add-email"
                            type="email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                            className={inputClass}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="add-firstname" className={labelClass}>
                                Prénom
                            </label>
                            <input
                                id="add-firstname"
                                value={createForm.firstName}
                                onChange={(e) =>
                                    setCreateForm((f) => ({ ...f, firstName: e.target.value }))
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="add-lastname" className={labelClass}>
                                Nom
                            </label>
                            <input
                                id="add-lastname"
                                value={createForm.lastName}
                                onChange={(e) =>
                                    setCreateForm((f) => ({ ...f, lastName: e.target.value }))
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="add-phone" className={labelClass}>
                            Téléphone
                        </label>
                        <input
                            id="add-phone"
                            type="tel"
                            value={createForm.phone}
                            onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                            placeholder="90 00 00 00"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="add-password" className={labelClass}>
                            Mot de passe
                        </label>
                        <input
                            id="add-password"
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                            placeholder="10 caractères, majuscule, minuscule, chiffre"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="add-role" className={labelClass}>
                            Rôle
                        </label>
                        <select
                            id="add-role"
                            value={createForm.role}
                            onChange={(e) =>
                                setCreateForm((f) => ({
                                    ...f,
                                    role: e.target.value as AdminAssignableRole,
                                }))
                            }
                            className={inputClass}
                        >
                            <option value="CLIENT">Client</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                    </div>
                    {createUser.isError && (
                        <p className="text-sm text-rose-700">
                            {createUser.error instanceof Error
                                ? createUser.error.message
                                : 'Création impossible'}
                        </p>
                    )}
                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setAddOpen(false)}
                            className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70 hover:bg-moon-rose/20"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={submitCreate}
                            disabled={!canSubmitCreate || createUser.isPending}
                            className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white hover:bg-moon-violet disabled:opacity-40"
                        >
                            {createUser.isPending ? 'Création…' : 'Créer le compte'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={!!editing}
                title="Modifier l'utilisateur"
                onClose={closeEdit}
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="edit-username" className={labelClass}>
                            Nom d&apos;utilisateur
                        </label>
                        <input
                            id="edit-username"
                            value={editForm.username}
                            onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-email" className={labelClass}>
                            Email
                        </label>
                        <input
                            id="edit-email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            className={inputClass}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="edit-firstname" className={labelClass}>
                                Prénom
                            </label>
                            <input
                                id="edit-firstname"
                                value={editForm.firstName}
                                onChange={(e) =>
                                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-lastname" className={labelClass}>
                                Nom
                            </label>
                            <input
                                id="edit-lastname"
                                value={editForm.lastName}
                                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="edit-phone" className={labelClass}>
                            Téléphone
                        </label>
                        <input
                            id="edit-phone"
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => {
                                setEditPhoneError(null)
                                setEditForm((f) => ({ ...f, phone: e.target.value }))
                            }}
                            className={inputClass}
                        />
                        {editPhoneError && (
                            <p className="mt-1.5 text-sm text-rose-700">{editPhoneError}</p>
                        )}
                    </div>
                    {editing?.role !== 'TECHNICIAN' && editing?.id !== myId && (
                        <div>
                            <label htmlFor="edit-role" className={labelClass}>
                                Rôle
                            </label>
                            <select
                                id="edit-role"
                                value={editForm.role}
                                onChange={(e) =>
                                    setEditForm((f) => ({
                                        ...f,
                                        role: e.target.value as AdminAssignableRole,
                                    }))
                                }
                                className={inputClass}
                            >
                                <option value="CLIENT">Client</option>
                                <option value="ADMIN">Administrateur</option>
                            </select>
                        </div>
                    )}
                    {editing?.role === 'TECHNICIAN' && (
                        <p className="text-xs text-moon-abyss/50">
                            Le rôle technicien ne peut pas être changé ici. Charge et compétences : page
                            Techniciens.
                        </p>
                    )}
                    <div>
                        <label htmlFor="edit-status" className={labelClass}>
                            Statut
                        </label>
                        <select
                            id="edit-status"
                            value={editForm.isActive ? 'active' : 'inactive'}
                            disabled={editing?.id === myId}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    isActive: e.target.value === 'active',
                                }))
                            }
                            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            <option value="active">Actif</option>
                            <option value="inactive">Désactivé</option>
                        </select>
                        {editing?.id === myId && (
                            <p className="mt-1.5 text-xs text-moon-abyss/50">
                                Vous ne pouvez pas désactiver votre propre compte.
                            </p>
                        )}
                    </div>
                    {updateUser.isError && (
                        <p className="text-sm text-rose-700">
                            {updateUser.error instanceof Error
                                ? updateUser.error.message
                                : 'Modification impossible'}
                        </p>
                    )}
                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={closeEdit}
                            className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70 hover:bg-moon-rose/20"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={submitEdit}
                            disabled={updateUser.isPending}
                            className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white hover:bg-moon-violet disabled:opacity-40"
                        >
                            {updateUser.isPending ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={!!deactivating}
                title={
                    <span className="flex items-center gap-2">
                        <AlertCircle size={19} className="text-moon-violet" />
                        Désactiver le compte
                    </span>
                }
                onClose={() => setDeactivating(null)}
                maxWidth={420}
            >
                <p className="text-sm leading-relaxed text-moon-abyss/70">
                    L&apos;utilisateur ne pourra plus se connecter. Vous pourrez le réactiver plus tard
                    via Réactiver ou Modifier.
                </p>
                {updateUser.isError && (
                    <p className="mt-3 text-sm text-rose-700">
                        {updateUser.error instanceof Error
                            ? updateUser.error.message
                            : 'Action impossible'}
                    </p>
                )}
                <div className="mt-5 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={() => setDeactivating(null)}
                        className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={confirmDeactivate}
                        disabled={updateUser.isPending}
                        className="rounded-lg bg-moon-violet px-4 py-2.5 text-sm font-medium text-white"
                    >
                        Confirmer
                    </button>
                </div>
            </Modal>

            <Modal
                open={!!reactivating}
                title={
                    <span className="flex items-center gap-2">
                        <CheckCircle size={19} className="text-emerald-600" />
                        Réactiver le compte
                    </span>
                }
                onClose={() => setReactivating(null)}
                maxWidth={420}
            >
                <p className="text-sm leading-relaxed text-moon-abyss/70">
                    L&apos;utilisateur pourra de nouveau se connecter.
                </p>
                {updateUser.isError && (
                    <p className="mt-3 text-sm text-rose-700">
                        {updateUser.error instanceof Error
                            ? updateUser.error.message
                            : 'Action impossible'}
                    </p>
                )}
                <div className="mt-5 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={() => setReactivating(null)}
                        className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={confirmReactivate}
                        disabled={updateUser.isPending}
                        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        {updateUser.isPending ? 'Réactivation…' : 'Réactiver'}
                    </button>
                </div>
            </Modal>

            <Modal
                open={!!deleting}
                title={
                    <span className="flex items-center gap-2">
                        <AlertCircle size={19} className="text-rose-600" />
                        Supprimer le compte
                    </span>
                }
                onClose={() => setDeleting(null)}
                maxWidth={420}
            >
                <p className="text-sm leading-relaxed text-moon-abyss/70">
                    Suppression logique : le compte disparaît de la liste. Impossible si des tickets
                    ouverts lui sont encore assignés.
                </p>
                {deleteUser.isError && (
                    <p className="mt-3 text-sm text-rose-700">
                        {deleteUser.error instanceof Error
                            ? deleteUser.error.message
                            : 'Suppression impossible'}
                    </p>
                )}
                <div className="mt-5 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={() => setDeleting(null)}
                        className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={confirmDelete}
                        disabled={deleteUser.isPending}
                        className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white"
                    >
                        {deleteUser.isPending ? 'Suppression…' : 'Supprimer'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}

export default function UsersPage() {
    return (
        <RequireRole roles={['ADMIN']}>
            <UsersPageContent />
        </RequireRole>
    )
}
