"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { roomsApi } from "@/lib/api/dashboard"

interface AddRoomModalProps {
  isOpen: boolean
  onClose: () => void
  hotelId: string
  accessToken: string
  onSuccess: () => void
}

export function AddRoomModal({ isOpen, onClose, hotelId, accessToken, onSuccess }: AddRoomModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: '',
    description: '',
    max_occupancy: '2',
    bed_configuration: '',
    size_sqm: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await roomsApi.create(accessToken, hotelId, {
        room_number: formData.room_number,
        room_type: formData.room_type,
        description: formData.description || undefined,
        max_occupancy: parseInt(formData.max_occupancy),
        bed_configuration: formData.bed_configuration || undefined,
        size_sqm: formData.size_sqm ? parseFloat(formData.size_sqm) : undefined,
        is_active: true,
        hotel_id: hotelId,
      })
      
      // Reset form and close
      setFormData({
        room_number: '',
        room_type: '',
        description: '',
        max_occupancy: '2',
        bed_configuration: '',
        size_sqm: '',
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Room" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-300 text-vintage-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              Room Number *
            </label>
            <input
              type="text"
              required
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
              placeholder="e.g., 101"
            />
          </div>

          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              Room Type *
            </label>
            <input
              type="text"
              required
              value={formData.room_type}
              onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
              placeholder="e.g., Deluxe Suite"
            />
          </div>
        </div>

        <div>
          <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
            rows={3}
            placeholder="Room description..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              Max Occupancy *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.max_occupancy}
              onChange={(e) => setFormData({ ...formData, max_occupancy: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
            />
          </div>

          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              Bed Configuration
            </label>
            <input
              type="text"
              value={formData.bed_configuration}
              onChange={(e) => setFormData({ ...formData, bed_configuration: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
              placeholder="e.g., 1 King"
            />
          </div>

          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              Size (m²)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.size_sqm}
              onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
              placeholder="35.5"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Room'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
