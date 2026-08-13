import axios from 'axios'
import type { AxiosInstance } from 'axios'

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

const instance_api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
})

instance_api.interceptors.request.use(async (config) => {
  let token = accessToken

  if (!token && typeof window !== 'undefined') {
    const { getSession } = await import('next-auth/react')
    const session = await getSession()
    token = session?.accessToken ?? null
    if (token) accessToken = token
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

instance_api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { message?: string | string[] } | undefined
      const raw = data?.message
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : (raw ?? error.message ?? 'Erreur réseau')
      return Promise.reject(new Error(message))
    }

    return Promise.reject(error)
  },
)

export default instance_api
