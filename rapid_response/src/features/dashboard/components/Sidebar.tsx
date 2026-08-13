'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
    Ticket,
    LayoutDashboard,
    Wrench,
    Users,
    Activity,
    Settings,
} from 'lucide-react'

const navItems = [
    { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/techniciens', label: 'Techniciens', icon: Wrench },
    { href: '/dashboard/utilisateurs', label: 'Utilisateurs', icon: Users },
    { href: '/dashboard/statistiques', label: 'Statistiques', icon: Activity },
    { href: '/dashboard/parametres', label: 'Paramètres', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { data } = useSession()
    const name = data?.user?.name ?? data?.user?.email ?? 'Utilisateur'
    const email = data?.user?.email ?? ''
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    return (
        <aside className="flex h-screen w-60 shrink-0 flex-col bg-moon-abyss text-white">
            <div className="flex items-center gap-2.5 px-5 py-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-moon-rose text-xs font-bold text-moon-violet-dark">
                    RR
                </div>
                <div>
                    <p className="text-sm font-bold leading-tight">Rapid Response</p>
                    <p className="text-[11px] text-white/50">RR · v2.4</p>
                </div>
            </div>

            <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Navigation
            </p>

            <nav className="flex flex-1 flex-col gap-1 px-3">
                {navItems.map(({ href, label, icon: Icon }) => {
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
                        </Link>
                    )
                })}
            </nav>

            <div className="m-3 space-y-2">
                <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moon-rose text-xs font-bold text-moon-violet-dark">
                        {initials || 'RR'}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        <p className="truncate text-[11px] text-white/50">{email}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                >
                    Se déconnecter
                </button>
            </div>
        </aside>
    )
}
