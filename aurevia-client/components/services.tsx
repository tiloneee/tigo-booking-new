import { Card, CardContent } from "@/components/ui/card"
import { Hotel, Shield, Calendar, Search, Star, Headphones } from "lucide-react"

const services = [
  {
    icon: Hotel,
    title: "Luxury Accommodations",
    description: "Handpicked hotels and resorts that define elegance and comfort for your perfect stay.",
  },
  {
    icon: Search,
    title: "Easy Hotel Search",
    description: "Find your ideal hotel with our powerful search and filtering system.",
  },
  {
    icon: Calendar,
    title: "Instant Booking",
    description: "Book your perfect room instantly with our seamless reservation system.",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description: "Make informed decisions with authentic reviews from real guests.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round-the-clock customer service to assist with all your booking needs.",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Your transactions are protected with our secure payment system.",
  },
]

export default function Services() {
  return (
    <section id="services" className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Decorative element */}
          <div className="mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mb-3"></div>
            <p className="text-terracotta-rose font-libre italic text-vintage-xl">Excellence in Every Detail</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mt-3"></div>
          </div>

          <h2 className="text-vintage-4xl md:text-vintage-5xl font-libre font-bold text-deep-brown mb-6 tracking-wide">
            Our Hotel Booking Services
          </h2>
          <p className="text-vintage-xl text-ash-brown max-w-2xl mx-auto font-varela leading-relaxed">
            Experience seamless hotel booking with our comprehensive platform designed for your comfort
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="bg-soft-beige/40 border border-terracotta-rose/20 hover:bg-soft-beige/60 transition-all duration-300 group hover:shadow-xl hover:shadow-terracotta-rose/10"
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-terracotta-rose to-ash-brown rounded-full shadow-lg group-hover:shadow-terracotta-rose/30 transition-all duration-300 group-hover:scale-110">
                    <service.icon className="h-8 w-8 text-creamy-white" />
                  </div>
                </div>

                <h3 className="text-vintage-xl font-libre font-bold text-deep-brown mb-4 tracking-wide">
                  {service.title}
                </h3>

                <p className="text-ash-brown leading-relaxed font-varela text-vintage-base">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
