import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"

const testimonials = [
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

export default function Testimonials() {
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
            <p className="text-copper-accent font-great-vibes text-vintage-xl">Testimonials</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-3"></div>
          </div>

          <h2 className="text-vintage-4xl md:text-vintage-5xl font-playfair font-bold text-cream-light mb-6 tracking-wide">
            What Our Guests Say
          </h2>
          <p className="text-vintage-xl text-cream-light/80 max-w-2xl mx-auto font-cormorant font-light leading-relaxed">
            The experiences and memories we create speak through the words of our cherished travelers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-walnut-dark/40 border border-copper-accent/20 hover:bg-walnut-dark/60 transition-all duration-300 hover:shadow-xl hover:shadow-copper-accent/10"
            >
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Quote className="h-8 w-8 text-copper-accent mr-3" />
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-copper-accent fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-cream-light/80 mb-6 leading-relaxed italic font-cormorant text-vintage-base">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-copper-accent/30"
                  />
                  <div>
                    <div className="font-playfair font-bold text-cream-light text-vintage-base tracking-wide">
                      {testimonial.name}
                    </div>
                    <div className="text-cream-light/60 text-vintage-sm font-cormorant">{testimonial.location}</div>
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
