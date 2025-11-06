"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, MapPin, CreditCard, Clock, CheckCircle, XCircle, X, Eye, EyeOff, Edit3, Save, X as XIcon, ChevronLeft, ChevronRight, Bell, ArrowUpDown, DollarSign, Receipt, Wallet, RefreshCw } from "lucide-react"
import { authApi } from "@/lib/api"
import { bookingsApi } from "@/lib/api/dashboard"
import { balanceApi } from "@/lib/api/balance"
import Header from "@/components/header"
import type { User as ApiUser } from "@/lib/api"
import type { Booking as DashboardBooking } from "@/types/dashboard"
import type { Transaction } from "@/lib/api/balance"
import { access } from "fs"
import { gu } from "date-fns/locale"
import { useNotifications } from "@/components/notifications/notification-provider"
import { NotificationList } from "@/components/notifications/notification-list"
import { useBalanceWebSocket } from "@/lib/hooks/use-balance-websocket"
import axiosInstance from "@/lib/axios"

// Use User type directly from API
type UserProfile = ApiUser

// Use Booking type from dashboard
type Booking = DashboardBooking

type SortOption = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'status'
type TabType = 'bookings' | 'transactions'

export default function ProfilePage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const hasFetchedData = useRef(false) // Track if we've already fetched data
  
  // WebSocket for real-time balance
  const { currentBalance, isConnected, refreshBalance } = useBalanceWebSocket()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('bookings')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  
  // Notification state
  const { state: notificationState } = useNotifications()

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!accessToken) return

      // Prevent refetching on token refresh
      if (hasFetchedData.current) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch user profile
        const profileData = await authApi.getProfile()
        setProfile(profileData)

        // Fetch user bookings
        const bookingsData = await bookingsApi.getByUser()
        setBookings(bookingsData)

        // Fetch user transactions (replaces topup requests)
        const transactionsData = await balanceApi.getMyTransactions()
        setTransactions(transactionsData)

        // Mark as fetched
        hasFetchedData.current = true
      } catch (err) {
        console.error('Error fetching profile data:', err)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    if (accessToken) {
      fetchProfileData()
    }
  }, [accessToken])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }


  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-900/60 text-green-300 border-green-400/70'
      case 'Paid':
        return 'bg-green-900/60 text-green-300 border-green-400/70'
      case 'Pending':
        return 'bg-yellow-900/60 text-yellow-300 border-yellow-400/70'
      case 'Cancelled':
        return 'bg-red-900/60 text-red-300 border-red-400/70'
      case 'Completed':
        return 'bg-blue-900/60 text-blue-300 border-blue-400/70'
      case 'CheckedIn':
        return 'bg-purple-900/60 text-purple-300 border-purple-400/70'
      case 'CheckedOut':
        return 'bg-gray-900/60 text-gray-300 border-gray-400/70'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-400/70'
    }
  }

  const getTransactionStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-900/60 text-yellow-300 border-yellow-400/70'
      case 'success':
        return 'bg-green-900/60 text-green-300 border-green-400/70'
      case 'failed':
        return 'bg-red-900/60 text-red-300 border-red-400/70'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-400/70'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'topup':
        return 'text-green-600'
      case 'booking_payment':
        return 'text-red-600'
      case 'refund':
        return 'text-green-600'
      case 'cancellation_refund':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }


  // Sort bookings
  const sortedBookings = [...bookings].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'price-desc':
        return parseFloat(b.total_price.toString()) - parseFloat(a.total_price.toString())
      case 'price-asc':
        return parseFloat(a.total_price.toString()) - parseFloat(b.total_price.toString())
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'price-desc':
        return Math.abs(parseFloat(b.amount.toString())) - Math.abs(parseFloat(a.amount.toString()))
      case 'price-asc':
        return Math.abs(parseFloat(a.amount.toString())) - Math.abs(parseFloat(b.amount.toString()))
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  // Get current items based on active tab
  const currentItems = activeTab === 'bookings' ? sortedBookings : sortedTransactions
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const paginatedItems = currentItems.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(currentItems.length / itemsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1) // Reset to first page when changing tabs
    setSortBy('date-desc') // Reset sort when changing tabs
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount)
  }

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowBookingDetails(true)
  }

  const closeBookingDetails = () => {
    setShowBookingDetails(false)
    setSelectedBooking(null)
  }

  const startEditingProfile = () => {
    if (profile) {
      setEditForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number || ''
      })
      setIsEditingProfile(true)
    }
  }

  const cancelEditingProfile = () => {
    setIsEditingProfile(false)
    setEditForm({
      first_name: '',
      last_name: '',
      phone_number: ''
    })
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveProfileChanges = async () => {
    if (!accessToken || !profile) return

    try {
      setEditLoading(true)
      setError(null)

      // Update profile via API
      const updatedProfile = await authApi.updateProfile({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone_number: editForm.phone_number
      })

      setProfile(updatedProfile)
      setIsEditingProfile(false)

      // Profile update will automatically refresh the user context
      window.location.reload() // Refresh to update the navbar
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile')
    } finally {
      setEditLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!accessToken) return

    const cancellationReason = prompt('Please provide a reason for cancellation:')
    if (!cancellationReason) {
      return // User cancelled the prompt
    }

    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return
    }

    try {
      setCancellingBookingId(bookingId)
      setError(null)

      // Cancel booking via API - backend will automatically send notifications
      await bookingsApi.cancel(bookingId, cancellationReason)

      // Refresh bookings list
      const bookingsData = await bookingsApi.getByUser()
      setBookings(bookingsData)

      // If the cancelled booking was being viewed in details modal, close it
      if (selectedBooking?.id === bookingId) {
        closeBookingDetails()
      }

      alert('Booking cancelled successfully!')
      console.log('Booking cancelled - backend will send notifications automatically')

    } catch (err: any) {
      console.error('Error cancelling booking:', err)

      // Extract error message from API response
      let errorMessage = 'Failed to cancel booking'

      if (err?.response?.data?.message) {
        // Axios error with response
        errorMessage = err.response.data.message
      } else if (err?.message) {
        // Standard Error object
        errorMessage = err.message
      }

      setError(errorMessage)
      alert(errorMessage)

    } finally {
      setCancellingBookingId(null)
    }
  }


  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-terracotta-rose/30 border-t-terracotta-rose rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-deep-brown font-varela text-vintage-lg">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
              <p className="font-varela text-vintage-lg">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg max-w-md mx-auto">
              <p className="font-varela text-vintage-lg">Please sign in to view your profile</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-bl from-creamy-yellow to-creamy-white">
      <Header />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-vintage-4xl font-libre font-bold text-deep-brown mb-2">
            My Profile
          </h1>
          <p className="text-vintage-lg text-terracotta-rose font-varela">
            Manage your account and view your booking history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Information and Notifications */}
          <div className="lg:col-span-1 space-y-8">
            {/* Profile Information */}
            <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-creamy-white" />
                </div>
                <h2 className="text-vintage-2xl font-libre font-bold text-terracotta-rose mb-1">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-vintage-sm text-terracotta-rose font-varela uppercase tracking-wider">
                  {Array.isArray(profile?.roles) && profile.roles.length > 0
                    ? (profile.roles as any[]).map(role => typeof role === 'string' ? role : role.name).join(", ")
                    : "User"}
                </p>
              </div>

              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="bg-creamy-yellow/80 border border-terracotta-rose/30 rounded-lg p-4">
                    <h4 className="text-vintage-lg font-libre font-semibold text-deep-brown mb-4 flex items-center">
                      <Edit3 className="h-5 w-5 text-terracotta-rose mr-2" />
                      Edit Profile
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-vintage-sm text-deep-brown font-varela mb-2">First Name</label>
                        <input
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                          className="w-full px-3 py-2 bg-creamy-white/80 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 focus:border-terracotta-rose focus:outline-none"
                          placeholder="Enter first name"
                        />
                      </div>

                      <div>
                        <label className="block text-vintage-sm text-deep-brown font-varela mb-2">Last Name</label>
                        <input
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                          className="w-full px-3 py-2 bg-creamy-white/80 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 focus:border-terracotta-rose focus:outline-none"
                          placeholder="Enter last name"
                        />
                      </div>

                      <div>
                        <label className="block text-vintage-sm text-deep-brown font-varela mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={editForm.phone_number}
                          onChange={(e) => handleEditFormChange('phone_number', e.target.value)}
                          className="w-full px-3 py-2 bg-creamy-white/80 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 focus:border-terracotta-rose focus:outline-none"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingProfile}
                        className="text-deep-brown border-terracotta-rose/30 hover:bg-terracotta-rose/10"
                      >
                        <XIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveProfileChanges}
                        disabled={editLoading}
                        className="bg-gradient-to-br from-terracotta-rose/70 to-terracotta-orange/80 text-deep-brown font-varela border-terracotta-rose/30 font-semibold hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      >
                        {editLoading ? (
                          <div className="w-4 h-4 border-2 border-terracotta-rose/30 border-t-terracotta-rose rounded-full animate-spin mr-1" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        {editLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Real-time Balance Display */}
                  <div className="flex items-center justify-between p-4 bg-creamy-yellow/40 border border-terracotta-rose/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-5 w-5 text-creamy-yellow" />
                      <div>
                        <p className="text-vintage-sm text-creamy-yellow font-varela">Current Balance</p>
                        <p className="text-vintage-xl font-libre font-bold text-dark-brown">
                          ${currentBalance !== null ? Number(currentBalance).toFixed(2) : 'Loading...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={refreshBalance}
                        className="p-2 hover:bg-creamy-yellow/10 rounded transition-colors"
                        title="Refresh balance"
                      >
                        <RefreshCw className="h-4 w-4 text-deep-brown" />
                      </button>
                      {isConnected && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-vintage-xs text-green-400">Live</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-creamy-yellow" />
                    <div>
                      <p className="text-vintage-sm text-creamy-yellow font-varela">Email</p>
                      <p className="text-vintage-base text-creamy-yellow">{profile?.email}</p>
                    </div>
                  </div>

                  {profile?.phone_number && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-creamy-yellow" />
                      <div>
                        <p className="text-vintage-sm text-creamy-yellow font-varela">Phone</p>
                        <p className="text-vintage-base text-creamy-yellow">{profile.phone_number}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-creamy-yellow" />
                    <div>
                      <p className="text-vintage-sm text-creamy-yellow font-varela">Member Since</p>
                      <p className="text-vintage-base text-creamy-yellow">
                        {new Date().getFullYear()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-terracotta-rose">
                    <div className="flex items-center justify-between">
                      <span className="text-vintage-lg text-creamy-yellow font-varela">Status</span>
                      <Badge className={profile?.is_active ? "bg-green-900/60 text-green-300 border-green-400/70 font-varela uppercase tracking-wider" : "bg-red-900/60 text-red-300 border-red-400/70 font-varela uppercase tracking-wider"}>
                        {profile?.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Profile Button */}
              {!isEditingProfile && (
                <div className="mt-6">
                  <Button
                    onClick={startEditingProfile}
                    className="w-full bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-varela border-terracotta-rose/30 font-semibold hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-105 py-3"
                  >
                    <Edit3 className="h-5 w-5 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </Card>

            {/* Notifications Section */}
            <Card className="bg-gradient-to-r from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/20 p-6">
              <div className="flex items-center justify-between mb-">
                <h3 className="text-vintage-2xl font-libre font-bold text-creamy-yellow flex items-center gap-2">
                  <Bell className="h-6 w-6 text-creamy-yellow" />
                  Notifications
                </h3>
                {notificationState.unreadCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-400/50 font-libre">
                    {notificationState.unreadCount} Unread
                  </Badge>
                )}
              </div>

              {notificationState.notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-creamy-yellow/50 mx-auto mb-4" />
                  <p className="text-vintage-lg text-creamy-yellow/60 font-libre mb-2">No notifications</p>
                  <p className="text-vintage-sm text-creamy-yellow/40">You're all caught up!</p>
                </div>
              ) : (
                <div className="bg-deep-brown border border-terracotta-rose/40 rounded-lg overflow-hidden">
                  <NotificationList maxHeight="700px" />
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - History Tabs */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="bg-gradient-to-r from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 p-6 pb-13 flex flex-col">
              {/* Tab Navigation */}
              <div className="flex gap-4 mb-2 border-b border-terracotta-rose/50">
                <button
                  onClick={() => handleTabChange('bookings')}
                  className={`flex items-center gap-2 px-6 py-3 font-varela text-vintage-lg font-medium transition-all duration-300 ${
                    activeTab === 'bookings'
                      ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                      : 'text-creamy-yellow/60 hover:text-creamy-yellow'
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                  Booking History
                  {bookings.length > 0 && (
                    <Badge className="bg-terracotta-rose/70 text-dark-brown border-terracotta-rose/30 ml-2">
                      {bookings.length}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('transactions')}
                  className={`flex items-center gap-2 px-6 py-3 font-varela text-vintage-lg font-medium transition-all duration-300 ${
                    activeTab === 'transactions'
                      ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                      : 'text-creamy-yellow/60 hover:text-creamy-yellow'
                  }`}
                >
                  <Receipt className="h-5 w-5" />
                  Transaction History
                  {transactions.length > 0 && (
                    <Badge className="bg-terracotta-rose/70 text-dark-brown border-terracotta-rose/30 ml-2">
                      {transactions.length}
                    </Badge>
                  )}
                </button>
              </div>

              {/* Sort and Filter Controls */}
              {currentItems.length > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-terracotta-rose" />
                    <span className="text-vintage-sm text-creamy-yellow/80 font-varela">Sort by:</span>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="bg-creamy-yellow border border-terracotta-rose/30 rounded-lg px-3 py-2 text-vintage-sm text-deep-brown font-varela focus:outline-none focus:border-terracotta-rose transition-colors"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              )}

              {/* Empty State */}
              {currentItems.length === 0 ? (
                <div className="text-center py-12 flex-grow flex items-center justify-center">
                  <div>
                    {activeTab === 'bookings' ? (
                      <>
                        <CreditCard className="h-16 w-16 text-terracotta-rose/50 mx-auto mb-4" />
                        <p className="text-vintage-lg text-creamy-yellow/60 font-cormorant mb-2">No bookings yet</p>
                        <p className="text-vintage-sm text-creamy-yellow/40">Start exploring our luxury hotels!</p>
                      </>
                    ) : (
                      <>
                        <Receipt className="h-16 w-16 text-terracotta-rose/50 mx-auto mb-4" />
                        <p className="text-vintage-lg text-creamy-yellow/60 font-cormorant mb-2">No transactions yet</p>
                        <p className="text-vintage-sm text-creamy-yellow/40">Your transaction history will appear here!</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4 flex-grow">
                    {/* Booking History Content */}
                    {activeTab === 'bookings' && (paginatedItems as Booking[]).map((booking) => (
                    <div key={booking.id} className="bg-gradient-to-tl from-creamy-yellow to-creamy-white border border-terracotta-rose/60 rounded-lg p-4 hover:bg-creamy-yellow/80 transition-colors duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-vintage-lg font-libre font-semibold text-deep-brown mb-1">
                            {booking.hotel?.name || 'Hotel Information Unavailable'}
                          </h4>
                          <div className="flex items-center text-vintage-sm text-terracotta-rose mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.hotel?.address || 'Address not available'}
                          </div>
                          <p className="text-vintage-sm text-ash-brown">
                            {booking.room?.room_type || 'Room'} - Room {booking.room?.room_number || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right flex flex-col gap-2 mt-2 items-end">
                          <Badge className={`${getStatusBadgeColor(booking.status)} font-varela uppercase tracking-wider`}>
                            {booking.status}
                          </Badge>

                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-vintage-sm">
                        <div>
                          <p className="text-ash-brown/90 font-varela mb-1">Check-in</p>
                          <p className="text-deep-brown">{formatDate(booking.check_in_date)}</p>
                        </div>
                        <div>
                          <p className="text-ash-brown/90 font-varela mb-1">Check-out</p>
                          <p className="text-deep-brown">{formatDate(booking.check_out_date)}</p>
                        </div>
                        <div>
                          <p className="text-ash-brown/90 font-varela mb-1">Total Amount</p>
                          <p className="text-vintage-lg font-semibold text-terracotta-rose">
                            {formatCurrency(booking.paid_amount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-terracotta-rose/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(booking.status)}
                            <span className="text-vintage-sm text-ash-brown/80 font-varela">
                              Booked on {formatDate(booking.created_at)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="px-8 py-4 bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-deep-brown font-varela font-bold rounded-lg shadow-2xl hover:shadow-terracotta-rose/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                              onClick={() => handleViewDetails(booking)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                              <Button
                                size="sm"
                                className="px-8 py-4 text-red-800 border-red-400 bg-gradient-to-br from-red-400 to-red-400/60 font-varela font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancellingBookingId === booking.id}
                              >
                                {cancellingBookingId === booking.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mr-1"></div>
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel Booking
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                    {/* Transaction History Content */}
                    {activeTab === 'transactions' && (paginatedItems as Transaction[]).map((transaction) => (
                      <div key={transaction.id} className="bg-gradient-to-br from-creamy-yellow/90 to-creamy-white border border-terracotta-rose/20 rounded-lg p-4 hover:bg-creamy-yellow/80 transition-colors duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${
                              (transaction.status === 'success') ? (parseFloat(transaction.amount.toString()) >= 0
                                ? 'from-green-500 to-green-600'
                                : 'from-red-500 to-red-600') : 'bg-yellow-500'
                            } rounded-full flex items-center justify-center flex-shrink-0`}>
                              <Receipt className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className={`text-vintage-2xl font-libre font-semibold mb-1 ${(transaction.status === 'pending') ? 'text-yellow-700' : getTransactionTypeColor(transaction.type)}`}>
                                {(parseFloat(transaction.amount.toString()) >= 0 ? '+' : '-')}${Math.abs(parseFloat(transaction.amount.toString())).toFixed(2)}
                              </h4>
                              <p className="text-vintage-base text-ash-brown font-varela">
                                {transaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              <p className="text-vintage-sm text-ash-brown/80 font-varela">
                                {formatDate(transaction.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`${getTransactionStatusBadgeColor(transaction.status)} font-varela uppercase tracking-wider px-3 py-1`}>
                              {transaction.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        {transaction.description && (
                         <div className="mt-2 p-3 bg-terracotta-rose/30 rounded-lg border border-terracotta-rose/20">
                            <p className="text-vintage-sm text-terracotta-rose font-varela font-semibold mb-1">Description:</p>
                            <p className="text-vintage-base text-deep-brown/80 font-varela">
                              {transaction.description}
                            </p>
                          </div>
                        )}
                        {transaction.admin_notes && (
                          <div className="mt-2 p-3 bg-terracotta-rose/30 rounded-lg border border-terracotta-rose/20">
                            <p className="text-vintage-sm text-terracotta-rose font-varela font-semibold mb-1">Admin Notes:</p>
                            <p className="text-vintage-base text-deep-brown/80 font-varela">
                              {transaction.admin_notes}
                            </p>
                          </div>
                        )}
                        {transaction.reference_id && (
                          <div className="mt-2 flex items-center gap-2 text-vintage-xs text-ash-brown/60">
                            <span>Ref: {transaction.reference_id}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                

                {/* Pagination */}
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-terracotta-rose/20">
                      <div className="text-vintage-sm text-ash-brown/80 font-varela">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, currentItems.length)} of {currentItems.length} {activeTab === 'bookings' ? 'bookings' : 'transactions'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="bg-terracotta-rose border border-terracotta-rose/30 text-black hover:bg-terracotta-rose/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={`${
                              currentPage === page
                                ? 'bg-gradient-to-br from-terracotta-rose/70 to-terracotta-orange/80 text-walnut-dark font-bold'
                                : 'bg-terracotta-rose/20 border border-terracotta-rose/20 text-cream-light hover:bg-terracotta-rose/40'
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                        
                        <Button
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="bg-terracotta-rose border border-terracotta-rose/30 text-black hover:bg-terracotta-rose/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-creamy-yellow/85 backdrop-blur-lg border border-terracotta-rose/60 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-vintage-2xl font-libre font-bold text-deep-brown">
                  Booking Details
                </h3>
                <Button
                  size="sm"
                  onClick={closeBookingDetails}
                  className="text-black border-terracotta-rose/30 hover:bg-terracotta-rose/80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Booking Information */}
              <div className="space-y-6">
                {/* Hotel Information */}
                <div className="bg-terracotta-rose/40 border border-terracotta-rose/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-libre font-semibold text-deep-brown mb-3 flex items-center">
                    <MapPin className="h-5 w-5 text-deep-brown mr-2" />
                    Hotel Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-vintage-sm text-dark-brown/60 font-varela ">Hotel Name</p>
                      <p className="text-vintage-base text-dark-brown font-semibold">{selectedBooking.hotel?.name || 'Hotel Information Unavailable'}</p>
                    </div>
                    <div>
                      <p className="text-vintage-sm text-dark-brown/60 font-varela mb-1">Address</p>
                      <p className="text-vintage-base text-dark-brown">{selectedBooking.hotel?.address || 'Address not available'}</p>
                    </div>
                  </div>
                </div>

                {/* Room Information */}
                <div className="bg-terracotta-rose/40 border border-terracotta-rose/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-libre font-semibold text-deep-brown mb-3 flex items-center">
                    <User className="h-5 w-5 text-deep-brown mr-2" />
                    Room Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-vintage-sm text-dark-brown/60 font-varela mb-1">Room Type</p>
                      <p className="text-vintage-base text-dark-brown font-semibold">{selectedBooking.room?.room_type || 'Room type not available'}</p>
                    </div>
                    <div>
                      <p className="text-vintage-sm text-dark-brown/60 font-varela mb-1">Room Number</p>
                      <p className="text-vintage-base text-dark-brown font-semibold">{selectedBooking.room?.room_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Dates */}
                <div className="bg-terracotta-rose/40 border border-terracotta-rose/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-libre font-semibold text-deep-brown mb-3 flex items-center">
                    <Calendar className="h-5 w-5 text-deep-brown mr-2" />
                    Booking Dates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-vintage-sm text-dark-brown/60 font-varela mb-1">Check-in Date</p>
                      <p className="text-vintage-base text-dark-brown font-semibold">{formatDate(selectedBooking.check_in_date)}</p>
                    </div>
                    <div>
                      <p className="text-vintage-sm text-dark-brown/60 font-varela mb-1">Check-out Date</p>
                      <p className="text-vintage-base text-dark-brown font-semibold">{formatDate(selectedBooking.check_out_date)}</p>
                    </div>
                    <div>
                      <p className="text-vintage-sm text-dark-brown/60 font-varela mb-1">Booking Date</p>
                      <p className="text-vintage-base text-dark-brown font-semibold">{formatDate(selectedBooking.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-terracotta-rose/40 border border-terracotta-rose/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-libre font-semibold text-deep-brown mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 text-deep-brown mr-2" />
                    Payment Information
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-vintage-sm text-dark-brown/60 font-varela mb-1">Total Amount</p>
                      <p className="text-vintage-2xl font-bold text-dark-brown">{formatCurrency(selectedBooking.paid_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-vintage-sm text-dark-brown/60 font-varela mb-1">Status</p>
                      <Badge className={`${getStatusBadgeColor(selectedBooking.status)} font-varela uppercase tracking-wider`}>
                        {selectedBooking.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Booking ID */}
                <div className="bg-terracotta-rose/40 border border-terracotta-rose/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-libre font-semibold text-deep-brown mb-3">Booking Reference</h4>
                  <p className="text-vintage-base text-deep-brown font-mono bg-walnut-dark/50 px-3 py-2 rounded border border-dark-brown/90">
                    {selectedBooking.id}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-brown/20">
                {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Confirmed') && (
                  <Button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={cancellingBookingId === selectedBooking.id}
                    className="px-8 py-4 text-red-800 border-red-400 bg-gradient-to-br from-red-400 to-red-400/60 font-varela font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    {cancellingBookingId === selectedBooking.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mr-2"></div>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={closeBookingDetails}
                  className="bg-gradient-to-br from-terracotta-rose/70 to-terracotta-orange/80 text-walnut-dark font-playfair border-copper-accent/30 font-semibold hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
