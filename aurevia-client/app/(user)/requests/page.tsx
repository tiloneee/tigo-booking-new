"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, Hotel, Upload, MapPin, Image as ImageIcon, Star, DollarSign, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { balanceApi } from "@/lib/api/balance"
import { useBalanceWebSocket } from "@/lib/hooks/use-balance-websocket"

export default function RequestPage() {
  const { user, refreshUser } = useAuth()
  
  // Topup form state
  const [topupAmount, setTopupAmount] = useState("")
  const [topupLoading, setTopupLoading] = useState(false)

  // Hotel request form state
  const [hotelName, setHotelName] = useState("")
  const [hotelAddress, setHotelAddress] = useState("")
  const [hotelDescription, setHotelDescription] = useState("")
  const [hotelPrice, setHotelPrice] = useState("")
  const [hotelImages, setHotelImages] = useState<FileList | null>(null)
  const [hotelLoading, setHotelLoading] = useState(false)
  const { currentBalance, isConnected, refreshBalance } = useBalanceWebSocket()

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
      // TODO: Implement actual hotel request API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`Hotel request for "${hotelName}" submitted successfully!`)
      setHotelName("")
      setHotelAddress("")
      setHotelDescription("")
      setHotelPrice("")
      setHotelImages(null)
    } catch (error) {
      toast.error("Failed to submit hotel request. Please try again.")
    } finally {
      setHotelLoading(false)
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
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="topup" className="text-vintage-base">
                      <Wallet className="h-4 w-4 mr-2" />
                      Topup Balance
                    </TabsTrigger>
                    <TabsTrigger value="hotel" className="text-vintage-base">
                      <Hotel className="h-4 w-4 mr-2" />
                      Hotel Request
                    </TabsTrigger>
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
                            <Hotel className="h-4 w-4 mr-1 text-creamy-yellow" />
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

                        {/* Hotel Address */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-creamy-yellow" />
                            Hotel Address
                          </label>
                          <Input
                            type="text"
                            value={hotelAddress}
                            onChange={(e) => setHotelAddress(e.target.value)}
                            placeholder="Enter complete address"
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

                        {/* Starting Price */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-creamy-yellow" />
                            Starting Price (per night)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="1"
                            value={hotelPrice}
                            onChange={(e) => setHotelPrice(e.target.value)}
                            placeholder="Enter starting price"
                            required
                            className="bg-dark-brown/20 border-terracotta-rose/30 text-vintage-base text-creamy-yellow font-varela placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
                          />
                        </div>

                        {/* Hotel Images */}
                        <div className="space-y-2">
                          <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center">
                            <ImageIcon className="h-4 w-4 mr-1 text-creamy-yellow" />
                            Hotel Images
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => setHotelImages(e.target.files)}
                              className="hidden"
                              id="hotel-images"
                            />
                            <label
                              htmlFor="hotel-images"
                              className="flex items-center justify-center w-full px-4 py-3 bg-dark-brown/20 border-2 border-dashed border-terracotta-rose/30 rounded-md cursor-pointer hover:border-terracotta-rose/60 transition-colors"
                            >
                              <Upload className="h-5 w-5 text-terracotta-rose mr-2" />
                              <span className="text-creamy-yellow/70 font-varela text-vintage-base">
                                {hotelImages && hotelImages.length > 0
                                  ? `${hotelImages.length} file(s) selected`
                                  : "Click to upload images"}
                              </span>
                            </label>
                          </div>
                          <p className="text-creamy-yellow/50 font-varela text-vintage-sm">
                            Upload high-quality images of the hotel (multiple files allowed)
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
                              <Hotel className="h-4 w-4 mr-2" />
                              Submit Hotel Request
                            </span>
                          )}
                        </Button>
                      </form>
                    </div>
                  </TabsContent>
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
