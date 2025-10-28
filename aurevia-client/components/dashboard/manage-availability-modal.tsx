"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { availabilityApi } from "@/lib/api/dashboard"
import { Calendar, Plus, Trash2, Edit2, X, Save } from "lucide-react"
import type { RoomAvailability } from "@/types/dashboard"

interface ManageAvailabilityModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  roomNumber: string
  accessToken: string
  existingAvailability: RoomAvailability[]
  onSuccess: () => void
}

export function ManageAvailabilityModal({ 
  isOpen, 
  onClose, 
  roomId, 
  roomNumber,
  accessToken, 
  existingAvailability,
  onSuccess 
}: ManageAvailabilityModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availabilityList, setAvailabilityList] = useState<RoomAvailability[]>(existingAvailability)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    available_units: '',
    price_per_night: '',
  })
  const [newAvailability, setNewAvailability] = useState({
    start_date: '',
    end_date: '',
    available_units: '1',
    price_per_night: '',
  })

  // Update local list when prop changes or when modal opens
  useEffect(() => {
    if (isOpen) {
      setAvailabilityList(existingAvailability)
    }
  }, [isOpen, existingAvailability])

  // Fetch fresh availability data
  const refreshAvailability = async () => {
    try {
      const availability = await availabilityApi.getByRoom(roomId)
      setAvailabilityList(availability)
      onSuccess() // Also notify parent to update its state
    } catch (err) {
      console.error('Failed to refresh availability:', err)
    }
  }

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const startDate = new Date(newAvailability.start_date)
      const endDate = new Date(newAvailability.end_date)
      
      // Generate dates between start and end
      const dates = []
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d))
      }

      // Create availability for each date
      await Promise.all(
        dates.map(date =>
          availabilityApi.create(roomId, {
            room_id: roomId,
            date: date.toISOString().split('T')[0],
            available_units: parseInt(newAvailability.available_units),
            price_per_night: parseFloat(newAvailability.price_per_night),
            status: "Available",
          })
        )
      )

      // Reset form
      setNewAvailability({
        start_date: '',
        end_date: '',
        available_units: '1',
        price_per_night: '',
      })
      
      // Refresh the availability list to show new entries
      await refreshAvailability()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add availability')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAvailability = async (availId: string) => {
    if (!confirm('Delete this availability entry?')) return

    try {
      await availabilityApi.delete(availId)
      // Refresh the availability list to show updated entries
      await refreshAvailability()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete availability')
    }
  }

  const startEditing = (avail: RoomAvailability) => {
    setEditingId(avail.id)
    setEditForm({
      available_units: String(avail.available_units),
      price_per_night: String(avail.price_per_night),
    })
    setError(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({
      available_units: '',
      price_per_night: '',
    })
  }

  const handleUpdateAvailability = async (avail: RoomAvailability) => {
    setLoading(true)
    setError(null)

    try {
      // Extract date in YYYY-MM-DD format for the API
      const dateStr = new Date(avail.date).toISOString().split('T')[0]
      
      await availabilityApi.update(roomId, dateStr, {
        available_units: parseInt(editForm.available_units),
        price_per_night: parseFloat(editForm.price_per_night),
      })

      // Refresh the availability list to show updated entries
      await refreshAvailability()
      cancelEditing()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Availability - Room ${roomNumber}`} size="lg">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-300 text-vintage-sm">
            {error}
          </div>
        )}

        {/* Add New Availability */}
        <div className="bg-walnut-medium/50 border border-copper-accent/20 rounded-lg p-6">
          <h3 className="text-cream-light font-playfair text-vintage-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-copper-accent" />
            Add Availability
          </h3>
          <form onSubmit={handleAddAvailability} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={newAvailability.start_date}
                  onChange={(e) => setNewAvailability({ ...newAvailability, start_date: e.target.value })}
                  className="w-full px-4 py-2 bg-walnut-dark border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                />
              </div>

              <div>
                <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={newAvailability.end_date}
                  onChange={(e) => setNewAvailability({ ...newAvailability, end_date: e.target.value })}
                  className="w-full px-4 py-2 bg-walnut-dark border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
                  Available Units *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newAvailability.available_units}
                  onChange={(e) => setNewAvailability({ ...newAvailability, available_units: e.target.value })}
                  className="w-full px-4 py-2 bg-walnut-dark border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                />
              </div>

              <div>
                <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
                  Price per Night *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={newAvailability.price_per_night}
                  onChange={(e) => setNewAvailability({ ...newAvailability, price_per_night: e.target.value })}
                  className="w-full px-4 py-2 bg-walnut-dark border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Availability'}
            </Button>
          </form>
        </div>

        {/* Existing Availability */}
        <div>
          <h3 className="text-cream-light font-playfair text-vintage-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-copper-accent" />
            Existing Availability ({availabilityList.length} entries)
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availabilityList.length === 0 ? (
              <p className="text-cream-light/60 font-cormorant text-vintage-base text-center py-8">
                No availability set yet
              </p>
            ) : (
              availabilityList.map((avail) => (
                <div
                  key={avail.id}
                  className="bg-walnut-medium/50 border border-copper-accent/20 p-3 rounded"
                >
                  {editingId === avail.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-cream-light font-cormorant text-vintage-base">
                          {new Date(avail.date).toLocaleDateString()}
                        </span>
                        <span className={`font-cinzel text-vintage-xs px-2 py-1 rounded ${
                          avail.status 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {avail.status ? 'Available' : 'Booked'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-cream-light/80 font-cormorant text-vintage-sm mb-1">
                            Available Units
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.available_units}
                            onChange={(e) => setEditForm({ ...editForm, available_units: e.target.value })}
                            className="w-full px-3 py-1.5 bg-walnut-dark border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent text-vintage-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-cream-light/80 font-cormorant text-vintage-sm mb-1">
                            Price per Night
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.price_per_night}
                            onChange={(e) => setEditForm({ ...editForm, price_per_night: e.target.value })}
                            className="w-full px-3 py-1.5 bg-walnut-dark border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent text-vintage-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={cancelEditing}
                          size="sm"
                          variant="outline"
                          className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
                          disabled={loading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleUpdateAvailability(avail)}
                          size="sm"
                          className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel"
                          disabled={loading}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {loading ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-cream-light font-cormorant text-vintage-base">
                          {new Date(avail.date).toLocaleDateString()}
                        </span>
                        <span className="text-cream-light/80 font-cormorant text-vintage-sm">
                          {avail.available_units} units
                        </span>
                        <span className="text-cream-light/80 font-cormorant text-vintage-sm">
                          ${avail.price_per_night ? Number(avail.price_per_night).toFixed(2) : '0.00'}/night
                        </span>
                        <span className={`font-cinzel text-vintage-xs px-2 py-1 rounded ${
                          avail.status 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {avail.status ? 'Available' : 'Booked'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {/* Only allow editing if status is available */}
                        {avail.status && (
                          <Button
                            onClick={() => startEditing(avail)}
                            size="sm"
                            variant="outline"
                            className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteAvailability(avail.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-300 border-red-500/30 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-copper-accent/30">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}
