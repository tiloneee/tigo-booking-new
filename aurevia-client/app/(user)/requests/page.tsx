"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, Hotel as HotelIcon, MapPin, Star, RefreshCw, DollarSign, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { balanceApi } from "@/lib/api/balance"
import { useBalanceWebSocket } from "@/lib/hooks/use-balance-websocket"
import { hotelRequestApi } from "@/lib/api/hotel-requests"
import { hotelDeletionRequestApi } from "@/lib/api/hotel-deletion-requests"
import { hotelsApi } from "@/lib/api/dashboard"
import type { Hotel } from "@/types/dashboard"
import { hasRole } from "@/lib/api"

export default function RequestPage() {
  const { user, refreshUser } = useAuth()
  
  // Topup form state
  const [topupAmount, setTopupAmount] = useState("")
  const [topupLoading, setTopupLoading] = useState(false)

  // Hotel request form state
  const [hotelName, setHotelName] = useState("")
  const [hotelAddress, setHotelAddress] = useState("")
  const [hotelCity, setHotelCity] = useState("")
  const [hotelState, setHotelState] = useState("")
  const [hotelZipCode, setHotelZipCode] = useState("")
  const [hotelCountry, setHotelCountry] = useState("")
  const [hotelPhoneNumber, setHotelPhoneNumber] = useState("")
  const [hotelDescription, setHotelDescription] = useState("")
  const [hotelLoading, setHotelLoading] = useState(false)

  // Hotel deletion request state
  const [ownedHotels, setOwnedHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState("")
  const [deletionReason, setDeletionReason] = useState("")
  const [deletionLoading, setDeletionLoading] = useState(false)
  const [hotelsLoading, setHotelsLoading] = useState(false)

  const { currentBalance, isConnected, refreshBalance } = useBalanceWebSocket()

  // Check if user is hotel owner
  const isHotelOwner = hasRole(user, 'HotelOwner')

  // Load owned hotels for hotel owners
  useEffect(() => {
    const loadOwnedHotels = async () => {
      if (!isHotelOwner) return

      try {
        setHotelsLoading(true)
        const hotels = await hotelsApi.getOwned()
        // Filter only active hotels
        setOwnedHotels(hotels.filter(h => h.is_active))
      } catch (error) {
        console.error('Error loading owned hotels:', error)
        toast.error('Failed to load your hotels')
      } finally {
        setHotelsLoading(false)
      }
    }

    loadOwnedHotels()
  }, [isHotelOwner])

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTopupLoading(true)

    try {
      await balanceApi.createTopupRequest({
        amount: parseFloat(topupAmount)
      })
      
      toast.success(`Topup request of $${topupAmount} submitted successfully! Waiting for admin approval.`)
      setTopupAmount("")
      refreshBalance()
      
      // Note: Balance will update after admin approves the request
      // You can refresh the page or the balance will update when navigating back
    } catch (error: any) {
      console.error('Topup error:', error)
      toast.error(error.response?.data?.message || "Failed to submit topup request. Please try again.")
    } finally {
      setTopupLoading(false)
    }
  }

  const handleHotelRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHotelLoading(true)

    try {
      await hotelRequestApi.createHotelRequest({
        name: hotelName,
        description: hotelDescription,
        address: hotelAddress,
        city: hotelCity,
        state: hotelState,
        zip_code: hotelZipCode,
        country: hotelCountry,
        phone_number: hotelPhoneNumber,
      })
      
      toast.success(`Hotel request for "${hotelName}" submitted successfully! Waiting for admin approval.`)
      
      // Reset form
      setHotelName("")
      setHotelDescription("")
      setHotelAddress("")
      setHotelCity("")
      setHotelState("")
      setHotelZipCode("")
      setHotelCountry("")
      setHotelPhoneNumber("")
    } catch (error: any) {
      console.error('Hotel request error:', error)
      toast.error(error.response?.data?.message || "Failed to submit hotel request. Please try again.")
    } finally {
      setHotelLoading(false)
    }
  }

  const handleDeletionRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedHotelId) {
      toast.error('Please select a hotel')
      return
    }

    if (!deletionReason.trim() || deletionReason.length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)')
      return
    }

    setDeletionLoading(true)

    try {
      const selectedHotel = ownedHotels.find(h => h.id === selectedHotelId)
      await hotelDeletionRequestApi.createHotelDeletionRequest(selectedHotelId, {
        reason: deletionReason,
      })
      
      toast.success(`Deletion request for "${selectedHotel?.name}" submitted successfully! Waiting for admin approval.`)
      
      // Reset form
      setSelectedHotelId("")
      setDeletionReason("")
      
      // Reload hotels list
      const hotels = await hotelsApi.getOwned()
      setOwnedHotels(hotels.filter(h => h.is_active))
    } catch (error: any) {
      console.error('Hotel deletion request error:', error)
      toast.error(error.response?.data?.message || "Failed to submit deletion request. Please try again.")
    } finally {
      setDeletionLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white">
        <Header />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <div className="text-center mb-12">
              <h1 className="text-vintage-4xl md:text-vintage-5xl font-libre font-bold text-deep-brown mb-4 tracking-wide">
                Request{" "}
                <span className="text-terracotta-rose font-great-vibes text-vintage-5xl font-normal italic">
                  Hub
                </span>
              </h1>
              <p className="text-vintage-lg text-terracotta-rose font-varela font-light leading-relaxed">
                Manage your account balance and submit hotel requests
              </p>
            </div>

            {/* Tabs Card */}
            <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border border-terracotta-rose/30 shadow-2xl">
              <CardContent className="p-6">
                <Tabs defaultValue="topup" className="w-full">
                  <TabsList className={`grid w-full ${isHotelOwner ? 'grid-cols-3' : 'grid-cols-2'} mb-8`}>
                    <TabsTrigger value="topup" className="text-vintage-base">
                      <Wallet className="h-4 w-4 mr-2" />
                      Topup Balance
                    </TabsTrigger>
                    <TabsTrigger value="hotel" className="text-vintage-base">
                      <HotelIcon className="h-4 w-4 mr-2" />
                      Hotel Request
                    </TabsTrigger>
                    {isHotelOwner && (
                      <TabsTrigger value="deletion" className="text-vintage-base">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Hotel
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Topup Balance Tab */}
                  <TabsContent value="topup">
                    <div className="space-y-6">
                      <div className="text-center py-4 pt-0">
                        <h2 className="text-vintage-2xl font-libre font-bold text-creamy-yellow mb-2">
                          Topup Your Balance
                        </h2>
                        <p className="text-vintage-base text-creamy-yellow/70 font-varela">
                          Add funds to your account for seamless bookings
                        </p>
                      </div>

                      <form onSubmit={handleTopupSubmit} className="space-y-6">
                        {/* Current Balance Display - Note: Balance is now managed by transaction system */}
                        <div className="flex items-center justify-between p-4 bg-creamy-yellow/40 border border-terracotta-rose/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Wallet className="h-5 w-5 text-deep-brown" />
                            <div>
                              <p className="text-vintage-sm text-deep-brown font-varela">Current Balance</p>
                              <p className="text-vintage-xl font-libre font-bold text-deep-brown">
                                ${currentBalance !== null ? Number(currentBalance).toFixed(2) : 'Loading...'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              onClick={refreshBalance}
                              className="p-2 hover:bg-deep-brown/10 rounded transition-colors"
                              title="Refresh balance"
                            >
                              <RefreshCw className="h-4 w-4 text-deep-brown" />
                            </button>
                            {isConnected && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-vintage-xs text-green-400">Live</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Topup Amount Input */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-terracotta-rose" />
                            Topup Amount
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="1"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            placeholder="Enter amount (e.g., 100.00)"
                            required
                            className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose "
                          />
                          <p className="text-creamy-yellow/50 font-varela text-vintage-sm">
                            Minimum topup amount: $1.00
                          </p>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="space-y-2">
                          <p className="text-creamy-yellow font-varela text-vintage-sm">Quick Select:</p>
                          <div className="grid grid-cols-5 gap-4">
                            {[10, 50, 100, 500, 1000].map((amount) => (
                              <Button
                                key={amount}
                                type="button"
                                onClick={() => setTopupAmount(amount.toString())}
                                className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 border-terracotta-rose/30 text-dark-brown font-libre text-sm hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300 text-vintage-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ${amount}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={topupLoading || !topupAmount}
                          className="w-full bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-libre font-semibold hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300 text-vintage-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {topupLoading ? (
                            <span className="flex items-center justify-center">
                              <span className="animate-spin mr-2">⏳</span>
                              Processing...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <Wallet className="h-4 w-4 mr-2" />
                              Submit Topup Request
                            </span>
                          )}
                        </Button>
                      </form>
                    </div>
                  </TabsContent>

                  {/* Hotel Request Tab */}
                  <TabsContent value="hotel">
                    <div className="space-y-6">
                      <div className="text-center py-4">
                        <h2 className="text-vintage-2xl font-libre font-bold text-creamy-yellow mb-2">
                          Submit Hotel Request
                        </h2>
                        <p className="text-vintage-base text-creamy-yellow/70 font-varela">
                          Request to add a new hotel to our luxury collection
                        </p>
                      </div>

                      <form onSubmit={handleHotelRequestSubmit} className="space-y-6">
                        {/* Hotel Name */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                            <HotelIcon className="h-4 w-4 mr-1 text-creamy-yellow" />
                            Hotel Name
                          </label>
                          <Input
                            type="text"
                            value={hotelName}
                            onChange={(e) => setHotelName(e.target.value)}
                            placeholder="Enter hotel name"
                            required
                            className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
                          />
                        </div>

                        {/* Hotel Description */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                            <Star className="h-4 w-4 mr-1 text-creamy-yellow" />
                            Hotel Description
                          </label>
                          <textarea
                            value={hotelDescription}
                            onChange={(e) => setHotelDescription(e.target.value)}
                            placeholder="Describe the hotel, amenities, and unique features..."
                            required
                            rows={4}
                            className="w-full bg-dark-brown/20 border border-terracotta-rose/30 text-vintage-base text-creamy-yellow placeholder:text-creamy-yellow/40 focus:border-terracotta-rose font-varela rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-rose/50"
                          />
                        </div>

                        {/* Hotel Address */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-creamy-yellow" />
                            Street Address
                          </label>
                          <Input
                            type="text"
                            value={hotelAddress}
                            onChange={(e) => setHotelAddress(e.target.value)}
                            placeholder="Enter street address"
                            required
                            className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
                          />
                        </div>

                        {/* City, State, Zip Code - Row */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-creamy-yellow font-varela text-vintage-sm font-medium">
                              City
                            </label>
                            <Input
                              type="text"
                              value={hotelCity}
                              onChange={(e) => setHotelCity(e.target.value)}
                              placeholder="City"
                              required
                              className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-creamy-yellow font-varela text-vintage-sm font-medium">
                              State/Province
                            </label>
                            <Input
                              type="text"
                              value={hotelState}
                              onChange={(e) => setHotelState(e.target.value)}
                              placeholder="State"
                              required
                              className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-creamy-yellow font-varela text-vintage-sm font-medium">
                              Zip Code
                            </label>
                            <Input
                              type="text"
                              value={hotelZipCode}
                              onChange={(e) => setHotelZipCode(e.target.value)}
                              placeholder="Zip"
                              required
                              className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
                            />
                          </div>
                        </div>

                        {/* Country */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium">
                            Country
                          </label>
                          <Input
                            type="text"
                            value={hotelCountry}
                            onChange={(e) => setHotelCountry(e.target.value)}
                            placeholder="Enter country"
                            required
                            className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
                          />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium">
                            Phone Number
                          </label>
                          <Input
                            type="tel"
                            value={hotelPhoneNumber}
                            onChange={(e) => setHotelPhoneNumber(e.target.value)}
                            placeholder="+84283829999"
                            required
                            className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
                          />
                          <p className="text-creamy-yellow/50 font-varela text-vintage-sm">
                            Use Vietnam format (e.g., +84283829999)
                          </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={hotelLoading}
                          className="w-full bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown font-varela font-semibold hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300 text-vintage-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {hotelLoading ? (
                            <span className="flex items-center justify-center">
                              <span className="animate-spin mr-2">⏳</span>
                              Submitting...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <HotelIcon className="h-4 w-4 mr-2" />
                              Submit Hotel Request
                            </span>
                          )}
                        </Button>
                      </form>
                    </div>
                  </TabsContent>

                  {/* Hotel Deletion Request Tab (Hotel Owners Only) */}
                  {isHotelOwner && (
                    <TabsContent value="deletion">
                      <div className="space-y-6">
                        <div className="text-center py-4">
                          <h2 className="text-vintage-2xl font-libre font-bold text-creamy-yellow mb-2">
                            Request Hotel Deletion
                          </h2>
                          <p className="text-vintage-base text-creamy-yellow/70 font-varela">
                            Submit a request to deactivate one of your hotels
                          </p>
                        </div>

                        {hotelsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-rose mx-auto mb-4"></div>
                            <p className="text-creamy-yellow/60 font-varela">Loading your hotels...</p>
                          </div>
                        ) : ownedHotels.length === 0 ? (
                          <div className="text-center py-8">
                            <AlertCircle className="h-16 w-16 text-terracotta-rose/60 mx-auto mb-4" />
                            <h3 className="text-vintage-lg text-creamy-yellow mb-2 font-libre">No Active Hotels</h3>
                            <p className="text-creamy-yellow/60 font-varela">
                              You don't have any active hotels to delete.
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleDeletionRequestSubmit} className="space-y-6">
                            {/* Hotel Selection */}
                            <div className="space-y-2">
                              <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                                <HotelIcon className="h-4 w-4 mr-1 text-creamy-yellow" />
                                Select Hotel to Delete
                              </label>
                              <select
                                value={selectedHotelId}
                                onChange={(e) => setSelectedHotelId(e.target.value)}
                                required
                                className="w-full bg-dark-brown/20 border border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-rose/50 focus:border-terracotta-rose"
                              >
                                <option value="">-- Select a hotel --</option>
                                {ownedHotels.map((hotel) => (
                                  <option key={hotel.id} value={hotel.id} className="bg-dark-brown text-creamy-yellow">
                                    {hotel.name} - {hotel.city}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Selected Hotel Info */}
                            {selectedHotelId && (
                              <div className="p-4 bg-terracotta-rose/10 border border-terracotta-rose/30 rounded-lg">
                                {(() => {
                                  const selectedHotel = ownedHotels.find(h => h.id === selectedHotelId)
                                  return selectedHotel ? (
                                    <div>
                                      <h4 className="text-vintage-lg font-libre font-semibold text-creamy-yellow mb-2">
                                        {selectedHotel.name}
                                      </h4>
                                      <p className="text-vintage-sm text-creamy-yellow/80 font-varela mb-1">
                                        📍 {selectedHotel.address}, {selectedHotel.city}
                                      </p>
                                      <p className="text-vintage-sm text-creamy-yellow/80 font-varela">
                                        ⭐ Rating: {selectedHotel.avg_rating}/5 ({selectedHotel.total_reviews} reviews)
                                      </p>
                                    </div>
                                  ) : null
                                })()}
                              </div>
                            )}

                            {/* Deletion Reason */}
                            <div className="space-y-2">
                              <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1 text-terracotta-rose" />
                                Reason for Deletion
                              </label>
                              <textarea
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                placeholder="Please provide a detailed reason for deleting this hotel (minimum 10 characters)..."
                                required
                                rows={5}
                                minLength={10}
                                className="w-full bg-dark-brown/20 border border-terracotta-rose/30 text-vintage-base text-creamy-yellow placeholder:text-creamy-yellow/40 focus:border-terracotta-rose font-varela rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-rose/50"
                              />
                              <p className="text-creamy-yellow/50 font-varela text-vintage-sm">
                                Minimum 10 characters required. This will be reviewed by an admin.
                              </p>
                            </div>

                            {/* Warning Message */}
                            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-vintage-base font-varela font-semibold text-red-300 mb-1">
                                    Important Notice
                                  </h4>
                                  <p className="text-vintage-sm text-red-200/80 font-varela">
                                    Submitting this request will notify admins to review your hotel deletion request. 
                                    If approved, your hotel will be deactivated and will no longer appear in search results. 
                                    This action requires admin approval and cannot be undone without contacting support.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                              type="submit"
                              disabled={deletionLoading || !selectedHotelId || !deletionReason.trim()}
                              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-varela font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 text-vintage-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletionLoading ? (
                                <span className="flex items-center justify-center">
                                  <span className="animate-spin mr-2">⏳</span>
                                  Submitting...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Submit Deletion Request
                                </span>
                              )}
                            </Button>
                          </form>
                        )}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>

            {/* Info Section */}
            <div className="mt-6 text-center">
              <p className="text-dark-brown/60 font-varela text-vintage-sm">
                All requests are subject to review and approval by our team.
                <br />
                You will be notified once your request has been processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
