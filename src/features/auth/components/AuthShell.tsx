'use client'

import { useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { authColors } from '../constants/theme'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

type Mode = 'login' | 'register'

export default function AuthShell({ initialMode = 'login' }: { initialMode?: Mode }) {
    const [mode, setMode] = useState<Mode>(initialMode)
    const isRegister = mode === 'register'

    return (
        <Box
            sx={{
                position: 'relative',
                width: 900,
                maxWidth: '100%',
                height: 600,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: 6,
                display: 'flex'
            }}
        >
            {/* Panneau formulaire : glisse entre 0% et 50% */}
            <motion.div
                animate={{ left: isRegister ? '0%' : '50%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: 0, width: '50%', height: '100%', background: '#fff', zIndex: 2 }}
            >
                <Box sx={{ p: 5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isRegister ? <RegisterForm /> : <LoginForm />}
                        </motion.div>
                    </AnimatePresence>
                </Box>
            </motion.div>

            {/* Panneau violet : glisse entre 50% et 0% (mouvement inverse) */}
            <motion.div
                animate={{ left: isRegister ? '50%' : '0%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    top: 0,
                    width: '50%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${authColors.gradientStart} 0%, ${authColors.gradientEnd} 100%)`,
                    zIndex: 1,
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    textAlign: 'center',
                    padding: '0 40px'
                }}
            >
                <Box sx={{ bgcolor: authColors.badgeBg, color: authColors.badgeText, px: 2, py: 1, borderRadius: 2, fontWeight: 700 }}>
                    RR
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {isRegister ? 'Déjà membre ?' : 'Nouveau membre ?'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    {isRegister
                        ? 'Connectez-vous pour accéder à votre espace et gérer vos interventions.'
                        : 'Créez un compte pour commencer à suivre vos interventions.'}
                </Typography>
                <Button
                    onClick={() => setMode(isRegister ? 'login' : 'register')}
                    sx={{ borderRadius: 8, border: '1px solid white', color: 'white', px: 4, mt: 2 }}
                >
                    {isRegister ? 'Se connecter' : "S'inscrire"}
                </Button>
            </motion.div>
        </Box>
    )
}