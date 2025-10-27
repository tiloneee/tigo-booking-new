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
  IdCard
} from "lucide-react"
import type { Hotel, Room, Booking, RoomAvailability } from "@/types/dashboard"
import { roomsApi, bookingsApi, availabilityApi } from "@/lib/api/dashboard"
import { EditHotelModal } from "./edit-hotel-modal"
import { AddRoomModal } from "./add-room-modal"
import { EditRoomModal } from "./edit-room-modal"
import { ManageAvailabilityModal } from "./manage-availability-modal"

interface HotelsTabProps {
  hotels: Hotel[]
  accessToken: string
  isAdmin: boolean
  onRefresh: () => void
}

type HotelSubTab = 'rooms' | 'bookings'

export default function HotelsTab({ hotels, accessToken, isAdmin, onRefresh }: HotelsTabProps) {
  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(new Set())
  const [hotelRooms, setHotelRooms] = useState<Record<string, Room[]>>({})
  const [hotelBookings, setHotelBookings] = useState<Record<string, Booking[]>>({})
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
    }
    setExpandedRooms(newExpanded)
  }

  const loadHotelData = async (hotelId: string) => {
    setLoading((prev) => ({ ...prev, [hotelId]: true }))
    try {
      const [rooms, bookings] = await Promise.all([
        roomsApi.getByHotel(hotelId).catch(() => []),
        bookingsApi.getByHotel(hotelId).catch(() => []),
      ])
      setHotelRooms((prev) => ({ ...prev, [hotelId]: rooms }))
      setHotelBookings((prev) => ({ ...prev, [hotelId]: bookings }))
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
      case 'Booked':
        return 'bg-orange-900/60 text-orange-300 border-orange-400/70'
      case 'Available':
        return 'bg-green-900/50 text-green-300 border-green-400/70'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-400/70'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-vintage-2xl font-playfair font-bold text-cream-light">
          {isAdmin ? 'All Hotels' : 'My Hotels'}
        </h2>
        <Button
          onClick={onRefresh}
          className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
        >
          Refresh
        </Button>
      </div>

      {hotels.length === 0 ? (
        <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-cream-light/40 mx-auto mb-4" />
            <p className="text-cream-light/60 font-cormorant text-vintage-lg">
              No hotels found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hotels.map((hotel) => (
            <Card
              key={hotel.id}
              className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-xl hover:border-copper-accent/50 transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-copper-accent to-copper-light rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-walnut-dark" />
                      </div>
                      <div>
                        <h3 className="text-cream-light font-playfair text-vintage-2xl font-bold">
                          {hotel.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-copper-accent" />
                        <span className="text-cream-light/80 font-cormorant text-vintage-base">
                          {hotel.location?.city || hotel.city || 'Unknown'}, {hotel.location?.state || hotel.state || 'Unknown'}
                        </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-cream-light font-cormorant text-vintage-base">
                          {hotel.avg_rating ? Number(hotel.avg_rating).toFixed(1) : '0.0'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-copper-accent" />
                        <span className="text-cream-light/80 font-cormorant text-vintage-sm">
                          {hotel.phone_number || 'N/A'}
                        </span>
                      </div>
                      <Badge
                        className={`${
                          hotel.is_active
                            ? 'bg-green-900/50 text-green-300 border-green-400/70'
                            : 'bg-red-900/50 text-red-300 border-red-400/70'
                        } font-cinzel uppercase tracking-wider`}
                      >
                        {hotel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => toggleHotel(hotel.id)}
                    size="sm"
                    variant="outline"
                    className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
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
                <CardContent className="space-y-6 border-t border-copper-accent/30 pt-6">
                  {loading[hotel.id] ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-copper-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      {/* Hotel Info */}
                      <div className="space-y-2">
                        <h4 className="text-cream-light font-playfair text-vintage-lg font-bold">
                          Hotel Information
                        </h4>
                        <p className="text-cream-light/80 font-cormorant text-vintage-base">
                          {hotel.description || 'No description available'}
                        </p>
                        <p className="text-cream-light/60 font-cormorant text-vintage-sm">
                          {hotel.address || hotel.location?.address || 'Address not available'}, {hotel.location?.city || hotel.city || 'Unknown'}, {hotel.location?.state || hotel.state || 'Unknown'} {hotel.zip_code || ''}
                        </p>
                        {isAdmin && hotel.owner && (
                          <p className="text-cream-light/60 font-cormorant text-vintage-sm">
                            Owner: {hotel.owner.first_name || 'Unknown'} {hotel.owner.last_name || 'Unknown'} ({hotel.owner.email || 'N/A'})
                          </p>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => setEditHotelModal({ isOpen: true, hotel })}
                            size="sm"
                            variant="outline"
                            className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Hotel
                          </Button>
                          <Button
                            onClick={() => setAddRoomModal({ isOpen: true, hotelId: hotel.id })}
                            size="sm"
                            className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Room
                          </Button>
                        </div>
                      </div>

                      {/* Sub-tabs Navigation */}
                      <div className="flex gap-4 border-b border-copper-accent/30">
                        <button
                          onClick={() => setHotelSubTab(hotel.id, 'rooms')}
                          className={`flex items-center gap-2 px-4 py-2 font-cormorant text-vintage-base font-medium transition-all duration-300 ${
                            getHotelSubTab(hotel.id) === 'rooms'
                              ? 'text-copper-accent border-b-2 border-copper-accent'
                              : 'text-cream-light/60 hover:text-cream-light'
                          }`}
                        >
                          <Bed className="h-4 w-4" />
                          Rooms ({hotelRooms[hotel.id]?.length || 0})
                        </button>
                        <button
                          onClick={() => setHotelSubTab(hotel.id, 'bookings')}
                          className={`flex items-center gap-2 px-4 py-2 font-cormorant text-vintage-base font-medium transition-all duration-300 ${
                            getHotelSubTab(hotel.id) === 'bookings'
                              ? 'text-copper-accent border-b-2 border-copper-accent'
                              : 'text-cream-light/60 hover:text-cream-light'
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                          Bookings ({hotelBookings[hotel.id]?.length || 0})
                        </button>
                      </div>

                      {/* Sub-tab Content */}
                      {getHotelSubTab(hotel.id) === 'rooms' && (
                        <div className="space-y-4">
                        {hotelRooms[hotel.id]?.length === 0 ? (
                          <p className="text-cream-light/60 font-cormorant text-vintage-base">
                            No rooms available
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {hotelRooms[hotel.id]?.map((room) => (
                              <Card
                                key={room.id}
                                className="bg-walnut-medium/50 border border-copper-accent/20"
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Bed className="h-5 w-5 text-copper-accent" />
                                      <div>
                                        <h5 className="text-cream-light font-playfair text-vintage-lg font-bold">
                                          Room {room.room_number} - {room.room_type}
                                        </h5>
                                        <p className="text-cream-light/60 font-cormorant text-vintage-sm">
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
                                        variant="outline"
                                        className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
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
                                        variant="outline"
                                        className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
                                      >
                                        <Settings className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        onClick={() => toggleRoom(room.id)}
                                        size="sm"
                                        variant="outline"
                                        className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
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
                                  <CardContent className="border-t border-copper-accent/20 pt-3">
                                    {loading[room.id] ? (
                                      <div className="flex justify-center py-4">
                                        <div className="w-6 h-6 border-4 border-copper-accent border-t-transparent rounded-full animate-spin"></div>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <h6 className="text-cream-light font-playfair text-vintage-base font-bold">
                                          Availability
                                        </h6>
                                        {roomAvailability[room.id]?.length === 0 ? (
                                          <p className="text-cream-light/60 font-cormorant text-vintage-sm">
                                            No availability set
                                          </p>
                                        ) : (
                                          <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {roomAvailability[room.id]?.slice(0, 10).map((avail) => (
                                              <div
                                                key={avail.id}
                                                className="flex items-center justify-between bg-walnut-dark/50 p-2 rounded"
                                              >
                                                <div className="flex items-center gap-3">
                                                  <Calendar className="h-4 w-4 text-copper-accent" />
                                                  <span className="text-cream-light/80 font-cormorant text-vintage-sm">
                                                    {new Date(avail.date).toLocaleDateString()}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                  <span className="text-cream-light/80 font-cormorant text-vintage-sm">
                                                    {avail.available_units} units
                                                  </span>
                                                  <div className="flex items-center gap-1">
                                                    <DollarSign className="h-4 w-4 text-copper-accent" />
                                                    <span className="text-cream-light font-cormorant text-vintage-sm">
                                                      {avail.price_per_night ? Number(avail.price_per_night).toFixed(2) : '0.00'}
                                                    </span>
                                                  </div>
                                                  <Badge
                                                    className={`${
                                                      getStatusBadgeColor(avail.status)
                                                    } font-cinzel uppercase tracking-wider`}
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
                          <p className="text-cream-light/60 font-cormorant text-vintage-base">
                            No bookings yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {hotelBookings[hotel.id]?.map((booking) => (
                              <Card
                                key={booking.id}
                                className="bg-walnut-medium/50 border border-copper-accent/20"
                              >
                                <CardContent className="pb-3 pt-0">
                                  {/* Booking Card Title */}
                                  <div className="mb-2">
                                    <span className="text-copper-light font-cormorant text-vintage-xl font-bold">
                                      Booking of: Mr/Mrs {booking.guest_name || 'N/A'} - {booking.room ? `Room ${booking.room.room_number}` : 'No room assigned'}
                                    </span>
                                  </div>
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-3">
                                        <IdCard className="h-5 w-5 text-copper-accent" />
                                        <span className="text-cream-light font-cormorant text-vintage-base">
                                          Booking ID: {booking.id}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-copper-accent" />
                                        <span className="text-cream-light font-cormorant text-vintage-base">
                                          {new Date(booking.check_in_date).toLocaleDateString()} -{' '}
                                          {new Date(booking.check_out_date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-cream-light/80">
                                        <Users className="h-4 w-4 text-copper-accent" />
                                        <span className="font-cormorant text-vintage-sm">
                                          {booking.guest_name || 'N/A'} • {booking.number_of_guests} guests
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <DollarSign className="h-4 w-4 text-copper-accent" />
                                        <span className="text-cream-light font-cormorant text-vintage-sm">
                                          ${booking.total_price ? Number(booking.total_price).toFixed(2) : '0.00'} (Paid: ${booking.paid_amount})
                                        </span>
                                      </div>
                                      {booking.special_requests && (
                                        <p className="text-cream-light/60 font-cormorant text-vintage-sm italic">
                                          Special requests: {booking.special_requests}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-2 mt-2 items-end">
                                      <Badge
                                        className={`${getStatusBadgeColor(booking.status)} font-cinzel uppercase tracking-wider`}
                                      >
                                        {booking.status}
                                      </Badge>
                                      <Badge
                                        className={`${getStatusBadgeColor(booking.payment_status)} font-cinzel uppercase tracking-wider`}
                                      >
                                        {booking.payment_status}
                                      </Badge>
                                      
                                      {/* Booking Action Buttons */}
                                      {booking.status === 'Pending' && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                          <Button
                                            onClick={() => confirmBooking(booking.id, hotel.id)}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white font-cinzel text-vintage-xs"
                                          >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Confirm
                                          </Button>
                                          <Button
                                            onClick={() => cancelBooking(booking.id, hotel.id)}
                                            size="sm"
                                            variant="outline"
                                            className="border-red-500 text-red-400 hover:bg-red-500/10 font-cinzel text-vintage-xs"
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
                                            variant="outline"
                                            className="border-red-500 text-red-400 hover:bg-red-500/10 font-cinzel text-vintage-xs"
                                          >
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Cancel
                                          </Button>
                                        </div>
                                      )}
                                      
                                      {booking.status === 'Cancelled' && (
                                        <div className="mt-3">
                                          <span className="text-red-400 font-cinzel text-vintage-xs uppercase tracking-wider">
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
