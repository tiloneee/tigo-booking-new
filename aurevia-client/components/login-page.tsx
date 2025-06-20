"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plane, Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = () => {
    
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
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mb-3"></div>
              <p className="text-copper-accent font-great-vibes text-vintage-xl">Welcome Back</p>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-3"></div>
            </div>

            <h1 className="text-vintage-3xl md:text-vintage-4xl font-playfair font-bold text-cream-light mb-4 tracking-wide">
              Sign In to
              <span className="block text-copper-accent font-great-vibes text-vintage-4xl font-normal italic mt-1">
                Your Account
              </span>
            </h1>

            <p className="text-vintage-base text-cream-light/80 font-cormorant font-light leading-relaxed">
              Access your personalized luxury travel experience
            </p>
          </div>

          {/* Login Card */}
          <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
            <CardHeader className="pt-4 pb-[1px]">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-copper-accent" />
                <span className="text-copper-accent font-cinzel font-bold text-vintage-xl tracking-wider uppercase">
                  Secure Login
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-8 pt-1">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-copper-accent" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-cream-light font-cormorant text-vintage-base font-medium flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-copper-accent" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-copper-accent bg-walnut-darkest border-copper-accent/30 rounded focus:ring-copper-accent/20 focus:ring-2"
                  />
                  <span className="text-cream-light/80 font-cormorant text-vintage-sm">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-copper-accent hover:text-copper-light font-cormorant text-vintage-sm transition-colors duration-300"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <Button className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-8 py-4 rounded-lg shadow-2xl hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-[1.02] text-vintage-lg tracking-wider uppercase transform-gpu">
                <span className="flex items-center justify-center space-x-3">
                  <span>Sign In to Aurevia</span>
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-copper-accent/20"></div>
                </div>
                <div className="relative flex justify-center text-vintage-sm">
                  <span className="px-4 bg-walnut-dark/80 text-cream-light/60 font-cormorant">or continue with</span>
                </div>
              </div>

              {/* Social Login Options */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="border-copper-accent/30 text-cream-dark/45 hover:bg-gradient-to-r hover:from-copper-accent hover:via-copper-light hover:to-copper-dark hover:border-copper-accent font-cormorant font-medium py-3 transition-all duration-300"
                >
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="border-copper-accent/30 text-cream-light hover:bg-gradient-to-r hover:from-copper-accent hover:via-copper-light hover:to-copper-dark hover:border-copper-accent font-cormorant font-medium py-3 transition-all duration-300"
                >
                  Apple
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-4">
                <p className="text-cream-light/70 font-cormorant text-vintage-base">
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-copper-accent hover:text-copper-light font-medium transition-colors duration-300"
                  >
                    Create your account
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
