"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Users, Plane, Hotel, Utensils, Search, Plus, Minus } from "lucide-react"
import { HotelApiService } from "@/lib/api/hotels"

export default function Hero() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("hotels")
  const [guests, setGuests] = useState(2)
  const [rooms, setRooms] = useState(1)
  
  // Form input states
  const [destination, setDestination] = useState("")
  const [departure, setDeparture] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [time, setTime] = useState("")
  const [travelClass, setTravelClass] = useState("economy")
  
  // Hotel search specific states
  const [popularCities, setPopularCities] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [filteredCities, setFilteredCities] = useState<string[]>([])
  const [searching, setSearching] = useState(false)

  // Load popular cities for hotel search
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cities = await HotelApiService.getPopularCities()
        setPopularCities(cities)
      } catch (error) {
        console.error('Failed to load popular cities:', error)
      }
    }
    if (activeTab === "hotels") {
      loadCities()
    }
  }, [activeTab])

  // Filter cities based on input
  useEffect(() => {
    if (destination && popularCities.length > 0) {
      const filtered = popularCities.filter(city =>
        city.toLowerCase().includes(destination.toLowerCase())
      )
      setFilteredCities(filtered.slice(0, 6)) // Show top 6 matches
    } else {
      setFilteredCities(popularCities.slice(0, 6)) // Show top 6 cities
    }
  }, [destination, popularCities])

  // Clear form data when tab changes
  useEffect(() => {
    setDestination("")
    setDeparture("")
    setCheckIn("")
    setCheckOut("")
    setTime("")
    setTravelClass("economy")
    setGuests(2)
    setRooms(1)
    setShowCitySuggestions(false)
  }, [activeTab])

  const tabs = [
    { id: "hotels", label: "Hotels", icon: Hotel },
    { id: "restaurants", label: "Restaurants", icon: Utensils },
    { id: "transportation", label: "Transportation", icon: Plane },
  ]

  // Handle city selection from suggestions
  const handleCitySelect = (city: string) => {
    setDestination(city)
    setShowCitySuggestions(false)
  }

  // Handle hotel search
  const handleHotelSearch = async () => {
    if (!destination.trim()) {
      alert('Please enter a destination')
      return
    }
    
    if (!checkIn) {
      alert('Please select a check-in date')
      return
    }
    
    if (!checkOut) {
      alert('Please select a check-out date')
      return
    }
    
    if (new Date(checkIn) >= new Date(checkOut)) {
      alert('Check-out date must be after check-in date')
      return
    }

    setSearching(true)

    try {
      // Build URL search parameters
      const params = new URLSearchParams({
        city: destination,
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_guests: guests.toString(),
        number_of_rooms: rooms.toString(),
      })

      // Navigate to results page
      router.push(`/hotels/results?${params.toString()}`)
    } catch (error) {
      console.error('Search error:', error)
      alert('An error occurred while searching. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  // Handle search based on active tab
  const handleSearch = () => {
    if (activeTab === "hotels") {
      handleHotelSearch()
    } else {
      // Handle other search types (restaurants, transportation)
      alert(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} search coming soon!`)
    }
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-walnut-darkest/95 via-transparent to-walnut-darkest/70"></div>
      </div>

      {/* Warm lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-copper-accent/8 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-copper-light/6 rounded-full blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Header Content */}
          <div className="mb-12">
            {/* Decorative element */}
            <div className="mb-8">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mb-4"></div>
              <p className="text-copper-accent font-great-vibes text-vintage-2xl">Your Complete Travel Companion</p>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-4"></div>
            </div>

            <h1 className="text-vintage-4xl md:text-vintage-6xl font-playfair font-bold text-cream-light mb-6 leading-tight animate-fade-in">
              Discover, Book & Experience
              <span className="block text-copper-accent font-great-vibes text-vintage-5xl md:text-vintage-6xl font-normal italic mt-2">
                Luxury Travel
              </span>
            </h1>

            <p
              className="text-vintage-lg md:text-vintage-xl text-cream-light/85 mb-8 max-w-3xl mx-auto leading-relaxed font-cormorant font-light animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Your all-in-one platform for luxury accommodations, exquisite dining, and premium transportation.
              Experience seamless booking with unparalleled service.
            </p>
          </div>

          {/* Search Interface */}
          <Card
            className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl animate-fade-in max-w-5xl mx-auto"
            style={{ animationDelay: "0.4s" }}
          >
            <CardContent className="px-8 py-4">
              {/* Search Tabs */}
              <div className="flex flex-wrap justify-center mb-8  bg-walnut-darkest/50 rounded-lg p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-cinzel font-semibold text-vintage-sm shadow-copper-accent/30 scale-[1.02] uppercase transform-gpu disabled:opacity-50 disabled:cursor-not-allowed tracking-wider transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark shadow-lg"
                        : "text-cream-light hover:text-copper-accent hover:bg-walnut-dark/50"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Form */}
              <div className="space-y-6">
                {/* Destination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 relative">
                    <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-copper-accent" />
                      <span>Destination</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Where would you like to go?"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        onFocus={() => activeTab === "hotels" && setShowCitySuggestions(true)}
                        className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                      />
                      
                      {/* City suggestions dropdown for hotels */}
                      {activeTab === "hotels" && showCitySuggestions && filteredCities.length > 0 && (
                        <div className="absolute z-50 w-full bg-walnut-dark/95 backdrop-blur-sm border border-copper-accent/30 rounded-lg mt-1 shadow-2xl max-h-48 overflow-y-auto">
                          {filteredCities.map((city, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-4 py-2 text-cream-light hover:bg-copper-accent/20 focus:bg-copper-accent/20 font-cormorant text-vintage-base transition-all duration-200"
                              onClick={() => handleCitySelect(city)}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {activeTab === "transportation" && (
                    <div className="space-y-2">
                      <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-copper-accent" />
                        <span>Departure</span>
                      </label>
                      <input
                        type="text"
                        placeholder="From where?"
                        value={departure}
                        onChange={(e) => setDeparture(e.target.value)}
                        className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-copper-accent" />
                      <span>{activeTab === "restaurants" ? "Date" : "Check-in"}</span>
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={today}
                      className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                    />
                  </div>

                  {activeTab !== "restaurants" && (
                    <div className="space-y-2">
                      <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-copper-accent" />
                        <span>Check-out</span>
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn || tomorrow}
                        className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                      />
                    </div>
                  )}

                  {activeTab === "restaurants" && (
                    <div className="space-y-2">
                      <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-copper-accent" />
                        <span>Time</span>
                      </label>
                      <select 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                      >
                        <option value="">Select time</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="12:30">12:30 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="13:30">1:30 PM</option>
                        <option value="19:00">7:00 PM</option>
                        <option value="19:30">7:30 PM</option>
                        <option value="20:00">8:00 PM</option>
                        <option value="20:30">8:30 PM</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Guests and Rooms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                      <Users className="h-4 w-4 text-copper-accent" />
                      <span>{activeTab === "restaurants" ? "Party Size" : "Guests"}</span>
                    </label>
                    <div className="flex items-center space-x-4 px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-cream-light font-cormorant text-vintage-base font-medium flex-1 text-center">
                        {guests} {guests === 1 ? "Guest" : "Guests"}
                      </span>
                      <button
                        onClick={() => setGuests(guests + 1)}
                        className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {activeTab === "hotels" && (
                    <div className="space-y-2">
                      <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                        <Hotel className="h-4 w-4 text-copper-accent" />
                        <span>Rooms</span>
                      </label>
                      <div className="flex items-center space-x-4 px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg">
                        <button
                          onClick={() => setRooms(Math.max(1, rooms - 1))}
                          className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-cream-light font-cormorant text-vintage-base font-medium flex-1 text-center">
                          {rooms} {rooms === 1 ? "Room" : "Rooms"}
                        </span>
                        <button
                          onClick={() => setRooms(rooms + 1)}
                          className="p-1 text-copper-accent hover:bg-copper-accent hover:text-walnut-dark rounded transition-all duration-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "transportation" && (
                    <div className="space-y-2">
                      <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                        <Plane className="h-4 w-4 text-copper-accent" />
                        <span>Travel Class</span>
                      </label>
                      <select 
                        value={travelClass}
                        onChange={(e) => setTravelClass(e.target.value)}
                        className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                      >
                        <option value="economy">Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Search Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleSearch}
                    disabled={searching}
                    className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-8 py-4 rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 text-vintage-lg tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    <Search className="mr-3 h-5 w-5" />
                    {searching ? "Searching..." : `Search ${activeTab === "hotels" ? "Hotels" : activeTab === "restaurants" ? "Restaurants" : "Transportation"}`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="text-center group">
              <div className="text-vintage-3xl font-playfair font-bold text-cream-light mb-1">50K+</div>
              <div className="text-cream-light/70 font-cormorant text-vintage-base tracking-wide">Hotels</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-playfair font-bold text-cream-light mb-1">25K+</div>
              <div className="text-cream-light/70 font-cormorant text-vintage-base tracking-wide">Restaurants</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-playfair font-bold text-cream-light mb-1">500+</div>
              <div className="text-cream-light/70 font-cormorant text-vintage-base tracking-wide">Airlines</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-playfair font-bold text-cream-light mb-1">150+</div>
              <div className="text-cream-light/70 font-cormorant text-vintage-base tracking-wide">Countries</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Close suggestions when clicking outside */}
      {showCitySuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowCitySuggestions(false)}
        />
      )}
    </section>
  )
}
