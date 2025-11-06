import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"

const quickratings = [
  {
    name: "Eleanor Whitmore",
    location: "London, UK",
    text: "Grandeur transformed our anniversary trip into an absolutely magical experience. Every detail was perfect, from the private villa in Tuscany to the exclusive wine tastings. Truly exceptional service.",
    rating: 5,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    name: "James Richardson",
    location: "New York, USA",
    text: "The attention to detail and personalized service exceeded all expectations. Our journey through Japan was seamlessly orchestrated, allowing us to immerse ourselves completely in the culture.",
    rating: 5,
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    name: "Isabella Martinez",
    location: "Madrid, Spain",
    text: "From the moment we contacted Grandeur, we knew we were in exceptional hands. The bespoke itinerary for our Greek island adventure was nothing short of perfection.",
    rating: 5,
    image: "/placeholder.svg?height=80&width=80",
  },
]

export default function QuickRating() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Decorative element */}
          <div className="mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mb-3"></div>
            <p className="text-terracotta-rose font-libre italic text-vintage-xl">Testimonials</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mt-3"></div>
          </div>

          <h2 className="text-vintage-4xl md:text-vintage-5xl font-libre font-bold text-deep-brown mb-6 tracking-wide">
            What Our Guests Say
          </h2>
          <p className="text-vintage-xl text-ash-brown max-w-2xl mx-auto font-varela leading-relaxed">
            The experiences and memories we create speak through the words of our cherished travelers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quickratings.map((quickrating, index) => (
            <Card
              key={index}
              className="bg-soft-beige/40 border border-terracotta-rose/20 hover:bg-soft-beige/60 transition-all duration-300 hover:shadow-xl hover:shadow-terracotta-rose/10"
            >
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Quote className="h-8 w-8 text-terracotta-rose mr-3" />
                  <div className="flex space-x-1">
                    {[...Array(quickrating.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-terracotta-rose fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-ash-brown mb-6 leading-relaxed italic font-varela text-vintage-base">
                  "{quickrating.text}"
                </p>

                <div className="flex items-center">
                  <img
                    src={quickrating.image || "/placeholder.svg"}
                    alt={quickrating.name}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-terracotta-rose/30"
                  />
                  <div>
                    <div className="font-libre font-bold text-deep-brown text-vintage-base tracking-wide">
                      {quickrating.name}
                    </div>
                    <div className="text-ash-brown/80 text-vintage-sm font-varela">{quickrating.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
