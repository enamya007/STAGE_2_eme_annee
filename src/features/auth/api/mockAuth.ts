export interface MockAuthResponse {
    accessToken: string
    refreshToken: string
    user: { id: string; email: string; role: string }
}

export interface LoginPayload {
    email: string
    password: string
    rememberMe?: boolean
}

// Simule l'API le temps qu'elle soit prête.
// Un seul endroit à changer plus tard : remplacer le corps de ces
// fonctions par de vrais appels axios vers l'API NestJS (POST /auth/login, /auth/register).
export async function mockLogin(values: LoginPayload): Promise<MockAuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 350))

    if (values.email === 'admin@ticket-checker.local' && values.password === 'Admin@1234') {
        return {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: { id: '1', email: values.email, role: 'ADMIN' },
        }
    }

    throw new Error('Identifiants invalides')
}

export async function mockRegister(values: {
    fullName: string
    email: string
    password: string
}): Promise<MockAuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 350))

    return {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '2', email: values.email, role: 'CLIENT' },
    }
}
