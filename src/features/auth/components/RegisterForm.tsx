'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useMutation } from '@tanstack/react-query'
import { Box, TextField, Typography, Button, InputAdornment, IconButton, CircularProgress, Alert } from '@mui/material'
import { PersonOutlined, MailOutlined, LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material'
import { registerSchema, type RegisterFormValues } from '../schemas/registerSchema'
import { authColors } from '../constants/theme'
import { mockRegister } from '../api/mockAuth'

const inputSx = { mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 8 } }

export default function RegisterForm() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const { control, handleSubmit } = useForm<RegisterFormValues>({
        resolver: valibotResolver(registerSchema),
        defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
    })

    const registerMutation = useMutation({ mutationFn: mockRegister })

    const onSubmit = (values: RegisterFormValues) => registerMutation.mutate(values)

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="h4" sx={{ fontWeight: 700, color: authColors.headingText, mb: 1 }}>
                Créer un compte
            </Typography>
            <Typography variant="body2" sx={{ color: authColors.mutedText, mb: 3 }}>
                Renseignez vos informations pour commencer.
            </Typography>

            {registerMutation.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Inscription simulée réussie (API pas encore branchée).
                </Alert>
            )}

            <Typography component="label" htmlFor="register-fullName" sx={{ fontWeight: 600, color: authColors.headingText, display: 'block', mb: 0.5 }}>
                Nom et Prénom(s)
            </Typography>
            <Controller
                name="fullName"
                control={control}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        id="register-fullName"
                        fullWidth
                        placeholder="KOLA Balakiyèm"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlined sx={{ color: authColors.iconPrimary }} />
                                    </InputAdornment>
                                )
                            }
                        }}
                        sx={inputSx}
                    />
                )}
            />

            <Typography component="label" htmlFor="register-email" sx={{ fontWeight: 600, color: authColors.headingText, display: 'block', mb: 0.5 }}>
                Email
            </Typography>
            <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        id="register-email"
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

            <Typography component="label" htmlFor="register-password" sx={{ fontWeight: 600, color: authColors.headingText, display: 'block', mb: 0.5 }}>
                Mot de passe
            </Typography>
            <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        id="register-password"
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
                        sx={inputSx}
                    />
                )}
            />

            <Typography component="label" htmlFor="register-confirmPassword" sx={{ fontWeight: 600, color: authColors.headingText, display: 'block', mb: 0.5 }}>
                Confirmer le mot de passe
            </Typography>
            <Controller
                name="confirmPassword"
                control={control}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        id="register-confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
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
                                        <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small">
                                            {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                        sx={{ mb: 3.5, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                    />
                )}
            />

            <Button
                type="submit"
                fullWidth
                disabled={registerMutation.isPending}
                sx={{
                    borderRadius: 8,
                    bgcolor: authColors.submitBg,
                    color: '#fff',
                    py: 1.5,
                    fontWeight: 700,
                    '&:hover': { bgcolor: authColors.submitBg, opacity: 0.9 }
                }}
            >
                {registerMutation.isPending ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : "S'inscrire"}
            </Button>
        </Box>
    )
}