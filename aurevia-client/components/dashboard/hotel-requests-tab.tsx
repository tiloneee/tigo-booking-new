"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Hotel, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  Building2,
  FileText
} from "lucide-react"
import { hotelRequestApi, type HotelRequest } from "@/lib/api/hotel-requests"
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

interface HotelRequestsTabProps {
  requests: HotelRequest[]
  onRefresh: () => void
}

export default function HotelRequestsTab({ requests, onRefresh }: HotelRequestsTabProps) {
  const [selectedRequest, setSelectedRequest] = useState<HotelRequest | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  const handleReviewClick = (request: HotelRequest, action: 'approved' | 'rejected') => {
    setSelectedRequest(request)
    setReviewAction(action)
    setAdminNotes("")
    setIsReviewDialogOpen(true)
  }

  const handleReviewSubmit = async () => {
    if (!selectedRequest || !reviewAction) return

    setIsSubmitting(true)
    try {
      await hotelRequestApi.reviewHotelRequest(
        selectedRequest.id,
        reviewAction,
        adminNotes || undefined
      )

      toast.success(
        reviewAction === 'approved'
          ? `Hotel request approved! Hotel "${selectedRequest.name}" has been created.`
          : `Hotel request rejected.`
      )

      setIsReviewDialogOpen(false)
      setSelectedRequest(null)
      setReviewAction(null)
      setAdminNotes("")
      onRefresh()
    } catch (error: any) {
      console.error('Failed to review hotel request:', error)
      toast.error(error.response?.data?.message || 'Failed to review hotel request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-800/40 text-yellow-300 border-yellow-400/60 pt-0.5">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-800/40 text-green-300 border-green-400/60 pt-0.5">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-800/40 text-red-300 border-red-400/60 pt-0.5">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
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

  const RequestCard = ({ request }: { request: HotelRequest }) => (
    <Card className="bg-gradient-to-br from-dark-brown/90 to-deep-brown backdrop-blur-sm border-terracotta-rose/30 hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-vintage-xl font-libre text-creamy-yellow mb-2 flex items-center gap-2">
              <Hotel className="h-5 w-5 text-terracotta-rose" />
              {request.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2 font-varela">
              {getStatusBadge(request.status)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-vintage-sm text-terracotta-rose font-varela">
            <FileText className="h-4 w-4" />
            Description
          </div>
          <p className="text-vintage-sm text-creamy-yellow/80 font-varela line-clamp-2">
            {request.description}
          </p>
        </div>

        {/* Address */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-vintage-sm text-terracotta-rose font-varela">
            <MapPin className="h-4 w-4" />
            Location
          </div>
          <p className="text-vintage-sm text-creamy-yellow/80 font-varela">
            {request.address}, {request.city}, {request.state} {request.zip_code}, {request.country}
          </p>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-terracotta-rose" />
          <span className="text-vintage-sm text-creamy-yellow/80 font-varela">
            {request.phone_number}
          </span>
        </div>

        {/* Requester */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-terracotta-rose" />
          <span className="text-vintage-sm text-creamy-yellow/80 font-varela">
            Requested by: {request.requested_by?.username || request.requested_by?.email || 'Unknown'}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-terracotta-rose" />
          <span className="text-vintage-sm text-creamy-yellow/80 font-varela">
            {formatDate(request.created_at)}
          </span>
        </div>

        {/* Admin Notes (if reviewed) */}
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

        {/* Reviewed By */}
        {request.reviewed_by && (
          <div className="flex items-center gap-2 text-vintage-sm text-creamy-yellow/60 font-varela">
            <User className="h-3 w-3" />
            Reviewed by: {request.reviewed_by.username || request.reviewed_by.email}
          </div>
        )}

        {/* Created Hotel Link */}
        {request.created_hotel_id && (
          <div className="flex items-center gap-2 pt-2 border-t border-terracotta-rose/30">
            <Building2 className="h-4 w-4 text-green-500" />
            <span className="text-vintage-sm text-green-400 font-varela">
              Hotel created successfully (ID: {request.created_hotel_id.substring(0, 8)}...)
            </span>
          </div>
        )}

        {/* Action Buttons (only for pending requests) */}
        {request.status === 'pending' && (
          <div className="flex gap-3 pt-4 border-t border-terracotta-rose/30">
            <Button
              onClick={() => handleReviewClick(request, 'approved')}
              className="flex-1 bg-gradient-to-r from-green-500/70 to-green-600/80 text-white border-green-500/30 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => handleReviewClick(request, 'rejected')}
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
          <Hotel className="h-16 w-16 text-terracotta-rose/60 mx-auto mb-4" />
          <h3 className="text-vintage-xl font-libre text-creamy-yellow mb-2">
            No Hotel Requests
          </h3>
          <p className="text-vintage-base text-creamy-yellow/60 font-varela">
            There are no hotel requests to display.
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

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <div>
          <h2 className="text-vintage-2xl font-libre text-deep-brown mb-4 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Approved Requests ({approvedRequests.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {approvedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div>
          <h2 className="text-vintage-2xl font-libre text-deep-brown mb-4 flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-600" />
            Rejected Requests ({rejectedRequests.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rejectedRequests.map((request) => (
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
              {reviewAction === 'approved' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Approve Hotel Request
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  Reject Hotel Request
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-creamy-yellow/80 font-varela">
              {reviewAction === 'approved' 
                ? `Are you sure you want to approve "${selectedRequest?.name}"? This will create a new hotel in the system.`
                : `Are you sure you want to reject "${selectedRequest?.name}"?`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Hotel Details Summary */}
            <div className="bg-dark-brown/50 rounded-lg p-4 space-y-2 text-vintage-sm font-varela">
              <div className="flex items-start gap-2">
                <Hotel className="h-4 w-4 text-terracotta-rose mt-0.5" />
                <div>
                  <span className="text-terracotta-rose">Name:</span>
                  <span className="text-creamy-yellow/90 ml-2">{selectedRequest?.name}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-terracotta-rose mt-0.5" />
                <div>
                  <span className="text-terracotta-rose">Location:</span>
                  <span className="text-creamy-yellow/90 ml-2">
                    {selectedRequest?.city}, {selectedRequest?.state}, {selectedRequest?.country}
                  </span>
                </div>
              </div>
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
                reviewAction === 'approved'
                  ? "bg-gradient-to-r from-green-500/70 to-green-600/80 text-white font-varela border-green-500/30 hover:shadow-lg hover:shadow-green-500/30"
                  : "bg-gradient-to-r from-red-500/70 to-red-600/80 text-white font-varela border-red-500/30 hover:shadow-lg hover:shadow-red-500/30"
              }
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </span>
              ) : reviewAction === 'approved' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Create Hotel
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
