"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MapPin, ArrowRight } from "lucide-react"

const showcaseData = {
  hotels: [
    {
      name: "The Grand Palazzo",
      location: "Venice, Italy",
      rating: 4.9,
      price: "$850",
      image: "/placeholder.svg?height=300&width=400",
      amenities: ["Spa", "Pool", "Restaurant", "Concierge"],
      description: "Luxury canal-side palace with Venetian elegance",
    },
    {
      name: "Château de Lumière",
      location: "Provence, France",
      rating: 4.8,
      price: "$1,200",
      image: "/placeholder.svg?height=300&width=400",
      amenities: ["Vineyard", "Spa", "Michelin Restaurant", "Golf"],
      description: "Historic château surrounded by lavender fields",
    },
  ],
  restaurants: [
    {
      name: "Le Bernardin",
      location: "New York, USA",
      rating: 4.9,
      price: "$$$$$",
      image: "/placeholder.svg?height=300&width=400",
      cuisine: "French Seafood",
      description: "Three Michelin stars, exquisite seafood artistry",
    },
    {
      name: "Osteria Francescana",
      location: "Modena, Italy",
      rating: 4.8,
      price: "$$$$$",
      image: "/placeholder.svg?height=300&width=400",
      cuisine: "Italian Contemporary",
      description: "World's finest Italian cuisine by Massimo Bottura",
    },
  ],
  transportation: [
    {
      name: "Private Jet Charter",
      route: "New York → Paris",
      price: "$45,000",
      image: "/placeholder.svg?height=300&width=400",
      aircraft: "Gulfstream G650",
      description: "Ultimate luxury with personalized service",
    },
    {
      name: "First Class Suite",
      route: "London → Tokyo",
      price: "$8,500",
      image: "/placeholder.svg?height=300&width=400",
      aircraft: "Emirates A380",
      description: "Private suite with shower and bar access",
    },
  ],
}

export default function BookingShowcase() {
  const [activeCategory, setActiveCategory] = useState("hotels")

  const categories = [
    { id: "hotels", label: "Luxury Hotels", icon: "🏨" },
    { id: "restaurants", label: "Fine Dining", icon: "🍽️" },
    { id: "transportation", label: "Premium Travel", icon: "✈️" },
  ]

  return (
    <section className="py-20 bg-walnut-darkest relative">
      {/* Warm lighting effects */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-copper-accent/4 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-copper-light/3 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Decorative element */}
          <div className="mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mb-3"></div>
            <p className="text-copper-accent font-great-vibes text-vintage-xl">Featured Selections</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-3"></div>
          </div>

          <h2 className="text-vintage-4xl md:text-vintage-5xl font-playfair font-bold text-cream-light mb-6 tracking-wide">
            Curated Luxury
            <span className="block text-copper-accent font-great-vibes text-vintage-5xl font-normal italic mt-2">
              Experiences
            </span>
          </h2>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center mb-12 bg-walnut-dark/30 rounded-lg p-2 max-w-2xl mx-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-cinzel font-semibold text-vintage-sm tracking-wider transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark shadow-lg"
                  : "text-cream-light hover:text-copper-accent hover:bg-walnut-dark/50"
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {showcaseData[activeCategory as keyof typeof showcaseData].map((item, index) => (
            <Card
              key={index}
              className="bg-walnut-dark/60 border border-copper-accent/20 overflow-hidden hover:shadow-2xl hover:shadow-copper-accent/20 transition-all duration-500 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-walnut-dark/80 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-walnut-dark/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-copper-accent fill-current" />
                    <span className="text-cream-light text-vintage-sm font-cormorant font-medium">
                      {item.rating || "Premium"}
                    </span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-vintage-xl font-playfair font-bold text-cream-light tracking-wide mb-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-cream-light/70">
                      <MapPin className="h-4 w-4 text-copper-accent" />
                      <span className="font-cormorant text-vintage-base">{item.location || item.route}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-copper-accent font-cinzel font-bold text-vintage-lg">{item.price}</div>
                    <div className="text-cream-light/60 text-vintage-xs font-cormorant">
                      {activeCategory === "hotels"
                        ? "per night"
                        : activeCategory === "restaurants"
                          ? "tasting menu"
                          : "per person"}
                    </div>
                  </div>
                </div>

                <p className="text-cream-light/70 mb-4 leading-relaxed font-cormorant text-vintage-base">
                  {item.description}
                </p>

                {activeCategory === "hotels" && "amenities" in item && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-copper-accent/20 text-copper-accent rounded text-vintage-xs font-cinzel tracking-wide"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}

                {activeCategory === "restaurants" && "cuisine" in item && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-copper-accent/20 text-copper-accent rounded-full text-vintage-sm font-cinzel tracking-wide">
                      {item.cuisine}
                    </span>
                  </div>
                )}

                {activeCategory === "transportation" && "aircraft" in item && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-copper-accent/20 text-copper-accent rounded-full text-vintage-sm font-cinzel tracking-wide">
                      {item.aircraft}
                    </span>
                  </div>
                )}

                <Button className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-semibold hover:shadow-lg hover:shadow-copper-accent/30 transition-all duration-300 text-vintage-sm tracking-wider uppercase">
                  Book Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
