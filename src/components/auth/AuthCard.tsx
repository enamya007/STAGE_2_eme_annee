'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AuthCard() {
    const router = useRouter()
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        const result = await signIn('credentials', { email, password, redirect: false })
        setLoading(false)
        if (result?.error) {
            setError('Email ou mot de passe incorrect')
            return
        }
        router.push('/dashboard')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-moon-rose/10 p-4">
            <div className="relative h-[600px] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Conteneur glissant : largeur double (200%), 4 panneaux de 25% chacun */}
                <div
                    className="flex h-full w-[200%] transition-transform duration-[600ms] ease-in-out"
                    style={{ transform: mode === 'login' ? 'translateX(0%)' : 'translateX(-50%)' }}
                >
                    {/* Panneau 1 : promo — visible à gauche en mode login */}
                    <PromoPanel variant="login" onSwitch={() => setMode('signup')} />

                    {/* Panneau 2 : formulaire connexion — visible à droite en mode login */}
                    <div className="flex w-1/4 flex-col justify-center p-10">
                        <form onSubmit={handleLogin}>
                            <h1 className="mb-1 text-2xl font-bold text-moon-abyss">Connexion</h1>
                            <p className="mb-6 text-sm text-gray-500">Connectez-vous à votre espace</p>

                            {error && (
                                <p className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>
                            )}

                            <label className="mb-1 block text-sm font-medium text-moon-abyss">Adresse e-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="mb-4 w-full rounded-md border border-moon-lavande/30 px-3 py-2 focus:border-moon-violet focus:outline-none"
                            />

                            <label className="mb-1 block text-sm font-medium text-moon-abyss">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="mb-6 w-full rounded-md border border-moon-lavande/30 px-3 py-2 focus:border-moon-violet focus:outline-none"
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-md bg-moon-violet-dark py-2 text-white transition-colors hover:bg-moon-violet disabled:opacity-50"
                            >
                                {loading ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </form>
                    </div>

                    {/* Panneau 3 : formulaire inscription — visible à gauche en mode signup */}
                    <div className="flex w-1/4 flex-col justify-center p-10">
                        <h1 className="mb-1 text-2xl font-bold text-moon-abyss">Créer un compte</h1>
                        <p className="mb-6 text-sm text-gray-500">Inscrivez-vous pour commencer</p>
                        {/* Champs Nom / Email / Mot de passe / Confirmation — à brancher une fois /auth/register confirmé côté API */}
                    </div>

                    {/* Panneau 4 : promo — visible à droite en mode signup */}
                    <PromoPanel variant="signup" onSwitch={() => setMode('login')} />
                </div>
            </div>
        </div>
    )
}

function PromoPanel({ variant, onSwitch }: { variant: 'login' | 'signup'; onSwitch: () => void }) {
    return (
        <div className="relative flex w-1/4 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-moon-lavande via-moon-violet to-moon-violet-dark p-10 text-center text-white">
            <div className="absolute -bottom-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-10 top-20 h-24 w-24 rounded-full border border-white/20" />

            <div className="mb-2 rounded-xl bg-moon-rose px-4 py-2 font-bold text-moon-violet-dark">RR</div>
            <p className="mb-8 text-sm tracking-wide text-moon-rose">RAPID RESPONSE</p>

            {variant === 'login' ? (
                <>
                    <h2 className="mb-2 text-xl font-bold">Bienvenue sur Rapid Response</h2>
                    <p className="mb-8 text-sm text-moon-rose/90">
                        Gérez efficacement vos interventions techniques et suivez chaque demande en temps réel.
                    </p>
                    <button
                        onClick={onSwitch}
                        className="rounded-full border border-moon-rose px-6 py-2 text-sm text-moon-rose transition-colors hover:bg-moon-rose hover:text-moon-violet-dark"
                    >
                        Créer un compte
                    </button>
                </>
            ) : (
                <>
                    <h2 className="mb-2 text-xl font-bold">Déjà membre ?</h2>
                    <p className="mb-8 text-sm text-moon-rose/90">
                        Connectez-vous pour accéder à votre espace et gérer vos interventions.
                    </p>
                    <button
                        onClick={onSwitch}
                        className="rounded-full border border-moon-rose px-6 py-2 text-sm text-moon-rose transition-colors hover:bg-moon-rose hover:text-moon-violet-dark"
                    >
                        Se connecter
                    </button>
                </>
            )}