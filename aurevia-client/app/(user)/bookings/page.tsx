"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { bookingsApi } from "@/lib/api/dashboard"
import Header from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  X,
  Eye,
  Users,
  Building2
} from "lucide-react"
import type { Booking } from "@/types/dashboard"

export default function BookingsPage() {
  const router = useRouter()
  const { user, accessToken, isLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const isHotelOwner = user?.roles?.includes('HotelOwner')
  const isAdmin = user?.roles?.includes('Admin')

  // Redirect non-hotel owners
  useEffect(() => {
    if (!isLoading && user && !isHotelOwner && !isAdmin) {
      router.push('/profile') // Redirect customers to their profile page
    }
  }, [isLoading, user, isHotelOwner, isAdmin, router])

  useEffect(() => {
    const fetchBookings = async () => {
      if (!accessToken || (!isHotelOwner && !isAdmin)) return

      try {
        setLoading(true)
        setError(null)
        
        // Fetch all bookings for hotel owner's hotels
        const bookingsData = await bookingsApi.getByHotelOwner()
        setBookings(bookingsData)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        setError('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    if (accessToken && (isHotelOwner || isAdmin)) {
      fetchBookings()
    }
  }, [accessToken, isHotelOwner, isAdmin])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const filteredBookings = bookings.filter(booking => {
    // Filter by status
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false
    }

    // Filter by search query
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      booking.hotel?.name.toLowerCase().includes(query) ||
      booking.hotel?.address.toLowerCase().includes(query) ||
      booking.guest_name?.toLowerCase().includes(query) ||
      booking.guest_email?.toLowerCase().includes(query) ||
      booking.guest_phone?.toLowerCase().includes(query) ||
      booking.id.toLowerCase().includes(query)
    )
  })

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Confirmed', label: 'Confirmed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Completed', label: 'Completed' },
    { value: 'CheckedIn', label: 'Checked In' },
    { value: 'CheckedOut', label: 'Checked Out' },
  ]

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-copper-accent/30 border-t-copper-accent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-cream-light font-cormorant text-vintage-lg">Loading bookings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied for non-hotel owners
  if (!isHotelOwner && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-12 text-center max-w-md">
              <XCircle className="h-16 w-16 text-red-400/50 mx-auto mb-4" />
              <h2 className="text-vintage-2xl font-playfair font-bold text-cream-light mb-2">
                Access Denied
              </h2>
              <p className="text-vintage-base text-cream-light/60 font-cormorant mb-6">
                This page is only accessible to hotel owners. Please contact support if you believe this is an error.
              </p>
              <Button
                onClick={() => router.push('/profile')}
                className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel"
              >
                Go to Profile
              </Button>
            </Card>
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
            Manage Bookings
          </h1>
          <p className="text-vintage-lg text-copper-accent font-cormorant">
            View and manage all bookings for your hotels
          </p>
        </div>

        {/* Filters */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-cream-light/60" />
              </div>
              <input
                type="text"
                placeholder="Search by hotel, guest, email, or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-walnut-dark/50 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/60 focus:outline-none focus:ring-2 focus:ring-copper-accent/50 focus:border-copper-accent/50 font-cormorant text-vintage-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-cream-light/60 hover:text-cream-light transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 bg-walnut-dark/50 border border-copper-accent/30 rounded-lg text-cream-light focus:outline-none focus:ring-2 focus:ring-copper-accent/50 focus:border-copper-accent/50 font-cormorant text-vintage-base"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className="mt-3 text-vintage-sm text-cream-light/70 font-cormorant">
              Found {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-6xl mx-auto mb-6">
            <Card className="bg-red-900/20 border-red-500/50 p-4">
              <div className="flex items-center gap-3 text-red-300">
                <XCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Bookings List */}
        <div className="max-w-6xl mx-auto">
          {filteredBookings.length === 0 ? (
            <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-12 text-center">
              <Calendar className="h-16 w-16 text-copper-accent/50 mx-auto mb-4" />
              <p className="text-vintage-lg text-cream-light/60 font-cormorant mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No bookings found' : 'No bookings yet'}
              </p>
              <p className="text-vintage-sm text-cream-light/40">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Customer bookings will appear here'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6 hover:bg-walnut-dark/70 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left section - Hotel & Guest info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-1 flex items-center">
                            <Building2 className="h-5 w-5 text-copper-accent mr-2" />
                            {booking.hotel?.name || 'Hotel Information Unavailable'}
                          </h3>
                          <div className="flex items-center text-vintage-sm text-copper-accent mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.hotel?.address || 'Address not available'}
                          </div>
                        </div>
                        <Badge className={`${getStatusBadgeColor(booking.status)} font-cinzel uppercase tracking-wider`}>
                          {booking.status}
                        </Badge>
                      </div>

                      {/* Guest info */}
                      {booking.guest_name && (
                        <div className="flex items-center text-vintage-sm text-cream-light/80 mb-2">
                          <Users className="h-4 w-4 text-copper-accent mr-2" />
                          <span className="font-semibold mr-2">Guest:</span>
                          {booking.guest_name}
                          {booking.guest_email && <span className="ml-2 text-cream-light/60">({booking.guest_email})</span>}
                        </div>
                      )}

                      {/* Room info */}
                      <p className="text-vintage-sm text-cream-light/80">
                        {booking.room?.room_type || 'Room'} - Room {booking.room?.room_number || 'N/A'}
                        {' • '}{booking.number_of_guests} guest{booking.number_of_guests !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Right section - Dates & Price */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4 text-vintage-sm">
                        <div>
                          <p className="text-cream-light/60 font-cormorant mb-1">Check-in</p>
                          <p className="text-cream-light font-semibold">{formatDate(booking.check_in_date)}</p>
                        </div>
                        <div>
                          <p className="text-cream-light/60 font-cormorant mb-1">Check-out</p>
                          <p className="text-cream-light font-semibold">{formatDate(booking.check_out_date)}</p>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-cream-light/60 font-cormorant text-vintage-sm mb-1">Total Amount</p>
                          <p className="text-vintage-xl font-bold text-copper-accent">
                            {formatCurrency(booking.total_price)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel hover:shadow-copper-accent/40"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/bookings/${booking.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom section - Status info */}
                  <div className="mt-4 pt-4 border-t border-copper-accent/10 flex items-center justify-between text-vintage-sm">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(booking.status)}
                      <span className="text-cream-light/60">
                        Booked on {formatDate(booking.created_at)}
                      </span>
                    </div>
                    {booking.confirmed_at && (
                      <span className="text-green-400/80">
                        Confirmed on {formatDate(booking.confirmed_at)}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
