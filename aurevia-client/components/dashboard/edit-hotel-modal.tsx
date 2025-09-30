"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { hotelsApi } from "@/lib/api/dashboard"
import type { Hotel } from "@/types/dashboard"

interface EditHotelModalProps {
  isOpen: boolean
  onClose: () => void
  hotel: Hotel
  accessToken: string
  onSuccess: () => void
}

export function EditHotelModal({ isOpen, onClose, hotel, accessToken, onSuccess }: EditHotelModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    phone_number: '',
  })

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        description: hotel.description || '',
        address: hotel.address || '',
        city: hotel.city || '',
        state: hotel.state || '',
        zip_code: hotel.zip_code || '',
        country: hotel.country || '',
        phone_number: hotel.phone_number || '',
      })
    }
  }, [hotel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await hotelsApi.update(accessToken, hotel.id, formData)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update hotel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Hotel" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-300 text-vintage-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
            Hotel Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
          />
        </div>

        <div>
          <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
            Description *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
            Address *
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              City *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
            />
          </div>

          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              State/Province *
            </label>
            <input
              type="text"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              Zip Code *
            </label>
            <input
              type="text"
              required
              value={formData.zip_code}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
            />
          </div>

          <div>
            <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
              Country *
            </label>
            <input
              type="text"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-cream-light font-cormorant text-vintage-base mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="w-full px-4 py-2 bg-walnut-medium border border-copper-accent/30 rounded text-cream-light font-cormorant focus:outline-none focus:border-copper-accent"
          />
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
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
