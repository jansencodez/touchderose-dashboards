'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/pages/auth/LoginPage'

export default function Login() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, isAdmin, router])

  if (user) {
    return null
  }

  return <LoginPage />
}