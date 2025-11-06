"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay - removed, using parent gradient */}
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Header Content */}
          <div className="mb-12">
            {/* Decorative element */}
            <div className="mb-8">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mb-4"></div>
              <p className="text-terracotta-rose font-libre italic text-vintage-2xl">Your Complete Travel Companion</p>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-terracotta-rose to-transparent mx-auto mt-4"></div>
            </div>

            <h1 className="text-vintage-4xl md:text-vintage-6xl font-libre font-bold text-deep-brown mb-6 leading-tight animate-fade-in">
              Discover, Book & Experience
              <span className="block text-terracotta-rose font-libre text-vintage-5xl md:text-vintage-6xl font-bold italic mt-2">
                Luxury Travel
              </span>
            </h1>

            <p
              className="text-vintage-lg md:text-vintage-xl text-ash-brown mb-12 max-w-3xl mx-auto leading-relaxed font-varela animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Your all-in-one platform for luxury accommodations, exquisite dining, and premium transportation.
              Experience seamless booking with unparalleled service.
            </p>

            {/* Call to Action Button */}
            <div 
              className="animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Button
                onClick={() => router.push('/hotels')}
                className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-varela font-bold px-12 py-6 rounded-lg shadow-2xl hover:shadow-terracotta-rose/40 transition-all duration-300 hover:scale-105 tracking-wider uppercase group"
              > Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="text-center group">
              <div className="text-vintage-3xl font-libre font-bold text-terracotta-rose mb-1">50K+</div>
              <div className="text-ash-brown font-varela text-vintage-base tracking-wide">Hotels</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-libre font-bold text-terracotta-rose mb-1">25K+</div>
              <div className="text-ash-brown font-varela text-vintage-base tracking-wide">Restaurants</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-libre font-bold text-terracotta-rose mb-1">500+</div>
              <div className="text-ash-brown font-varela text-vintage-base tracking-wide">Airlines</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-libre font-bold text-terracotta-rose mb-1">150+</div>
              <div className="text-ash-brown font-varela text-vintage-base tracking-wide">Countries</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
