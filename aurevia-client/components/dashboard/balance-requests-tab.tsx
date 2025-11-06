"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Check, X, User, Calendar, ChevronDown, MessageSquare } from "lucide-react"
import { balanceRequestsApi } from "@/lib/api/dashboard"
import { Transaction } from "@/lib/api/balance"

interface BalanceRequestsTabProps {
  requests: Transaction[]
  accessToken: string
  onRefresh: () => void
  onUpdateRequest: (requestId: string, updatedRequest: Transaction) => void
}

type SortField = 'created_at' | 'amount' | 'status'
type SortOrder = 'asc' | 'desc'
type FilterStatus = 'all' | 'pending' | 'success' | 'failed'

export default function BalanceRequestsTab({ 
  requests, 
  accessToken,
  onRefresh,
  onUpdateRequest
}: BalanceRequestsTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const handleProcess = async (requestId: string, status: 'success' | 'failed' | 'cancelled') => {
    if (processingId) return

    try {
      setProcessingId(requestId)
      const updatedRequest = await balanceRequestsApi.processTopup(requestId, {
        status,
        admin_notes: adminNotes[requestId] || undefined
      })
      
      // Update the specific request in the list without reloading
      onUpdateRequest(requestId, updatedRequest)
      
      setAdminNotes(prev => {
        const newNotes = { ...prev }
        delete newNotes[requestId]
        return newNotes
      })
      setExpandedId(null) // Close the notes section
    } catch (error: any) {
      console.error('Failed to process balance request:', error)
      alert(error.response?.data?.message || 'Failed to process request')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-900/40 text-yellow-300 border-yellow-400/60'
      case 'success':
      case 'approved':
        return 'bg-green-900/40 text-green-300 border-green-400/60'
      case 'failed':
      case 'rejected':
        return 'bg-red-900/40 text-red-300 border-red-400/60'
      default:
        return 'bg-gray-900/40 text-gray-300 border-gray-400/60'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Filter and sort requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus)
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'amount':
          comparison = Number(a.amount) - Number(b.amount)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [requests, sortField, sortOrder, filterStatus])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  if (requests.length === 0) {
    return (
      <Card className="bg-walnut-dark/50 border-copper-accent/20">
        <CardContent className="py-12 text-center">
          <DollarSign className="h-16 w-16 text-cream-light/40 mx-auto mb-4" />
          <h3 className="text-vintage-xl font-playfair text-cream-light mb-2">
            No Balance Requests
          </h3>
          <p className="text-vintage-base text-cream-light/60 font-cormorant">
            There are no balance requests to display.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sort Controls */}
      <Card className="bg-walnut-dark/50 border-copper-accent/20">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-cream-light/80 font-cormorant text-vintage-sm">Filter:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-2 bg-walnut-darkest border border-copper-accent/30 rounded-lg text-cream-light font-cormorant text-vintage-sm focus:outline-none focus:ring-2 focus:ring-copper-accent/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-cream-light/80 font-cormorant text-vintage-sm">Sort by:</span>
              <button
                onClick={() => toggleSort('created_at')}
                className={`px-3 py-2 rounded-lg font-cormorant text-vintage-sm transition-colors ${
                  sortField === 'created_at'
                    ? 'bg-copper-accent/20 text-copper-accent border border-copper-accent/30'
                    : 'bg-walnut-darkest text-cream-light/80 border border-copper-accent/20 hover:bg-copper-accent/10'
                }`}
              >
                Time {getSortIcon('created_at')}
              </button>
              <button
                onClick={() => toggleSort('amount')}
                className={`px-3 py-2 rounded-lg font-cormorant text-vintage-sm transition-colors ${
                  sortField === 'amount'
                    ? 'bg-copper-accent/20 text-copper-accent border border-copper-accent/30'
                    : 'bg-walnut-darkest text-cream-light/80 border border-copper-accent/20 hover:bg-copper-accent/10'
                }`}
              >
                Amount {getSortIcon('amount')}
              </button>
              <button
                onClick={() => toggleSort('status')}
                className={`px-3 py-2 rounded-lg font-cormorant text-vintage-sm transition-colors ${
                  sortField === 'status'
                    ? 'bg-copper-accent/20 text-copper-accent border border-copper-accent/30'
                    : 'bg-walnut-darkest text-cream-light/80 border border-copper-accent/20 hover:bg-copper-accent/10'
                }`}
              >
                Status {getSortIcon('status')}
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-vintage-sm text-cream-light/60 font-cormorant">
            Showing {filteredAndSortedRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Balance Requests List */}
      <div className="space-y-4">
        {filteredAndSortedRequests.map((request) => (
          <Card 
            key={request.id}
            className="bg-walnut-dark/50 border-copper-accent/20 hover:border-copper-accent/40 transition-all duration-300"
          >
            <CardContent className="py-6">
              <div className="flex flex-col space-y-4">
                {/* Main Info Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-copper-accent to-copper-light rounded-full flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-walnut-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-cream-light font-playfair text-vintage-lg font-bold">
                          ${Number(request.amount).toFixed(2)}
                        </h3>
                        <Badge className={`${getStatusBadge(request.status)} font-cinzel uppercase tracking-wider`}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        {request.user && (
                          <div className="flex items-center gap-2 text-cream-light/80 text-vintage-sm font-cormorant">
                            <User className="h-4 w-4" />
                            <span>{request.user.first_name} {request.user.last_name}</span>
                            <span className="text-cream-light/60">({request.user.email})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-cream-light/80 text-vintage-sm font-cormorant">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(request.created_at)}</span>
                        </div>
                      </div>

                      {/* Processor Info */}
                      {request.processor && (
                        <div className="mt-2 text-vintage-xs text-cream-light/60 font-cormorant">
                          Processed by: {request.processor.first_name} {request.processor.last_name}
                        </div>
                      )}

                      {/* Admin Notes Display */}
                      {request.admin_notes && (
                        <div className="mt-3 p-3 bg-walnut-darkest/50 border border-copper-accent/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-copper-accent mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-vintage-xs text-copper-accent font-cinzel uppercase tracking-wider mb-1">
                                Admin Notes
                              </div>
                              <p className="text-vintage-sm text-cream-light/80 font-cormorant">
                                {request.admin_notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleProcess(request.id, 'success')}
                        disabled={processingId === request.id}
                        className="text-emerald-200 border-green-400 bg-gradient-to-r from-green-400/30 to-green-400/80 font-cinzel font-bold rounded-lg hover:shadow-green-400/30 hover:bg-green-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                      >
                        <Check className="h-6 w-6 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleProcess(request.id, 'failed')}
                        disabled={processingId === request.id}
                        className="text-red-400 border-red-400 bg-gradient-to-r from-red-400/10 to-red-400/30 font-cinzel font-bold rounded-lg hover:shadow-red-400/30 hover:bg-red-400/10 transition-all duration-300 hover:scale-100 disabled:opacity-50"
                      >
                        <X className="h-6 w-6 mr-2" />
                        Reject
                      </Button>
                      <button
                        onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                        className="text-cream-light/60 hover:text-cream-light transition-colors text-vintage-sm font-cormorant flex items-center justify-end gap-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Notes
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === request.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Admin Notes Input (Expanded) */}
                {expandedId === request.id && request.status === 'pending' && (
                  <div className="mt-4 p-4 bg-walnut-darkest/50 border border-copper-accent/20 rounded-lg">
                    <label className="block text-vintage-sm text-cream-light/80 font-cormorant mb-2">
                      Add admin notes (optional):
                    </label>
                    <textarea
                      value={adminNotes[request.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                      placeholder="Enter any notes about this decision..."
                      className="w-full px-3 py-2 bg-walnut-dark border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/40 focus:outline-none focus:ring-2 focus:ring-copper-accent/50 font-cormorant text-vintage-sm resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
