"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, LogOut, MessageCircle, Calendar, LayoutDashboard, ChevronDown, FileText, Wallet, RefreshCw } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useRouter } from 'next/navigation'
import { hasRole } from "@/lib/api"
import { useBalanceWebSocket } from "@/lib/hooks/use-balance-websocket"


export default function UserNav() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // WebSocket for real-time balance updates
  const { currentBalance, isConnected, refreshBalance } = useBalanceWebSocket()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    setIsDropdownOpen(false)
    await logout()
    router.push("/")
  }

  const isAdmin = hasRole(user, 'Admin')
  const isHotelOwner = hasRole(user, 'HotelOwner')
  const canAccessDashboard = isAdmin || isHotelOwner
  const canAccessBookingPage = isHotelOwner
  
  return (
    <div className="flex items-center space-x-4">
      <NotificationBell />
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 group cursor-pointer"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-copper-accent/30 transition-all duration-300">
            <User className="h-4 w-4 text-walnut-dark" />
          </div>
          <div className="hidden md:block">
            <div className="flex items-center">
              <p className="text-cream-light font-cormorant text-vintage-sm font-medium group-hover:text-copper-accent transition-colors duration-300">
                {user?.first_name} {user?.last_name}
              </p>
              <ChevronDown className={`h-4 w-4 text-cream-light ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            {/* Real-time balance display */}
            <div className="flex items-center gap-1">
              <Wallet className="h-3 w-3 text-copper-accent" />
              <p className="text-copper-accent font-cinzel font-semibold text-vintage-xs uppercase tracking-wider">
                ${currentBalance !== null ? Number(currentBalance).toFixed(2) : '---'}
              </p>
              {isConnected && (
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" title="Live updates active" />
              )}
            </div>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 z-50">
            <div className="bg-walnut-dark/98 backdrop-blur-sm border border-copper-accent/20 rounded-lg shadow-2xl overflow-hidden">
              {/* Balance Display with Refresh */}
              <div className="px-4 py-3 bg-copper-accent/5 border-b border-copper-accent/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-copper-accent" />
                    <div>
                      <p className="text-cream-light/60 font-cormorant text-vintage-xs">Balance</p>
                      <p className="text-copper-accent font-cinzel font-bold text-vintage-base">
                        ${currentBalance !== null ? Number(currentBalance).toFixed(2) : 'Loading...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      refreshBalance()
                    }}
                    className="p-1.5 hover:bg-copper-accent/10 rounded transition-colors"
                    title="Refresh balance"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-copper-accent" />
                  </button>
                </div>
                {isConnected && (
                  <p className="text-green-400 text-vintage-xs mt-1 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Live updates active
                  </p>
                )}
              </div>

              {/* Profile Link */}
              <Link 
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-cream-light hover:bg-copper-accent/10 transition-colors duration-200 border-b border-copper-accent/10"
              >
                <User className="h-4 w-4 text-copper-accent" />
                <span className="font-cormorant text-vintage-base">Profile</span>
              </Link>

              {/* Dashboard Link - Only for Admin/HotelOwner */}
              {canAccessDashboard && (
                <Link 
                  href="/admin/dashboard"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-cream-light hover:bg-copper-accent/10 transition-colors duration-200 border-b border-copper-accent/10"
                >
                  <LayoutDashboard className="h-4 w-4 text-copper-accent" />
                  <span className="font-cormorant text-vintage-base">Dashboard</span>
                </Link>
              )}

              {/* Bookings Link */}
              {canAccessBookingPage && (
                <Link 
                  href="/bookings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-cream-light hover:bg-copper-accent/10 transition-colors duration-200 border-b border-copper-accent/10"
                >
                  <Calendar className="h-4 w-4 text-copper-accent" />
                <span className="font-cormorant text-vintage-base">Bookings</span>
              </Link>
            )}

              {/* Chat Link */}
              <Link 
                href="/chat"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-cream-light hover:bg-copper-accent/10 transition-colors duration-200 border-b border-copper-accent/10"
              >
                <MessageCircle className="h-4 w-4 text-copper-accent" />
                <span className="font-cormorant text-vintage-base">Chat</span>
              </Link>

              {/* Requests Link */}
              <Link 
                href="/requests"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-cream-light hover:bg-copper-accent/10 transition-colors duration-200 border-b border-copper-accent/10"
              >
                <FileText className="h-4 w-4 text-copper-accent" />
                <span className="font-cormorant text-vintage-base">Requests</span>
              </Link>

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors duration-200 w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-cormorant text-vintage-base">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 