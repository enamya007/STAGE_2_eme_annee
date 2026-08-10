'use client'

import { useState } from 'react'
import { Table, FileText } from 'lucide-react'
import StatCard from '@/features/dashboard/components/StatCard'
import {
    statusBreakdown,
    weeklyTrend,
    technicianLoad,
} from '@/features/dashboard/data/mockData'

type Period = '7 jours' | '30 jours' | 'Personnalisé'

/** Donut SVG : chaque segment est un arc de cercle via stroke-dasharray */
function DonutChart() {
    const total = statusBreakdown.reduce((sum, s) => sum + s.value, 0)
    const radius = 70
    const circumference = 2 * Math.PI * radius
    let offset = 0

    return (
        <svg viewBox="0 0 180 180" className="h-44 w-44">
            {statusBreakdown.map((s) => {
                const fraction = s.value / total
                const dash = fraction * circumference
                const segment = (
                    <circle
                        key={s.label}
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="24"
                        strokeDasharray={`${dash - 3} ${circumference - dash + 3}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 90 90)"
                    />
                )

                offset += dash

                return segment
            })}
        </svg>
    )
}

/** Courbe SVG : polyline lissée + aire dégradée */
function TrendChart() {
    const width = 460
    const height = 170
    const padX = 30
    const padY = 16
    const max = Math.max(...weeklyTrend.map((p) => p.value))

    const points = weeklyTrend.map((p, i) => ({
        x: padX + (i * (width - padX * 2)) / (weeklyTrend.length - 1),
        y: height - padY - (p.value / max) * (height - padY * 2),
    }))

    const path = points
        .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
        .join(' ')

    const area = `${path} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`

    return (
        <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full">
            <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6667AB" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6667AB" stopOpacity="0" />
                </linearGradient>
            </defs>

            {[0, 2, 4, 6, 8].map((v) => {
                const y = height - padY - (v / max) * (height - padY * 2)

                return (
                    <g key={v}>
                        <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#2c2c54" strokeOpacity="0.06" />
                        <text x={padX - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#2c2c5480">
                            {v}
                        </text>
                    </g>
                )
            })}

            <path d={area} fill="url(#trendFill)" />
            <path d={path} fill="none" stroke="#6667AB" strokeWidth="2.5" strokeLinejoin="round" />

            {points.map((p, i) => (
                <g key={weeklyTrend[i].day}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#6667AB" stroke="#fff" strokeWidth="1.5" />
                    <text x={p.x} y={height + 12} textAnchor="middle" fontSize="9" fill="#2c2c5480">
                        {weeklyTrend[i].day}
                    </text>
                </g>
            ))}
        </svg>
    )
}

export default function StatisticsPage() {
    const [period, setPeriod] = useState<Period>('7 jours')

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-moon-abyss">Statistiques détaillées</h1>
                    <p className="mt-0.5 text-sm text-moon-abyss/50">
                        Analyse de l&apos;activité de la plateforme
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-full bg-moon-rose/40 p-1">
                        {(['7 jours', '30 jours', 'Personnalisé'] as Period[]).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPeriod(p)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    period === p
                                        ? 'bg-moon-violet-dark text-white'
                                        : 'text-moon-abyss/60 hover:text-moon-abyss'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-moon-violet-dark/30 bg-white px-4 py-2 text-sm font-medium text-moon-violet-dark hover:bg-moon-rose/20"
                    >
                        <Table size={15} />
                        Exporter CSV
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-moon-violet-dark/30 bg-white px-4 py-2 text-sm font-medium text-moon-violet-dark hover:bg-moon-rose/20"
                    >
                        <FileText size={15} />
                        Exporter PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard value={18} label="Total tickets" sublabel="+3 cette semaine" tone="plum" />
                <StatCard value={4} label="En cours" sublabel="2 urgents" tone="lavande" />
                <StatCard value={8} label="Résolus" sublabel="sur 30 jours" tone="green" />
                <StatCard value="2j" label="Temps moyen" sublabel="résolution" tone="rose" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Répartition par statut */}
                <div className="rounded-2xl border border-moon-abyss/8 bg-white p-5 shadow-sm">
                    <h2 className="font-bold text-moon-violet-dark">Répartition par statut</h2>
                    <p className="text-xs text-moon-abyss/50">Tickets en cours d&apos;analyse</p>
                    <div className="mt-4 flex items-center gap-6">
                        <DonutChart />
                        <ul className="flex-1 space-y-2.5">
                            {statusBreakdown.map((s) => (
                                <li key={s.label} className="flex items-center gap-2.5 text-sm">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="flex-1 text-moon-abyss/70">{s.label}</span>
                                    <span className="font-bold text-moon-abyss">{s.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Évolution temporelle */}
                <div className="rounded-2xl border border-moon-abyss/8 bg-white p-5 shadow-sm">
                    <h2 className="font-bold text-moon-violet-dark">Évolution temporelle</h2>
                    <p className="text-xs text-moon-abyss/50">Tickets ouverts sur la période</p>
                    <div className="mt-4">
                        <TrendChart />
                    </div>
                </div>
            </div>

            {/* Charge par technicien */}
            <div className="rounded-2xl border border-moon-abyss/8 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-moon-violet-dark">Charge comparée par technicien</h2>
                <p className="text-xs text-moon-abyss/50">Nombre de tickets actifs / capacité de 5</p>
                <div className="mt-5 space-y-4">
                    {technicianLoad.map((t) => (
                        <div key={t.name} className="flex items-center gap-4">
                            <span className="w-32 shrink-0 text-right text-sm font-medium text-moon-abyss/70">
                                {t.name}
                            </span>
                            <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-moon-rose/30">
                                <div
                                    className="h-full rounded-full bg-moon-violet-dark"
                                    style={{ width: `${(t.value / t.capacity) * 100}%` }}
                                />
                            </div>
                            <span className="w-6 text-sm font-bold text-moon-abyss">{t.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
