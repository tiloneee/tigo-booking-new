import Header from "@/components/header"
import Hero from "@/components/hero"
import PlatformFeatures from "@/components/platform-features"
import BookingShowcase from "@/components/booking-showcase"
import Services from "@/components/services"
import About from "@/components/about"
import Testimonials from "@/components/quick-rating"
import Footer from "@/components/footer"
import LoginPage from "@/components/login-page"
import QuickRating from "@/components/quick-rating"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-creamy-white via-soft-beige to-creamy-white">
      <Header />
      <Hero />
      <PlatformFeatures />
      <BookingShowcase />
      <About />
      <QuickRating />
      <Footer />
    </div>
  )
}
