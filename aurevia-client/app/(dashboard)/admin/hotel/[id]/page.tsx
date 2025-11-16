"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Building2, 
  AlertCircle, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Star,
  Info,
  Bed,
  Calendar,
  MessageSquare,
  Settings
} from "lucide-react"
import { hotelsApi, roomsApi, bookingsApi } from "@/lib/api/dashboard"
import { ReviewApiService } from "@/lib/api/reviews"
import { hasRole } from "@/lib/api"
import type { Hotel, Room, Booking } from "@/types/dashboard"
import type { Review } from "@/types/review"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import HotelInfoTab from "@/components/dashboard/hotel-management/hotel-info-tab"
import RoomsManagementTab from "@/components/dashboard/hotel-management/rooms-management-tab"
import BookingsManagementTab from "@/components/dashboard/hotel-management/bookings-management-tab"
import ReviewsManagementTab from "@/components/dashboard/hotel-management/reviews-management-tab"

type TabType = 'info' | 'rooms' | 'bookings' | 'reviews'

export default function HotelManagementPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const hotelId = params.id as string

  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = hasRole(user, 'Admin')
  const isHotelOwner = hasRole(user, 'HotelOwner')

  const loadHotelData = useCallback(async () => {
    if (!accessToken || !hotelId) return

    try {
      setLoading(true)
      setError(null)

      // Load hotel details
      const hotelData = await hotelsApi.getOne(hotelId)
      setHotel(hotelData)

      // Check if user has permission to view this hotel
      if (!isAdmin && isHotelOwner && hotelData.owner_id !== user?.id) {
        setError("You don't have permission to view this hotel")
        return
      }

      // Load related data
      const [roomsData, bookingsData, reviewsData] = await Promise.all([
        roomsApi.getByHotel(hotelId).catch(() => []),
        bookingsApi.getByHotel(hotelId).catch(() => []),
        ReviewApiService.getHotelReviews(hotelId, true).catch(() => [])
      ])

      setRooms(roomsData)
      setBookings(bookingsData)
      setReviews(reviewsData)
    } catch (err) {
      console.error('Failed to load hotel data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load hotel data')
    } finally {
      setLoading(false)
    }
  }, [accessToken, hotelId, isAdmin, isHotelOwner, user?.id])

  useEffect(() => {
    // Check if user has permission
    if (user && !isAdmin && !isHotelOwner) {
      router.push('/')
      return
    }

    if (user && accessToken) {
      loadHotelData()
    }
  }, [user, isAdmin, isHotelOwner, router, accessToken, loadHotelData])

  const refreshData = () => {
    loadHotelData()
  }

  if (isLoading || loading) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'HotelOwner']}>
        <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white">
          <Header />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-terracotta-rose/30 border-t-terracotta-rose rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-deep-brown font-varela text-vintage-lg">Loading hotel...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !hotel) {
    return (
      <ProtectedRoute allowedRoles={['Admin', 'HotelOwner']}>
        <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white">
          <Header />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-7xl mx-auto">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="ghost"
                className="mb-6 text-deep-brown hover:text-terracotta-rose"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Card className="bg-red-900/20 border-red-500/50">
                <CardContent className="py-8">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertCircle className="h-8 w-8" />
                    <div>
                      <h3 className="font-libre text-vintage-xl font-bold mb-1">Error Loading Hotel</h3>
                      <p className="font-varela">{error || 'Hotel not found'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['Admin', 'HotelOwner']}>
      <div className="min-h-screen bg-gradient-to-bl from-creamy-yellow to-creamy-white">
        <Header />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="ghost"
              className="mb-6 text-deep-brown hover:text-terracotta-rose font-varela"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            {/* Hotel Information Header */}
            <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 mb-8 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-xl flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-creamy-white" />
                    </div>
                    <div>
                      <h1 className="text-vintage-3xl md:text-vintage-4xl font-libre font-bold text-creamy-yellow mb-2 tracking-wide">
                        {hotel.name}
                      </h1>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          className={`${hotel.is_active
                              ? 'bg-green-800/40 text-green-300 border-green-400/60'
                              : 'bg-red-800/40 text-red-300 border-red-400/60'
                            } pt-0.5 font-varela`}
                        >
                          {hotel.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-creamy-yellow/90 font-varela text-vintage-base">
                            {hotel.avg_rating ? Number(hotel.avg_rating).toFixed(1) : '0.0'}
                          </span>
                          <span className="text-creamy-yellow/60 font-varela text-vintage-sm">
                            ({hotel.total_reviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-terracotta-rose font-varela text-vintage-sm font-semibold">
                      <MapPin className="h-4 w-4" />
                      Location
                    </div>
                    <p className="text-creamy-yellow/90 font-varela text-vintage-base pl-6">
                      {hotel.address}<br />
                      {hotel.city}, {hotel.state} {hotel.zip_code}<br />
                      {hotel.country}
                    </p>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-terracotta-rose font-varela text-vintage-sm font-semibold">
                      <Phone className="h-4 w-4" />
                      Contact
                    </div>
                    <p className="text-creamy-yellow/90 font-varela text-vintage-base pl-6">
                      {hotel.phone_number || 'No phone number'}
                    </p>
                  </div>

                  {/* Description */}
                  {hotel.description && (
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex items-center gap-2 text-terracotta-rose font-varela text-vintage-sm font-semibold">
                        <Info className="h-4 w-4" />
                        Description
                      </div>
                      <p className="text-creamy-yellow/90 font-varela text-vintage-base pl-6">
                        {hotel.description}
                      </p>
                    </div>
                  )}

                  {/* Owner (for admin only) */}
                  {isAdmin && hotel.owner && (
                    <div className="md:col-span-2 space-y-2 pt-4 border-t border-terracotta-rose/30">
                      <div className="flex items-center gap-2 text-terracotta-rose font-varela text-vintage-sm font-semibold">
                        <Building2 className="h-4 w-4" />
                        Owner Information
                      </div>
                      <p className="text-creamy-yellow/90 font-varela text-vintage-base pl-6">
                        {hotel.owner.first_name} {hotel.owner.last_name} ({hotel.owner.email})
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-terracotta-rose/30">
                  <div className="text-center">
                    <div className="text-vintage-2xl font-libre font-bold text-terracotta-rose">
                      {rooms.length}
                    </div>
                    <div className="text-vintage-sm text-creamy-yellow/70 font-varela">
                      Rooms
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-vintage-2xl font-libre font-bold text-terracotta-rose">
                      {bookings.length}
                    </div>
                    <div className="text-vintage-sm text-creamy-yellow/70 font-varela">
                      Bookings
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-vintage-2xl font-libre font-bold text-terracotta-rose">
                      {reviews.length}
                    </div>
                    <div className="text-vintage-sm text-creamy-yellow/70 font-varela">
                      Reviews
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-vintage-2xl font-libre font-bold text-terracotta-rose">
                      {bookings.filter(b => b.status === 'Pending').length}
                    </div>
                    <div className="text-vintage-sm text-creamy-yellow/70 font-varela">
                      Pending
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Navigation */}
            <div className="flex gap-4 mb-8 border-b border-terracotta-rose/50 overflow-x-auto">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-2 px-6 py-3 font-varela text-vintage-lg font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'info'
                    ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                    : 'text-deep-brown/60 hover:text-deep-brown'
                }`}
              >
                <Settings className="h-5 w-5" />
                Hotel Info & Amenities
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`flex items-center gap-2 px-6 py-3 font-varela text-vintage-lg font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'rooms'
                    ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                    : 'text-deep-brown/60 hover:text-deep-brown'
                }`}
              >
                <Bed className="h-5 w-5" />
                Rooms ({rooms.length})
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex items-center gap-2 px-6 py-3 font-varela text-vintage-lg font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'bookings'
                    ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                    : 'text-deep-brown/60 hover:text-deep-brown'
                }`}
              >
                <Calendar className="h-5 w-5" />
                Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-6 py-3 font-varela text-vintage-lg font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                    : 'text-deep-brown/60 hover:text-deep-brown'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                Reviews ({reviews.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {activeTab === 'info' && (
                <HotelInfoTab
                  hotel={hotel}
                  accessToken={accessToken || ''}
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'rooms' && (
                <RoomsManagementTab
                  hotelId={hotelId}
                  rooms={rooms}
                  accessToken={accessToken || ''}
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'bookings' && (
                <BookingsManagementTab
                  hotelId={hotelId}
                  bookings={bookings}
                  rooms={rooms}
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'reviews' && (
                <ReviewsManagementTab
                  hotelId={hotelId}
                  reviews={reviews}
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
