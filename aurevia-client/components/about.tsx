import { Button } from "@/components/ui/button"
import { Award, Users, Globe, Heart } from "lucide-react"

export default function About() {
  return (
    <section id="about" className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Decorative element */}
            <div className="mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mb-3"></div>
              <p className="text-terracotta-rose font-libre italic text-vintage-xl">Since 1999</p>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mt-3"></div>
            </div>

            <h2 className="text-vintage-4xl md:text-vintage-5xl font-libre font-bold text-deep-brown mb-6 tracking-wide">
              A Legacy of
              <span className="block text-terracotta-rose font-libre text-vintage-5xl font-bold italic mt-2">
                Exceptional Travel
              </span>
            </h2>

            <p className="text-vintage-lg text-ash-brown mb-6 leading-relaxed font-varela">
              For over two decades, Grandeur has been the epitome of luxury travel, crafting extraordinary journeys that
              transcend the ordinary. Our commitment to excellence and attention to detail has made us the preferred
              choice for discerning travelers worldwide.
            </p>

            <p className="text-vintage-lg text-ash-brown mb-8 leading-relaxed font-varela">
              We believe that travel is not just about reaching a destination—it's about the transformative experiences
              along the way. Every journey we curate is a masterpiece, designed to create memories that last a lifetime.
            </p>

            <Button className="bg-terracotta-rose text-creamy-white font-varela font-semibold px-8 py-3 rounded-lg shadow-lg hover:bg-ash-brown hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-105 text-vintage-base tracking-wider uppercase">
              Discover Our Story
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 bg-soft-beige/40 rounded-lg border border-terracotta-rose/20 group hover:bg-soft-beige/60 transition-all duration-300">
              <Award className="h-12 w-12 text-terracotta-rose mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-vintage-3xl font-libre font-bold text-terracotta-rose mb-2">50+</div>
              <div className="text-ash-brown font-varela text-vintage-base tracking-wide">Awards Won</div>
            </div>

            <div className="text-center p-6 bg-soft-beige/40 rounded-lg border border-terracotta-rose/20 group hover:bg-soft-beige/60 transition-all duration-300">
              <Users className="h-12 w-12 text-terracotta-rose mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-vintage-3xl font-libre font-bold text-terracotta-rose mb-2">10K+</div>
              <div className="text-ash-brown font-varela text-vintage-base tracking-wide">Happy Clients</div>
            </div>

            <div className="text-center p-6 bg-soft-beige/40 rounded-lg border border-terracotta-rose/20 group hover:bg-soft-beige/60 transition-all duration-300">
              <Globe className="h-12 w-12 text-terracotta-rose mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-vintage-3xl font-libre font-bold text-terracotta-rose mb-2">150+</div>
              <div className="text-ash-brown font-varela text-vintage-base tracking-wide">Destinations</div>
            </div>

            <div className="text-center p-6 bg-soft-beige/40 rounded-lg border border-terracotta-rose/20 group hover:bg-soft-beige/60 transition-all duration-300">
              <Heart className="h-12 w-12 text-terracotta-rose mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-vintage-3xl font-libre font-bold text-terracotta-rose mb-2">99%</div>
              <div className="text-ash-brown font-varela text-vintage-base tracking-wide">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
