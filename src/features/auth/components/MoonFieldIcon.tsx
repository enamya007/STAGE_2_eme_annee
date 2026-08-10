'use client'

import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import { KeyRound, Lock, Mail, UserRound } from 'lucide-react'

export type MoonFieldIconType = 'user' | 'mail' | 'lock' | 'key'

type Props = {
    type: MoonFieldIconType
}

/* Pastille ronde à contour fin, style « social icons » */
const circleSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1.5px solid rgba(102, 103, 171, 0.45)',
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
            <Box sx={circleSx}>
                <Icon size={14} strokeWidth={2} aria-hidden />
            </Box>
        </InputAdornment>
    )
}

export default MoonFieldIcon
