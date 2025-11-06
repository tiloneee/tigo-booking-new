"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { 
  MessageCircle, 
  Calendar, 
  Star, 
  Check, 
  Bell,
  CreditCard,
  Building2,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from './notification-provider'
import type { Notification } from '@/lib/api/notifications'

interface NotificationListProps {
  maxHeight?: string
  onClose?: () => void
  notifications?: Notification[]
}

export function NotificationList({ maxHeight = '600px', onClose, notifications }: NotificationListProps) {
  const { state, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const router = useRouter()
  
  // Use provided notifications or fall back to state notifications
  const displayNotifications = notifications || state.notifications

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CHAT_MESSAGE':
        return <MessageCircle className="h-4 w-4 text-copper-accent" />
      case 'BOOKING_CONFIRMATION':
      case 'BOOKING_CANCELLED':
        return <Calendar className="h-4 w-4 text-copper-accent" />
      case 'BOOKING_REMINDER':
      case 'NEW_BOOKING':
        return <Calendar className="h-4 w-4 text-copper-accent" />
      case 'REVIEW_RECEIVED':
        return <Star className="h-4 w-4 text-copper-accent" />
      case 'HOTEL_APPROVED':
      case 'HOTEL_REJECTED':
        return <Building2 className="h-4 w-4 text-copper-accent" />
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        return <CreditCard className="h-4 w-4 text-copper-accent" />
      case 'TOPUP_APPROVED':
        return <CreditCard className="h-4 w-4 text-copper-accent" />
      case 'TOPUP_REJECTED':
        return <CreditCard className="h-4 w-4 text-copper-accent" />
      case 'TOPUP_PENDING':
        return <CreditCard className="h-4 w-4 text-copper-accent" />
      case 'SYSTEM_ANNOUNCEMENT':
        return <Bell className="h-4 w-4 text-copper-accent" />
      default:
        return <Bell className="h-4 w-4 text-copper-accent" />
    }
  }

  const getNotificationColor = (type: string, status: string) => {
    const isUnread = status === 'UNREAD'
    
    if (type === 'BOOKING_CANCELLED' || type === 'PAYMENT_FAILED' || type === 'HOTEL_REJECTED' || type === 'TOPUP_REJECTED') {
      return isUnread 
        ? 'border-l-4 border-red-500/50 bg-red-500/5' 
        : 'border-l-4 border-red-500/20 bg-red-500/2'
    }
    
    if (type === 'BOOKING_CONFIRMATION' || type === 'NEW_BOOKING' || type === 'PAYMENT_SUCCESS' || type === 'HOTEL_APPROVED' || type === 'TOPUP_APPROVED') {
      return isUnread 
        ? 'border-l-4 border-green-500/50 bg-green-500/5' 
        : 'border-l-4 border-green-500/20 bg-green-500/2'
    }
    
    return isUnread 
      ? 'border-l-4 border-copper-accent/50 bg-copper-accent/5' 
      : 'border-l-4 border-copper-accent/20 bg-copper-accent/2'
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'UNREAD') {
      await markAsRead(notification.id)
    }
    
    // Handle navigation based on notification type
    if (notification.type === 'CHAT_MESSAGE' && notification.metadata?.chat_room_id) {
      // Navigate to chat room
      router.push(`/chat?room=${notification.metadata.chat_room_id}`)
    } else if (notification.type === 'BOOKING_CONFIRMATION' && notification.related_entity_id) {
      // Navigate to booking success page with booking ID
      router.push(`/booking/success?booking_id=${notification.related_entity_id}`)
    } else if (notification.type === 'NEW_BOOKING' && notification.related_entity_id) {
      // Navigate to booking details page
      router.push(`/bookings/${notification.related_entity_id}`)
    } else if (notification.related_entity_type === 'booking' && notification.related_entity_id) {
      // Generic booking navigation
      router.push(`/bookings/${notification.related_entity_id}`)
    } else if (notification.related_entity_type === 'hotel' && notification.related_entity_id) {
      // Navigate to hotel details
      router.push(`/hotels/${notification.related_entity_id}`)
    } 
    if (onClose) {
      onClose()
    }
  }


  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering the notification click
    if (window.confirm('Are you sure you want to delete this notification?')) {
      await deleteNotification(notificationId)
    }
  }

  if (displayNotifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="h-12 w-12 text-copper-accent/50 mx-auto mb-3" />
        <p className="text-cream-light/70 font-cormorant text-vintage-base">
          No notifications yet
        </p>
        <p className="text-cream-light/50 text-vintage-sm mt-1">
          We'll notify you when something happens
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxHeight }} className="overflow-y-auto">
      {/* Header with mark all read button */}
      {state.unreadCount > 0 && (
        <div className="px-3 pb-3 border-b border-copper-accent/10">
          <Button
            className="px-8 py-4 w-full bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            size="sm"
            onClick={handleMarkAllRead}
            // className="w-full text-vintage-md bg-walnut-medium border border-copper-accent/30 text-copper-accent hover:text-cream-light hover:bg-copper-accent/20 font-cormorant"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications */}
      <div className="divide-y divide-copper-accent/10">
        {displayNotifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`group p-4 cursor-pointer hover:bg-copper-accent/10 transition-all duration-200 ${getNotificationColor(
              notification.type,
              notification.status
            )} ${notification.status === 'UNREAD' ? 'font-medium' : 'opacity-75'}`}
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <p className="text-cream-light font-cormorant text-vintage-base font-bold leading-5 mb-1">
                      {notification.title}
                    </p>
                    <p className="text-cream-light/80 text-vintage-xs leading-4 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-copper-accent/80 text-vintage-xs font-cinzel uppercase tracking-wider">
                        {(() => {
                          try {
                            const date = new Date(notification.created_at)
                            if (isNaN(date.getTime())) {
                              return 'Just now'
                            }
                            return formatDistanceToNow(date, { addSuffix: true })
                          } catch (error) {
                            return 'Just now'
                          }
                        })()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {notification.status === 'UNREAD' && (
                          <div className="w-2 h-2 bg-copper-accent rounded-full animate-pulse" />
                        )}
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Delete notification"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata display for chat messages */}
                {notification.type === 'CHAT_MESSAGE' && notification.metadata?.sender_name && (
                  <div className="mt-2 text-copper-accent/60 text-vintage-xs">
                    From: {notification.metadata.sender_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-copper-accent/10 text-center">
        <Button
          variant="link"
          size="sm"
          className="text-vintage-sm text-md text-copper-accent hover:text-cream-light font-cormorant font-bold"
          onClick={() => {
            router.push('/notifications')
            if (onClose) onClose()
          }}
        >
          View all notifications
        </Button>
      </div>
    </div>
  )
}
