"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, CheckCircle, XCircle, User, Calendar, Clock, FileText } from "lucide-react"
import { balanceRequestsApi } from "@/lib/api/dashboard"
import { Transaction } from "@/lib/api/balance"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface BalanceRequestsTabProps {
  requests: Transaction[]
  accessToken: string
  onRefresh: () => void
  onUpdateRequest: (requestId: string, updatedRequest: Transaction) => void
}

export default function BalanceRequestsTab({ 
  requests, 
  accessToken,
  onRefresh,
  onUpdateRequest
}: BalanceRequestsTabProps) {
  const [selectedRequest, setSelectedRequest] = useState<Transaction | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'success' | 'failed' | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const successRequests = requests.filter(r => r.status === 'success')
  const failedRequests = requests.filter(r => r.status === 'failed')

  const handleReviewClick = (request: Transaction, action: 'success' | 'failed') => {
    setSelectedRequest(request)
    setReviewAction(action)
    setAdminNotes("")
    setIsReviewDialogOpen(true)
  }

  const handleReviewSubmit = async () => {
    if (!selectedRequest || !reviewAction) return

    setIsSubmitting(true)
    try {
      const updatedRequest = await balanceRequestsApi.processTopup(selectedRequest.id, {
        status: reviewAction,
        admin_notes: adminNotes || undefined
      })

      toast.success(
        reviewAction === 'success'
          ? `Balance request approved! $${Number(selectedRequest.amount).toFixed(2)} has been added to the user's balance.`
          : `Balance request rejected.`
      )

      // Update the specific request in the list
      onUpdateRequest(selectedRequest.id, updatedRequest)
      
      setIsReviewDialogOpen(false)
      setSelectedRequest(null)
      setReviewAction(null)
      setAdminNotes("")
    } catch (error: any) {
      console.error('Failed to process balance request:', error)
      toast.error(error.response?.data?.message || 'Failed to process balance request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Badge className="bg-yellow-800/40 text-yellow-300 border-yellow-400/60 pt-0.5">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'success':
        return (
          <Badge className="bg-green-800/40 text-green-300 border-green-400/60 pt-0.5">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-800/40 text-red-300 border-red-400/60 pt-0.5">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const RequestCard = ({ request }: { request: Transaction }) => (
    <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-vintage-xl font-libre text-creamy-yellow mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-terracotta-rose" />
              ${Number(request.amount).toFixed(2)}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2 font-varela">
              {getStatusBadge(request.status)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        {request.user && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-vintage-sm text-terracotta-rose font-varela">
              <User className="h-4 w-4" />
              Requested By
            </div>
            <p className="text-vintage-sm text-creamy-yellow/80 font-varela">
              {request.user.first_name} {request.user.last_name}
            </p>
            <p className="text-vintage-xs text-creamy-yellow/60 font-varela">
              {request.user.email}
            </p>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-terracotta-rose" />
          <span className="text-vintage-sm text-creamy-yellow/80 font-varela">
            {formatDate(request.created_at)}
          </span>
        </div>

        {/* Processor Info */}
        {request.processor && (
          <div className="flex items-center gap-2 text-vintage-sm text-creamy-yellow/60 font-varela">
            <User className="h-3 w-3" />
            Processed by: {request.processor.first_name} {request.processor.last_name}
          </div>
        )}

        {/* Admin Notes (if exists) */}
        {request.admin_notes && (
          <div className="space-y-1 pt-2 border-t border-terracotta-rose/30">
            <div className="text-vintage-sm text-terracotta-rose font-varela font-semibold">
              Admin Notes:
            </div>
            <p className="text-vintage-sm text-creamy-yellow/80 font-varela italic">
              {request.admin_notes}
            </p>
          </div>
        )}

        {/* Action Buttons (only for pending requests) */}
        {request.status === 'pending' && (
          <div className="flex gap-3 pt-4 border-t border-terracotta-rose/30">
            <Button
              onClick={() => handleReviewClick(request, 'success')}
              className="flex-1 bg-gradient-to-r from-green-500/70 to-green-600/80 text-white border-green-500/30 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => handleReviewClick(request, 'failed')}
              className="flex-1 bg-gradient-to-r from-red-500/70 to-red-600/80 text-white border-red-500/30 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (requests.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30">
        <CardContent className="py-12 text-center">
          <DollarSign className="h-16 w-16 text-terracotta-rose/60 mx-auto mb-4" />
          <h3 className="text-vintage-xl font-libre text-creamy-yellow mb-2">
            No Balance Requests
          </h3>
          <p className="text-vintage-base text-creamy-yellow/60 font-varela">
            There are no balance requests to display.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-vintage-2xl font-libre text-deep-brown mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-yellow-600" />
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Approved (Success) Requests */}
      {successRequests.length > 0 && (
        <div>
          <h2 className="text-vintage-2xl font-libre text-deep-brown mb-4 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Approved Requests ({successRequests.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {successRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected (Failed) Requests */}
      {failedRequests.length > 0 && (
        <div>
          <h2 className="text-vintage-2xl font-libre text-deep-brown mb-4 flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-600" />
            Rejected Requests ({failedRequests.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {failedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-dark-brown to-deep-brown border-terracotta-rose/30 text-creamy-yellow">
          <DialogHeader>
            <DialogTitle className="text-vintage-2xl font-libre text-creamy-yellow flex items-center gap-2">
              {reviewAction === 'success' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Approve Balance Request
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  Reject Balance Request
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-creamy-yellow/80 font-varela">
              {reviewAction === 'success' 
                ? `Are you sure you want to approve this $${selectedRequest ? Number(selectedRequest.amount).toFixed(2) : '0.00'} balance request? This will add the amount to the user's balance.`
                : `Are you sure you want to reject this balance request?`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Request Details Summary */}
            <div className="bg-dark-brown/50 rounded-lg p-4 space-y-2 text-vintage-sm font-varela">
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-terracotta-rose mt-0.5" />
                <div>
                  <span className="text-terracotta-rose">Amount:</span>
                  <span className="text-creamy-yellow/90 ml-2">${selectedRequest ? Number(selectedRequest.amount).toFixed(2) : '0.00'}</span>
                </div>
              </div>
              {selectedRequest?.user && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-terracotta-rose mt-0.5" />
                  <div>
                    <span className="text-terracotta-rose">User:</span>
                    <span className="text-creamy-yellow/90 ml-2">
                      {selectedRequest.user.first_name} {selectedRequest.user.last_name} ({selectedRequest.user.email})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <label className="text-vintage-sm text-creamy-yellow font-varela font-medium">
                Admin Notes (Optional)
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this decision..."
                className="bg-dark-brown/80 border-terracotta-rose/30 text-creamy-yellow placeholder:text-creamy-yellow/40 focus:border-terracotta-rose font-varela min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={isSubmitting}
              className="bg-transparent border-terracotta-rose/30 text-creamy-yellow hover:bg-terracotta-rose/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={isSubmitting}
              className={
                reviewAction === 'success'
                  ? "bg-gradient-to-r from-green-500/70 to-green-600/80 text-white font-varela border-green-500/30 hover:shadow-lg hover:shadow-green-500/30"
                  : "bg-gradient-to-r from-red-500/70 to-red-600/80 text-white font-varela border-red-500/30 hover:shadow-lg hover:shadow-red-500/30"
              }
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </span>
              ) : reviewAction === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Add Balance
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
