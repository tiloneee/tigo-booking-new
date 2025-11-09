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
    { id: "hotels", label: "Luxury Hotels"},
    { id: "restaurants", label: "Fine Dining"},
    { id: "transportation", label: "Premium Travel"},
  ]

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Decorative element */}
          <div className="mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mb-3"></div>
            <p className="text-terracotta-rose font-libre italic text-vintage-xl">Featured Selections</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mt-3"></div>
          </div>

          <h2 className="text-vintage-4xl md:text-vintage-5xl font-libre font-bold text-deep-brown mb-6 tracking-wide">
            Curated Luxury
            <span className="block text-terracotta-rose font-libre text-vintage-5xl font-bold italic mt-2">
              Experiences
            </span>
          </h2>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center mb-12 bg-soft-beige/30 rounded-lg p-2 max-w-2xl mx-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-varela font-semibold text-vintage-sm shadow-terracotta-rose/30 scale-[1.02] uppercase transform-gpu disabled:opacity-50 disabled:cursor-not-allowed tracking-wider transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-terracotta-rose text-creamy-white shadow-lg"
                  : "text-deep-brown hover:text-terracotta-rose hover:bg-soft-beige/50"
              }`}
            >
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {showcaseData[activeCategory as keyof typeof showcaseData].map((item, index) => (
            <Card
              key={index}
              className="bg-soft-beige/60 border border-terracotta-rose/20 overflow-hidden hover:shadow-2xl hover:shadow-terracotta-rose/20 transition-all duration-500 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-brown/80 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-creamy-white/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-terracotta-rose fill-current" />
                    <span className="text-deep-brown text-vintage-sm font-varela font-medium">
                      {"rating" in item ? item.rating : "Premium"}
                    </span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-vintage-xl font-libre font-bold text-deep-brown tracking-wide mb-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-ash-brown">
                      <MapPin className="h-4 w-4 text-terracotta-rose" />
                      <span className="font-varela text-vintage-base">{"location" in item ? item.location : item.route}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-terracotta-rose font-varela font-bold text-vintage-lg">{item.price}</div>
                    <div className="text-ash-brown/80 text-vintage-xs font-varela">
                      {activeCategory === "hotels"
                        ? "per night"
                        : activeCategory === "restaurants"
                          ? "tasting menu"
                          : "per person"}
                    </div>
                  </div>
                </div>

                <p className="text-ash-brown mb-4 leading-relaxed font-varela text-vintage-base">
                  {item.description}
                </p>

                {activeCategory === "hotels" && "amenities" in item && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-terracotta-rose/20 text-terracotta-rose rounded text-vintage-xs font-varela tracking-wide"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}

                {activeCategory === "restaurants" && "cuisine" in item && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-terracotta-rose/20 text-terracotta-rose rounded-full text-vintage-sm font-varela tracking-wide">
                      {item.cuisine}
                    </span>
                  </div>
                )}

                {activeCategory === "transportation" && "aircraft" in item && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-terracotta-rose/20 text-terracotta-rose rounded-full text-vintage-sm font-varela tracking-wide">
                      {item.aircraft}
                    </span>
                  </div>
                )}

                <Button className="w-full bg-terracotta-rose text-creamy-white font-varela font-semibold hover:bg-ash-brown hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300 text-vintage-sm tracking-wider uppercase">
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
