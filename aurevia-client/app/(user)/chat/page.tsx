"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/header"
import { ChatProvider, useChat } from "@/lib/chat-context"
import { ChatRoomList } from "@/components/chat/chat-room-list"
import { ChatBox } from "@/components/chat/chat-box"

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('room');
  const { chatRooms, setSelectedRoom, selectedRoom } = useChat();
  const hasAutoSelectedRef = useRef(false);

  // Auto-select room if roomId is provided in URL (only once when component mounts)
  useEffect(() => {
    if (roomId && chatRooms.length > 0 && !hasAutoSelectedRef.current) {
      const room = chatRooms.find(r => r.id === roomId);
      if (room) {
        console.log('Auto-selecting room from URL:', roomId);
        setSelectedRoom(room);
        hasAutoSelectedRef.current = true;
        // Remove the room parameter from URL after selection
        router.replace('/chat', { scroll: false });
      }
    }
  }, [roomId, chatRooms, setSelectedRoom, router]);

  // Reset the flag when roomId changes
  useEffect(() => {
    if (!roomId) {
      hasAutoSelectedRef.current = false;
    }
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-darkest">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-vintage-3xl md:text-vintage-4xl font-playfair font-bold text-cream-light tracking-wide">
              Messages
            </h1>
            <p className="text-vintage-base text-cream-light/70 font-cormorant mt-2">
              Connect with hotel owners and support team
            </p>
          </div>

          {/* Messenger-style Layout */}
          <div className="bg-walnut-dark/60 backdrop-blur-sm border border-copper-accent/30 rounded-lg shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-[350px_1fr] h-[calc(100vh-250px)] overflow-hidden">
              {/* Left Sidebar - Chat Room List */}
              <ChatRoomList />
              
              {/* Right Side - Chat Box */}
              <ChatBox />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatProvider>
        <ChatPageContent />
      </ChatProvider>
    </ProtectedRoute>
  );
}