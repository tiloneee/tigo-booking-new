"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, LogOut, MessageCircle } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default function UserNav() {
  const { data: session } = useSession()

  // if (status === "loading") {
  //   return (
  //     <div className="w-8 h-8 bg-copper-accent/20 rounded-full animate-pulse"></div>
  //   )
  // }

  if (!session) {
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
    await signOut({ 
      callbackUrl: "/",
      redirect: true 
    })
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-walnut-dark" />
          </div>
          <div className="hidden md:block">
            <p className="text-cream-light font-cormorant text-vintage-sm font-medium">
              {session.user?.name || session.user?.email}
            </p>
            {session.roles && session.roles.length > 0 && (
              <p className="text-copper-accent font-cinzel text-vintage-xs uppercase tracking-wider">
                {session.roles.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Show dashboard button only for Admin and HotelOwner */}
      {session.roles && (session.roles.includes('Admin') || session.roles.includes('HotelOwner')) && (
        <Link href="/admin/dashboard">
          <Button
            size="sm"
            variant="outline"
            className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10 hover:text-copper-accent transition-all duration-300"
          >
            Dashboard
          </Button>
        </Link>
      )}

      <Link href="/chat">
        <Button
          size="sm"
          variant="outline"
          className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10 hover:text-copper-accent transition-all duration-300"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Chat
        </Button>
      </Link>

      <NotificationBell />

      <Button
        onClick={handleLogout}
        size="sm"
        className="bg-gradient-to-r from-copper-accent to-copper-light border-copper-accent/30 text-walnut-dark font-medium hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 text-vintage-base tracking-wider"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
} 