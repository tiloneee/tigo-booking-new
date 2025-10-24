"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { bookingsApi } from "@/lib/api/dashboard"
import Header from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Building2,
  Users,
  Home
} from "lucide-react"
import type { Booking } from "@/types/dashboard"

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading } = useAuth()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const isHotelOwner = user?.roles?.includes('HotelOwner')
  const isAdmin = user?.roles?.includes('Admin')
  const canManageBooking = isHotelOwner || isAdmin

  useEffect(() => {
    const fetchBooking = async () => {
      if (!accessToken || !bookingId) return

      try {
        setLoading(true)
        setError(null)
        const bookingData = await bookingsApi.getOne(bookingId)
        setBooking(bookingData)
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    if (accessToken && bookingId) {
      fetchBooking()
    }
  }, [accessToken, bookingId])

  const handleConfirmBooking = async () => {
    if (!booking || !canManageBooking) return

    const notes = prompt('Add confirmation notes (optional):')
    
    if (!confirm('Are you sure you want to confirm this booking?')) {
      return
    }

    try {
      setActionLoading(true)
      await bookingsApi.updateStatus(booking.id, 'Confirmed', notes || 'Booking confirmed')
      
      // Refresh booking data
      const updatedBooking = await bookingsApi.getOne(bookingId)
      setBooking(updatedBooking)
      
      alert('Booking confirmed successfully!')
    } catch (err: any) {
      console.error('Error confirming booking:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to confirm booking'
      alert(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!booking || !canManageBooking) return

    const reason = prompt('Please provide a reason for cancellation:')
    if (!reason) return

    if (!confirm(`Are you sure you want to cancel this booking?\nReason: ${reason}`)) {
      return
    }

    try {
      setActionLoading(true)
      await bookingsApi.updateStatus(booking.id, 'Cancelled', reason)
      
      // Refresh booking data
      const updatedBooking = await bookingsApi.getOne(bookingId)
      setBooking(updatedBooking)
      
      alert('Booking cancelled successfully!')
    } catch (err: any) {
      console.error('Error cancelling booking:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to cancel booking'
      alert(errorMessage)
    } finally {
      setActionLoading(false)
    }
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
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
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
              <p className="text-cream-light font-cormorant text-vintage-lg">Loading booking details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-light">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => router.back()}
              className="px-8 py-4 bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Card className="bg-red-100 border border-red-400 text-red-700 px-4 py-8 text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="font-cormorant text-vintage-lg">{error || 'Booking not found'}</p>
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
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => router.back()}
            className="px-8 py-4 bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-vintage-4xl font-playfair font-bold text-cream-light mb-2">
              Booking Details
            </h1>
            <p className="text-vintage-lg text-copper-accent font-cormorant">
              Booking Reference: {booking.id}
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-3">
              {getStatusIcon(booking.status)}
              <Badge className={`${getStatusBadgeColor(booking.status)} font-cinzel uppercase tracking-wider px-4 py-2`}>
                {booking.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hotel Information */}
              <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
                <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-4 flex items-center">
                  <Building2 className="h-5 w-5 text-copper-accent mr-2" />
                  Hotel Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-playfair mb-1">Hotel Name</p>
                    <p className="text-vintage-lg font-playfair text-cream-light font-semibold">{booking.hotel?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Address</p>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-copper-accent mt-1" />
                      <p className="text-vintage-base font-playfair text-cream-light">{booking.hotel?.address || 'N/A'}</p>
                    </div>
                  </div>
                  {booking.hotel?.phone_number && (
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Hotel Contact</p>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-copper-accent" />
                        <p className="text-vintage-base font-playfair text-cream-light">{booking.hotel.phone_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Room Information */}
              <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
                <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-4 flex items-center">
                  <Home className="h-5 w-5 text-copper-accent mr-2" />
                  Room Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Room Type</p>
                    <p className="text-vintage-base font-playfair text-cream-light font-semibold">{booking.room?.room_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Room Number</p>
                    <p className="text-vintage-base font-playfair text-cream-light">{booking.room?.room_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Units Requested</p>
                    <p className="text-vintage-base font-playfair text-cream-light">{booking.units_requested}</p>
                  </div>
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Number of Guests</p>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-copper-accent" />
                      <p className="text-vintage-base font-playfair text-cream-light">{booking.number_of_guests}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Guest Information */}
              <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
                <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-4 flex items-center">
                  <User className="h-5 w-5 text-copper-accent mr-2" />
                  Guest Information
                </h3>
                <div className="space-y-3">
                  {booking.guest_name && (
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Guest Name</p>
                      <p className="text-vintage-base  text-cream-light">{booking.guest_name}</p>
                    </div>
                  )}
                  {booking.guest_email && (
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Email</p>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-copper-accent" />
                        <p className="text-vintage-base text-cream-light">{booking.guest_email}</p>
                      </div>
                    </div>
                  )}
                  {booking.guest_phone && (
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Phone Number</p>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-copper-accent" />
                        <p className="text-vintage-base text-cream-light">{booking.guest_phone}</p>
                      </div>
                    </div>
                  )}
                  {booking.special_requests && (
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Special Requests</p>
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="h-4 w-4 text-copper-accent mt-1" />
                        <p className="text-vintage-base text-cream-light">{booking.special_requests}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Admin Notes */}
              {booking.admin_notes && (
                <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
                  <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-4">
                    Management Notes
                  </h3>
                  <p className="text-vintage-base text-cream-light">{booking.admin_notes}</p>
                </Card>
              )}

              {/* Cancellation Info */}
              {booking.cancellation_reason && (
                <Card className="bg-red-900/20 backdrop-blur-sm border-red-500/30 p-6">
                  <h3 className="text-vintage-xl font-playfair font-semibold text-red-300 mb-4">
                    Cancellation Reason
                  </h3>
                  <p className="text-vintage-base text-red-200">{booking.cancellation_reason}</p>
                  {booking.cancelled_at && (
                    <p className="text-vintage-sm text-red-300/70 mt-2">
                      Cancelled on {formatDate(booking.cancelled_at)}
                    </p>
                  )}
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Booking Dates */}
              <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
                <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-4 flex items-center">
                  <Calendar className="h-5 w-5 text-copper-accent mr-2" />
                  Dates
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Check-in</p>
                    <p className="text-vintage-base text-cream-light font-semibold">{formatDate(booking.check_in_date)}</p>
                  </div>
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Check-out</p>
                    <p className="text-vintage-base text-cream-light font-semibold">{formatDate(booking.check_out_date)}</p>
                  </div>
                  <div className="pt-3 border-t border-copper-accent/20">
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Booked on</p>
                    <p className="text-vintage-sm text-cream-light">{formatDate(booking.created_at)}</p>
                  </div>
                  {booking.confirmed_at && (
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Confirmed on</p>
                      <p className="text-vintage-sm text-cream-light">{formatDate(booking.confirmed_at)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Payment Information */}
              <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
                <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 text-copper-accent mr-2" />
                  Payment
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Total Amount</p>
                    <p className="text-vintage-2xl font-bold text-copper-accent">{formatCurrency(booking.total_price)}</p>
                  </div>
                  <div>
                    <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Payment Status</p>
                    <Badge className={`${getStatusBadgeColor(booking.payment_status)} font-cinzel uppercase tracking-wider`}>
                      {booking.payment_status}
                    </Badge>
                  </div>
                  {booking.paid_amount && parseFloat(booking.paid_amount.toString()) > 0 && (
                    <div>
                      <p className="text-vintage-sm text-cream-light/60 font-cormorant mb-1">Paid Amount</p>
                      <p className="text-vintage-lg text-green-400">{formatCurrency(booking.paid_amount)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Actions */}
              {canManageBooking && (booking.status === 'Pending' || booking.status === 'Confirmed') && (
                <Card className="bg-walnut-dark/50 backdrop-blur-sm border-copper-accent/20 p-6">
                  <h3 className="text-vintage-xl font-playfair font-semibold text-cream-light mb-4">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    {booking.status === 'Pending' && (
                      <Button
                        onClick={handleConfirmBooking}
                        disabled={actionLoading}
                        className="w-full px-8 py-4 text-green-200 border-green-400 bg-gradient-to-r from-green-400/20 to-green-400/70 font-cinzel font-bold rounded-lg hover:shadow-green-400/30 hover:bg-green-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm Booking
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={handleCancelBooking}
                      disabled={actionLoading}
                      className="w-full px-8 py-4 text-red-400 border-red-400 bg-gradient-to-r from-red-400/10 to-red-400/30 font-cinzel font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Booking
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
