"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { io, Socket } from 'socket.io-client'

// Notification types
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: 'UNREAD' | 'READ' | 'ARCHIVED'
  metadata?: any
  related_entity_type?: string
  related_entity_id?: string
  created_at: string
  updated_at: string
}

// Notification state
interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  socket: Socket | null
}

// Actions
type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; notifications: Notification[] }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'UPDATE_UNREAD_COUNT'; count: number }
  | { type: 'MARK_AS_READ'; notificationId: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; notificationId: string }
  | { type: 'DELETE_ALL_NOTIFICATIONS' }
  | { type: 'SET_CONNECTION_STATUS'; isConnected: boolean }
  | { type: 'SET_SOCKET'; socket: Socket | null }

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  socket: null,
}

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.notifications }
    case 'ADD_NOTIFICATION':
      // Only increment unread count if the notification is unread
      const shouldIncrementUnread = action.notification.status === 'UNREAD'
      return {
        ...state,
        notifications: [action.notification, ...state.notifications],
        unreadCount: shouldIncrementUnread ? state.unreadCount + 1 : state.unreadCount,
      }
    case 'UPDATE_UNREAD_COUNT':
      return { ...state, unreadCount: action.count }
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.notificationId ? { ...n, status: 'READ' as const } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, status: 'READ' as const })),
        unreadCount: 0,
      }
    case 'DELETE_NOTIFICATION':
      const notificationToDelete = state.notifications.find(n => n.id === action.notificationId)
      const wasUnread = notificationToDelete?.status === 'UNREAD'
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.notificationId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    case 'DELETE_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      }
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.isConnected }
    case 'SET_SOCKET':
      return { ...state, socket: action.socket }
    default:
      return state
  }
}

// Context
const NotificationContext = createContext<{
  state: NotificationState
  dispatch: React.Dispatch<NotificationAction>
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
}>({
  state: initialState,
  dispatch: () => null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  deleteAllNotifications: async () => {},
})

// Provider component
interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  const { accessToken, user } = useAuth()
  const [lastToken, setLastToken] = React.useState<string | null>(null)

  // API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications?page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({ type: 'SET_NOTIFICATIONS', notifications: data.notifications })
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [accessToken, API_BASE_URL])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/mark`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'READ' }),
      })

      if (response.ok) {
        dispatch({ type: 'MARK_AS_READ', notificationId })
        // Also emit to socket for real-time update
        if (state.socket) {
          state.socket.emit('mark_as_read', { notificationId })
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [accessToken, API_BASE_URL, state.socket])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        dispatch({ type: 'MARK_ALL_AS_READ' })
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [accessToken, API_BASE_URL])

  // Delete a specific notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        dispatch({ type: 'DELETE_NOTIFICATION', notificationId })
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [accessToken, API_BASE_URL])

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/delete-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        dispatch({ type: 'DELETE_ALL_NOTIFICATIONS' })
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
    }
  }, [accessToken, API_BASE_URL])

  // WebSocket connection with automatic reconnection on token refresh
  useEffect(() => {
    if (!accessToken || !user) {
      // Clean up existing socket if token is removed or user logged out
      if (state.socket) {
        console.log('User logged out or token removed, disconnecting WebSocket...')
        state.socket.disconnect()
        dispatch({ type: 'SET_SOCKET', socket: null })
        dispatch({ type: 'SET_CONNECTION_STATUS', isConnected: false })
      }
      setLastToken(null)
      return
    }

    // Check if token has changed (refresh scenario)
    const tokenChanged = lastToken && lastToken !== accessToken
    
    // If token hasn't changed and socket exists and is connected, don't recreate
    if (!tokenChanged && state.socket && state.socket.connected) {
      return
    }
    
    // If token changed and socket exists, disconnect old one first
    if (tokenChanged && state.socket) {
      console.log('Access token refreshed, reconnecting WebSocket with new token...')
      state.socket.disconnect()
    }

    // Update last token
    setLastToken(accessToken)

    // Create new socket connection with fresh token
    console.log('🔌 Creating new WebSocket connection...')
    
    const socket = io(`${API_BASE_URL}/notifications`, {
      query: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    dispatch({ type: 'SET_SOCKET', socket })

    socket.on('connect', () => {
      console.log('✅ Connected to notification service')
      dispatch({ type: 'SET_CONNECTION_STATUS', isConnected: true })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notification service:', reason)
      dispatch({ type: 'SET_CONNECTION_STATUS', isConnected: false })
      
      // If disconnected by server, it might be due to expired token
      if (reason === 'io server disconnect') {
        console.log('⚠️ Disconnected by server - token may have expired, will reconnect with new token')
      }
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      dispatch({ type: 'SET_CONNECTION_STATUS', isConnected: false })
    })

    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error)
      // If it's an authentication error, the useEffect will handle reconnection
      // when the token gets refreshed
    })

    socket.on('new_notification', (rawData: any) => {
      console.log('Raw notification data received:', rawData)
      
      // Handle different data structures - direct notification or wrapped in data
      let notification = rawData
      if (rawData && rawData.data) {
        notification = rawData.data
      }
      
      console.log('Extracted notification:', notification)
      
      // Basic validation - skip empty objects
      if (!notification || Object.keys(notification).length === 0) {
        console.warn('Received empty notification, skipping')
        return
      }
      
      // Fill in missing required fields with defaults
      const processedNotification = {
        id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: notification.type || 'SYSTEM_ANNOUNCEMENT',
        title: notification.title || 'New Notification',
        message: notification.message || 'You have a new notification',
        status: notification.status || 'UNREAD',
        metadata: notification.metadata || {},
        related_entity_type: notification.related_entity_type || undefined,
        related_entity_id: notification.related_entity_id || undefined,
        created_at: notification.created_at || new Date().toISOString(),
        updated_at: notification.updated_at || notification.created_at || new Date().toISOString(),
      }
      
      console.log('Processing notification:', processedNotification)
      
      dispatch({ type: 'ADD_NOTIFICATION', notification: processedNotification })
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(processedNotification.title, {
          body: processedNotification.message,
          icon: '/favicon.ico',
          tag: processedNotification.id,
        })
      }
    })

    socket.on('unread_count', ({ count }: { count: number }) => {
      dispatch({ type: 'UPDATE_UNREAD_COUNT', count })
    })

    socket.on('recent_notifications', (notifications: Notification[]) => {
      console.log('Recent notifications received:', notifications)
      
      if (!Array.isArray(notifications)) {
        console.warn('Invalid notifications array received:', notifications)
        return
      }
      
      // Process each notification with defaults for missing fields
      const processedNotifications = notifications
        .filter(notification => notification && Object.keys(notification).length > 0)
        .map(notification => ({
          id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: notification.type || 'SYSTEM_ANNOUNCEMENT',
          title: notification.title || 'Notification',
          message: notification.message || 'You have a notification',
          status: notification.status || 'UNREAD',
          metadata: notification.metadata || {},
          related_entity_type: notification.related_entity_type || undefined,
          related_entity_id: notification.related_entity_id || undefined,
          created_at: notification.created_at || new Date().toISOString(),
          updated_at: notification.updated_at || notification.created_at || new Date().toISOString(),
        }))
      
      console.log('Processed recent notifications:', processedNotifications.length)
      dispatch({ type: 'SET_NOTIFICATIONS', notifications: processedNotifications })
    })

    socket.on('broadcast_notification', (rawData: any) => {
      console.log('Broadcast notification raw data received:', rawData)
      
      // Handle different data structures - extract notification data
      let notification = rawData
      if (rawData && rawData.data) {
        notification = rawData.data
      }
      
      console.log('Extracted broadcast notification:', notification)
      
      // Basic validation - skip empty objects
      if (!notification || Object.keys(notification).length === 0) {
        console.warn('Received empty broadcast notification, skipping')
        return
      }
      
      // Fill in missing required fields with defaults
      const processedNotification = {
        id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: notification.type || 'SYSTEM_ANNOUNCEMENT',
        title: notification.title || 'Broadcast Notification',
        message: notification.message || 'You have a new broadcast notification',
        status: notification.status || 'UNREAD',
        metadata: notification.metadata || {},
        related_entity_type: notification.related_entity_type || undefined,
        related_entity_id: notification.related_entity_id || undefined,
        created_at: notification.created_at || new Date().toISOString(),
        updated_at: notification.updated_at || notification.created_at || new Date().toISOString(),
      }
      
      console.log('Processing broadcast notification:', processedNotification)
      
      dispatch({ type: 'ADD_NOTIFICATION', notification: processedNotification })
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(processedNotification.title, {
          body: processedNotification.message,
          icon: '/favicon.ico',
          tag: processedNotification.id,
        })
      }
    })

    return () => {
      console.log('🔌 Cleaning up WebSocket connection...')
      socket.disconnect()
      dispatch({ type: 'SET_SOCKET', socket: null })
      dispatch({ type: 'SET_CONNECTION_STATUS', isConnected: false })
    }
  }, [accessToken, user, API_BASE_URL, lastToken])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])

  // Fetch initial notifications
  useEffect(() => {
    if (accessToken) {
      fetchNotifications()
    }
  }, [accessToken, fetchNotifications])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  }), [state, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications])

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
