"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Building2, AlertCircle } from "lucide-react"
import { usersApi, hotelsApi } from "@/lib/api/dashboard"
import type { DashboardUser, Hotel } from "@/types/dashboard"
import UsersTab from "@/components/dashboard/users-tab"
import HotelsTab from "@/components/dashboard/hotels-tab"

type TabType = 'users' | 'hotels'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = session?.roles?.includes('Admin')
  const isHotelOwner = session?.roles?.includes('HotelOwner')

  const loadDashboardData = useCallback(async () => {
    if (!session?.accessToken) return

    try {
      setLoading(true)
      setError(null)

      // Admin can see all data
      if (isAdmin) {
        const [usersData, hotelsData] = await Promise.all([
          usersApi.getAll(session.accessToken).catch(() => []),
          hotelsApi.getAll(session.accessToken).catch(() => []),
        ])
        setUsers(usersData)
        setHotels(hotelsData)
      } 
      // Hotel owner can only see their own hotels
      else if (isHotelOwner) {
        const hotelsData = await hotelsApi.getOwned(session.accessToken)
        setHotels(hotelsData)
        // Set active tab to hotels since hotel owners can't see users
        setActiveTab('hotels')
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [session?.accessToken, isAdmin, isHotelOwner])

  useEffect(() => {
    // Check if user has permission
    if (status === 'authenticated' && !isAdmin && !isHotelOwner) {
      router.push('/')
      return
    }

    if (status === 'authenticated' && session?.accessToken) {
      loadDashboardData()
    }
  }, [status, session?.accessToken, isAdmin, isHotelOwner, router, loadDashboardData])

  const refreshData = () => {
    loadDashboardData()
  }

  if (status === 'loading' || loading) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'HotelOwner']}>
        <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest">
          <Header />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="w-16 h-16 border-4 border-copper-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['Admin', 'HotelOwner']}>
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest">
        <Header />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-vintage-4xl md:text-vintage-5xl font-playfair font-bold text-cream-light mb-4 tracking-wide">
                {isAdmin ? 'Admin' : 'Hotel Owner'} Dashboard
              </h1>
              <p className="text-vintage-lg text-cream-light/80 font-cormorant font-light leading-relaxed">
                {isAdmin 
                  ? 'Manage users, hotels, rooms, and bookings'
                  : 'Manage your hotels, rooms, and bookings'}
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <Card className="bg-red-900/20 border-red-500/50 mb-6">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3 text-red-300">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs Navigation */}
            <div className="flex gap-4 mb-8 border-b border-copper-accent/30">
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-6 py-3 font-cormorant text-vintage-lg font-medium transition-all duration-300 ${
                    activeTab === 'users'
                      ? 'text-copper-accent border-b-2 border-copper-accent'
                      : 'text-cream-light/60 hover:text-cream-light'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  Users
                </button>
              )}
              <button
                onClick={() => setActiveTab('hotels')}
                className={`flex items-center gap-2 px-6 py-3 font-cormorant text-vintage-lg font-medium transition-all duration-300 ${
                  activeTab === 'hotels'
                    ? 'text-copper-accent border-b-2 border-copper-accent'
                    : 'text-cream-light/60 hover:text-cream-light'
                }`}
              >
                <Building2 className="h-5 w-5" />
                Hotels
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {activeTab === 'users' && isAdmin && (
                <UsersTab 
                  users={users} 
                  accessToken={session?.accessToken || ''}
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'hotels' && (
                <HotelsTab 
                  hotels={hotels}
                  accessToken={session?.accessToken || ''}
                  isAdmin={isAdmin || false}
                  onRefresh={refreshData}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
