"use client"

import { useSession } from "next-auth/react"
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
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (requireAuth && !session) {
      router.push("/auth/login")
      return
    }

    if (allowedRoles.length > 0 && session) {
      const userRoles = session.roles || []
      const hasRequiredRole = allowedRoles.some(role => 
        userRoles.includes(role)
      )

      if (!hasRequiredRole) {
        router.push("/unauthorized")
        return
      }
    }
  }, [session, status, router, requireAuth, allowedRoles])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-copper-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cream-light font-cormorant text-vintage-base">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !session) {
    return null // Will redirect in useEffect
  }

  if (allowedRoles.length > 0 && session) {
    const userRoles = session.roles || []
    const hasRequiredRole = allowedRoles.some(role => 
      userRoles.includes(role)
    )

    if (!hasRequiredRole) {
      return null // Will redirect in useEffect
    }
  }

  return <>{children}</>
} 