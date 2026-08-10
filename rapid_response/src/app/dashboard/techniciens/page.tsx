'use client'

import { useState } from 'react'
import { Wrench, Plus } from 'lucide-react'
import StatCard from '@/features/dashboard/components/StatCard'
import Modal from '@/features/dashboard/components/Modal'
import { technicians, initialSkills } from '@/features/dashboard/data/mockData'

export default function TechniciansPage() {
    const [skillsOpen, setSkillsOpen] = useState(false)
    const [skills, setSkills] = useState<string[]>(initialSkills)
    const [newSkill, setNewSkill] = useState('')

    const available = technicians.filter((t) => t.available).length
    const busy = technicians.length - available
    const activeTickets = technicians.reduce((sum, t) => sum + t.activeTickets, 0)

    const addSkill = () => {
        const value = newSkill.trim()

        if (value && !skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
            setSkills((prev) => [...prev, value])
        }

        setNewSkill('')
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-moon-abyss">Techniciens</h1>
                    <p className="mt-0.5 text-sm text-moon-abyss/50">
                        {technicians.length} techniciens actifs
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setSkillsOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-moon-violet/25 bg-white px-4 py-2.5 text-sm font-medium text-moon-violet transition-colors hover:bg-moon-violet hover:text-white"
                >
                    <Wrench size={15} />
                    Référentiel de compétences
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard value={available} label="Disponibles" tone="green" />
                <StatCard value={busy} label="Occupés" tone="violet" />
                <StatCard value={activeTickets} label="Tickets actifs" tone="plum" />
                <StatCard value={skills.length} label="Compétences" tone="rose" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {technicians.map((t) => {
                    const load = Math.round((t.activeTickets / t.capacity) * 100)

                    return (
                        <div
                            key={t.id}
                            className="rounded-2xl border border-moon-abyss/8 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-moon-lavande/15 text-sm font-bold text-moon-lavande">
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="font-bold text-moon-abyss">{t.name}</p>
                                    <span
                                        className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                            t.available
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-moon-violet/10 text-moon-violet'
                                        }`}
                                    >
                                        {t.available ? 'Disponible' : 'Occupé'}
                                    </span>
                                </div>
                            </div>

                            <p className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-moon-abyss/40">
                                Compétences
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {t.skills.map((s) => (
                                    <span
                                        key={s}
                                        className="rounded-full bg-moon-rose/50 px-2.5 py-1 text-xs font-medium text-moon-violet-dark"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-moon-abyss/8">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-moon-lavande to-moon-violet"
                                        style={{ width: `${load}%` }}
                                    />
                                </div>
                                <span className="font-mono text-xs font-semibold text-moon-lavande">
                                    {t.activeTickets} tickets
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal référentiel de compétences */}
            <Modal
                open={skillsOpen}
                title="Référentiel de compétences"
                onClose={() => setSkillsOpen(false)}
            >
                <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                        <span
                            key={s}
                            className="rounded-full bg-moon-rose/50 px-3 py-1.5 text-sm font-medium text-moon-violet-dark"
                        >
                            {s}
                        </span>
                    ))}
                </div>
                <div className="mt-5 flex gap-2.5">
                    <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="Nouvelle compétence..."
                        className="flex-1 rounded-lg border border-moon-abyss/12 px-3.5 py-2.5 text-sm text-moon-abyss placeholder:text-moon-abyss/40 focus:border-moon-violet focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={addSkill}
                        className="flex items-center gap-1.5 rounded-lg bg-moon-violet-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-moon-violet"
                    >
                        <Plus size={15} />
                        Ajouter
                    </button>
                </div>
            </Modal>
        </div>
    )
}
