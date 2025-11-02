import type { PropsWithChildren, ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps extends PropsWithChildren {
  fallback?: ReactNode
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return (
      (fallback as ReactNode) || (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

