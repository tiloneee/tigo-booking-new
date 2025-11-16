"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Star, ArrowRight, Loader2 } from "lucide-react"
import { HotelApiService } from "@/lib/api/hotels"
import { Hotel } from "@/types/hotel"
import Link from "next/link"

export default function FeaturedHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeaturedHotels = async () => {
      try {
        setLoading(true)
        // Fetch top 6 hotels sorted by rating
        const result = await HotelApiService.getAllHotels(1, 6, 'avg_rating', 'desc')
        setHotels(result.hotels)
        setError(null)
      } catch (err) {
        console.error('Error fetching featured hotels:', err)
        setError('Failed to load featured hotels')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedHotels()
  }, [])

  if (loading) {
    return (
      <section id="featured-hotels" className="py-20 bg-gradient-to-b from-soft-beige to-creamy-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-12 w-12 animate-spin text-terracotta-rose" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="featured-hotels" className="py-20 bg-transparent relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-ash-brown">
            <p>{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="featured-hotels" className="py-20 bg-transparent relative">
      {/* Decorative background */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-terracotta-rose/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Decorative element */}
          <div className="mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mb-3"></div>
            <p className="text-terracotta-rose font-libre italic text-vintage-xl">Top Rated</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mt-3"></div>
          </div>

          <h2 className="text-vintage-4xl md:text-vintage-5xl font-libre font-bold text-deep-brown mb-6 tracking-wide">
            Featured Hotels
          </h2>
          <p className="text-vintage-xl text-ash-brown max-w-2xl mx-auto font-varela leading-relaxed">
            Discover our handpicked selection of exceptional hotels offering luxury and comfort
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {hotels.map((hotel) => (
            <Card
              key={hotel.id}
              className="overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-creamy-white border-terracotta-rose/20"
            >
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-deep-brown/60 to-transparent z-10"></div>
                <div 
                  className="w-full h-full bg-cover bg-center transform group-hover:scale-110 transition-transform duration-500"
                  style={{ 
                    backgroundImage: hotel.images && hotel.images.length > 0 
                      ? `url(${hotel.images[0]})` 
                      : `url(/placeholder.svg?height=400&width=600)` 
                  }}
                />
                
                <div className="absolute top-4 right-4 bg-creamy-white/95 backdrop-blur-sm px-3 py-1 rounded-full z-20 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-terracotta-rose text-terracotta-rose" />
                  <span className="font-libre font-bold text-deep-brown">
                    {hotel.avg_rating ? hotel.avg_rating : 'N/A'}
                  </span>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-terracotta-rose mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-vintage-xl font-libre font-bold text-deep-brown mb-1">
                      {hotel.name}
                    </h3>
                    <p className="text-ash-brown text-vintage-sm font-varela">
                      {hotel.city}, {hotel.country}
                    </p>
                  </div>
                </div>

                <p className="text-ash-brown mb-4 font-varela text-vintage-base line-clamp-2">
                  {hotel.description}
                </p>

                <div className="flex items-center justify-between text-vintage-sm text-ash-brown mb-4 font-varela">
                  <span>{hotel.total_reviews || 0} reviews</span>
                  {hotel.pricing && (
                    <span className="font-libre font-bold text-terracotta-rose">
                      From ${hotel.pricing.min_price}
                    </span>
                  )}
                </div>

                <Link href={`/hotels/${hotel.id}`}>
                  <Button
                    variant="outline"
                    className="w-full group/btn border-terracotta-rose text-terracotta-rose hover:bg-terracotta-rose hover:text-creamy-white transition-colors"
                  >
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/hotels">
            <Button
              size="lg"
              className="bg-gradient-to-r from-terracotta-rose to-ash-brown hover:from-ash-brown hover:to-terracotta-rose text-creamy-white font-libre px-8 py-6 text-vintage-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Explore All Hotels
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
