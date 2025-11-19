"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter
} from "lucide-react"
import type { Booking } from "@/types/dashboard"
import { bookingsApi } from "@/lib/api/dashboard"
import { toast } from "sonner"

interface BookingsManagementTabProps {
  bookings: Booking[]
  accessToken: string
  onRefresh: () => void
}

export default function BookingsManagementTab({ bookings, accessToken, onRefresh }: BookingsManagementTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings)

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await bookingsApi.updateStatus(bookingId, 'Confirmed')
      toast.success('Booking confirmed successfully')
      setLocalBookings(prev => 
        prev.map(b => b.id === bookingId ? { ...b, status: 'Confirmed' as const } : b)
      )
    } catch (error) {
      console.error('Failed to confirm booking:', error)
      toast.error('Failed to confirm booking')
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingsApi.updateStatus(bookingId, 'Cancelled', 'Cancelled by hotel management')
      toast.success('Booking cancelled successfully')
      setLocalBookings(prev => 
        prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' as const } : b)
      )
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await bookingsApi.updateStatus(bookingId, 'Completed')
      toast.success('Booking marked as completed')
      setLocalBookings(prev => 
        prev.map(b => b.id === bookingId ? { ...b, status: 'Completed' as const } : b)
      )
    } catch (error) {
      console.error('Failed to complete booking:', error)
      toast.error('Failed to complete booking')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-900/50 text-green-300 border-green-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Pending':
        return 'bg-yellow-900/60 text-yellow-300 border-yellow-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Cancelled':
        return 'bg-red-900/60 text-red-300 border-red-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Completed':
        return 'bg-blue-900/60 text-blue-300 border-blue-400/70 pt-1 font-varela uppercase tracking-wider'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-400/70 pt-1 font-varela uppercase tracking-wider'
    }
  }

  const filteredBookings = localBookings.filter((booking) => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus
    const matchesSearch = searchQuery === '' || 
      booking.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.room?.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  const statusCounts = {
    all: localBookings.length,
    Pending: localBookings.filter(b => b.status === 'Pending').length,
    Confirmed: localBookings.filter(b => b.status === 'Confirmed').length,
    Cancelled: localBookings.filter(b => b.status === 'Cancelled').length,
    Completed: localBookings.filter(b => b.status === 'Completed').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-vintage-2xl font-libre text-deep-brown font-bold">
          Manage Bookings
        </h2>
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-creamy-yellow/60" />
          <input
            type="text"
            placeholder="Search by guest, room, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-brown/60 border border-terracotta-rose/30 rounded-lg text-vintage-base text-creamy-yellow placeholder:text-creamy-yellow/40 font-varela focus:outline-none focus:ring-2 focus:ring-terracotta-rose/50"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'] as const).map((status) => (
          <Button
            key={status}
            onClick={() => setFilterStatus(status)}
            variant={filterStatus === status ? 'default' : 'default'}
            className={`${
              filterStatus === status
                ? 'bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-bold border-terracotta-rose/30'
                : 'bg-terracotta-rose/30 text-deep-brown/50 border-terracotta-rose/30 hover:bg-terracotta-rose/20'
            } font-varela whitespace-nowrap`}
          >
            {status === 'all' ? 'All' : status}
            <span className="ml-2 px-2 py-0.5 bg-terracotta-orange/80 rounded-full text-vintage-xs">
              {statusCounts[status]}
            </span>
          </Button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30">
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 text-terracotta-rose/60 mx-auto mb-4" />
            <h3 className="text-vintage-xl font-libre text-creamy-yellow mb-2">
              No Bookings Found
            </h3>
            <p className="text-vintage-base text-creamy-yellow/60 font-varela">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'No bookings have been made yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-creamy-white" />
                    </div>
                    <div>
                      <CardTitle className="text-vintage-lg font-libre text-creamy-yellow">
                        {booking.guest_name || 'Guest'}
                      </CardTitle>
                      <p className="text-vintage-sm text-creamy-yellow/70 font-varela">
                        Booking ID: {booking.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Booking Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-vintage-xs text-creamy-yellow/60 font-varela uppercase tracking-wider mb-1">
                      Room
                    </p>
                    <p className="text-vintage-base text-creamy-yellow font-libre font-semibold">
                      #{booking.room?.room_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-vintage-xs text-creamy-yellow/60 font-varela uppercase tracking-wider mb-1">
                      Check-in
                    </p>
                    <p className="text-vintage-base text-creamy-yellow font-varela">
                      {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-vintage-xs text-creamy-yellow/60 font-varela uppercase tracking-wider mb-1">
                      Check-out
                    </p>
                    <p className="text-vintage-base text-creamy-yellow font-varela">
                      {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-vintage-xs text-creamy-yellow/60 font-varela uppercase tracking-wider mb-1">
                      Total
                    </p>
                    <p className="text-vintage-base text-creamy-yellow font-libre font-semibold">
                      ${Number(booking.total_price).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center gap-4 text-vintage-sm text-creamy-yellow/70 font-varela">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-terracotta-rose" />
                    {booking.number_of_guests || 1} {booking.number_of_guests === 1 ? 'guest' : 'guests'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-terracotta-rose" />
                    Booked {new Date(booking.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                {booking.status === 'Pending' && (
                  <div className="flex gap-2 pt-2 border-t border-terracotta-rose/30">
                    <Button
                      onClick={() => handleConfirmBooking(booking.id)}
                      className="flex-1 bg-green-800/60 text-green-200 border-green-400/70 hover:bg-green-800/40 font-varela"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="flex-1 bg-red-800/60 text-red-200 border-red-400/70 hover:bg-red-800/40 font-varela"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
                {booking.status === 'Confirmed' && (
                  <div className="flex gap-2 pt-2 border-t border-terracotta-rose/30">
                    <Button
                      onClick={() => handleCompleteBooking(booking.id)}
                      className="flex-1 bg-terracotta-rose text-dark-brown font-bold border-terracotta-rose/70 hover:bg-terracotta-rose/40 font-varela"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-vintage-sm text-creamy-yellow/60 font-varela">
        Showing {filteredBookings.length} of {localBookings.length} bookings
      </div>
    </div>
  )
}
