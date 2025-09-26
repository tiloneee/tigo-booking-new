"use client"

import React, { useState } from 'react'
import { Bell, Settings, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from '@/components/notifications/notification-provider'
import { NotificationList } from '@/components/notifications/notification-list'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import { NotificationTest } from '@/components/notifications/notification-test'
import ProtectedRoute from '@/components/auth/protected-route'

type TabType = 'all' | 'unread' | 'settings' | 'test'
type FilterType = 'all' | 'CHAT_MESSAGE' | 'BOOKING_CONFIRMATION' | 'BOOKING_CANCELLED' | 'REVIEW_RECEIVED' | 'SYSTEM_ANNOUNCEMENT'

export default function NotificationsPage() {
  const { state, fetchNotifications, markAllAsRead } = useNotifications()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Refresh notifications
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  // Filter notifications based on current filters
  const filteredNotifications = state.notifications.filter(notification => {
    // Tab filter
    if (activeTab === 'unread' && notification.status !== 'UNREAD') {
      return false
    }

    // Type filter
    if (filter !== 'all' && notification.type !== filter) {
      return false
    }

    // Search filter
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-walnut-darkest via-walnut-dark to-walnut-medium">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-copper-accent to-copper-light rounded-lg shadow-lg">
                  <Bell className="h-6 w-6 text-walnut-dark" />
                </div>
                <div>
                  <h1 className="text-vintage-3xl font-playfair font-bold text-cream-light tracking-wide">
                    Notifications
                  </h1>
                  <p className="text-copper-accent font-cormorant text-vintage-lg">
                    Stay updated with your latest activities
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10 hover:text-copper-accent"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                {state.unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    variant="outline"
                    size="sm"
                    className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10 hover:text-copper-accent"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-walnut-dark/80 border-copper-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-copper-accent/20 rounded-lg">
                      <Bell className="h-5 w-5 text-copper-accent" />
                    </div>
                    <div>
                      <p className="text-vintage-xs text-copper-accent font-cinzel uppercase tracking-wider">
                        Total Notifications
                      </p>
                      <p className="text-vintage-xl text-cream-light font-cormorant font-bold">
                        {state.notifications.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-walnut-dark/80 border-copper-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Bell className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-vintage-xs text-red-400 font-cinzel uppercase tracking-wider">
                        Unread
                      </p>
                      <p className="text-vintage-xl text-cream-light font-cormorant font-bold">
                        {state.unreadCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-walnut-dark/80 border-copper-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      state.isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        state.isConnected ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-vintage-xs text-copper-accent font-cinzel uppercase tracking-wider">
                        Connection
                      </p>
                      <p className="text-vintage-base text-cream-light font-cormorant font-medium">
                        {state.isConnected ? 'Connected' : 'Disconnected'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                {[
                  { key: 'all', label: 'All Notifications', count: state.notifications.length },
                  { key: 'unread', label: 'Unread', count: state.unreadCount },
                  { key: 'settings', label: 'Settings' },
                  { key: 'test', label: 'Test' }
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabType)}
                    variant={activeTab === tab.key ? 'default' : 'outline'}
                    size="sm"
                    className={
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-medium'
                        : 'text-cream-light border-copper-accent/30 hover:bg-copper-accent/10 hover:text-copper-accent'
                    }
                  >
                    {tab.key === 'settings' ? <Settings className="h-4 w-4 mr-2" /> : null}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-copper-accent/20 text-copper-accent text-vintage-xs rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {/* Filters for notifications */}
              {activeTab !== 'settings' && activeTab !== 'test' && (
                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cream-light/50" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-walnut-dark/80 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 focus:outline-none focus:border-copper-accent text-vintage-sm"
                    />
                  </div>

                  {/* Type Filter */}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                    className="px-3 py-2 bg-walnut-dark/80 border border-copper-accent/30 rounded-lg text-cream-light focus:outline-none focus:border-copper-accent text-vintage-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="CHAT_MESSAGE">Chat Messages</option>
                    <option value="BOOKING_CONFIRMATION">Bookings</option>
                    <option value="REVIEW_RECEIVED">Reviews</option>
                    <option value="SYSTEM_ANNOUNCEMENT">Announcements</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 gap-6">
            {activeTab === 'settings' ? (
              <NotificationSettings />
            ) : activeTab === 'test' ? (
              <NotificationTest />
            ) : (
              <Card className="bg-walnut-dark/98 backdrop-blur-sm border-copper-accent/20">
                <CardHeader className="border-b border-copper-accent/20">
                  <CardTitle className="text-cream-light font-cormorant text-vintage-lg">
                    {activeTab === 'unread' ? 'Unread Notifications' : 'All Notifications'}
                    {filteredNotifications.length > 0 && (
                      <span className="ml-2 text-copper-accent text-vintage-sm font-normal">
                        ({filteredNotifications.length})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredNotifications.length > 0 ? (
                    <NotificationList maxHeight="none" notifications={filteredNotifications} />
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="h-16 w-16 text-copper-accent/30 mx-auto mb-4" />
                      <h3 className="text-cream-light font-cormorant text-vintage-lg mb-2">
                        {activeTab === 'unread' ? 'No unread notifications' : 'No notifications found'}
                      </h3>
                      <p className="text-cream-light/70 text-vintage-sm">
                        {searchQuery || filter !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'When you receive notifications, they\'ll appear here'
                        }
                      </p>
                      {(searchQuery || filter !== 'all') && (
                        <Button
                          onClick={() => {
                            setSearchQuery('')
                            setFilter('all')
                          }}
                          variant="outline"
                          size="sm"
                          className="mt-4 text-copper-accent border-copper-accent/30 hover:bg-copper-accent/10"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
