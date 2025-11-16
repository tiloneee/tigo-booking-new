"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  MapPin,
  Star,
  Phone,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  User,
  Edit
} from "lucide-react"
import type { Hotel } from "@/types/dashboard"
import { EditHotelModal } from "./edit-hotel-modal"

interface HotelsTabProps {
  hotels: Hotel[]
  accessToken: string
  isAdmin: boolean
  onRefresh: () => void
}

export default function HotelsTab({ hotels, accessToken, isAdmin, onRefresh }: HotelsTabProps) {
  const router = useRouter()

  // Modal states
  const [editHotelModal, setEditHotelModal] = useState<{ isOpen: boolean; hotel: Hotel | null }>({
    isOpen: false,
    hotel: null
  })

  const activeHotels = hotels.filter(h => h.is_active)
  const inactiveHotels = hotels.filter(h => !h.is_active)

  const HotelCard = ({ hotel }: { hotel: Hotel }) => (
    <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-vintage-xl font-libre text-creamy-yellow mb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-terracotta-rose" />
              {hotel.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2 font-varela">
              <Badge
                className={`${hotel.is_active
                    ? 'bg-green-800/40 text-green-300 border-green-400/60'
                    : 'bg-red-800/40 text-red-300 border-red-400/60'
                  } pt-0.5`}
              >
                {hotel.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {hotel.description && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-vintage-sm text-terracotta-rose font-varela">
              <FileText className="h-4 w-4" />
              Description
            </div>
            <p className="text-vintage-sm text-creamy-yellow/80 font-varela line-clamp-2">
              {hotel.description}
            </p>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-vintage-sm text-creamy-yellow/80 font-varela">
            {hotel.avg_rating ? Number(hotel.avg_rating).toFixed(1) : 'No rating'}
          </span>
        </div>

        {/* Location */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-vintage-sm text-terracotta-rose font-varela">
            <MapPin className="h-4 w-4" />
            Location
          </div>
          <p className="text-vintage-sm text-creamy-yellow/80 font-varela">
            {hotel.address || hotel.location?.address || 'Address not available'}, {hotel.location?.city || hotel.city || 'Unknown'}, {hotel.location?.state || hotel.state || 'Unknown'} {hotel.zip_code || ''}
          </p>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-terracotta-rose" />
          <span className="text-vintage-sm text-creamy-yellow/80 font-varela">
            {hotel.phone_number || 'No phone'}
          </span>
        </div>

        {/* Owner (if admin) */}
        {isAdmin && hotel.owner && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-terracotta-rose" />
            <span className="text-vintage-sm text-creamy-yellow/80 font-varela">
              Owner: {hotel.owner.first_name || 'Unknown'} {hotel.owner.last_name || 'Unknown'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-terracotta-rose/30">
          <Button
            onClick={() => router.push(`/admin/hotel/${hotel.id}`)}
            className="flex-1 bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 font-varela font-bold text-dark-brown border-terracotta-rose/30 hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            onClick={() => setEditHotelModal({ isOpen: true, hotel })}
            className="bg-gradient-to-r from-yellow-500/70 to-yellow-600/80 text-white border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

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
            <Building2 className="h-16 w-16 text-terracotta-rose/60 mx-auto mb-4" />
            <h3 className="text-vintage-xl font-libre text-creamy-yellow mb-2">
              No Hotels
            </h3>
            <p className="text-vintage-base text-creamy-yellow/60 font-varela">
              There are no hotels to display.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Hotels */}
          {activeHotels.length > 0 && (
            <div>
              <h2 className="text-vintage-2xl font-libre text-deep-brown mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Active Hotels ({activeHotels.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeHotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Hotels */}
          {inactiveHotels.length > 0 && (
            <div>
              <h2 className="text-vintage-2xl font-libre text-deep-brown mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                Inactive Hotels ({inactiveHotels.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inactiveHotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Hotel Modal */}
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
    </div>
  )
}
