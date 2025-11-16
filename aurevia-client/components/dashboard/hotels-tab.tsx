"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  MapPin,
  Star,
  Phone,
  ChevronDown,
  ChevronUp,
  Bed,
  Calendar,
  Users,
  DollarSign,
  Edit,
  Plus,
  Settings,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  IdCard,
  MessageSquare
} from "lucide-react"
import type { Hotel, Room, Booking, RoomAvailability } from "@/types/dashboard"
import { roomsApi, bookingsApi, availabilityApi } from "@/lib/api/dashboard"
import { ReviewApiService } from "@/lib/api/reviews"
import type { Review } from "@/types/review"
import { EditHotelModal } from "./edit-hotel-modal"
import { AddRoomModal } from "./add-room-modal"
import { EditRoomModal } from "./edit-room-modal"
import { ManageAvailabilityModal } from "./manage-availability-modal"
import ReviewList from "@/components/reviews/review-list"

interface HotelsTabProps {
  hotels: Hotel[]
  accessToken: string
  isAdmin: boolean
  onRefresh: () => void
}

type HotelSubTab = 'rooms' | 'bookings' | 'reviews'

export default function HotelsTab({ hotels, accessToken, isAdmin, onRefresh }: HotelsTabProps) {
  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(new Set())
  const [hotelRooms, setHotelRooms] = useState<Record<string, Room[]>>({})
  const [hotelBookings, setHotelBookings] = useState<Record<string, Booking[]>>({})
  const [hotelReviews, setHotelReviews] = useState<Record<string, Review[]>>({})
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [roomAvailability, setRoomAvailability] = useState<Record<string, RoomAvailability[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [hotelSubTabs, setHotelSubTabs] = useState<Record<string, HotelSubTab>>({})

  // Modal states
  const [editHotelModal, setEditHotelModal] = useState<{ isOpen: boolean; hotel: Hotel | null }>({
    isOpen: false,
    hotel: null
  })
  const [addRoomModal, setAddRoomModal] = useState<{ isOpen: boolean; hotelId: string | null }>({
    isOpen: false,
    hotelId: null
  })
  const [editRoomModal, setEditRoomModal] = useState<{ isOpen: boolean; room: Room | null }>({
    isOpen: false,
    room: null
  })
  const [manageAvailabilityModal, setManageAvailabilityModal] = useState<{
    isOpen: boolean;
    room: Room | null;
    availability: RoomAvailability[];
  }>({
    isOpen: false,
    room: null,
    availability: []
  })

  const toggleHotel = async (hotelId: string) => {
    const newExpanded = new Set(expandedHotels)
    if (newExpanded.has(hotelId)) {
      newExpanded.delete(hotelId)
    } else {
      newExpanded.add(hotelId)
      // Set default sub-tab to 'rooms' when expanding
      setHotelSubTabs(prev => ({ ...prev, [hotelId]: 'rooms' }))
      // Load rooms and bookings for this hotel
      if (!hotelRooms[hotelId]) {
        await loadHotelData(hotelId)
      }
    }
    setExpandedHotels(newExpanded)
  }

  const setHotelSubTab = (hotelId: string, subTab: HotelSubTab) => {
    setHotelSubTabs(prev => ({ ...prev, [hotelId]: subTab }))
  }

  const getHotelSubTab = (hotelId: string): HotelSubTab => {
    return hotelSubTabs[hotelId] || 'rooms'
  }

  // Booking management functions
  const confirmBooking = async (bookingId: string, hotelId: string) => {
    if (!confirm('Are you sure you want to confirm this booking?')) {
      return
    }

    try {
      await bookingsApi.updateStatus(bookingId, 'Confirmed', 'Booking confirmed by hotel management')
      // Reload hotel data to show updated booking status
      await loadHotelData(hotelId)
      console.log('Booking confirmed successfully')
    } catch (error) {
      console.error('Failed to confirm booking:', error)
      alert('Failed to confirm booking: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const cancelBooking = async (bookingId: string, hotelId: string) => {
    const reason = prompt('Please provide a reason for cancellation:')
    if (!reason) {
      return
    }

    if (!confirm(`Are you sure you want to cancel this booking?\nReason: ${reason}`)) {
      return
    }

    try {
      await bookingsApi.updateStatus(bookingId, 'Cancelled', reason)
      // Reload hotel data to show updated booking status
      await loadHotelData(hotelId)
      console.log('Booking cancelled successfully')
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      alert('Failed to cancel booking: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const toggleRoom = async (roomId: string) => {
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId)
    } else {
      newExpanded.add(roomId)
      // Load availability for this room
      if (!roomAvailability[roomId]) {
        await loadRoomAvailability(roomId)
      }
      console.log('Toggled room expansion for room ID:', roomId)
    }
    setExpandedRooms(newExpanded)
  }

  const loadHotelData = async (hotelId: string) => {
    setLoading((prev) => ({ ...prev, [hotelId]: true }))
    try {
      const [rooms, bookings, reviews] = await Promise.all([
        roomsApi.getByHotel(hotelId).catch(() => []),
        bookingsApi.getByHotel(hotelId).catch(() => []),
        ReviewApiService.getHotelReviews(hotelId, true).catch(() => [])
      ])
      setHotelRooms((prev) => ({ ...prev, [hotelId]: rooms }))
      setHotelBookings((prev) => ({ ...prev, [hotelId]: bookings }))
      setHotelReviews((prev) => ({ ...prev, [hotelId]: reviews }))
      console.log('🔍 Bookings:', bookings)
      console.log('🛏️ Rooms:', rooms)

    } catch (error) {
      console.error(`Failed to load data for hotel ${hotelId}:`, error)
    } finally {
      setLoading((prev) => ({ ...prev, [hotelId]: false }))
    }
  }

  const loadRoomAvailability = async (roomId: string) => {
    setLoading((prev) => ({ ...prev, [roomId]: true }))
    try {
      const availability = await availabilityApi.getByRoom(roomId)
      setRoomAvailability((prev) => ({ ...prev, [roomId]: availability }))
      console.log('📅 Loaded availability for room', roomId)
      console.log('📅 Availability:', availability)
    } catch (error) {
      console.error(`Failed to load availability for room ${roomId}:`, error)
    } finally {
      setLoading((prev) => ({ ...prev, [roomId]: false }))
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-900/60 text-green-300 border-green-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Paid':
        return 'bg-green-900/60 text-green-300 border-green-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Pending':
        return 'bg-yellow-900/60 text-yellow-300 border-yellow-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Cancelled':
        return 'bg-red-900/60 text-red-300 border-red-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Completed':
        return 'bg-blue-900/60 text-blue-300 border-blue-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'CheckedIn':
        return 'bg-purple-900/60 text-purple-300 border-purple-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'CheckedOut':
        return 'bg-gray-900/60 text-gray-300 border-gray-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Booked':
        return 'bg-orange-900/60 text-orange-300 border-orange-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Available':
        return 'bg-green-900/50 text-green-300 border-green-400/70 pt-1 font-varela uppercase tracking-wider'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-400/70 pt-1 font-varela uppercase tracking-wider'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-vintage-2xl font-libre font-bold text-deep-brown">
          {isAdmin ? 'All Hotels' : 'My Hotels'}
        </h2>
        <Button
          onClick={onRefresh}
          className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-varela font-bold hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-105"
        >
          Refresh
        </Button>
      </div>

      {hotels.length === 0 ? (
        <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border border-terracotta-rose/30">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-creamy-yellow/40 mx-auto mb-4" />
            <p className="text-creamy-yellow/60 font-varela text-vintage-lg">
              No hotels found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hotels.map((hotel) => (
            <Card
              key={hotel.id}
              className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border border-terracotta-rose/30 shadow-xl hover:border-terracotta-rose/50 transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-creamy-white" />
                      </div>
                      <div>
                        <h3 className="text-creamy-yellow font-fraunces text-vintage-2xl font-semibold">
                          {hotel.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-terracotta-rose" />
                          <span className="text-creamy-yellow/80 font-varela text-vintage-base">
                            {hotel.location?.city || hotel.city || 'Unknown'}, {hotel.location?.state || hotel.state || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-creamy-yellow font-varela text-vintage-base">
                          {hotel.avg_rating ? Number(hotel.avg_rating).toFixed(1) : '0.0'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-terracotta-rose" />
                        <span className="text-creamy-yellow/80 font-varela text-vintage-sm">
                          {hotel.phone_number || 'N/A'}
                        </span>
                      </div>
                      <Badge
                        className={`${hotel.is_active
                            ? 'bg-green-900/50 text-green-300 border-green-400/70'
                            : 'bg-red-900/50 text-red-300 border-red-400/70'
                          } font-varela uppercase tracking-wider`}
                      >
                        {hotel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => toggleHotel(hotel.id)}
                    size="sm"
                    className="text-creamy-yellow border-terracotta-rose/30 hover:bg-terracotta-rose/70"
                  >
                    {expandedHotels.has(hotel.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {/* Expanded Hotel Details */}
              {expandedHotels.has(hotel.id) && (
                <CardContent className="space-y-6 border-t border-terracotta-rose/30 pt-6">
                  {loading[hotel.id] ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-terracotta-rose/30 border-t-terracotta-rose rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      {/* Hotel Info */}
                      <div className="space-y-2">
                        <h4 className="text-creamy-yellow font-libre text-vintage-lg font-bold">
                          Hotel Information
                        </h4>
                        <p className="text-creamy-yellow/80 font-varela text-vintage-base">
                          {hotel.description || 'No description available'}
                        </p>
                        <p className="text-creamy-yellow/60 font-varela text-vintage-sm">
                          {hotel.address || hotel.location?.address || 'Address not available'}, {hotel.location?.city || hotel.city || 'Unknown'}, {hotel.location?.state || hotel.state || 'Unknown'} {hotel.zip_code || ''}
                        </p>
                        {isAdmin && hotel.owner && (
                          <p className="text-creamy-yellow/60 font-varela text-vintage-sm">
                            Owner: {hotel.owner.first_name || 'Unknown'} {hotel.owner.last_name || 'Unknown'} ({hotel.owner.email || 'N/A'})
                          </p>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => setEditHotelModal({ isOpen: true, hotel })}
                            size="sm"
                            className="text-deep-brown border-yellow-400 bg-gradient-to-r from-yellow-400/60 to-yellow-400/40 font-varela font-bold rounded-lg hover:shadow-yellow-400/30 hover:bg-yellow-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Hotel
                          </Button>
                          <Button
                            onClick={() => setAddRoomModal({ isOpen: true, hotelId: hotel.id })}
                            size="sm"
                            className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-varela font-bold hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-105"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Room
                          </Button>
                        </div>
                      </div>

                      {/* Sub-tabs Navigation */}
                      <div className="flex gap-4 border-b border-terracotta-rose/30">
                        <button
                          onClick={() => setHotelSubTab(hotel.id, 'rooms')}
                          className={`flex items-center gap-2 px-4 py-2 font-varela text-vintage-base font-medium transition-all duration-300 ${getHotelSubTab(hotel.id) === 'rooms'
                              ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                              : 'text-creamy-white/60 hover:text-creamy-white'
                            }`}
                        >
                          <Bed className="h-4 w-4" />
                          Rooms ({hotelRooms[hotel.id]?.length || 0})
                        </button>
                        <button
                          onClick={() => setHotelSubTab(hotel.id, 'bookings')}
                          className={`flex items-center gap-2 px-4 py-2 font-varela text-vintage-base font-medium transition-all duration-300 ${getHotelSubTab(hotel.id) === 'bookings'
                              ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                              : 'text-creamy-white/60 hover:text-creamy-white'
                            }`}
                        >
                          <Calendar className="h-4 w-4" />
                          Bookings ({hotelBookings[hotel.id]?.length || 0})
                        </button>
                        <button
                          onClick={() => setHotelSubTab(hotel.id, 'reviews')}
                          className={`flex items-center gap-2 px-4 py-2 font-varela text-vintage-base font-medium transition-all duration-300 ${getHotelSubTab(hotel.id) === 'reviews'
                              ? 'text-terracotta-rose border-b-2 border-terracotta-rose'
                              : 'text-creamy-white/60 hover:text-creamy-white'
                            }`}
                        >
                          <Star className="h-4 w-4" />
                          Reviews ({hotelReviews[hotel.id]?.length || 0})
                        </button>
                      </div>

                      {/* Sub-tab Content */}
                      {getHotelSubTab(hotel.id) === 'rooms' && (
                        <div className="space-y-4">
                          {hotelRooms[hotel.id]?.length === 0 ? (
                            <p className="text-vintage-base text-creamy-yellow/60 font-varela">
                              No rooms available
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {hotelRooms[hotel.id]?.map((room) => (
                                <Card
                                  key={room.id}
                                  className="bg-creamy-yellow/80 border border-terracotta-rose/30"
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Bed className="h-5 w-5 text-terracotta-rose" />
                                        <div>
                                          <h5 className="text-terracotta-rose-dark font-fraunces text-vintage-xl font-semibold">
                                            Room {room.room_number} - {room.room_type}
                                          </h5>
                                          <p className="text-deep-brown/60 font-varela text-vintage-sm">
                                            Max {room.max_occupancy || 0} guests
                                            {room.bed_configuration && ` • ${room.bed_configuration}`}
                                            {room.size_sqm && ` • ${room.size_sqm} m²`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => setEditRoomModal({ isOpen: true, room })}
                                          size="sm"
                                          className="text-dark-brown border-yellow-400 bg-gradient-to-r from-terracotta-rose/90 to-terracotta-orange/70 font-varela font-bold rounded-lg hover:shadow-yellow-400/30 hover:bg-yellow-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          onClick={() => setManageAvailabilityModal({
                                            isOpen: true,
                                            room,
                                            availability: roomAvailability[room.id] || []
                                          })}
                                          size="sm"
                                          className="text-dark-brown border-yellow-400 bg-gradient-to-r from-terracotta-rose/90 to-terracotta-orange/70 font-varela font-bold rounded-lg hover:shadow-yellow-400/30 hover:bg-yellow-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                                        >
                                          <Settings className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          onClick={() => toggleRoom(room.id)}
                                          size="sm"
                                          className="text-dark-brown border-yellow-400 bg-gradient-to-r from-terracotta-rose/90 to-terracotta-orange/70 font-varela font-bold rounded-lg hover:shadow-yellow-400/30 hover:bg-yellow-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                                        >
                                          {expandedRooms.has(room.id) ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>

                                  {/* Expanded Room Details - Availability */}
                                  {expandedRooms.has(room.id) && (
                                    <CardContent className="border-t border-terracotta-rose/20 pt-3">
                                      {loading[room.id] ? (
                                        <div className="flex justify-center py-4">
                                          <div className="w-6 h-6 border-4 border-terracotta-rose/30 border-t-terracotta-rose rounded-full animate-spin"></div>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <h6 className="text-terracotta-rose-dark font-libre text-vintage-base font-bold">
                                            Availability
                                          </h6>
                                          {roomAvailability[room.id]?.length === 0 ? (
                                            <p className="text-terracotta-rose-dark/60 font-varela text-vintage-sm">
                                              No availability set
                                            </p>
                                          ) : (
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                              {roomAvailability[room.id]?.slice(0, 10).map((avail) => (
                                                <div
                                                  key={avail.id}
                                                  className="flex items-center justify-between bg-terracotta-rose/30 border border-terracotta-rose/40 p-3 mr-2 rounded-lg"
                                                >
                                                  <div className="flex items-center gap-3">
                                                    <Calendar className="h-4 w-4 text-copper-accent" />
                                                    <span className="text-deep-brown font-varela text-vintage-sm">
                                                      {new Date(avail.date).toLocaleDateString('en-GB')}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-4">
                                                    <span className="text-deep-brown font-varela text-vintage-sm">
                                                      {avail.available_units} units
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                      <DollarSign className="h-4 w-4 text-copper-accent" />
                                                      <span className="text-terracotta-rose-dark font-libre text-vintage-sm">
                                                        {avail.price_per_night ? Number(avail.price_per_night).toFixed(2) : '0.00'}
                                                      </span>
                                                    </div>
                                                    <Badge
                                                      className={`${getStatusBadgeColor(avail.status)
                                                        }`}
                                                    >
                                                      {avail.status}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              ))}
                                              {roomAvailability[room.id]?.length > 10 && (
                                                <p className="text-cream-light/60 font-cormorant text-vintage-xs text-center">
                                                  Showing 10 of {roomAvailability[room.id].length} dates
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </CardContent>
                                  )}
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {getHotelSubTab(hotel.id) === 'bookings' && (
                        <div className="space-y-4">
                          {hotelBookings[hotel.id]?.length === 0 ? (
                            <p className="text-creamy-yellow/60 font-varela text-vintage-base">
                              No bookings yet
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {hotelBookings[hotel.id]?.map((booking) => (
                                <Card
                                  key={booking.id}
                                  className="bg-creamy-yellow/80 border border-terracotta-rose/30"
                                >
                                  <CardContent className="pb-3 pt-0">
                                    {/* Booking Card Title */}
                                    <div className="mb-2">
                                      <span className="text-terracotta-rose-dark font-libre text-vintage-xl font-bold">
                                        Booking of: Mr/Mrs {booking.guest_name || 'N/A'} - {booking.room ? `Room ${booking.room.room_number}` : 'No room assigned'}
                                      </span>
                                    </div>
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                          <IdCard className="h-5 w-5 text-terracotta-rose-dark" />
                                          <span className="text-deep-brown font-varela text-vintage-base">
                                            Booking ID: {booking.id}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <Calendar className="h-5 w-5 text-terracotta-rose-dark" />
                                          <span className="text-deep-brown font-varela text-vintage-base">
                                            {new Date(booking.check_in_date).toLocaleDateString()} -{' '}
                                            {new Date(booking.check_out_date).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-cream-light/80">
                                          <Users className="h-4 w-4 text-terracotta-rose-dark" />
                                          <span className="font-varela text-vintage-sm text-deep-brown">
                                            {booking.guest_name || 'N/A'} • {booking.number_of_guests} guests
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <DollarSign className="h-4 w-4 text-terracotta-rose-dark" />
                                          <span className="text-deep-brown font-libre text-vintage-sm">
                                            ${booking.total_price ? Number(booking.total_price).toFixed(2) : '0.00'} (Paid: ${booking.paid_amount})
                                          </span>
                                        </div>
                                        {booking.special_requests && (
                                          <div className="mt-2 p-3 bg-terracotta-rose/30 rounded-lg border border-terracotta-rose/20">
                                            <p className="text-vintage-sm text-terracotta-rose-dark font-varela font-semibold mb-1">Special Request:</p>
                                            <p className="text-vintage-base text-dark-brown/80 font-varela">
                                              {booking.special_requests}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-2 mt-2 items-end">
                                        <Badge
                                          className={`${getStatusBadgeColor(booking.status)}`}
                                        >
                                          Booking: {booking.status}
                                        </Badge>
                                        <Badge
                                          className={`${getStatusBadgeColor(booking.payment_status)}`}
                                        >
                                          Payment: {booking.payment_status}
                                        </Badge>

                                        {/* Booking Action Buttons */}
                                        {booking.status === 'Pending' && (
                                          <div className="flex gap-2 mt-2 flex-wrap">
                                            <Button
                                              onClick={() => confirmBooking(booking.id, hotel.id)}
                                              size="sm"
                                              className="text-green-800 border-green-400 bg-gradient-to-r from-green-600/50 to-green-500/60 font-varela font-bold rounded-lg hover:shadow-green-400/30 hover:bg-green-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                                            >
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Confirm
                                            </Button>
                                            <Button
                                              onClick={() => cancelBooking(booking.id, hotel.id)}
                                              size="sm"
                                              className="text-red-800 border-red-400 bg-gradient-to-r from-red-600/50 to-red-500/60 font-varela font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                                            >
                                              <XCircle className="h-3 w-3 mr-1" />
                                              Cancel
                                            </Button>
                                          </div>
                                        )}

                                        {booking.status === 'Confirmed' && (
                                          <div className="flex gap-2 mt-2 flex-wrap">
                                            <Button
                                              onClick={() => cancelBooking(booking.id, hotel.id)}
                                              size="sm"
                                              className="text-red-800 border-red-400 bg-gradient-to-r from-red-600/50 to-red-500/60 font-varela font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                                            >
                                              <XCircle className="h-3 w-3 mr-1" />
                                              Cancel
                                            </Button>
                                          </div>
                                        )}

                                        {booking.status === 'Cancelled' && (
                                          <div className="mt-3">
                                            <span className="text-red-800 font-varela text-vintage-sm uppercase tracking-wider">
                                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                                              Cancelled
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reviews Tab */}
                      {getHotelSubTab(hotel.id) === 'reviews' && (
                        <div className="space-y-4">
                          {loading[hotel.id] ? (
                            <div className="flex justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-rose" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {hotelReviews[hotel.id]?.length === 0 ? (
                                <div className="text-center py-8 text-creamy-white/60">
                                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                  <p className="font-varela">No reviews yet for this hotel</p>
                                </div>
                              ) : (
                                <ReviewList 
                                  reviews={hotelReviews[hotel.id] || []} 
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {editHotelModal.hotel && (
        <EditHotelModal
          isOpen={editHotelModal.isOpen}
          onClose={() => setEditHotelModal({ isOpen: false, hotel: null })}
          hotel={editHotelModal.hotel}
          accessToken={accessToken}
          onSuccess={() => {
            onRefresh()
            setEditHotelModal({ isOpen: false, hotel: null })
          }}
        />
      )}

      {addRoomModal.hotelId && (
        <AddRoomModal
          isOpen={addRoomModal.isOpen}
          onClose={() => setAddRoomModal({ isOpen: false, hotelId: null })}
          hotelId={addRoomModal.hotelId}
          accessToken={accessToken}
          onSuccess={async () => {
            // Reload the hotel's rooms to show the new room immediately
            await loadHotelData(addRoomModal.hotelId!)
            setAddRoomModal({ isOpen: false, hotelId: null })
          }}
        />
      )}

      {editRoomModal.room && (
        <EditRoomModal
          isOpen={editRoomModal.isOpen}
          onClose={() => setEditRoomModal({ isOpen: false, room: null })}
          room={editRoomModal.room}
          accessToken={accessToken}
          onSuccess={() => {
            onRefresh()
            setEditRoomModal({ isOpen: false, room: null })
          }}
        />
      )}

      {manageAvailabilityModal.room && (
        <ManageAvailabilityModal
          isOpen={manageAvailabilityModal.isOpen}
          onClose={() => setManageAvailabilityModal({ isOpen: false, room: null, availability: [] })}
          roomId={manageAvailabilityModal.room.id}
          roomNumber={manageAvailabilityModal.room.room_number}
          accessToken={accessToken}
          existingAvailability={manageAvailabilityModal.availability}
          onSuccess={async () => {
            if (manageAvailabilityModal.room) {
              await loadRoomAvailability(manageAvailabilityModal.room.id)
            }
          }}
        />
      )}
    </div>
  )
}
