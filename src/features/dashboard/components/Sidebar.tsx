'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Ticket,
    LayoutDashboard,
    Wrench,
    Users,
    Activity,
    Settings,
    Plus,
} from 'lucide-react'

const navItems = [
    { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket, badge: 3 },
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/techniciens', label: 'Techniciens', icon: Wrench },
    { href: '/dashboard/utilisateurs', label: 'Utilisateurs', icon: Users },
    { href: '/dashboard/statistiques', label: 'Statistiques', icon: Activity },
    { href: '/dashboard/parametres', label: 'Paramètres', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="flex h-screen w-60 shrink-0 flex-col bg-moon-abyss text-white">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-moon-rose text-xs font-bold text-moon-violet-dark">
                    RR
                </div>
                <div>
                    <p className="text-sm font-bold leading-tight">Rapid Response</p>
                    <p className="text-[11px] text-white/50">RR · v2.4</p>
                </div>
            </div>

            {/* Bouton nouveau ticket : ouvre le modal de création sur la page Tickets */}
            <div className="px-4 pb-4">
                <Link
                    href="/dashboard/tickets?new=1"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-moon-violet bg-moon-violet-dark py-2.5 text-sm font-medium transition-colors hover:bg-moon-violet"
                >
                    <Plus size={16} />
                    Nouveau ticket
                </Link>
            </div>

            <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Navigation
            </p>

            <nav className="flex flex-1 flex-col gap-1 px-3">
                {navItems.map(({ href, label, icon: Icon, badge }) => {
                    const active =
                        href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                active
                                    ? 'bg-moon-violet-dark font-semibold text-white'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Icon size={17} strokeWidth={1.9} />
                            <span className="flex-1">{label}</span>
                            {badge != null && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-moon-rose text-[11px] font-bold text-moon-violet-dark">
                                    {badge}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Profil admin */}
            <div className="m-3 flex items-center gap-2.5 rounded-xl bg-white/5 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moon-rose text-xs font-bold text-moon-violet-dark">
                    AR
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">Admin RR</p>
                    <p className="truncate text-[11px] text-white/50">admin@rapidresponse.fr</p>
                </div>
            </div>
        </aside>
    )
}
