"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plane, Eye, EyeOff, Mail, Lock, ArrowRight, Shield, AlertCircle, User, Phone, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const data = await response.json()
      setSuccess(true)
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)

    } catch (error: any) {
      setError(error.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest relative overflow-hidden flex items-center justify-center">
        <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-vintage-2xl font-playfair font-bold text-cream-light mb-2">
                Registration Successful!
              </h1>
              <p className="text-cream-light/80 font-cormorant text-vintage-base">
                Please check your email to activate your account. You will be redirected to the login page shortly.
              </p>
            </div>
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-6 py-2 rounded-lg">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-5"></div>

      {/* Warm lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-copper-accent/6 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-copper-light/4 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-copper-accent/3 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="relative z-50 bg-walnut-darkest/95 backdrop-blur-sm border-b border-copper-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
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

            <Link
              href="/"
              className="text-cream-light hover:text-copper-accent transition-colors duration-300 font-cormorant font-medium text-vintage-base tracking-wide"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-xl">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mb-3"></div>
              <p className="text-copper-accent font-great-vibes text-vintage-xl">Join Aurevia</p>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-3"></div>
            </div>

            <h1 className="text-vintage-3xl md:text-vintage-4xl font-playfair font-bold text-cream-light mb-4 tracking-wide">
              Create Your
              <span className="block text-copper-accent font-great-vibes text-vintage-4xl font-normal italic mt-1">
                Luxury Account
              </span>
            </h1>

            <p className="text-vintage-base text-cream-light/80 font-cormorant font-light leading-relaxed">
              Begin your personalized luxury travel journey
            </p>
          </div>

          {/* Registration Card */}
          <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
            <CardHeader className="pt-4 pb-[1px]">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-copper-accent" />
                <span className="text-copper-accent font-cinzel font-bold text-vintage-xl tracking-wider uppercase">
                  Create Account
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-8 pt-1">
              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 font-cormorant text-vintage-lg">{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                      <User className="h-4 w-4 text-copper-accent" />
                      <span>First Name</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                      <User className="h-4 w-4 text-copper-accent" />
                      <span>Last Name</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-copper-accent" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                    required
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-copper-accent" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                    required
                  />
                </div>

                {/* Password Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-copper-accent" />
                      <span>Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 pr-12 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-copper-accent hover:text-copper-light transition-colors duration-300"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-copper-accent" />
                      <span>Confirm Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        className="w-full px-4 py-3 pr-12 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-copper-accent hover:text-copper-light transition-colors duration-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-4 h-4 text-copper-accent bg-walnut-darkest border-copper-accent/30 rounded focus:ring-copper-accent/20 focus:ring-2 mt-1"
                    required
                  />
                  <label htmlFor="terms" className="text-cream-light/80 font-cormorant text-vintage-sm leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-copper-accent hover:text-copper-light transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-copper-accent hover:text-copper-light transition-colors">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Register Button */}
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-8 py-4 rounded-lg shadow-2xl hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-[1.02] text-vintage-lg tracking-wider uppercase transform-gpu disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-3">
                    <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
                    {!isLoading && <ArrowRight className="h-5 w-5" />}
                  </span>
                </Button>
              </form>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <p className="text-cream-light/70 font-cormorant text-vintage-base">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-copper-accent hover:text-copper-light font-medium transition-colors duration-300"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center mt-6">
            <p className="text-cream-light/60 font-cormorant text-vintage-sm leading-relaxed">
              Your privacy and security are our top priority. All data is encrypted and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 