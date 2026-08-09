'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, Plus, ArrowRight, List, LayoutGrid, Check } from 'lucide-react'
import StatCard from '@/features/dashboard/components/StatCard'
import Modal from '@/features/dashboard/components/Modal'
import {
    tickets as initialTickets,
    technicians,
    type Ticket,
    type TicketStatus,
    type TicketPriority,
} from '@/features/dashboard/data/mockData'

const statusStyles: Record<TicketStatus, string> = {
    'OUVERT': 'bg-moon-rose/70 text-moon-violet-dark',
    'AFFECTÉ': 'bg-amber-100 text-amber-800',
    'EN COURS': 'bg-moon-lavande/15 text-moon-lavande',
    'RÉSOLU': 'bg-emerald-100 text-emerald-700',
}

const priorityDots: Record<string, string> = {
    Urgente: 'bg-red-500',
    Haute: 'bg-amber-500',
    Moyenne: 'bg-moon-lavande',
    Basse: 'bg-emerald-500',
}

const inputClass =
    'w-full rounded-lg border border-moon-abyss/12 px-3.5 py-2.5 text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:border-moon-violet focus:outline-none'

const labelClass =
    'mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-moon-abyss/45'

function formatToday() {
    return new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function nextRef(tickets: Ticket[]) {
    const max = tickets.reduce(
        (acc, t) => Math.max(acc, parseInt(t.ref.replace('RR-', ''), 10) || 0),
        0
    )

    return `RR-${String(max + 1).padStart(4, '0')}`
}

function TicketsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<'Tous' | TicketStatus>('Tous')
    const [priority, setPriority] = useState<'Toutes' | TicketPriority>('Toutes')
    const [technicianFilter, setTechnicianFilter] = useState('Tous')

    const [createOpen, setCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState({
        title: '',
        client: '',
        priority: 'Moyenne' as TicketPriority,
        description: '',
    })

    const [assigning, setAssigning] = useState<Ticket | null>(null)
    const [selectedTech, setSelectedTech] = useState<string | null>(null)

    // Le bouton « Nouveau ticket » de la sidebar arrive avec ?new=1
    useEffect(() => {
        if (searchParams.get('new') === '1') {
            setCreateOpen(true)
            router.replace('/dashboard/tickets', { scroll: false })
        }
    }, [searchParams, router])

    const filtered = useMemo(
        () =>
            tickets.filter((t) => {
                const matchesQuery =
                    !query ||
                    `${t.ref} ${t.title} ${t.client}`.toLowerCase().includes(query.toLowerCase())
                const matchesStatus = status === 'Tous' || t.status === status
                const matchesPriority = priority === 'Toutes' || t.priority === priority
                const matchesTech =
                    technicianFilter === 'Tous' || t.technician === technicianFilter

                return matchesQuery && matchesStatus && matchesPriority && matchesTech
            }),
        [tickets, query, status, priority, technicianFilter]
    )

    const open = tickets.filter((t) => t.status === 'OUVERT').length
    const inProgress = tickets.filter((t) => t.status === 'EN COURS').length
    const resolved = tickets.filter((t) => t.status === 'RÉSOLU').length
    const urgent = tickets.filter((t) => t.priority === 'Urgente' && t.status !== 'RÉSOLU').length

    const openCreate = () => {
        setCreateForm({ title: '', client: '', priority: 'Moyenne', description: '' })
        setCreateOpen(true)
    }

    const createTicket = () => {
        if (!createForm.title.trim() || !createForm.client.trim()) return

        const ticket: Ticket = {
            ref: nextRef(tickets),
            title: createForm.title.trim(),
            client: createForm.client.trim(),
            status: 'OUVERT',
            priority: createForm.priority,
            technician: null,
            createdAt: formatToday(),
        }

        setTickets((prev) => [ticket, ...prev])
        setCreateOpen(false)
    }

    const openAssign = (ticket: Ticket) => {
        setSelectedTech(ticket.technician)
        setAssigning(ticket)
    }

    const confirmAssign = () => {
        if (!assigning || !selectedTech) return

        setTickets((prev) =>
            prev.map((t) =>
                t.ref === assigning.ref
                    ? {
                          ...t,
                          technician: selectedTech,
                          status: t.status === 'OUVERT' ? 'AFFECTÉ' : t.status,
                      }
                    : t
            )
        )
        setAssigning(null)
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-moon-abyss">Tickets</h1>
                    <p className="mt-0.5 text-sm text-moon-abyss/50">
                        {tickets.length} tickets au total · {open} ouvert{open > 1 ? 's' : ''}
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

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard value={open} label="Tickets ouverts" tone="rose" />
                <StatCard value={inProgress} label="En cours" tone="violet" />
                <StatCard value={resolved} label="Résolus aujourd'hui" tone="green" />
                <StatCard value={urgent} label="Urgents" tone="plum" />
            </div>

            {/* Barre de filtres */}
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
                        <option value="OUVERT">Ouvert</option>
                        <option value="AFFECTÉ">Affecté</option>
                        <option value="EN COURS">En cours</option>
                        <option value="RÉSOLU">Résolu</option>
                    </select>
                </div>
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    className="rounded-lg border border-moon-abyss/10 bg-transparent px-3 py-2 text-sm text-moon-abyss/70 focus:outline-none"
                    aria-label="Filtrer par priorité"
                >
                    <option value="Toutes">Priorité</option>
                    <option value="Urgente">Urgente</option>
                    <option value="Haute">Haute</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Basse">Basse</option>
                </select>
                <select
                    value={technicianFilter}
                    onChange={(e) => setTechnicianFilter(e.target.value)}
                    className="rounded-lg border border-moon-abyss/10 bg-transparent px-3 py-2 text-sm text-moon-abyss/70 focus:outline-none"
                    aria-label="Filtrer par technicien"
                >
                    <option value="Tous">Technicien</option>
                    {technicians.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                </select>
                <input
                    type="date"
                    className="rounded-lg border border-moon-abyss/10 px-3 py-2 text-sm text-moon-abyss/70 focus:outline-none"
                    aria-label="Date début"
                />
                <span className="text-moon-abyss/30">—</span>
                <input
                    type="date"
                    className="rounded-lg border border-moon-abyss/10 px-3 py-2 text-sm text-moon-abyss/70 focus:outline-none"
                    aria-label="Date fin"
                />
                <div className="ml-auto flex gap-1">
                    <button type="button" aria-label="Vue liste" className="rounded-lg bg-moon-violet-dark p-2 text-white">
                        <List size={15} />
                    </button>
                    <button type="button" aria-label="Vue grille" className="rounded-lg border border-moon-abyss/10 p-2 text-moon-abyss/50 hover:bg-moon-rose/30">
                        <LayoutGrid size={15} />
                    </button>
                </div>
            </div>

            <p className="font-mono text-xs uppercase tracking-widest text-moon-abyss/40">
                {filtered.length} tickets trouvés
            </p>

            {/* Tableau */}
            <div className="overflow-hidden rounded-2xl border border-moon-abyss/8 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-moon-abyss/8 font-mono text-[11px] uppercase tracking-widest text-moon-abyss/40">
                            <th className="px-5 py-3 font-medium">Réf. / Titre</th>
                            <th className="px-5 py-3 font-medium">Client</th>
                            <th className="px-5 py-3 font-medium">Statut</th>
                            <th className="px-5 py-3 font-medium">Priorité</th>
                            <th className="px-5 py-3 font-medium">Technicien</th>
                            <th className="px-5 py-3 font-medium">Créé le</th>
                            <th className="px-5 py-3 font-medium" />
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((t) => (
                            <tr key={t.ref} className="border-b border-moon-abyss/5 last:border-0 hover:bg-moon-rose/10">
                                <td className="px-5 py-3.5">
                                    <p className="font-mono text-xs text-moon-abyss/40">{t.ref}</p>
                                    <p className="font-semibold text-moon-abyss">{t.title}</p>
                                </td>
                                <td className="max-w-36 truncate px-5 py-3.5 text-moon-abyss/70">{t.client}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`rounded-md px-2 py-1 text-[11px] font-bold tracking-wide ${statusStyles[t.status]}`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className="flex items-center gap-1.5 text-moon-abyss/70">
                                        <span className={`h-2 w-2 rounded-full ${priorityDots[t.priority]}`} />
                                        {t.priority}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5">
                                    {t.technician ? (
                                        <span className="flex items-center gap-2 text-moon-abyss/80">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moon-lavande/15 text-[10px] font-bold text-moon-lavande">
                                                {t.technician.split(' ').map((w) => w[0]).join('')}
                                            </span>
                                            {t.technician}
                                        </span>
                                    ) : (
                                        <span className="text-moon-abyss/35">Non affecté</span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-moon-abyss/50">
                                    {t.createdAt}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <button
                                        type="button"
                                        onClick={() => openAssign(t)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-moon-violet/25 px-3 py-1.5 text-xs font-medium text-moon-violet transition-colors hover:bg-moon-violet hover:text-white"
                                    >
                                        <ArrowRight size={13} />
                                        {t.technician ? 'Réaffecter' : 'Affecter'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal créer un ticket */}
            <Modal open={createOpen} title="Créer un ticket" onClose={() => setCreateOpen(false)}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="ticket-title" className={labelClass}>Titre</label>
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
                        <label htmlFor="ticket-client" className={labelClass}>Client</label>
                        <input
                            id="ticket-client"
                            type="text"
                            value={createForm.client}
                            onChange={(e) => setCreateForm((f) => ({ ...f, client: e.target.value }))}
                            placeholder="Nom du client ou de l'entreprise"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="ticket-priority" className={labelClass}>Priorité</label>
                        <select
                            id="ticket-priority"
                            value={createForm.priority}
                            onChange={(e) =>
                                setCreateForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))
                            }
                            className={inputClass}
                        >
                            <option value="Basse">Basse</option>
                            <option value="Moyenne">Moyenne</option>
                            <option value="Haute">Haute</option>
                            <option value="Urgente">Urgente</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="ticket-description" className={labelClass}>Description</label>
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
                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            className="rounded-lg border border-moon-abyss/15 px-4 py-2.5 text-sm font-medium text-moon-abyss/70 hover:bg-moon-rose/20"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={createTicket}
                            disabled={!createForm.title.trim() || !createForm.client.trim()}
                            className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Créer le ticket
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal affecter / réaffecter */}
            <Modal
                open={!!assigning}
                title={assigning?.technician ? 'Réaffecter le ticket' : 'Affecter le ticket'}
                onClose={() => setAssigning(null)}
            >
                {assigning && (
                    <>
                        <p className="mb-4 rounded-lg bg-moon-rose/25 px-3.5 py-2.5 text-sm text-moon-abyss/70">
                            <span className="font-mono text-xs text-moon-abyss/45">{assigning.ref}</span>
                            <span className="mx-2 text-moon-abyss/30">·</span>
                            <span className="font-semibold text-moon-abyss">{assigning.title}</span>
                        </p>
                        <div className="space-y-2">
                            {technicians.map((t) => {
                                const selected = selectedTech === t.name

                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setSelectedTech(t.name)}
                                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                                            selected
                                                ? 'border-moon-violet bg-moon-violet/5'
                                                : 'border-moon-abyss/10 hover:border-moon-violet/40'
                                        }`}
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moon-lavande/15 text-xs font-bold text-moon-lavande">
                                            {t.initials}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-moon-abyss">
                                                {t.name}
                                            </span>
                                            <span className="text-xs text-moon-abyss/50">
                                                {t.activeTickets} tickets actifs · {t.skills.slice(0, 2).join(', ')}
                                            </span>
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                t.available
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-moon-violet/10 text-moon-violet'
                                            }`}
                                        >
                                            {t.available ? 'Disponible' : 'Occupé'}
                                        </span>
                                        {selected && <Check size={16} className="shrink-0 text-moon-violet" />}
                                    </button>
                                )
                            })}
                        </div>
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
                                disabled={!selectedTech || selectedTech === assigning.technician}
                                className="rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Confirmer l&apos;affectation
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
        <Suspense>
            <TicketsContent />
        </Suspense>
    )
}
