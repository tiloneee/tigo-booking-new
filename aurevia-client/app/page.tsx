import Header from "@/components/header"
import Hero from "@/components/hero"
import PlatformFeatures from "@/components/platform-features"
import BookingShowcase from "@/components/booking-showcase"
import Services from "@/components/services"
import About from "@/components/about"
import Testimonials from "@/components/testimonials"
import Footer from "@/components/footer"
import LoginPage from "@/components/login-page"

export default function Home() {
  return (
    <div className="min-h-screen bg-walnut-darkest">
      <Header />
      <Hero />
      <PlatformFeatures />
      <BookingShowcase />
      <Services />
      <About />
      <Testimonials />
      <Footer />
    </div>
  )
}
