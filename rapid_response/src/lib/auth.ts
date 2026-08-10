import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Mot de passe', type: 'password' }
            },
            async authorize(credentials) {
                if (
                    credentials?.email === 'admin@ticket-checker.local' &&
                    credentials?.password === 'Admin@1234'
                ) {
                    return {
                        id: '1',
                        email: credentials.email,
                        name: 'Admin Ticket Checker',
                        role: 'admin',
                        accessToken: 'mock-access-token',
                        refreshToken: 'mock-refresh-token'
                    }
                }

                return null
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.accessToken = user.accessToken
                token.refreshToken = user.refreshToken
            }

            return token
        },
        async session({ session, token }) {
            // Assignation de accessToken à la racine de la session
            session.accessToken = token.accessToken

            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
            }

            return session
        }
    },
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/login'
    }
}