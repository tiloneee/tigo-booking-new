"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Building2, AlertCircle, Search, X, DollarSign } from "lucide-react"
import { usersApi, hotelsApi, balanceRequestsApi } from "@/lib/api/dashboard"
import { getRoleName, hasRole } from "@/lib/api"
import type { DashboardUser, Hotel } from "@/types/dashboard"
import type { Transaction } from "@/lib/api/balance"
import UsersTab from "@/components/dashboard/users-tab"
import HotelsTab from "@/components/dashboard/hotels-tab"
import BalanceRequestsTab from "@/components/dashboard/balance-requests-tab"

type TabType = 'users' | 'hotels' | 'balance-requests'

export default function AdminDashboard() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [balanceRequests, setBalanceRequests] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dataLoaded, setDataLoaded] = useState(false) // Track if data has been loaded

  const isAdmin = hasRole(user, 'Admin')
  const isHotelOwner = hasRole(user, 'HotelOwner')

  const loadDashboardData = useCallback(async () => {
    if (!accessToken) return

    try {
      setLoading(true)
      setError(null)

      // Admin can see all data
      if (isAdmin) {
        const [usersData, hotelsData, balanceRequestsData] = await Promise.all([
          usersApi.getAll().catch(() => []),
          hotelsApi.getAll().catch(() => []),
          balanceRequestsApi.getAllTopups().catch(() => []),
        ])
        setUsers(usersData)
        setHotels(hotelsData)
        setBalanceRequests(balanceRequestsData)
      } 
      // Hotel owner can only see their own hotels
      else if (isHotelOwner) {
        const hotelsData = await hotelsApi.getOwned()
        setHotels(hotelsData)
        // Set active tab to hotels since hotel owners can't see users
        setActiveTab('hotels')
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
      setDataLoaded(true) // Mark data as loaded
    }
  }, [accessToken, isAdmin, isHotelOwner])

  useEffect(() => {
    // Check if user has permission
    if (user && !isAdmin && !isHotelOwner) {
      router.push('/')
      return
    }

    // Set initial tab based on user role
    if (user && !isAdmin && isHotelOwner) {
      setActiveTab('hotels')
    }

    // Only load data on initial mount, not on every token refresh
    if (user && accessToken && !dataLoaded) {
      loadDashboardData()
    }
  }, [user, isAdmin, isHotelOwner, router, dataLoaded, accessToken, loadDashboardData])

  const refreshData = () => {
    setDataLoaded(false) // Reset the flag so data will be reloaded
    loadDashboardData()
  }

  const handleUpdateBalanceRequest = (requestId: string, updatedRequest: Transaction) => {
    setBalanceRequests(prev => 
      prev.map(req => req.id === requestId ? updatedRequest : req)
    )
  }

  // Search filtering logic
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      user.first_name.toLowerCase().includes(query) ||
      user.last_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone_number?.toLowerCase().includes(query) ||
      user.roles.some(role => (typeof role === 'string' ? role : role.name).toLowerCase().includes(query))
    )
  })

  const filteredHotels = hotels.filter(hotel => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      hotel.name.toLowerCase().includes(query) ||
      hotel.description.toLowerCase().includes(query) ||
      hotel.address.toLowerCase().includes(query) ||
      hotel.city.toLowerCase().includes(query) ||
      hotel.state.toLowerCase().includes(query) ||
      hotel.country.toLowerCase().includes(query) ||
      hotel.phone_number.toLowerCase().includes(query) ||
      hotel.owner?.first_name.toLowerCase().includes(query) ||
      hotel.owner?.last_name.toLowerCase().includes(query) ||
      hotel.owner?.email.toLowerCase().includes(query)
    )
  })

  const filteredBalanceRequests = balanceRequests.filter(request => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      request.user?.first_name.toLowerCase().includes(query) ||
      request.user?.last_name.toLowerCase().includes(query) ||
      request.user?.email.toLowerCase().includes(query) ||
      request.amount.toString().includes(query) ||
      request.status.toLowerCase().includes(query)
    )
  })

  const clearSearch = () => {
    setSearchQuery('')
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchQuery('') // Clear search when switching tabs
  }

  if (isLoading || loading) {
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

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-cream-light/60" />
                </div>
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'users' ? 'users' : activeTab === 'hotels' ? 'hotels' : 'balance requests'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-walnut-dark/50 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/60 focus:outline-none focus:ring-2 focus:ring-copper-accent/50 focus:border-copper-accent/50 font-cormorant text-vintage-base"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-cream-light/60 hover:text-cream-light transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="mt-2 text-vintage-sm text-cream-light/70 font-cormorant">
                  {activeTab === 'users' 
                    ? `Found ${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`
                    : activeTab === 'hotels'
                    ? `Found ${filteredHotels.length} hotel${filteredHotels.length !== 1 ? 's' : ''}`
                    : `Found ${filteredBalanceRequests.length} request${filteredBalanceRequests.length !== 1 ? 's' : ''}`
                  }
                </div>
              )}
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
                  onClick={() => handleTabChange('users')}
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
                onClick={() => handleTabChange('hotels')}
                className={`flex items-center gap-2 px-6 py-3 font-cormorant text-vintage-lg font-medium transition-all duration-300 ${
                  activeTab === 'hotels'
                    ? 'text-copper-accent border-b-2 border-copper-accent'
                    : 'text-cream-light/60 hover:text-cream-light'
                }`}
              >
                <Building2 className="h-5 w-5" />
                Hotels
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleTabChange('balance-requests')}
                  className={`flex items-center gap-2 px-6 py-3 font-cormorant text-vintage-lg font-medium transition-all duration-300 ${
                    activeTab === 'balance-requests'
                      ? 'text-copper-accent border-b-2 border-copper-accent'
                      : 'text-cream-light/60 hover:text-cream-light'
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                  Balance Requests
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {searchQuery && (
                (activeTab === 'users' && filteredUsers.length === 0) ||
                (activeTab === 'hotels' && filteredHotels.length === 0) ||
                (activeTab === 'balance-requests' && filteredBalanceRequests.length === 0)
              ) && (
                <Card className="bg-walnut-dark/50 border-copper-accent/20">
                  <CardContent className="py-8 text-center">
                    <Search className="h-12 w-12 text-cream-light/40 mx-auto mb-4" />
                    <h3 className="text-vintage-lg font-cormorant text-cream-light mb-2">
                      No results found
                    </h3>
                    <p className="text-vintage-base text-cream-light/60 font-cormorant">
                      Try adjusting your search terms or clear the search to see all {activeTab === 'balance-requests' ? 'balance requests' : activeTab}.
                    </p>
                    <button
                      onClick={clearSearch}
                      className="mt-4 px-4 py-2 bg-copper-accent/20 text-copper-accent border border-copper-accent/30 rounded-lg hover:bg-copper-accent/30 transition-colors font-cormorant text-vintage-sm"
                    >
                      Clear Search
                    </button>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 'users' && isAdmin && (
                <UsersTab 
                  users={filteredUsers} 
                  accessToken={accessToken || ''}
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'hotels' && (
                <HotelsTab 
                  hotels={filteredHotels}
                  accessToken={accessToken || ''}
                  isAdmin={isAdmin || false}
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'balance-requests' && isAdmin && (
                <BalanceRequestsTab
                  requests={filteredBalanceRequests}
                  accessToken={accessToken || ''}
                  onRefresh={refreshData}
                  onUpdateRequest={handleUpdateBalanceRequest}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
