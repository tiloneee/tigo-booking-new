"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Send, Calendar, Hotel, User, Loader2 } from "lucide-react"
import { io, Socket } from "socket.io-client"
import { 
  createChatRoomFromBooking, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead,
  type ChatRoom,
  type ChatMessage 
} from "@/lib/api/chat"
import { formatDistanceToNow } from "date-fns"

interface BookingChatProps {
  bookingId: string
  hotelName?: string
  checkInDate?: string
  checkOutDate?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function BookingChat({ bookingId, hotelName, checkInDate, checkOutDate }: BookingChatProps) {
  const { user, accessToken } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Get other participant info
  const otherParticipant = chatRoom 
    ? (chatRoom.participant1_id === user?.id ? chatRoom.participant2 : chatRoom.participant1)
    : null

  // Initialize chat room and socket connection
  useEffect(() => {
    if (!user || !accessToken || !bookingId) return

    const initializeChat = async () => {
      try {
        setLoading(true)
        // Create or get chat room for this booking
        const room = await createChatRoomFromBooking(bookingId)
        setChatRoom(room)

        // Load existing messages
        const messagesData = await getMessages(room.id, { limit: 50 })
        setMessages(messagesData.messages || [])

        // Mark messages as read
        await markMessagesAsRead(room.id)
      } catch (error) {
        console.error('Failed to initialize chat:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeChat()
  }, [bookingId, user, accessToken])

  // Setup socket connection
  useEffect(() => {
    if (!user || !accessToken || !chatRoom) return

    const newSocket = io(`${API_BASE_URL}/chat`, {
      auth: { token: accessToken },
      extraHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to chat server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server')
      setIsConnected(false)
    })

    newSocket.on('new_message', (message: ChatMessage) => {
      if (message.chat_room_id === chatRoom.id) {
        setMessages(prev => {
          if (prev.some(msg => msg.id === message.id)) return prev
          return [...prev, message]
        })
        
        // Mark as read if not sent by current user
        if (message.sender_id !== user.id) {
          markMessagesAsRead(chatRoom.id)
        }
        
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100)
      }
    })

    newSocket.on('messages_read', (data: { userId: string, roomId: string }) => {
      if (data.roomId === chatRoom.id && data.userId !== user.id) {
        setMessages(prev => prev.map(msg => 
          msg.sender_id === user.id && msg.status !== 'read'
            ? { ...msg, status: 'read' as const }
            : msg
        ))
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [chatRoom, user, accessToken])

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoom || !user || sending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setSending(true)

    try {
      const message = await sendMessage({
        chat_room_id: chatRoom.id,
        content: messageContent,
        type: 'text',
      })

      // Message will be added via socket event
      // But add it optimistically in case socket is slow
      setMessages(prev => {
        if (prev.some(msg => msg.id === message.id)) return prev
        return [...prev, message]
      })
      
      scrollToBottom()
    } catch (error) {
      console.error('Failed to send message:', error)
      setNewMessage(messageContent) // Restore message on error
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!chatRoom) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Unable to load chat</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.avatar_url} />
              <AvatarFallback>
                {otherParticipant?.first_name?.[0]}{otherParticipant?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {otherParticipant?.first_name} {otherParticipant?.last_name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <MessageCircle className="h-3 w-3" />
                <span>Chat about your booking</span>
                {isConnected && (
                  <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                    Online
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </div>
        
        {/* Booking Info */}
        {(hotelName || checkInDate) && (
          <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-4 text-sm">
            {hotelName && (
              <div className="flex items-center gap-2">
                <Hotel className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{hotelName}</span>
              </div>
            )}
            {checkInDate && checkOutDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {new Date(checkInDate).toLocaleDateString()} - {new Date(checkOutDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a conversation about your booking
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.sender.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {message.sender.first_name?.[0]}{message.sender.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {isOwnMessage && (
                          <span className="text-xs text-muted-foreground">
                            {message.status === 'read' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Message Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending || !isConnected}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sending || !isConnected}
              size="icon"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              Connecting to chat server...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
