'use client'

import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import { KeyRound, Lock, Mail, UserRound } from 'lucide-react'

export type MoonFieldIconType = 'user' | 'mail' | 'lock' | 'key'

type Props = {
    type: MoonFieldIconType
}

const iconBoxSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    color: '#6667AB',
} as const

const MoonFieldIcon = ({ type }: Props) => {
    const Icon = {
        user: UserRound,
        mail: Mail,
        lock: Lock,
        key: KeyRound,
    }[type]

    return (
        <InputAdornment position="start">
            <Box sx={iconBoxSx}>
                <Icon size={18} strokeWidth={1.9} aria-hidden />
            </Box>
        </InputAdornment>
    )
}

export default MoonFieldIcon
