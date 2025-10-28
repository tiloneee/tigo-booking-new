"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { 
  ChatRoom, 
  ChatMessage, 
  getChatRooms as fetchChatRooms,
  getMessages as fetchMessages,
  markMessagesAsRead as markRoomMessagesAsRead
} from './api/chat';

interface ChatContextType {
  // Connection state
  socket: Socket | null;
  isConnected: boolean;
  
  // Chat rooms
  chatRooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  setSelectedRoom: (room: ChatRoom | null) => void;
  loadChatRooms: () => Promise<void>;
  
  // Messages
  messages: ChatMessage[];
  loadMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string) => void;
  
  // Utilities
  markAsRead: (roomId: string) => Promise<void>;
  refreshRooms: () => Promise<void>;
  
  // Loading states
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const selectedRoomRef = useRef<ChatRoom | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !accessToken) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(`${API_BASE_URL}/chat`, {
      auth: { token: accessToken },
      extraHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Chat connection confirmed:', data);
    });

    newSocket.on('error', (error) => {
      console.error('Chat error:', error);
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      console.log('New message received:', message);
      
      // Update messages if message is for the currently selected room
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        if (prev.some(msg => msg.id === message.id)) {
          return prev;
        }
        
        // Only add if it's for the currently selected room
        const currentRoom = selectedRoomRef.current;
        if (currentRoom && message.chat_room_id === currentRoom.id) {
          const newMessages = [...prev, message].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          console.log('Added message to chat:', message.content);
          return newMessages;
        }
        
        console.log('Message not for current room, ignoring display');
        return prev;
      });
      
      // Always update last message in chat rooms list
      setChatRooms(prev => prev.map(room => {
        if (room.id === message.chat_room_id) {
          return {
            ...room,
            last_message_content: message.content,
            last_message_at: message.created_at
          };
        }
        return room;
      }).sort((a, b) => {
        const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return timeB - timeA; // Most recent first
      }));
    });

    newSocket.on('message_sent', (data: { messageId: string; message?: ChatMessage }) => {
      console.log('Message sent confirmation:', data);
    });

    newSocket.on('joined_room', (data) => {
      console.log('Joined room:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, accessToken]); // Don't include selectedRoom in dependencies

  // Load chat rooms
  const loadChatRooms = useCallback(async () => {
    if (!accessToken) return;
    
    setIsLoadingRooms(true);
    try {
      const data = await fetchChatRooms({ limit: 50 });
      setChatRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [accessToken]);

  // Load messages for a room
  const loadMessages = useCallback(async (roomId: string) => {
    if (!accessToken) return;
    
    setIsLoadingMessages(true);
    try {
      const data = await fetchMessages(roomId, { limit: 100 });
      setMessages(data.messages || []);
      console.log('Loaded messages for room:', roomId, 'count:', data.messages?.length);
      
      // Join the room via socket
      if (socket && isConnected) {
        socket.emit('join_room', { roomId });
        console.log('Joined room via socket:', roomId);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [accessToken, socket, isConnected]);

  // Send a message
  const sendMessage = useCallback((roomId: string, content: string) => {
    if (!socket || !isConnected || !content.trim()) return;
    
    console.log('Sending message to room:', roomId);
    socket.emit('send_message', {
      chat_room_id: roomId,
      content: content.trim(),
      type: 'text'
    });
  }, [socket, isConnected]);

  // Mark messages as read
  const markAsRead = useCallback(async (roomId: string) => {
    if (!accessToken) return;
    
    try {
      await markRoomMessagesAsRead(roomId);
      
      // Update room in list to mark as read
      setChatRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, unread_count: 0 } : room
      ));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [accessToken]);

  // Refresh chat rooms
  const refreshRooms = useCallback(async () => {
    await loadChatRooms();
  }, [loadChatRooms]);

  // Load chat rooms on mount
  useEffect(() => {
    if (user && accessToken) {
      loadChatRooms();
    }
  }, [user, accessToken, loadChatRooms]);

  // Load messages when room is selected (prevent infinite loop)
  const prevRoomIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedRoom && selectedRoom.id !== prevRoomIdRef.current) {
      prevRoomIdRef.current = selectedRoom.id;
      console.log('Room changed, loading messages for:', selectedRoom.id);
      loadMessages(selectedRoom.id);
      markAsRead(selectedRoom.id);
    } else if (!selectedRoom) {
      prevRoomIdRef.current = null;
      setMessages([]);
    }
  }, [selectedRoom]);

  const value: ChatContextType = {
    socket,
    isConnected,
    chatRooms,
    selectedRoom,
    setSelectedRoom,
    loadChatRooms,
    messages,
    loadMessages,
    sendMessage,
    markAsRead,
    refreshRooms,
    isLoadingRooms,
    isLoadingMessages
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
