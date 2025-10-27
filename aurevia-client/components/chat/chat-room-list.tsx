"use client"

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { ChatRoom } from '@/lib/api/chat';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ChatRoomList() {
  const { user } = useAuth();
  const { chatRooms, selectedRoom, setSelectedRoom, isLoadingRooms } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participant1_id === user?.id ? room.participant2 : room.participant1;
  };

  const formatLastMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  const filteredRooms = chatRooms.filter(room => {
    if (!searchQuery) return true;
    const otherParticipant = getOtherParticipant(room);
    const fullName = `${otherParticipant.first_name} ${otherParticipant.last_name}`.toLowerCase();
    const lastMessage = room.last_message_content?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-walnut-dark/80 border-r border-copper-accent/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-copper-accent/20 flex-shrink-0">
        <h2 className="text-vintage-xl font-playfair font-bold text-cream-light mb-4">
          Messages
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cream-light/40" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            className="pl-10 bg-walnut-darkest/50 border-copper-accent/30 text-cream-light placeholder:text-cream-light/40 focus:border-copper-accent"
          />
        </div>
      </div>

      {/* Chat Room List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingRooms ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-copper-accent/20 border-t-copper-accent"></div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-cream-light/60 font-cormorant">
            <MessageCircle className="h-12 w-12 mb-2 text-copper-accent/40" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-copper-accent/10">
            {filteredRooms.map((room) => {
              const otherParticipant = getOtherParticipant(room);
              const isSelected = selectedRoom?.id === room.id;

              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-4 text-left transition-all duration-200 hover:bg-copper-accent/10 ${
                    isSelected ? 'bg-copper-accent/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-walnut-dark" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-cormorant font-semibold text-cream-light text-vintage-base truncate">
                          {otherParticipant.first_name} {otherParticipant.last_name}
                        </h3>
                        {room.last_message_at && (
                          <span className="text-vintage-xs text-cream-light/60 font-cormorant ml-2 flex-shrink-0">
                            {formatLastMessageTime(room.last_message_at)}
                          </span>
                        )}
                      </div>
                      
                      {/* Last Message */}
                      {room.last_message_content && (
                        <p className="text-vintage-sm text-cream-light/70 font-cormorant truncate">
                          {room.last_message_content}
                        </p>
                      )}

                      {/* Email */}
                      <p className="text-vintage-xs text-cream-light/50 font-cormorant mt-1">
                        {otherParticipant.email}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
