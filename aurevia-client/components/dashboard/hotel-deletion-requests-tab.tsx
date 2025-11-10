"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Hotel, Trash2, User, Calendar, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { hotelDeletionRequestApi, type HotelDeletionRequest } from "@/lib/api/hotel-deletion-requests"

interface HotelDeletionRequestsTabProps {
  requests: HotelDeletionRequest[]
  onRefresh: () => void
}

export function HotelDeletionRequestsTab({ requests, onRefresh }: HotelDeletionRequestsTabProps) {
  const [selectedRequest, setSelectedRequest] = useState<HotelDeletionRequest | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleReview = async () => {
    if (!selectedRequest) return

    try {
      setSubmitting(true)
      await hotelDeletionRequestApi.reviewHotelDeletionRequest(
        selectedRequest.id,
        reviewStatus,
        adminNotes || undefined
      )
      
      setShowReviewDialog(false)
      setSelectedRequest(null)
      setAdminNotes('')
      onRefresh()
      
      alert(`Hotel deletion request ${reviewStatus} successfully!`)
    } catch (error: any) {
      console.error('Error reviewing hotel deletion request:', error)
      alert(error?.response?.data?.message || 'Failed to review hotel deletion request')
    } finally {
      setSubmitting(false)
    }
  }

  const openReviewDialog = (request: HotelDeletionRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request)
    setReviewStatus(status)
    setAdminNotes('')
    setShowReviewDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-900/60 text-yellow-300 border-yellow-400/70', icon: AlertCircle },
      approved: { color: 'bg-green-900/60 text-green-300 border-green-400/70', icon: CheckCircle },
      rejected: { color: 'bg-red-900/60 text-red-300 border-red-400/70', icon: XCircle },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} font-varela uppercase tracking-wider flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  const RequestCard = ({ request }: { request: HotelDeletionRequest }) => (
    <Card className="bg-gradient-to-br from-creamy-yellow/90 to-creamy-white border border-terracotta-rose/30 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-terracotta-rose to-terracotta-orange rounded-full flex items-center justify-center flex-shrink-0">
            <Hotel className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-vintage-lg font-libre font-semibold text-deep-brown mb-1">
              {request.hotel?.name || 'Unknown Hotel'}
            </h4>
            <p className="text-vintage-sm text-ash-brown mb-2">
              {request.hotel?.address}, {request.hotel?.city}
            </p>
            <div className="flex items-center gap-4 text-vintage-xs text-ash-brown/80">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {request.requested_by?.username || 'Unknown'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(request.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(request.status)}
          {request.hotel && !request.hotel.is_active && (
            <Badge className="bg-gray-900/60 text-gray-300 border-gray-400/70 text-vintage-xs">
              Deactivated
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3 p-3 bg-terracotta-rose/10 rounded-lg border border-terracotta-rose/20">
        <p className="text-vintage-sm text-terracotta-rose font-varela font-semibold mb-1 flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Deletion Reason:
        </p>
        <p className="text-vintage-base text-deep-brown/80 font-varela">
          {request.reason}
        </p>
      </div>

      {request.admin_notes && (
        <div className="mt-3 p-3 bg-terracotta-orange/10 rounded-lg border border-terracotta-orange/20">
          <p className="text-vintage-sm text-terracotta-orange font-varela font-semibold mb-1">
            Admin Notes:
          </p>
          <p className="text-vintage-base text-deep-brown/80 font-varela">
            {request.admin_notes}
          </p>
          {request.reviewed_by && (
            <p className="text-vintage-xs text-ash-brown/60 mt-1">
              Reviewed by: {request.reviewed_by.username}
            </p>
          )}
        </div>
      )}

      {request.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => openReviewDialog(request, 'approved')}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-varela font-semibold hover:shadow-lg transition-all"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve & Deactivate
          </Button>
          <Button
            onClick={() => openReviewDialog(request, 'rejected')}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-varela font-semibold hover:shadow-lg transition-all"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div>
        <h3 className="text-vintage-2xl font-libre font-bold text-deep-brown mb-4 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
          Pending Deletion Requests
          {pendingRequests.length > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50">
              {pendingRequests.length}
            </Badge>
          )}
        </h3>
        {pendingRequests.length === 0 ? (
          <p className="text-vintage-base text-ash-brown/60 italic">
            No pending hotel deletion requests
          </p>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>

      {/* Approved Requests */}
      <div>
        <h3 className="text-vintage-2xl font-libre font-bold text-deep-brown mb-4 flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          Approved Requests
          {approvedRequests.length > 0 && (
            <Badge className="bg-green-500/20 text-green-700 border-green-500/50">
              {approvedRequests.length}
            </Badge>
          )}
        </h3>
        {approvedRequests.length === 0 ? (
          <p className="text-vintage-base text-ash-brown/60 italic">
            No approved hotel deletion requests
          </p>
        ) : (
          <div className="grid gap-4">
            {approvedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>

      {/* Rejected Requests */}
      <div>
        <h3 className="text-vintage-2xl font-libre font-bold text-deep-brown mb-4 flex items-center gap-2">
          <XCircle className="h-6 w-6 text-red-600" />
          Rejected Requests
          {rejectedRequests.length > 0 && (
            <Badge className="bg-red-500/20 text-red-700 border-red-500/50">
              {rejectedRequests.length}
            </Badge>
          )}
        </h3>
        {rejectedRequests.length === 0 ? (
          <p className="text-vintage-base text-ash-brown/60 italic">
            No rejected hotel deletion requests
          </p>
        ) : (
          <div className="grid gap-4">
            {rejectedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-creamy-yellow border-terracotta-rose/30">
          <DialogHeader>
            <DialogTitle className="text-vintage-2xl font-libre text-deep-brown">
              {reviewStatus === 'approved' ? 'Approve Deletion Request' : 'Reject Deletion Request'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-terracotta-rose/10 rounded-lg border border-terracotta-rose/20">
                <h4 className="font-libre font-semibold text-deep-brown mb-2">
                  {selectedRequest.hotel?.name}
                </h4>
                <p className="text-vintage-sm text-ash-brown mb-2">
                  {selectedRequest.hotel?.address}, {selectedRequest.hotel?.city}
                </p>
                <p className="text-vintage-sm text-deep-brown/80">
                  <span className="font-semibold">Reason:</span> {selectedRequest.reason}
                </p>
              </div>

              {reviewStatus === 'approved' && (
                <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-vintage-sm text-yellow-800">
                    ⚠️ Approving this request will deactivate the hotel. It will no longer appear in search results.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-vintage-sm font-varela text-deep-brown mb-2">
                  Admin Notes {reviewStatus === 'rejected' && '(Required for rejection)'}
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="min-h-[100px] bg-creamy-white border-terracotta-rose/30 text-deep-brown"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              className="text-deep-brown border-terracotta-rose/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={submitting || (reviewStatus === 'rejected' && !adminNotes.trim())}
              className={`${
                reviewStatus === 'approved'
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              } text-white font-varela font-semibold`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewStatus === 'approved' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Deactivate
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
