import { Card, CardContent } from "@/components/ui/card"
import { Plane, Hotel, MapPin, Utensils, Camera, Shield } from "lucide-react"

const services = [
  {
    icon: Plane,
    title: "Private Aviation",
    description: "Exclusive charter flights with personalized service and luxury amenities.",
  },
  {
    icon: Hotel,
    title: "Luxury Accommodations",
    description: "Handpicked hotels, villas, and resorts that define elegance and comfort.",
  },
  {
    icon: MapPin,
    title: "Bespoke Itineraries",
    description: "Tailor-made travel plans crafted to your unique preferences and desires.",
  },
  {
    icon: Utensils,
    title: "Culinary Experiences",
    description: "Exclusive dining experiences with world-renowned chefs and local delicacies.",
  },
  {
    icon: Camera,
    title: "Cultural Immersion",
    description: "Authentic local experiences that connect you with the heart of each destination.",
  },
  {
    icon: Shield,
    title: "Concierge Support",
    description: "24/7 dedicated support ensuring every detail of your journey is perfect.",
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
            Our Distinguished Services
          </h2>
          <p className="text-vintage-xl text-ash-brown max-w-2xl mx-auto font-varela leading-relaxed">
            Every aspect of your journey is meticulously planned and executed with the finest attention to detail
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
