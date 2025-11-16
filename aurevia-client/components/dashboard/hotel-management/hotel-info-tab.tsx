"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Building2, Edit, Save, X, Plus, Trash2 } from "lucide-react"
import type { Hotel } from "@/types/dashboard"
import { hotelsApi } from "@/lib/api/dashboard"
import { toast } from "sonner"

interface HotelInfoTabProps {
  hotel: Hotel
  accessToken: string
  onRefresh: () => void
}

export default function HotelInfoTab({ hotel, accessToken, onRefresh }: HotelInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingAmenities, setIsEditingAmenities] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: hotel.name,
    description: hotel.description,
    address: hotel.address,
    city: hotel.city,
    state: hotel.state,
    zip_code: hotel.zip_code,
    country: hotel.country,
    phone_number: hotel.phone_number,
    is_active: hotel.is_active
  })

  // Mock amenities - you'll need to add this to your Hotel type
  const [amenities, setAmenities] = useState<string[]>([
    'WiFi',
    'Parking',
    'Pool',
    'Gym',
    'Restaurant',
    'Room Service'
  ])
  const [newAmenity, setNewAmenity] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await hotelsApi.update(hotel.id, formData)
      toast.success('Hotel information updated successfully')
      setIsEditing(false)
      onRefresh()
    } catch (error) {
      console.error('Failed to update hotel:', error)
      toast.error('Failed to update hotel information')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      state: hotel.state,
      zip_code: hotel.zip_code,
      country: hotel.country,
      phone_number: hotel.phone_number,
      is_active: hotel.is_active
    })
    setIsEditing(false)
  }

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()])
      setNewAmenity('')
      toast.success('Amenity added')
    }
  }

  const handleRemoveAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity))
    toast.success('Amenity removed')
  }

  return (
    <div className="space-y-6">
      {/* Hotel Information Card */}
      <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-vintage-2xl font-libre text-creamy-yellow flex items-center gap-2">
              <Building2 className="h-6 w-6 text-terracotta-rose" />
              Hotel Information
            </CardTitle>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-yellow-500/70 to-yellow-600/80 text-white border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 font-varela"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="bg-transparent border-terracotta-rose/30 text-creamy-yellow hover:bg-terracotta-rose/10 font-varela"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-green-500/70 to-green-600/80 text-white border-green-500/30 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 font-varela"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hotel Name */}
          <div className="space-y-2">
            <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
              Hotel Name
            </label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
              />
            ) : (
              <p className="text-creamy-yellow/90 font-varela text-vintage-base">
                {hotel.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
              />
            ) : (
              <p className="text-creamy-yellow/90 font-varela text-vintage-base">
                {hotel.description}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
                Street Address
              </label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
                />
              ) : (
                <p className="text-creamy-yellow/90 font-varela text-vintage-base">
                  {hotel.address}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
                City
              </label>
              {isEditing ? (
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
                />
              ) : (
                <p className="text-creamy-yellow/90 font-varela text-vintage-base">
                  {hotel.city}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
                State
              </label>
              {isEditing ? (
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
                />
              ) : (
                <p className="text-creamy-yellow/90 font-varela text-vintage-base">
                  {hotel.state}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
                ZIP Code
              </label>
              {isEditing ? (
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
                />
              ) : (
                <p className="text-creamy-yellow/90 font-varela text-vintage-base">
                  {hotel.zip_code}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
                Country
              </label>
              {isEditing ? (
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
                />
              ) : (
                <p className="text-creamy-yellow/90 font-varela text-vintage-base">
                  {hotel.country}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
              Phone Number
            </label>
            {isEditing ? (
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
              />
            ) : (
              <p className="text-creamy-yellow/90 font-varela text-vintage-base">
                {hotel.phone_number}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
              Status
            </label>
            {isEditing ? (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.is_active}
                    onChange={() => setFormData({ ...formData, is_active: true })}
                    className="w-4 h-4 text-terracotta-rose"
                  />
                  <span className="text-creamy-yellow/90 font-varela">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.is_active}
                    onChange={() => setFormData({ ...formData, is_active: false })}
                    className="w-4 h-4 text-terracotta-rose"
                  />
                  <span className="text-creamy-yellow/90 font-varela">Inactive</span>
                </label>
              </div>
            ) : (
              <Badge
                className={`${hotel.is_active
                    ? 'bg-green-800/40 text-green-300 border-green-400/60'
                    : 'bg-red-800/40 text-red-300 border-red-400/60'
                  } pt-0.5 font-varela`}
              >
                {hotel.is_active ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Amenities Card */}
      <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-vintage-2xl font-libre text-creamy-yellow">
              Hotel Amenities
            </CardTitle>
            <Button
              onClick={() => setIsEditingAmenities(!isEditingAmenities)}
              className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-white border-terracotta-rose/30 hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300 font-varela"
            >
              {isEditingAmenities ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Done
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Amenities
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingAmenities && (
            <div className="flex gap-2 pb-4 border-b border-terracotta-rose/30">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAmenity()}
                placeholder="Add new amenity..."
                className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow font-varela"
              />
              <Button
                onClick={handleAddAmenity}
                className="bg-gradient-to-r from-green-500/70 to-green-600/80 text-white border-green-500/30 hover:shadow-lg hover:shadow-green-500/30 font-varela"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {amenities.map((amenity, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-terracotta-rose/20 border border-terracotta-rose/40 rounded-lg"
              >
                <span className="text-creamy-yellow font-varela text-vintage-base">
                  {amenity}
                </span>
                {isEditingAmenities && (
                  <button
                    onClick={() => handleRemoveAmenity(amenity)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {amenities.length === 0 && (
            <p className="text-creamy-yellow/60 font-varela text-vintage-base text-center py-8">
              No amenities added yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
