"use client"

import React, { useState } from 'react'
import { Bell, Settings, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from '@/components/notifications/notification-provider'
import { NotificationList } from '@/components/notifications/notification-list'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import ProtectedRoute from '@/components/auth/protected-route'
import Header from '@/components/header'

type TabType = 'all' | 'unread' | 'settings'
type FilterType = 'all' | 'CHAT_MESSAGE' | 'BOOKING_CONFIRMATION' | 'NEW_BOOKING' | 'BOOKING_CANCELLED' | 'REVIEW_RECEIVED' | 'SYSTEM_ANNOUNCEMENT'

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

  // Calculate actual unread count from displayed notifications
  const displayedUnreadCount = state.notifications.filter(n => n.status === 'UNREAD').length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-bl from-creamy-yellow to-creamy-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-lg shadow-lg">
                  <Bell className="h-6 w-6 text-dark-brown" />
                </div>
                <div>
                  <h1 className="text-vintage-3xl font-libre font-bold text-terracotta-rose-dark tracking-wide">
                    Notifications
                  </h1>
                  <p className="text-terracotta-rose font-varela text-vintage-lg">
                    Stay updated with your latest activities
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="sm"
                  className="text-dark-brown bg-gradient-to-br from-terracotta-rose to-terracotta-orange border-terracotta-rose/30 font-varela font-semibold hover:bg-terracotta-rose/10 hover:text-dark-brown/80"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                {displayedUnreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    size="sm"
                    className="text-dark-brown bg-gradient-to-br from-terracotta-rose to-terracotta-orange border-terracotta-rose/30 font-varela font-semibold hover:bg-terracotta-rose/10 hover:text-dark-brown/80"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown border-terracotta-rose/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-terracotta-rose/20 rounded-lg">
                      <Bell className="h-5 w-5 text-terracotta-rose" />
                    </div>
                    <div>
                      <p className="text-vintage-xs text-terracotta-rose font-libre font-semibold uppercase tracking-wider">
                        Total Notifications
                      </p>
                      <p className="text-vintage-xl text-creamy-yellow font-varela font-bold">
                        {state.notifications.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown border-terracotta-rose/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Bell className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-vintage-xs text-red-400 font-libre font-semibold uppercase tracking-wider">
                        Unread
                      </p>
                      <p className="text-vintage-xl text-creamy-yellow font-varela font-bold">
                        {displayedUnreadCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-dark-brown/80 to-deep-brown border-terracotta-rose/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${state.isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                      <div className={`w-3 h-3 rounded-full ${state.isConnected ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                    </div>
                    <div>
                      <p className="text-vintage-xs text-terracotta-rose font-libre font-semibold uppercase tracking-wider">
                        Connection
                      </p>
                      <p className="text-vintage-base text-creamy-yellow font-varela font-medium">
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
                  { key: 'unread', label: 'Unread', count: displayedUnreadCount },
                  { key: 'settings', label: 'Settings' },
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabType)}
                    variant={activeTab === tab.key ? 'default' : 'default'}
                    size="sm"
                    className={
                      activeTab === tab.key
                        ? 'bg-gradient-to-r from-terracotta-rose to-terracotta-orange font-varela text-dark-brown font-medium'
                        : 'text-dark-brown bg-terracotta-rose/40 border-terracotta-rose/30 hover:bg-terracotta-rose/80 hover:text-dark-brown/80'
                    }
                  >
                    {tab.key === 'settings' ? <Settings className="h-4 w-4 mr-2" /> : null}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-terracotta-rose/60 text-dark-brown text-vintage-xs rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {/* Filters for notifications */}
              {activeTab !== 'settings' && (
                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-creamy-yellow/50" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gradient-to-br from-dark-brown/80 to-deep-brown border border-terracotta-rose/30 rounded-lg text-creamy-yellow placeholder-creamy-yellow/50 focus:outline-none focus:border-terracotta-rose text-vintage-sm"
                    />
                  </div>

                  {/* Type Filter */}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                    className="px-3 py-2 bg-gradient-to-br from-dark-brown/80 to-deep-brown border border-terracotta-rose/30 rounded-lg text-creamy-yellow focus:outline-none focus:border-terracotta-rose text-vintage-sm"
                  >
                    <option value="all" className='text-dark-brown'>All Types</option>
                    <option value="CHAT_MESSAGE" className='text-dark-brown'>Chat Messages</option>
                    <option value="BOOKING_CONFIRMATION" className='text-dark-brown'>Booking Confirmations</option>
                    <option value="NEW_BOOKING" className='text-dark-brown'>New Bookings</option>
                    <option value="REVIEW_RECEIVED" className='text-dark-brown'>Reviews</option>
                    <option value="SYSTEM_ANNOUNCEMENT" className='text-dark-brown'>Announcements</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 gap-6">
            {activeTab === 'settings' ? (
              <NotificationSettings />
            ) : (
              <Card className="bg-gradient-to-br from-dark-brown/98 to-deep-brown backdrop-blur-sm border-terracotta-rose/20">
                <CardHeader className="border-b border-terracotta-rose/20">
                  <CardTitle className="text-creamy-yellow font-varela text-[18px] font-bold flex items-center">
                    {activeTab === 'unread' ? 'Unread Notifications' : 'All Notifications'}
                    {filteredNotifications.length > 0 && (
                      <span className="ml-2 text-terracotta-rose text-vintage-sm font-normal">
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
                      <Bell className="h-16 w-16 text-terracotta-rose/30 mx-auto mb-4" />
                      <h3 className="text-creamy-yellow font-varela text-vintage-lg mb-2">
                        {activeTab === 'unread' ? 'No unread notifications' : 'No notifications found'}
                      </h3>
                      <p className="text-creamy-yellow/70 text-vintage-sm">
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
                          className="mt-4 text-terracotta-rose border-terracotta-rose/30 hover:bg-terracotta-rose/10"
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
