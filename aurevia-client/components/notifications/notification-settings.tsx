"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Settings, Save, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NotificationPreference {
  id: string
  type: string
  in_app_enabled: boolean
  email_enabled: boolean
  push_enabled: boolean
}

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const { accessToken } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  // Notification type descriptions
  const notificationTypes = {
    CHAT_MESSAGE: {
      title: 'Chat Messages',
      description: 'Get notified when someone sends you a message'
    },
    BOOKING_CONFIRMATION: {
      title: 'Booking Confirmations',
      description: 'Receive notifications when your bookings are confirmed'
    },
    NEW_BOOKING: {
      title: 'New Bookings',
      description: 'Get notified when you receive new bookings for your hotels'
    },
    BOOKING_CANCELLED: {
      title: 'Booking Cancellations',
      description: 'Get notified when bookings are cancelled'
    },
    BOOKING_REMINDER: {
      title: 'Booking Reminders',
      description: 'Receive reminders about upcoming bookings'
    },
    REVIEW_RECEIVED: {
      title: 'New Reviews',
      description: 'Get notified when you receive new reviews'
    },
    HOTEL_APPROVED: {
      title: 'Hotel Approvals',
      description: 'Receive notifications when your hotels are approved'
    },
    HOTEL_REJECTED: {
      title: 'Hotel Rejections',
      description: 'Get notified when hotels are rejected'
    },
    SYSTEM_ANNOUNCEMENT: {
      title: 'System Announcements',
      description: 'Receive important system announcements and updates'
    },
    PAYMENT_SUCCESS: {
      title: 'Payment Success',
      description: 'Get notified when payments are processed successfully'
    },
    PAYMENT_FAILED: {
      title: 'Payment Failed',
      description: 'Receive alerts when payments fail'
    },
  }

  // Fetch user preferences
  useEffect(() => {
    if (!accessToken) return

    const fetchPreferences = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setPreferences(data)
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [accessToken, API_BASE_URL])

  // Update preference
  const updatePreference = async (type: string, field: keyof NotificationPreference, value: boolean) => {
    if (!accessToken) return

    setSaving(true)

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/preferences/${type}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        setPreferences(prev =>
          prev.map(pref =>
            pref.type === type ? { ...pref, [field]: value } : pref
          )
        )
        
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Failed to update preference:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className={`bg-walnut-dark/98 backdrop-blur-sm border-copper-accent/20 ${className}`}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-copper-accent animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-walnut-dark/98 backdrop-blur-sm border-copper-accent/20 ${className}`}>
      <CardHeader className="border-b border-copper-accent/20">
        <CardTitle className="text-cream-light font-cormorant text-vintage-xl flex items-center">
          <Settings className="h-5 w-5 text-copper-accent mr-3" />
          Notification Preferences
          {saved && (
            <div className="ml-auto flex items-center text-green-400 text-vintage-sm">
              <Check className="h-4 w-4 mr-1" />
              Saved
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {preferences.map((preference) => {
            const typeInfo = notificationTypes[preference.type as keyof typeof notificationTypes]
            if (!typeInfo) return null

            return (
              <div key={preference.type} className="border border-copper-accent/10 rounded-lg p-4 hover:border-copper-accent/20 transition-colors duration-200">
                <div className="mb-3">
                  <h3 className="text-cream-light font-cormorant text-vintage-lg font-medium">
                    {typeInfo.title}
                  </h3>
                  <p className="text-cream-light/70 text-vintage-sm mt-1">
                    {typeInfo.description}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* In-app notifications */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-cream-light text-vintage-sm font-cormorant">
                      In-app notifications
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={preference.in_app_enabled}
                        onChange={(e) => updatePreference(preference.type, 'in_app_enabled', e.target.checked)}
                        disabled={saving}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                        preference.in_app_enabled 
                          ? 'bg-copper-accent' 
                          : 'bg-walnut-light'
                      }`}>
                        <div className={`w-4 h-4 bg-cream-light rounded-full shadow-md transform transition-transform duration-200 ${
                          preference.in_app_enabled ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </div>
                  </label>

                  {/* Email notifications */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-cream-light text-vintage-sm font-cormorant">
                      Email notifications
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={preference.email_enabled}
                        onChange={(e) => updatePreference(preference.type, 'email_enabled', e.target.checked)}
                        disabled={saving}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                        preference.email_enabled 
                          ? 'bg-copper-accent' 
                          : 'bg-walnut-light'
                      }`}>
                        <div className={`w-4 h-4 bg-cream-light rounded-full shadow-md transform transition-transform duration-200 ${
                          preference.email_enabled ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </div>
                  </label>

                  {/* Push notifications */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-cream-light text-vintage-sm font-cormorant">
                      Browser notifications
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={preference.push_enabled}
                        onChange={(e) => updatePreference(preference.type, 'push_enabled', e.target.checked)}
                        disabled={saving}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                        preference.push_enabled 
                          ? 'bg-copper-accent' 
                          : 'bg-walnut-light'
                      }`}>
                        <div className={`w-4 h-4 bg-cream-light rounded-full shadow-md transform transition-transform duration-200 ${
                          preference.push_enabled ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )
          })}
        </div>

        {/* Global browser notification permission */}
        <div className="mt-6 p-4 bg-copper-accent/5 border border-copper-accent/20 rounded-lg">
          <h4 className="text-cream-light font-cormorant text-vintage-base font-medium mb-2">
            Browser Notification Permission
          </h4>
          <p className="text-cream-light/70 text-vintage-sm mb-3">
            Enable browser notifications to receive real-time alerts even when the app is not open.
          </p>
          {typeof window !== 'undefined' && 'Notification' in window ? (
            <Button
              onClick={() => {
                if (Notification.permission === 'default') {
                  Notification.requestPermission()
                } else if (Notification.permission === 'denied') {
                  alert('Please enable notifications in your browser settings')
                }
              }}
              variant="outline"
              size="sm"
              className="text-copper-accent border-copper-accent/30 hover:bg-copper-accent/10"
            >
              {Notification.permission === 'granted' 
                ? 'Notifications Enabled' 
                : Notification.permission === 'denied'
                ? 'Notifications Blocked'
                : 'Enable Notifications'
              }
            </Button>
          ) : (
            <p className="text-cream-light/50 text-vintage-xs">
              Browser notifications not supported
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

