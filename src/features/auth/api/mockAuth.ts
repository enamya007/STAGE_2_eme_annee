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

export interface ForgotPasswordResponse {
    message: string
}

// Plus tard : POST /auth/forgot-password — le backend envoie un e-mail
// contenant un lien de réinitialisation avec un token à usage unique.
export async function mockForgotPassword(values: { email: string }): Promise<ForgotPasswordResponse> {
    await new Promise((resolve) => setTimeout(resolve, 350))

    // Le backend répondra toujours 200 même si l'e-mail est inconnu,
    // pour ne pas révéler quels comptes existent (anti-énumération).
    return {
        message: `Si un compte existe pour ${values.email}, un lien de réinitialisation a été envoyé.`,
    }
}
