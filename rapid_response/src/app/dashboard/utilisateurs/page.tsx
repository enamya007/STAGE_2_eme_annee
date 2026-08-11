'use client'

import { useMemo, useState } from 'react'
import { Search, Plus, Pencil, Ban, AlertCircle } from 'lucide-react'
import StatCard from '@/features/dashboard/components/StatCard'
import Modal from '@/features/dashboard/components/Modal'
import {
    users as initialUsers,
    initialSkills,
    type AppUser,
    type UserRole,
} from '@/features/dashboard/data/mockData'

const roleStyles: Record<UserRole, string> = {
    ADMIN: 'bg-moon-abyss text-moon-rose',
    TECHNICIEN: 'bg-moon-violet/12 text-moon-violet',
    CLIENT: 'bg-moon-lavande/12 text-moon-lavande',
}

const inputClass =
    'w-full rounded-lg border border-moon-abyss/12 px-3.5 py-2.5 text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:border-moon-violet focus:outline-none'

const labelClass =
    'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-moon-abyss/45'

export default function UsersPage() {
    const [users, setUsers] = useState<AppUser[]>(initialUsers)
    const [query, setQuery] = useState('')

    const [addOpen, setAddOpen] = useState(false)
    const [editing, setEditing] = useState<AppUser | null>(null)
    const [deactivating, setDeactivating] = useState<AppUser | null>(null)

    const [form, setForm] = useState({ name: '', email: '', role: 'CLIENT' as UserRole })
    const [editSkills, setEditSkills] = useState<string[]>([])

    const filtered = useMemo(
        () =>
            users.filter(
                (u) =>
                    !query || `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())
            ),
        [users, query]
    )

    const admins = users.filter((u) => u.role === 'ADMIN').length
    const techs = users.filter((u) => u.role === 'TECHNICIEN').length
    const clients = users.filter((u) => u.role === 'CLIENT').length
    const disabled = users.filter((u) => !u.active).length

    const openAdd = () => {
        setForm({ name: '', email: '', role: 'CLIENT' })
        setAddOpen(true)
    }

    const openEdit = (user: AppUser) => {
        setForm({ name: user.name, email: user.email, role: user.role })
        setEditSkills(user.role === 'TECHNICIEN' ? ['Linux', 'Cloud AWS', 'Virtualisation'] : [])
        setEditing(user)
    }

    const canCreateUser =
        form.name.trim().length > 0 && form.email.trim().length > 0 && !!form.role

    const createUser = () => {
        if (!canCreateUser) return

        const initials = form.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

        setUsers((prev) => [
            ...prev,
            {
                id: `u${Date.now()}`,
                name: form.name.trim(),
                initials,
                email: form.email.trim(),
                role: form.role,
                active: true,
                createdAt: new Date().toISOString().slice(0, 10),
            },
        ])
        setAddOpen(false)
    }

    const saveEdit = () => {
        if (!editing) return

        setUsers((prev) =>
            prev.map((u) =>
                u.id === editing.id
                    ? { ...u, name: form.name.trim(), email: form.email.trim(), role: form.role }
                    : u
            )
        )
        setEditing(null)
    }

    const confirmDeactivate = () => {
        if (!deactivating) return

        setUsers((prev) =>
            prev.map((u) => (u.id === deactivating.id ? { ...u, active: false } : u))
        )
        setDeactivating(null)
    }

    const toggleSkill = (skill: string) => {
        setEditSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        )
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-moon-abyss">Utilisateurs</h1>
                    <p className="mt-0.5 text-sm text-moon-abyss/50">
                        {users.length} comptes enregistrés
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
                        {filtered.map((u) => (
                            <tr key={u.id} className="border-b border-moon-abyss/5 last:border-0 hover:bg-moon-rose/10">
                                <td className="px-5 py-3.5">
                                    <span className="flex items-center gap-2.5 font-semibold text-moon-abyss">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moon-lavande/15 text-[11px] font-bold text-moon-lavande">
                                            {u.initials}
                                        </span>
                                        {u.name}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 font-mono text-xs text-moon-abyss/60">{u.email}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`rounded-md px-2 py-1 text-[11px] font-bold tracking-wide ${roleStyles[u.role]}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                            u.active
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-moon-abyss/8 text-moon-abyss/50'
                                        }`}
                                    >
                                        {u.active ? 'Actif' : 'Désactivé'}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 font-mono text-xs text-moon-abyss/50">{u.createdAt}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(u)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-moon-lavande/30 px-3 py-1.5 text-xs font-medium text-moon-lavande transition-colors hover:bg-moon-lavande hover:text-white"
                                        >
                                            <Pencil size={12} />
                                            Modifier
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeactivating(u)}
                                            disabled={!u.active}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-moon-abyss/15 px-3 py-1.5 text-xs font-medium text-moon-abyss/50 transition-colors hover:bg-moon-abyss/5 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Ban size={12} />
                                            Désactiver
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal ajouter */}
            <Modal open={addOpen} title="Ajouter un utilisateur" onClose={() => setAddOpen(false)}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="add-name" className={labelClass}>Nom complet</label>
                        <input
                            id="add-name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="Prénom Nom"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="add-email" className={labelClass}>Email</label>
                        <input
                            id="add-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            placeholder="email@exemple.fr"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="add-role" className={labelClass}>Rôle</label>
                        <select
                            id="add-role"
                            value={form.role}
                            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                            className={inputClass}
                        >
                            <option value="CLIENT">Client</option>
                            <option value="TECHNICIEN">Technicien</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                    </div>
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
                            onClick={createUser}
                            disabled={!canCreateUser}
                            className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Créer le compte
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal modifier */}
            <Modal open={!!editing} title="Modifier l'utilisateur" onClose={() => setEditing(null)}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="edit-name" className={labelClass}>Nom complet</label>
                        <input
                            id="edit-name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-email" className={labelClass}>Email</label>
                        <input
                            id="edit-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-role" className={labelClass}>Rôle</label>
                        <select
                            id="edit-role"
                            value={form.role}
                            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                            className={inputClass}
                        >
                            <option value="CLIENT">Client</option>
                            <option value="TECHNICIEN">Technicien</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                    </div>

                    {form.role === 'TECHNICIEN' && (
                        <div>
                            <p className={labelClass}>Compétences</p>
                            <div className="flex flex-wrap gap-2">
                                {initialSkills.map((s) => {
                                    const selected = editSkills.includes(s)

                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggleSkill(s)}
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                selected
                                                    ? 'bg-moon-violet-dark text-white'
                                                    : 'bg-moon-rose/40 text-moon-abyss/60 hover:bg-moon-rose/70'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70 hover:bg-moon-rose/20"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={saveEdit}
                            className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal confirmation désactivation */}
            <Modal
                open={!!deactivating}
                title={
                    <span className="flex items-center gap-2">
                        <AlertCircle size={19} className="text-moon-violet" />
                        Confirmation
                    </span>
                }
                onClose={() => setDeactivating(null)}
                maxWidth={420}
            >
                <p className="text-sm leading-relaxed text-moon-abyss/70">
                    Voulez-vous vraiment désactiver ce compte ?
                    <br />
                    L&apos;utilisateur ne pourra plus se connecter.
                </p>
                <div className="mt-5 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={() => setDeactivating(null)}
                        className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70 hover:bg-moon-rose/20"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={confirmDeactivate}
                        className="rounded-lg bg-moon-violet px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet-dark"
                    >
                        Confirmer
                    </button>
                </div>
            </Modal>
        </div>
    )
}
