"use client"

import { useSession } from "next-auth/react"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { User, Calendar, MapPin, Star } from "lucide-react"

export default function Dashboard() {
  const { data: session } = useSession()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest">
        <Header />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h1 className="text-vintage-4xl md:text-vintage-5xl font-playfair font-bold text-cream-light mb-4 tracking-wide">
                Welcome Back,{" "}
                <span className="text-copper-accent font-great-vibes text-vintage-5xl font-normal italic">
                  {session?.user?.name?.split(' ')[0] || 'Traveler'}
                </span>
              </h1>
              <p className="text-vintage-lg text-cream-light/80 font-cormorant font-light leading-relaxed">
                Your luxury travel dashboard awaits
              </p>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-walnut-dark" />
                    </div>
                    <div>
                      <h3 className="text-cream-light font-playfair text-vintage-xl font-bold">Profile</h3>
                      <p className="text-copper-accent font-cinzel text-vintage-sm uppercase tracking-wider">
                        Personal Information
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-cream-light/60 font-cormorant text-vintage-sm">Name</p>
                    <p className="text-cream-light font-cormorant text-vintage-base font-medium">
                      {session?.user?.name || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-cream-light/60 font-cormorant text-vintage-sm">Email</p>
                    <p className="text-cream-light font-cormorant text-vintage-base font-medium">
                      {session?.user?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-cream-light/60 font-cormorant text-vintage-sm">Role</p>
                    <p className="text-copper-accent font-cinzel text-vintage-sm uppercase tracking-wider">
                      {session?.roles?.join(', ') || 'Customer'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings Card */}
              <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-walnut-dark" />
                    </div>
                    <div>
                      <h3 className="text-cream-light font-playfair text-vintage-xl font-bold">Recent Bookings</h3>
                      <p className="text-copper-accent font-cinzel text-vintage-sm uppercase tracking-wider">
                        Your Travels
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-cream-light/60 font-cormorant text-vintage-base">
                      No bookings yet
                    </p>
                    <p className="text-cream-light/40 font-cormorant text-vintage-sm mt-2">
                      Start planning your luxury adventure
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Card */}
              <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-walnut-dark" />
                    </div>
                    <div>
                      <h3 className="text-cream-light font-playfair text-vintage-xl font-bold">Preferences</h3>
                      <p className="text-copper-accent font-cinzel text-vintage-sm uppercase tracking-wider">
                        Travel Style
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-cream-light/60 font-cormorant text-vintage-base">
                      No preferences set
                    </p>
                    <p className="text-cream-light/40 font-cormorant text-vintage-sm mt-2">
                      Customize your travel experience
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-12 text-center">
              <h2 className="text-vintage-2xl font-playfair font-bold text-cream-light mb-6">
                Quick Actions
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 text-vintage-base tracking-wider uppercase">
                  Book a Hotel
                </button>
                <button className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 text-vintage-base tracking-wider uppercase">
                  Explore Destinations
                </button>
                <button className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 text-vintage-base tracking-wider uppercase">
                  Manage Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 