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
      <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white relative overflow-hidden flex items-center justify-center">
        <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown backdrop-blur-sm border border-terracotta-rose/30 shadow-2xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-vintage-2xl font-libre font-bold text-creamy-yellow mb-2">
                Registration Successful!
              </h1>
              <p className="text-creamy-white/80 font-varela text-vintage-base">
                Please check your email to activate your account. You will be redirected to the login page shortly.
              </p>
            </div>
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-varela font-bold px-6 py-2 rounded-lg hover:bg-ash-brown transition-all">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-5"></div>

      {/* Header */}
      <header className="relative z-50 bg-deep-brown backdrop-blur-sm border-b border-ash-brown/20 mb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
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

            <Link
              href="/"
              className="text-creamy-white hover:text-terracotta-rose transition-colors duration-300 font-varela font-medium text-vintage-base tracking-wide"
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
            <h1 className="text-vintage-3xl md:text-vintage-4xl font-libre font-bold text-deep-brown mb-4 tracking-wide">
              Create Your
              <span className="block text-terracotta-rose font-libre text-vintage-4xl font-bold italic mt-1">
                Luxury Account
              </span>
            </h1>

            <p className="text-vintage-base text-ash-brown font-varela leading-relaxed">
              Begin your personalized luxury travel journey
            </p>
          </div>

          {/* Registration Card */}
          <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown backdrop-blur-sm border border-terracotta-rose/30 shadow-2xl">
            <CardHeader className="pt-4 pb-[1px]">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-creamy-yellow" />
                <span className="text-creamy-yellow font-varela font-bold text-vintage-xl tracking-wider uppercase">
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
                    <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center space-x-2">
                      <User className="h-4 w-4 text-creamy-yellow" />
                      <span>First Name</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className="w-full px-4 py-3 bg-creamy-white/60 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center space-x-2">
                      <User className="h-4 w-4 text-creamy-yellow" />
                      <span>Last Name</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      className="w-full px-4 py-3 bg-creamy-white/60 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-creamy-yellow" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-creamy-white/60 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
                    required
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-creamy-yellow" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 bg-creamy-white/60 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
                    required
                  />
                </div>

                {/* Password Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-creamy-yellow" />
                      <span>Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 pr-12 bg-creamy-white/60 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-deep-brown hover:text-ash-brown transition-colors duration-300"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-creamy-yellow" />
                      <span>Confirm Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        className="w-full px-4 py-3 pr-12 bg-creamy-white/60 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-deep-brown hover:text-ash-brown transition-colors duration-300"
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
                    className="w-4 h-4 text-terracotta-rose bg-creamy-white border-terracotta-rose/30 rounded focus:ring-terracotta-rose/20 focus:ring-2 mt-1"
                    required
                  />
                  <label htmlFor="terms" className="text-creamy-yellow/80 font-varela text-vintage-sm leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-creamy-yellow hover:text-ash-brown transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-creamy-yellow hover:text-ash-brown transition-colors">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Register Button */}
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown text-md font-varela font-bold px-8 py-4 rounded-lg shadow-2xl hover:bg-ash-brown hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-[1.02] tracking-wider uppercase transform-gpu disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-3">
                    <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
                    {!isLoading && <ArrowRight className="h-5 w-5" />}
                  </span>
                </Button>
              </form>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <p className="text-creamy-yellow/80 font-varela text-vintage-base">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-creamy-yellow hover:text-ash-brown font-medium transition-colors duration-300"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center mt-6">
            <p className="text-dark-brown font-varela text-vintage-sm leading-relaxed">
              Your privacy and security are our top priority. All data is encrypted and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 