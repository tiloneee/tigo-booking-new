"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Users, Send, Settings, Wifi, WifiOff, User } from "lucide-react"
import { io, Socket } from "socket.io-client"

// Types
interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  roles: string[]
}

interface ChatRoom {
  id: string
  type: string
  participant1_id: string
  participant2_id: string
  participant1: User
  participant2: User
  last_message_content?: string
  last_message_at?: string
  is_active: boolean
  created_at: string
}

interface ChatMessage {
  id: string
  chat_room_id: string
  sender_id: string
  sender: User
  content: string
  type: 'text' | 'file' | 'image'
  status: 'sent' | 'delivered' | 'read'
  created_at: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function ChatTestInterface() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [chatType, setChatType] = useState<'customer_hotel_owner' | 'customer_admin' | 'hotel_owner_admin'>('customer_hotel_owner')
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get auth token from session
  const getAuthToken = () => {
    return (session as any)?.accessToken
  }

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!session) return

    const token = getAuthToken()
    if (!token) return

    const newSocket = io(`${API_BASE_URL}/chat`, {
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to chat server')
      setIsConnected(true)
      setConnectionStatus('Connected')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server')
      setIsConnected(false)
      setConnectionStatus('Disconnected')
    })

    newSocket.on('connected', (data) => {
      console.log('Chat connection confirmed:', data)
      setConnectionStatus('Authenticated')
    })

    newSocket.on('error', (error) => {
      console.error('Chat error:', error)
      setConnectionStatus(`Error: ${error.message}`)
    })

    newSocket.on('new_message', (message: ChatMessage) => {
      console.log('New message received:', message)
      if (selectedRoom && message.chat_room_id === selectedRoom.id) {
        setMessages(prev => [...prev, message])
      }
    })

    newSocket.on('joined_room', (data) => {
      console.log('Joined room:', data)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [session])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch available users for testing
  const fetchUsers = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const usersData = await response.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setChatRooms(data.rooms)
      } else {
        console.error('Failed to fetch chat rooms:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create or get chat room
  const createChatRoom = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: chatType,
          participant1_id: (session as any)?.user?.userId || (session as any)?.user?.id,
          participant2_id: selectedUser.id,
        })
      })

      if (response.ok) {
        const room = await response.json()
        setChatRooms(prev => [...prev, room])
        setSelectedRoom(room)
        
        // Join the room via socket
        if (socket) {
          socket.emit('join_room', { roomId: room.id })
        }
        
        // Fetch messages for this room
        await fetchMessages(room.id)
      } else {
        const errorData = await response.json()
        console.error('Failed to create chat room:', errorData)
      }
    } catch (error) {
      console.error('Failed to create chat room:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages for a room
  const fetchMessages = async (roomId: string) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!selectedRoom || !newMessage.trim() || !socket) return

    try {
      // Send via socket for real-time
      socket.emit('send_message', {
        chat_room_id: selectedRoom.id,
        content: newMessage,
        type: 'text'
      })

      setNewMessage("")
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Select room and join it
  const selectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room)
    
    if (socket) {
      socket.emit('join_room', { roomId: room.id })
    }
    
    await fetchMessages(room.id)
  }

  useEffect(() => {
    if (session) {
      fetchUsers()
      fetchChatRooms()
    }
  }, [session])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[800px]">
      {/* Left Sidebar - Connection Status & Room Creation */}
      <div className="lg:col-span-1 space-y-6">
        {/* Connection Status */}
        <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-400" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-400" />
                )}
                <h3 className="text-cream-light font-playfair text-vintage-lg font-bold">
                  Connection
                </h3>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-cream-light/60 font-cormorant text-vintage-sm">Status</p>
              <p className={`font-cormorant text-vintage-base font-medium ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                {connectionStatus}
              </p>
              <p className="text-cream-light/60 font-cormorant text-vintage-sm">Socket ID</p>
              <p className="text-cream-light/80 font-mono text-vintage-xs break-all">
                {socket?.id || 'Not connected'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Selection */}
        <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
          <CardHeader className="pb-4">
            <h3 className="text-cream-light font-playfair text-vintage-lg font-bold">
              Create Chat Room
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Type Selection */}
            <div>
              <p className="text-cream-light/60 font-cormorant text-vintage-sm mb-2">Chat Type</p>
              <select
                value={chatType}
                onChange={(e) => setChatType(e.target.value as any)}
                className="w-full bg-walnut-medium border border-copper-accent/30 rounded-md px-3 py-2 text-cream-light font-cormorant"
              >
                <option value="customer_hotel_owner">Customer ↔ Hotel Owner</option>
                <option value="customer_admin">Customer ↔ Admin</option>
                <option value="hotel_owner_admin">Hotel Owner ↔ Admin</option>
              </select>
            </div>

            {/* User Selection */}
            <div>
              <p className="text-cream-light/60 font-cormorant text-vintage-sm mb-2">Select User</p>
              <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                  const user = users.find(u => u.id === e.target.value)
                  setSelectedUser(user || null)
                }}
                className="w-full bg-walnut-medium border border-copper-accent/30 rounded-md px-3 py-2 text-cream-light font-cormorant"
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.roles.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            <Button 
              onClick={createChatRoom}
              disabled={!selectedUser || loading}
              className="w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </CardContent>
        </Card>

        {/* Chat Rooms List */}
        <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl">
          <CardHeader className="pb-4">
            <h3 className="text-cream-light font-playfair text-vintage-lg font-bold">
              Chat Rooms ({chatRooms.length})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chatRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className={`p-3 rounded-md cursor-pointer transition-all duration-200 ${
                    selectedRoom?.id === room.id 
                      ? 'bg-copper-accent/20 border border-copper-accent/50' 
                      : 'bg-walnut-medium hover:bg-walnut-light'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-copper-accent" />
                    <div className="flex-1 min-w-0">
                      <p className="text-cream-light font-cormorant text-vintage-sm font-medium truncate">
                        {room.participant1.first_name} ↔ {room.participant2.first_name}
                      </p>
                      <p className="text-cream-light/60 font-cormorant text-vintage-xs truncate">
                        {room.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {chatRooms.length === 0 && (
                <p className="text-cream-light/60 font-cormorant text-vintage-sm text-center py-4">
                  No chat rooms yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-3">
        <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-2xl h-full flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-4 border-b border-copper-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-walnut-dark" />
                    </div>
                    <div>
                      <h3 className="text-cream-light font-playfair text-vintage-lg font-bold">
                        {selectedRoom.participant1.first_name} ↔ {selectedRoom.participant2.first_name}
                      </h3>
                      <p className="text-copper-accent font-cinzel text-vintage-sm uppercase tracking-wider">
                        {selectedRoom.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-cream-light/60 font-cormorant text-vintage-xs">
                      {messages.length} messages
                    </p>
                    <p className="text-cream-light/60 font-cormorant text-vintage-xs">
                      Created {new Date(selectedRoom.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map(message => {
                  const isOwnMessage = message.sender_id === ((session as any)?.user?.userId || (session as any)?.user?.id)
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-copper-accent text-walnut-dark'
                            : 'bg-walnut-medium text-cream-light'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-3 w-3" />
                          <span className="font-cormorant text-vintage-xs font-medium">
                            {message.sender.first_name}
                          </span>
                          <span className="font-cormorant text-vintage-xs opacity-60">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="font-cormorant text-vintage-sm">{message.content}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-copper-accent/50 mx-auto mb-4" />
                    <p className="text-cream-light/60 font-cormorant text-vintage-base">
                      No messages yet
                    </p>
                    <p className="text-cream-light/40 font-cormorant text-vintage-sm mt-2">
                      Send your first message to start the conversation
                    </p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-copper-accent/20">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 bg-walnut-medium border border-copper-accent/30 rounded-md px-4 py-2 text-cream-light font-cormorant placeholder-cream-light/50 focus:border-copper-accent focus:ring-1 focus:ring-copper-accent"
                    disabled={!isConnected}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold hover:shadow-copper-accent/30 transition-all duration-300 hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-copper-accent/50 mx-auto mb-6" />
                <h3 className="text-cream-light font-playfair text-vintage-xl font-bold mb-2">
                  Welcome to Chat Testing
                </h3>
                <p className="text-cream-light/60 font-cormorant text-vintage-base mb-4">
                  Select a chat room or create a new one to start testing the chat system
                </p>
                <div className="space-y-2 text-cream-light/40 font-cormorant text-vintage-sm">
                  <p>• Test real-time messaging</p>
                  <p>• Try different user roles</p>
                  <p>• Monitor connection status</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
