// Instance axios partagée — générée par api-forge, éditable.

import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

/** Token JWT courant (alimenté depuis NextAuth côté client). */
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token =
    accessToken ??
    (typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const data = error.response?.data
    const raw = data?.message
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : (raw ?? error.message ?? 'Erreur réseau')

    return Promise.reject(new Error(message))
  },
)

