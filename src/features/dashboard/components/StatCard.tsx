type Tone = 'rose' | 'violet' | 'green' | 'plum' | 'lavande' | 'neutral'

const tones: Record<Tone, { bg: string; value: string; label: string }> = {
    rose: { bg: 'bg-moon-rose/60', value: 'text-moon-abyss', label: 'text-moon-abyss/60' },
    violet: { bg: 'bg-moon-violet/10', value: 'text-moon-violet', label: 'text-moon-abyss/60' },
    green: { bg: 'bg-emerald-500/10', value: 'text-emerald-700', label: 'text-moon-abyss/60' },
    plum: { bg: 'bg-moon-violet-dark/10', value: 'text-moon-violet-dark', label: 'text-moon-abyss/60' },
    lavande: { bg: 'bg-moon-lavande/10', value: 'text-moon-lavande', label: 'text-moon-abyss/60' },
    neutral: { bg: 'bg-white', value: 'text-moon-abyss', label: 'text-moon-abyss/60' },
}

export default function StatCard({
    value,
    label,
    sublabel,
    tone = 'neutral',
}: {
    value: string | number
    label: string
    sublabel?: string
    tone?: Tone
}) {
    const t = tones[tone]

    return (
        <div className={`rounded-2xl border border-moon-abyss/8 p-5 shadow-sm ${t.bg}`}>
            <p className={`text-3xl font-bold ${t.value}`}>{value}</p>
            <p className={`mt-1 text-sm font-medium ${t.label}`}>{label}</p>
            {sublabel && <p className="mt-0.5 text-xs text-moon-abyss/40">{sublabel}</p>}
        </div>
    )
}
