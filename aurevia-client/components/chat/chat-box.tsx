"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { ChatMessage } from '@/lib/api/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, MessageCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function ChatBox() {
  const { user } = useAuth();
  const { selectedRoom, messages, sendMessage, isLoadingMessages } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom only when room changes or when sending a message (not on all messages update)
  const scrollToBottom = (force = false) => {
    if (scrollAreaViewportRef.current && (force || !isUserScrollingRef.current)) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  };

  // Handle scroll detection
  const handleScroll = () => {
    if (scrollAreaViewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaViewportRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (!isAtBottom) {
        isUserScrollingRef.current = true;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Reset after 2 seconds of no scrolling
        scrollTimeoutRef.current = setTimeout(() => {
          isUserScrollingRef.current = false;
        }, 2000);
      } else {
        isUserScrollingRef.current = false;
      }
    }
  };

  // Scroll to bottom when room changes
  useEffect(() => {
    if (selectedRoom) {
      isUserScrollingRef.current = false;
      // Small delay to ensure messages are loaded
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [selectedRoom?.id]); // Only depend on room ID, not the entire object

  // Scroll to bottom when new messages arrive (if user is at bottom)
  useEffect(() => {
    if (messages.length > 0 && !isUserScrollingRef.current) {
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [messages.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    sendMessage(selectedRoom.id, newMessage);
    setNewMessage('');
    
    // Force scroll to bottom after sending
    isUserScrollingRef.current = false;
    setTimeout(() => scrollToBottom(true), 100);
  };

  const getOtherParticipant = () => {
    if (!selectedRoom || !user) return null;
    return selectedRoom.participant1_id === user.id 
      ? selectedRoom.participant2 
      : selectedRoom.participant1;
  };

  const otherParticipant = getOtherParticipant();

  if (!selectedRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-dark-brown/50 to-deep-brown/50">
        <MessageCircle className="h-20 w-20 text-terracotta-rose/30 mb-4" />
        <h3 className="text-vintage-xl font-libre font-bold text-creamy-yellow mb-2">
          Welcome to Messages
        </h3>
        <p className="text-vintage-base text-creamy-yellow/60 font-varela text-center max-w-md">
          Select a conversation from the sidebar to start chatting, or start a new conversation from the booking page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-dark-brown/50 to-deep-brown/50 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-terracotta-rose/20 bg-gradient-to-r from-dark-brown/80 to-deep-brown/80 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-creamy-white" />
          </div>
          <div>
            <h3 className="font-libre font-semibold text-creamy-yellow text-vintage-lg">
              {otherParticipant?.first_name} {otherParticipant?.last_name}
            </h3>
            <p className="text-vintage-sm text-creamy-yellow/60 font-varela">
              {otherParticipant?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={scrollAreaViewportRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto p-4"
        >
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-terracotta-rose animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-creamy-yellow/60 font-varela">
              <MessageCircle className="h-12 w-12 mb-2 text-terracotta-rose/40" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.id;
              const showDate = index === 0 || 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString();

              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="px-3 py-1 bg-dark-brown/50 border border-terracotta-rose/20 rounded-full">
                        <span className="text-vintage-xs text-creamy-yellow/60 font-varela">
                          {format(new Date(message.created_at), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown'
                          : 'bg-dark-brown/80 border border-terracotta-rose/20 text-creamy-yellow'
                      }`}
                    >
                      <p className="text-vintage-base font-varela break-words">
                        {message.content}
                      </p>
                      <div className={`flex items-center justify-end mt-1 space-x-1`}>
                        <span
                          className={`text-vintage-xs font-varela ${
                            isOwnMessage ? 'text-dark-brown/70' : 'text-creamy-yellow/50'
                          }`}
                        >
                          {format(new Date(message.created_at), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-terracotta-rose/20 bg-gradient-to-r from-dark-brown/80 to-deep-brown/80 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="flex-1 bg-dark-brown/50 border-terracotta-rose/30 text-creamy-yellow placeholder:text-creamy-yellow/40 focus:border-terracotta-rose"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-terracotta-rose to-terracotta-orange text-dark-brown font-libre font-bold hover:shadow-lg hover:shadow-terracotta-rose/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
