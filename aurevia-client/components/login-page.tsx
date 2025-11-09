"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plane, Eye, EyeOff, Mail, Lock, ArrowRight, Shield, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login, refreshUser } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!email || !password) {
      setError("Please fill in all fields")
      return false
    }

    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
      // Immediately refresh user data to ensure balance is up-to-date
      await refreshUser()
      router.push("/") // Redirect to home page after successful login
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Extract error message from various error formats
      let errorMessage = "Login failed. Please try again."
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Handle specific backend errors with user-friendly messages
      if (errorMessage.toLowerCase().includes("invalid credentials") || 
          errorMessage.toLowerCase().includes("invalid email or password")) {
        setError("Invalid email or password. Please check your credentials and try again.")
      } else if (errorMessage.toLowerCase().includes("activate your account")) {
        setError("Please activate your account first. Check your email for activation instructions.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
    
    return false
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamy-yellow to-creamy-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-5"></div>

      {/* Header */}
      <header className="relative z-50 bg-deep-brown backdrop-blur-sm border-b border-ash-brown/20 mb-10">
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
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">


            <h1 className="text-vintage-3xl md:text-vintage-4xl font-libre font-bold text-deep-brown mb-4 tracking-wide">
              Sign In to
              <span className="block text-terracotta-rose font-libre text-vintage-4xl font-bold italic mt-1">
                Your Account
              </span>
            </h1>

            <p className="text-vintage-base text-ash-brown font-varela leading-relaxed">
              Access your personalized luxury travel experience
            </p>
          </div>

          {/* Login Card */}
          <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown backdrop-blur-sm border border-terracotta-rose/30 shadow-2xl animate-fade-in">
            <CardHeader className="pt-4 pb-[1px]">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-creamy-yellow" />
                <span className="text-creamy-yellow font-varela font-bold text-vintage-xl tracking-wider uppercase">
                  Secure Login
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-8 pt-1">
              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 font-cormorant text-vintage-md">{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6" autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLogin(e as any) } }}>
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-creamy-yellow" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-creamy-white/60 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-creamy-yellow font-varela text-vintage-base font-medium flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-creamy-yellow" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 bg-creamy-white/60 border border-terracotta-rose/30 rounded-lg text-deep-brown placeholder-ash-brown/50 font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
                      required
                      autoComplete="current-password"
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

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  
                  <Link
                    href="/forgot-password"
                    className="text-creamy-yellow hover:text-ash-brown font-varela text-vintage-sm transition-colors duration-300"
                  >
                    Forgot password?
                  </Link>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-terracotta-rose bg-creamy-white border-terracotta-rose/30 rounded focus:ring-terracotta-rose/20 focus:ring-2"
                    />
                    <span className="text-creamy-yellow font-varela text-vintage-sm">Remember me</span>
                  </label>
                </div>

                {/* Login Button */}
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown text-md font-varela font-bold px-8 py-4 rounded-lg shadow-2xl hover:bg-ash-brown hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-[1.02] tracking-wider uppercase  transform-gpu disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center space-x-3">
                    <span>{isLoading ? "Signing In..." : "Sign In to Aurevia"}</span>
                    {!isLoading && <ArrowRight className="h-5 w-5" />}
                  </span>
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-soft-beige"></div>
                </div>
                <div className="relative flex justify-center text-vintage-sm">
                  <span className="px-4 bg-soft-beige rounded-md text-deep-brown/80 font-varela">or continue with</span>
                </div>
              </div>

              {/* Social Login Options */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 border-terracotta-rose/30 text-dark-brown font-varela font-bold text-lg hover:bg-ash-brown hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-105 tracking-wider"
                >
                  Google
                </Button>
                <Button
                  className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 border-terracotta-rose/30 text-dark-brown font-varela font-bold text-lg hover:bg-ash-brown hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-105 tracking-wider"
                >
                  Facebook
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-4">
                <p className="text-creamy-yellow/80 font-varela text-vintage-base">
                  Don't have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-creamy-yellow hover:text-ash-brown font-medium transition-colors duration-300"
                  >
                    Create your account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center mt-6 mb-8">
            <p className="text-dark-brown font-varela text-vintage-sm leading-relaxed">
              Your privacy and security are our top priority. All data is encrypted and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
