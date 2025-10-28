"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return // Still loading

    if (requireAuth && !isAuthenticated) {
      router.push("/auth/login")
      return
    }

    if (allowedRoles.length > 0 && user) {
      const userRoles = user.roles || []
      const hasRequiredRole = allowedRoles.some(role => 
        userRoles.includes(role)
      )

      if (!hasRequiredRole) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, isAuthenticated, isLoading, router, requireAuth, allowedRoles])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-copper-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cream-light font-cormorant text-vintage-base">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null // Will redirect in useEffect
  }

  if (allowedRoles.length > 0 && user) {
    const userRoles = user.roles || []
    const hasRequiredRole = allowedRoles.some(role => 
      userRoles.includes(role)
    )

    if (!hasRequiredRole) {
      return null // Will redirect in useEffect
    }
  }

  return <>{children}</>
} 