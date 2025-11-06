"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Bell, BellRing, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from './notification-provider'
import { NotificationList } from './notification-list'

export function NotificationBell() {
  const { state, deleteAllNotifications } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasUnread = state.unreadCount > 0

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      await deleteAllNotifications()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        className="px-8 py-4 bg-gradient-to-br from-terracotta-rose to-creamy-yellow text-dark-brown font-cinzel font-bold rounded-lg shadow-2xl hover:shadow-copper-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {hasUnread ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        
        {/* Notification Badge */}
        {state.unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-b from-terracotta-rose to-creamy-yellow text-dark-brown shadow-2xl text-vintage-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {state.unreadCount > 99 ? '99+' : state.unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <Card className="w-96 max-h-[500px] overflow-hidden bg-deep-brown/97 backdrop-blur-3xl border-terracotta-rose/40 shadow-2xl">
            <CardHeader className="border-b border-terracotta-rose/40 rounded-2xl">
              <CardTitle className="font-varela text-[18px] text-creamy-yellow font-medium flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center space-x-2">
                  {/* Connection status indicator */}
                  <div className={`w-2 h-2 rounded-full ${
                    state.isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`} title={state.isConnected ? 'Connected' : 'Disconnected'} />
                  <span className="text-creamy-yellow text-vintage-sm pr-2">
                    {state.unreadCount > 0 ? `${state.unreadCount} new` : 'All read'}
                  </span>
                  {/* Delete all button */}
                  {state.notifications.length > 0 && (
                    <Button
                      className="px-8 py-4 bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-varela font-bold rounded-lg shadow-2xl hover:shadow-accent/40 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      size="sm"
                      onClick={handleDeleteAll}
                      // className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-6 w-6"
                      title="Delete all notifications"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <NotificationList 
                maxHeight="400px"
                notifications={state.notifications}
                onClose={() => setIsOpen(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
