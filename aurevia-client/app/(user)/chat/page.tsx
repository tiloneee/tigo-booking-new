"use client"

import { useSession } from "next-auth/react"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/header"
import ChatTestInterface from "@/components/chat/chat-test-interface"

export default function ChatTestPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest relative">
        <Header />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-vintage-4xl md:text-vintage-5xl font-playfair font-bold text-cream-light mb-4 tracking-wide">
                Chat System{" "}
                <span className="text-copper-accent font-great-vibes text-vintage-5xl font-normal italic">
                  Test Interface
                </span>
              </h1>
              <p className="text-vintage-lg text-cream-light/80 font-cormorant font-light leading-relaxed">
                Test the real-time chat functionality between customers, hotel owners, and administrators
              </p>
            </div>

            {/* Chat Interface */}
            <ChatTestInterface />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}