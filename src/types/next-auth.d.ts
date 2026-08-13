import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: {
      id: string
      email: string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    accessToken: string
    refreshToken: string
    role: 'admin' | 'technicien' | 'client'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'admin' | 'technicien' | 'client'
    accessToken: string
    refreshToken: string
  }
}
