import Link from "next/link"
import { Plane, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Footer() {
  return (
    <footer id="contact" className="bg-transparent border-t border-ash-brown/20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-terracotta-rose to-ash-brown rounded-lg shadow-lg">
                <Plane className="h-6 w-6 text-creamy-white" />
              </div>
              <div>
                <h1 className="text-vintage-2xl font-libre font-bold text-deep-brown tracking-wide">
                  Aurevia
                  <span className="text-vintage-sm font-varela font-normal text-terracotta-rose/80 ml-2">by tigo</span>
                </h1>
                <p className="text-vintage-xs text-terracotta-rose font-varela font-medium tracking-widest uppercase">
                  Luxury Travel Platform
                </p>
              </div>
            </Link>

            <p className="text-ash-brown mb-6 leading-relaxed max-w-md font-varela text-vintage-base">
              Creating extraordinary travel experiences for discerning travelers worldwide. Every journey is a
              masterpiece crafted with passion and precision.
            </p>

            <div className="flex space-x-4">
              <Button
                size="icon"
                className="bg-soft-beige border-terracotta-rose text-terracotta-rose hover:bg-terracotta-rose hover:text-creamy-white transition-all duration-300"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="bg-soft-beige border-terracotta-rose text-terracotta-rose hover:bg-terracotta-rose hover:text-creamy-white transition-all duration-300"
              >
                <Instagram className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="bg-soft-beige border-terracotta-rose text-terracotta-rose hover:bg-terracotta-rose hover:text-creamy-white transition-all duration-300"
              >
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-vintage-lg font-libre font-bold text-deep-brown mb-6 tracking-wide">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#destinations"
                  className="text-ash-brown hover:text-terracotta-rose transition-colors duration-300 font-varela text-vintage-base"
                >
                  Destinations
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-ash-brown hover:text-terracotta-rose transition-colors duration-300 font-varela text-vintage-base"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="#about"
                  className="text-ash-brown hover:text-terracotta-rose transition-colors duration-300 font-varela text-vintage-base"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-ash-brown hover:text-terracotta-rose transition-colors duration-300 font-varela text-vintage-base"
                >
                  Travel Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-ash-brown hover:text-terracotta-rose transition-colors duration-300 font-varela text-vintage-base"
                >
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-vintage-lg font-libre font-bold text-deep-brown mb-6 tracking-wide">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-terracotta-rose flex-shrink-0" />
                <span className="text-ash-brown font-varela text-vintage-base">
                  2 Doan Thi Diem, Phu Nhuan, Ho Chi Minh City
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-terracotta-rose flex-shrink-0" />
                <span className="text-ash-brown font-varela text-vintage-base">+84 909 090 909</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-terracotta-rose flex-shrink-0" />
                <span className="text-ash-brown font-varela text-vintage-base">hello@aurevia.travel</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-ash-brown/20 mt-12 pt-8 text-center">
          <p className="text-deep-brown font-varela text-vintage-sm">
            © 2024 Aurevia Luxury Travel. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  )
}
