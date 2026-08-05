'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useMutation } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Link from 'next/link'
import MoonField from './MoonField'
import MoonFieldIcon from './MoonFieldIcon'
import MoonPasswordToggle from './MoonPasswordToggle'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'
import {
    moonButtonSx,
    moonButtonPendingSx,
    moonCheckboxLabelSx,
    moonCheckboxSx,
    moonFormHeaderSx,
    moonLinkSx,
} from '../constants/moonTheme'
import { mockLogin } from '../api/mockAuth'

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false)

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: valibotResolver(loginSchema),
        defaultValues: { email: '', password: '', rememberMe: false },
    })

    const loginMutation = useMutation({ mutationFn: mockLogin })

    const onSubmit = (values: LoginFormValues) => {
        loginMutation.mutate({
            email: values.email,
            password: values.password,
            rememberMe: values.rememberMe,
        })
    }

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}
        >
            <Box sx={{ mb: 0.25 }}>
                <Typography variant="h5" sx={moonFormHeaderSx.title}>
                    Connexion
                </Typography>
                <Typography sx={moonFormHeaderSx.subtitle}>Connectez-vous à votre espace</Typography>
            </Box>

            {loginMutation.isError && (
                <Alert severity="error" sx={{ py: 0.25, alignItems: 'center' }}>
                    Adresse e-mail ou mot de passe incorrect.
                </Alert>
            )}
            {loginMutation.isSuccess && (
                <Alert severity="success" sx={{ py: 0.25, alignItems: 'center' }}>
                    Connexion simulée réussie (API pas encore branchée).
                </Alert>
            )}

            <Controller
                name="email"
                control={control}
                render={({ field }) => (
                    <MoonField
                        {...field}
                        label="Adresse e-mail"
                        fieldId="login-email"
                        placeholder="name@exemple.com"
                        type="email"
                        autoComplete="email"
                        rounded="pill"
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        slotProps={{
                            input: {
                                startAdornment: <MoonFieldIcon type="mail" />,
                            },
                        }}
                    />
                )}
            />

            <Controller
                name="password"
                control={control}
                render={({ field }) => (
                    <MoonField
                        {...field}
                        label="Mot de passe"
                        fieldId="login-password"
                        placeholder="Mot de passe"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        rounded="pill"
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        slotProps={{
                            input: {
                                startAdornment: <MoonFieldIcon type="lock" />,
                                endAdornment: (
                                    <MoonPasswordToggle
                                        visible={showPassword}
                                        onToggle={() => setShowPassword((p) => !p)}
                                    />
                                ),
                            },
                        }}
                    />
                )}
            />

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    mt: 0,
                }}
            >
                <Controller
                    name="rememberMe"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                        <FormControlLabel
                            control={
                                <Checkbox {...field} checked={!!value} onChange={onChange} sx={moonCheckboxSx} />
                            }
                            label="Se souvenir de moi"
                            sx={moonCheckboxLabelSx}
                        />
                    )}
                />
                <Typography component={Link} href="/forgot-password" sx={moonLinkSx}>
                    Mot de passe oublié ?
                </Typography>
            </Box>

            <Button
                type="submit"
                disabled={loginMutation.isPending}
                fullWidth
                sx={{
                    ...moonButtonSx,
                    ...(loginMutation.isPending ? moonButtonPendingSx : {}),
                    mt: 0.5,
                }}
            >
                {loginMutation.isPending ? (
                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                ) : (
                    'Se connecter'
                )}
            </Button>
        </Box>
    )
}
