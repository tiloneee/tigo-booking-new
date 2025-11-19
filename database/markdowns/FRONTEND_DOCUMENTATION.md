# Aurevia Frontend Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture](#architecture)
5. [Routing System](#routing-system)
6. [State Management](#state-management)
7. [Component Organization](#component-organization)
8. [API Integration](#api-integration)
9. [Real-time Features](#real-time-features)
10. [Design System](#design-system)
11. [Authentication & Authorization](#authentication--authorization)
12. [Key Features](#key-features)
13. [Development Guide](#development-guide)
14. [Deployment](#deployment)

---

## System Overview

### Purpose
The Aurevia frontend is a luxury hotel booking platform built with Next.js 15, providing users with an elegant interface to search, book, and manage hotel reservations. It features a comprehensive admin dashboard for hotel management, real-time chat functionality, and a sophisticated notification system.

### Key Features
- **User Authentication**: JWT-based authentication with automatic token refresh
- **Hotel Search & Booking**: Browse hotels, view details, and make reservations
- **Admin Dashboard**: Comprehensive management interface for users, hotels, bookings, and requests
- **Real-time Chat**: WebSocket-based messaging between users and hotel owners
- **Notifications**: Real-time notification system with unread count badges
- **Review System**: Users can leave and view hotel reviews with detailed ratings
- **Balance Management**: Virtual wallet system for booking payments
- **Request System**: Hotel request submissions and approval workflows

### Architecture Pattern
The frontend follows a **Client-Server Architecture** with **App Router** pattern:
- **Next.js App Router**: File-based routing with server and client components
- **Context API**: Global state management for authentication, chat, and notifications
- **API Layer**: Centralized Axios-based HTTP client with interceptors
- **Component-Based UI**: Reusable components with Radix UI primitives
- **Real-time Communication**: Socket.IO client for WebSocket connections

---

## Technology Stack

### Core Framework
- **Next.js 15.2.4**: React framework with App Router, Server/Client components, and Turbopack
- **React 19.0.0**: Latest React with concurrent features and improved hooks
- **TypeScript 5**: Type-safe development with strict mode enabled

### UI & Styling
- **Tailwind CSS 4.1.10**: Utility-first CSS with custom vintage design system
- **Radix UI**: Accessible component primitives
  - `@radix-ui/react-dialog`: Modal dialogs
  - `@radix-ui/react-tabs`: Tab interfaces
  - `@radix-ui/react-avatar`: User avatars
  - `@radix-ui/react-scroll-area`: Custom scrollbars
  - `@radix-ui/react-separator`: Dividers
  - `@radix-ui/react-slot`: Polymorphic components
  - `@radix-ui/react-label`: Form labels
- **Lucide React**: Icon library with 1000+ icons
- **Sonner**: Toast notification library

### Data Fetching & Communication
- **Axios 1.12.2**: HTTP client with request/response interceptors
- **Socket.IO Client 4.8.1**: Real-time WebSocket communication

### Utilities
- **Date-fns 4.1.0**: Modern date utility library
- **clsx**: Conditional CSS class names
- **tailwind-merge**: Merge Tailwind CSS classes intelligently

### Development Tools
- **ESLint**: Code linting with TypeScript support
- **TypeScript**: Static type checking
- **Turbopack**: Ultra-fast development bundler (Next.js 15)

---

## Project Structure

```
aurevia-client/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles and CSS variables
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── (dashboard)/             # Dashboard route group
│   │   └── admin/
│   │       ├── page.tsx         # Admin dashboard main page
│   │       └── hotel/
│   │           └── [id]/
│   │               └── page.tsx # Hotel management page
│   └── (user)/                  # User route group
│       ├── auth/                # Authentication pages
│       ├── booking/             # Booking flow
│       ├── bookings/            # User bookings list
│       ├── chat/                # Chat interface
│       ├── dashboard/           # User dashboard
│       ├── hotels/              # Hotel browsing
│       ├── notifications/       # Notifications page
│       ├── profile/             # User profile
│       └── requests/            # Hotel request submission
│
├── components/                   # React components
│   ├── about.tsx                # Landing page sections
│   ├── featured-hotels.tsx
│   ├── hero.tsx
│   ├── header.tsx               # Global header
│   ├── footer.tsx               # Global footer
│   ├── auth/                    # Authentication components
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── chat/                    # Chat components
│   │   ├── chat-interface.tsx
│   │   ├── chat-room-list.tsx
│   │   └── chat-message-list.tsx
│   ├── dashboard/               # Dashboard components
│   │   ├── users-tab.tsx
│   │   ├── hotels-tab.tsx
│   │   ├── hotel-requests-tab.tsx
│   │   ├── balance-requests-tab.tsx
│   │   └── hotel-management/    # Hotel management tabs
│   │       ├── hotel-info-tab.tsx
│   │       ├── rooms-management-tab.tsx
│   │       ├── bookings-management-tab.tsx
│   │       └── reviews-management-tab.tsx
│   ├── hotels/                  # Hotel browsing components
│   │   ├── hotel-card.tsx
│   │   ├── hotel-details.tsx
│   │   └── room-selection.tsx
│   ├── notifications/           # Notification components
│   │   ├── notification-provider.tsx
│   │   └── notification-list.tsx
│   ├── reviews/                 # Review components
│   │   └── review-card.tsx
│   └── ui/                      # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── tabs.tsx
│       └── ...
│
├── lib/                          # Utilities and hooks
│   ├── auth-context.tsx         # Authentication context
│   ├── chat-context.tsx         # Chat context with Socket.IO
│   ├── axios.ts                 # Axios instance configuration
│   ├── utils.ts                 # Utility functions
│   ├── api/                     # API service layer
│   │   ├── balance.ts           # Balance operations
│   │   ├── chat.ts              # Chat API
│   │   ├── dashboard.ts         # Dashboard data
│   │   ├── hotel-deletion-requests.ts
│   │   ├── hotel-requests.ts
│   │   ├── hotels.ts            # Hotel CRUD operations
│   │   ├── notifications.ts     # Notification API
│   │   └── reviews.ts           # Review operations
│   └── hooks/                   # Custom React hooks
│       └── use-toast.ts
│
├── types/                        # TypeScript type definitions
│   ├── dashboard.ts             # Dashboard types
│   ├── hotel.ts                 # Hotel and room types
│   └── review.ts                # Review types
│
├── public/                       # Static assets
│   └── images/
│
├── tailwind.config.ts           # Tailwind configuration
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

### Key Directories Explained

#### `app/` Directory
Uses Next.js 15 App Router with route groups:
- `(dashboard)/`: Admin dashboard routes with authentication guard
- `(user)/`: User-facing routes for authenticated users
- Layout files provide nested layouts with provider wrapping

#### `components/` Directory
Organized by feature domain:
- **Feature components**: Specific to a feature (e.g., `chat/`, `dashboard/`)
- **Shared components**: Reusable across features (e.g., `header.tsx`, `footer.tsx`)
- **UI components**: Design system primitives (e.g., `ui/button.tsx`)

#### `lib/` Directory
Contains business logic and utilities:
- **Contexts**: Global state providers (auth, chat)
- **API layer**: Service functions for backend communication
- **Hooks**: Custom React hooks for common patterns
- **Utils**: Helper functions (e.g., `cn()` for class merging)

#### `types/` Directory
TypeScript type definitions organized by domain

---

## Architecture

### Component Architecture

The application follows a **layered component architecture**:

```
┌─────────────────────────────────────┐
│         App Router (Pages)          │  ← Route components
├─────────────────────────────────────┤
│      Feature Components             │  ← Business logic components
├─────────────────────────────────────┤
│      UI Components (Radix)          │  ← Reusable primitives
├─────────────────────────────────────┤
│      Context Providers              │  ← Global state
├─────────────────────────────────────┤
│      API Layer (Axios)              │  ← Backend communication
└─────────────────────────────────────┘
```

### Data Flow

```
User Interaction
      ↓
Component State (useState)
      ↓
API Service Function (lib/api/)
      ↓
Axios Instance (with interceptors)
      ↓
Backend API (NestJS)
      ↓
Response Processing
      ↓
State Update / Context Update
      ↓
UI Re-render
```

### Real-time Flow

```
Socket.IO Connection (ChatContext)
      ↓
Event Listener (socket.on('newMessage'))
      ↓
Context State Update (setMessages)
      ↓
Component Re-render (ChatInterface)
      ↓
Display New Message
```

---

## Routing System

### App Router Structure

Next.js 15 App Router uses file-system based routing:

```typescript
// Route Groups (not part of URL)
(dashboard)/admin/page.tsx           → /admin
(user)/hotels/page.tsx               → /hotels

// Dynamic Routes
(dashboard)/admin/hotel/[id]/page.tsx → /admin/hotel/123
(user)/hotels/[id]/page.tsx          → /hotels/456

// Nested Layouts
(dashboard)/layout.tsx               → Wraps all /admin routes
(user)/layout.tsx                    → Wraps all user routes
```

### Key Routes

#### Public Routes
- `/` - Landing page with hero, featured hotels, testimonials
- `/hotels` - Hotel browsing and search (requires auth)

#### User Routes
- `/auth/login` - User login
- `/auth/register` - User registration
- `/dashboard` - User dashboard with bookings, balance
- `/hotels` - Hotel listing and search
- `/hotels/[id]` - Hotel details and room selection
- `/booking/[id]` - Booking flow and confirmation
- `/bookings` - User's booking history
- `/chat` - Chat interface with hotel owners
- `/notifications` - Notification center
- `/profile` - User profile management
- `/requests` - Hotel request submission

#### Admin Routes
- `/admin` - Admin dashboard with tabs:
  - Users tab - User management
  - Hotels tab - Hotel management
  - Hotel Requests tab - Approve/reject hotel requests
  - Balance Requests tab - Approve/reject balance top-ups
  - Hotel Deletion Requests tab - Handle deletion requests
- `/admin/hotel/[id]` - Hotel management page with tabs:
  - Info tab - Edit hotel details and amenities
  - Rooms tab - Manage rooms and availability
  - Bookings tab - Manage hotel bookings
  - Reviews tab - View hotel reviews

### Route Protection

```typescript
// Auth protection in layout.tsx or middleware
"use client"

export default function ProtectedLayout({ children }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return <LoadingSpinner />
  if (!user) return null

  return <>{children}</>
}
```

### Navigation

```typescript
// Programmatic navigation
import { useRouter } from 'next/navigation'

const router = useRouter()

// Navigate to hotel details
router.push(`/hotels/${hotelId}`)

// Navigate with query params
router.push(`/bookings?status=pending`)

// Replace history (no back button)
router.replace('/dashboard')
```

---

## State Management

### Context API

The application uses React Context API for global state management.

#### 1. Auth Context

```typescript
// lib/auth-context.tsx
interface AuthContextType {
  user: User | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<string>
  isLoading: boolean
}

// Usage
const { user, accessToken, login, logout } = useAuth()
```

**Key Features**:
- JWT token management with automatic refresh
- User state persistence
- Role normalization (string[] or Role[] → string[])
- Refresh token stored in httpOnly cookie
- Access token in memory + context

#### 2. Chat Context

```typescript
// lib/chat-context.tsx
interface ChatContextType {
  socket: Socket | null
  isConnected: boolean
  chatRooms: ChatRoom[]
  selectedRoom: ChatRoom | null
  messages: ChatMessage[]
  loadChatRooms: () => Promise<void>
  loadMessages: (roomId: string) => Promise<void>
  sendMessage: (roomId: string, content: string) => void
  markAsRead: (roomId: string) => Promise<void>
  setSelectedRoom: (room: ChatRoom | null) => void
  isLoadingRooms: boolean
  isLoadingMessages: boolean
}

// Usage
const { socket, chatRooms, messages, sendMessage } = useChat()
```

**Key Features**:
- Socket.IO connection management
- Real-time message handling
- Chat room state management
- Message read/unread tracking
- Automatic reconnection

#### 3. Notification Context

```typescript
// components/notifications/notification-provider.tsx
interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loadNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  socket: Socket | null
}

// Usage
const { notifications, unreadCount, markAsRead } = useNotifications()
```

**Key Features**:
- Real-time notification updates via WebSocket
- Unread count tracking
- Notification CRUD operations
- Toast integration for new notifications

### Local Component State

```typescript
// Simple state management
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState({ name: '', email: '' })

// Optimistic UI updates
const [localBookings, setLocalBookings] = useState(bookings)

const handleConfirmBooking = async (bookingId: string) => {
  // Optimistic update
  setLocalBookings(prev => 
    prev.map(b => b.id === bookingId ? { ...b, status: 'Confirmed' } : b)
  )
  
  try {
    await confirmBooking(bookingId)
    onRefresh() // Refresh from server
  } catch (error) {
    // Revert on error
    setLocalBookings(bookings)
    toast.error('Failed to confirm booking')
  }
}
```

---

## Component Organization

### Component Types

#### 1. Page Components (App Router)
Located in `app/` directory, handle routing and data fetching.

```typescript
// app/(user)/hotels/page.tsx
'use client'

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  
  useEffect(() => {
    loadHotels()
  }, [])
  
  return <HotelList hotels={hotels} />
}
```

#### 2. Feature Components
Business logic components for specific features.

```typescript
// components/dashboard/hotels-tab.tsx
interface HotelsTabProps {
  hotels: Hotel[]
  accessToken: string
  isAdmin: boolean
  onRefresh: () => void
}

export default function HotelsTab({ hotels, accessToken, isAdmin, onRefresh }: HotelsTabProps) {
  // Hotel management logic
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hotels.map(hotel => <HotelCard key={hotel.id} hotel={hotel} />)}
    </div>
  )
}
```

#### 3. UI Components (Design System)
Reusable primitives in `components/ui/`.

```typescript
// components/ui/button.tsx
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default',
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        variant === 'default' && 'bg-terracotta-rose text-creamy-yellow',
        size === 'lg' && 'h-12 px-8',
        className
      )}
      {...props}
    />
  )
}
```

### Component Patterns

#### Modal Pattern

```typescript
// components/dashboard/edit-hotel-modal.tsx
interface EditHotelModalProps {
  isOpen: boolean
  onClose: () => void
  hotel: Hotel | null
  onSuccess: () => void
}

export function EditHotelModal({ isOpen, onClose, hotel, onSuccess }: EditHotelModalProps) {
  const [formData, setFormData] = useState(hotel)
  
  const handleSubmit = async () => {
    await updateHotel(hotel.id, formData)
    toast.success('Hotel updated successfully')
    onSuccess()
    onClose()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

#### Tab Pattern

```typescript
// app/(dashboard)/admin/hotel/[id]/page.tsx
export default function HotelManagementPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('info')
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="info">Hotel Info</TabsTrigger>
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      
      <TabsContent value="info">
        <HotelInfoTab hotel={hotel} />
      </TabsContent>
      {/* Other tabs */}
    </Tabs>
  )
}
```

---

## API Integration

### Axios Configuration

```typescript
// lib/axios.ts
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
})

// Request interceptor - Add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If 401 and not already retried, refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true
        })
        
        localStorage.setItem('access_token', data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance
```

### API Service Layer

Each domain has its own API service file in `lib/api/`.

#### Hotels API

```typescript
// lib/api/hotels.ts
import axiosInstance from '../axios'
import type { Hotel, Room } from '@/types/hotel'

export const getHotels = async (): Promise<Hotel[]> => {
  const response = await axiosInstance.get('/hotels')
  return response.data
}

export const getHotelById = async (id: string): Promise<Hotel> => {
  const response = await axiosInstance.get(`/hotels/${id}`)
  return response.data
}

export const createHotel = async (hotelData: Partial<Hotel>): Promise<Hotel> => {
  const response = await axiosInstance.post('/hotels', hotelData)
  return response.data
}

export const updateHotel = async (id: string, hotelData: Partial<Hotel>): Promise<Hotel> => {
  const response = await axiosInstance.patch(`/hotels/${id}`, hotelData)
  return response.data
}

export const deleteHotel = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/hotels/${id}`)
}

// Room operations
export const getRooms = async (hotelId: string): Promise<Room[]> => {
  const response = await axiosInstance.get(`/hotels/${hotelId}/rooms`)
  return response.data
}

export const createRoom = async (hotelId: string, roomData: Partial<Room>): Promise<Room> => {
  const response = await axiosInstance.post(`/hotels/${hotelId}/rooms`, roomData)
  return response.data
}

export const updateRoom = async (hotelId: string, roomId: string, roomData: Partial<Room>): Promise<Room> => {
  const response = await axiosInstance.patch(`/hotels/${hotelId}/rooms/${roomId}`, roomData)
  return response.data
}

export const deleteRoom = async (hotelId: string, roomId: string): Promise<void> => {
  await axiosInstance.delete(`/hotels/${hotelId}/rooms/${roomId}`)
}
```

#### Dashboard API

```typescript
// lib/api/dashboard.ts
import axiosInstance from '../axios'
import type { User, Hotel, HotelRequest, BalanceRequest } from '@/types/dashboard'

export const dashboardApi = {
  // Users
  getAllUsers: async (): Promise<User[]> => {
    const response = await axiosInstance.get('/users')
    return response.data
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<User> => {
    const response = await axiosInstance.patch(`/users/${userId}/status`, { is_active: isActive })
    return response.data
  },

  // Hotels
  getAllHotels: async (): Promise<Hotel[]> => {
    const response = await axiosInstance.get('/hotels/all')
    return response.data
  },

  updateHotelStatus: async (hotelId: string, isActive: boolean): Promise<Hotel> => {
    const response = await axiosInstance.patch(`/hotels/${hotelId}/status`, { is_active: isActive })
    return response.data
  },

  // Hotel Requests
  getHotelRequests: async (): Promise<HotelRequest[]> => {
    const response = await axiosInstance.get('/hotel-requests')
    return response.data
  },

  approveHotelRequest: async (requestId: string): Promise<void> => {
    await axiosInstance.post(`/hotel-requests/${requestId}/approve`)
  },

  rejectHotelRequest: async (requestId: string): Promise<void> => {
    await axiosInstance.post(`/hotel-requests/${requestId}/reject`)
  },

  // Balance Requests
  getBalanceRequests: async (): Promise<BalanceRequest[]> => {
    const response = await axiosInstance.get('/balance-requests')
    return response.data
  },

  approveBalanceRequest: async (requestId: string): Promise<void> => {
    await axiosInstance.post(`/balance-requests/${requestId}/approve`)
  },

  rejectBalanceRequest: async (requestId: string): Promise<void> => {
    await axiosInstance.post(`/balance-requests/${requestId}/reject`)
  },
}
```

#### Chat API

```typescript
// lib/api/chat.ts
import axiosInstance from '../axios'

export interface ChatRoom {
  id: string
  hotel: {
    id: string
    name: string
  }
  user: {
    id: string
    first_name: string
    last_name: string
  }
  last_message?: string
  last_message_at?: string
  unread_count: number
  created_at: string
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  sender: {
    id: string
    first_name: string
    last_name: string
  }
  content: string
  is_read: boolean
  created_at: string
}

export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await axiosInstance.get('/chat/rooms')
  return response.data
}

export const getMessages = async (roomId: string): Promise<ChatMessage[]> => {
  const response = await axiosInstance.get(`/chat/rooms/${roomId}/messages`)
  return response.data
}

export const markMessagesAsRead = async (roomId: string): Promise<void> => {
  await axiosInstance.post(`/chat/rooms/${roomId}/read`)
}
```

### Error Handling

```typescript
// Centralized error handling in components
try {
  const hotel = await getHotelById(hotelId)
  setHotel(hotel)
} catch (error: any) {
  const errorMessage = error.response?.data?.message || error.message || 'Failed to load hotel'
  toast.error(errorMessage)
  console.error('Hotel fetch error:', error)
}
```

---

## Real-time Features

### Socket.IO Integration

The application uses Socket.IO for real-time features:
- Chat messaging
- Notifications

#### Chat Context with WebSocket

```typescript
// lib/chat-context.tsx (simplified)
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !accessToken) return

    const newSocket = io(API_BASE_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    // Listen for new messages
    newSocket.on('newMessage', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
      
      // Show toast notification
      if (message.sender_id !== user.id) {
        toast.info(`New message from ${message.sender.first_name}`)
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user, accessToken])

  // Send message function
  const sendMessage = useCallback((roomId: string, content: string) => {
    if (!socket || !isConnected) {
      toast.error('Not connected to chat server')
      return
    }

    socket.emit('sendMessage', {
      room_id: roomId,
      content,
    })
  }, [socket, isConnected])

  return (
    <ChatContext.Provider value={{ 
      socket, 
      isConnected, 
      messages, 
      sendMessage,
      // ... other values
    }}>
      {children}
    </ChatContext.Provider>
  )
}
```

#### Notification Provider with WebSocket

```typescript
// components/notifications/notification-provider.tsx
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Socket.IO connection
  useEffect(() => {
    if (!user || !accessToken) return

    const newSocket = io(API_BASE_URL, {
      auth: { token: accessToken },
    })

    // Listen for new notifications
    newSocket.on('newNotification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show toast
      toast.info(notification.title, {
        description: notification.message,
      })
    })

    setSocket(newSocket)

    return () => newSocket.disconnect()
  }, [user, accessToken])

  // Load notifications
  const loadNotifications = async () => {
    const data = await getNotifications()
    setNotifications(data.notifications)
    setUnreadCount(data.unread_count)
  }

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loadNotifications,
      // ... other values
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
```

### WebSocket Events

#### Chat Events

**Client → Server**:
- `sendMessage`: Send a new message
  ```typescript
  socket.emit('sendMessage', {
    room_id: 'room-123',
    content: 'Hello!'
  })
  ```

- `joinRoom`: Join a chat room
  ```typescript
  socket.emit('joinRoom', { room_id: 'room-123' })
  ```

**Server → Client**:
- `newMessage`: New message received
  ```typescript
  socket.on('newMessage', (message: ChatMessage) => {
    // Update UI with new message
  })
  ```

#### Notification Events

**Server → Client**:
- `newNotification`: New notification received
  ```typescript
  socket.on('newNotification', (notification: Notification) => {
    // Show toast and update badge
  })
  ```

---

## Design System

### Color Palette (Vintage Theme)

```typescript
// tailwind.config.ts
const colors = {
  // Primary colors
  'terracotta-rose': '#B77466',
  'creamy-yellow': '#FFE1AF',
  'deep-brown': '#4A3B2F',
  'dark-brown': '#3D2D25',
  
  // Secondary/accent colors
  'soft-terracotta': '#E2B59A',
  'light-cream': '#F5E6D3',
  'warm-beige': '#D4C4B0',
  'muted-brown': '#6B5D52',
  
  // Gradients (used in backgrounds)
  'gradient-vintage': 'linear-gradient(135deg, #4A3B2F 0%, #3D2D25 100%)',
}
```

### Typography

```typescript
// Font families
{
  libre: ['Libre Baskerville', 'serif'],       // Headings
  varela: ['Varela Round', 'sans-serif'],      // Body text
  pridi: ['Pridi', 'serif'],                   // Alternative serif
  fraunces: ['Fraunces', 'serif'],             // Display text
}

// Font sizes (vintage scale)
{
  'vintage-xs': '0.75rem',    // 12px
  'vintage-sm': '0.875rem',   // 14px
  'vintage-base': '1rem',     // 16px
  'vintage-lg': '1.125rem',   // 18px
  'vintage-xl': '1.25rem',    // 20px
  'vintage-2xl': '1.5rem',    // 24px
  'vintage-3xl': '1.875rem',  // 30px
  'vintage-4xl': '2.25rem',   // 36px
  'vintage-5xl': '3rem',      // 48px
  'vintage-6xl': '3.75rem',   // 60px
  'vintage-7xl': '4.5rem',    // 72px
}
```

### Component Styling Patterns

#### Card Component

```typescript
<Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 hover:shadow-lg transition-all duration-300">
  <CardHeader>
    <CardTitle className="text-vintage-xl font-libre text-creamy-yellow">
      Hotel Name
    </CardTitle>
  </CardHeader>
  <CardContent className="text-vintage-base font-varela text-soft-terracotta">
    Description
  </CardContent>
</Card>
```

#### Button Variants

```typescript
// Primary button
<Button className="bg-terracotta-rose text-creamy-yellow hover:bg-terracotta-rose/90">
  Confirm
</Button>

// Outline button
<Button variant="outline" className="border-terracotta-rose/50 text-terracotta-rose hover:bg-terracotta-rose/10">
  Cancel
</Button>

// Ghost button
<Button variant="ghost" className="text-soft-terracotta hover:text-terracotta-rose hover:bg-terracotta-rose/10">
  View Details
</Button>
```

#### Badge Variants

```typescript
// Status badges
<Badge className="bg-green-500/20 text-green-400">Active</Badge>
<Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
<Badge className="bg-red-500/20 text-red-400">Inactive</Badge>
```

### Responsive Design

```typescript
// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>

// Flex layouts
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Content</div>
  <div className="w-full md:w-64">Sidebar</div>
</div>
```

### CSS Variables

```css
/* app/globals.css */
:root {
  --background: 60 11% 18%;         /* deep-brown */
  --foreground: 41 100% 84%;        /* creamy-yellow */
  --primary: 9 40% 56%;             /* terracotta-rose */
  --primary-foreground: 41 100% 84%;
  --muted: 25 12% 38%;              /* muted-brown */
  --accent: 9 52% 75%;              /* soft-terracotta */
  --border: 9 40% 56%;              /* terracotta-rose with opacity */
  --radius: 0.5rem;
}
```

---

## Authentication & Authorization

### JWT Authentication Flow

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       ↓
┌─────────────────────────────────┐
│  POST /auth/login               │
│  { email, password }            │
└──────┬──────────────────────────┘
       ↓
┌─────────────────────────────────┐
│  Response:                      │
│  - access_token (15min)         │
│  - user object                  │
│  - refresh_token (httpOnly)     │
└──────┬──────────────────────────┘
       ↓
┌─────────────────────────────────┐
│  Store in AuthContext:          │
│  - access_token → context       │
│  - user → context               │
│  - refresh_token → cookie       │
└─────────────────────────────────┘
```

### Auth Context Implementation

```typescript
// lib/auth-context.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      setAccessToken(token)
      setUser(JSON.parse(storedUser))
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    
    // Store access token
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    setAccessToken(response.access_token)
    setUser(response.user)
  }

  const logout = async () => {
    await authApi.logout() // Clears httpOnly refresh_token cookie
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    
    setAccessToken(null)
    setUser(null)
  }

  const refreshToken = async () => {
    const response = await authApi.refreshToken()
    
    localStorage.setItem('access_token', response.access_token)
    setAccessToken(response.access_token)
    
    return response.access_token
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, refreshToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Token Refresh Flow

```typescript
// lib/axios.ts - Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 Unauthorized and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Call refresh endpoint (reads httpOnly cookie)
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true
        })

        // Update access token
        localStorage.setItem('access_token', data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`

        // Retry original request
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('access_token')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
```

### Role-Based Access Control

```typescript
// lib/api.ts - Helper functions
export const hasRole = (user: User | null, roleName: string): boolean => {
  if (!user?.roles) return false
  return user.roles.includes(roleName)
}

export const getRoleNames = (user: User | null): string[] => {
  if (!user?.roles) return []
  return user.roles
}

// Usage in components
const { user } = useAuth()
const isAdmin = hasRole(user, 'admin')
const isHotelOwner = hasRole(user, 'hotel_owner')

{isAdmin && <AdminDashboard />}
{isHotelOwner && <HotelManagement />}
```

### Protected Routes

```typescript
// app/(dashboard)/layout.tsx
'use client'

export default function DashboardLayout({ children }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-deep-brown">
      <DashboardHeader />
      <main>{children}</main>
    </div>
  )
}
```

---

## Key Features

### 1. Admin Dashboard

**Location**: `/admin`

**Components**:
- `app/(dashboard)/admin/page.tsx` - Main dashboard page
- `components/dashboard/users-tab.tsx` - User management
- `components/dashboard/hotels-tab.tsx` - Hotel cards with navigation
- `components/dashboard/hotel-requests-tab.tsx` - Approve/reject requests
- `components/dashboard/balance-requests-tab.tsx` - Balance top-up approvals

**Features**:
- Tab-based interface for different management sections
- Real-time data updates
- Approve/reject workflows
- User activation/deactivation
- Hotel activation/deactivation

### 2. Hotel Management

**Location**: `/admin/hotel/[id]`

**Components**:
- `app/(dashboard)/admin/hotel/[id]/page.tsx` - Main page
- `components/dashboard/hotel-management/hotel-info-tab.tsx` - Edit hotel & amenities
- `components/dashboard/hotel-management/rooms-management-tab.tsx` - Room CRUD + availability
- `components/dashboard/hotel-management/bookings-management-tab.tsx` - Booking status updates
- `components/dashboard/hotel-management/reviews-management-tab.tsx` - Review display

**Features**:
- **Info Tab**: Edit hotel details, manage amenities (add/remove)
- **Rooms Tab**: Create/edit/delete rooms, manage availability calendars
- **Bookings Tab**: View bookings, confirm/cancel/complete status changes
- **Reviews Tab**: View reviews, filter by rating, search by reviewer

**Key Implementation**:
```typescript
// Optimistic UI updates in bookings
const handleConfirmBooking = async (bookingId: string) => {
  setLocalBookings(prev => 
    prev.map(b => b.id === bookingId ? { ...b, status: 'Confirmed' } : b)
  )
  
  try {
    await confirmBooking(bookingId, accessToken)
    toast.success('Booking confirmed')
    onRefresh()
  } catch (error) {
    setLocalBookings(bookings) // Revert
    toast.error('Failed to confirm booking')
  }
}
```

### 3. Real-time Chat

**Location**: `/chat`

**Components**:
- `components/chat/chat-interface.tsx` - Main chat UI
- `components/chat/chat-room-list.tsx` - Room selection
- `components/chat/chat-message-list.tsx` - Message display

**Features**:
- Real-time messaging via Socket.IO
- Unread message counts
- Message read/unread status
- Auto-scroll to new messages
- User/hotel owner identification

**WebSocket Events**:
```typescript
// Send message
socket.emit('sendMessage', {
  room_id: selectedRoom.id,
  content: messageText
})

// Receive message
socket.on('newMessage', (message) => {
  setMessages(prev => [...prev, message])
})
```

### 4. Notification System

**Location**: `/notifications`

**Components**:
- `components/notifications/notification-provider.tsx` - Context provider
- `components/notifications/notification-list.tsx` - Notification display

**Features**:
- Real-time notifications via WebSocket
- Unread count badge
- Mark as read functionality
- Mark all as read
- Toast notifications for new events

**Integration**:
```typescript
// In app/layout.tsx
<NotificationProvider>
  <Header /> {/* Shows unread count badge */}
  {children}
</NotificationProvider>
```

### 5. Hotel Search & Booking

**Location**: `/hotels`, `/hotels/[id]`, `/booking/[id]`

**Features**:
- Hotel listing with filters
- Hotel detail view with room selection
- Availability checking
- Booking flow with balance deduction
- Booking confirmation

### 6. User Dashboard

**Location**: `/dashboard`

**Features**:
- View current balance
- Booking history
- Request hotel submissions
- Profile management

---

## Development Guide

### Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3000

# Run development server
npm run dev
# Opens at http://localhost:3001
```

### Development Commands

```bash
# Development server (Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000  # Backend API URL
```

### Adding New Features

#### 1. Create API Service

```typescript
// lib/api/my-feature.ts
import axiosInstance from '../axios'

export interface MyFeature {
  id: string
  name: string
}

export const getMyFeatures = async (): Promise<MyFeature[]> => {
  const response = await axiosInstance.get('/my-features')
  return response.data
}
```

#### 2. Create Type Definition

```typescript
// types/my-feature.ts
export interface MyFeature {
  id: string
  name: string
  created_at: string
}
```

#### 3. Create Component

```typescript
// components/my-feature/feature-list.tsx
'use client'

import { useState, useEffect } from 'react'
import { getMyFeatures } from '@/lib/api/my-feature'

export default function FeatureList() {
  const [features, setFeatures] = useState([])
  
  useEffect(() => {
    loadFeatures()
  }, [])
  
  const loadFeatures = async () => {
    const data = await getMyFeatures()
    setFeatures(data)
  }
  
  return (
    <div>
      {features.map(feature => (
        <div key={feature.id}>{feature.name}</div>
      ))}
    </div>
  )
}
```

#### 4. Create Page

```typescript
// app/(user)/my-feature/page.tsx
import FeatureList from '@/components/my-feature/feature-list'

export default function MyFeaturePage() {
  return (
    <div>
      <h1>My Feature</h1>
      <FeatureList />
    </div>
  )
}
```

### Best Practices

1. **Use TypeScript**: Always define types for props, state, and API responses
2. **Error Handling**: Wrap API calls in try-catch, show user-friendly errors
3. **Loading States**: Show loading indicators during async operations
4. **Optimistic UI**: Update UI immediately, revert on error
5. **Accessibility**: Use semantic HTML and ARIA labels
6. **Performance**: Memoize expensive computations, lazy load components
7. **SEO**: Use Next.js metadata API for page titles and descriptions

---

## Deployment

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build
# Creates optimized build in .next/

# 3. Start production server
npm start
# Runs on port 3001 by default
```

### Environment Configuration

```bash
# Production .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./aurevia-client
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3000
    depends_on:
      - backend
    restart: unless-stopped
```

### Deployment Checklist

- [ ] Set production `NEXT_PUBLIC_API_URL`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS on backend for frontend domain
- [ ] Set up CDN for static assets
- [ ] Enable compression (gzip/brotli)
- [ ] Set up monitoring and error tracking
- [ ] Configure caching headers
- [ ] Test all WebSocket connections
- [ ] Verify JWT refresh flow works across domain

### Performance Optimization

1. **Image Optimization**: Use Next.js `<Image>` component
2. **Code Splitting**: Automatic with Next.js App Router
3. **Lazy Loading**: Use `React.lazy()` for heavy components
4. **Caching**: Configure stale-while-revalidate for API calls
5. **Bundle Analysis**: Run `npm run build` and check bundle sizes

---

## Troubleshooting

### Common Issues

#### 1. 401 Unauthorized Errors

**Problem**: API calls fail with 401 after some time

**Solution**: Check token refresh flow
```typescript
// Verify withCredentials is set
axiosInstance.defaults.withCredentials = true

// Check refresh token cookie is being sent
// In browser DevTools → Application → Cookies
// Should see 'refresh_token' cookie
```

#### 2. CORS Errors

**Problem**: Browser blocks API requests

**Solution**: Configure backend CORS
```typescript
// Backend: main.ts
app.enableCors({
  origin: 'http://localhost:3001',
  credentials: true,
})
```

#### 3. WebSocket Connection Fails

**Problem**: Socket.IO not connecting

**Solution**: Check transports and auth
```typescript
const socket = io(API_BASE_URL, {
  auth: { token: accessToken },
  transports: ['websocket', 'polling'], // Add polling fallback
})
```

#### 4. Hydration Errors

**Problem**: "Hydration failed" errors in console

**Solution**: Use `suppressHydrationWarning` or client-only rendering
```typescript
// For components with time-sensitive or random data
'use client'

export default function ClientOnlyComponent() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  
  if (!mounted) return null
  
  return <div>{new Date().toLocaleString()}</div>
}
```

### Debug Mode

```typescript
// Enable verbose logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('API Response:', response)
  console.log('Socket Event:', eventData)
}
```

---

## Appendix

### Useful Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
  }
}
```

### Keyboard Shortcuts (Development)

- `Ctrl + Shift + R` - Hard refresh (clear cache)
- `Ctrl + Shift + I` - Open DevTools
- `Ctrl + Shift + M` - Toggle device emulation
- `F12` - Open Console

### Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Tigo Booking Development Team
