'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, Plus, ArrowRight, List, LayoutGrid, Check } from 'lucide-react'
import StatCard from '@/features/dashboard/components/StatCard'
import Modal from '@/features/dashboard/components/Modal'
import { useTickets, useCreateTicket, useAssignTicket } from '@/hooks/useTickets'
import { useTechnicians } from '@/hooks/useTechnicians'
import type { TicketListItem, TicketPriority, TicketStatus } from '@/types/ticket'
import type { Technician } from '@/types/technician'

const statusStyles: Record<TicketStatus, string> = {
    OPEN: 'bg-moon-rose/70 text-moon-violet-dark',
    ASSIGNED: 'bg-amber-100 text-amber-800',
    IN_PROGRESS: 'bg-moon-lavande/15 text-moon-lavande',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-slate-100 text-slate-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
}

const statusLabels: Record<TicketStatus, string> = {
    OPEN: 'Ouvert',
    ASSIGNED: 'Affecté',
    IN_PROGRESS: 'En cours',
    RESOLVED: 'Résolu',
    CLOSED: 'Fermé',
    CANCELLED: 'Annulé',
}

const priorityLabels: Record<TicketPriority, string> = {
    LOW: 'Basse',
    NORMAL: 'Moyenne',
    HIGH: 'Haute',
    CRITICAL: 'Urgente',
}

const priorityDots: Record<TicketPriority, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-amber-500',
    NORMAL: 'bg-moon-lavande',
    LOW: 'bg-emerald-500',
}

const inputClass =
    'w-full rounded-lg border border-moon-abyss/12 px-3.5 py-2.5 text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:border-moon-violet focus:outline-none'

const labelClass =
    'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-moon-abyss/45'

function displayName(first: string | null, last: string | null, fallback: string) {
    const full = [first, last].filter(Boolean).join(' ').trim()
    return full || fallback
}

function initialsOf(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function TicketsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<'Tous' | TicketStatus>('Tous')
    const [priority, setPriority] = useState<'Toutes' | TicketPriority>('Toutes')
    const [technicianFilter, setTechnicianFilter] = useState('Tous')
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

    const listQuery = useMemo(
        () => ({
            page: 1,
            limit: 100,
            q: query || undefined,
            status: status === 'Tous' ? undefined : status,
            priority: priority === 'Toutes' ? undefined : priority,
            assigneeId: technicianFilter === 'Tous' ? undefined : technicianFilter,
        }),
        [query, status, priority, technicianFilter],
    )

    const ticketsQuery = useTickets(listQuery)
    const techniciansQuery = useTechnicians({ page: 1, limit: 50 })
    const createTicket = useCreateTicket()
    const assignTicket = useAssignTicket()

    const tickets = useMemo(
        () => ticketsQuery.data?.data ?? [],
        [ticketsQuery.data?.data],
    )
    const technicians = techniciansQuery.data?.data ?? []

    const openFromQuery = searchParams.get('new') === '1'
    const [createRequested, setCreateRequested] = useState(false)
    const createOpen = createRequested || openFromQuery

    const closeCreate = () => {
        setCreateRequested(false)
        if (openFromQuery) {
            router.replace('/dashboard/tickets', { scroll: false })
        }
    }
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        priority: 'NORMAL' as TicketPriority,
        categoryId: '',
        siteLabel: '',
    })

    const [assigning, setAssigning] = useState<TicketListItem | null>(null)
    const [selectedTech, setSelectedTech] = useState<string | null>(null)

    const categories = useMemo(() => {
        const map = new Map<string, string>()
        for (const t of tickets) {
            map.set(t.category.id, t.category.name)
        }
        return [...map.entries()].map(([id, name]) => ({ id, name }))
    }, [tickets])

    const open = tickets.filter((t) => t.status === 'OPEN').length
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length
    const urgent = tickets.filter(
        (t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED',
    ).length

    const openCreate = () => {
        setCreateForm({
            title: '',
            description: '',
            priority: 'NORMAL',
            categoryId: categories[0]?.id ?? '',
            siteLabel: '',
        })
        setCreateRequested(true)
    }

    const submitCreate = () => {
        if (!createForm.title.trim() || !createForm.description.trim() || !createForm.categoryId) {
            return
        }

        createTicket.mutate(
            {
                title: createForm.title.trim(),
                description: createForm.description.trim(),
                priority: createForm.priority,
                categoryId: createForm.categoryId,
                siteLabel: createForm.siteLabel.trim() || undefined,
            },
            { onSuccess: () => closeCreate() },
        )
    }

    const openAssign = (ticket: TicketListItem) => {
        setSelectedTech(ticket.assignee?.id ?? null)
        setAssigning(ticket)
    }

    const confirmAssign = () => {
        if (!assigning || !selectedTech) return

        assignTicket.mutate(
            { id: assigning.id, body: { technicianId: selectedTech } },
            { onSuccess: () => setAssigning(null) },
        )
    }

    const technicianName = (tech: Technician) =>
        displayName(tech.firstName, tech.lastName, tech.username)

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-moon-abyss">Tickets</h1>
                    <p className="mt-0.5 text-sm text-moon-abyss/50">
                        {ticketsQuery.data?.meta.total ?? tickets.length} tickets au total · {open}{' '}
                        ouvert{open > 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet"
                >
                    <Plus size={16} />
                    Créer un ticket
                </button>
            </div>

            {ticketsQuery.isError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    Impossible de charger les tickets. Vérifiez que vous êtes connecté et que l’API
                    tourne.
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard value={open} label="Tickets ouverts" tone="rose" />
                <StatCard value={inProgress} label="En cours" tone="violet" />
                <StatCard value={resolved} label="Résolus" tone="green" />
                <StatCard value={urgent} label="Urgents" tone="plum" />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-moon-abyss/8 bg-white p-3 shadow-sm">
                <div className="flex min-w-56 flex-1 items-center gap-2 rounded-lg bg-moon-rose/20 px-3 py-2">
                    <Search size={15} className="text-moon-abyss/40" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full bg-transparent text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-moon-abyss/10 px-3 py-2 text-sm text-moon-abyss/70">
                    <Filter size={14} />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                        className="bg-transparent focus:outline-none"
                        aria-label="Filtrer par statut"
                    >
                        <option value="Tous">Statut</option>
                        <option value="OPEN">Ouvert</option>
                        <option value="ASSIGNED">Affecté</option>
                        <option value="IN_PROGRESS">En cours</option>
                        <option value="RESOLVED">Résolu</option>
                        <option value="CLOSED">Fermé</option>
                        <option value="CANCELLED">Annulé</option>
                    </select>
                </div>
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="rounded-lg border border-moon-abyss/10 bg-transparent px-3 py-2 text-sm text-moon-abyss/70 focus:outline-none"
                    aria-label="Filtrer par priorité"
                >
                    <option value="Toutes">Priorité</option>
                    <option value="CRITICAL">Urgente</option>
                    <option value="HIGH">Haute</option>
                    <option value="NORMAL">Moyenne</option>
                    <option value="LOW">Basse</option>
                </select>
                <select
                    value={technicianFilter}
                    onChange={(e) => setTechnicianFilter(e.target.value)}
                    className="rounded-lg border border-moon-abyss/10 bg-transparent px-3 py-2 text-sm text-moon-abyss/70 focus:outline-none"
                    aria-label="Filtrer par technicien"
                >
                    <option value="Tous">Technicien</option>
                    {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                            {technicianName(t)}
                        </option>
                    ))}
                </select>
                <div className="ml-auto flex gap-1">
                    <button
                        type="button"
                        aria-label="Vue liste"
                        aria-pressed={viewMode === 'list'}
                        onClick={() => setViewMode('list')}
                        className={`rounded-lg p-2 transition-colors ${
                            viewMode === 'list'
                                ? 'bg-moon-violet-dark text-white'
                                : 'border border-moon-abyss/10 text-moon-abyss/50 hover:bg-moon-rose/30'
                        }`}
                    >
                        <List size={15} />
                    </button>
                    <button
                        type="button"
                        aria-label="Vue grille"
                        aria-pressed={viewMode === 'grid'}
                        onClick={() => setViewMode('grid')}
                        className={`rounded-lg p-2 transition-colors ${
                            viewMode === 'grid'
                                ? 'bg-moon-violet-dark text-white'
                                : 'border border-moon-abyss/10 text-moon-abyss/50 hover:bg-moon-rose/30'
                        }`}
                    >
                        <LayoutGrid size={15} />
                    </button>
                </div>
            </div>

            <p className="font-mono text-xs uppercase tracking-widest text-moon-abyss/40">
                {ticketsQuery.isLoading ? 'Chargement…' : `${tickets.length} tickets trouvés`}
            </p>

            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {tickets.map((t) => {
                        const assignee = t.assignee?.username ?? null
                        return (
                            <div
                                key={t.id}
                                className="flex flex-col gap-3 rounded-2xl border border-moon-abyss/8 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-mono text-xs text-moon-abyss/40">{t.reference}</p>
                                        <p className="truncate font-semibold text-moon-abyss">{t.title}</p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold tracking-wide ${statusStyles[t.status]}`}
                                    >
                                        {statusLabels[t.status]}
                                    </span>
                                </div>
                                <p className="truncate text-sm text-moon-abyss/70">{t.category.name}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-moon-abyss/70">
                                        <span className={`h-2 w-2 rounded-full ${priorityDots[t.priority]}`} />
                                        {priorityLabels[t.priority]}
                                    </span>
                                    <span className="font-mono text-xs text-moon-abyss/50">
                                        {formatDate(t.createdAt)}
                                    </span>
                                </div>
                                <div className="mt-auto flex items-center justify-between border-t border-moon-abyss/5 pt-3">
                                    {assignee ? (
                                        <span className="flex min-w-0 items-center gap-2 text-sm text-moon-abyss/80">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moon-lavande/15 text-[10px] font-bold text-moon-lavande">
                                                {initialsOf(assignee)}
                                            </span>
                                            <span className="truncate">{assignee}</span>
                                        </span>
                                    ) : (
                                        <span className="text-sm text-moon-abyss/35">Non affecté</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => openAssign(t)}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-moon-violet/25 px-3 py-1.5 text-xs font-medium text-moon-violet transition-colors hover:bg-moon-violet hover:text-white"
                                    >
                                        <ArrowRight size={13} />
                                        {assignee ? 'Réaffecter' : 'Affecter'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {viewMode === 'list' && (
                <div className="overflow-hidden rounded-2xl border border-moon-abyss/8 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-moon-abyss/8 font-mono text-[11px] uppercase tracking-widest text-moon-abyss/40">
                                <th className="px-5 py-3 font-medium">Réf. / Titre</th>
                                <th className="px-5 py-3 font-medium">Catégorie</th>
                                <th className="px-5 py-3 font-medium">Statut</th>
                                <th className="px-5 py-3 font-medium">Priorité</th>
                                <th className="px-5 py-3 font-medium">Technicien</th>
                                <th className="px-5 py-3 font-medium">Créé le</th>
                                <th className="px-5 py-3 font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((t) => {
                                const assignee = t.assignee?.username ?? null
                                return (
                                    <tr
                                        key={t.id}
                                        className="border-b border-moon-abyss/5 last:border-0 hover:bg-moon-rose/10"
                                    >
                                        <td className="px-5 py-3.5">
                                            <p className="font-mono text-xs text-moon-abyss/40">{t.reference}</p>
                                            <p className="font-semibold text-moon-abyss">{t.title}</p>
                                        </td>
                                        <td className="max-w-36 truncate px-5 py-3.5 text-moon-abyss/70">
                                            {t.category.name}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`rounded-md px-2 py-1 text-[11px] font-bold tracking-wide ${statusStyles[t.status]}`}
                                            >
                                                {statusLabels[t.status]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="flex items-center gap-1.5 text-moon-abyss/70">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${priorityDots[t.priority]}`}
                                                />
                                                {priorityLabels[t.priority]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {assignee ? (
                                                <span className="flex items-center gap-2 text-moon-abyss/80">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moon-lavande/15 text-[10px] font-bold text-moon-lavande">
                                                        {initialsOf(assignee)}
                                                    </span>
                                                    {assignee}
                                                </span>
                                            ) : (
                                                <span className="text-moon-abyss/35">Non affecté</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-moon-abyss/50">
                                            {formatDate(t.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openAssign(t)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-moon-violet/25 px-3 py-1.5 text-xs font-medium text-moon-violet transition-colors hover:bg-moon-violet hover:text-white"
                                            >
                                                <ArrowRight size={13} />
                                                {assignee ? 'Réaffecter' : 'Affecter'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={createOpen} title="Créer un ticket" onClose={closeCreate}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="ticket-title" className={labelClass}>
                            Titre
                        </label>
                        <input
                            id="ticket-title"
                            type="text"
                            value={createForm.title}
                            onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Ex : Panne réseau au 2e étage"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="ticket-site" className={labelClass}>
                            Site (optionnel)
                        </label>
                        <input
                            id="ticket-site"
                            type="text"
                            value={createForm.siteLabel}
                            onChange={(e) =>
                                setCreateForm((f) => ({ ...f, siteLabel: e.target.value }))
                            }
                            placeholder="Libellé du site"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="ticket-category" className={labelClass}>
                            Catégorie
                        </label>
                        <select
                            id="ticket-category"
                            value={createForm.categoryId}
                            onChange={(e) =>
                                setCreateForm((f) => ({ ...f, categoryId: e.target.value }))
                            }
                            className={inputClass}
                        >
                            <option value="">Choisir une catégorie</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {categories.length === 0 && (
                            <p className="mt-1 text-xs text-moon-abyss/50">
                                Aucune catégorie disponible tant qu’aucun ticket n’existe encore.
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="ticket-priority" className={labelClass}>
                            Priorité
                        </label>
                        <select
                            id="ticket-priority"
                            value={createForm.priority}
                            onChange={(e) =>
                                setCreateForm((f) => ({
                                    ...f,
                                    priority: e.target.value as TicketPriority,
                                }))
                            }
                            className={inputClass}
                        >
                            <option value="LOW">Basse</option>
                            <option value="NORMAL">Moyenne</option>
                            <option value="HIGH">Haute</option>
                            <option value="CRITICAL">Urgente</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="ticket-description" className={labelClass}>
                            Description
                        </label>
                        <textarea
                            id="ticket-description"
                            value={createForm.description}
                            onChange={(e) =>
                                setCreateForm((f) => ({ ...f, description: e.target.value }))
                            }
                            placeholder="Décrivez le problème..."
                            rows={3}
                            className={`${inputClass} resize-none`}
                        />
                    </div>
                    {createTicket.isError && (
                        <p className="text-sm text-rose-700">
                            {createTicket.error instanceof Error
                                ? createTicket.error.message
                                : 'Création impossible'}
                        </p>
                    )}
                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={closeCreate}
                            className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70 hover:bg-moon-rose/20"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={submitCreate}
                            disabled={
                                !createForm.title.trim() ||
                                !createForm.description.trim() ||
                                !createForm.categoryId ||
                                createTicket.isPending
                            }
                            className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {createTicket.isPending ? 'Création…' : 'Créer le ticket'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={!!assigning}
                title={assigning?.assignee ? 'Réaffecter le ticket' : 'Affecter le ticket'}
                onClose={() => setAssigning(null)}
            >
                {assigning && (
                    <>
                        <p className="mb-4 rounded-lg bg-moon-rose/25 px-3.5 py-2.5 text-sm text-moon-abyss/70">
                            <span className="font-mono text-xs text-moon-abyss/45">
                                {assigning.reference}
                            </span>
                            <span className="mx-2 text-moon-abyss/30">·</span>
                            <span className="font-semibold text-moon-abyss">{assigning.title}</span>
                        </p>
                        <div className="space-y-2">
                            {technicians.map((t) => {
                                const name = technicianName(t)
                                const selected = selectedTech === t.id

                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setSelectedTech(t.id)}
                                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                                            selected
                                                ? 'border-moon-violet bg-moon-violet/5'
                                                : 'border-moon-abyss/10 hover:border-moon-violet/40'
                                        }`}
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moon-lavande/15 text-xs font-bold text-moon-lavande">
                                            {initialsOf(name)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-moon-abyss">
                                                {name}
                                            </span>
                                            <span className="text-xs text-moon-abyss/50">
                                                {t.currentLoad}/{t.maxConcurrentTickets} tickets ·{' '}
                                                {t.skills
                                                    .slice(0, 2)
                                                    .map((s) => s.name)
                                                    .join(', ')}
                                            </span>
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                t.isAvailable
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-moon-violet/10 text-moon-violet'
                                            }`}
                                        >
                                            {t.isAvailable ? 'Disponible' : 'Occupé'}
                                        </span>
                                        {selected && <Check size={16} className="shrink-0 text-moon-violet" />}
                                    </button>
                                )
                            })}
                        </div>
                        {assignTicket.isError && (
                            <p className="mt-3 text-sm text-rose-700">
                                {assignTicket.error instanceof Error
                                    ? assignTicket.error.message
                                    : 'Affectation impossible'}
                            </p>
                        )}
                        <div className="mt-5 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setAssigning(null)}
                                className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70 hover:bg-moon-rose/20"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={confirmAssign}
                                disabled={
                                    !selectedTech ||
                                    selectedTech === assigning.assignee?.id ||
                                    assignTicket.isPending
                                }
                                className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {assignTicket.isPending ? 'Envoi…' : "Confirmer l'affectation"}
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}

export default function TicketsPage() {
    return (
        <Suspense fallback={<p>Chargement des données...</p>}>
            <TicketsContent />
        </Suspense>
    )
}
