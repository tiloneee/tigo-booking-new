"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bed, 
  Users, 
  Edit, 
  Plus, 
  Calendar,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import type { Room, RoomAvailability } from "@/types/dashboard"
import { availabilityApi } from "@/lib/api/dashboard"
import { AddRoomModal } from "@/components/dashboard/add-room-modal"
import { EditRoomModal } from "@/components/dashboard/edit-room-modal"
import { ManageAvailabilityModal } from "@/components/dashboard/manage-availability-modal"

interface RoomsManagementTabProps {
  hotelId: string
  rooms: Room[]
  accessToken: string
  onRefresh: () => void
}

export default function RoomsManagementTab({ hotelId, rooms, accessToken, onRefresh }: RoomsManagementTabProps) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [roomAvailability, setRoomAvailability] = useState<Record<string, RoomAvailability[]>>({})
  
  const [addRoomModal, setAddRoomModal] = useState({ isOpen: false })
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

  const toggleRoom = async (roomId: string) => {
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId)
    } else {
      newExpanded.add(roomId)
      if (!roomAvailability[roomId]) {
        await loadRoomAvailability(roomId)
      }
    }
    setExpandedRooms(newExpanded)
  }

  const loadRoomAvailability = async (roomId: string) => {
    try {
      const availability = await availabilityApi.getByRoom(roomId)
      setRoomAvailability((prev) => ({ ...prev, [roomId]: availability }))
      return availability
    } catch (error) {
      console.error(`Failed to load availability for room ${roomId}:`, error)
      return []
    }
  }

  const handleOpenAvailabilityModal = async (room: Room) => {
    // Always fetch fresh availability data when opening the modal
    const availability = await loadRoomAvailability(room.id)
    setManageAvailabilityModal({ isOpen: true, room, availability })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-900/50 text-green-300 border-green-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Booked':
        return 'bg-orange-900/60 text-orange-300 border-orange-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Maintenance':
        return 'bg-yellow-900/60 text-yellow-300 border-yellow-400/70 pt-1 font-varela uppercase tracking-wider'
      case 'Blocked':
        return 'bg-red-900/60 text-red-300 border-red-400/70 pt-1 font-varela uppercase tracking-wider'
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-400/70 pt-1 font-varela uppercase tracking-wider'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Room Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-vintage-2xl font-libre text-deep-brown font-bold">
          Manage Rooms
        </h2>
        <Button
          onClick={() => setAddRoomModal({ isOpen: true })}
          className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-white border-terracotta-rose/30 hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300 font-varela"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Rooms List */}
      {rooms.length === 0 ? (
        <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30">
          <CardContent className="py-12 text-center">
            <Bed className="h-16 w-16 text-terracotta-rose/60 mx-auto mb-4" />
            <h3 className="text-vintage-xl font-libre text-creamy-yellow mb-2">
              No Rooms Yet
            </h3>
            <p className="text-vintage-base text-creamy-yellow/60 font-varela mb-6">
              Get started by adding your first room.
            </p>
            <Button
              onClick={() => setAddRoomModal({ isOpen: true })}
              className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-white border-terracotta-rose/30 hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300 font-varela"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-lg flex items-center justify-center">
                      <Bed className="h-5 w-5 text-creamy-white" />
                    </div>
                    <div>
                      <CardTitle className="text-vintage-lg font-libre text-creamy-yellow">
                        Room {room.room_number}
                      </CardTitle>
                      <p className="text-vintage-sm text-creamy-yellow/70 font-varela">
                        {room.room_type}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${room.is_active
                        ? 'bg-green-800/40 text-green-300 border-green-400/60'
                        : 'bg-red-800/40 text-red-300 border-red-400/60'
                      } pt-0.5 font-varela`}
                  >
                    {room.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Room Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-vintage-sm font-varela text-creamy-yellow/80">
                    <Users className="h-4 w-4 text-terracotta-rose" />
                    Max: {room.max_occupancy} guests
                  </div>
                  {room.description && (
                    <p className="text-vintage-sm text-creamy-yellow/70 font-varela line-clamp-2">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-terracotta-rose/30">
                  <Button
                    onClick={() => toggleRoom(room.id)}
                    size="sm"
                    className="flex-1 bg-terracotta-rose/20 text-creamy-yellow border-terracotta-rose/30 hover:bg-terracotta-rose/30 font-varela"
                  >
                    {expandedRooms.has(room.id) ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Details
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setEditRoomModal({ isOpen: true, room })}
                    size="sm"
                    className="bg-yellow-400/60 text-deep-brown border-yellow-400/70 hover:bg-yellow-400/40 font-varela"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleOpenAvailabilityModal(room)}
                    size="sm"
                    className="bg-terracotta-orange/60 text-white border-terracotta-orange/70 hover:bg-terracotta-orange/40 font-varela"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>

                {/* Expanded Details */}
                {expandedRooms.has(room.id) && (
                  <div className="pt-3 border-t border-terracotta-rose/30 space-y-3">
                    <h5 className="text-vintage-sm font-libre font-bold text-creamy-yellow">
                      Availability Schedule
                    </h5>
                    {!roomAvailability[room.id] || roomAvailability[room.id]?.length === 0 ? (
                      <p className="text-vintage-sm text-creamy-yellow/60 font-varela">
                        No availability data
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {roomAvailability[room.id]?.slice(0, 5).map((avail) => (
                          <div
                            key={avail.id}
                            className="flex items-center justify-between p-2 bg-terracotta-rose/10 rounded text-vintage-sm font-varela"
                          >
                            <div>
                              <p className="text-creamy-yellow font-medium">
                                {new Date(avail.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-creamy-yellow/70 text-vintage-xs">
                                ${Number(avail.price_per_night).toFixed(2)}/night
                              </p>
                            </div>
                            <Badge className={getStatusBadgeColor(avail.status)}>
                              {avail.status}
                            </Badge>
                          </div>
                        ))}
                        {roomAvailability[room.id]?.length > 5 && (
                          <p className="text-vintage-xs text-creamy-yellow/60 font-varela text-center">
                            +{roomAvailability[room.id].length - 5} more dates
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddRoomModal
        isOpen={addRoomModal.isOpen}
        onClose={() => setAddRoomModal({ isOpen: false })}
        hotelId={hotelId}
        accessToken={accessToken}
        onSuccess={() => {
          setAddRoomModal({ isOpen: false })
          onRefresh()
        }}
      />

      {editRoomModal.room && (
        <EditRoomModal
          isOpen={editRoomModal.isOpen}
          onClose={() => setEditRoomModal({ isOpen: false, room: null })}
          room={editRoomModal.room}
          accessToken={accessToken}
          onSuccess={() => {
            setEditRoomModal({ isOpen: false, room: null })
            onRefresh()
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
