import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Star, ArrowRight } from "lucide-react"

const destinations = [
  {
    id: 1,
    name: "Santorini, Greece",
    description: "Whitewashed villages perched on volcanic cliffs overlooking the azure Aegean Sea.",
    image: "/placeholder.svg?height=400&width=600",
    rating: 4.9,
    price: "From $3,200",
    duration: "7 Days",
  },
  {
    id: 2,
    name: "Kyoto, Japan",
    description: "Ancient temples, traditional gardens, and the timeless beauty of Japanese culture.",
    image: "/placeholder.svg?height=400&width=600",
    rating: 4.8,
    price: "From $4,100",
    duration: "10 Days",
  },
  {
    id: 3,
    name: "Tuscany, Italy",
    description: "Rolling hills, vineyard estates, and Renaissance art in the heart of Italy.",
    image: "/placeholder.svg?height=400&width=600",
    rating: 4.9,
    price: "From $2,800",
    duration: "8 Days",
  },
]

export default function FeaturedDestinations() {
  return (
    <section id="destinations" className="py-20 bg-gradient-to-b from-walnut-darkest to-walnut-dark relative">
      {/* Warm lighting effect */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-copper-accent/4 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Decorative element */}
          <div className="mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mb-3"></div>
            <p className="text-copper-accent font-great-vibes text-vintage-xl">Curated Experiences</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-3"></div>
          </div>

          <h2 className="text-vintage-4xl md:text-vintage-5xl font-playfair font-bold text-cream-light mb-6 tracking-wide">
            Featured Destinations
          </h2>
          <p className="text-vintage-xl text-cream-light/80 max-w-2xl mx-auto font-cormorant font-light leading-relaxed">
            Handpicked locations that promise unforgettable experiences and timeless memories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {destinations.map((destination) => (
            <Card
              key={destination.id}
              className="bg-walnut-dark/60 border border-copper-accent/20 overflow-hidden hover:shadow-2xl hover:shadow-copper-accent/20 transition-all duration-500 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={destination.image || "/placeholder.svg"}
                  alt={destination.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-walnut-dark/60 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-walnut-dark/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-copper-accent fill-current" />
                    <span className="text-cream-light text-vintage-sm font-cormorant font-medium">
                      {destination.rating}
                    </span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="h-4 w-4 text-copper-accent" />
                  <h3 className="text-vintage-xl font-playfair font-bold text-cream-light tracking-wide">
                    {destination.name}
                  </h3>
                </div>

                <p className="text-cream-light/70 mb-4 leading-relaxed font-cormorant text-vintage-base">
                  {destination.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-copper-accent font-cinzel font-semibold text-vintage-base tracking-wide">
                    {destination.price}
                  </div>
                  <div className="text-cream-light/60 text-vintage-sm font-cormorant">{destination.duration}</div>
                </div>

                <Button className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-semibold hover:shadow-lg hover:shadow-copper-accent/30 transition-all duration-300 text-vintage-sm tracking-wider uppercase">
                  Explore Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            className="border-2 border-copper-accent text-copper-accent hover:bg-copper-accent hover:text-walnut-dark font-cinzel font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-copper-accent/30 transition-all duration-300 text-vintage-base tracking-wider uppercase"
          >
            View All Destinations
          </Button>
        </div>
      </div>
    </section>
  )
}
