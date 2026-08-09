'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({
    open,
    title,
    onClose,
    children,
    maxWidth = 480,
}: {
    open: boolean
    title: React.ReactNode
    onClose: () => void
    children: React.ReactNode
    maxWidth?: number
}) {
    useEffect(() => {
        if (!open) return

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', onKey)

        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-moon-abyss/40 p-4 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full rounded-2xl bg-white p-6 shadow-2xl"
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-moon-abyss">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="rounded-full p-1 text-moon-abyss/50 transition-colors hover:bg-moon-rose/40 hover:text-moon-abyss"
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
