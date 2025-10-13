"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-walnut-darkest/95 via-transparent to-walnut-darkest/70"></div>
      </div>

      {/* Warm lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-copper-accent/8 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-copper-light/6 rounded-full blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Header Content */}
          <div className="mb-12">
            {/* Decorative element */}
            <div className="mb-8">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mb-4"></div>
              <p className="text-copper-accent font-great-vibes text-vintage-2xl">Your Complete Travel Companion</p>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-4"></div>
            </div>

            <h1 className="text-vintage-4xl md:text-vintage-6xl font-playfair font-bold text-cream-light mb-6 leading-tight animate-fade-in">
              Discover, Book & Experience
              <span className="block text-copper-accent font-great-vibes text-vintage-5xl md:text-vintage-6xl font-normal italic mt-2">
                Luxury Travel
              </span>
            </h1>

            <p
              className="text-vintage-lg md:text-vintage-xl text-cream-light/85 mb-12 max-w-3xl mx-auto leading-relaxed font-cormorant font-light animate-fade-in"
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
                className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-12 py-6 rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 text-vintage-lg tracking-wider uppercase group"
              >
                Get Started
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="text-center group">
              <div className="text-vintage-3xl font-playfair font-bold text-cream-light mb-1">50K+</div>
              <div className="text-cream-light/70 font-cormorant text-vintage-base tracking-wide">Hotels</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-playfair font-bold text-cream-light mb-1">25K+</div>
              <div className="text-cream-light/70 font-cormorant text-vintage-base tracking-wide">Restaurants</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-playfair font-bold text-cream-light mb-1">500+</div>
              <div className="text-cream-light/70 font-cormorant text-vintage-base tracking-wide">Airlines</div>
            </div>
            <div className="text-center group">
              <div className="text-vintage-3xl font-playfair font-bold text-cream-light mb-1">150+</div>
              <div className="text-cream-light/70 font-cormorant text-vintage-base tracking-wide">Countries</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
