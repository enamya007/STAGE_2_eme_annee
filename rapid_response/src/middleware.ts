import { withAuth } from 'next-auth/middleware'

export default withAuth({
    pages: {
        signIn: '/login',
    },
})

// Phase front-end : /dashboard reste accessible sans session NextAuth
// (le login passe encore par le mock). Remettre '/dashboard/:path*'
// dans le matcher après l'intégration de l'API d'authentification.
export const config = {
    matcher: ['/admin/:path*'],
}
