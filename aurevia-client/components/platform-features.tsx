import { Card, CardContent } from "@/components/ui/card"
import { Hotel, Utensils, Plane, Shield, Clock, Award, CreditCard, Headphones } from "lucide-react"

const features = [
  {
    icon: Hotel,
    title: "Luxury Accommodations",
    description: "From boutique hotels to grand resorts, discover handpicked properties that define elegance.",
    stats: "50,000+ Hotels Worldwide",
  },
  {
    icon: Utensils,
    title: "Exquisite Dining",
    description: "Reserve tables at Michelin-starred restaurants and hidden culinary gems around the globe.",
    stats: "25,000+ Premium Restaurants",
  },
  {
    icon: Plane,
    title: "Premium Transportation",
    description: "First-class flights, private jets, luxury car rentals, and exclusive transfer services.",
    stats: "500+ Airline Partners",
  },
  {
    icon: Shield,
    title: "Secure Booking",
    description: "Advanced encryption and fraud protection ensure your reservations are safe and secure.",
    stats: "100% Secure Transactions",
  },
  {
    icon: Clock,
    title: "Instant Confirmation",
    description: "Real-time availability and immediate booking confirmation for all your travel needs.",
    stats: "24/7 Real-time Updates",
  },
  {
    icon: Award,
    title: "Exclusive Perks",
    description: "VIP treatment, room upgrades, priority seating, and exclusive member benefits.",
    stats: "Premium Member Benefits",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description: "Multiple payment options, installment plans, and exclusive financing for luxury travel.",
    stats: "Flexible Payment Plans",
  },
  {
    icon: Headphones,
    title: "Concierge Support",
    description: "24/7 dedicated support from travel experts who understand luxury and attention to detail.",
    stats: "24/7 Expert Support",
  },
]

export default function PlatformFeatures() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Decorative element */}
          <div className="mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mb-3"></div>
            <p className="text-terracotta-rose font-libre italic text-vintage-xl">All-in-One Platform</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mt-3"></div>
          </div>

          <h2 className="text-vintage-4xl md:text-vintage-5xl font-libre font-bold text-deep-brown mb-6 tracking-wide">
            Everything You Need for
            <span className="block text-terracotta-rose font-libre text-vintage-5xl font-bold italic mt-2">
              Perfect Travel
            </span>
          </h2>
          <p className="text-vintage-xl text-ash-brown max-w-3xl mx-auto font-varela leading-relaxed">
            Our comprehensive platform brings together the finest hotels, restaurants, and transportation options, all
            backed by unparalleled service and exclusive benefits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-soft-beige/40 border border-terracotta-rose/20 hover:bg-soft-beige/60 transition-all duration-300 group hover:shadow-xl hover:shadow-terracotta-rose/10"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 bg-gradient-to-br from-terracotta-rose to-ash-brown rounded-full shadow-lg group-hover:shadow-terracotta-rose/30 transition-all duration-300 group-hover:scale-110">
                    <feature.icon className="h-6 w-6 text-creamy-white" />
                  </div>
                </div>

                <h3 className="text-vintage-lg font-libre font-bold text-deep-brown mb-3 tracking-wide">
                  {feature.title}
                </h3>

                <p className="text-ash-brown leading-relaxed font-varela text-vintage-sm mb-3">
                  {feature.description}
                </p>

                <div className="text-terracotta-rose font-varela font-semibold text-vintage-xs tracking-wider uppercase">
                  {feature.stats}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
