'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { SessionTokenSync } from '@/components/SessionTokenSync'

const muiTheme = createTheme({
    typography: {
        fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
    },
})

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <AppRouterCacheProvider>
            <SessionProvider>
                <SessionTokenSync />
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={muiTheme}>
                        <CssBaseline enableColorScheme />
                        {children}
                    </ThemeProvider>
                </QueryClientProvider>
            </SessionProvider>
        </AppRouterCacheProvider>
    )
}

export default Providers
