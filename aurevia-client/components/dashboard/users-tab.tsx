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
        <h2 className="text-vintage-2xl font-playfair font-bold text-cream-light">
          User Management
        </h2>
        <Button
          onClick={onRefresh}
          className="bg-gradient-to-r from-copper-accent to-copper-light text-walnut-dark font-cinzel font-bold"
        >
          Refresh
        </Button>
      </div>

      {users.length === 0 ? (
        <Card className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-cream-light/40 mx-auto mb-4" />
            <p className="text-cream-light/60 font-cormorant text-vintage-lg">
              No users found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users.map((user) => (
            <Card
              key={user.id}
              className="bg-walnut-dark/80 backdrop-blur-sm border border-copper-accent/30 shadow-xl hover:border-copper-accent/50 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-walnut-dark" />
                    </div>
                    <div>
                      <h3 className="text-cream-light font-playfair text-vintage-xl font-bold">
                        {user.first_name} {user.last_name}
                      </h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {user.roles?.map((role) => (
                          <Badge
                            key={role.id}
                            className={`${getRoleBadgeColor(role.name)} font-cinzel uppercase tracking-wider`}
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
                    } font-cinzel uppercase tracking-wider`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-cream-light/80">
                  <Mail className="h-4 w-4 text-copper-accent" />
                  <span className="font-cormorant text-vintage-base">{user.email}</span>
                </div>
                {user.phone_number && (
                  <div className="flex items-center gap-3 text-cream-light/80">
                    <Phone className="h-4 w-4 text-copper-accent" />
                    <span className="font-cormorant text-vintage-base">{user.phone_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-cream-light/60">
                  <Calendar className="h-4 w-4 text-copper-accent/60" />
                  <span className="font-cormorant text-vintage-sm">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Expanded Details */}
                {selectedUser?.id === user.id && (
                  <div className="mt-4 pt-4 border-t border-copper-accent/30 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-cream-light border-copper-accent/30 hover:bg-copper-accent/10"
                        disabled
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-300 border-red-500/30 hover:bg-red-900/20"
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
