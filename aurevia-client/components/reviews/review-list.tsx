"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp, CheckCircle, Calendar, Bed } from "lucide-react"
import { Review } from "@/types/review"
import { format } from "date-fns"

interface ReviewListProps {
  reviews: Review[]
  showHotelName?: boolean
}

export default function ReviewList({ reviews, showHotelName = false }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ash-brown font-varela text-lg">No reviews yet. Be the first to review!</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch {
      return dateString
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-terracotta-rose text-terracotta-rose"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="bg-creamy-white border-terracotta-rose/20">
          <CardContent className="p-6 pt-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-terracotta-rose to-ash-brown flex items-center justify-center text-creamy-white font-libre font-bold">
                    {review.user?.first_name?.[0] || review.user?.last_name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="font-libre font-semibold text-deep-brown">
                      {`${review.user?.first_name} ${review.user?.last_name}` || "Anonymous"}
                    </p>
                    <p className="text-sm text-ash-brown/60 font-varela">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                  {review.is_verified_stay && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified Stay
                    </Badge>
                  )}
                </div>
                
                {showHotelName && review.hotel && (
                  <p className="text-sm text-ash-brown font-varela mb-2">
                    Review for <span className="font-semibold">{review.hotel.name}</span>
                  </p>
                )}
                
                {/* Stay Information */}
                {review.booking && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {review.booking.check_in_date && review.booking.check_out_date && (
                      <div className="flex items-center gap-1.5 text-sm text-ash-brown/70">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="font-varela">
                          Stay at: {formatDate(review.booking.check_in_date)}
                        </span>
                      </div>
                    )}
                    {review.booking.room && (
                      <div className="flex items-center gap-1.5 text-sm text-ash-brown/70">
                        <Bed className="h-3.5 w-3.5" />
                        <span className="font-varela">
                          {review.booking.room.room_type}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-right">
                {renderStars(review.rating)}
                <p className="text-sm text-ash-brown font-libre font-bold mt-1">
                  {review.rating}.0
                </p>
              </div>
            </div>

            {/* Title */}
            {review.title && (
              <h4 className="font-fraunces font-bold text-deep-brown text-lg mb-2">
                {review.title}
              </h4>
            )}

            {/* Comment */}
            {review.comment && (
              <p className="text-ash-brown font-varela leading-relaxed mb-4">
                {review.comment}
              </p>
            )}

            {/* Category Ratings */}
            {(review.cleanliness_rating || review.location_rating || review.service_rating || review.value_rating) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-terracotta-rose/10">
                {review.cleanliness_rating && (
                  <div>
                    <p className="text-xs text-ash-brown/60 font-varela mb-1">Cleanliness</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-terracotta-rose text-terracotta-rose" />
                      <span className="text-sm font-libre font-semibold text-deep-brown">
                        {review.cleanliness_rating}.0
                      </span>
                    </div>
                  </div>
                )}
                {review.location_rating && (
                  <div>
                    <p className="text-xs text-ash-brown/60 font-varela mb-1">Location</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-terracotta-rose text-terracotta-rose" />
                      <span className="text-sm font-libre font-semibold text-deep-brown">
                        {review.location_rating}.0
                      </span>
                    </div>
                  </div>
                )}
                {review.service_rating && (
                  <div>
                    <p className="text-xs text-ash-brown/60 font-varela mb-1">Service</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-terracotta-rose text-terracotta-rose" />
                      <span className="text-sm font-libre font-semibold text-deep-brown">
                        {review.service_rating}.0
                      </span>
                    </div>
                  </div>
                )}
                {review.value_rating && (
                  <div>
                    <p className="text-xs text-ash-brown/60 font-varela mb-1">Value</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-terracotta-rose text-terracotta-rose" />
                      <span className="text-sm font-libre font-semibold text-deep-brown">
                        {review.value_rating}.0
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Helpful Votes */}
            {review.total_votes > 0 && (
              <div className="flex items-center gap-2 text-sm text-ash-brown/60 font-varela">
                <ThumbsUp className="h-4 w-4" />
                <span>
                  {review.helpful_votes} of {review.total_votes} found this helpful
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
