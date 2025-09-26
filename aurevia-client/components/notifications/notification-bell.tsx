"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from './notification-provider'
import { NotificationList } from './notification-list'

export function NotificationBell() {
  const { state } = useNotifications()
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

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-cream-light border-copper-accent/30 hover:bg-copper-accent/10 hover:text-copper-accent transition-all duration-300"
      >
        {hasUnread ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        
        {/* Notification Badge */}
        {state.unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark text-vintage-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
            {state.unreadCount > 99 ? '99+' : state.unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <Card className="w-96 max-h-[500px] overflow-hidden bg-walnut-dark/98 backdrop-blur-sm border-copper-accent/20 shadow-2xl">
            <CardHeader className="pb-3 border-b border-copper-accent/20">
              <CardTitle className="text-cream-light font-cormorant text-vintage-lg flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center space-x-2">
                  {/* Connection status indicator */}
                  <div className={`w-2 h-2 rounded-full ${
                    state.isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`} title={state.isConnected ? 'Connected' : 'Disconnected'} />
                  <span className="text-copper-accent text-vintage-sm">
                    {state.unreadCount > 0 ? `${state.unreadCount} new` : 'All read'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <NotificationList 
                maxHeight="400px" 
                onClose={() => setIsOpen(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
