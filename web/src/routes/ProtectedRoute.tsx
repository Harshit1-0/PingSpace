import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ReactNode } from 'react'

type Props = { children: ReactNode }

export default function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}


