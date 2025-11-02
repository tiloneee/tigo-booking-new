"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, MapPin, CreditCard, Clock, CheckCircle, XCircle, X, Eye, EyeOff, Edit3, Save, X as XIcon, ChevronLeft, ChevronRight, Bell, ArrowUpDown, DollarSign, Receipt } from "lucide-react"
import { authApi } from "@/lib/api"
import { bookingsApi } from "@/lib/api/dashboard"
import Header from "@/components/header"
import type { User as ApiUser } from "@/lib/api"
import type { Booking as DashboardBooking } from "@/types/dashboard"
import { access } from "fs"
import { gu } from "date-fns/locale"
import { useNotifications } from "@/components/notifications/notification-provider"
import { NotificationList } from "@/components/notifications/notification-list"
import axiosInstance from "@/lib/axios"

// Use User type directly from API
type UserProfile = ApiUser

// Use Booking type from dashboard
type Booking = DashboardBooking

// Topup request type
interface TopupRequest {
  id: string
  user_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  created_at: string
  updated_at: string
}

type SortOption = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'status'
type TabType = 'bookings' | 'topups'

export default function ProfilePage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([])
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
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('bookings')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(4)
  
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

        // Fetch user topup requests
        const topupsData = await axiosInstance.get<TopupRequest[]>('/balance/topup/my-requests')
        setTopupRequests(topupsData.data)

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

  const getTopupStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-900/60 text-yellow-300 border-yellow-400/70'
      case 'approved':
        return 'bg-green-900/60 text-green-300 border-green-400/70'
      case 'rejected':
        return 'bg-red-900/60 text-red-300 border-red-400/70'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-400/70'
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

  // Sort topup requests
  const sortedTopups = [...topupRequests].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'price-desc':
        return parseFloat(b.amount.toString()) - parseFloat(a.amount.toString())
      case 'price-asc':
        return parseFloat(a.amount.toString()) - parseFloat(b.amount.toString())
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  // Get current items based on active tab
  const currentItems = activeTab === 'bookings' ? sortedBookings : sortedTopups
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
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-copper-accent/30 border-t-copper-accent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-cream-light font-cormorant text-vintage-lg">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
              <p className="font-cormorant text-vintage-lg">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg max-w-md mx-auto">
              <p className="font-cormorant text-vintage-lg">Please sign in to view your profile</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
      <Header />

      {/* Warm lighting effects */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-copper-accent/4 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-copper-light/3 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-vintage-4xl font-playfair font-bold text-cream-light mb-2">
            My Profile
          </h1>
          <p className="text-vintage-lg text-copper-accent font-cormorant">
            Manage your account and view your booking history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Information and Notifications */}
          <div className="lg:col-span-1 space-y-8">
            {/* Profile Information */}
            <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-walnut-dark" />
                </div>
                <h2 className="text-vintage-2xl font-playfair font-bold text-cream-light mb-1">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-vintage-sm text-copper-accent font-cinzel uppercase tracking-wider">
                  {Array.isArray(profile?.roles) && profile.roles.length > 0
                    ? (profile.roles as any[]).map(role => typeof role === 'string' ? role : role.name).join(", ")
                    : "User"}
                </p>
              </div>

              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="bg-walnut-light/20 border border-copper-accent/20 rounded-lg p-4">
                    <h4 className="text-vintage-lg font-playfair font-semibold text-cream-light mb-4 flex items-center">
                      <Edit3 className="h-5 w-5 text-copper-accent mr-2" />
                      Edit Profile
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-vintage-sm text-cream-light font-cormorant mb-2">First Name</label>
                        <input
                          type="text"
                          value={editForm.first_name}
                          onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                          className="w-full px-3 py-2 bg-walnut-dark/50 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 focus:border-copper-accent focus:outline-none"
                          placeholder="Enter first name"
                        />
                      </div>

                      <div>
                        <label className="block text-vintage-sm text-cream-light font-cormorant mb-2">Last Name</label>
                        <input
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                          className="w-full px-3 py-2 bg-walnut-dark/50 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 focus:border-copper-accent focus:outline-none"
                          placeholder="Enter last name"
                        />
                      </div>

                      <div>
                        <label className="block text-vintage-sm text-cream-light font-cormorant mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={editForm.phone_number}
                          onChange={(e) => handleEditFormChange('phone_number', e.target.value)}
                          className="w-full px-3 py-2 bg-walnut-dark/50 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 focus:border-copper-accent focus:outline-none"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingProfile}
                        className="text-cream-light border-cream-light/30 hover:bg-cream-light/10"
                      >
                        <XIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveProfileChanges}
                        disabled={editLoading}
                        className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-playfair border-copper-accent/30 font-semibold hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      >
                        {editLoading ? (
                          <div className="w-4 h-4 border-2 border-walnut-dark/30 border-t-walnut-dark rounded-full animate-spin mr-1" />
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
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-copper-accent" />
                    <div>
                      <p className="text-vintage-sm text-cream-light font-cormorant">Balance</p>
                      <p className="text-vintage-base text-cream-light/80">{profile?.balance ? Number(profile.balance).toFixed(2) : '0.00'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-copper-accent" />
                    <div>
                      <p className="text-vintage-sm text-cream-light font-cormorant">Email</p>
                      <p className="text-vintage-base text-cream-light/80">{profile?.email}</p>
                    </div>
                  </div>

                  {profile?.phone_number && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-copper-accent" />
                      <div>
                        <p className="text-vintage-sm text-cream-light font-cormorant">Phone</p>
                        <p className="text-vintage-base text-cream-light/80">{profile.phone_number}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-copper-accent" />
                    <div>
                      <p className="text-vintage-sm text-cream-light font-cormorant">Member Since</p>
                      <p className="text-vintage-base text-cream-light/80">
                        {new Date().getFullYear()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-copper-accent/20">
                    <div className="flex items-center justify-between">
                      <span className="text-vintage-lg text-cream-light font-cormorant">Status</span>
                      <Badge className={profile?.is_active ? "bg-green-900/60 text-green-300 border-green-400/70 font-cinzel uppercase tracking-wider" : "bg-red-900/60 text-red-300 border-red-400/70 font-cinzel uppercase tracking-wider"}>
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
                    className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-playfair border-copper-accent/30 font-semibold hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 py-3"
                  >
                    <Edit3 className="h-5 w-5 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </Card>

            {/* Notifications Section */}
            <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
              <div className="flex items-center justify-between mb-">
                <h3 className="text-vintage-2xl font-playfair font-bold text-cream-light flex items-center gap-2">
                  <Bell className="h-6 w-6 text-copper-accent" />
                  Notifications
                </h3>
                {notificationState.unreadCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-400/50 font-cinzel">
                    {notificationState.unreadCount} Unread
                  </Badge>
                )}
              </div>

              {notificationState.notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-copper-accent/50 mx-auto mb-4" />
                  <p className="text-vintage-lg text-cream-light/60 font-cormorant mb-2">No notifications</p>
                  <p className="text-vintage-sm text-cream-light/40">You're all caught up!</p>
                </div>
              ) : (
                <div className="bg-walnut-light/20 border border-copper-accent/10 rounded-lg overflow-hidden">
                  <NotificationList maxHeight="700px" />
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - History Tabs */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6 pb-13 flex flex-col">
              {/* Tab Navigation */}
              <div className="flex gap-4 mb-6 border-b border-copper-accent/30">
                <button
                  onClick={() => handleTabChange('bookings')}
                  className={`flex items-center gap-2 px-6 py-3 font-cormorant text-vintage-lg font-medium transition-all duration-300 ${
                    activeTab === 'bookings'
                      ? 'text-copper-accent border-b-2 border-copper-accent'
                      : 'text-cream-light/60 hover:text-cream-light'
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                  Booking History
                  {bookings.length > 0 && (
                    <Badge className="bg-copper-accent/20 text-copper-accent border-copper-accent/30 ml-2">
                      {bookings.length}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('topups')}
                  className={`flex items-center gap-2 px-6 py-3 font-cormorant text-vintage-lg font-medium transition-all duration-300 ${
                    activeTab === 'topups'
                      ? 'text-copper-accent border-b-2 border-copper-accent'
                      : 'text-cream-light/60 hover:text-cream-light'
                  }`}
                >
                  <Receipt className="h-5 w-5" />
                  Topup History
                  {topupRequests.length > 0 && (
                    <Badge className="bg-copper-accent/20 text-copper-accent border-copper-accent/30 ml-2">
                      {topupRequests.length}
                    </Badge>
                  )}
                </button>
              </div>

              {/* Sort and Filter Controls */}
              {currentItems.length > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-copper-accent" />
                    <span className="text-vintage-sm text-cream-light/80 font-cormorant">Sort by:</span>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="bg-walnut-medium/50 border border-copper-accent/30 rounded-lg px-3 py-2 text-vintage-sm text-cream-light font-cormorant focus:outline-none focus:border-copper-accent transition-colors"
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
                        <CreditCard className="h-16 w-16 text-copper-accent/50 mx-auto mb-4" />
                        <p className="text-vintage-lg text-cream-light/60 font-cormorant mb-2">No bookings yet</p>
                        <p className="text-vintage-sm text-cream-light/40">Start exploring our luxury hotels!</p>
                      </>
                    ) : (
                      <>
                        <Receipt className="h-16 w-16 text-copper-accent/50 mx-auto mb-4" />
                        <p className="text-vintage-lg text-cream-light/60 font-cormorant mb-2">No topup requests yet</p>
                        <p className="text-vintage-sm text-cream-light/40">Request a balance topup to get started!</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4 flex-grow">
                    {/* Booking History Content */}
                    {activeTab === 'bookings' && (paginatedItems as Booking[]).map((booking) => (
                    <div key={booking.id} className="bg-walnut-light/30 border border-copper-accent/10 rounded-lg p-4 hover:bg-walnut-light/40 transition-colors duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-vintage-lg font-playfair font-semibold text-cream-light mb-1">
                            {booking.hotel?.name || 'Hotel Information Unavailable'}
                          </h4>
                          <div className="flex items-center text-vintage-sm text-copper-accent mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.hotel?.address || 'Address not available'}
                          </div>
                          <p className="text-vintage-sm text-cream-light/80">
                            {booking.room?.room_type || 'Room'} - Room {booking.room?.room_number || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right flex flex-col gap-2 mt-2 items-end">
                          <Badge className={`${getStatusBadgeColor(booking.status)} font-cinzel uppercase tracking-wider`}>
                            {booking.status}
                          </Badge>

                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-vintage-sm">
                        <div>
                          <p className="text-cream-light/60 font-cormorant mb-1">Check-in</p>
                          <p className="text-cream-light">{formatDate(booking.check_in_date)}</p>
                        </div>
                        <div>
                          <p className="text-cream-light/60 font-cormorant mb-1">Check-out</p>
                          <p className="text-cream-light">{formatDate(booking.check_out_date)}</p>
                        </div>
                        <div>
                          <p className="text-cream-light/60 font-cormorant mb-1">Total Amount</p>
                          <p className="text-vintage-lg font-semibold text-copper-accent">
                            {formatCurrency(booking.total_price)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-copper-accent/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(booking.status)}
                            <span className="text-vintage-sm text-cream-light/60">
                              Booked on {formatDate(booking.created_at)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="px-8 py-4 bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                              onClick={() => handleViewDetails(booking)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                              <Button
                                size="sm"
                                className="px-8 py-4 text-red-400 border-red-400 bg-gradient-to-r from-red-400/10 to-red-400/30 font-cinzel font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
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

                    {/* Topup History Content */}
                    {activeTab === 'topups' && (paginatedItems as TopupRequest[]).map((topup) => (
                      <div key={topup.id} className="bg-walnut-light/30 border border-copper-accent/10 rounded-lg p-4 hover:bg-walnut-light/40 transition-colors duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center flex-shrink-0">
                              <DollarSign className="h-6 w-6 text-walnut-dark" />
                            </div>
                            <div>
                              <h4 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-1">
                                ${Number(topup.amount).toFixed(2)}
                              </h4>
                              <p className="text-vintage-sm text-cream-light/60 font-cormorant">
                                Requested on {formatDate(topup.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getTopupStatusBadgeColor(topup.status)} font-cinzel uppercase tracking-wider`}>
                            {topup.status}
                          </Badge>
                        </div>

                        {topup.admin_notes && (
                          <div className="mt-3 p-3 bg-walnut-darkest/50 border border-copper-accent/20 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Receipt className="h-4 w-4 text-copper-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-vintage-xs text-copper-accent font-cinzel uppercase tracking-wider mb-1">
                                  Admin Notes
                                </div>
                                <p className="text-vintage-sm text-cream-light/80 font-cormorant">
                                  {topup.admin_notes}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-copper-accent/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {topup.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                              {topup.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {topup.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                              <span className="text-vintage-sm text-cream-light/60">
                                {topup.status === 'pending' && 'Awaiting admin approval'}
                                {topup.status === 'approved' && `Approved - Balance updated on ${formatDate(topup.updated_at)}`}
                                {topup.status === 'rejected' && `Rejected on ${formatDate(topup.updated_at)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-copper-accent/20">
                      <div className="text-vintage-sm text-cream-light/60 font-cormorant">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, currentItems.length)} of {currentItems.length} {activeTab === 'bookings' ? 'bookings' : 'topup requests'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="bg-walnut-medium/50 border border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                ? 'bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-bold'
                                : 'bg-walnut-medium/50 border border-copper-accent/30 text-cream-light hover:bg-copper-accent/20'
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                        
                        <Button
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="bg-walnut-medium/50 border border-copper-accent/30 text-cream-light hover:bg-copper-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-walnut-dark/95 backdrop-blur-sm border border-copper-accent/20 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-vintage-2xl font-playfair font-bold text-cream-light">
                  Booking Details
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={closeBookingDetails}
                  className="text-copper-accent border-copper-accent/30 hover:bg-copper-accent/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Booking Information */}
              <div className="space-y-6">
                {/* Hotel Information */}
                <div className="bg-walnut-light/20 border border-copper-accent/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-playfair font-semibold text-cream-light mb-3 flex items-center">
                    <MapPin className="h-5 w-5 text-copper-accent mr-2" />
                    Hotel Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Hotel Name</p>
                      <p className="text-vintage-base text-cream-light font-semibold">{selectedBooking.hotel?.name || 'Hotel Information Unavailable'}</p>
                    </div>
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Address</p>
                      <p className="text-vintage-base text-cream-light">{selectedBooking.hotel?.address || 'Address not available'}</p>
                    </div>
                  </div>
                </div>

                {/* Room Information */}
                <div className="bg-walnut-light/20 border border-copper-accent/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-playfair font-semibold text-cream-light mb-3 flex items-center">
                    <User className="h-5 w-5 text-copper-accent mr-2" />
                    Room Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Room Type</p>
                      <p className="text-vintage-base text-cream-light font-semibold">{selectedBooking.room?.room_type || 'Room type not available'}</p>
                    </div>
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Room Number</p>
                      <p className="text-vintage-base text-cream-light">{selectedBooking.room?.room_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Dates */}
                <div className="bg-walnut-light/20 border border-copper-accent/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-playfair font-semibold text-cream-light mb-3 flex items-center">
                    <Calendar className="h-5 w-5 text-copper-accent mr-2" />
                    Booking Dates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Check-in Date</p>
                      <p className="text-vintage-base text-cream-light font-semibold">{formatDate(selectedBooking.check_in_date)}</p>
                    </div>
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Check-out Date</p>
                      <p className="text-vintage-base text-cream-light font-semibold">{formatDate(selectedBooking.check_out_date)}</p>
                    </div>
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Booking Date</p>
                      <p className="text-vintage-base text-cream-light">{formatDate(selectedBooking.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-walnut-light/20 border border-copper-accent/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-playfair font-semibold text-cream-light mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 text-copper-accent mr-2" />
                    Payment Information
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Total Amount</p>
                      <p className="text-vintage-2xl font-bold text-copper-accent">{formatCurrency(selectedBooking.total_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Status</p>
                      <Badge className={`${getStatusBadgeColor(selectedBooking.status)} font-cinzel uppercase tracking-wider`}>
                        {selectedBooking.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Booking ID */}
                <div className="bg-walnut-light/20 border border-copper-accent/10 rounded-lg p-4">
                  <h4 className="text-vintage-lg font-playfair font-semibold text-cream-light mb-3">Booking Reference</h4>
                  <p className="text-vintage-base text-cream-light font-mono bg-walnut-dark/50 px-3 py-2 rounded border border-copper-accent/20">
                    {selectedBooking.id}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-copper-accent/20">
                {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Confirmed') && (
                  <Button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={cancellingBookingId === selectedBooking.id}
                    className="px-8 py-4 text-red-400 border-red-400 bg-gradient-to-r from-red-400/10 to-red-400/30 font-cinzel font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
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
                  className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-playfair border-copper-accent/30 font-semibold hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105"
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
