"use client"

import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, LogOut, MessageCircle } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default function UserNav() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="w-8 h-8 bg-copper-accent/20 rounded-full animate-pulse"></div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/auth/login">
          <Button 
            size="sm"
            className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-playfair border-copper-accent/30 font-semibold  hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 text-vintage-base tracking-wider"
          >
            Sign In
          </Button>
        </Link>
        <Link href="/auth/register">
          <Button 
            size="sm"
            className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-playfair border-copper-accent/30 font-semibold  hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 text-vintage-base tracking-wider"
          >
            Sign Up
          </Button>
        </Link>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        <Link href="/profile" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-copper-accent/30 transition-all duration-300">
            <User className="h-4 w-4 text-walnut-dark" />
          </div>
          <div className="hidden md:block">
            <p className="text-cream-light font-cormorant text-vintage-sm font-medium group-hover:text-copper-accent transition-colors duration-300">
              {user?.first_name} {user?.last_name}
            </p>
            {user?.roles && user.roles.length > 0 && (
              <p className="text-copper-accent font-cinzel text-vintage-xs uppercase tracking-wider">
                {user.roles.join(", ")}
              </p>
            )}
          </div>
        </Link>
      </div>

      {/* Show dashboard button only for Admin and HotelOwner */}
      {user?.roles && (user.roles.includes('Admin') || user.roles.includes('HotelOwner')) && (
        <Link href="/admin/dashboard">
          <Button
            size="sm"
            className="px-4 bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            Dashboard
          </Button>
        </Link>
      )}

      <Link href="/chat">
        <Button
          size="sm"
          className="px-8 bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Chat
        </Button>
      </Link>

      <NotificationBell />

      <Button
        onClick={handleLogout}
        size="sm"
        className="bg-gradient-to-r from-copper-accent to-copper-light border-copper-accent/30 text-walnut-dark font-bold font-cinzel hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 text-vintage-base tracking-wider"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
} 