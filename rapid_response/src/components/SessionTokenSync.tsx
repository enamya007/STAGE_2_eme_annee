'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { setAccessToken } from '@/services/http/axios'

export function SessionTokenSync() {
  const { data } = useSession()

  useEffect(() => {
    setAccessToken(data?.accessToken ?? null)
  }, [data?.accessToken])

  return null
}
