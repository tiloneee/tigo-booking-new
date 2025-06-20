"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="relative z-50 bg-walnut-darkest/98 backdrop-blur-sm border-b border-copper-accent/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-copper-accent to-copper-light rounded-lg shadow-lg group-hover:shadow-copper-accent/25 transition-all duration-300">
              <Plane className="h-6 w-6 text-walnut-dark" />
            </div>
            <div>
              <h1 className="text-vintage-2xl font-playfair font-bold text-cream-light tracking-wide">
                Aurevia
                <span className="text-vintage-sm font-cormorant font-normal text-copper-accent/80 ml-2">by tigo</span>
              </h1>
              <p className="text-vintage-xs text-copper-accent font-cinzel font-medium tracking-widest uppercase">
                Luxury Travel Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#destinations"
              className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
            >
              Destinations
            </Link>
            <Link
              href="#services"
              className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
            >
              Services
            </Link>
            <Link
              href="#about"
              className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
            >
              Sign In
            </Link>
            <Button className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105 text-vintage-sm tracking-wider uppercase">
              Plan Your Journey
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-cream-light hover:text-copper-accent transition-colors duration-300"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-walnut-darkest/98 backdrop-blur-sm border-b border-copper-accent/20">
            <nav className="flex flex-col space-y-4 p-6">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="p-2 bg-gradient-to-br from-copper-accent to-copper-light rounded-lg shadow-lg group-hover:shadow-copper-accent/25 transition-all duration-300">
                  <Plane className="h-6 w-6 text-walnut-dark" />
                </div>
                <div>
                  <h1 className="text-vintage-2xl font-playfair font-bold text-cream-light tracking-wide">
                    Aurevia
                    <span className="text-vintage-sm font-cormorant font-normal text-copper-accent/80 ml-2">
                      by tigo
                    </span>
                  </h1>
                  <p className="text-vintage-xs text-copper-accent font-cinzel font-medium tracking-widest uppercase">
                    Luxury Travel Platform
                  </p>
                </div>
              </Link>
              <Link
                href="#destinations"
                className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
              >
                Destinations
              </Link>
              <Link
                href="#services"
                className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
              >
                Services
              </Link>
              <Link
                href="#about"
                className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
              >
                About
              </Link>
              <Link
                href="#contact"
                className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
              >
                Contact
              </Link>
              <Link
                href="/login"
                className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-lg tracking-wide"
              >
                Sign In
              </Link>
              <Button className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-copper-accent/30 transition-all duration-300 w-full text-vintage-sm tracking-wider uppercase">
                Plan Your Journey
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
