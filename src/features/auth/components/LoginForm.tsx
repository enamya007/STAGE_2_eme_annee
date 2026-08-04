'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useMutation } from '@tanstack/react-query'
import { Box, TextField, Typography, Button, InputAdornment, IconButton, CircularProgress, Alert } from '@mui/material'
import { MailOutlined, LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'
import { authColors } from '../constants/theme'
import { mockLogin } from '../api/mockAuth'

const inputSx = { mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 8 } }

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false)

    const { control, handleSubmit } = useForm<LoginFormValues>({
        resolver: valibotResolver(loginSchema),
        defaultValues: { email: '', password: '' }
    })

    const loginMutation = useMutation({ mutationFn: mockLogin })

    const onSubmit = (values: LoginFormValues) => loginMutation.mutate(values)

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="h4" sx={{ fontWeight: 700, color: authColors.headingText, mb: 1 }}>
                Bon retour !
            </Typography>
            <Typography variant="body2" sx={{ color: authColors.mutedText, mb: 4 }}>
                Connectez-vous pour accéder à vos interventions.
            </Typography>

            {loginMutation.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Email ou mot de passe incorrect.
                </Alert>
            )}
            {loginMutation.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Connexion simulée réussie (API pas encore branchée).
                </Alert>
            )}

            <Typography component="label" htmlFor="login-email" sx={{ fontWeight: 600, color: authColors.headingText, display: 'block', mb: 0.5 }}>
                Email
            </Typography>
            <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        id="login-email"
                        fullWidth
                        placeholder="vous@exemple.com"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <MailOutlined sx={{ color: authColors.iconPrimary }} />
                                    </InputAdornment>
                                )
                            }
                        }}
                        sx={inputSx}
                    />
                )}
            />

            <Typography component="label" htmlFor="login-password" sx={{ fontWeight: 600, color: authColors.headingText, display: 'block', mb: 0.5 }}>
                Mot de passe
            </Typography>
            <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        placeholder="••••••••"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined sx={{ color: authColors.iconAccent }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                        sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                    />
                )}
            />

            <Button
                type="submit"
                fullWidth
                disabled={loginMutation.isPending}
                sx={{
                    borderRadius: 8,
                    bgcolor: authColors.submitBg,
                    color: '#fff',
                    py: 1.5,
                    fontWeight: 700,
                    '&:hover': { bgcolor: authColors.submitBg, opacity: 0.9 }
                }}
            >
                {loginMutation.isPending ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Se connecter'}
            </Button>
        </Box>
    )
}