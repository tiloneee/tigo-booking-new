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
            className="bg-gradient-to-r from-terracotta-rose to-terracotta-orange/80 text-dark-brown font-varela border-accent/30 font-semibold hover:shadow-accent/30 transition-all duration-300 hover:scale-105 tracking-wider"
          >
            Sign In
          </Button>
        </Link>
        <Link href="/auth/register">
          <Button 
            size="sm"
            className="bg-gradient-to-r from-terracotta-rose to-terracotta-orange/80 text-dark-brown font-varela border-accent/30 font-semibold hover:shadow-accent/30 transition-all duration-300 hover:scale-105 tracking-wider"
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
          <div className="w-8 h-8 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-terracotta-rose/70 transition-all duration-300">
            <User className="h-4 w-4 text-walnut-dark" />
          </div>
          <div className="hidden md:block">
            <div className="flex items-center">
              <p className="text-creamy-yellow font-varela text-vintage-sm font-medium group-hover:text-creamy-white transition-colors duration-300">
                {user?.first_name} {user?.last_name}
              </p>
              <ChevronDown className={`h-4 w-4 text-creamy-yellow ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            {/* Real-time balance display */}
            <div className="flex items-center gap-1">
              <Wallet className="h-3 w-3 text-creamy-yellow" />
              <p className="text-creamy-yellow font-varela font-semibold text-vintage-xs uppercase tracking-wider">
                ${currentBalance !== null ? Number(currentBalance).toFixed(2) : '---'}
              </p>
              {isConnected && (
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse font-varela font-light" title="Live updates active" />
              )}
            </div>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 z-50">
            <div className="bg-deep-brown/98 backdrop-blur-sm border border-terracotta-rose/70 rounded-lg shadow-2xl overflow-hidden">
              {/* Balance Display with Refresh */}
              <div className="px-4 py-3 bg-deep-brown/5 border-b rounded-b-md border-terracotta-rose/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-creamy-yellow" />
                    <div>
                      <p className="text-creamy-yellow/60 font-varela text-vintage-xs">Balance</p>
                      <p className="text-creamy-yellow font-varela font-bold text-vintage-base">
                        ${currentBalance !== null ? Number(currentBalance).toFixed(2) : 'Loading...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      refreshBalance()
                    }}
                    className="p-1.5 hover:bg-deep-brown/90 rounded transition-colors"
                    title="Refresh balance"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-creamy-yellow" />
                  </button>
                </div>
                {isConnected && (
                  <p className="text-green-400 font-varela font-light text-vintage-xs mt-1 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Live updates active
                  </p>
                )}
              </div>

              {/* Profile Link */}
              <Link 
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-creamy-yellow hover:bg-terracotta-rose/10 transition-colors duration-200 "
              >
                <User className="h-4 w-4 text-creamy-yellow" />
                <span className="font-varela font-medium text-vintage-base">Profile</span>
              </Link>

              {/* Dashboard Link - Only for Admin/HotelOwner */}
              {canAccessDashboard && (
                <Link 
                  href="/admin/dashboard"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-creamy-yellow hover:bg-terracotta-rose/10 transition-colors duration-200"
                >
                  <LayoutDashboard className="h-4 w-4 text-creamy-yellow" />
                  <span className="font-varela text-vintage-base">Dashboard</span>
                </Link>
              )}

              {/* Bookings Link */}
              {canAccessBookingPage && (
                <Link 
                  href="/bookings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-creamy-yellow hover:bg-terracotta-rose/10 transition-colors duration-200"
                >
                  <Calendar className="h-4 w-4 text-creamy-yellow" />
                  <span className="font-varela text-vintage-base">Bookings</span>
                </Link>
              )}

              {/* Chat Link */}
              <Link 
                href="/chat"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-creamy-yellow hover:bg-terracotta-rose/10 transition-colors duration-200"
              >
                <MessageCircle className="h-4 w-4 text-creamy-yellow" />
                <span className="font-varela text-vintage-base">Chat</span>
              </Link>

              {/* Requests Link */}
              <Link 
                href="/requests"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-creamy-yellow hover:bg-terracotta-rose/10 transition-colors duration-200"
              >
                <FileText className="h-4 w-4 text-creamy-yellow" />
                <span className="font-varela text-vintage-base">Requests</span>
              </Link>

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors duration-200 rounded-t-lg border-t-2 border-terracotta-rose/90 w-full text-left"
              >
                <LogOut className="h-4 w-4 " />
                <span className="font-varela font-bold text-vintage-base">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 