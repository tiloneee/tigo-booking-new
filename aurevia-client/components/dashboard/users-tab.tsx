"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Trash2, Edit } from "lucide-react"
import type { DashboardUser } from "@/types/dashboard"
import { usersApi } from "@/lib/api/dashboard"

interface UsersTabProps {
  users: DashboardUser[]
  accessToken: string
  onRefresh: () => void
}

export default function UsersTab({ users, accessToken, onRefresh }: UsersTabProps) {
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      await usersApi.delete(userId)
      onRefresh()
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsDeleting(false)
    }
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Admin':
        return 'bg-red-900/50 text-red-300 border-red-400/70'
      case 'HotelOwner':
        return 'bg-blue-900/50 text-blue-300 border-blue-400/70'
      case 'Customer':
        return 'bg-green-900/50 text-green-300 border-green-400/70'
      default:
        return 'bg-gray-900/50 text-gray-100 border-gray-400/70'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-vintage-2xl font-libre font-bold text-deep-brown">
          User Management
        </h2>
        <Button
          onClick={onRefresh}
          className="bg-gradient-to-r from-terracotta-rose/70 to-terracotta-orange/80 text-dark-brown font-varela font-bold hover:shadow-terracotta-rose/30 transition-all duration-300 hover:scale-105"
        >
          Refresh
        </Button>
      </div>

      {users.length === 0 ? (
        <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border border-terracotta-rose/30">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-creamy-yellow/40 mx-auto mb-4" />
            <p className="text-creamy-yellow/60 font-varela text-vintage-lg">
              No users found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users.map((user) => (
            <Card
              key={user.id}
              className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border border-terracotta-rose/30 shadow-xl hover:border-terracotta-rose/50 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-creamy-white" />
                    </div>
                    <div>
                      <h3 className="text-creamy-yellow font-fraunces text-vintage-xl font-semibold">
                        {user.first_name} {user.last_name}
                      </h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {user.roles?.map((role) => (
                          <Badge
                            key={role.id}
                            className={`${getRoleBadgeColor(role.name)} font-varela uppercase tracking-wider`}
                          >
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      user.is_active
                        ? 'bg-green-900/40 text-green-300 border-green-400/60'
                        : 'bg-red-900/40 text-red-300 border-red-400/60'
                    } font-varela uppercase tracking-wider`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-creamy-yellow/80">
                  <Mail className="h-4 w-4 text-terracotta-rose" />
                  <span className="font-varela text-vintage-base">{user.email}</span>
                </div>
                {user.phone_number && (
                  <div className="flex items-center gap-3 text-creamy-yellow/80">
                    <Phone className="h-4 w-4 text-terracotta-rose" />
                    <span className="font-varela text-vintage-base">{user.phone_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-creamy-yellow/60">
                  <Calendar className="h-4 w-4 text-terracotta-rose/60" />
                  <span className="font-varela text-vintage-sm">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Expanded Details */}
                {selectedUser?.id === user.id && (
                  <div className="mt-4 pt-4 border-t border-terracotta-rose/30 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="text-yellow-900 border-yellow-400 bg-gradient-to-br from-yellow-400 to-yellow-400/60 font-varela font-bold rounded-lg hover:shadow-yellow-400/30 hover:bg-yellow-400/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                        disabled
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="text-red-900 border-red-400 bg-gradient-to-br from-red-400 to-red-400/60 font-varela font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUser(user.id)
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
