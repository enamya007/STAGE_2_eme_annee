'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import StatCard from '@/features/dashboard/components/StatCard'
import { useTickets } from '@/hooks/useTickets'
import { useTechnicians } from '@/hooks/useTechnicians'
import type { TicketStatus } from '@/types/ticket'

const statusLabels: Record<TicketStatus, string> = {
    OPEN: 'Ouvert',
    ASSIGNED: 'Affecté',
    IN_PROGRESS: 'En cours',
    RESOLVED: 'Résolu',
    CLOSED: 'Fermé',
    CANCELLED: 'Annulé',
}

export default function DashboardHomePage() {
    const ticketsQuery = useTickets({ page: 1, limit: 20 })
    const techniciansQuery = useTechnicians({ page: 1, limit: 50, isAvailable: true })

    const tickets = ticketsQuery.data?.data ?? []
    const technicians = techniciansQuery.data?.data ?? []

    const open = tickets.filter((t) => t.status === 'OPEN').length
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length
    const urgent = tickets.filter(
        (t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED',
    ).length
    const recent = tickets.slice(0, 5)

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-moon-abyss">Tableau de bord</h1>
                <p className="mt-0.5 text-sm text-moon-abyss/50">Vue d&apos;ensemble de l&apos;activité</p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard value={open} label="Tickets ouverts" tone="rose" />
                <StatCard value={inProgress} label="En cours" tone="violet" />
                <StatCard value={urgent} label="Urgents" tone="plum" />
                <StatCard value={technicians.length} label="Techniciens disponibles" tone="green" />
            </div>

            <div className="rounded-2xl border border-moon-abyss/8 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-moon-violet-dark">Derniers tickets</h2>
                        <p className="text-xs text-moon-abyss/50">Les 5 tickets les plus récents</p>
                    </div>
                    <Link
                        href="/dashboard/tickets"
                        className="flex items-center gap-1.5 text-sm font-medium text-moon-violet hover:text-moon-violet-dark"
                    >
                        Tout voir
                        <ArrowRight size={14} />
                    </Link>
                </div>
                {ticketsQuery.isLoading && (
                    <p className="text-sm text-moon-abyss/50">Chargement…</p>
                )}
                {ticketsQuery.isError && (
                    <p className="text-sm text-rose-700">Impossible de charger les tickets.</p>
                )}
                <ul className="divide-y divide-moon-abyss/5">
                    {recent.map((t) => (
                        <li key={t.id} className="flex items-center gap-4 py-3">
                            <span className="w-20 shrink-0 font-mono text-xs text-moon-abyss/40">
                                {t.reference}
                            </span>
                            <span className="flex-1 truncate text-sm font-medium text-moon-abyss">
                                {t.title}
                            </span>
                            <span className="hidden text-sm text-moon-abyss/50 sm:block">
                                {t.category.name}
                            </span>
                            <span className="shrink-0 rounded-md bg-moon-rose/50 px-2 py-1 text-[11px] font-bold text-moon-violet-dark">
                                {statusLabels[t.status]}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
