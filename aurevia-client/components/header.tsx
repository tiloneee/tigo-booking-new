"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserNav from "@/components/auth/user-nav"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="relative z-50 bg-deep-brown backdrop-blur-sm border-b border-ash-brown/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-terracotta-rose to-creamy-yellow rounded-lg shadow-lg group-hover:shadow-terracotta-rose/25 transition-all duration-300">
              <Plane className="h-6 w-6 text-deep-brown" />
            </div>
            <div>
              <h1 className="text-vintage-2xl font-libre font-bold text-creamy-yellow tracking-wider">
                Aurevia
                <span className="text-vintage-sm font-varela font-normal text-terracotta-rose/80 ml-2">by tigo</span>
              </h1>
              <p className="text-vintage-xs text-terracotta-rose font-varela tracking-widest uppercase">
                Luxury Travel Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/hotels"
              className="text-creamy-yellow hover:text-terracotta-rose/80 transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
            >
              Hotels
            </Link>
            <Link
              href="#destinations"
              className="text-creamy-yellow hover:text-terracotta-rose/80 transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
            >
              Destinations
            </Link>
            <Link
              href="#services"
              className="text-creamy-yellow hover:text-terracotta-rose/80 transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
            >
              Services
            </Link>
            <Link
              href="#about"
              className="text-creamy-yellow hover:text-terracotta-rose/80 transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-creamy-yellow hover:text-terracotta-rose/80 transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
            >
              Contact
            </Link>
            <UserNav />
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-creamy-yellow hover:text-terracotta-rose/80 transition-colors duration-300"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-creamy-white/98 backdrop-blur-sm border-b border-ash-brown/20">
            <nav className="flex flex-col space-y-4 p-6">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="p-2 bg-gradient-to-br from-terracotta-rose to-ash-brown rounded-lg shadow-lg group-hover:shadow-terracotta-rose/25 transition-all duration-300">
                  <Plane className="h-6 w-6 text-creamy-white" />
                </div>
                <div>
                  <h1 className="text-vintage-2xl font-libre font-bold text-deep-brown tracking-wide">
                    Aurevia
                    <span className="text-vintage-sm font-varela font-normal text-terracotta-rose/80 ml-2">
                      by tigo
                    </span>
                  </h1>
                  <p className="text-vintage-xs text-terracotta-rose font-varela font-medium tracking-widest uppercase">
                    Luxury Travel Platform
                  </p>
                </div>
              </Link>
              <Link
                href="/hotels"
                className="text-deep-brown hover:text-terracotta-rose transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                Hotels
              </Link>
              <Link
                href="#destinations"
                className="text-deep-brown hover:text-terracotta-rose transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                Destinations
              </Link>
              <Link
                href="#services"
                className="text-deep-brown hover:text-terracotta-rose transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="#about"
                className="text-deep-brown hover:text-terracotta-rose transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="#contact"
                className="text-deep-brown hover:text-terracotta-rose transition-colors duration-300 font-varela font-medium text-vintage-lg tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="pt-4">
                <UserNav />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
