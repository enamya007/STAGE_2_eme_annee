'use client'

import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import { KeyRound, Lock, Mail, UserRound } from 'lucide-react'

export type MoonFieldIconType = 'user' | 'mail' | 'lock' | 'key'

type Props = {
    type: MoonFieldIconType
}

const softIconSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    color: '#6667AB',
    filter: 'drop-shadow(0 1px 2px rgba(102, 103, 171, 0.35))',
} as const

const goldIconSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    color: '#B8860B',
    filter: 'drop-shadow(0 2px 3px rgba(184, 134, 11, 0.45))',
} as const

const MoonFieldIcon = ({ type }: Props) => {
    const isGold = type === 'lock' || type === 'key'

    const iconProps = isGold
        ? { size: 21, strokeWidth: 2.1, fill: 'rgba(240, 193, 75, 0.42)', color: '#C9A227' }
        : { size: 20, strokeWidth: 1.85, fill: 'rgba(102, 103, 171, 0.14)', color: '#6667AB' }

    const Icon = {
        user: UserRound,
        mail: Mail,
        lock: Lock,
        key: KeyRound,
    }[type]

    return (
        <InputAdornment position="start">
            <Box sx={isGold ? goldIconSx : softIconSx}>
                <Icon {...iconProps} aria-hidden />
            </Box>
        </InputAdornment>
    )
}

export default MoonFieldIcon
