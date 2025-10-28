"use client"

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Send, TestTube, MessageCircle, Calendar, Star, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from './notification-provider'

interface TestNotification {
  type: string
  title: string
  message: string
  icon: React.ReactNode
}

const testNotifications: TestNotification[] = [
  {
    type: 'CHAT_MESSAGE',
    title: 'Test Chat Message',
    message: 'This is a test chat message notification to see how it looks in your notification center.',
    icon: <MessageCircle className="h-4 w-4" />
  },
  {
    type: 'BOOKING_CONFIRMATION',
    title: 'Test Booking Confirmed',
    message: 'Your test booking at Grand Hotel has been confirmed for tomorrow.',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    type: 'NEW_BOOKING',
    title: 'Test New Booking',
    message: 'You have received a new booking at your hotel from John Doe.',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    type: 'REVIEW_RECEIVED',
    title: 'Test Review Received',
    message: 'You have received a new 5-star review for your hotel service.',
    icon: <Star className="h-4 w-4" />
  },
  {
    type: 'SYSTEM_ANNOUNCEMENT',
    title: 'Test System Update',
    message: 'This is a test system announcement about new features and improvements.',
    icon: <Bell className="h-4 w-4" />
  },
]

export function NotificationTest() {
  const { accessToken, user } = useAuth()
  const { state } = useNotifications()
  const [sending, setSending] = useState<string | null>(null)
  const [lastSent, setLastSent] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const sendTestNotification = async (testNotif: TestNotification) => {
    if (!accessToken || !user?.id) {
      alert('Please log in to test notifications')
      return
    }

    setSending(testNotif.type)

    try {
      // Use the bulk send endpoint to send to all users
      const response = await fetch(`${API_BASE_URL}/notifications/send/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: testNotif.type,
          title: testNotif.title,
          message: testNotif.message,
          metadata: {
            test: true,
            timestamp: new Date().toISOString(),
          },
          related_entity_type: testNotif.type === 'BOOKING_CONFIRMATION' ? 'booking' : undefined,
          related_entity_id: testNotif.type === 'BOOKING_CONFIRMATION' ? 'test-booking-123' : undefined,
        }),
      })

      if (response.ok) {
        setLastSent(testNotif.type)
        setTimeout(() => setLastSent(null), 3000)
      } else {
        const error = await response.text()
        console.error('Failed to send test notification:', error)
        alert('Failed to send test notification. Check console for details.')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      alert('Error sending test notification. Check console for details.')
    } finally {
      setSending(null)
    }
  }

  if (!user) {
    return (
      <Card className="bg-walnut-dark/98 border-copper-accent/20">
        <CardContent className="p-6 text-center">
          <TestTube className="h-12 w-12 text-copper-accent/50 mx-auto mb-3" />
          <p className="text-cream-light/70 font-cormorant text-vintage-base">
            Please log in to test notifications
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-walnut-dark/98 backdrop-blur-sm border-copper-accent/20">
      <CardHeader className="border-b border-copper-accent/20">
        <CardTitle className="text-cream-light font-cormorant text-vintage-xl flex items-center">
          <TestTube className="h-5 w-5 text-copper-accent mr-3" />
          Notification Testing
        </CardTitle>
        <div className="flex items-center justify-between text-vintage-sm">
          <p className="text-cream-light/70 font-cormorant">
            Test the notification system by sending sample notifications
          </p>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-copper-accent">
              {state.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testNotifications.map((testNotif) => (
            <div
              key={testNotif.type}
              className="border border-copper-accent/10 rounded-lg p-4 hover:border-copper-accent/20 transition-colors duration-200"
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className="p-2 bg-copper-accent/20 rounded-lg text-copper-accent">
                  {testNotif.icon}
                </div>
                <div className="flex-grow">
                  <h3 className="text-cream-light font-cormorant text-vintage-base font-medium mb-1">
                    {testNotif.title}
                  </h3>
                  <p className="text-cream-light/70 text-vintage-sm">
                    {testNotif.message}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => sendTestNotification(testNotif)}
                disabled={sending === testNotif.type}
                size="sm"
                className={`w-full font-cormorant ${
                  lastSent === testNotif.type
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark hover:shadow-copper-accent/30'
                } transition-all duration-300`}
              >
                {sending === testNotif.type ? (
                  <>
                    <div className="w-4 h-4 border-2 border-walnut-dark/30 border-t-walnut-dark rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : lastSent === testNotif.type ? (
                  <>
                    <div className="w-4 h-4 bg-white rounded-full mr-2 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    Sent!
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-copper-accent/5 border border-copper-accent/20 rounded-lg">
          <h4 className="text-cream-light font-cormorant text-vintage-base font-medium mb-2">
            Testing Instructions
          </h4>
          <ul className="text-cream-light/70 text-vintage-sm space-y-1">
            <li>• Click "Send Test" to create a test notification for ALL users</li>
            <li>• Open multiple browser tabs/windows to test cross-user notifications</li>
            <li>• Check the notification bell in the header for new notifications</li>
            <li>• Test browser notifications (if enabled)</li>
            <li>• Verify real-time updates work properly across all users</li>
            <li>• Check the notifications page for full list</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

