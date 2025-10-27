'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, Plane, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ActivateErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    setError(errorParam || 'An error occurred during account activation.');
  }, [searchParams]);

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  const handleBackToRegister = () => {
    router.push('/auth/register');
  };

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
          {/* Error Icon */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-600/80 to-red-500/60 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/20">
                <XCircle className="w-14 h-14 text-cream-light" />
              </div>
            </div>

            <div className="mb-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mb-3"></div>
              <p className="text-copper-accent font-great-vibes text-vintage-xl">Oops!</p>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-copper-accent to-transparent mx-auto mt-3"></div>
            </div>

            <h1 className="text-vintage-3xl md:text-vintage-4xl font-playfair font-bold text-cream-light mb-4 tracking-wide">
              Activation
              <span className="block text-red-400 font-great-vibes text-vintage-4xl font-normal italic mt-1">
                Failed
              </span>
            </h1>

            <p className="text-vintage-base text-cream-light/80 font-cormorant font-light leading-relaxed">
              We encountered an issue with your account activation
            </p>
          </div>

          {/* Error Card */}
          <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl animate-fade-in">
            <CardHeader className="pt-6 pb-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <h2 className="text-red-400 font-cinzel font-bold text-vintage-xl tracking-wider uppercase">
                    Error Details
                  </h2>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-8 pt-4">
              {/* Error Message */}
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 font-cormorant text-vintage-base text-center leading-relaxed">
                  {error}
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-walnut-darkest/60 border border-copper-accent/20 rounded-lg">
                <p className="text-cream-light/80 font-cormorant text-vintage-sm text-center leading-relaxed">
                  This could happen if the activation link has expired, is invalid, or has already been used.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleBackToLogin}
                  className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold px-8 py-4 rounded-lg shadow-2xl hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-[1.02] text-vintage-lg tracking-wider uppercase transform-gpu"
                >
                  <span className="flex items-center justify-center space-x-3">
                    <span>Back to Login</span>
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>

                <Button 
                  onClick={handleBackToRegister}
                  className="w-full bg-walnut-darkest/60 border-2 border-copper-accent/30 text-copper-accent hover:bg-copper-accent/10 font-cormorant font-bold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] text-vintage-base tracking-wider"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Register New Account</span>
                  </span>
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center pt-4">
                <p className="text-cream-light/70 font-cormorant text-vintage-sm leading-relaxed">
                  Need assistance?{' '}
                  <Link 
                    href="/contact" 
                    className="text-copper-accent hover:text-copper-light transition-colors duration-300 font-medium"
                  >
                    Contact our support team
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Notice */}
          <div className="text-center mt-6 mb-8">
            <p className="text-cream-light/60 font-cormorant text-vintage-sm leading-relaxed">
              We're here to help you get started with your luxury travel experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
