'use client'

import { usePathname } from 'next/navigation'
import { Search, Bell, ChevronDown } from 'lucide-react'

const sectionLabels: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/dashboard/tickets': 'Tickets',
    '/dashboard/techniciens': 'Techniciens',
    '/dashboard/utilisateurs': 'Utilisateurs',
    '/dashboard/statistiques': 'Statistiques',
    '/dashboard/parametres': 'Paramètres',
}

export default function Topbar() {
    const pathname = usePathname()
    const section =
        Object.entries(sectionLabels)
            .sort((a, b) => b[0].length - a[0].length)
            .find(([href]) => pathname.startsWith(href))?.[1] ?? 'Tableau de bord'

    return (
        <header className="flex items-center justify-between border-b border-moon-abyss/10 bg-white px-6 py-3">
            <div className="flex items-center gap-1.5 text-sm">
                <span className="flex items-center gap-1 text-moon-abyss/50">
                    Admin
                    <ChevronDown size={14} />
                </span>
                <span className="text-moon-abyss/30">/</span>
                <span className="font-semibold text-moon-abyss">{section}</span>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-moon-abyss/10 bg-moon-rose/20 px-3.5 py-1.5">
                    <Search size={15} className="text-moon-abyss/40" />
                    <input
                        type="search"
                        placeholder="Recherche globale..."
                        className="w-44 bg-transparent text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:outline-none"
                    />
                </div>
                <button
                    type="button"
                    aria-label="Notifications"
                    className="relative rounded-full border border-moon-abyss/10 p-2 text-moon-abyss/60 transition-colors hover:bg-moon-rose/30"
                >
                    <Bell size={17} />
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-moon-violet" />
                </button>
            </div>
        </header>
    )
}
